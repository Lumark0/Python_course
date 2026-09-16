import { h } from '../core/dom.js';
import { getState } from '../core/store.js';
import { MISSIONS, overallProgress } from '../data/missions/index.js';
import { missionCard } from './home.js';

export function missions(_params, outlet) {
  const state = getState();
  const p = overallProgress(state);

  outlet.appendChild(h('div.wrap', null, [
    h('div.eyebrow', null, 'Training programme'),
    h('h1', { style: { marginTop: 'var(--sp-2)' } }, 'Learning modules'),
    h('p.lede', { style: { marginTop: 'var(--sp-2)', maxWidth: '62ch' } },
      'Ten missions from your first printed line to a project of your own. Mission 01 is complete and playable; the rest are mapped and will unlock as they are built.'),

    h('div.card', { style: { marginTop: 'var(--sp-5)' } }, [
      h('div.row.row--between', null, [
        h('span.eyebrow', null, 'Overall progress (published missions)'),
        h('span.status-line', null, `${p.done} / ${p.total} tasks · ${p.pct}%`),
      ]),
      h('div.bar', { style: { marginTop: 'var(--sp-3)' } }, [h('div.bar__fill', { style: { width: `${p.pct}%` } })]),
    ]),

    h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))', marginTop: 'var(--sp-5)' } },
      MISSIONS.map((m) => missionCard(m, state))),
  ]));
}
