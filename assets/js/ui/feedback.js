/**
 * Feedback surface + the escalation logic behind it.
 *
 * The rule the whole app follows: feedback names the concept, never just
 * the verdict. And it gets *more* helpful the more the learner struggles,
 * without ever handing over the answer unasked.
 */
import { h, clear, rich } from '../core/dom.js';

const ICONS = { ok: '✔', err: '✕', hint: '◆', info: 'ℹ' };
const TITLES = { ok: 'Correct', err: 'Not yet', hint: 'Hint', info: 'Note' };

export function createFeedback() {
  const root = h('div', { 'aria-live': 'polite' });

  function show({ kind = 'info', title, message, extra = null }) {
    clear(root);
    const card = h(`div.fb.fb--${kind}`, null, [
      h('div.fb__ico', { 'aria-hidden': 'true' }, ICONS[kind] || 'ℹ'),
      h('div', null, [
        h('div.fb__title', null, title || TITLES[kind]),
        message ? h('div.fb__msg', { html: rich(message) }) : null,
        extra ? h('div.fb__extra', { html: typeof extra === 'string' ? rich(extra) : '' },
          typeof extra === 'string' ? null : extra) : null,
      ]),
    ]);
    root.appendChild(card);
    return card;
  }

  return {
    el: root,
    show,
    ok:   (message, opts = {}) => show({ kind: 'ok',   message, ...opts }),
    err:  (message, opts = {}) => show({ kind: 'err',  message, ...opts }),
    hint: (message, opts = {}) => show({ kind: 'hint', message, ...opts }),
    info: (message, opts = {}) => show({ kind: 'info', message, ...opts }),
    clear: () => clear(root),
  };
}

/* ------------------------------------------------------------------
   Escalation: what to say on the Nth wrong attempt.
------------------------------------------------------------------- */
const ENCOURAGE = [
  'Not quite — but that is how programming works. Adjust and run it again.',
  'Still not there. Read the output carefully; it is telling you something.',
  "You've tried this several times. Let's examine what Python expects here.",
  'This one is stubborn. Take the hint below — using hints is a real skill, not a failure.',
];

export function escalationMessage(attemptCount) {
  return ENCOURAGE[Math.min(attemptCount - 1, ENCOURAGE.length - 1)] || ENCOURAGE[0];
}

/** Celebrations vary so the fifth success doesn't read like the first. */
const PRAISE = [
  'Excellent. Your program executed successfully.',
  'That worked. You just changed the behaviour of a real program.',
  'Correct — and notice you predicted the output before running it.',
  'Clean run. That is exactly what Python expected.',
];

export function praise(seed = 0) { return PRAISE[seed % PRAISE.length]; }

export const DEBUG_PRAISE = 'You found the error. Debugging is a major part of programming — most of the job, honestly.';
