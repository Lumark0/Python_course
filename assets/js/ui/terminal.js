/**
 * Output console.
 *
 * Also owns the Python loading experience: rather than blocking the UI
 * behind a modal spinner, the terminal itself narrates what the engine is
 * doing, so the wait is part of the lab rather than an interruption.
 */
import { h, clear, esc } from '../core/dom.js';
import { on } from '../core/bus.js';
import * as runtime from '../python/runtime.js';

const BLOCKS_TOTAL = 16;

export function createTerminal({ title = 'output — python 3', showEngine = true } = {}) {
  const out = h('pre.term__out', { tabindex: '0', role: 'log', 'aria-live': 'polite', 'aria-label': 'Program output' });
  const meta = h('span.term__meta');
  const root = h('div.term', null, [
    h('div.term__bar', null, [
      h('div.term__dots', null, [h('i'), h('i'), h('i')]),
      h('span.term__title', null, title),
      h('span.spacer'),
      meta,
    ]),
    out,
  ]);

  let unsubs = [];

  function write(text, kind = 'out') {
    if (text === '' || text == null) return;
    const span = h('span', { class: `l-${kind}` });
    span.textContent = text;
    out.appendChild(span);
    out.scrollTop = out.scrollHeight;
  }

  function line(text, kind = 'out') { write(text + '\n', kind); }

  function clearOut() { clear(out); meta.textContent = ''; }

  /** Render engine loading progress inside the console. */
  function renderLoading(status) {
    clear(out);
    const filled = Math.round((status.progress || 0) * BLOCKS_TOTAL);
    const bar = '█'.repeat(filled) + '░'.repeat(BLOCKS_TOTAL - filled);
    const wrap = h('div.term__load', null, [
      h('div.loadline', null, 'Preparing Python Lab…'),
      h('div.loadblocks', null, bar),
      h('div.loadline', null, `${status.message || 'Loading'}  ·  ${Math.round((status.progress || 0) * 100)}%`),
      h('div.loadline', { style: { color: '#4a5c78' } }, 'CPython is being downloaded and started inside this tab. First load only.'),
    ]);
    out.appendChild(wrap);
  }

  function renderEngineError(message) {
    clear(out);
    line('Python engine could not start.', 'err');
    line(String(message), 'err');
    line('', 'sys');
    line('The lab needs to download the Python runtime once. Check your', 'sys');
    line('network connection, then reload the page.', 'sys');
  }

  if (showEngine) {
    const status = runtime.getStatus();
    if (status.status === 'loading') renderLoading(status);
    else if (status.status === 'error') renderEngineError(status.error);

    unsubs.push(on('python:status', (s) => {
      if (s.status === 'loading' && out.querySelector('.term__load')) renderLoading(s);
      else if (s.status === 'loading' && !out.textContent.trim()) renderLoading(s);
    }));
    unsubs.push(on('python:ready', () => {
      if (out.querySelector('.term__load')) {
        clear(out);
        line(`Python ${runtime.getStatus().python || ''} ready. Press Run to execute your program.`, 'sys');
      }
    }));
    unsubs.push(on('python:error', (msg) => renderEngineError(msg)));
  }

  /** Print a result object from runtime.run(). */
  function showResult(result, { command = 'python program.py', echoCommand = true } = {}) {
    if (echoCommand) line(command, 'cmd');
    for (const chunk of result.chunks || []) {
      write(chunk.text, chunk.kind === 'stderr' ? 'err' : 'out');
    }
    if (!result.ok && result.error) {
      const formatted = result.error.formatted || `${result.error.type}: ${result.error.message}`;
      write(formatted + '\n', 'err');
    }
    meta.textContent = result.ms != null ? `${result.ms} ms` : '';
    if (result.ok) {
      line(`[finished in ${result.ms} ms]`, 'sys');
    }
    out.scrollTop = out.scrollHeight;
  }

  function busy(label = 'running…') {
    meta.textContent = label;
  }

  function destroy() { unsubs.forEach((fn) => fn()); unsubs = []; }

  return { el: root, write, line, clear: clearOut, showResult, busy, destroy, outEl: out, renderLoading, esc };
}
