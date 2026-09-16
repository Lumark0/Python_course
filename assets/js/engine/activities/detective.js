/**
 * SCENE TYPE: detective — fault localisation.
 *
 * Reading an error message and pointing at the exact character responsible
 * is a separate skill from fixing it, and it is the one that transfers to
 * every language. So this activity deliberately separates them: run the
 * broken program, read what Python says, then accuse a specific token.
 * Python's own traceback is the evidence.
 */
import { h, clear, rich } from '../../core/dom.js';
import { sceneHead, continueButton } from './base.js';
import { tokenize, isBlameable } from '../../ui/highlight.js';
import { createTerminal } from '../../ui/terminal.js';
import { createFeedback, DEBUG_PRAISE } from '../../ui/feedback.js';
import { diagnose } from '../diagnose.js';
import * as runtime from '../../python/runtime.js';
import { bumpStat } from '../../core/store.js';

const CLASS = {
  com: 'tok-com', str: 'tok-str', num: 'tok-num', kw: 'tok-kw',
  builtin: 'tok-builtin', fn: 'tok-fn', punct: 'tok-punct', op: 'tok-op',
};

/** Resolve `{ text, nth }` into a character range in the source. */
function locate(code, spec) {
  if (!spec) return null;
  if (typeof spec.index === 'number') return { start: spec.index, end: spec.index + (spec.length || 1) };
  let from = -1;
  for (let i = 0; i < (spec.nth || 1); i++) {
    from = code.indexOf(spec.text, from + 1);
    if (from === -1) return null;
  }
  return { start: from, end: from + spec.text.length };
}

export function detective(ctx) {
  const scene = ctx.scene;
  const code = scene.code || '';
  const fault = locate(code, scene.fault);
  const decoys = (scene.decoys || []).map((d) => ({ ...d, range: locate(code, d) }));

  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'Continue');
  const terminal = createTerminal({ title: 'evidence — python 3', showEngine: false });
  const hintLine = h('div.detective__hint', { html: rich(scene.prompt || 'Click the part of the code that causes the error.') });
  const codeEl = h('pre.detective__code', { role: 'group', 'aria-label': 'Broken program — click the token you believe causes the error' });

  let solved = Boolean(ctx.state.done);
  let armed = Boolean(ctx.state.ranEvidence);
  let wrongCount = ctx.state.wrong || 0;

  /* ---- render clickable tokens ---- */
  const tokenEls = [];
  function paint() {
    clear(codeEl);
    for (const t of tokenize(code)) {
      if (!isBlameable(t)) { codeEl.appendChild(document.createTextNode(t.value)); continue; }
      const span = h('span.dtok', {
        class: CLASS[t.type] || '',
        role: 'button', tabindex: armed ? '0' : '-1',
        'aria-label': `Accuse ${t.value}`,
        dataset: { start: String(t.start), end: String(t.end) },
        onclick: () => accuse(t, span),
        onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); accuse(t, span); } },
      }, t.value);
      tokenEls.push(span);
      codeEl.appendChild(span);
    }
  }

  function accuse(token, span) {
    if (!armed) {
      feedback.info('Run the program first. You cannot diagnose a fault you have not observed.', { title: 'Collect the evidence' });
      return;
    }
    if (solved) return;

    const hit = fault && token.start < fault.end && token.end > fault.start;
    if (hit) {
      span.dataset.picked = 'right';
      solved = true;
      ctx.save({ done: true });
      ctx.done();
      feedback.ok(scene.successMessage || DEBUG_PRAISE, {
        title: 'Correct diagnosis',
        extra: scene.explain || null,
      });
      next.hidden = false;
      next.focus();
      tokenEls.forEach((s) => { s.tabIndex = -1; });
      return;
    }

    span.dataset.picked = 'wrong';
    setTimeout(() => { delete span.dataset.picked; }, 1400);
    wrongCount += 1;
    ctx.save({ wrong: wrongCount });
    ctx.bumpAttempt();

    const decoy = decoys.find((d) => d.range && token.start < d.range.end && token.end > d.range.start);
    const message = decoy?.why
      || (wrongCount >= 3
        ? `That part is doing its job. Re-read the error: Python tells you *where it gave up*, which is often after the real mistake.`
        : `\`${token.value}\` is not the problem. Look again at the error message in the console.`);
    feedback.err(message, { title: 'Not the culprit' });
  }

  /* ---- run the broken program to produce real evidence ---- */
  const runBtn = h('button.btn.btn--primary', { type: 'button', onclick: runEvidence }, '▶ Run the broken program');

  async function runEvidence() {
    runBtn.disabled = true;
    terminal.clear();
    terminal.line('python broken.py', 'cmd');
    const result = await runtime.run(code);
    bumpStat('runs');
    if (!result.ok) bumpStat('errors');
    terminal.showResult(result, { echoCommand: false });
    armed = true;
    ctx.save({ ranEvidence: true });
    tokenEls.forEach((s) => { s.tabIndex = 0; });
    hintLine.innerHTML = rich(scene.promptAfterRun || scene.prompt || 'Now click the exact part of the code that Python is complaining about.');
    const d = result.error ? diagnose(result.error) : null;
    feedback.info(
      d ? `${d.plain}` : 'The program ran. Look closely at what it produced.',
      { title: d ? d.title : 'Evidence collected', extra: 'Now accuse a token above.' },
    );
    runBtn.disabled = false;
    runBtn.textContent = '↻ Run again';
  }

  paint();
  if (solved) {
    next.hidden = false;
    hintLine.innerHTML = rich(scene.explain || 'Case closed.');
  }

  const el = h('div.scene', null, [
    sceneHead(scene),
    h('div.stack', null, [
      h('div.detective', null, [codeEl, hintLine]),
      h('div.runbar', null, [runBtn]),
      terminal.el,
      feedback.el,
    ]),
    h('div.scene__foot', null, [next]),
  ]);

  return { el, destroy: () => terminal.destroy() };
}
