import { h } from '../core/dom.js';
import { getState, setSetting, resetAll, exportJSON, importJSON } from '../core/store.js';
import { getLearnerName, setLearnerName } from '../core/identity.js';
import { SHEET_WEBHOOK_URL } from '../config.js';
import { toast } from '../ui/toast.js';
import * as runtime from '../python/runtime.js';
import { go } from '../core/router.js';

export function settings(_params, outlet) {
  const s = getState().settings;

  const seg = (options, current, onPick) => {
    const btns = options.map((o) => h('button', {
      type: 'button', 'aria-pressed': String(o.value === current),
      onclick: () => {
        btns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btns[options.indexOf(o)].setAttribute('aria-pressed', 'true');
        onPick(o.value);
      },
    }, o.label));
    return h('div.seg', null, btns);
  };

  const nameField = () => {
    const input = h('input.field-input', {
      type: 'text', maxlength: '60', value: getLearnerName(), placeholder: 'Your full name',
      style: { maxWidth: '220px' },
    });
    input.addEventListener('change', () => {
      const clean = setLearnerName(input.value);
      input.value = clean;
      toast({ title: 'Name updated', kind: 'ok', icon: '✎' });
    });
    return input;
  };

  const engine = runtime.getStatus();

  outlet.appendChild(h('div.wrap.wrap--narrow', null, [
    h('div.eyebrow', null, 'Lab configuration'),
    h('h1', { style: { marginTop: 'var(--sp-2)' } }, 'Settings & help'),

    SHEET_WEBHOOK_URL ? h('div.card', { style: { marginTop: 'var(--sp-5)' } }, [
      h('div.eyebrow', null, 'You'),
      h('div.setting', null, [
        h('div', null, [
          h('div.setting__name', null, 'Name'),
          h('div.setting__desc', null, 'Shown to your teacher alongside your progress. Fix a typo here.'),
        ]),
        nameField(),
      ]),
    ]) : null,

    h('div.card', { style: { marginTop: 'var(--sp-5)' } }, [
      h('div.eyebrow', null, 'Display'),
      h('div.setting', null, [
        h('div', null, [h('div.setting__name', null, 'Theme'), h('div.setting__desc', null, 'Light mode is legible on a projector.')]),
        seg([{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }], s.theme, (v) => setSetting('theme', v)),
      ]),
      h('div.setting', null, [
        h('div', null, [h('div.setting__name', null, 'Animation'), h('div.setting__desc', null, 'Reduced motion removes the execution animations.')]),
        seg([{ label: 'Full', value: 'full' }, { label: 'Reduced', value: 'reduced' }], s.motion, (v) => setSetting('motion', v)),
      ]),
      h('div.setting', null, [
        h('div', null, [h('div.setting__name', null, 'Text size'), h('div.setting__desc', null, 'Affects the whole application, editor included.')]),
        seg([{ label: 'S', value: 14 }, { label: 'M', value: 15 }, { label: 'L', value: 17 }, { label: 'XL', value: 19 }], s.fontSize, (v) => setSetting('fontSize', v)),
      ]),
    ]),

    h('div.card', { style: { marginTop: 'var(--sp-4)' } }, [
      h('div.eyebrow', null, 'Keyboard'),
      h('div.kbdlist', { style: { marginTop: 'var(--sp-3)' } }, [
        h('div', null, [h('span', null, [h('kbd', null, 'Ctrl'), ' + ', h('kbd', null, 'Enter')]), h('span', null, 'Run the program in the editor')]),
        h('div', null, [h('span', null, [h('kbd', null, 'Tab')]), h('span', null, 'Insert four spaces (indent)')]),
        h('div', null, [h('span', null, [h('kbd', null, 'Esc')]), h('span', null, 'Leave the editor — then Tab moves to the next control')]),
      ]),
    ]),

    h('div.card', { style: { marginTop: 'var(--sp-4)' } }, [
      h('div.eyebrow', null, 'Python engine'),
      h('div.kbdlist', { style: { marginTop: 'var(--sp-3)' } }, [
        h('div', null, [h('span', null, 'Status'), h('span', null, engine.status)]),
        h('div', null, [h('span', null, 'Pyodide'), h('span', null, engine.version || `v${runtime.PYODIDE_VERSION} (pending)`)]),
        h('div', null, [h('span', null, 'Python'), h('span', null, engine.python || '—')]),
        h('div', null, [h('span', null, 'Source'), h('span', { style: { wordBreak: 'break-all' } }, runtime.indexURL())]),
      ]),
      h('p.faint', { style: { marginTop: 'var(--sp-3)' } },
        'Python runs entirely inside this browser tab. No code you write is sent anywhere.'),
      h('div.row', { style: { marginTop: 'var(--sp-3)' } }, [
        h('button.btn.btn--sm', { type: 'button', onclick: () => { runtime.stop(); toast({ title: 'Engine restarting', kind: 'info', icon: '⟳' }); } }, '⟳ Restart engine'),
      ]),
    ]),

    h('div.card', { style: { marginTop: 'var(--sp-4)' } }, [
      h('div.eyebrow', null, 'Your progress data'),
      h('p.faint', { style: { margin: 'var(--sp-2) 0 var(--sp-3)' } },
        SHEET_WEBHOOK_URL
          ? 'Progress lives in this browser and is also summarised to your teacher’s sheet under the name above. Export it to move to another machine.'
          : 'Progress is stored in this browser only — there is no account and no server. Export it to move to another machine.'),
      h('div.row', null, [
        h('button.btn.btn--sm', { type: 'button', onclick: doExport }, '⇩ Export progress'),
        h('label.btn.btn--sm', { for: 'importFile' }, '⇧ Import progress'),
        h('input', {
          id: 'importFile', type: 'file', accept: 'application/json',
          style: { display: 'none' }, onchange: doImport,
        }),
        h('button.btn.btn--sm.btn--danger', { type: 'button', onclick: doReset }, '⌫ Reset everything'),
      ]),
    ]),
  ]));

  function doExport() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'python-training-lab-progress.json' });
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: 'Progress exported', kind: 'ok', icon: '⇩' });
  }

  function doImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importJSON(String(reader.result));
        toast({ title: 'Progress imported', kind: 'ok', icon: '⇧' });
        go('/progress');
      } catch (err) {
        toast({ title: 'Import failed', message: String(err.message || err), kind: 'info', icon: '⚠' });
      }
    };
    reader.readAsText(file);
  }

  function doReset() {
    if (!confirm('Erase all progress, code and badges from this browser? This cannot be undone.')) return;
    resetAll();
    toast({ title: 'Progress cleared', kind: 'info', icon: '⌫' });
    go('/');
  }
}
