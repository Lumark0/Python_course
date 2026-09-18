/**
 * The Inputs panel — what input() will receive, in order.
 *
 * input() cannot truly block in this app (that needs SharedArrayBuffer,
 * which needs COOP/COEP headers, which GitHub Pages cannot set — see the
 * main README's "What is not faked" section). The honest alternative used
 * here, instead of secretly scripting a fixed answer: the learner decides
 * what "gets typed", edits it freely, and input() consumes those lines in
 * order when the program runs. Too few lines for how many times the
 * program calls input() produces a genuine EOFError — not a canned one.
 */
import { h, clear } from '../core/dom.js';

export function createInputs({ initial = [''] } = {}) {
  let lines = initial.length ? [...initial] : [''];
  const list = h('div.stack-sm');

  function paint() {
    clear(list);
    lines.forEach((value, i) => {
      const field = h('input.field-input', {
        type: 'text', value,
        placeholder: `what input() call ${i + 1} receives`,
        style: { width: '100%' },
        oninput: (e) => { lines[i] = e.target.value; },
      });
      list.appendChild(h('div.row', { style: { flexWrap: 'nowrap' } }, [
        h('span.faint', { style: { minWidth: '1.5ch' } }, String(i + 1)),
        field,
        lines.length > 1
          ? h('button.btn.btn--sm.btn--ghost', {
            type: 'button', 'aria-label': `Remove line ${i + 1}`,
            onclick: () => { lines.splice(i, 1); paint(); },
          }, '✕')
          : null,
      ]));
    });
  }

  const addBtn = h('button.btn.btn--sm.btn--ghost', {
    type: 'button', style: { marginTop: 'var(--sp-3)' },
    onclick: () => { lines.push(''); paint(); },
  }, '+ Add another line');

  paint();

  const el = h('div.card', null, [
    h('div.eyebrow', null, 'Inputs — what input() will receive, in order'),
    h('p.faint', { style: { margin: 'var(--sp-2) 0 var(--sp-3)' } },
      'Each line answers one call to input(), in the order the program makes them.'),
    list,
    addBtn,
  ]);

  return {
    el,
    getLines: () => [...lines],
    setLines: (next) => { lines = next.length ? [...next] : ['']; paint(); },
  };
}
