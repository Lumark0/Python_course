/**
 * The workbench: editor + run controls + terminal (+ optional pipeline
 * and memory panels). Every activity that involves running code composes
 * this instead of rebuilding it, so Run behaves identically everywhere.
 */
import { h } from '../core/dom.js';
import { on } from '../core/bus.js';
import { createEditor } from './editor.js';
import { createTerminal } from './terminal.js';
import { createPipeline } from './viz/pipeline.js';
import { createMemory } from './viz/memory.js';
import * as runtime from '../python/runtime.js';
import { bumpStat } from '../core/store.js';

export function createWorkbench(options = {}) {
  const {
    code = '',
    filename = 'program.py',
    readonly = false,
    showPipeline = false,
    showMemory = false,
    runLabel = 'Run',
    terminalTitle = 'output — python 3',
    onResult = () => {},
    onChange = () => {},
    extraControls = [],
    stdin = [],
  } = options;

  const editor = createEditor({
    value: code, filename, readonly,
    onChange: (v) => onChange(v),
    onRun: () => doRun(),
  });

  const terminal = createTerminal({ title: terminalTitle });
  const pipeline = showPipeline ? createPipeline() : null;
  const memory = showMemory ? createMemory() : null;

  const runBtn = h('button.btn.btn--primary', { type: 'button', onclick: () => doRun() }, [
    h('span', { 'aria-hidden': 'true' }, '▶'), h('span', null, runLabel),
    h('span.btn__key', { 'aria-hidden': 'true' }, 'Ctrl↵'),
  ]);
  const stopBtn = h('button.btn.btn--danger', { type: 'button', hidden: true, onclick: () => runtime.stop() }, '■ Stop');
  const status = h('span.runbar__hintcount', { 'aria-live': 'polite' });

  const runbar = h('div.runbar', null, [runBtn, stopBtn, ...extraControls, h('span.spacer'), status]);

  const root = h('div.stack', null, [
    editor.el,
    runbar,
    pipeline ? pipeline.el : null,
    terminal.el,
    memory ? memory.el : null,
  ]);

  let lastResult = null;
  let running = false;

  function syncEngine(s) {
    if (running) return;
    if (s.status === 'ready') {
      runBtn.disabled = false;
      runBtn.querySelector('span:nth-child(2)').textContent = runLabel;
      status.textContent = '';
    } else if (s.status === 'error') {
      runBtn.disabled = true;
      status.textContent = 'Python engine unavailable';
    } else if (s.status === 'loading') {
      runBtn.disabled = true;
      status.textContent = `Python engine ${Math.round((s.progress || 0) * 100)}%`;
    }
  }

  const unsubs = [
    on('python:status', syncEngine),
    on('python:longrun', () => { if (running) { stopBtn.hidden = false; status.textContent = 'Still running — this may be an endless loop.'; } }),
  ];
  syncEngine(runtime.getStatus());

  async function doRun({ echoCommand = true } = {}) {
    if (running || editor.value.trim() === '') {
      if (!running) status.textContent = 'Write some code first.';
      return null;
    }
    running = true;
    runBtn.disabled = true;
    status.textContent = 'Running…';
    terminal.busy();
    editor.setError(null);

    const source = editor.value;
    let result;
    try {
      result = await runtime.run(source, { stdin });
    } catch (err) {
      running = false; runBtn.disabled = false; stopBtn.hidden = true;
      status.textContent = String(err.message || err);
      return null;
    }

    running = false;
    stopBtn.hidden = true;
    runBtn.disabled = false;
    status.textContent = '';

    lastResult = result;
    bumpStat('runs');
    if (!result.ok) bumpStat('errors');

    terminal.showResult(result, { command: `python ${filename}`, echoCommand });
    if (result.error?.line) editor.setError(result.error.line);
    if (memory) memory.update(result.vars);
    if (pipeline) { pipeline.setCode(source); pipeline.play(result); }

    onResult(result, source);
    return result;
  }

  function destroy() { unsubs.forEach((f) => f()); terminal.destroy(); }

  return {
    el: root, editor, terminal, pipeline, memory,
    run: doRun, destroy,
    runbar, runButton: runBtn,
    get lastResult() { return lastResult; },
    setStatus(text) { status.textContent = text; },
  };
}
