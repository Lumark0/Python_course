import { h } from '../core/dom.js';
import { getState } from '../core/store.js';
import { BADGES } from '../engine/badges.js';

export function achievements(_params, outlet) {
  const state = getState();
  const earned = Object.keys(state.badges).length;

  outlet.appendChild(h('div.wrap', null, [
    h('div.eyebrow', null, `${earned} of ${BADGES.length} earned`),
    h('h1', { style: { marginTop: 'var(--sp-2)' } }, 'Achievements'),
    h('p.lede', { style: { marginTop: 'var(--sp-2)', maxWidth: '60ch' } },
      'Most of these are for behaviour rather than completion. Meeting your first error matters more than clicking Continue.'),
    h('div.badges', { style: { marginTop: 'var(--sp-5)' } }, BADGES.map((b) => {
      const at = state.badges[b.id];
      return h('div.badge', { dataset: { earned: at ? '1' : '0' } }, [
        h('div.badge__ico', { 'aria-hidden': 'true' }, b.icon),
        h('div.badge__name', null, b.name),
        h('div.badge__desc', null, b.desc),
        at ? h('div.chip.chip--ok', null, new Date(at).toLocaleDateString()) : h('span.faint', null, 'locked'),
      ]);
    })),
  ]));
}
