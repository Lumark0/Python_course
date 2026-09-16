/**
 * Hash router. Hash routing (not history API) is a deliberate choice:
 * GitHub Pages cannot rewrite unknown paths to index.html, so
 * `#/mission/m01` is the only form that survives a page refresh.
 */
import { emit } from './bus.js';

const routes = [];
let outlet = null;
let disposeCurrent = null;

export function route(pattern, handler) {
  // '/mission/:id' -> /^\/mission\/([^/]+)$/
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ rx, keys, handler, pattern });
}

export function start(outletEl) {
  outlet = outletEl;
  window.addEventListener('hashchange', resolve);
  resolve();
}

export function go(path) {
  if (location.hash === '#' + path) { resolve(); return; }
  location.hash = path;
}

export function currentPath() {
  const raw = location.hash.replace(/^#/, '');
  return raw || '/';
}

async function resolve() {
  const path = currentPath();
  const match = routes.find((r) => r.rx.test(path));

  if (typeof disposeCurrent === 'function') {
    try { disposeCurrent(); } catch (err) { console.error('[router] dispose failed', err); }
  }
  disposeCurrent = null;

  outlet.replaceChildren();

  if (!match) {
    outlet.appendChild(notFound(path));
    emit('route:changed', { path, name: null });
    return;
  }

  const params = {};
  const values = path.match(match.rx).slice(1);
  match.keys.forEach((k, i) => { params[k] = decodeURIComponent(values[i]); });

  emit('route:changed', { path, name: match.pattern, params });

  const result = await match.handler(params, outlet);
  if (typeof result === 'function') disposeCurrent = result;

  // Focus management for keyboard/screen-reader users on every navigation.
  outlet.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function notFound(path) {
  const div = document.createElement('div');
  div.className = 'wrap empty';
  div.innerHTML = `
    <div class="empty__ico">⌁</div>
    <h1>Sector not found</h1>
    <p class="muted">Nothing is mapped to <code>${path.replace(/[<>&]/g, '')}</code>.</p>
    <a class="btn btn--primary" href="#/">Return to the lab</a>`;
  return div;
}
