/**
 * Variable / memory inspector.
 *
 * Mission 01 does not create variables, so this renders an explanatory
 * empty state there. It exists now because the *runtime already returns a
 * snapshot of every name in the program's namespace after each run* —
 * Mission 02 ("Variable Control") only has to render it, not invent it.
 */
import { h, clear } from '../../core/dom.js';

export function createMemory({ emptyText = 'No variables yet — this program does not store anything.' } = {}) {
  const grid = h('div.mem');
  const root = h('div.card', null, [
    h('div.eyebrow', null, 'Memory'),
    h('div', { style: { marginTop: 'var(--sp-3)' } }, [grid]),
  ]);

  let previous = new Map();

  function update(vars = []) {
    clear(grid);
    if (!vars.length) {
      grid.appendChild(h('p.mem__empty', null, emptyText));
      previous = new Map();
      return;
    }
    const next = new Map();
    for (const v of vars) {
      next.set(v.name, v.value);
      const changed = previous.has(v.name) && previous.get(v.name) !== v.value;
      grid.appendChild(h('div.mem__cell', { dataset: { changed: changed ? '1' : '0' } }, [
        h('div.mem__name', null, v.name),
        h('div.mem__val', null, v.value),
        h('div.mem__type', null, v.type),
      ]));
    }
    previous = next;
  }

  update([]);
  return { el: root, update };
}
