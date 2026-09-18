/**
 * MISSION 09 — DEBUGGING CENTER
 *
 * Pure data — see m01-first-code.js for the shape contract. No new syntax
 * is introduced here on purpose: every tool used in this mission — print(),
 * lists, loops, functions — was already taught. The subject is the process
 * of debugging itself: read the evidence, narrow down where the mistake
 * lives, then test the fix.
 */
export default {
  id: 'm09',
  code: 'MISSION 09',
  name: 'Debugging Center',
  objective: 'Find faults on purpose.',
  summary: 'Reading tracebacks, isolating a bug, testing a fix.',
  concepts: ['traceback', 'isolation', 'testing'],
  minutes: 25,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Read a traceback like a map' },
    { id: 't2', label: 'Trace an error through a function call' },
    { id: 't3', label: 'Use print() to isolate a bug' },
    { id: 't4', label: 'Repair a bug you isolated' },
    { id: 't5', label: 'Find a fault using the evidence' },
    { id: 't6', label: 'Complete a debug print' },
    { id: 't7', label: 'Assemble a debug print' },
    { id: 't8', label: 'Debug a broken program end to end' },
  ],

  outcomes: [
    'Read a multi-line traceback and find where execution actually stopped',
    'Use print() to check whether a value matches what you expect',
    'Narrow down which part of a program contains a bug',
    'Fix a bug found through evidence, not guessing',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — The traceback is a map, not an insult',
      title: 'Every error tells you exactly where it happened',
      body: [
        'You have been reading small tracebacks since Mission 01. This mission is about reading them on purpose, as a tool — not just as an obstacle between you and working code.',
        'A traceback is read from the **bottom up**: the last line is the error itself, and the line above it is where Python actually gave up.',
      ],
      machine: {
        idle: 'awaiting strategy',
        prompt: 'A program just crashed with a traceback. What do you do?',
        commands: [
          {
            id: 'panic', label: 'Delete the program and start again from scratch', understood: false,
            screen: 'That throws away information Python is handing you for free.',
            note: 'The traceback already tells you the error type and the exact line. Rewriting from nothing wastes that.',
          },
          {
            id: 'topline', label: 'Read only the very first line', understood: false,
            screen: '"Traceback (most recent call last):" — true, but it tells you nothing about the actual mistake.',
            note: 'The first line is just a label announcing that a traceback follows. The useful information is further down.',
          },
          {
            id: 'exact', label: 'Read the last line first, then the line above it', understood: true,
            screen: 'Last line: the error type and message. Line above: the exact file and line number where it happened.',
            note: 'The bottom of a traceback is the *most specific* information. Everything above it is the path Python took to get there.',
          },
        ],
        successNote: 'Bottom to top: what went wrong, then where. That order is not an accident — Python writes the deepest, most specific frame last.',
      },
      continueLabel: 'Trace one through a function →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'run',
      task: 't2',
      eyebrow: 'Scene 02 — A traceback with more than one line',
      title: 'The error happens inside the function, not at the call',
      body: [
        'This program calls `half(10)`, and `half` fails. The traceback will show **two** locations: where the call was made, and where the failure actually happened.',
        'Predict which one Python blames for the error itself.',
      ],
      code: 'def half(n):\n    return n / 0\n\nprint(half(10))',
      readonly: true,
      pipeline: true,
      anatomy: [
        { part: 'print(half(10))', kind: 'fn', label: 'the call site — where the program asked for half(10)' },
        { part: 'return n / 0', kind: 'op', label: 'where the failure actually happens' },
      ],
      predict: {
        question: 'Which line does the traceback say the error actually happened on?',
        options: [
          { text: 'Line 4 — `print(half(10))`, since that is what started it' },
          { text: 'Line 2 — `return n / 0`, inside `half`', correct: true },
          { text: 'Line 1 — `def half(n):`, since that is where half was created' },
          { text: 'There is no way to tell which line without adding print statements' },
        ],
        explainRight: 'Right. The call on line 4 is what *started* the chain, but the traceback\'s last, most specific frame points at line 2 — the line that actually divided by zero.',
        explainWrong: 'Run it and read every line of the traceback, from the bottom.',
      },
      check: [{ rule: 'hasError', type: 'ZeroDivisionError' }],
      successTitle: 'Traced correctly',
      successMessage: 'You just read a two-frame traceback correctly: one frame for where the call came from, one for where it actually broke. Real programs can have a dozen frames — the reading strategy never changes.',
      continueLabel: 'Learn to isolate a quieter bug →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't3',
      eyebrow: 'Scene 03 — When there is no error at all',
      title: 'Not every bug crashes the program',
      body: [
        'This program runs perfectly and prints an average — but the average is wrong. There is no traceback to read, because nothing failed.',
        'Add a line, `print(total)`, right before `average` is calculated, so you can see what value the program is actually working with.',
      ],
      code: 'scores = [70, 80, 90]\ntotal = scores[0] + scores[1]\naverage = total / len(scores)\nprint("Average:", average)',
      baselineOutput: 'Average: 50.0',
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: 'print\\(\\s*total\\s*\\)', label: 'Adds a print(total) line to inspect the value' },
      ],
      retryMessage: 'The program still only prints the average. Add a separate line: `print(total)`.',
      successMessage: 'That is isolation: checking whether a value part-way through the program matches what you expect, instead of only looking at the final answer.',
      continueLabel: 'What does that value tell you? →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'quiz',
      eyebrow: 'Scene 04 — Checkpoint',
      title: 'The inspected value does not add up',
      body: [
        'The scores are `70`, `80`, and `90`. Your `print(total)` from the last scene shows `150`.',
        'What does that tell you?',
      ],
      options: [
        {
          text: '150 is correct, so the bug must be in the division at the end',
          why: '`70 + 80 + 90` is `240`, not `150`. The value you inspected is already wrong — the division has nothing to do with it.',
        },
        {
          text: '150 is not 70 + 80 + 90 — the mistake happens while total is being built, before this point',
          correct: true,
          why: 'Correct. `150` is only `70 + 80`. Something in the line that builds `total` is not accounting for all three scores.',
        },
        {
          text: 'There is no way to know anything from a single printed value',
          why: 'A single printed value is exactly enough here — you know what the scores are, so you know what `total` *should* be, and 150 is not it.',
        },
        {
          text: 'The scores list itself must be wrong',
          why: 'The scores are `70, 80, 90` — correct as written. The problem is which of them get added together.',
        },
      ],
      explain: 'Isolating a bug is not just about printing values — it is about comparing what you printed to what you *expected*. `150` only means something once you know `70 + 80 + 90` should be `240`.',
      continueLabel: 'Fix it →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'repair',
      task: 't4',
      eyebrow: 'Scene 05 — Fix what you isolated',
      title: 'One score never gets added',
      body: [
        'You already know the problem is in how `total` is built. This should print `80.0` — the real average of 70, 80, and 90. Fix it.',
      ],
      filename: 'broken.py',
      code: 'scores = [70, 80, 90]\ntotal = scores[0] + scores[1]\naverage = total / len(scores)\nprint(average)',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '80.0' }],
      hints: [
        'Count how many items `total` actually adds together, and compare it to how many scores there are.',
        '`scores[0]` and `scores[1]` are only the first two items. There are three.',
        'Add `+ scores[2]` to the line that builds `total`.',
      ],
      solution: '`total = scores[0] + scores[1] + scores[2]`',
      successMessage: 'Fixed — and notice you found this without guessing. The evidence (`150`, not `240`) pointed straight at the line responsible.',
      continueLabel: 'Find a fault the same way →',
    },

    /* ---------------- SCENE 6 ---------------- */
    {
      id: 's6',
      type: 'detective',
      task: 't5',
      eyebrow: 'Scene 06 — Code detective',
      title: 'Trace this one yourself',
      body: [
        'This function is supposed to average a list of numbers. Run it, read the two-frame traceback, then click the exact part of the code responsible.',
      ],
      code: 'def average(numbers):\n    return total / len(numbers)\n\nscores = [70, 80, 90]\nprint(average(scores))',
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'The traceback names the exact line inside the function. Click the token Python says it cannot find.',
      fault: { text: 'total', nth: 1 },
      decoys: [
        { text: 'numbers', nth: 1, why: '`numbers` is the parameter, and it exists exactly where the function expects it. It is not the fault.' },
        { text: 'average', nth: 1, why: 'The function name matches its call below perfectly. Look inside the function body.' },
        { text: 'scores', nth: 1, why: 'The list itself is created correctly, with three real numbers in it.' },
      ],
      explain: 'The traceback\'s deepest frame points straight at `return total / len(numbers)` — and `total` was never created anywhere in this function. It needed to be built from `numbers` first, the same way `total` was built from `scores` back in the repair scene.',
      successMessage: 'Correct diagnosis. You read a two-frame traceback and went straight to the exact token, no guessing involved.',
      continueLabel: 'Complete a debug print →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'fill',
      task: 't6',
      eyebrow: 'Scene 07 — Code completion',
      title: 'Inspect the right value',
      body: [
        'This program calculates a tax amount and a total. Add a debug line that shows the tax on its own, so you could check it separately from the final total.',
      ],
      template: 'price = 25\ntax = price * 0.1\ntotal = price + tax\nprint("tax:", ____)\nprint(total)',
      blankLabel: 'Which value should this debug line show?',
      placeholder: '…',
      note: 'The label `"tax:"` is already there — it is telling you what the printed value ought to be.',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'tax: 2.5\n27.5' }],
      hints: [
        'The label next to the blank already tells you what belongs there.',
        'You want to print the variable that holds the calculated tax, not the price or the total.',
        'The finished line is `print("tax:", tax)`.',
      ],
      solution: '`tax` — so the line reads `print("tax:", tax)`.',
      explain: 'A debug print is only useful if it shows the value you actually suspect — a print statement that shows the wrong variable tells you nothing.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'assemble',
      task: 't7',
      eyebrow: 'Scene 08 — Code forge',
      title: 'Assemble a debug print',
      body: [
        'All the pieces you need are below — plus one variable that was never created.',
        'Assemble a line that prints `debug: 5`, given that `x` holds `5`.',
      ],
      blocks: ['x = 5\n', 'print', '(', '"debug:"', ', ', 'x', ')', 'y'],
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'debug: 5' }],
      retryMessage: 'It runs, but the output is not `debug: 5` — check which variable block you used.',
      successMessage: 'Assembled correctly. A debug print is nothing special syntactically — it is an ordinary `print()` you added on purpose, to be deleted later.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 9 ---------------- */
    {
      id: 's9',
      type: 'build',
      task: 't8',
      eyebrow: 'Scene 09 — Debug a program end to end',
      title: 'This total is wrong. Find out why, then fix it.',
      body: [
        'This program is supposed to add up all four prices in the cart and print `100`. It runs with no error — but the number is wrong.',
        'Use `print()` statements to check the pieces, find the one that does not match what you expect, then fix the actual program so it prints `100`.',
      ],
      filename: 'cart_total.py',
      code: 'prices = [10, 20, 30, 40]\ntotal = 0\nfor i in range(1, len(prices)):\n    total = total + prices[i]\nprint(total)',
      showMemory: true,
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\bfor\\b', label: 'Still uses a loop to add up the prices' },
        { rule: 'stdoutEquals', value: '100', label: 'Prints the correct total, 100' },
      ],
      hints: [
        'Add a temporary `print(i, prices[i])` inside the loop and run it. Which price never gets printed?',
        '`range(1, len(prices))` starts counting at position 1 — it skips position 0 entirely.',
        'Change `range(1, len(prices))` to `range(len(prices))` (or `range(0, len(prices))`) so every position is included.',
      ],
      solution: '`for i in range(len(prices)):` — starting the range at 0 includes every price.',
      successMessage: 'That is the complete loop: notice a number does not match what you expect, isolate which part of the program produced it, then fix that exact part — nothing else needed to change.',
      explain: 'Every debugging session you will ever have is some version of this: read the evidence Python gives you (an error, or a value that does not match), narrow down where it comes from, fix that one place, and test again.',
      continueLabel: 'Complete mission →',
    },
  ],
};
