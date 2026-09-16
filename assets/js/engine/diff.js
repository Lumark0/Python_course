/**
 * Character-level LCS diff. Small inputs only (single lines of code),
 * which is exactly the case the experiment scene needs: showing a learner
 * precisely which characters *they* changed.
 */
export function diffChars(a = '', b = '') {
  const n = a.length, m = b.length;
  if (n * m > 250000) {  // guard: fall back to whole-string replace
    return a === b ? [{ type: 'same', value: a }] : [{ type: 'del', value: a }, { type: 'add', value: b }];
  }
  // LCS table
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  const push = (type, ch) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.value += ch;
    else out.push({ type, value: ch });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', a[i]); i++; }
    else { push('add', b[j]); j++; }
  }
  while (i < n) { push('del', a[i]); i++; }
  while (j < m) { push('add', b[j]); j++; }
  return out;
}
