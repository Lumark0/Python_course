import { h, $ } from '../core/dom.js';

export function toast({ title, message = '', kind = 'info', icon = '✦', timeout = 4200 }) {
  const host = $('#toasts');
  if (!host) return;
  const el = h(`div.toast.toast--${kind}`, { role: 'status' }, [
    h('div.toast__ico', { 'aria-hidden': 'true' }, icon),
    h('div', null, [
      h('div.toast__title', null, title),
      message ? h('div.toast__msg', null, message) : null,
    ]),
  ]);
  host.appendChild(el);
  setTimeout(() => {
    el.dataset.out = '1';
    setTimeout(() => el.remove(), 260);
  }, timeout);
}
