/**
 * Execution pipeline visualiser: CODE → PYTHON → OUTPUT.
 *
 * The point is not decoration. Beginners routinely believe the computer
 * "reads" their program the way a person reads a sentence. Showing the
 * source going *into* a machine and a separate result coming *out* is the
 * first correct mental model, and every later idea (variables, functions,
 * errors before execution) builds on it.
 */
import { h, clear, sleep, motionOK } from '../../core/dom.js';
import { highlight } from '../highlight.js';

const STEPS = [
  { key: 'read',    label: 'read the text' },
  { key: 'grammar', label: 'check the grammar' },
  { key: 'exec',    label: 'run line by line' },
  { key: 'out',     label: 'send to output' },
];

export function createPipeline({ compact = false } = {}) {
  const codeEl = h('div.pipe__content');
  const outEl  = h('div.pipe__content');
  const cog    = h('div.pipe__cog', { 'aria-hidden': 'true' }, '⚙');

  const nodeCode = h('div.pipe__node', null, [h('div.pipe__label', null, 'YOUR CODE'), codeEl]);
  const nodeEngine = h('div.pipe__node.pipe__node--engine', null, [
    h('div.pipe__label', null, 'PYTHON INTERPRETER'), cog,
    h('div.pipe__label', { style: { color: 'var(--text-faint)' } }, 'CPython · WebAssembly'),
  ]);
  const nodeOut = h('div.pipe__node', null, [h('div.pipe__label', null, 'OUTPUT'), outEl]);

  const flow1 = h('div.pipe__flow', null, [h('i')]);
  const flow2 = h('div.pipe__flow', null, [h('i')]);

  const stepsEl = h('div.pipe__steps');
  function paintSteps(activeIndex) {
    clear(stepsEl);
    STEPS.forEach((s, i) => {
      stepsEl.appendChild(h(i <= activeIndex ? 'b' : 'span', null, `${i + 1}. ${s.label}`));
      if (i < STEPS.length - 1) stepsEl.appendChild(h('span', null, '›'));
    });
  }
  paintSteps(-1);

  const root = h('div.pipe', { role: 'img', 'aria-label': 'Execution pipeline: your code goes into the Python interpreter, output comes out' }, [
    h('div.pipe__row', null, [nodeCode, nodeEngine, nodeOut]),
    h('div.pipe__row', null, [flow1, h('div.pipe__arrow', { 'aria-hidden': 'true' }, '→'), flow2]),
    compact ? null : stepsEl,
  ]);

  function setCode(code) {
    codeEl.innerHTML = highlight(String(code).trim());
  }

  function setOutput(text, isError = false) {
    clear(outEl);
    outEl.style.color = isError ? 'var(--err)' : 'var(--text)';
    outEl.textContent = text;
  }

  function reset() {
    nodeCode.dataset.active = '0'; nodeEngine.dataset.active = '0'; nodeOut.dataset.active = '0';
    flow1.dataset.on = '0'; flow2.dataset.on = '0';
    clear(outEl); paintSteps(-1);
  }

  /** Animate one execution. Falls back to an instant result if motion is reduced. */
  async function play(result) {
    const text = result.ok
      ? (result.stdout || '(no output)')
      : (result.error?.formatted || 'error');
    if (!motionOK()) {
      nodeCode.dataset.active = '1'; nodeEngine.dataset.active = '0'; nodeOut.dataset.active = '1';
      paintSteps(STEPS.length - 1);
      setOutput(text, !result.ok);
      return;
    }
    reset();
    nodeCode.dataset.active = '1'; paintSteps(0);
    await sleep(320);
    flow1.dataset.on = '1'; nodeEngine.dataset.active = '1'; paintSteps(1);
    await sleep(420);
    paintSteps(2);
    await sleep(380);
    flow1.dataset.on = '0'; flow2.dataset.on = '1'; paintSteps(3);
    await sleep(260);
    nodeEngine.dataset.active = '0'; flow2.dataset.on = '0';
    nodeOut.dataset.active = '1';
    setOutput(text, !result.ok);
  }

  return { el: root, setCode, setOutput, play, reset };
}
