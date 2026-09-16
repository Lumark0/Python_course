/**
 * SCENE TYPE: repair — the program is broken, fix it.
 *
 * The answer is never shown on arrival. Hints unlock one rung at a time,
 * and the escalation is driven by *failed runs*, not by a timer, so a
 * learner who is making progress is never interrupted with help they did
 * not need.
 */
import { h } from '../../core/dom.js';
import { sceneHead, continueButton, createHintLadder } from './base.js';
import { createWorkbench } from '../../ui/workbench.js';
import { createFeedback, escalationMessage, DEBUG_PRAISE } from '../../ui/feedback.js';
import { evaluate, allPass } from '../validators.js';
import { diagnose } from '../diagnose.js';
import { bumpStat } from '../../core/store.js';

export function repair(ctx) {
  const scene = ctx.scene;
  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'Continue');
  const saved = ctx.artifact(scene.id) || scene.code || '';
  let solved = Boolean(ctx.state.done);
  let sawDiagnosis = false;

  const hints = createHintLadder({
    hints: scene.hints || [],
    solution: scene.solution || null,
    onUse: () => bumpStat('hintsUsed'),
  });

  const wb = createWorkbench({
    code: saved,
    filename: scene.filename || 'broken.py',
    showPipeline: false,
    onChange: (v) => ctx.saveArtifact(scene.id, v),
    onResult: handleResult,
  });

  function handleResult(result, code) {
    const results = evaluate(scene.check || [{ rule: 'noError' }], { code, result });

    if (allPass(results)) {
      if (!solved) { solved = true; ctx.save({ done: true }); ctx.done(); }
      feedback.ok(scene.successMessage || DEBUG_PRAISE, {
        title: 'Repaired',
        extra: scene.successExtra || null,
      });
      next.hidden = false;
      next.focus();
      return;
    }

    const n = ctx.bumpAttempt();

    if (!result.ok) {
      const d = diagnose(result.error);
      // First failure: explain the error. Later failures: escalate.
      feedback.err(
        sawDiagnosis && n > 2 ? `${d.plain}\n\n${escalationMessage(n)}` : d.plain,
        {
          title: d.title,
          extra: `${d.concept}${d.line ? `  ·  Python stopped at line ${d.line}.` : ''}`,
        },
      );
      sawDiagnosis = true;
    } else {
      feedback.err(scene.retryMessage || 'It runs now — but the output is still not what the mission needs.', {
        title: 'Closer',
        extra: escalationMessage(n),
      });
    }
  }

  if (solved) next.hidden = false;

  const el = h('div.scene', null, [
    sceneHead(scene),
    wb.el,
    feedback.el,
    h('div.card', null, [
      h('div.eyebrow', null, 'Stuck?'),
      h('p.faint', { style: { margin: 'var(--sp-2) 0 var(--sp-3)' } },
        'Hints unlock one at a time. Try at least one run of your own idea first — a failed run is data.'),
      hints.el,
    ]),
    h('div.scene__foot', null, [next]),
  ]);

  return { el, destroy: () => wb.destroy() };
}
