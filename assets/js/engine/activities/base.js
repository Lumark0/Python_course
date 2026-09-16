/**
 * Shared scaffolding for activities.
 *
 * Every activity receives the same `ctx` from the mission runner:
 *   scene, mission, state/save, attempts/bumpAttempt, artifact/saveArtifact,
 *   done(), next()
 * and returns `{ el, destroy? }`. Adding a new activity type means adding
 * one file and one registry entry — no changes anywhere else.
 */
import { h, rich } from '../../core/dom.js';

export function sceneHead(scene) {
  return h('div.scene__head', null, [
    scene.eyebrow ? h('div.eyebrow', null, scene.eyebrow) : null,
    h('h2.scene__title', null, scene.title),
    ...(scene.body || []).map((p) => h('p.scene__body', { html: rich(p) })),
  ]);
}

export function continueButton(ctx, label = 'Continue') {
  // Lesson data supplies its own arrow where it wants one, so the label is
  // used verbatim rather than decorated twice.
  return h('button.btn.btn--primary', {
    type: 'button', hidden: true,
    onclick: () => ctx.next(),
  }, label);
}

/** Requirement checklist rendered from validator results. */
export function requirementList(results) {
  return h('ul.reqs', null, results.map((r) => h('li', { dataset: { ok: r.pass ? '1' : '0' } }, [
    h('i', { 'aria-hidden': 'true' }, r.pass ? '✔' : '○'),
    h('span', { html: rich(r.label) + (r.detail && !r.pass ? ` <span class="faint">— ${r.detail}</span>` : '') }),
  ])));
}

/**
 * Progressive hints. The ladder never reveals the answer on its own:
 * the last rung is the answer, and the learner has to choose to open it.
 */
export function createHintLadder({ hints = [], solution = null, onUse = () => {} }) {
  let index = 0;
  const list = h('div.stack-sm');
  const btn = h('button.btn.btn--sm', { type: 'button', onclick: reveal });
  const wrap = h('div.stack-sm', null, [list, h('div.row', null, [btn])]);

  function label() {
    if (index < hints.length) return `Hint ${index + 1} of ${hints.length}`;
    if (solution && index === hints.length) return 'Show me the answer';
    return 'No hints left';
  }

  function reveal() {
    if (index < hints.length) {
      list.appendChild(h('div.fb.fb--hint', null, [
        h('div.fb__ico', { 'aria-hidden': 'true' }, '◆'),
        h('div', null, [
          h('div.fb__title', null, `Hint ${index + 1}`),
          h('div.fb__msg', { html: rich(hints[index]) }),
        ]),
      ]));
      index++;
      onUse(index);
    } else if (solution) {
      list.appendChild(h('div.fb.fb--info', null, [
        h('div.fb__ico', { 'aria-hidden': 'true' }, '⌁'),
        h('div', null, [
          h('div.fb__title', null, 'The answer'),
          h('div.fb__msg', { html: rich(solution) }),
        ]),
      ]));
      index++;
      onUse(index);
    }
    btn.textContent = label();
    btn.disabled = index > hints.length || (index === hints.length && !solution);
  }

  btn.textContent = label();
  btn.disabled = hints.length === 0 && !solution;
  return { el: wrap, reveal, get used() { return index; } };
}
