/**
 * MISSION 06 — LOOP LABORATORY
 *
 * Pure data — see m01-first-code.js for the shape contract.
 */
export default {
  id: 'm06',
  code: 'MISSION 06',
  name: 'Loop Laboratory',
  objective: 'Make the computer repeat itself.',
  summary: 'for, while, range(), and the runaway loop.',
  concepts: ['for', 'while', 'range'],
  minutes: 25,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Repeat an instruction' },
    { id: 't2', label: 'Run your first loop' },
    { id: 't3', label: 'Change how many times it repeats' },
    { id: 't4', label: 'Stop a runaway loop' },
    { id: 't5', label: 'Find a fault inside a loop' },
    { id: 't6', label: 'Complete a range() call' },
    { id: 't7', label: 'Assemble a loop' },
    { id: 't8', label: 'Write a program using a loop' },
  ],

  outcomes: [
    'Write a for loop over range()',
    'Write a while loop with a condition that changes',
    'Explain why a loop can run forever, and how to stop one',
    'Diagnose a fault inside a loop body',
    'Write a program that repeats work for you',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — Say it once, run it many times',
      title: 'A loop is a block that repeats',
      body: [
        'You could print "Hi" a hundred times by writing `print("Hi")` a hundred times. Or you could write it once and tell Python how many times to run it.',
        'Send an instruction and see which approach the machine prefers.',
      ],
      machine: {
        idle: 'awaiting instruction',
        prompt: 'Choose an instruction to send:',
        commands: [
          {
            id: 'manual', label: 'Type print("Hi") a hundred times', understood: false,
            screen: 'That would work. It would also take you ten minutes and one typo would break all hundred lines.',
            note: 'Repetition by hand does not scale, and it is exactly the kind of tedious, error-prone work computers exist to take over.',
          },
          {
            id: 'vague', label: 'Repeat it a bunch of times', understood: false,
            screen: 'How many is "a bunch"? I need an exact number.',
            note: 'Same rule as every mission so far: the machine needs an exact instruction, not a feeling.',
          },
          {
            id: 'exact', label: 'for i in range(3): print("Hi")', understood: true,
            screen: 'Hi\nHi\nHi',
            note: '`range(3)` produces three values, one after another. The loop runs its body once for each one — three times total.',
          },
        ],
        successNote: 'One line, repeated automatically. That is the entire point of a loop: say the instruction once, let Python do the repeating.',
      },
      continueLabel: 'Run a real loop →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'run',
      task: 't2',
      eyebrow: 'Scene 02 — for and range()',
      title: 'Counting with a loop',
      body: [
        '`range(5)` produces five numbers, starting at zero. The loop runs its indented body once per number, storing the current one in `i` each time.',
        'Predict the output before you run it.',
      ],
      code: 'for i in range(5):\n    print(i)',
      readonly: true,
      pipeline: true,
      anatomy: [
        { part: 'for', kind: 'kw', label: 'repeat the block below, once per value' },
        { part: 'i', kind: 'plain', label: 'holds the current value, one loop at a time' },
        { part: 'range(5)', kind: 'fn', label: 'produces 0, 1, 2, 3, 4 — five values, five loops' },
      ],
      predict: {
        question: 'What appears in the terminal?',
        options: [
          { text: '`5` — just the number in range()' },
          { text: '`0` `1` `2` `3` `4` `5` — six lines' },
          { text: '`0` `1` `2` `3` `4` — five lines, starting at zero', correct: true },
          { text: '`1` `2` `3` `4` `5` — five lines, starting at one' },
        ],
        explainRight: 'Right. `range(5)` counts *five* values starting from 0 — so it stops at 4, not 5. This catches almost everyone at least once.',
        explainWrong: 'Run it and count the lines yourself. `range(5)` does not include 5.',
      },
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '0\n1\n2\n3\n4' }],
      successMessage: '`range(5)` means "five values, starting at zero" — 0, 1, 2, 3, 4. This off-by-one shape is worth memorising now; it comes back constantly.',
      continueLabel: 'Take the controls →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't3',
      eyebrow: 'Scene 03 — Experiment',
      title: 'Change how many times it repeats',
      body: [
        'Change the number inside `range(...)`, the message, or both — then run it and prove the loop behaved differently.',
      ],
      code: 'for i in range(3):\n    print("Lap", i)',
      baselineOutput: 'Lap 0\nLap 1\nLap 2',
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'print', min: 1 },
        { rule: 'stdoutDiffersFrom', value: 'Lap 0\nLap 1\nLap 2', label: 'The output is different from the original' },
      ],
      retryMessage: 'Still prints exactly three laps. Change the number inside range(), the message, or both.',
      successMessage: 'The loop body ran exactly as many times as `range(...)` told it to — nothing more, nothing less.',
      continueLabel: 'What could go wrong? →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'quiz',
      eyebrow: 'Scene 04 — Checkpoint',
      title: 'A while loop whose condition never changes',
      body: [
        '```\nn = 3\nwhile n > 0:\n    print(n)\n```',
        'Nothing inside this loop ever changes `n`. What happens when it runs?',
      ],
      options: [
        {
          text: 'It prints `3` once and stops',
          why: 'A `while` loop rechecks its condition every single time through — and `n` is still 3 after the first print, so the condition is still True.',
        },
        {
          text: 'It runs forever, printing `3` over and over, until something stops it',
          correct: true,
          why: 'Correct. `n > 0` never becomes False because nothing in the loop changes `n`. This program does not fix itself.',
        },
        {
          text: 'Python detects the mistake and raises an error before running',
          why: 'Python cannot know in advance whether a loop will end — there is no rule it can check for that. It only finds out by actually running.',
        },
        {
          text: 'It counts down from 3 to 0 automatically',
          why: 'Nothing counts down on its own. A variable only changes where you write code that changes it.',
        },
      ],
      explain: 'This is called a **runaway loop**, and it is one of the most common bugs anyone writes. This lab cannot let a truly infinite loop lock up your browser tab, so it watches for one — you are about to meet that safety net for real.',
      continueLabel: 'Meet the runaway loop →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'repair',
      task: 't4',
      eyebrow: 'Scene 05 — Stop a runaway loop',
      title: 'This loop will not stop on its own',
      body: [
        'This is the exact loop from the last checkpoint — for real this time. Run it. It will **not** finish by itself.',
        'After a few seconds a **■ Stop** button will appear next to Run. Click it — that is the only way to interrupt a program running in your browser. Then look at what Python reports, and fix the loop so it counts down properly instead.',
      ],
      filename: 'countdown.py',
      code: 'n = 3\nwhile n > 0:\n    print(n)',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '3\n2\n1' }],
      hints: [
        'Once you click Stop, read the message. It tells you plainly what happened — you interrupted it, Python did not crash on its own.',
        'The real bug is inside the loop body: `n` is printed, but nothing about `n` ever changes.',
        'Add a line inside the loop that makes `n` smaller each time: `n -= 1` (short for `n = n - 1`).',
      ],
      solution: '`n = 3`\n`while n > 0:`\n`    print(n)`\n`    n -= 1` — the last line is what was missing.',
      successMessage: 'Fixed — and you also just used the emergency stop for real. Every loop needs a condition that a value inside the loop actually moves toward becoming False.',
      successExtra: 'This is not a workaround or a bug in the lab — a truly endless loop cannot be interrupted from inside the same thread that is running it, so Stop works by restarting the Python engine underneath you. Your code is safe; only the runaway program is discarded.',
      continueLabel: 'Find a quieter bug →',
    },

    /* ---------------- SCENE 6 ---------------- */
    {
      id: 's6',
      type: 'detective',
      task: 't5',
      eyebrow: 'Scene 06 — Code detective',
      title: 'Find the exact fault',
      body: [
        'This program is supposed to add up the numbers 0 through 4. Run it, read the evidence, then click the exact part of the code responsible.',
      ],
      code: 'total = 0\nfor number in range(5):\n    total = total + numbr\nprint(total)',
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'Now click the exact part of the code Python is complaining about.',
      fault: { text: 'numbr', nth: 1 },
      decoys: [
        { text: 'number', nth: 1, why: 'That name is spelled correctly and created properly by the `for`. It is not the fault.' },
        { text: 'total', nth: 1, why: '`total` is a real variable, created on the line above. Nothing wrong with it here.' },
        { text: 'range', nth: 1, why: '`range(5)` is doing exactly what it should — producing five values for the loop. Look at what happens *inside* the loop.' },
      ],
      explain: 'Two names that look alike are still two different names to Python: the loop created `number`, but the addition tries to use `numbr` — one letter short, and never defined.',
      successMessage: 'Correct. Same shape of bug as Missions 02 and 03: a name that almost matches is not a match at all.',
      continueLabel: 'Complete a range() call →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'fill',
      task: 't6',
      eyebrow: 'Scene 07 — Code completion',
      title: 'Count from 2 up to 5',
      body: [
        '`range()` can take two numbers: a start and a stop. Fill in the call so this prints `2`, `3`, `4`, `5` — four lines.',
      ],
      template: 'for i in range(____):\n    print(i)',
      blankLabel: 'Start and stop, separated by a comma',
      placeholder: '…',
      note: 'The stop value in range() is never included in the output — remember Scene 02.',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '2\n3\n4\n5' }],
      hints: [
        'You need two numbers this time, separated by a comma: `range(start, stop)`.',
        'To include 5 in the output, the stop value has to be one more than 5.',
        'The finished call is `range(2, 6)`.',
      ],
      solution: '`2, 6` — so the line reads `for i in range(2, 6):`.',
      explain: '`range(2, 6)` produces 2, 3, 4, 5 — it starts at the first number and stops *before* the second one, the same off-by-one shape as `range(5)` starting at 0.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'assemble',
      task: 't7',
      eyebrow: 'Scene 08 — Code forge',
      title: 'Assemble a loop',
      body: [
        'A `for` loop can fit on one line when its body is short. Assemble a line that prints `0`, `1`, `2`.',
      ],
      blocks: ['for', ' i in range(3): ', 'print', '(', 'i', ')', ' i in range(3, 3): '],
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '0\n1\n2' }],
      retryMessage: 'It runs, but it does not print exactly `0`, `1`, `2` — check which range() block you used.',
      successMessage: 'Assembled correctly. On one line, the block after the colon is just `print(i)` — no indentation needed because there is nothing to indent under.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 9 ---------------- */
    {
      id: 's9',
      type: 'build',
      task: 't8',
      eyebrow: 'Scene 09 — Build a program that repeats',
      title: 'Add up the numbers 1 to 5',
      body: [
        'Empty file. Use a loop to add the numbers 1 through 5 together, then print the total.',
        'Watch the memory panel — it will show your running total changing on every loop.',
      ],
      filename: 'total.py',
      code: '# Use a loop to add 1 + 2 + 3 + 4 + 5, then print the total.\n\n',
      showMemory: true,
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\bfor\\b|\\bwhile\\b', label: 'Uses a loop (for or while)' },
        { rule: 'codeMatches', pattern: '\\brange\\(', label: 'Uses range() to count' },
        { rule: 'stdoutEquals', value: '15', label: 'Prints the correct total, 15' },
      ],
      hints: [
        'Start a variable at 0 before the loop begins — that is where the running total lives.',
        'Inside the loop, add the current number to that variable: `total = total + i`.',
        'Use `range(1, 6)` so the loop actually reaches 5 — remember, the stop value is never included.',
      ],
      solution: '`total = 0`\n`for i in range(1, 6):`\n`    total = total + i`\n`print(total)`',
      successMessage: 'That loop did five additions in four lines of code — and the exact same shape adds up 5 numbers or 5 million with no changes at all.',
      explain: 'A running total inside a loop is one of the most common patterns in programming: start at a known value, then update it a little on every pass.',
      continueLabel: 'Complete mission →',
    },
  ],
};
