/**
 * MISSION 10 — PYTHON PROJECT
 *
 * Pure data — see m01-first-code.js for the shape contract. Deliberately
 * different in shape from the missions before it: no new syntax, no
 * predict-then-run, no fill-in-the-blank. Everything here is `build` —
 * open-ended synthesis of everything Missions 01–09 taught, ending in a
 * project with no fixed answer at all.
 */
export default {
  id: 'm10',
  code: 'MISSION 10',
  name: 'Python Project',
  objective: 'Build something that is yours.',
  summary: 'Combine variables, input, decisions, loops, lists and functions into one working program.',
  concepts: ['project', 'synthesis'],
  minutes: 35,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Recap what you know' },
    { id: 't2', label: 'Combine input with a decision' },
    { id: 't3', label: 'Combine a list, a loop and a function' },
    { id: 't4', label: 'Write a function used more than once' },
    { id: 't5', label: 'Build a project of your own' },
  ],

  outcomes: [
    'Combine input(), conversion and if / elif / else in one program',
    'Combine a list, a loop and a function in one program',
    'Write and reuse a function with several parameters',
    'Plan and build an original program from nothing',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — Everything you already have',
      title: 'Nine missions, one toolbox',
      body: [
        'Every tool in this final mission is one you have already used for real, at least once. Nothing new is being introduced — the only new skill is combining them on your own.',
        'Look back at what each group of tools lets you do.',
      ],
      machine: {
        idle: 'reviewing the toolbox',
        prompt: 'Choose a group to review:',
        commands: [
          {
            id: 'talk', label: 'Talking with someone', understood: true,
            screen: 'print() shows something. input() asks for something. Whatever input() gives back is text, until you convert it.',
            note: 'Missions 01 and 04. Every program that reacts to a person starts here.',
          },
          {
            id: 'decide', label: 'Making a decision', understood: true,
            screen: 'if / elif / else run a block only when a comparison is True. Indentation decides what belongs to which block.',
            note: 'Mission 05. Any program that behaves differently depending on a value uses this.',
          },
          {
            id: 'repeat', label: 'Repeating and storing many things', understood: true,
            screen: 'for and while repeat a block. Lists hold many values in order, indexed from 0. Functions package up a block of your own under a name you choose.',
            note: 'Missions 06, 07 and 08. This is how a program handles more than a handful of values without becoming a wall of copy-pasted lines.',
          },
        ],
        successNote: 'Three groups, nine missions, one toolbox. This mission is entirely about reaching for the right tool yourself, with nobody telling you which one.',
      },
      continueLabel: 'Combine two of them →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'build',
      task: 't2',
      eyebrow: 'Scene 02 — Input meets decision',
      title: 'Build a number categorizer',
      body: [
        'Write a program that asks the user to type a whole number, then prints exactly one of `Negative`, `Zero`, or `Positive`, depending on what they typed.',
        'Use the Inputs panel to test your program with different numbers — try a negative one, `0`, and a positive one before you move on.',
      ],
      filename: 'categorize.py',
      code: '# Ask for a whole number, convert it, then print\n# "Negative", "Zero", or "Positive".\n\n',
      stdin: ['-5'],
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'input', min: 1, label: 'Asks for input at least once' },
        { rule: 'codeMatches', pattern: '\\bint\\(\\s*input\\(', label: 'Converts the typed text to a number' },
        { rule: 'codeMatches', pattern: '\\bif\\b', label: 'Uses if to branch on the value' },
        { rule: 'codeMatches', pattern: '\\belif\\b|\\belse\\b', label: 'Handles more than one outcome' },
      ],
      hints: [
        'Start the same way Mission 04 did: `n = int(input("..."))`.',
        'Three possible outcomes means either two comparisons (`if` / `elif` / `else`) or one comparison plus a fallback.',
        'A typical shape: `if n < 0:` → print Negative, `elif n == 0:` → print Zero, `else:` → print Positive.',
      ],
      solution: '`n = int(input("Enter a number: "))`\n`if n < 0:`\n`    print("Negative")`\n`elif n == 0:`\n`    print("Zero")`\n`else:`\n`    print("Positive")`',
      successMessage: 'That program genuinely listens and decides — change the Inputs panel to any number and it responds correctly, because the logic does the work, not you.',
      explain: 'Notice what was NOT specified: exactly how to phrase the prompt, or in which order to check the cases. Real programming has that freedom constantly — the mission brief describes behaviour, not exact code.',
      continueLabel: 'Combine three tools at once →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'build',
      task: 't3',
      eyebrow: 'Scene 03 — List, loop and function',
      title: 'Build a totals report',
      body: [
        'The list `temperatures` is given. Write a function called `total_of` that takes a list of numbers and returns their sum. Then, using a loop, print every temperature on its own line, and finally print the total returned by your function.',
        'With the given list, the finished output is five temperatures followed by `113`.',
      ],
      filename: 'report.py',
      code: 'temperatures = [21, 19, 25, 30, 18]\n\n# Define total_of(numbers), returning the sum of the list.\n\n# Then print each temperature with a loop, and print the total.\n',
      showMemory: true,
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\bdef\\s+total_of\\s*\\(', label: 'Defines total_of(...)' },
        { rule: 'codeMatches', pattern: '\\breturn\\b', label: 'total_of returns a value' },
        { rule: 'codeMatches', pattern: '\\bfor\\b', label: 'Uses a loop to print each temperature' },
        { rule: 'stdoutEquals', value: '21\n19\n25\n30\n18\n113' },
      ],
      hints: [
        '`total_of` needs its own running total inside it, built the same way Mission 06\'s loop-total scene did — then `return` it.',
        'The printing loop and the function are two separate pieces: `for t in temperatures: print(t)`, then a call to `total_of(temperatures)`.',
        'Order matters for the output: all five temperatures first, then the total on its own line, from `print(total_of(temperatures))`.',
      ],
      solution: '`def total_of(numbers):`\n`    total = 0`\n`    for n in numbers:`\n`        total = total + n`\n`    return total`\n\n`for t in temperatures:`\n`    print(t)`\n`print(total_of(temperatures))`',
      successMessage: 'Three separate skills, one program: a list to hold the data, a loop to report it, and a function to calculate something from it. This is what most real programs actually look like underneath.',
      continueLabel: 'Reuse a function twice →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'build',
      task: 't4',
      eyebrow: 'Scene 04 — One function, used twice',
      title: 'Build a receipt line generator',
      body: [
        'Write a function called `make_receipt` that takes an item name, a price, and a quantity, and **returns** a line like `Pen: $6` (price multiplied by quantity, with a dollar sign, no decimal shown).',
        'Call it twice, with different items, and print both results:\n`make_receipt("Pen", 2, 3)` should return `Pen: $6`.\n`make_receipt("Notebook", 5, 2)` should return `Notebook: $10`.',
      ],
      filename: 'receipt.py',
      code: '# Define make_receipt(item, price, quantity) so it RETURNS\n# a line like "Pen: $6" — do not print inside the function.\n\n# Then call it twice and print both results.\n',
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\bdef\\s+make_receipt\\s*\\(', label: 'Defines make_receipt(...)' },
        { rule: 'codeMatches', pattern: '\\breturn\\b', label: 'make_receipt returns a value, rather than printing inside it' },
        { rule: 'callCount', name: 'make_receipt', min: 2, label: 'Calls make_receipt at least twice' },
        { rule: 'stdoutEquals', value: 'Pen: $6\nNotebook: $10' },
      ],
      hints: [
        'Inside the function: multiply price by quantity first, store it, then build the text with `+` — the same pattern as joining any number into a sentence since Mission 03.',
        'Remember `str()` — you cannot join a number directly onto text with `+`.',
        'A working shape: `return item + ": $" + str(price * quantity)`.',
      ],
      solution: '`def make_receipt(item, price, quantity):`\n`    return item + ": $" + str(price * quantity)`\n\n`print(make_receipt("Pen", 2, 3))`\n`print(make_receipt("Notebook", 5, 2))`',
      successMessage: 'One function, called with completely different values each time, producing a correctly formatted line both times. That reuse is the entire reason functions exist.',
      continueLabel: 'Build something of your own →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'build',
      task: 't5',
      eyebrow: 'Scene 05 — Your project',
      title: 'Build a program from your own idea',
      body: [
        'No template, no fixed target output. Build a small program that solves a real (even tiny) problem, using **at least three** of the tools from this course: `input()`, `if` / `elif` / `else`, a loop, a list, or a function.',
        'Ideas, if you want one: a simple quiz that scores itself, a shopping list that totals a bill, a program that classifies a person\'s age into a life stage, a tip calculator, a small text adventure with one decision. Or build something entirely your own.',
      ],
      filename: 'project.py',
      code: '# Your project. Use at least three of: input(), if/elif/else,\n# a loop, a list, a function. Comment briefly on what it does.\n\n',
      showMemory: true,
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'print', min: 2, label: 'Prints at least twice' },
        {
          rule: 'customText', count: 2, minLength: 2,
          label: 'Contains at least two pieces of your own text',
        },
      ],
      hints: [
        'Pick one idea and start small — a working three-line program beats an ambitious one that never runs.',
        'Build it in pieces: get one part printing correctly before adding the next tool on top of it.',
        'If you are stuck for an idea, revisit Scene 02 (input + decisions) or Scene 03 (list + loop + function) and change the subject to something you care about.',
      ],
      solution: 'There is no single solution here — any working program using at least three of the tools listed satisfies this mission.',
      successMessage: 'That is a program built from your own idea, using tools you learned one at a time and just combined yourself. That is the actual job, from here on.',
      explain: 'Every mission before this one had a brief written for you. From now on, most of the work is deciding what the brief even is — this scene was a first, small taste of that.',
      continueLabel: 'Complete the course →',
    },
  ],
};
