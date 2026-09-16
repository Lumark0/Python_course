/**
 * SCENE TYPE: quiz — a conceptual checkpoint.
 *
 * Used sparingly, and only for ideas that cannot be demonstrated by
 * running code (e.g. "what does the interpreter do *before* it runs
 * anything?"). Every option carries its own explanation, so a wrong answer
 * teaches as much as a right one.
 */
import { h, rich } from '../../core/dom.js';
import { sceneHead, continueButton } from './base.js';
import { createFeedback } from '../../ui/feedback.js';

export function quiz(ctx) {
  const scene = ctx.scene;
  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'Continue');
  let solved = Boolean(ctx.state.done);

  const buttons = (scene.options || []).map((opt, i) => {
    const btn = h('button.quiz__opt', { type: 'button', onclick: () => pick(opt, btn) }, [
      h('span.quiz__key', { 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
      h('span', { html: rich(opt.text) }),
    ]);
    return btn;
  });

  function pick(opt, btn) {
    if (solved) return;
    if (opt.correct) {
      btn.dataset.pick = 'right';
      buttons.forEach((b) => { b.disabled = true; });
      solved = true;
      ctx.save({ done: true });
      ctx.done();
      feedback.ok(opt.why || 'Correct.', { title: 'Correct', extra: scene.explain || null });
      next.hidden = false;
      next.focus();
    } else {
      btn.dataset.pick = 'wrong';
      btn.disabled = true;
      ctx.bumpAttempt();
      feedback.err(opt.why || 'Not this one. Read the other options again.', { title: 'Not quite' });
    }
  }

  if (solved) next.hidden = false;

  const el = h('div.scene', null, [
    sceneHead(scene),
    h('div.quiz', null, buttons),
    feedback.el,
    h('div.scene__foot', null, [next]),
  ]);
  return { el };
}
