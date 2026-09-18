/**
 * MISSION 03 — DATA TYPE LAB
 *
 * Pure data — see m01-first-code.js for the shape contract.
 */
export default {
  id: 'm03',
  code: 'MISSION 03',
  name: 'Data Type Lab',
  objective: 'Learn what kind of thing a value is.',
  summary: 'str, int, float, bool, conversion.',
  concepts: ['types', 'int', 'str', 'float', 'bool'],
  minutes: 20,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Tell text apart from numbers' },
    { id: 't2', label: 'Ask Python for a type' },
    { id: 't3', label: 'Change a value’s type' },
    { id: 't4', label: 'Repair a type mismatch' },
    { id: 't5', label: 'Find a str + int bug' },
    { id: 't6', label: 'Convert text to a number' },
    { id: 't7', label: 'Assemble a conversion' },
    { id: 't8', label: 'Mix text and numbers correctly' },
  ],

  outcomes: [
    'Explain why `+` behaves differently on text and numbers',
    'Ask Python for a value’s type',
    'Convert text to a number with `int()` / `float()`',
    'Diagnose a str + int TypeError',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'concept',
      task: 't1',
      eyebrow: 'Scene 01 — Same symbol, two jobs',
      title: '`+` does not always mean the same thing',
      body: [
        'Quotation marks change what a value *is*, not just how it looks. Send a few additions to the machine and watch what `+` actually does to each kind.',
      ],
      machine: {
        idle: 'awaiting expression',
        prompt: 'Choose an expression to send:',
        commands: [
          {
            id: 'text', label: '"5" + "3"', understood: true,
            screen: "'53'",
            note: 'Quoted values are text (`str`). Adding text means *joining* it end to end — that is concatenation, not arithmetic.',
          },
          {
            id: 'num', label: '5 + 3', understood: true,
            screen: '8',
            note: 'No quotes means these are numbers (`int`). Adding numbers means arithmetic, as expected.',
          },
          {
            id: 'mixed', label: '"5" + 3', understood: false,
            screen: 'TypeError: can only concatenate str (not "int") to str',
            note: 'Python refuses to guess whether you meant to join text or add numbers when the two sides disagree.',
          },
        ],
        successNote: 'Same symbol, different meaning — Python decides based on the *type* of value on each side.',
      },
      continueLabel: 'Ask Python directly →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'run',
      task: 't2',
      eyebrow: 'Scene 02 — Ask the interpreter',
      title: 'type() tells you exactly what you have',
      body: [
        'You never have to guess a value’s type — Python will tell you outright.',
      ],
      code: 'age = 10\nprint(type(age))',
      readonly: true,
      pipeline: true,
      anatomy: [
        { part: 'type', kind: 'fn', label: 'ask what kind of thing this is' },
        { part: '(', kind: 'punct', label: 'start of what you are asking about' },
        { part: 'age', kind: 'plain', label: 'the variable in question' },
        { part: ')', kind: 'punct', label: 'end of the question' },
      ],
      predict: {
        question: 'What does this print?',
        options: [
          { text: "`<class 'int'>`", correct: true },
          { text: "`'int'`" },
          { text: '`10`' },
          { text: '`age`' },
        ],
        explainRight: 'Right. Python calls whole-number values `int`, and reports the answer wrapped in `<class \'...\'>` — that wrapping is just how Python names types.',
        explainWrong: 'Run it and read exactly what comes back.',
      },
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: "<class 'int'>" }],
      successMessage: 'That is the interpreter reporting a fact about the value, not an opinion. `age` is an `int` because `10` has no quotes and no decimal point.',
      continueLabel: 'Take the controls →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't3',
      eyebrow: 'Scene 03 — Experiment',
      title: 'Change the type',
      body: [
        'This value is text — Python calls that `str`. Edit line 1 so the type printed on line 2 changes. You do not need to touch line 2 at all.',
      ],
      code: 'value = "7"\nprint(type(value))',
      baselineOutput: "<class 'str'>",
      check: [
        { rule: 'noError' },
        { rule: 'stdoutDiffersFrom', value: "<class 'str'>", label: 'The reported type has changed' },
      ],
      retryMessage: 'Still `str`. Try removing the quotation marks, or adding a decimal point.',
      successMessage: 'Removing the quotes turns text into a number; adding a decimal point turns a whole number into a `float`. The type comes entirely from how the value is written.',
      continueLabel: 'Continue →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'quiz',
      eyebrow: 'Scene 04 — Checkpoint',
      title: 'age = "10", then you run age + 5. What happens?',
      body: [
        '`age` holds the text `"10"`, not the number `10`. Think about what `+` does to text.',
      ],
      options: [
        {
          text: 'It prints `15`',
          why: 'That would be true if `age` were the number `10`. But it is text — `+` on text does not do arithmetic.',
        },
        {
          text: 'It prints `"10"5`',
          why: 'Close in spirit — but Python cannot join text and a number at all. It refuses rather than guessing a shape for the result.',
        },
        {
          text: 'It raises a `TypeError`',
          correct: true,
          why: 'Correct. `+` on a `str` and an `int` is not defined — Python will not silently convert one side for you.',
        },
        {
          text: 'It prints `10 5`',
          why: 'Python never inserts characters that were not part of the values or the operation.',
        },
      ],
      explain: 'This exact error — mixing `str` and `int` with `+` — is one of the most common mistakes in early Python. You are about to meet it for real.',
      continueLabel: 'Break something →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'repair',
      task: 't4',
      eyebrow: 'Scene 05 — Break it',
      title: 'Text and number, colliding. Repair it.',
      body: [
        'This should add 1 to the price and print `10`. Run it, read the error, then fix it.',
      ],
      filename: 'broken.py',
      code: 'price = "9"\ntotal = price + 1\nprint(total)',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '10' }],
      hints: [
        'Read the error type. Which two kinds of value is it complaining about?',
        '`price` is text (it has quotes). You need it as a number before adding to it.',
        'Wrap it in a conversion: `int(price)` turns the text `"9"` into the number `9`.',
      ],
      solution: '`total = int(price) + 1` — convert first, then add.',
      successMessage: 'Fixed. `int()` does not change what `price` is — it produces a *new* number built from the text.',
      successExtra: 'This is the single most common fix in beginner Python: something arrived as text, and it needed converting before you could do arithmetic on it.',
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
        'This program builds a message out of text and a score. Run it, then click the exact part of the code responsible for the error.',
      ],
      code: 'name = "Ali"\nscore = 90\nmessage = "Score: " + score\nprint(message)',
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'Now click the exact part of the code that Python is complaining about.',
      fault: { text: 'score', nth: 2 },
      decoys: [
        { text: 'name', nth: 1, why: '`name` is never used in the line that fails. It is not involved.' },
        { text: '"Score: "', nth: 1, why: 'The text itself is fine — quotes open and close properly. The problem is what it is being joined *with*.' },
      ],
      explain: '`"Score: "` is text and `score` is a number. `+` between them is exactly the mismatch from the checkpoint — only now it is buried inside a longer line.',
      successMessage: 'Correct. The second `score` — the one being added to text — is the one Python cannot handle.',
      continueLabel: 'Complete the code →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'fill',
      task: 't6',
      eyebrow: 'Scene 07 — Code completion',
      title: 'Convert before you calculate',
      body: [
        '`price` arrives as text. Fill in the missing function so the addition works and the program prints `10`.',
      ],
      template: 'price = "9"\ntotal = ____(price) + 1\nprint(total)',
      blankLabel: 'Convert price to a number',
      placeholder: '…',
      note: 'You are choosing a conversion function — the same job `int()` did two scenes ago.',
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '10' }],
      hints: [
        '`price` is a whole number written as text — you want a whole-number conversion.',
        'The function that turns text into an `int` is spelled exactly `int`.',
        'The finished line reads `total = int(price) + 1`.',
      ],
      solution: '`int` — so the line reads `int(price) + 1`.',
      explain: '`int()` and `float()` both convert text to numbers; `int()` expects the text to look like a whole number, with no decimal point.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'assemble',
      task: 't7',
      eyebrow: 'Scene 08 — Code forge',
      title: 'Assemble a conversion',
      body: [
        'All the pieces you need are below — plus one that does the opposite job.',
        'Assemble a line that converts the text `"9"` to a number, adds 1, and prints the result.',
      ],
      blocks: ['print', '(', 'int', '(', '"9"', ')', ' + 1)', 'str'],
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: '10' }],
      retryMessage: 'It runs, but the output is not `10` yet — check which conversion you used and where the brackets close.',
      successMessage: '`str()` would have gone the other direction — turning a number into text. You needed the reverse: text into a number.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 9 ---------------- */
    {
      id: 's9',
      type: 'build',
      task: 't8',
      eyebrow: 'Scene 09 — Build your own program',
      title: 'Mix text and numbers correctly',
      body: [
        '`price_text` is given as text on purpose — real data often arrives that way. Convert it, add 5, and print a sentence that includes the new total.',
      ],
      filename: 'total.py',
      code: '# price_text is given as text on purpose.\nprice_text = "25"\n\n# Convert it to a number, add 5, and print a sentence\n# that includes the new total.\n',
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\b(int|float)\\(', label: 'Converts price_text with `int()` or `float()`' },
        { rule: 'callCount', name: 'print', min: 1 },
        { rule: 'stdoutContains', value: '30' },
      ],
      hints: [
        '`price_text` holds `"25"` — text, not a number. Convert it before adding: `int(price_text)`.',
        'Add 5 to the *converted* number, and store the result in a new variable.',
        'Example: `total = int(price_text) + 5`, then print a sentence containing `total`.',
      ],
      solution: '`total = int(price_text) + 5`\n`print("New total:", total)`',
      successMessage: 'That is the exact pattern behind almost every "why is my calculator app broken" bug: convert the text once, right at the start, then work with numbers from then on.',
      explain: 'You now know the full loop for this mission: recognise a type, ask for it explicitly with `type()`, and convert with `int()` / `float()` / `str()` when two types collide.',
      continueLabel: 'Complete mission →',
    },
  ],
};
