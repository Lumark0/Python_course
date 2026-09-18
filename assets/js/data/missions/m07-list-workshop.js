/**
 * MISSION 07 — LIST WORKSHOP
 *
 * Pure data — see m01-first-code.js for the shape contract.
 */
export default {
  id: 'm07',
  code: 'MISSION 07',
  name: 'List Workshop',
  objective: 'Store many things under one name.',
  summary: 'Lists, indexing, append, iteration.',
  concepts: ['list', 'index', 'iteration'],
  minutes: 25,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Store many values in one list' },
    { id: 't2', label: 'Read an item by position' },
    { id: 't3', label: 'Change what the list holds' },
    { id: 't4', label: 'Repair an out-of-range index' },
    { id: 't5', label: 'Find an off-by-one bug' },
    { id: 't6', label: 'Complete an append() call' },
    { id: 't7', label: 'Assemble a list lookup' },
    { id: 't8', label: 'Write a program using a list' },
  ],

  outcomes: [
    'Create a list and read an item from it by index',
    'Explain why the first item is at index 0',
    'Add an item to a list with append()',
    'Diagnose an IndexError',
    'Loop over a list and use len()',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — One name, many values',
      title: 'A list holds several values in order',
      body: [
        'A variable so far has held exactly one value. A list holds many, in a fixed order, under one single name.',
        'Try storing three fruits.',
      ],
      machine: {
        idle: 'no memory',
        prompt: 'Choose an instruction to send:',
        commands: [
          {
            id: 'separate', label: 'fruit1 = "apple", fruit2 = "banana", fruit3 = "cherry"', understood: false,
            screen: 'That works for three. What about thirty? Or three hundred?',
            note: 'A separate name for every value does not scale, and there is no way to "loop over" three unrelated names.',
          },
          {
            id: 'vague', label: 'Store a list of fruits', understood: false,
            screen: 'A list of WHICH fruits, and in what order? I need the actual values.',
            note: 'The machine still needs exact values — a list is a container, not a guess.',
          },
          {
            id: 'exact', label: 'fruits = ["apple", "banana", "cherry"]', understood: true,
            screen: "Stored: fruits → ['apple', 'banana', 'cherry']",
            note: 'Square brackets `[ ]` create a list. One name, `fruits`, now holds all three values, in exactly the order you wrote them.',
          },
        ],
        successNote: 'One name, many values, in order. That order is what makes a list searchable by position.',
      },
      continueLabel: 'Read one back →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'run',
      task: 't2',
      eyebrow: 'Scene 02 — Reading by position',
      title: 'Positions start at 0',
      body: [
        'Every item in a list has a position, called its **index**. The first item is at index `0`, not `1`.',
        'Predict what this prints before running it.',
      ],
      code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[1])',
      readonly: true,
      pipeline: true,
      anatomy: [
        { part: 'fruits', kind: 'plain', label: 'the list — three values in order' },
        { part: '[1]', kind: 'punct', label: 'index 1 — the *second* item, since counting starts at 0' },
      ],
      predict: {
        question: 'What does `fruits[1]` print?',
        options: [
          { text: '`apple` — the first item' },
          { text: '`banana` — the second item', correct: true },
          { text: '`cherry` — the third item' },
          { text: 'An error, because 1 is not a valid position' },
        ],
        explainRight: 'Right. Index `0` is `"apple"`, index `1` is `"banana"`. Counting positions from zero feels backwards at first, but it is consistent across almost every part of Python.',
        explainWrong: 'Run it and count carefully — the first position is 0, not 1.',
      },
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'banana' }],
      successMessage: 'That is indexing: give a list a position, get back the value stored there. `fruits[0]` would have given you `"apple"` instead.',
      continueLabel: 'Take the controls →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't3',
      eyebrow: 'Scene 03 — Experiment',
      title: 'Change what comes back',
      body: [
        'Change the fruits in the list, the index, or both — then run it and prove the output changed.',
      ],
      code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[1])',
      baselineOutput: 'banana',
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'print', min: 1 },
        { rule: 'stdoutDiffersFrom', value: 'banana', label: 'The output is different from the original' },
      ],
      retryMessage: 'Still prints "banana". Change the list contents or the index.',
      successMessage: 'Same shape of code, different result — because either the list or the position you asked for changed.',
      continueLabel: 'What if the position does not exist? →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'quiz',
      eyebrow: 'Scene 04 — Checkpoint',
      title: 'fruits has 3 items. What is fruits[3]?',
      body: [
        '`fruits = ["apple", "banana", "cherry"]` has three items, at positions 0, 1, and 2.',
        'What happens when the program asks for `fruits[3]`?',
      ],
      options: [
        {
          text: 'It wraps around and gives you `"apple"` again',
          why: 'Python lists do not wrap around. There is no position 3, and Python will not silently substitute a different one.',
        },
        {
          text: 'It prints an empty value',
          why: 'There is no "empty" placeholder for a missing position — Python refuses outright instead.',
        },
        {
          text: 'IndexError — that position does not exist',
          correct: true,
          why: 'Correct. Three items occupy positions 0, 1, and 2. Position 3 was never created, so Python raises `IndexError`.',
        },
        {
          text: 'It adds a new empty item automatically to fill position 3',
          why: 'Reading from a list never changes it. A list only grows when you explicitly add something.',
        },
      ],
      explain: 'The last valid position in a list is always one less than its length: for 3 items, that is `2`, not `3`. This exact mistake is common enough to have a name — an "off-by-one" error.',
      continueLabel: 'Meet the error for real →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'repair',
      task: 't4',
      eyebrow: 'Scene 05 — Break it',
      title: 'This position does not exist. Repair it.',
      body: [
        'This should print the last fruit in the list, `cherry`. Run it, read the error, then fix the index.',
      ],
      filename: 'broken.py',
      code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[3])',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'cherry' }],
      hints: [
        'Read the error: Python is telling you the position you asked for does not exist.',
        'Three items occupy positions 0, 1, and 2. Which one of those is `"cherry"`?',
        'Change `fruits[3]` to `fruits[2]`.',
      ],
      solution: '`fruits[2]` — the last of three items sits at index 2, not 3.',
      successMessage: 'Fixed. The length of a list and its highest valid index are always one apart — length 3, highest index 2.',
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
        'This program tries to print the last fruit using `len()`. Run it, read the evidence, then click the exact part of the code responsible.',
      ],
      code: 'fruits = ["apple", "banana", "cherry"]\nlast = len(fruits)\nprint(fruits[last])',
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'Now click the exact part of the code Python is complaining about.',
      fault: { text: 'last', nth: 2 },
      decoys: [
        { text: 'len', nth: 1, why: '`len(fruits)` is correct — it really does return 3, the number of items. The mistake is what happens *with* that 3.' },
        { text: 'fruits', nth: 1, why: 'The list itself is fine — three items, created correctly.' },
      ],
      explain: '`len(fruits)` is `3` — the *count* of items, not the position of the last one. The last valid position is always `len(fruits) - 1`. Using `last` directly asks for a position one past the end.',
      successMessage: 'Correct diagnosis. This is the single most common cause of `IndexError` in real code: confusing a length with a position.',
      continueLabel: 'Complete an append() call →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'fill',
      task: 't6',
      eyebrow: 'Scene 07 — Code completion',
      title: 'Add an item to the list',
      body: [
        '`append()` adds a new item to the *end* of a list. Complete the line so `"cherry"` joins the list.',
      ],
      template: 'fruits = ["apple", "banana"]\nfruits.____("cherry")\nprint(fruits)',
      blankLabel: 'Which method adds an item to the end?',
      placeholder: '…',
      note: 'The finished program should print all three fruits, in the order they were added.',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: "['apple', 'banana', 'cherry']" }],
      hints: [
        'This is a method — it is called *on* the list itself, with a dot: `fruits.something(...)`.',
        'The word describes exactly what it does: it adds something to the end.',
        'The method is called `append`.',
      ],
      solution: '`append` — so the line reads `fruits.append("cherry")`.',
      explain: '`append()` changes the list in place — it does not create a new one. That is why `print(fruits)` afterwards shows all three items.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'assemble',
      task: 't7',
      eyebrow: 'Scene 08 — Code forge',
      title: 'Assemble a list lookup',
      body: [
        'All the pieces you need are below — plus one index that points at the wrong item.',
        'Assemble a line that prints `blue`, the third colour in the list, then run it.',
      ],
      blocks: ['print', '(', '["red", "green", "blue"]', '[2]', ')', '[1]'],
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'blue' }],
      retryMessage: 'It runs, but the output is not `blue` — check which index block you used.',
      successMessage: 'Assembled correctly. You can index straight into a freshly written list — you do not have to store it in a variable first.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 9 ---------------- */
    {
      id: 's9',
      type: 'build',
      task: 't8',
      eyebrow: 'Scene 09 — Build a program using a list',
      title: 'Store and show a list of your own',
      body: [
        'Empty file. Create a list of at least **three** items — anything you like. Print every item using a loop, then print how many items the list holds using `len()`.',
      ],
      filename: 'list_demo.py',
      code: '# Create a list with at least three items.\n# Print every item with a loop, then print its length.\n\n',
      showMemory: true,
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\[.+\\]', label: 'Creates a list with [ ]' },
        { rule: 'codeMatches', pattern: '\\bfor\\b', label: 'Loops over the list' },
        { rule: 'codeMatches', pattern: '\\blen\\(', label: 'Uses len() to report the count' },
        { rule: 'stdoutLines', min: 4, label: 'Prints at least four lines (each item plus the count)' },
      ],
      hints: [
        'Start with a list: `things = ["a", "b", "c"]`.',
        'Loop over it with `for item in things:` and print `item` inside the loop.',
        'After the loop (not indented), print `len(things)` — on its own or inside a sentence.',
      ],
      solution: '`things = ["pen", "notebook", "chalk"]`\n`for item in things:`\n`    print(item)`\n`print("Total:", len(things))`',
      successMessage: 'That program works for a list of 3 items or 300 — the loop and `len()` do not care how many items you actually stored.',
      explain: 'A list plus a loop is one of the most common shapes in real programs: store many things, then do the same action to every one of them.',
      continueLabel: 'Complete mission →',
    },
  ],
};
