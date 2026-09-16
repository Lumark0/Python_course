/**
 * Validation rules, expressed as data.
 *
 * A lesson author writes:
 *     check: [{ rule: 'stdoutEquals', value: 'Hello, Python!' }]
 * and never touches application code. Every rule returns
 * `{ pass, label, detail }` so the same rule powers both pass/fail and
 * the visible requirement checklist a learner ticks off.
 */

const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
const stripStrings = (code) => String(code).replace(/(["'])(?:\\.|(?!\1)[^\\])*\1/g, '""');

export const RULES = {
  /** Program finished without raising. */
  noError: {
    label: () => 'Program runs without an error',
    run: (ctx) => ({ pass: ctx.result.ok, detail: ctx.result.error ? ctx.result.error.type : '' }),
  },

  /** Program *must* fail — used by "break it" activities. */
  hasError: {
    label: (a) => (a.type ? `Raises ${a.type}` : 'Program raises an error'),
    run: (ctx, a) => ({
      pass: !ctx.result.ok && (!a.type || ctx.result.error?.type === a.type),
      detail: ctx.result.error?.type || 'no error',
    }),
  },

  stdoutEquals: {
    label: (a) => `Output is exactly “${a.value}”`,
    run: (ctx, a) => ({ pass: norm(ctx.result.stdout) === norm(a.value), detail: norm(ctx.result.stdout) }),
  },

  stdoutContains: {
    label: (a) => `Output contains “${a.value}”`,
    run: (ctx, a) => {
      const hay = a.caseSensitive ? ctx.result.stdout : ctx.result.stdout.toLowerCase();
      const needle = a.caseSensitive ? a.value : String(a.value).toLowerCase();
      return { pass: hay.includes(needle), detail: '' };
    },
  },

  stdoutMatches: {
    label: (a) => a.label || `Output matches ${a.pattern}`,
    run: (ctx, a) => ({ pass: new RegExp(a.pattern, a.flags || '').test(ctx.result.stdout), detail: '' }),
  },

  /** Produced *some* output — the first bar a beginner clears. */
  stdoutNotEmpty: {
    label: () => 'Program prints something',
    run: (ctx) => ({ pass: norm(ctx.result.stdout).length > 0, detail: '' }),
  },

  /** Output changed from the starting program: proof of authorship. */
  stdoutDiffersFrom: {
    label: (a) => `Output is different from “${a.value}”`,
    run: (ctx, a) => ({
      pass: norm(ctx.result.stdout).length > 0 && norm(ctx.result.stdout) !== norm(a.value),
      detail: '',
    }),
  },

  stdoutLines: {
    label: (a) => (a.min === a.max ? `Prints exactly ${a.min} lines` : `Prints at least ${a.min} lines`),
    run: (ctx, a) => {
      const n = ctx.result.lines.filter((l) => l.trim() !== '').length;
      const okMin = a.min == null || n >= a.min;
      const okMax = a.max == null || n <= a.max;
      return { pass: okMin && okMax, detail: `${n} line${n === 1 ? '' : 's'}` };
    },
  },

  /** Distinct non-empty output lines — stops "print the same thing 3×". */
  stdoutDistinctLines: {
    label: (a) => `Prints ${a.min} different lines`,
    run: (ctx, a) => {
      const set = new Set(ctx.result.lines.map((l) => l.trim().toLowerCase()).filter(Boolean));
      return { pass: set.size >= a.min, detail: `${set.size} distinct` };
    },
  },

  codeContains: {
    label: (a) => a.label || `Code contains \`${a.value}\``,
    run: (ctx, a) => ({ pass: ctx.code.includes(a.value), detail: '' }),
  },

  codeMatches: {
    label: (a) => a.label || 'Code has the required shape',
    run: (ctx, a) => ({ pass: new RegExp(a.pattern, a.flags || '').test(ctx.code), detail: '' }),
  },

  /** Counts calls outside string literals, so `print("print()")` doesn't count. */
  callCount: {
    label: (a) => (a.min === a.max
      ? `Uses \`${a.name}()\` exactly ${a.min} time${a.min === 1 ? '' : 's'}`
      : `Uses \`${a.name}()\` at least ${a.min} times`),
    run: (ctx, a) => {
      const rx = new RegExp(`\\b${a.name}\\s*\\(`, 'g');
      const n = (stripStrings(ctx.code).match(rx) || []).length;
      const okMin = a.min == null || n >= a.min;
      const okMax = a.max == null || n <= a.max;
      return { pass: okMin && okMax, detail: `${n} found` };
    },
  },

  /** Text that is not one of the starter placeholders. */
  customText: {
    label: (a) => a.label || 'Contains your own words',
    run: (ctx, a) => {
      const strings = [...String(ctx.code).matchAll(/(["'])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2].trim());
      const banned = (a.exclude || []).map((s) => s.toLowerCase().trim());
      const good = strings.filter((s) => s.length >= (a.minLength || 2) && !banned.includes(s.toLowerCase()));
      return { pass: good.length >= (a.count || 1), detail: `${good.length} original string(s)` };
    },
  },

  /** Balanced brackets — a check the learner can reason about themselves. */
  balancedBrackets: {
    label: () => 'Every bracket is closed',
    run: (ctx) => {
      const src = stripStrings(ctx.code);
      let depth = 0, ok = true;
      for (const ch of src) {
        if (ch === '(') depth++;
        else if (ch === ')') { depth--; if (depth < 0) { ok = false; break; } }
      }
      return { pass: ok && depth === 0, detail: depth === 0 ? '' : `${Math.abs(depth)} unmatched` };
    },
  },
};

/**
 * Evaluate a list of rule descriptors.
 * @param {Array<{rule:string}>} checks
 * @param {{code:string, result:object}} ctx
 */
export function evaluate(checks = [], ctx) {
  return checks.map((c) => {
    const impl = RULES[c.rule];
    if (!impl) {
      console.warn('[validators] unknown rule', c.rule);
      return { pass: false, label: `Unknown rule: ${c.rule}`, detail: '', spec: c };
    }
    const { pass, detail } = impl.run(ctx, c);
    return { pass, detail, label: c.label || impl.label(c), spec: c };
  });
}

export function allPass(results) { return results.length > 0 && results.every((r) => r.pass); }
