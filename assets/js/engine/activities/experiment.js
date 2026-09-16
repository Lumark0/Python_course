/**
 * SCENE TYPE: experiment — take the controls.
 *
 * The learner edits a working program into something of their own. The
 * activity then *proves* authorship back to them with a character-level
 * diff and a before/after of the real output. "You changed a real program"
 * is only convincing when you can see exactly what you changed.
 */
import { h, esc } from '../../core/dom.js';
import { sceneHead, continueButton, requirementList } from './base.js';
import { createWorkbench } from '../../ui/workbench.js';
import { createFeedback, escalationMessage } from '../../ui/feedback.js';
import { evaluate, allPass } from '../validators.js';
import { diagnose } from '../diagnose.js';
import { diffChars } from '../diff.js';

export function experiment(ctx) {
  const scene = ctx.scene;
  const original = scene.code || '';
  const saved = ctx.artifact(scene.id) || original;

  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'Continue');
  const diffWrap = h('div', { hidden: true });
  const reqWrap = h('div');
  let solved = Boolean(ctx.state.done);
  let baselineOutput = ctx.state.baselineOutput || scene.baselineOutput || '';

  const resetBtn = h('button.btn.btn--sm.btn--ghost', {
    type: 'button',
    onclick: () => { wb.editor.setValue(original); ctx.saveArtifact(scene.id, original); },
  }, '↺ Restore original');

  const wb = createWorkbench({
    code: saved,
    filename: scene.filename || 'program.py',
    readonly: false,
    showPipeline: false,
    extraControls: [resetBtn],
    onChange: (v) => ctx.saveArtifact(scene.id, v),
    onResult: handleResult,
  });

  function renderDiff(code, output) {
    diffWrap.hidden = false;
    diffWrap.replaceChildren(h('div.diff', null, [
      h('div.diff__side.diff__side--before', null, [
        h('h4', null, 'The program you were given'),
        h('div', { html: esc(original) }),
        h('h4', { style: { marginTop: 'var(--sp-3)' } }, 'Its output'),
        h('div.muted', null, baselineOutput || '—'),
      ]),
      h('div.diff__side.diff__side--after', null, [
        h('h4', null, 'Your program'),
        h('div', { html: diffChars(original, code).map((p) => (
          p.type === 'same' ? esc(p.value)
            : p.type === 'add' ? `<ins>${esc(p.value)}</ins>`
              : `<del>${esc(p.value)}</del>`
        )).join('') }),
        h('h4', { style: { marginTop: 'var(--sp-3)' } }, 'Your output'),
        h('div', { style: { color: 'var(--accent)' } }, output || '—'),
      ]),
    ]));
  }

  function handleResult(result, code) {
    if (!baselineOutput && code.trim() === original.trim() && result.ok) {
      baselineOutput = result.stdout.trim();
      ctx.save({ baselineOutput });
    }
    const results = evaluate(scene.check || [], { code, result });
    reqWrap.replaceChildren(h('div.card', null, [
      h('div.eyebrow', null, 'This scene needs'),
      h('div', { style: { marginTop: 'var(--sp-3)' } }, [requirementList(results)]),
    ]));

    if (!result.ok) {
      const d = diagnose(result.error);
      feedback.err(d.plain, { title: d.title, extra: d.concept });
      ctx.bumpAttempt();
      return;
    }

    if (allPass(results)) {
      renderDiff(code, result.stdout.trim());
      if (!solved) { solved = true; ctx.save({ done: true }); ctx.done(); }
      feedback.ok(scene.successMessage
        || 'That is your program now. You edited real source code, a real interpreter read it, and the output changed because of you.',
        { title: 'You changed the program' });
      next.hidden = false;
    } else {
      const n = ctx.bumpAttempt();
      feedback.hint(scene.retryMessage || escalationMessage(n), { title: 'Keep going' });
    }
  }

  if (solved) next.hidden = false;

  const el = h('div.scene', null, [
    sceneHead(scene),
    wb.el,
    reqWrap,
    feedback.el,
    diffWrap,
    h('div.scene__foot', null, [next]),
  ]);

  return { el, destroy: () => wb.destroy() };
}
