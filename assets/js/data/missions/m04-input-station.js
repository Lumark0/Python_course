/**
 * MISSION 04 — INPUT STATION
 *
 * Every program so far has been a monologue: the machine talks, the learner
 * watches. This mission makes it a conversation. `input()` is also the
 * first place a beginner meets a genuinely sneaky bug — the answer *looks*
 * like a number, but Python hands it over as text — so half the mission is
 * spent making that invisible fact visible.
 */
export default {
  id: 'm04',
  code: 'MISSION 04',
  name: 'Input Station',
  objective: 'Make the program ask, and listen.',
  summary: '`input()`, prompts, and the trap of a number that is secretly text.',
  concepts: ['input()', 'prompts', 'str', 'int()', 'type conversion'],
  minutes: 25,
  status: 'available',

  tasks: [
    { id: 't1', label: 'Receive input from a user' },
    { id: 't2', label: 'Change what the program asks' },
    { id: 't3', label: 'Convert input into a number' },
    { id: 't4', label: 'Identify a fault involving input' },
    { id: 't5', label: 'Complete missing code' },
    { id: 't6', label: 'Assemble a line that reads input' },
    { id: 't7', label: 'Write a program using multiple inputs' },
  ],

  outcomes: [
    'Use input() to receive text from a person',
    'Explain why input() always hands back a string',
    'Convert what input() returns into a number with int()',
    'Diagnose a bug caused by an unconverted input',
    'Write a program that asks more than one question',
  ],

  scenes: [
    /* ---------------- SCENE 1 ---------------- */
    {
      id: 's1',
      type: 'run',
      task: 't1',
      eyebrow: 'Scene 01 — The machine asks back',
      title: 'Your first conversation with a program',
      body: [
        'Every program so far has simply spoken. This one pauses, asks a question, and waits for an answer before it continues.',
        '`input("...")` shows the text in the quotes, then stops the program until someone types something and presses Enter. Whatever they typed becomes the value of the program.',
        'Use the **Inputs panel** below the editor to decide what gets "typed" when the program runs — that is how you test a program that talks back, since there is no keyboard to press here.',
      ],
      code: 'name = input("What is your name? ")\nprint("Hello, " + name + "!")',
      readonly: true,
      pipeline: true,
      stdin: ['Ali'],
      anatomy: [
        { part: 'input', kind: 'fn', label: 'pause and wait for an answer' },
        { part: '"What is your name? "', kind: 'str', label: 'the prompt — shown before the machine waits' },
        { part: 'name', kind: 'punct', label: 'the answer is stored here' },
      ],
      predict: {
        question: 'The Inputs panel says the answer will be "Ali". What appears in the terminal?',
        options: [
          { text: '`Hello, Ali!` — only the greeting' },
          { text: '`What is your name? Ali` then `Hello, Ali!` on the next line', correct: true },
          { text: '`What is your name? ` then, separately, `Hello, !`' },
          { text: 'An error — the program has no way to know the name in advance' },
        ],
        explainRight: 'Right. The prompt is printed first, the typed answer appears right after it on the same line — exactly as it would if a person had typed it at a keyboard — and only then does the program continue to the next line.',
        explainWrong: 'Run it and watch the terminal closely. The prompt and the typed answer share a line, because that is what actually typing an answer looks like.',
      },
      check: [
        { rule: 'noError' },
        { rule: 'stdoutMatches', pattern: 'What is your name\\? (.+)\\nHello, \\1!', label: 'Greets whatever name was typed, using the same name it received' },
      ],
      successMessage: 'It listened. Whatever you put in the Inputs panel became the value of `name` — try changing it and running again if you want to see it happen with a different word.',
      successExtra: 'Nothing about the *code* changed between one answer and another. `input()` is what makes the same program behave differently each time it runs.',
      continueLabel: 'But what kind of value did it receive? →',
    },

    /* ---------------- SCENE 2 ---------------- */
    {
      id: 's2',
      type: 'quiz',
      eyebrow: 'Scene 02 — Checkpoint',
      title: 'What kind of value does input() hand back?',
      body: [
        'Suppose a program runs `age = input("Age? ")` and someone types `15`.',
        'What is stored in `age` afterwards?',
      ],
      options: [
        {
          text: 'The number 15 — it looks like a number, so Python treats it as one.',
          why: 'It is a very reasonable guess, and it is wrong in a way that trips up almost everyone once. `input()` has no idea what the text *means* — only that it is text.',
        },
        {
          text: 'The text `"15"` — digits, but stored as a string.',
          correct: true,
          why: 'Correct. `input()` always returns a string, no matter what was typed. `"15"` is three characters — the digit 1, the digit 5 — not the number fifteen.',
        },
        {
          text: 'Whichever type the program needs at that point.',
          why: 'Python does not read ahead to guess what you meant. `input()` has exactly one behaviour, always: return a string.',
        },
        {
          text: 'An error, because `age` sounds like it should be a number.',
          why: 'No error yet — the trouble starts later, the moment the program tries to do arithmetic with it.',
        },
      ],
      explain: 'This is the single most common beginner bug involving input: `age + 1` fails, not because the person typed something wrong, but because `age` is text — `"15"` — and Python will not silently add a number to text. You are about to watch that happen and then fix it.',
      continueLabel: 'Watch it happen →',
    },

    /* ---------------- SCENE 3 ---------------- */
    {
      id: 's3',
      type: 'experiment',
      task: 't2',
      eyebrow: 'Scene 03 — Experiment',
      title: 'Ask a different question',
      body: [
        'The prompt text is just a string — change it to ask whatever you want, and change the Inputs panel to match your own question.',
        'Keep the rest of the line the same shape: `input("...")`.',
      ],
      code: 'color = input("Favourite colour? ")\nprint("Nice, I like " + color + " too.")',
      stdin: ['blue'],
      baselineOutput: 'Favourite colour? blue\nNice, I like blue too.',
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'input', min: 1 },
        { rule: 'codeMatches', pattern: 'input\\(\\s*(?!"Favourite colour\\? ")', label: 'The prompt asks a different question now' },
      ],
      retryMessage: 'It still asks about favourite colour. Edit the text inside the quotes that `input()` shows.',
      successMessage: 'That is a real change to what the program asks for — and because you also control the Inputs panel, you can answer your own question however you like.',
      continueLabel: 'Now break it →',
    },

    /* ---------------- SCENE 4 ---------------- */
    {
      id: 's4',
      type: 'repair',
      task: 't3',
      eyebrow: 'Scene 04 — Repair',
      title: 'This program cannot do the arithmetic it promises',
      body: [
        'This program asks for an age and tries to print next year\'s age. It fails — and now you know exactly why.',
        'The Inputs panel already contains an answer. Run it, read the error, then repair the code so it works.',
      ],
      filename: 'broken.py',
      code: 'age = input("How old are you? ")\nprint(age + 1)',
      stdin: ['15'],
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\bint\\(\\s*(age\\b|input\\()', label: 'Converts age to a number with int() before using it as one' },
      ],
      hints: [
        'The error names the two types Python refused to combine. One of them is `str` — text. `age` is text, straight from `input()`.',
        'You cannot add a number to text. You have to turn the text into a number first.',
        'The tool for that is `int(...)`. Wrap `age` in it before the arithmetic: `int(age)`.',
      ],
      solution: '`age = int(input("How old are you? "))` — or convert it on the next line: `age = int(age)` before the `print`.',
      successMessage: 'Fixed. `int()` takes text that looks like a whole number and hands back the actual number, which is the only thing `+ 1` knows how to work with.',
      successExtra: 'Nothing about what the person typed changed — only how the program treats it. That is the whole lesson of type conversion.',
      continueLabel: 'Find this bug in someone else\'s code →',
    },

    /* ---------------- SCENE 5 ---------------- */
    {
      id: 's5',
      type: 'detective',
      task: 't4',
      eyebrow: 'Scene 05 — Code detective',
      title: 'Find the exact fault',
      body: [
        'Same bug, different disguise. Run the program, read what Python says, then click the exact token responsible — not just the line it points at.',
      ],
      code: 'age = input("Age? ")\nnext_year = age + 1\nprint("Next year you will be " + str(next_year))',
      stdin: ['15'],
      prompt: 'Run the program first — you cannot diagnose a fault you have not observed.',
      promptAfterRun: 'Click the exact part of the code causing this.',
      fault: { text: 'age', nth: 2 },
      decoys: [
        { text: '"Age? "', nth: 1, why: 'The prompt text is fine — it is just a string being shown before the program waits. It is not part of the arithmetic.' },
        { text: 'next_year', nth: 1, why: 'That is only a name being created. It is not guilty of anything by itself — look at what it is being set *equal to*.' },
        { text: 'str', nth: 1, why: 'That call is actually doing the right thing further down — converting a number back into text so it can join a string. It is not the fault.' },
      ],
      explain: 'The `age` used in `next_year = age + 1` is still exactly what `input()` returned: text. It was never converted. The fix is the same one as last time — `int(age)` — but this time you had to spot it yourself, without a repair box telling you something was broken.',
      successMessage: 'Correct diagnosis. You traced the value back to where it entered the program, not just where Python happened to give up.',
      continueLabel: 'Complete the missing line →',
    },

    /* ---------------- SCENE 6 ---------------- */
    {
      id: 's6',
      type: 'fill',
      task: 't5',
      eyebrow: 'Scene 06 — Code completion',
      title: 'Complete the conversion',
      body: [
        'This program needs the answer converted to a number the moment it arrives, before it is stored.',
        'Fill in the blank so that typing `15` results in the number `16` being printed.',
      ],
      template: 'age = ____(input("Age? "))\nprint(age + 1)',
      blankLabel: 'What converts text into a whole number?',
      placeholder: '…',
      stdin: ['15'],
      note: 'Tip: you used this exact tool two scenes ago to repair the broken program.',
      check: [
        { rule: 'noError' },
        { rule: 'codeMatches', pattern: '\\bint\\(\\s*input\\(', label: 'Converts the input to a number before storing it' },
      ],
      hints: [
        'Without conversion, `age` would be text, and `age + 1` would fail exactly like it did in the repair scene.',
        'The tool that turns text like `"15"` into the number `15` starts with the letters i-n-t.',
        'The shape you want is `int(input("Age? "))`.',
      ],
      solution: '`int` — the full line reads `age = int(input("Age? "))`.',
      explain: 'Wrapping the outer call is the normal pattern: Python evaluates `input(...)` first, gets the text back, and hands it straight to `int(...)` before anything is stored under the name `age`.',
      continueLabel: 'To the forge →',
    },

    /* ---------------- SCENE 7 ---------------- */
    {
      id: 's7',
      type: 'assemble',
      task: 't6',
      eyebrow: 'Scene 07 — Code forge',
      title: 'Build a line that asks and shows',
      body: [
        'Assemble a line that asks `Name? `, then immediately prints back exactly what was typed.',
        'The Inputs panel already contains an answer — assemble the line, then run it.',
      ],
      stdin: ['Ali'],
      blocks: ['print', '(', 'input', '(', '"Name? "', ')', ')', 'str'],
      check: [{ rule: 'noError' }, { rule: 'stdoutEquals', value: 'Name? Ali\nAli' }],
      retryMessage: 'It runs, but it does not ask `Name? ` and then print exactly what was typed.',
      successMessage: 'Assembled correctly. `str` was a decoy — the text `input()` returns is already a string, so wrapping it again would do nothing useful here.',
      continueLabel: 'Final task →',
    },

    /* ---------------- SCENE 8 ---------------- */
    {
      id: 's8',
      type: 'build',
      task: 't7',
      eyebrow: 'Scene 08 — Build a two-question program',
      title: 'Write a program that asks two things',
      body: [
        'Empty file. Write a program that asks for someone\'s **name**, then asks for their **age**, converts the age to a number, and prints one sentence using both.',
        'Use the Inputs panel to answer your own two questions — the first line answers the first `input()` call, the second line answers the second.',
      ],
      filename: 'introduce.py',
      code: '# Ask for a name, then an age.\n# Convert the age to a number, then print a sentence using both.\n\n',
      stdin: ['Ali', '15'],
      showMemory: true,
      check: [
        { rule: 'noError' },
        { rule: 'callCount', name: 'input', min: 2, label: 'Calls input() at least twice' },
        { rule: 'codeMatches', pattern: '\\bint\\(', label: 'Converts the age to a number with int()' },
        { rule: 'callCount', name: 'print', min: 1, label: 'Prints at least one sentence' },
      ],
      hints: [
        'You need two separate `input()` calls — one per question — each stored under its own name.',
        'Only the age needs converting. A name is text and should stay text.',
        'Something like: ask for the name, ask for the age and wrap that call in `int(...)`, then `print(...)` a sentence built from both.',
      ],
      solution: '`name = input("Name? ")`\n`age = int(input("Age? "))`\n`print(name + " will be " + str(age + 10) + " in ten years.")`',
      successMessage: 'That program has a real conversation: two questions, two answers, and a sentence that could not exist without both of them.',
      explain: 'This is the whole mission in one program: `input()` to listen, `int()` to convert, and ordinary variables and `print()` to do something with what you were told.',
      continueLabel: 'Complete mission →',
    },
  ],
};
