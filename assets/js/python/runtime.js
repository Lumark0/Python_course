/**
 * Front-end facade for the Python engine.
 *
 * The rest of the app never talks to the worker directly — it calls
 * `runtime.run(code)` and listens on the bus. That keeps the door open
 * for swapping the backend later without touching a single activity.
 */
import { emit } from '../core/bus.js';

/* Pinned so a CDN release can never change behaviour underneath a learner
   mid-lesson. Two sources are listed: jsDelivr's npm mirror (guaranteed to
   exist for any published version) and Pyodide's own dist path. The worker
   tries them in order, so one CDN hiccup does not close the lab.

   Override for local, offline or air-gapped use with `?pyodide=<url>` or
   the localStorage key `ptl.pyodideURL` — see tools/ and the README. */
export const PYODIDE_VERSION = '314.0.7';

const CDN_SOURCES = [
  `https://cdn.jsdelivr.net/npm/pyodide@${PYODIDE_VERSION}/`,
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
];

const slash = (url) => (url.endsWith('/') ? url : url + '/');

function resolveSources() {
  const fromQuery = new URLSearchParams(location.search).get('pyodide');
  if (fromQuery) return [slash(fromQuery)];
  try {
    const saved = localStorage.getItem('ptl.pyodideURL');
    if (saved) return [slash(saved)];
  } catch { /* storage may be unavailable */ }
  return CDN_SOURCES;
}

const state = {
  status: 'idle',          // idle | loading | ready | running | error
  stage: null,
  progress: 0,
  message: '',
  version: null,
  python: null,
  error: null,
  sources: resolveSources(),
  indexURL: resolveSources()[0],
};

let worker = null;
let runSeq = 0;
let pending = null;        // { runId, resolve, io[], startedAt, watchdog }
let readyWaiters = [];

export function getStatus() { return { ...state }; }
export function isReady() { return state.status === 'ready' || state.status === 'running'; }
export function isBusy() { return state.status === 'running'; }

function setStatus(patch) {
  Object.assign(state, patch);
  emit('python:status', getStatus());
}

function spawn() {
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module', name: 'python-engine' });
  worker.onmessage = onMessage;
  worker.onerror = (e) => {
    setStatus({ status: 'error', error: e.message || 'Worker failed to start' });
    emit('python:error', state.error);
  };
  worker.postMessage({ type: 'init', sources: state.sources });
}

/** Begin loading Python. Safe to call repeatedly; only the first starts work. */
export function boot() {
  if (worker) return;
  setStatus({ status: 'loading', progress: 0.02, message: 'Contacting the Python engine' });
  spawn();
}

/** Resolves once the interpreter can accept code. */
export function whenReady() {
  if (isReady()) return Promise.resolve(getStatus());
  boot();
  return new Promise((resolve, reject) => { readyWaiters.push({ resolve, reject }); });
}

function onMessage(event) {
  const msg = event.data || {};
  switch (msg.type) {
    case 'status':
      setStatus({ status: 'loading', stage: msg.stage, progress: msg.progress, message: msg.message });
      break;

    case 'ready': {
      setStatus({
        status: 'ready', progress: 1, version: msg.version, python: msg.python,
        error: null, message: 'Python ready',
        indexURL: msg.indexURL || state.indexURL,
      });
      const waiters = readyWaiters; readyWaiters = [];
      waiters.forEach((w) => w.resolve(getStatus()));
      emit('python:ready', getStatus());
      break;
    }

    case 'io':
      if (pending) {
        pending.io.push({ kind: msg.kind, text: msg.text });
        emit('python:io', { runId: pending.runId, kind: msg.kind, text: msg.text });
      }
      break;

    case 'run:start':
      emit('python:runstart', { runId: msg.runId });
      break;

    case 'result': {
      if (!pending || pending.runId !== msg.runId) break;
      clearTimeout(pending.watchdog);
      const result = buildResult(msg, pending.io);
      const done = pending; pending = null;
      setStatus({ status: 'ready' });
      emit('python:result', result);
      done.resolve(result);
      break;
    }

    case 'fatal': {
      setStatus({ status: 'error', error: msg.message, message: 'Python engine unavailable' });
      const waiters = readyWaiters; readyWaiters = [];
      waiters.forEach((w) => w.reject(new Error(msg.message)));
      emit('python:error', msg.message);
      if (pending) { const p = pending; pending = null; p.resolve(buildResult({ ok: false, error: { type: 'EngineError', message: msg.message, formatted: msg.message } }, p.io)); }
      break;
    }
    default: break;
  }
}

function buildResult(msg, io) {
  const stdout = io.filter((c) => c.kind === 'stdout').map((c) => c.text).join('');
  const stderr = io.filter((c) => c.kind === 'stderr').map((c) => c.text).join('');
  return {
    runId: msg.runId,
    ok: Boolean(msg.ok),
    stdout,
    stderr,
    lines: stdout.length ? stdout.replace(/\n$/, '').split('\n') : [],
    error: msg.error || null,
    vars: msg.vars || [],
    ms: msg.ms ?? 0,
    chunks: io,
  };
}

/**
 * Execute Python. Always resolves — a crashed program is a *result*,
 * not an exception, because for a learner an error is information.
 * @param {string} code
 * @param {{stdin?: string[], timeoutMs?: number}} [options]
 */
export async function run(code, options = {}) {
  await whenReady();
  if (pending) throw new Error('A program is already running.');

  const runId = ++runSeq;
  setStatus({ status: 'running' });

  return new Promise((resolve) => {
    pending = { runId, resolve, io: [], startedAt: Date.now(), watchdog: null };
    // If a program runs away, tell the UI so it can offer STOP.
    pending.watchdog = setTimeout(() => {
      if (pending && pending.runId === runId) emit('python:longrun', { runId });
    }, options.timeoutMs ?? 4000);

    worker.postMessage({ type: 'run', runId, code, stdin: options.stdin || [] });
  });
}

/**
 * Hard-stop a running program. The only reliable way to interrupt
 * WebAssembly CPython without SharedArrayBuffer (which GitHub Pages
 * cannot enable) is to destroy the worker, so the engine reboots after.
 */
export function stop() {
  if (!worker) return false;
  const wasRunning = Boolean(pending);
  worker.terminate();
  worker = null;

  if (pending) {
    const p = pending; pending = null;
    clearTimeout(p.watchdog);
    p.resolve(buildResult({
      runId: p.runId, ok: false,
      error: { type: 'Stopped', message: 'You stopped the program.', formatted: 'Program stopped by user.' },
    }, p.io));
  }
  setStatus({ status: 'loading', progress: 0.02, message: 'Restarting Python engine' });
  spawn();
  return wasRunning;
}

export function indexURL() { return state.indexURL; }
export function sources() { return state.sources.slice(); }
