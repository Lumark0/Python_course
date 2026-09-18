/**
 * MISSION 05 — DECISION LAB
 *
 * Pure data — see m01-first-code.js for the shape contract.
 */
export default {
  id: 'm05',
  code: 'MISSION 05',
  name: 'Decision Lab',
  objective: 'Teach the program to choose.',
  summary: 'if / elif / else, comparison operators, indentation.',
  concepts: ['if', 'comparison', 'blocks'],
  minutes: 25,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Compare two values' },
    { id: 't2', label: 'Run your first if statement' },
    { id: 't3', label: 'Change the outcome' },
    { id: 't4', label: 'Repair a broken condition' },
    { id: 't5', label: 'Find a fault in an elif chain' },
    { id: 't6', label: 'Complete a comparison' },
    { id: 't7', label: 'Assemble a comparison' },
    { id: 't8', label: 'Write a program that decides' },
  ],

  outcomes: [
    'Write comparisons with >, <, ==, >=, <=',
    'Use if / elif / else to run code conditionally',
    'Explain why indentation decides what belongs to a block',
    'Diagnose a broken condition',
    'Write a program with a real decision in it',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — Questions with yes/no answers',
      title: 'A comparison is a question Python can answer',
      body: [
        'Every decision starts with a question that is either true or false. Python calls that answer a `bool` — `True` or `False` — and it comes from comparing two values with `>`, `<`, `==`, `>=`, `<=`, or `!=`.',
        'Send a few comparisons to the machine and see what comes back.',
      ],
      machine: {
        idle: 'awaiting comparison',
        prompt: 'Choose a comparison to send:',
        commands: [
          {
            id: 'gt', label: '5 > 3', understood: true,
            screen: 'True',
            note: '5 really is greater than 3, so the answer is `True`. Comparisons always produce exactly one of two values.',
          },
          {
            id: 'eq', label: '5 == 6', understood: true,
            screen: 'False',
            note: '`==` asks "are these equal?" — it is a question, not an assignment. `5` and `6` are not equal, so `False`.',
          },
          {
            id: 'confuse', label: '5 = 6', understood: false,
            screen: "SyntaxError: cannot assign to literal here",
            note: 'A single `=` tries to *store* 6 into 5 — which makes no sense, since 5 is not a name. Asking "are they equal" needs `==`, two equals signs.',
          },
        ],
        successNote: 'A comparison always answers `True` or `False` — nothing else. That answer is what an `if` statement will act on.',
      },
      continueLabel: 'Let a program decide →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'run',
      task: 't2',
      eyebrow: 'Scene 02 — The if statement',
      title: 'Code that runs only sometimes',
      body: [
        'The indented line only runs if the comparison after `if` is `True`. No colon, no indentation, no conditional run — all three are required.',
        'Predict the output before running.',
      ],
      code: 'age = 20\nif age >= 18:\n    print("Adult")',
      readonly: true,
      pipeline: true,
      anatomy: [
        { part: 'if', kind: 'kw', label: 'only continue into the block below if this is True' },
        { part: 'age >= 18', kind: 'op', label: 'the comparison — this is what gets checked' },
        { part: ':', kind: 'punct', label: 'marks the start of the block' },
        { part: '    print("Adult")', kind: 'plain', label: 'indented — this belongs to the if' },
      ],
      predict: {
        question: 'age is 20. What does this program print?',
        options: [
          { text: '`Adult`', correct: true },
          { text: '`age >= 18`' },
          { text: '`True`' },
          { text: 'Nothing — the block never runs' },
        ],
        explainRight: 'Right. `20 >= 18` is `True`, so Python enters the indented block and runs the `print` inside it.',
        explainWrong: 'Run it and see. The comparison is what decides whether the indented line runs at all.',
      },
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Adult' }],
      successMessage: 'The indentation is not decoration — it is what tells Python which lines belong inside the `if`. Only those lines are conditional; everything else always runs.',
      continueLabel: 'Take the controls →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't3',
      eyebrow: 'Scene 03 — Experiment',
      title: 'Change what triggers the message',
      body: [
        'Edit the temperature, the comparison, or the message — anything you like — and prove the output changed because of what you wrote.',
      ],
      code: 'temperature = 30\nif temperature > 25:\n    print("It is hot")',
      baselineOutput: 'It is hot',
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'print', min: 1 },
        { rule: 'stdoutDiffersFrom', value: 'It is hot', label: 'The output is different from the original' },
      ],
      retryMessage: 'Still prints "It is hot". Change the temperature, the comparison, or the text.',
      successMessage: 'The block only ran because the comparison was True for the value you gave it — that link is the entire idea of a decision.',
      continueLabel: 'Continue →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'quiz',
      eyebrow: 'Scene 04 — Checkpoint',
      title: 'You forget to indent the line under if. What happens?',
      body: [
        '```\nif age >= 18:\nprint("Adult")\n```',
        'The `print` line lines up exactly with `if` — no indentation at all. What happens when this runs?',
      ],
      options: [
        {
          text: 'It prints `Adult` regardless of age, since indentation is just style',
          why: 'Indentation is never just style in Python — it is how the language knows which lines belong to the block.',
        },
        {
          text: 'It runs fine and behaves exactly like the indented version',
          why: 'It does not run at all. Python cannot find the block it was promised after the colon.',
        },
        {
          text: 'IndentationError — Python expected an indented block after the `if`',
          correct: true,
          why: 'Correct. A colon promises an indented block on the next line. With no indentation, Python has nothing to put inside the `if` and refuses to guess.',
        },
        {
          text: 'SyntaxError, because the colon is missing',
          why: 'The colon is there. The problem is what comes after it — or rather, what does not.',
        },
      ],
      explain: 'Indentation in Python is not a style choice, the way it is in many other languages — it is the actual syntax that defines a block. Get it wrong and the program will not run at all.',
      continueLabel: 'Break something →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'repair',
      task: 't4',
      eyebrow: 'Scene 05 — Break it',
      title: 'A comparison that is actually an assignment',
      body: [
        'This should print `Exactly 18` when age is 18. Run it, read the error, then repair it.',
      ],
      filename: 'broken.py',
      code: 'age = 18\nif age = 18:\n    print("Exactly 18")',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Exactly 18' }],
      hints: [
        'Read the error closely — Python often tells you exactly which symbol it thinks you meant.',
        'A single `=` stores a value. A question that asks "are these equal?" needs a different symbol.',
        'Change `if age = 18:` to `if age == 18:` — two equals signs.',
      ],
      solution: '`if age == 18:` — `==` asks a question, `=` gives an instruction.',
      successMessage: 'Fixed. `=` and `==` look almost identical and do completely different jobs — this mix-up is one of the most common early mistakes in Python.',
      successExtra: 'Python actually noticed the shape of your mistake and suggested `==` in the error message itself — it will do that for this exact mix-up.',
      continueLabel: 'Harder case →',
    },

    /* ---------------- SCENE 6 ---------------- */
    {
      id: 's6',
      type: 'detective',
      task: 't5',
      eyebrow: 'Scene 06 — Code detective',
      title: 'Find the exact fault',
      body: [
        'This program grades an exam score using `if` / `elif`. Run it, read the evidence, then click the exact character responsible.',
      ],
      code: 'score = 85\nif score >= 90:\n    grade = "A"\nelif score = 80:\n    grade = "B"\nprint(grade)',
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'Now click the exact character Python is complaining about.',
      fault: { index: 54, length: 1 },
      decoys: [
        { text: '>=', nth: 1, why: '`>=` is a real comparison operator, used correctly here. It is not the fault.' },
        { index: 6, length: 1, why: 'That `=` is a normal assignment — `score` is being given the value 85. Perfectly legal.' },
        { text: 'elif', nth: 1, why: '`elif` itself is spelled correctly and used in the right place. Look at what follows it.' },
      ],
      explain: 'A condition after `if` or `elif` has to be a question — something that produces `True` or `False`. A single `=` tries to *assign* inside the condition, which Python does not allow. It needed `==`.',
      successMessage: 'Correct diagnosis. Same mistake as the repair scene, but this time you had to spot it yourself, buried inside an `elif` chain.',
      continueLabel: 'Complete a comparison →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'fill',
      task: 't6',
      eyebrow: 'Scene 07 — Code completion',
      title: 'Complete the comparison',
      body: [
        'The temperature is 15. Fill in the comparison so the program prints `Cold`.',
      ],
      template: 'temperature = 15\nif temperature ____ 20:\n    print("Cold")',
      blankLabel: 'Which comparison makes this True when temperature is 15?',
      placeholder: '…',
      note: 'You have five choices: `>`, `<`, `==`, `>=`, `<=`. Only some of them are True when temperature is 15.',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Cold' }],
      hints: [
        '15 needs to be *less than* 20 for this to be True.',
        'The symbol for "less than" is a single character.',
        'The finished line reads `if temperature < 20:`.',
      ],
      solution: '`<` — so the line reads `if temperature < 20:`.',
      explain: 'Any comparison that evaluates to `True` for 15 would technically make the block run — `<` and `<=` both work here, `<` is simply the most direct.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'assemble',
      task: 't7',
      eyebrow: 'Scene 08 — Code forge',
      title: 'Assemble a comparison',
      body: [
        'All the pieces you need are below — plus one that points the wrong way.',
        'Assemble a line that prints whether 10 is greater than 3, then run it.',
      ],
      blocks: ['print', '(', '10', '>', '3', ')', '<'],
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'True' }],
      retryMessage: 'It runs, but the output is not `True` — check which direction the comparison points.',
      successMessage: '`10 > 3` really is true, so Python prints the word `True` — the exact same value an `if` statement checks behind the scenes.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 9 ---------------- */
    {
      id: 's9',
      type: 'build',
      task: 't8',
      eyebrow: 'Scene 09 — Build a program that decides',
      title: 'Write a program with a real decision',
      body: [
        'The starting score is given for you — leave it as `42`. Write an `if` / `else` that prints `Pass` when the score is 50 or higher, and `Fail` otherwise.',
        'With `score = 42`, your program should print `Fail`.',
      ],
      filename: 'grade.py',
      code: '# score is given for you — do not change it.\nscore = 42\n\n# Print "Pass" if score is 50 or higher, otherwise print "Fail".\n',
      showMemory: true,
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\bif\\b', label: 'Uses an if statement' },
        { rule: 'codeMatches', pattern: '\\belse\\b', label: 'Uses an else branch' },
        { rule: 'codeMatches', pattern: 'score\\s*(>=|<=|[<>])', label: 'Compares score using a comparison operator' },
        { rule: 'stdoutEquals', value: 'Fail', label: 'Prints Fail for a score of 42' },
      ],
      hints: [
        'You need an `if` for one outcome and an `else` for the other — every score falls into exactly one of them.',
        'The condition should compare `score` to 50 using `>=`.',
        'Shape: `if score >= 50:` then an indented `print("Pass")`, then `else:` then an indented `print("Fail")`.',
      ],
      solution: '`if score >= 50:`\n`    print("Pass")`\n`else:`\n`    print("Fail")`',
      successMessage: 'That is a program that genuinely decides — the exact same shape works whether the score is 3 or 99, because the condition is doing the work, not you.',
      explain: 'Every decision-making program you will ever write is built from exactly this: a comparison, and code that only runs when it matters.',
      continueLabel: 'Complete mission →',
    },
  ],
};
