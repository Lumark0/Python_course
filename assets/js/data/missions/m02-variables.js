/**
 * MISSION 02 — VARIABLE CONTROL
 *
 * Pure data — see m01-first-code.js for the shape contract.
 */
export default {
  id: 'm02',
  code: 'MISSION 02',
  name: 'Variable Control',
  objective: 'Give the computer a memory.',
  summary: 'Variables, assignment, naming, reassignment.',
  concepts: ['variables', 'assignment', 'names'],
  minutes: 20,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Store your first value' },
    { id: 't2', label: 'Print a stored value' },
    { id: 't3', label: 'Change what a variable holds' },
    { id: 't4', label: 'Repair a broken variable name' },
    { id: 't5', label: 'Find a case-sensitivity bug' },
    { id: 't6', label: 'Reassign a variable' },
    { id: 't7', label: 'Assemble an assignment statement' },
    { id: 't8', label: 'Store three facts about yourself' },
  ],

  outcomes: [
    'Create a variable',
    'Read a variable back',
    'Reassign a variable',
    'Tell `=` apart from `==`',
    'Explain why names are case-sensitive',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — Give the machine a memory',
      title: 'A name is not a value until you give it one',
      body: [
        'Mission 01 gave the machine instructions. This one gives it something to remember — but "remember" still has to be exact.',
        'Try it.',
      ],
      machine: {
        idle: 'no memory',
        prompt: 'Choose an instruction to send:',
        commands: [
          {
            id: 'vague1', label: 'Remember something', understood: false,
            screen: 'Remember WHAT — and what should I call it?',
            note: 'A name and a value are both required. "Something" is neither.',
          },
          {
            id: 'vague2', label: 'Store 5', understood: false,
            screen: 'Store it under WHAT name? A value with no name cannot be found again.',
            note: 'This is the same rule as Mission 01, applied to memory instead of an action.',
          },
          {
            id: 'exact', label: 'age = 5', understood: true,
            screen: 'Stored: age → 5',
            note: 'A name and a value, joined by `=`. From now on, `age` means 5 — until you say otherwise.',
          },
        ],
        successNote: 'Stored. `=` in Python means "remember this", not "these are equal" — that trips up almost everyone at first.',
      },
      continueLabel: 'Make it print →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'run',
      task: 't2',
      eyebrow: 'Scene 02 — Read it back',
      title: 'Printing a variable',
      body: [
        'Line 1 creates a name. Line 2 asks Python what that name currently means.',
        'Predict what appears before you run it.',
      ],
      code: 'age = 12\nprint(age)',
      readonly: true,
      pipeline: true,
      anatomy: [
        { part: 'age', kind: 'plain', label: 'a name you chose' },
        { part: '=', kind: 'op', label: 'assignment — "store what follows"' },
        { part: '12', kind: 'num', label: 'the value being stored' },
      ],
      predict: {
        question: 'What does `print(age)` show?',
        options: [
          { text: '`age`' },
          { text: '`12`', correct: true },
          { text: '`age = 12`' },
          { text: 'Nothing — `age` is not text, so it cannot be printed.' },
        ],
        explainRight: 'Right. `print(age)` looks up the value stored under the name `age` — 12 — and shows that, not the word "age".',
        explainWrong: 'Run it and let the interpreter settle it.',
      },
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '12' }],
      successMessage: 'A variable is a label on a value, not the value itself. `print(age)` follows the label to whatever it currently points at.',
      continueLabel: 'Take the controls →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't3',
      eyebrow: 'Scene 03 — Experiment',
      title: 'Change what it stores',
      body: [
        'Edit the value on line 1 — or the name on both lines — and run it. Prove to yourself the output actually depends on what you wrote.',
      ],
      code: 'favorite = "pizza"\nprint(favorite)',
      baselineOutput: 'pizza',
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'print', min: 1 },
        { rule: 'stdoutDiffersFrom', value: 'pizza', label: 'The output is different from the original' },
      ],
      retryMessage: 'Still prints "pizza". Change the value between the quotes.',
      successMessage: 'That variable now holds whatever you stored in it — nothing more, nothing less.',
      continueLabel: 'Continue →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'quiz',
      eyebrow: 'Scene 04 — Checkpoint',
      title: 'You run `x = 5`, then `x = 8`, then `print(x)`. What appears?',
      body: [
        'Think about what "storing a new value" actually does to the old one.',
      ],
      options: [
        {
          text: '`5`',
          why: 'The first value is gone the instant you reassign `x`. A variable holds exactly one value at a time — the newest one.',
        },
        {
          text: '`8`',
          correct: true,
          why: 'Correct. Assigning again does not create a second `x` — it replaces what the name points to. The `5` is simply forgotten.',
        },
        {
          text: '`5` and then `8`, on two lines',
          why: '`print(x)` only runs once, so it can only report whatever `x` means at that one moment.',
        },
        {
          text: 'An error, because `x` already exists',
          why: 'Reassigning an existing name is completely normal — it is the entire point of a variable.',
        },
      ],
      explain: 'A variable is a label you can move, not a box that fills up. Move the label and the old value is gone — that is reassignment.',
      continueLabel: 'Break something →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'repair',
      task: 't4',
      eyebrow: 'Scene 05 — Break it',
      title: 'The names do not match. Repair it.',
      body: [
        'This should print `Ali`. Run it, read what Python says, then fix it.',
      ],
      filename: 'broken.py',
      code: 'nam = "Ali"\nprint(name)',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Ali' }],
      hints: [
        'Read the error: which exact name does Python say it cannot find?',
        'Look at the line above the error. Does it create that exact name, or something close to it?',
        'Every letter has to match. `nam` and `name` are two different names as far as Python is concerned.',
      ],
      solution: '`name = "Ali"` on line 1, so it matches `print(name)` on line 2.',
      successMessage: 'Fixed. A one-letter difference is enough to make two names completely unrelated.',
      successExtra: 'Python even guesses what you meant ("Did you mean: \'nam\'?") — but it never guesses for you. It only ever tells you what it found.',
      continueLabel: 'Harder case →',
    },

    /* ---------------- SCENE 6 ---------------- */
    {
      id: 's6',
      type: 'detective',
      task: 't5',
      eyebrow: 'Scene 06 — Code detective',
      title: 'Find the culprit',
      body: [
        'This program creates one variable and tries to print it. Run it, then click the exact part of the code responsible for the error.',
      ],
      code: 'score = 10\nprint(Score)',
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'Now click the exact part of the code that Python is complaining about.',
      fault: { text: 'Score', nth: 1 },
      decoys: [
        { text: 'score', nth: 1, why: 'Line 1 is fine — it creates the name `score` (all lowercase) without any trouble.' },
        { text: 'print', nth: 1, why: '`print` itself is innocent. Look at what you asked it to print.' },
      ],
      explain: 'Python is case-sensitive: `score` and `Score` are two entirely different names. Only one of them was ever created.',
      successMessage: 'Correct. Different case means a different name — Python never treats them as the same thing.',
      continueLabel: 'Complete the code →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'fill',
      task: 't6',
      eyebrow: 'Scene 07 — Code completion',
      title: 'Overwrite the value',
      body: [
        'Line 1 sets `x` to 5. Fill in line 2 so that `x` ends up holding something else, then line 3 proves it by printing the result.',
      ],
      template: 'x = 5\nx = ____\nprint(x)',
      blankLabel: 'Give x a new value',
      placeholder: '…',
      note: 'Whatever you put here replaces 5 completely — Python does not keep the old value anywhere.',
      check: [
        { rule: 'noError' },
        { rule: 'stdoutDiffersFrom', value: '5', label: 'x now holds a different value than it started with' },
      ],
      hints: [
        'Any value works — try replacing the blank with a different number.',
        'You are not editing line 1. You are writing what line 2 stores.',
        'For example: `x = 20`.',
      ],
      solution: 'For example `20` — anything other than `5` satisfies this.',
      explain: 'This is reassignment in its plainest form: the second line simply wins.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'assemble',
      task: 't7',
      eyebrow: 'Scene 08 — Code forge',
      title: 'Assemble an assignment',
      body: [
        'All the pieces you need are below — plus some that do not belong.',
        'Assemble a line that stores `12` under the name `age`, then run it.',
      ],
      blocks: ['age', '=', '==', '12', 'Age'],
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '^age\\s*=\\s*12$', label: 'Stores 12 under the exact name `age`' },
      ],
      retryMessage: 'It runs without error, but check every letter and the operator — this needs the exact name `age` and `=`, not `==`.',
      successMessage: '`=` stores a value; `==` (which you did not need here) asks whether two things are equal — a very different job you will meet later.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 9 ---------------- */
    {
      id: 's9',
      type: 'build',
      task: 't8',
      eyebrow: 'Scene 09 — Build your first program',
      title: 'Store three facts about yourself',
      body: [
        'Empty file. Create **three** variables — anything true about you — and print each one by its variable name, not by retyping the text.',
        'Watch the memory panel below the editor: it shows exactly what Python is holding, live.',
      ],
      filename: 'profile.py',
      code: '# Create three variables, then print each one by name.\n\n',
      showMemory: true,
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'print', min: 3, label: 'Uses `print()` at least three times' },
        { rule: 'stdoutDistinctLines', min: 3, label: 'Prints three different lines' },
        { rule: 'codeMatches', pattern: '(^|\\n)\\s*[A-Za-z_][A-Za-z0-9_]*\\s*=\\s*[^=\\n]', label: 'Creates at least one variable with `=`' },
        { rule: 'codeMatches', pattern: 'print\\(\\s*[A-Za-z_][A-Za-z0-9_]*\\s*\\)', label: 'Prints a variable by name, not typed-out text' },
      ],
      hints: [
        'Each fact is two lines: `name = "..."`, then `print(name)`.',
        'You need three separate variables and three separate `print(...)` calls that each print a bare name.',
        'Example shape: `age = 15` on one line, `print(age)` on the next.',
      ],
      solution: 'For example:\n`name = "Ali"`\n`print(name)`\n`school = "Lahore Training Centre"`\n`print(school)`\n`hobby = "Football"`\n`print(hobby)`',
      successMessage: 'Three variables, three lookups. The memory panel above filled in as you ran the program — that is not decoration, it is genuinely what CPython is holding.',
      explain: 'You now have the two moves this whole mission was about: create a name, and read it back. Everything from here builds on exactly that.',
      continueLabel: 'Complete mission →',
    },
  ],
};
