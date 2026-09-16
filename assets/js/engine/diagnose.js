/**
 * Error translator.
 *
 * Python's own messages are written for people who already know Python.
 * This maps the errors a first-week learner actually hits onto plain
 * language plus the concept behind them — the point is never just "you
 * typed it wrong", it is "here is the rule Python is enforcing".
 */

const RULES = [
  {
    id: 'unclosed-paren',
    test: (e) => e.type === 'SyntaxError' && /never closed|unexpected EOF|was never closed/i.test(e.message),
    title: 'A bracket was opened but never closed',
    plain: 'Python read `(` and waited for the matching `)`. It reached the end of your program still waiting.',
    concept: 'Every opening bracket needs its partner. Python counts them.',
  },
  {
    id: 'unterminated-string',
    test: (e) => e.type === 'SyntaxError' && /unterminated string|EOL while scanning/i.test(e.message),
    title: 'A piece of text was never closed',
    plain: 'A quotation mark opened some text, but no matching quote closed it.',
    concept: 'Text starts and ends with the same kind of quote: `"like this"`.',
  },
  {
    id: 'missing-comma',
    test: (e) => e.type === 'SyntaxError' && /invalid syntax\. Perhaps you forgot a comma/i.test(e.message),
    title: 'Two values with nothing between them',
    plain: 'Python found two values side by side and does not know how to join them.',
    concept: 'Separate the things you give a function with commas.',
  },
  {
    id: 'print-statement',
    test: (e) => e.type === 'SyntaxError' && /Missing parentheses in call to 'print'/i.test(e.message),
    title: '`print` needs brackets',
    plain: 'In Python 3, `print` is a function, so what you want shown goes inside `( )`.',
    concept: 'Calling a function always looks like `name(...)`.',
  },
  {
    id: 'bad-indent',
    test: (e) => e.type === 'IndentationError' || /unexpected indent|expected an indented block/i.test(e.message || ''),
    title: 'The spacing at the start of a line is off',
    plain: 'Python uses indentation to decide which lines belong together, so extra or missing spaces change the meaning.',
    concept: 'Lines at the same level must start in the same column.',
  },
  {
    id: 'name-error-quotes',
    test: (e) => e.type === 'NameError',
    title: 'Python does not recognise that word',
    plain: (e) => {
      const name = (e.message.match(/name '([^']+)'/) || [])[1];
      return name
        ? `Python looked for something called \`${name}\` and found nothing. If \`${name}\` was meant to be *text*, it needs quotes: \`"${name}"\`.`
        : 'Python looked for a name it has never been given.';
    },
    concept: 'Bare words are names Python must already know. Quoted words are just text.',
  },
  {
    id: 'type-error-concat',
    test: (e) => e.type === 'TypeError' && /can only concatenate str|unsupported operand/i.test(e.message),
    title: 'Those two things are different kinds of value',
    plain: 'Python will not glue text and numbers together without being told how.',
    concept: 'Text (`str`) and numbers (`int`) behave differently. Convert first: `str(5)`.',
  },
  {
    id: 'zero-division',
    test: (e) => e.type === 'ZeroDivisionError',
    title: 'Division by zero',
    plain: 'Mathematics has no answer for this, and neither does Python.',
    concept: 'Some operations are undefined — programs must avoid or handle them.',
  },
  {
    id: 'eof-input',
    test: (e) => e.type === 'EOFError',
    title: 'The program asked for typed input',
    plain: 'Your program called `input()`, but nothing was queued for it to read.',
    concept: '`input()` pauses a program until a person types something.',
  },
  {
    id: 'stopped',
    test: (e) => e.type === 'Stopped',
    title: 'Program stopped',
    plain: 'You interrupted the program before it finished.',
    concept: 'A program that never ends has to be stopped from the outside.',
  },
];

const GENERIC = {
  SyntaxError: {
    title: 'Python could not read this as Python',
    plain: 'Something in the shape of the code breaks the rules, so Python stopped before running anything.',
    concept: 'A syntax error means *nothing* ran — Python never got started.',
  },
  IndexError: {
    title: 'That position does not exist',
    plain: 'You asked for an item further along than the collection goes.',
    concept: 'Positions start at 0 and stop one before the length.',
  },
  ValueError: {
    title: 'Right kind of thing, wrong value',
    plain: 'The value handed over was the correct type but not usable here.',
    concept: 'Types and values are two separate checks.',
  },
  AttributeError: {
    title: 'That thing cannot do that',
    plain: 'You asked a value for a capability it does not have.',
    concept: 'Each type supports its own set of operations.',
  },
};

/**
 * @param {{type:string, message:string, line?:number}} error
 * @returns {{id:string, title:string, plain:string, concept:string, line:number|null, raw:string}}
 */
export function diagnose(error) {
  if (!error) return null;
  const rule = RULES.find((r) => { try { return r.test(error); } catch { return false; } });
  const source = rule || GENERIC[error.type] || {
    title: `${error.type}`,
    plain: error.message || 'Python stopped with an error.',
    concept: 'Reading the error message is the first debugging skill.',
  };
  return {
    id: rule ? rule.id : (error.type || 'unknown'),
    title: typeof source.title === 'function' ? source.title(error) : source.title,
    plain: typeof source.plain === 'function' ? source.plain(error) : source.plain,
    concept: source.concept,
    line: error.line || null,
    raw: `${error.type}: ${error.message}`,
  };
}
