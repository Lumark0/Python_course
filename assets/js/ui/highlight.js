/**
 * A small Python tokenizer used for editor highlighting *and* for the
 * "code detective" activity, which needs the same tokens as clickable
 * targets. One tokenizer, two very different jobs.
 */
import { esc } from '../core/dom.js';

const KEYWORDS = new Set([
  'False','None','True','and','as','assert','async','await','break','class','continue',
  'def','del','elif','else','except','finally','for','from','global','if','import','in',
  'is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield',
]);

const BUILTINS = new Set([
  'abs','all','any','bool','dict','dir','enumerate','float','format','help','id','input',
  'int','len','list','max','min','open','print','range','repr','reversed','round','set',
  'sorted','str','sum','tuple','type','zip',
]);

const MASTER = new RegExp([
  /(?<com>#[^\n]*)/.source,
  /(?<str>"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/.source,
  /(?<num>\b\d+(?:\.\d+)?\b)/.source,
  /(?<word>\b[A-Za-z_]\w*\b)/.source,
  /(?<punct>[()[\]{},:;.])/.source,
  /(?<op>[+\-*/%=<>!&|^~@]+)/.source,
  /(?<ws>\s+)/.source,
  /(?<other>[^\s])/.source,
].join('|'), 'g');

/**
 * @param {string} code
 * @returns {{type:string, value:string, start:number, end:number}[]}
 */
export function tokenize(code) {
  const tokens = [];
  MASTER.lastIndex = 0;
  let match;
  while ((match = MASTER.exec(code)) !== null) {
    const g = match.groups;
    const value = match[0];
    const start = match.index;
    let type = 'other';
    if (g.com) type = 'com';
    else if (g.str) type = 'str';
    else if (g.num) type = 'num';
    else if (g.word) {
      if (KEYWORDS.has(value)) type = 'kw';
      else if (BUILTINS.has(value)) type = 'builtin';
      else if (code.slice(start + value.length).match(/^\s*\(/)) type = 'fn';
      else type = 'name';
    } else if (g.punct) type = 'punct';
    else if (g.op) type = 'op';
    else if (g.ws) type = 'ws';
    tokens.push({ type, value, start, end: start + value.length });
    if (MASTER.lastIndex === match.index) MASTER.lastIndex++;   // safety
  }
  return tokens;
}

const CLASS = {
  com: 'tok-com', str: 'tok-str', num: 'tok-num', kw: 'tok-kw',
  builtin: 'tok-builtin', fn: 'tok-fn', punct: 'tok-punct', op: 'tok-op',
};

/** Highlighted HTML for a code string. */
export function highlight(code) {
  let out = '';
  for (const t of tokenize(code)) {
    const cls = CLASS[t.type];
    out += cls ? `<span class="${cls}">${esc(t.value)}</span>` : esc(t.value);
  }
  return out;
}

/** True when the token can meaningfully be "blamed" for a bug. */
export function isBlameable(token) {
  return token.type !== 'ws';
}
