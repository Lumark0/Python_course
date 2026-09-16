/**
 * Home — the lab entrance.
 *
 * It is a working screen, not a title card: the demo terminal on the right
 * runs real Python the moment the engine is up, so the first thing a
 * visitor sees is the thing the app actually does.
 */
import { h } from '../core/dom.js';
import { getState } from '../core/store.js';
import { overallProgress, MISSIONS, missionState } from '../data/missions/index.js';
import { createTerminal } from '../ui/terminal.js';
import { on } from '../core/bus.js';
import * as runtime from '../python/runtime.js';

export function home(_params, outlet) {
  const state = getState();
  const progress = overallProgress(state);
  const current = MISSIONS.find((m) => missionState(m, state) === 'in-progress')
    || MISSIONS.find((m) => missionState(m, state) === 'available')
    || MISSIONS[0];
  const started = Boolean(state.missions[current.id]?.started);

  const terminal = createTerminal({ title: 'lab console — live' });
  let unsub = null;
  let demoRun = false;

  async function demo() {
    if (demoRun) return;
    demoRun = true;
    terminal.clear();
    terminal.line('python welcome.py', 'cmd');
    const result = await runtime.run(
      'import sys\n'
      + 'print("Python", sys.version.split()[0], "is running in your browser.")\n'
      + 'print("Nothing was sent to a server.")\n'
      + 'print()\n'
      + 'print("Ready when you are.")',
    );
    terminal.showResult(result, { echoCommand: false });
  }

  if (runtime.isReady()) demo();
  else unsub = on('python:ready', demo);

  const el = h('div.wrap', null, [
    h('section.hero', null, [
      h('div.hero__grid', null, [
        h('div', null, [
          h('div.eyebrow', null, 'Python Training Lab'),
          h('h1.hero__title', null, [
            h('span.line2', null, 'Your journey from'),
            h('span.hero__from', null, 'FIRST LINE OF CODE'),
            h('span.hero__arrow', { 'aria-hidden': 'true' }, '↓'),
            h('span.line2', { style: { margin: '0 0 .25em' } }, 'to'),
            h('span.hero__to', null, 'PYTHON DEVELOPER'),
          ]),
          h('div.hero__cta', null, [
            h('div.row', null, [
              h('a.btn.btn--primary.btn--lg', { href: `#/mission/${current.id}` },
                started ? 'RESUME TRAINING →' : 'START TRAINING →'),
              h('a.btn.btn--lg', { href: '#/sandbox' }, 'Open sandbox'),
            ]),
            h('div', { style: { marginTop: 'var(--sp-5)', maxWidth: '360px' } }, [
              h('div.row.row--between', null, [
                h('span.eyebrow', null, 'Progress'),
                h('span.status-line', null, `${progress.pct}%  ·  ${progress.done}/${progress.total} tasks`),
              ]),
              h('div.bar', { style: { marginTop: 'var(--sp-2)' }, role: 'progressbar', 'aria-valuenow': String(progress.pct), 'aria-valuemin': '0', 'aria-valuemax': '100' }, [
                h('div.bar__fill', { style: { width: `${progress.pct}%` } }),
              ]),
            ]),
          ]),
          h('div.hero__meta', null, [
            stat(String(MISSIONS.length), 'missions planned'),
            stat('1', 'built & playable'),
            stat('real', 'CPython, in-browser'),
          ]),
        ]),
        h('div.hero__demo', null, [
          h('div.hero__demohead', null, [
            h('span.chip.chip--ok', null, 'live'),
            h('span.faint', null, 'This is not a recording. It ran when the page loaded.'),
          ]),
          terminal.el,
          h('ul.hero__facts', null, [
            fact('CPython 3.14, compiled to WebAssembly'),
            fact('Your code never leaves this browser tab'),
            fact('Works offline once the runtime is cached'),
          ]),
        ]),
      ]),
    ]),

    h('section', { style: { marginTop: 'var(--sp-7)' } }, [
      h('div.row.row--between', null, [
        h('h2', null, 'Continue where you left off'),
        h('a.btn.btn--sm.btn--ghost', { href: '#/missions' }, 'All missions →'),
      ]),
      h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', marginTop: 'var(--sp-4)' } },
        MISSIONS.slice(0, 3).map((m) => missionCard(m, state))),
    ]),
  ]);

  outlet.appendChild(el);
  return () => { if (unsub) unsub(); terminal.destroy(); };
}

function fact(text) {
  return h('li', null, [h('i', { 'aria-hidden': 'true' }, '▸'), h('span', null, text)]);
}

function stat(value, label) {
  return h('div.hero__stat', null, [h('b', null, value), h('span', null, label)]);
}

export function missionCard(mission, state) {
  const status = missionState(mission, state);
  const saved = state.missions[mission.id];
  const done = mission.tasks.filter((t) => saved?.tasks[t.id]).length;
  const label = { available: 'Start', 'in-progress': 'Resume', complete: 'Review', locked: 'In development' }[status];

  const inner = [
    h('div.mcard__num', null, mission.code),
    h('h3.mcard__name', null, mission.name),
    h('p.mcard__desc', null, mission.summary),
    h('div.mcard__foot', null, [
      status === 'locked'
        ? h('span.chip', null, 'planned')
        : h('span.chip' + (status === 'complete' ? '.chip--ok' : ''), null, `${done}/${mission.tasks.length} tasks`),
      h('span.faint', null, label + (status === 'locked' ? '' : ' →')),
    ]),
  ];

  return status === 'locked'
    ? h('div.mcard', { dataset: { state: status } }, inner)
    : h('a.mcard', { href: `#/mission/${mission.id}`, dataset: { state: status } }, inner);
}
