/**
 * SCENE TYPE: assemble — build the line from parts.
 *
 * Typing is not the skill; *structure* is. With the characters supplied,
 * the only thing left to get right is the order — which is exactly the
 * thing a beginner gets wrong. Decoy blocks (a stray `;`, a bare word
 * without quotes) make the choice meaningful rather than mechanical.
 */
import { h, clear } from '../../core/dom.js';
import { sceneHead, continueButton } from './base.js';
import { createTerminal } from '../../ui/terminal.js';
import { createFeedback, escalationMessage } from '../../ui/feedback.js';
import { evaluate, allPass } from '../validators.js';
import { diagnose } from '../diagnose.js';
import * as runtime from '../../python/runtime.js';
import { bumpStat } from '../../core/store.js';

export function assemble(ctx) {
  const scene = ctx.scene;
  const pieces = (scene.blocks || []).map((text, i) => ({ id: i, text }));
  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'Continue');
  const terminal = createTerminal({ title: 'output — python 3', showEngine: false });

  let placed = (ctx.state.placed || []).slice();
  let solved = Boolean(ctx.state.done);

  const target = h('div.blocks.blocks--target', { 'aria-label': 'Assembled line', role: 'list' });
  const tray = h('div.blocks', { 'aria-label': 'Available blocks', role: 'list' });

  function currentCode() { return placed.map((i) => pieces[i].text).join(''); }

  function paint() {
    clear(target); clear(tray);
    placed.forEach((pid, idx) => {
      target.appendChild(h('button.block.block--placed', {
        type: 'button', role: 'listitem',
        'aria-label': `Remove ${pieces[pid].text}`,
        onclick: () => { placed.splice(idx, 1); persist(); paint(); },
      }, pieces[pid].text));
    });
    pieces.forEach((p) => {
      const used = placed.includes(p.id);
      tray.appendChild(h('button.block', {
        type: 'button', role: 'listitem', disabled: used,
        onclick: () => { placed.push(p.id); persist(); paint(); },
      }, p.text));
    });
    preview.textContent = currentCode() || '—';
    runBtn.disabled = placed.length === 0;
  }

  function persist() { ctx.save({ placed }); }

  const preview = h('code.assemble__preview');
  const clearBtn = h('button.btn.btn--sm.btn--ghost', { type: 'button', onclick: () => { placed = []; persist(); paint(); } }, '↺ Clear');
  const runBtn = h('button.btn.btn--primary', { type: 'button', onclick: runIt }, '▶ Run the line');

  async function runIt() {
    const code = currentCode();
    runBtn.disabled = true;
    terminal.clear();
    terminal.line('python program.py', 'cmd');
    const result = await runtime.run(code, { stdin: scene.stdin || [] });
    bumpStat('runs');
    if (!result.ok) bumpStat('errors');
    terminal.showResult(result, { echoCommand: false });
    runBtn.disabled = false;

    const results = evaluate(scene.check || [{ rule: 'noError' }], { code, result });
    if (allPass(results)) {
      if (!solved) { solved = true; ctx.save({ done: true }); ctx.done(); }
      feedback.ok(scene.successMessage || 'Assembled correctly. Order is everything: Python reads left to right and expects each part in its place.', { title: 'Line built' });
      next.hidden = false;
      next.focus();
      return;
    }
    const n = ctx.bumpAttempt();
    if (!result.ok) {
      const d = diagnose(result.error);
      feedback.err(d.plain, { title: d.title, extra: d.concept });
    } else {
      feedback.err(scene.retryMessage || 'It runs, but that is not the line the mission asked for.', { title: 'Not quite', extra: escalationMessage(n) });
    }
  }

  paint();
  if (solved) next.hidden = false;

  const el = h('div.scene', null, [
    sceneHead(scene),
    h('div.assemble', null, [
      h('div', null, [h('div.eyebrow', { style: { marginBottom: 'var(--sp-2)' } }, 'Your line'), target]),
      h('div', null, [h('div.eyebrow', { style: { marginBottom: 'var(--sp-2)' } }, 'Blocks — not all of them belong'), tray]),
      h('div.row', null, [h('span.faint', null, 'Preview:'), preview]),
      h('div.runbar', null, [runBtn, clearBtn]),
      terminal.el,
      feedback.el,
    ]),
    h('div.scene__foot', null, [next]),
  ]);

  return { el, destroy: () => terminal.destroy() };
}
