/**
 * SCENE TYPE: run — read it, predict it, then run it.
 *
 * The prediction step is the pedagogy. Running code you have not predicted
 * teaches nothing: you just watch. Committing to an answer first turns the
 * output into feedback on a hypothesis, which is how programmers actually
 * think.
 */
import { h, rich } from '../../core/dom.js';
import { sceneHead, continueButton } from './base.js';
import { createWorkbench } from '../../ui/workbench.js';
import { createFeedback } from '../../ui/feedback.js';
import { evaluate, allPass } from '../validators.js';
import { praise } from '../../ui/feedback.js';
import { diagnose } from '../diagnose.js';

export function run(ctx) {
  const scene = ctx.scene;
  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'Continue');
  let predicted = Boolean(ctx.state.predicted) || !scene.predict;
  let solved = Boolean(ctx.state.done);

  const wb = createWorkbench({
    code: scene.code || '',
    filename: scene.filename || 'program.py',
    readonly: scene.readonly !== false,
    showPipeline: scene.pipeline !== false,
    showInputs: Boolean(scene.stdin),
    initialStdin: scene.stdin || [''],
    onResult: handleResult,
  });

  if (!predicted) wb.runButton.disabled = true;

  /* ---- anatomy: label the parts of the line ---- */
  const anatomy = scene.anatomy ? h('div.anatomy', null, scene.anatomy.map((part) => h('div.anatomy__col', null, [
    h('code.anatomy__part', { dataset: { kind: part.kind || 'plain' } }, part.part),
    h('div.anatomy__tick', { 'aria-hidden': 'true' }),
    h('div.anatomy__label', null, part.label),
  ]))) : null;

  /* ---- prediction quiz ---- */
  let predictEl = null;
  if (scene.predict && !predicted) {
    const opts = scene.predict.options.map((o, i) => {
      const btn = h('button.quiz__opt', { type: 'button', onclick: () => pick(o, btn) }, [
        h('span.quiz__key', { 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
        h('span', { html: rich(o.text) }),
      ]);
      return btn;
    });
    predictEl = h('div.card', null, [
      h('div.eyebrow', null, 'Before you run it'),
      h('p', { style: { margin: 'var(--sp-2) 0 var(--sp-4)' }, html: rich(scene.predict.question) }),
      h('div.quiz', null, opts),
    ]);

    const pick = (o, btn) => {
      opts.forEach((b) => { b.disabled = true; });
      btn.dataset.pick = o.correct ? 'right' : 'wrong';
      predicted = true;
      ctx.save({ predicted: true, predictCorrect: Boolean(o.correct) });
      wb.runButton.disabled = false;
      feedback.show({
        kind: o.correct ? 'ok' : 'info',
        title: o.correct ? 'That is a sound prediction' : 'Interesting guess',
        message: (o.correct ? scene.predict.explainRight : scene.predict.explainWrong)
          || 'Now run it and see who is right — the interpreter is the referee.',
      });
      wb.runButton.focus();
    };
  }

  function handleResult(result, code) {
    const results = evaluate(scene.check || [{ rule: 'noError' }], { code, result });
    const n = ctx.bumpAttempt();
    if (allPass(results)) {
      if (!solved) {
        solved = true;
        ctx.save({ done: true });
        ctx.done();
      }
      feedback.ok(scene.successMessage || praise(n - 1), {
        title: scene.successTitle || 'Program executed',
        extra: scene.successExtra || null,
      });
      next.hidden = false;
      next.focus();
    } else if (!result.ok) {
      const d = diagnose(result.error);
      feedback.err(d.plain, { title: d.title, extra: d.concept });
    } else {
      feedback.err(scene.retryMessage || 'The program ran, but the output is not what this scene needs yet.', {
        title: 'Not quite',
      });
    }
  }

  if (solved) next.hidden = false;

  const el = h('div.scene', null, [
    sceneHead(scene),
    anatomy,
    predictEl,
    wb.el,
    feedback.el,
    h('div.scene__foot', null, [next]),
  ]);

  return { el, destroy: () => wb.destroy() };
}
