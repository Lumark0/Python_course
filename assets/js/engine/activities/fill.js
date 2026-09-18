/**
 * SCENE TYPE: fill — complete the missing code.
 *
 * The blank is a real input inside a real line of Python. Whatever the
 * learner types is executed verbatim, so the classic beginner mistake
 * (typing `Hello` instead of `"Hello"`) produces a genuine NameError and
 * a genuine explanation, instead of a canned "wrong answer".
 */
import { h, rich } from '../../core/dom.js';
import { sceneHead, continueButton, createHintLadder, requirementList } from './base.js';
import { createTerminal } from '../../ui/terminal.js';
import { createFeedback, escalationMessage } from '../../ui/feedback.js';
import { evaluate, allPass } from '../validators.js';
import { diagnose } from '../diagnose.js';
import { highlight } from '../../ui/highlight.js';
import * as runtime from '../../python/runtime.js';
import { bumpStat } from '../../core/store.js';

const BLANK = '____';

export function fill(ctx) {
  const scene = ctx.scene;
  const template = scene.template || `print(${BLANK})`;
  const [before, after = ''] = template.split(BLANK);

  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'Continue');
  const terminal = createTerminal({ title: 'output — python 3', showEngine: false });
  const reqWrap = h('div');
  let solved = Boolean(ctx.state.done);

  const input = h('input.fillline__input', {
    type: 'text',
    value: ctx.artifact(scene.id) || '',
    placeholder: scene.placeholder || 'type here',
    spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off',
    'aria-label': scene.blankLabel || 'the missing part of the line',
    oninput: () => { resize(); ctx.saveArtifact(scene.id, input.value); },
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); runIt(); } },
  });

  function resize() {
    input.style.width = Math.max(8, input.value.length + 2) + 'ch';
  }
  resize();

  const line = h('div.fillline', null, [
    h('span', { html: highlight(before) }),
    input,
    h('span', { html: highlight(after) }),
  ]);

  const hints = createHintLadder({
    hints: scene.hints || [],
    solution: scene.solution || null,
    onUse: () => bumpStat('hintsUsed'),
  });

  const runBtn = h('button.btn.btn--primary', { type: 'button', onclick: runIt }, '▶ Run');

  async function runIt() {
    if (!input.value.trim()) {
      feedback.hint('The blank is still empty. Put something between the brackets.', { title: 'Nothing to run' });
      return;
    }
    const code = before + input.value + after;
    runBtn.disabled = true;
    terminal.clear();
    terminal.line('python program.py', 'cmd');
    const result = await runtime.run(code, { stdin: scene.stdin || [] });
    bumpStat('runs');
    if (!result.ok) bumpStat('errors');
    terminal.showResult(result, { echoCommand: false });
    runBtn.disabled = false;

    const results = evaluate(scene.check || [{ rule: 'noError' }], { code, result });
    reqWrap.replaceChildren(h('div.card', null, [
      h('div.eyebrow', null, 'Requirements'),
      h('div', { style: { marginTop: 'var(--sp-3)' } }, [requirementList(results)]),
    ]));

    if (allPass(results)) {
      if (!solved) { solved = true; ctx.save({ done: true }); ctx.done(); }
      feedback.ok(scene.successMessage || 'Complete. The line is valid Python and it does what it was meant to do.', {
        title: 'Line completed', extra: scene.explain || null,
      });
      next.hidden = false;
      next.focus();
      return;
    }

    const n = ctx.bumpAttempt();
    if (!result.ok) {
      const d = diagnose(result.error);
      feedback.err(d.plain, { title: d.title, extra: d.concept });
    } else {
      feedback.err(scene.retryMessage || 'That is valid Python, but not what this line needs yet.', {
        title: 'Not quite', extra: escalationMessage(n),
      });
    }
  }

  if (solved) next.hidden = false;

  const el = h('div.scene', null, [
    sceneHead(scene),
    h('div.card', null, [
      scene.blankLabel ? h('div.eyebrow', null, scene.blankLabel) : null,
      h('div', { style: { marginTop: 'var(--sp-3)' } }, [line]),
      h('p.faint', { style: { marginTop: 'var(--sp-3)' }, html: rich(scene.note || 'Whatever you type is run exactly as written.') }),
    ]),
    h('div.runbar', null, [runBtn]),
    terminal.el,
    reqWrap,
    feedback.el,
    h('div.card', null, [h('div.eyebrow', null, 'Stuck?'), h('div', { style: { marginTop: 'var(--sp-3)' } }, [hints.el])]),
    h('div.scene__foot', null, [next]),
  ]);

  return { el, destroy: () => terminal.destroy() };
}
