/**
 * Progress sync.
 *
 * Sends a small summary of one learner's progress to a teacher-owned
 * Google Sheet, via a Google Apps Script web app acting as the backend
 * (see teacher/apps-script.gs). Entirely optional: with config.js left
 * blank this module does nothing and the lab behaves exactly as the
 * main README describes — local-only, no accounts, no network calls.
 *
 * Sent as text/plain rather than application/json on purpose: a JSON
 * content-type would trigger a CORS preflight (an OPTIONS request),
 * which Apps Script web apps do not answer, so the request would
 * silently fail. text/plain keeps it a "simple request" that skips the
 * preflight; the script parses the body as JSON on its side.
 *
 * A sync failure — offline, wrong URL, script not deployed — must never
 * interrupt the lesson. localStorage is still the authoritative record;
 * this is a best-effort mirror of it.
 */
import { on } from './bus.js';
import { getState } from './store.js';
import { overallProgress } from '../data/missions/index.js';
import { SHEET_WEBHOOK_URL } from '../config.js';

const DEBOUNCE_MS = 4000;   // wait for a pause in activity...
const MAX_WAIT_MS = 20000;  // ...but never let it be silent longer than this

let debounceTimer = null;
let maxWaitTimer = null;

export function initSync() {
  if (!SHEET_WEBHOOK_URL) return;   // teacher hasn't set one up — stay local-only

  on('store:changed', schedule);
  schedule();

  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

function schedule() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flush, DEBOUNCE_MS);
  if (!maxWaitTimer) maxWaitTimer = setTimeout(flush, MAX_WAIT_MS);
}

function flush() {
  clearTimeout(debounceTimer); debounceTimer = null;
  clearTimeout(maxWaitTimer); maxWaitTimer = null;

  const state = getState();
  const name = (state.learner.name || '').trim();
  if (!name) return;   // name gate hasn't resolved yet — nothing to attribute this to

  send(buildPayload(state, name));
}

function buildPayload(state, name) {
  const overall = overallProgress(state);

  const missions = {};
  for (const [id, m] of Object.entries(state.missions)) {
    missions[id] = {
      started: Boolean(m.started),
      completed: Boolean(m.completed),
      tasksDone: Object.keys(m.tasks || {}).length,
    };
  }

  return {
    name,
    updatedAt: Date.now(),
    overallPct: overall.pct,
    overallDone: overall.done,
    overallTotal: overall.total,
    missions,
    stats: state.stats,
    badges: Object.keys(state.badges || {}).length,
  };
}

function send(payload) {
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const queued = navigator.sendBeacon(
        SHEET_WEBHOOK_URL,
        new Blob([body], { type: 'text/plain;charset=utf-8' }),
      );
      if (queued) return;
    }
  } catch {
    // fall through to fetch
  }

  try {
    fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    }).catch(() => {});
  } catch {
    // a failed sync must never interrupt the lesson
  }
}
