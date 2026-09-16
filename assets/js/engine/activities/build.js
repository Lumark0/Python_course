/**
 * SCENE TYPE: build — write the whole program yourself.
 *
 * No template, no starting line beyond a comment. The requirement list is
 * live: every run re-evaluates it, so the learner can see which parts of
 * the brief they have already satisfied. That turns an intimidating blank
 * page into a checklist they can close out one item at a time.
 */
import { h } from '../../core/dom.js';
import { sceneHead, continueButton, requirementList, createHintLadder } from './base.js';
import { createWorkbench } from '../../ui/workbench.js';
import { createFeedback, escalationMessage } from '../../ui/feedback.js';
import { evaluate, allPass, RULES } from '../validators.js';
import { diagnose } from '../diagnose.js';
import { bumpStat } from '../../core/store.js';

export function build(ctx) {
  const scene = ctx.scene;
  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'Finish mission');
  const reqWrap = h('div.card');
  let solved = Boolean(ctx.state.done);

  // Show the requirements before the first run, greyed out.
  function paintReqs(results) {
    reqWrap.replaceChildren(
      h('div.eyebrow', null, 'Mission brief'),
      h('div', { style: { marginTop: 'var(--sp-3)' } }, [requirementList(results)]),
    );
  }
  paintReqs((scene.check || []).map((c) => ({ pass: false, label: c.label || describe(c), detail: '' })));

  const hints = createHintLadder({
    hints: scene.hints || [],
    solution: scene.solution || null,
    onUse: () => bumpStat('hintsUsed'),
  });

  const wb = createWorkbench({
    code: ctx.artifact(scene.id) || scene.code || '',
    filename: scene.filename || 'about_me.py',
    showMemory: scene.showMemory === true,
    onChange: (v) => ctx.saveArtifact(scene.id, v),
    onResult: handleResult,
  });

  function handleResult(result, code) {
    const results = evaluate(scene.check || [], { code, result });
    paintReqs(results);

    if (!result.ok) {
      const d = diagnose(result.error);
      feedback.err(d.plain, { title: d.title, extra: d.concept });
      ctx.bumpAttempt();
      return;
    }
    if (allPass(results)) {
      if (!solved) { solved = true; ctx.save({ done: true }); ctx.done(); }
      feedback.ok(scene.successMessage || 'That is a program you wrote from nothing. It runs, and it does what the brief asked.', {
        title: 'Program accepted', extra: scene.explain || null,
      });
      next.hidden = false;
      next.focus();
      return;
    }
    const n = ctx.bumpAttempt();
    const missing = results.filter((r) => !r.pass).length;
    feedback.hint(`${missing} requirement${missing === 1 ? '' : 's'} still open — see the brief above. ${escalationMessage(n)}`, {
      title: 'Program runs, brief not met',
    });
  }

  if (solved) next.hidden = false;

  const el = h('div.scene', null, [
    sceneHead(scene),
    reqWrap,
    wb.el,
    feedback.el,
    (scene.hints || scene.solution) ? h('div.card', null, [
      h('div.eyebrow', null, 'Stuck?'),
      h('div', { style: { marginTop: 'var(--sp-3)' } }, [hints.el]),
    ]) : null,
    h('div.scene__foot', null, [next]),
  ]);

  return { el, destroy: () => wb.destroy() };
}

function describe(check) {
  const impl = RULES[check.rule];
  return impl ? impl.label(check) : check.rule;
}
