/**
 * Code editor.
 *
 * A textarea with a syntax-highlighted layer painted underneath. This is
 * deliberately not CodeMirror/Monaco: those are ~400 KB, fight mobile
 * keyboards, and would need a build step. A textarea gives beginners the
 * text-entry behaviour their phone/keyboard already knows.
 *
 * One pedagogical decision: auto-closing brackets and quotes are OFF.
 * Half of Mission 01 is about a missing `)` — an editor that silently
 * inserts one would make the lesson impossible to teach.
 */
import { h, clear, $ } from '../core/dom.js';
import { highlight } from './highlight.js';

export function createEditor(options = {}) {
  const {
    value = '',
    filename = 'program.py',
    readonly = false,
    // Read-only snippets hug their content; editable buffers keep room to type.
    minLines = readonly ? 1 : 3,
    onChange = () => {},
    onRun = null,        // Ctrl/Cmd+Enter
    toolbar = [],
  } = options;

  const ta = h('textarea.editor__ta', {
    spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off',
    autocorrect: 'off', wrap: 'off', 'aria-label': `Python code editor, ${filename}`,
    readonly: readonly || null,
  });
  ta.value = value;

  const hl = h('pre.editor__hl', { 'aria-hidden': 'true' });
  const gutter = h('div.editor__gutter', { 'aria-hidden': 'true' });
  const stack = h('div.editor__stack', null, [hl, ta]);
  const body = h('div.editor__body', null, [gutter, stack]);

  const bar = h('div.editor__bar', null, [
    h('span.editor__file', null, filename),
    h('span.spacer'),
    ...toolbar,
  ]);

  const root = h('div.editor', { dataset: { readonly: readonly ? '1' : '0' } }, [bar, body]);

  let errorLine = null;

  function paint() {
    const text = ta.value;
    hl.innerHTML = highlight(text) + '\n';   // trailing \n keeps last line height
    const lines = Math.max(text.split('\n').length, minLines);
    clear(gutter);
    for (let i = 1; i <= lines; i++) {
      gutter.appendChild(h('span', { dataset: { err: errorLine === i ? '1' : '0' } }, String(i)));
    }
    // Keep the textarea exactly as tall as the painted code.
    ta.style.height = 'auto';
    const needed = Math.max(hl.scrollHeight, lines * 1.65 * parseFloat(getComputedStyle(hl).fontSize));
    ta.style.height = needed + 'px';
    stack.style.minHeight = needed + 'px';
  }

  ta.addEventListener('input', () => { setError(null); paint(); onChange(ta.value); });

  ta.addEventListener('keydown', (e) => {
    // Ctrl/Cmd+Enter runs — the shortcut every coding environment has.
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onRun) {
      e.preventDefault(); onRun(); return;
    }
    if (e.key === 'Tab') {
      // Tab indents; Escape-then-Tab still reaches the next control, so
      // keyboard users are never trapped (see the Escape handler below).
      e.preventDefault();
      insert('    ');
      return;
    }
    if (e.key === 'Escape') { ta.blur(); return; }
    if (e.key === 'Enter') {
      // Auto-indent: keep the current indentation, add one level after ':'.
      const pos = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', pos - 1) + 1;
      const line = ta.value.slice(lineStart, pos);
      const indent = (line.match(/^[ \t]*/) || [''])[0];
      const extra = /:\s*$/.test(line) ? '    ' : '';
      if (indent || extra) { e.preventDefault(); insert('\n' + indent + extra); }
    }
  });

  function insert(text) {
    const start = ta.selectionStart, end = ta.selectionEnd;
    ta.setRangeText(text, start, end, 'end');
    paint(); onChange(ta.value);
  }

  function setError(line) {
    errorLine = line || null;
    paint();
  }

  function setValue(next, { silent = false } = {}) {
    ta.value = next; setError(null); paint();
    if (!silent) onChange(next);
  }

  // The highlight layer and textarea share one scroll container, so no
  // scroll syncing is needed — but horizontal caret movement still has to
  // keep the caret visible.
  ta.addEventListener('scroll', () => { ta.scrollTop = 0; ta.scrollLeft = 0; });

  paint();

  return {
    el: root,
    textarea: ta,
    get value() { return ta.value; },
    set value(v) { setValue(v); },
    setValue,
    setError,
    setReadonly(flag) { ta.readOnly = flag; root.dataset.readonly = flag ? '1' : '0'; },
    focus() { ta.focus(); },
    addToolbarItem(el) { bar.insertBefore(el, null); },
    repaint: paint,
  };
}

/** Read-only presentation of code, for briefings and worked examples. */
export function codeBlock(code, { label = null } = {}) {
  const pre = h('pre.editor__hl', { style: { padding: 'var(--sp-4)', margin: 0, overflowX: 'auto' }, html: highlight(code) });
  return h('div.editor', { dataset: { readonly: '1' } }, [
    label ? h('div.editor__bar', null, [h('span.editor__file', null, label)]) : null,
    pre,
  ]);
}

export { $ };
