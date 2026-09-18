/**
 * MISSION 08 — FUNCTION FACTORY
 *
 * Pure data — see m01-first-code.js for the shape contract.
 */
export default {
  id: 'm08',
  code: 'MISSION 08',
  name: 'Function Factory',
  objective: 'Build your own instructions.',
  summary: 'def, parameters, return, reuse.',
  concepts: ['def', 'parameters', 'return'],
  minutes: 25,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Define your own instruction' },
    { id: 't2', label: 'Run a function with a parameter' },
    { id: 't3', label: 'Change what the function does' },
    { id: 't4', label: 'Repair a missing return' },
    { id: 't5', label: 'Find a fault inside a function' },
    { id: 't6', label: 'Complete a function definition' },
    { id: 't7', label: 'Assemble a function and a call' },
    { id: 't8', label: 'Write your own function' },
  ],

  outcomes: [
    'Define a function with def and a parameter',
    'Explain the difference between print() and return',
    'Call a function and use the value it returns',
    'Diagnose a fault inside a function',
    'Write and call a function of your own',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — Teach Python a new word',
      title: 'A function is an instruction you name yourself',
      body: [
        'Every instruction you have used so far — `print`, `len`, `input` — already existed. `def` lets you invent your own, give it a name, and reuse it forever.',
        'Try defining one.',
      ],
      machine: {
        idle: 'no custom instructions',
        prompt: 'Choose an instruction to send:',
        commands: [
          {
            id: 'repeat', label: 'print("Hello, Ali!"), then print("Hello, Sara!"), then print("Hello, Sam!")', understood: false,
            screen: 'That works for three names. Every new name means writing a whole new line by hand.',
            note: 'The greeting logic is identical every time — only the name changes. That pattern is exactly what a function is for.',
          },
          {
            id: 'vague', label: 'Make a greeting instruction', understood: false,
            screen: 'What should it be called, and what does it need to know each time it runs?',
            note: 'A function needs a name and, usually, something told to it each time — a parameter.',
          },
          {
            id: 'exact', label: 'def greet(name):\n    print("Hello, " + name + "!")', understood: true,
            screen: 'Defined: greet(name) — remembered, not run yet.',
            note: '`def` creates the instruction and gives it a parameter, `name`. Nothing prints yet — defining a function only teaches Python the recipe.',
          },
        ],
        successNote: 'Defining a function does not run it. You have to call it by name to actually use it — next scene.',
      },
      continueLabel: 'Call it →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'run',
      task: 't2',
      eyebrow: 'Scene 02 — Calling your own function',
      title: 'Define once, call whenever you like',
      body: [
        'Line 1–2 define `greet`. Line 4 actually runs it, handing it `"Ali"` to use as `name`.',
        'Predict the output before running.',
      ],
      code: 'def greet(name):\n    print("Hello, " + name + "!")\n\ngreet("Ali")',
      readonly: true,
      pipeline: true,
      anatomy: [
        { part: 'def', kind: 'kw', label: 'define a new instruction' },
        { part: 'name', kind: 'plain', label: 'a parameter — filled in by whoever calls the function' },
        { part: 'greet("Ali")', kind: 'fn', label: 'the call — this is what actually runs the function' },
      ],
      predict: {
        question: 'What appears in the terminal?',
        options: [
          { text: '`Hello, name!`' },
          { text: '`Hello, Ali!`', correct: true },
          { text: 'Nothing — defining a function does not run it' },
          { text: '`greet("Ali")`' },
        ],
        explainRight: 'Right. `greet("Ali")` runs the function\'s body with `name` set to `"Ali"` for that one call — so `name` inside the function means `"Ali"`.',
        explainWrong: 'Run it and see. Only the call on the last line actually executes anything.',
      },
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Hello, Ali!' }],
      successMessage: 'You just wrote your first custom instruction and used it. `name` is a placeholder — it becomes whatever value the call provides.',
      continueLabel: 'Take the controls →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't3',
      eyebrow: 'Scene 03 — Experiment',
      title: 'Reuse the same function, different result',
      body: [
        'Change what you call `greet` with — or add a second call on a new line — and prove the output changed without touching the function itself.',
      ],
      code: 'def greet(name):\n    print("Hello, " + name + "!")\n\ngreet("Ali")',
      baselineOutput: 'Hello, Ali!',
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'greet', min: 1 },
        { rule: 'stdoutDiffersFrom', value: 'Hello, Ali!', label: 'The output is different from the original' },
      ],
      retryMessage: 'Still prints "Hello, Ali!". Change what you pass to greet(...), and leave the function itself alone.',
      successMessage: 'The function did not change at all — only what you handed it did. That reuse is the entire point of writing one.',
      continueLabel: 'What if there is no return? →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'quiz',
      eyebrow: 'Scene 04 — Checkpoint',
      title: 'A function with no return statement',
      body: [
        '```\ndef add(a, b):\n    total = a + b\n\nresult = add(3, 4)\nprint(result)\n```',
        'The function computes `total` but never says `return total`. What does `print(result)` show?',
      ],
      options: [
        {
          text: '`7`',
          why: 'The addition really did happen — but nothing ever handed `total` back to whoever called the function. `add(3, 4)` gives back nothing useful.',
        },
        {
          text: '`None`',
          correct: true,
          why: 'Correct. A function with no `return` hands back `None` by default. The calculation happened and was then thrown away the moment the function ended.',
        },
        {
          text: 'A `NameError`, because `total` was never returned',
          why: '`total` exists just fine *inside* the function while it runs — the problem is that nothing outside the function can see it afterwards.',
        },
        {
          text: 'Nothing prints at all',
          why: '`print(result)` still runs — it just prints whatever `result` is, which turns out to be `None`.',
        },
      ],
      explain: '`print()` and `return` are easy to confuse because both can make a value "appear" — but `print()` only shows something on screen, while `return` is the only way a function hands a value back to the code that called it.',
      continueLabel: 'Fix a function like this →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'repair',
      task: 't4',
      eyebrow: 'Scene 05 — Break it',
      title: 'The calculation happens, but never comes back',
      body: [
        'This should print `7`. Run it, read what actually printed, then repair the function.',
      ],
      filename: 'broken.py',
      code: 'def add(a, b):\n    total = a + b\n\nresult = add(3, 4)\nprint(result)',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '7' }],
      hints: [
        'This will not raise an error — it will simply print the wrong thing. Read what it actually printed.',
        '`total` is calculated correctly inside the function. It is never handed back to whoever called it.',
        'Add `return total` as the last line inside the function, indented the same as the line above it.',
      ],
      solution: '`def add(a, b):`\n`    total = a + b`\n`    return total` — the missing line.',
      successMessage: 'Fixed. `return` is the only way a value escapes a function — everything else calculated inside is forgotten the moment the function ends.',
      continueLabel: 'Find this bug in someone else\'s code →',
    },

    /* ---------------- SCENE 6 ---------------- */
    {
      id: 's6',
      type: 'detective',
      task: 't5',
      eyebrow: 'Scene 06 — Code detective',
      title: 'Find the exact fault',
      body: [
        'This function is supposed to introduce someone by name. Run it, read the evidence, then click the exact part of the code responsible.',
      ],
      code: 'def introduce(name):\n    print("This is " + Name)\n\nintroduce("Ali")',
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'Now click the exact part of the code Python is complaining about.',
      fault: { text: 'Name', nth: 1 },
      decoys: [
        { text: 'name', nth: 1, why: 'That is the parameter, spelled correctly, right where the function expects it. It is not the fault.' },
        { text: 'introduce', nth: 1, why: 'The function name is fine and matches its call below. Look inside the function body.' },
        { text: '"Ali"', nth: 1, why: 'The value passed into the call is completely fine — the problem happens *inside* the function, before this value is ever used.' },
      ],
      explain: 'The parameter is `name`, all lowercase. Inside the function, the code asks for `Name` — capital N — which was never created. Python treats them as two entirely different names.',
      successMessage: 'Correct diagnosis. The same case-sensitivity rule from Missions 02 and 03 applies just as strictly inside a function.',
      continueLabel: 'Complete a function definition →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'fill',
      task: 't6',
      eyebrow: 'Scene 07 — Code completion',
      title: 'Hand the value back',
      body: [
        'This function computes `n * n` but never hands it back. Fill in the blank so `print(square(4))` shows `16`.',
      ],
      template: 'def square(n):\n    ____ n * n\n\nprint(square(4))',
      blankLabel: 'What keyword hands a value back to the caller?',
      placeholder: '…',
      note: 'This is the exact keyword the repair scene added a few steps ago.',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '16' }],
      hints: [
        '`print()` shows something on screen. This function needs to hand its answer *back*, not show it.',
        'The keyword for handing a value back to whoever called the function starts with r.',
        'The finished line reads `return n * n`.',
      ],
      solution: '`return` — so the line reads `return n * n`.',
      explain: '`return` ends the function immediately and hands the given value back to wherever it was called from — here, straight into `print(...)`.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'assemble',
      task: 't7',
      eyebrow: 'Scene 08 — Code forge',
      title: 'Assemble a function and a call',
      body: [
        'The pieces below include a complete one-line function definition, plus two possible calls — only one prints `16`.',
        'Assemble the program so it prints `16`, then run it.',
      ],
      blocks: ['def square(n): return n * n\n', 'print(square(4))', 'print(square(5))'],
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '16' }],
      retryMessage: 'It runs, but the output is not `16` — check which call block you used.',
      successMessage: 'Assembled correctly. `square(4)` is `16`; `square(5)` would have been `25` — same function, different call, different answer.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 9 ---------------- */
    {
      id: 's9',
      type: 'build',
      task: 't8',
      eyebrow: 'Scene 09 — Build your own function',
      title: 'Write a function with three parameters',
      body: [
        'Empty file. Define a function called `add_three` that takes three numbers and `return`s their sum. Then call it with `1, 2, 3` and print the result.',
      ],
      filename: 'add_three.py',
      code: '# Define add_three(a, b, c) so it returns a + b + c.\n# Then call it with 1, 2, 3 and print the result.\n\n',
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\bdef\\b', label: 'Defines a function with def' },
        { rule: 'codeMatches', pattern: '\\breturn\\b', label: 'Uses return to hand back the sum' },
        { rule: 'codeMatches', pattern: 'add_three\\(', label: 'Calls add_three(...)' },
        { rule: 'stdoutEquals', value: '6', label: 'Prints 6 — the sum of 1, 2 and 3' },
      ],
      hints: [
        'The function needs three parameters: `def add_three(a, b, c):`.',
        'Inside, hand back their total: `return a + b + c`.',
        'Below the function (not indented), call it and print the result: `print(add_three(1, 2, 3))`.',
      ],
      solution: '`def add_three(a, b, c):`\n`    return a + b + c`\n\n`print(add_three(1, 2, 3))`',
      successMessage: 'That function now works for any three numbers — the exact same two lines would just as happily add up 100, 200 and 300.',
      explain: 'A parameter list, a `return`, and a call: that is the complete shape of a function. Everything more advanced you meet later is built from exactly this.',
      continueLabel: 'Complete mission →',
    },
  ],
};
