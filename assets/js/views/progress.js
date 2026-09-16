import { h } from '../core/dom.js';
import { getState } from '../core/store.js';
import { MISSIONS, overallProgress, missionState } from '../data/missions/index.js';

export function progress(_params, outlet) {
  const state = getState();
  const p = overallProgress(state);
  const s = state.stats;

  outlet.appendChild(h('div.wrap', null, [
    h('div.eyebrow', null, 'Your record'),
    h('h1', { style: { marginTop: 'var(--sp-2)' } }, 'Progress'),

    h('div.card', { style: { marginTop: 'var(--sp-5)' } }, [
      h('div.row.row--between', null, [
        h('span.eyebrow', null, 'Published missions'),
        h('span.status-line', null, `${p.done} / ${p.total} tasks`),
      ]),
      h('div.loadblocks', { style: { marginTop: 'var(--sp-3)', color: 'var(--accent)' } },
        '█'.repeat(Math.round(p.pct / 100 * 16)) + '░'.repeat(16 - Math.round(p.pct / 100 * 16)) + `  ${p.pct}%`),
    ]),

    h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginTop: 'var(--sp-4)' } }, [
      statCard(String(s.runs), 'programs run'),
      statCard(String(s.errors), 'errors met'),
      statCard(String(s.hintsUsed), 'hints opened'),
      statCard(String(Object.keys(state.badges).length), 'badges earned'),
    ]),

    h('h2', { style: { marginTop: 'var(--sp-6)' } }, 'Mission by mission'),
    h('div.grid', { style: { marginTop: 'var(--sp-4)' } }, MISSIONS.map((m) => {
      const saved = state.missions[m.id];
      const done = m.tasks.filter((t) => saved?.tasks[t.id]).length;
      const pct = m.tasks.length ? Math.round(done / m.tasks.length * 100) : 0;
      const st = missionState(m, state);
      return h('div.card', null, [
        h('div.row.row--between', null, [
          h('div', null, [
            h('div.mcard__num', null, m.code),
            h('h3', { style: { marginTop: '2px' } }, m.name),
          ]),
          h('span.chip' + (st === 'complete' ? '.chip--ok' : st === 'locked' ? '' : '.chip--info'), null,
            st === 'locked' ? 'planned' : `${done}/${m.tasks.length}`),
        ]),
        st === 'locked' ? null : h('div.bar', { style: { marginTop: 'var(--sp-3)' } }, [h('div.bar__fill', { style: { width: `${pct}%` } })]),
        st === 'locked' ? null : h('div.faint', { style: { marginTop: 'var(--sp-2)' } },
          saved?.completed ? `Completed ${new Date(saved.completed).toLocaleDateString()}` : (saved?.started ? 'In progress' : 'Not started')),
      ]);
    })),
  ]));
}

function statCard(value, label) {
  return h('div.card', null, [
    h('div', { style: { fontFamily: 'var(--mono)', fontSize: 'var(--fs-xl)' } }, value),
    h('div.faint', null, label),
  ]);
}
