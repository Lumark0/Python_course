/**
 * Learner identity.
 *
 * The lab is otherwise anonymous (see store.js) — this is the one piece
 * that asks who is sitting at the keyboard, purely so progress synced to
 * a teacher's sheet (see sync.js) can be attributed to someone. It is a
 * name, not an account: nothing is verified and nothing is a password.
 * A learner who mistypes their name can fix it later in Settings.
 */
import { h } from './dom.js';
import { getState, update } from './store.js';

export function getLearnerName() {
  return (getState().learner.name || '').trim();
}

export function setLearnerName(name) {
  const clean = String(name || '').trim().slice(0, 60);
  update((s) => { s.learner.name = clean; });
  return clean;
}

/**
 * Resolves once a learner name exists. A returning learner on the same
 * browser already has one saved and this resolves immediately; a new
 * learner is blocked behind a name prompt first.
 */
export function ensureLearnerName() {
  if (getLearnerName()) return Promise.resolve(getLearnerName());
  return promptForName();
}

function promptForName() {
  return new Promise((resolve) => {
    const input = h('input.namegate__input', {
      type: 'text',
      maxlength: '60',
      autocomplete: 'name',
      placeholder: 'Your full name',
      required: true,
      'aria-label': 'Your full name',
    });

    const form = h('form.namegate__form', {
      onsubmit: (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (!val) { input.focus(); return; }
        overlay.remove();
        resolve(setLearnerName(val));
      },
    }, [
      input,
      h('button.btn.btn--primary.btn--block', { type: 'submit' }, 'Start'),
    ]);

    const overlay = h('div.namegate', {
      role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'namegateTitle',
    }, [
      h('div.namegate__card', null, [
        h('div.namegate__mark', { 'aria-hidden': 'true' }, '>_'),
        h('h1', { id: 'namegateTitle' }, 'Welcome to the lab'),
        h('p.muted', null, 'Enter your name so your teacher can see your progress.'),
        form,
      ]),
    ]);

    document.body.appendChild(overlay);
    requestAnimationFrame(() => input.focus());
  });
}
