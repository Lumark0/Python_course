/**
 * MISSION 01 — YOUR FIRST CODE
 *
 * Pure data. Nothing in this file knows how the app renders, stores or
 * validates anything; it only declares scenes, the activity type each one
 * uses, and the rules that decide when a learner has met the objective.
 * A new mission is a copy of this shape.
 */
export default {
  id: 'm01',
  code: 'MISSION 01',
  name: 'Your First Code',
  objective: 'Teach the computer to speak.',
  summary: 'Programming, `print()`, text, running code — and your first error.',
  concepts: ['instructions', 'print()', 'strings', 'statements', 'errors'],
  minutes: 20,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Command the machine' },
    { id: 't2', label: 'Run your first program' },
    { id: 't3', label: 'Change the message' },
    { id: 't4', label: 'Repair broken code' },
    { id: 't5', label: 'Identify a fault' },
    { id: 't6', label: 'Complete missing code' },
    { id: 't7', label: 'Assemble a line' },
    { id: 't8', label: 'Write your own program' },
  ],

  outcomes: [
    'Run Python code',
    'Modify code and predict the result',
    'Identify an error',
    'Repair broken code',
    'Write your own program',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — Enter the lab',
      title: 'A computer does exactly what it is told',
      body: [
        'This machine has no idea what you want. It cannot guess, infer or assume. It can only follow an instruction it recognises, **exactly** as written.',
        'Try giving it one.',
      ],
      machine: {
        idle: 'awaiting instruction',
        prompt: 'Choose an instruction to send:',
        commands: [
          {
            id: 'vague1', label: 'Say something nice', understood: false,
            screen: 'I do not understand that instruction.',
            note: 'A person would manage this easily. The machine cannot: "something nice" is not an instruction it knows.',
          },
          {
            id: 'vague2', label: 'Show the message', understood: false,
            screen: 'WHICH message?',
            note: 'Closer — but the machine has no idea *which* message. Nothing was specified.',
          },
          {
            id: 'exact', label: 'print("Hello, Python!")', understood: true,
            screen: 'Hello, Python!',
            note: 'That worked. The instruction named the action (`print`) **and** the exact thing to act on. That is what a line of Python is.',
          },
        ],
        successNote: 'That worked — the instruction named both the action and the exact thing to act on.',
      },
      continueLabel: 'Now let me run that for real →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'run',
      task: 't2',
      eyebrow: 'Scene 02 — Give the computer an instruction',
      title: 'Your first program',
      body: [
        'Below is a complete Python program. One line, one instruction.',
        'Before you run it, commit to what you think will happen. Running code you have not predicted teaches you nothing — you just watch.',
      ],
      code: 'print("Hello, Python!")',
      readonly: true,
      pipeline: true,
      anatomy: [
        { part: 'print', kind: 'fn', label: 'the action — show something' },
        { part: '(', kind: 'punct', label: 'start of what you give it' },
        { part: '"Hello, Python!"', kind: 'str', label: 'a string — text, marked by quotes' },
        { part: ')', kind: 'punct', label: 'end of what you give it' },
      ],
      predict: {
        question: 'When this runs, what appears in the terminal?',
        options: [
          { text: '`print("Hello, Python!")`' },
          { text: '`Hello, Python!`', correct: true },
          { text: '`"Hello, Python!"` — including the quotes' },
          { text: 'Nothing. The program has no output.' },
        ],
        explainRight: 'Exactly. The quotes mark where the text starts and ends — they are instructions to Python, not part of the message.',
        explainWrong: 'Run it and find out. The interpreter is the referee, not me.',
      },
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Hello, Python!' }],
      successMessage: 'Excellent. Your program executed successfully. Look at the diagram above: your text went **into** a real Python interpreter, and the output came **out** the other side.',
      successExtra: 'That interpreter is CPython, compiled to WebAssembly and running inside this browser tab. Nothing was sent to a server.',
      continueLabel: 'Take the controls →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't3',
      eyebrow: 'Scene 03 — Experiment',
      title: 'Change the message',
      body: [
        'The program is yours now. Edit the text between the quotation marks into anything you like, then run it.',
        'Keep the quotes. Everything between them is yours.',
      ],
      code: 'print("Hello, Python!")',
      baselineOutput: 'Hello, Python!',
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'print', min: 1 },
        { rule: 'stdoutDiffersFrom', value: 'Hello, Python!', label: 'The output is different from the original' },
      ],
      retryMessage: 'It still prints the original message. Change the text between the quotes.',
      successMessage: 'That is your program now. You edited real source code, a real interpreter read it, and the output changed because of what you wrote.',
      continueLabel: 'Continue →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'quiz',
      eyebrow: 'Scene 04 — Checkpoint',
      title: 'What does Python do before it runs anything?',
      body: [
        'Imagine a three-line program. Line 1 prints something. Line 2 contains a spelling mistake that breaks Python\'s rules. Line 3 prints something else.',
        'You run it. What appears?',
      ],
      options: [
        {
          text: 'Line 1 prints, then the error appears, then it stops.',
          why: 'A very reasonable guess — but no. Python reads and checks the **whole file** before running a single line. Nothing ran at all.',
        },
        {
          text: 'Nothing prints. Only the error appears.',
          correct: true,
          why: 'Correct. Python checks the grammar of the entire file first. If that check fails, execution never begins — so line 1 never got the chance to print.',
        },
        {
          text: 'All three lines run; Python skips the bad one.',
          why: 'Python never skips a line it cannot understand. It refuses to start.',
        },
        {
          text: 'Python corrects the mistake and carries on.',
          why: 'Nothing corrects your code for you. That is the job you are learning.',
        },
      ],
      explain: 'This distinction matters constantly: a **syntax error** means nothing ran, while a **runtime error** means the program got partway and then stopped. You will see both today.',
      continueLabel: 'Break something →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'repair',
      task: 't4',
      eyebrow: 'Scene 05 — Break it',
      title: 'The program is broken. Repair it.',
      body: [
        'This program will not run. Run it anyway — read what Python says, then fix it.',
        'It should print exactly `Hello, Python!`.',
      ],
      filename: 'broken.py',
      code: 'print("Hello, Python!"',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Hello, Python!' }],
      hints: [
        'Read the error message first. Python is telling you which character it was still waiting for.',
        'Count the brackets on that line. How many `(` are there? How many `)`?',
        'The closing bracket belongs at the very end of the line — after the closing quotation mark.',
      ],
      solution: '`print("Hello, Python!")` — the `)` goes last, after the quote.',
      successMessage: 'You found the error. Debugging is a major part of programming — most of the job, honestly.',
      successExtra: 'Notice what the error told you: not "line 1 is wrong" but *which character was missing*. Error messages are instructions, not insults.',
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
        'Three lines. One of them breaks the program — but the error message may point somewhere else entirely.',
        'Run it, read the evidence, then click the exact part of the code that is responsible.',
      ],
      code: 'print("Diagnostics complete")\nprint("Result: OK"\nprint("Shutting down")',
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'Now click the exact character that caused this.',
      fault: { text: '(', nth: 2 },
      decoys: [
        { text: 'print', nth: 1, why: 'Line 1 is complete and correct — a bracket opened and a bracket closed.' },
        { text: '"Result: OK"', nth: 1, why: 'The text itself is fine: the quotes open and close properly. Look at what surrounds it.' },
        { text: 'print', nth: 3, why: 'Line 3 only *looks* guilty. It is innocent — it simply arrived while Python was still waiting for line 2 to finish.' },
      ],
      explain: 'Python reports where it **gave up**, which is often after the real mistake. An unclosed bracket on line 2 swallowed line 3 into an unfinished statement. Rule of thumb: when an error points at a line that looks perfect, check the line above it.',
      successMessage: 'Correct. You read the evidence rather than guessing — that is the whole skill.',
      continueLabel: 'Complete the code →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'fill',
      task: 't6',
      eyebrow: 'Scene 07 — Code completion',
      title: 'Complete the missing code',
      body: [
        'One line, one gap. Put something in it that makes the program print a message.',
        'Whatever you type runs exactly as written — so if it is wrong, Python will tell you why.',
      ],
      template: 'print(____)',
      blankLabel: 'Complete the line',
      placeholder: '…',
      note: 'Tip: try it without quotation marks first, and read what Python says. That mistake is worth making once.',
      check: [
        { rule: 'noError' },
        { rule: 'stdoutNotEmpty' },
        { rule: 'codeMatches', pattern: '^print\\(\\s*(["\']).+\\1\\s*\\)$', label: 'The gap holds text wrapped in quotation marks' },
      ],
      hints: [
        'Python treats a bare word as the *name of something it already knows*. It does not know your word.',
        'Text has to be marked as text. That is what quotation marks are for.',
        'The shape you want is `print("your text")`.',
      ],
      solution: 'For example `print("Ali")` — the quotation marks are what make it text rather than a name.',
      explain: 'Quotes are the difference between a **name** and a **value**. `Ali` asks Python "what is stored under the name Ali?". `"Ali"` simply *is* the text Ali.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'assemble',
      task: 't7',
      eyebrow: 'Scene 08 — Code forge',
      title: 'Build the line from parts',
      body: [
        'All the characters you need are below — plus some that do not belong.',
        'Assemble a line that prints exactly `Lab systems ready`, then run it.',
      ],
      blocks: ['print', 'Print', '(', '"Lab systems ready"', 'Lab systems ready', ')'],
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Lab systems ready' }],
      retryMessage: 'It runs, but the output is not exactly `Lab systems ready`.',
      successMessage: 'Assembled correctly. Note what the rejected blocks taught you: `Print` is not `print` (Python is case-sensitive), and text without quotes is treated as a name.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 9 ---------------- */
    {
      id: 's9',
      type: 'build',
      task: 't8',
      eyebrow: 'Scene 09 — Build your first program',
      title: 'Write a program that introduces you',
      body: [
        'Empty file. No template. Write a program that prints **three** things: your name, your school or training centre, and one thing you like.',
        'You already know everything you need. Run it as often as you want — that is what the Run button is for.',
      ],
      filename: 'about_me.py',
      code: '# Write your program below.\n# Three lines, three messages.\n\n',
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'print', min: 3, label: 'Uses `print()` at least three times' },
        { rule: 'stdoutLines', min: 3, label: 'Prints at least three lines' },
        { rule: 'stdoutDistinctLines', min: 3, label: 'The three lines say different things' },
        {
          rule: 'customText', count: 3, minLength: 2,
          exclude: ['Hello, Python!', 'Lab systems ready', 'your text', 'name', 'Write your program below.'],
          label: 'Contains three pieces of your own text',
        },
      ],
      hints: [
        'One instruction per line. Three lines means three `print(...)` statements.',
        'Each one looks exactly like the first program you ran: `print("...")`.',
        'If a line is not printing, check that its brackets and quotes are both closed.',
      ],
      solution: 'Something like:\n`print("Ali")`\n`print("Lahore Training Centre")`\n`print("Football")`',
      successMessage: 'That is a program you wrote from an empty file. It runs, and it does what the brief asked.',
      explain: 'You have now done every part of the programming loop: write, run, read the output, fix, repeat. Everything after this is new vocabulary inside that same loop.',
      continueLabel: 'Complete mission →',
    },
  ],
};
