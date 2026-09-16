/**
 * Free sandbox.
 *
 * Every claim the lessons make ("a syntax error means nothing runs") is
 * testable here, immediately, without leaving the app. The memory panel is
 * on by default so variables become visible the moment a learner invents
 * one — which is usually before the lesson that names them.
 */
import { h } from '../core/dom.js';
import { createWorkbench } from '../ui/workbench.js';
import { saveArtifact, artifact } from '../core/store.js';

const STARTER = `# The sandbox. Nothing here is graded.
# Try anything — including things you think will break.

print("Hello from the sandbox")
`;

const SNIPPETS = [
  { label: 'Hello', code: 'print("Hello, Python!")\n' },
  { label: 'A variable', code: 'name = "Ali"\nprint(name)\nprint("Hello,", name)\n' },
  { label: 'Maths', code: 'print(7 * 6)\nprint(10 / 4)\nprint(10 // 4)\n' },
  { label: 'A syntax error', code: 'print("this line looks fine")\nprint("but this one is broken"\nprint("so nothing runs at all")\n' },
  { label: 'A runtime error', code: 'print("this line DOES run")\nprint(1 / 0)\nprint("this one never happens")\n' },
];

export function sandbox(_params, outlet) {
  const saved = artifact('sandbox', 'code') || STARTER;

  const wb = createWorkbench({
    code: saved,
    filename: 'sandbox.py',
    showMemory: true,
    showPipeline: false,
    terminalTitle: 'sandbox — python 3',
    onChange: (v) => saveArtifact('sandbox', 'code', v),
  });

  const chips = h('div.row', null, SNIPPETS.map((s) => h('button.btn.btn--sm', {
    type: 'button',
    onclick: () => { wb.editor.setValue(s.code); wb.editor.focus(); },
  }, s.label)));

  outlet.appendChild(h('div.wrap', null, [
    h('div.eyebrow', null, 'Free experimentation'),
    h('h1', { style: { marginTop: 'var(--sp-2)' } }, 'Sandbox'),
    h('p.lede', { style: { marginTop: 'var(--sp-2)', maxWidth: '62ch' } },
      'A real Python interpreter with nothing to prove. Load an example, break it on purpose, and watch what the error says.'),
    h('div.card', { style: { marginTop: 'var(--sp-4)' } }, [
      h('div.eyebrow', { style: { marginBottom: 'var(--sp-3)' } }, 'Load an example'),
      chips,
    ]),
    h('div', { style: { marginTop: 'var(--sp-4)' } }, [wb.el]),
  ]));

  return () => wb.destroy();
}
