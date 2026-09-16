/**
 * SCENE TYPE: concept — "the instruction machine".
 *
 * Instead of a paragraph claiming computers follow instructions literally,
 * the learner issues instructions to a machine that is aggressively
 * literal. Vague commands produce "I do not understand that instruction".
 * The lesson lands because they caused it.
 */
import { h, clear, sleep, motionOK } from '../../core/dom.js';
import { sceneHead, continueButton } from './base.js';
import { createFeedback } from '../../ui/feedback.js';

export function concept(ctx) {
  const scene = ctx.scene;
  const cfg = scene.machine || {};
  const screen = h('div.machine__screen', null, cfg.idle || 'machine ready');
  const beam = h('div.machine__beam', { dataset: { on: '0' }, 'aria-hidden': 'true' }, [
    h('div.dot'), h('div.dot'), h('div.dot'),
  ]);
  const feedback = createFeedback();
  const next = continueButton(ctx, scene.continueLabel || 'I understand — continue');

  const tried = new Set(ctx.state.tried || []);
  let solved = Boolean(ctx.state.done);

  const buttons = (cfg.commands || []).map((cmd) => h('button.btn.btn--sm', {
    type: 'button',
    onclick: () => send(cmd),
  }, cmd.label));

  async function send(cmd) {
    tried.add(cmd.id);
    ctx.save({ tried: [...tried] });
    buttons.forEach((b) => { b.disabled = true; });
    clear(screen);
    if (motionOK()) {
      beam.dataset.on = '1';
      screen.textContent = '…';
      await sleep(420);
      beam.dataset.on = '0';
    }
    screen.textContent = cmd.screen;
    screen.style.color = cmd.understood ? 'var(--accent)' : 'var(--err)';
    buttons.forEach((b) => { b.disabled = false; });

    if (cmd.understood) {
      feedback.ok(cmd.note || cfg.successNote || 'The machine obeyed, because the instruction was exact.', { title: 'Instruction accepted' });
      if (!solved) {
        solved = true;
        ctx.save({ done: true });
        ctx.done();
        next.hidden = false;
      }
    } else {
      feedback.err(cmd.note || 'Too vague. A computer cannot guess what you meant.', { title: 'Instruction rejected' });
    }
  }

  if (solved) next.hidden = false;

  const el = h('div.scene', null, [
    sceneHead(scene),
    h('div.machine', null, [
      h('div.machine__stage', null, [
        h('div.machine__you', null, [
          h('div.machine__face', { 'aria-hidden': 'true' }, '🧑‍💻'),
          h('div.machine__cap', null, 'YOU — THE INSTRUCTOR'),
        ]),
        beam,
        h('div.machine__box', null, [
          h('div.machine__cap', null, 'THE MACHINE'),
          screen,
        ]),
      ]),
      h('div', null, [
        h('p.faint', { style: { marginBottom: 'var(--sp-3)' } }, cfg.prompt || 'Give the machine an instruction:'),
        h('div.machine__cmds', null, buttons),
      ]),
      feedback.el,
      h('div.scene__foot', null, [next]),
    ]),
  ]);

  return { el };
}
