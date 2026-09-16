/**
 * Minimal DOM helpers. The whole app is built from these three functions —
 * no framework, no build step, so GitHub Pages can serve the repo as-is.
 */

/**
 * h('div.card', { onclick }, [children]) -> HTMLElement
 * Tag string supports `tag.class.class#id`.
 */
export function h(tag, props = null, children = null) {
  const [head, ...classes] = String(tag).split('.');
  const [name, id] = head.split('#');
  const el = document.createElement(name || 'div');
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(' ');

  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = [el.className, v].filter(Boolean).join(' ');
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  if (children != null) append(el, children);
  return el;
}

export function append(parent, child) {
  if (child === null || child === undefined || child === false) return parent;
  if (Array.isArray(child)) { child.forEach((c) => append(parent, c)); return parent; }
  parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  return parent;
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Escape text for safe innerHTML interpolation. */
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Very small markdown-ish inline formatter for lesson copy:
 * **bold**, `code`, and nothing else. Keeps lesson data authorable
 * without shipping a markdown parser.
 */
export function rich(text) {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function richEl(tag, text, props = {}) {
  return h(tag, { ...props, html: rich(text) });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Respect the user's motion preference before animating anything. */
export function motionOK() {
  if (document.documentElement.dataset.motion === 'reduced') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
