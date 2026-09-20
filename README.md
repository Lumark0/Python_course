# Python Training Lab

An interactive laboratory where a complete beginner learns Python by **running real Python**.
CPython 3.14, compiled to WebAssembly, executes inside the browser tab. No server, no account,
no build step — the repository is the deployable artefact.

> Status: all **ten missions are written and playable**, start to finish — variables, data
> types, `input()`, decisions, loops, lists, functions, debugging, and a final project mission
> that combines everything. See [Curriculum](#curriculum) below.

---

## Quick start

```bash
git clone https://github.com/Lumark0/Python-course.git
cd Python-course
python3 -m http.server 8777
# open http://127.0.0.1:8777
```

There is nothing to install and nothing to compile. Opening `index.html` through **any** static
web server works; opening it as a `file://` URL does not, because ES modules and web workers
require an origin.

---

## What it does

| Screen | Purpose |
| --- | --- |
| **Home** | Lab entrance. The console on the right runs real Python the moment the page loads — it is not a recording. |
| **Missions** | The ten-mission curriculum map. All ten are published and playable. |
| **Mission 01** | Nine interactive scenes. Detailed below as the template every later mission follows. |
| **Sandbox** | A free Python environment with a live variable inspector and loadable examples, including two that deliberately fail. |
| **Progress** | Per-mission completion, plus counts of programs run, errors met and hints opened. |
| **Badges** | Achievements, most of them for *behaviour* ("met your first error") rather than completion. |
| **Settings** | Theme, motion, text size, keyboard reference, engine diagnostics, progress export/import/reset. |

### Mission 01 — Your First Code

| # | Scene | Activity type | What the learner does |
| --- | --- | --- | --- |
| 1 | Enter the lab | `concept` | Commands a deliberately literal machine and discovers that vague instructions are rejected. |
| 2 | Give the computer an instruction | `run` | Reads a labelled anatomy of `print("Hello, Python!")`, **predicts the output**, then runs it. |
| 3 | Experiment | `experiment` | Edits the program into their own, and is shown a character-level diff proving they changed it. |
| 4 | Checkpoint | `quiz` | Decides what Python does with a file containing a syntax error — a real and common misconception. |
| 5 | Break it | `repair` | Repairs `print("Hello, Python!"` using a progressive hint ladder. |
| 6 | Code detective | `detective` | Runs a broken program, reads the traceback, then clicks the exact character responsible. |
| 7 | Code completion | `fill` | Completes `print(____)`. Typing `Ali` without quotes produces a genuine `NameError`, which is the point. |
| 8 | Code forge | `assemble` | Builds a line from blocks, including decoys (`Print`, unquoted text). |
| 9 | Build your first program | `build` | Writes a three-line program from an empty file against a live requirement checklist. |

### Curriculum

Every mission below follows the same shape as Mission 01 — nine scenes moving from a guided
`concept` demo through `run` → `experiment` → `quiz` → `repair` → `detective` → `fill` →
`assemble` → `build` — except Mission 04, which adds the Inputs panel (see below), and Mission
10, which is deliberately different: five open-ended `build` scenes with no fixed answer, meant
to be attempted after everything else.

| # | Mission | Teaches |
| --- | --- | --- |
| 01 | Your First Code | `print()`, strings, statements, reading a first error |
| 02 | Variable Control | Variables, assignment, reassignment, `=` vs `==` |
| 03 | Data Type Lab | `str` / `int` / `float`, `type()`, conversion, `str` + `int` TypeErrors |
| 04 | Input Station | `input()`, prompts, converting what a person types |
| 05 | Decision Lab | Comparisons, `if` / `elif` / `else`, indentation |
| 06 | Loop Laboratory | `for`, `range()`, `while`, and stopping a runaway loop for real |
| 07 | List Workshop | Lists, indexing from 0, `append()`, `len()` |
| 08 | Function Factory | `def`, parameters, `return` vs `print()` |
| 09 | Debugging Center | Reading multi-frame tracebacks, isolating a bug with `print()`, testing a fix |
| 10 | Python Project | Open-ended synthesis of everything above — no new syntax, no fixed answer |

Mission 04 introduced real `input()` support: an editable **Inputs** panel
(`assets/js/ui/inputs.js`) lets a learner decide what each `input()` call receives, since there
is no keyboard to actually type into inside an automated lesson. Every activity type that runs
learner-editable code (`run`, `experiment`, `repair`, `build`) can show this panel via
`scene.stdin`; `fill`, `assemble` and `detective` instead pass a fixed, non-editable `stdin`
array straight to `runtime.run()`, since their code is not freely editable. Validator checks
against input-driven programs deliberately avoid hardcoding one "typed" value where the panel is
editable — they either use `stdoutMatches` with a regex **backreference** (when the echoed input
and the output are a literal repeat) or a structural `codeMatches` check (when the check is
really about *how* a value was converted, not what a learner chose to type).

---

## Architecture

```
index.html                    Shell + boot screen. No framework.
assets/css/
  tokens.css                  Design tokens; dark and light are siblings.
  base.css  app.css  components.css
assets/js/
  main.js                     Entry point and route table.
  core/
    dom.js                    h() / append() / clear() — the whole view layer.
    bus.js                    Pub/sub, decoupling the engine from the UI.
    store.js                  Versioned, migratable localStorage progress store.
    router.js                 Hash router (required by GitHub Pages).
    settings.js               Applies theme / motion / density / text size.
  python/
    runtime.js                Facade: boot, run, stop, status. The only Python API the app sees.
    worker.js                 Module worker. Owns Pyodide and the Python-side harness.
  ui/
    editor.js  terminal.js  feedback.js  workbench.js  highlight.js  shell.js  toast.js
    viz/pipeline.js           CODE -> INTERPRETER -> OUTPUT visualiser.
    viz/memory.js             Variable inspector.
  engine/
    mission.js                Mission runner: briefing, tasks, stepper, completion.
    activities/               One file per activity type + a registry.
    validators.js             Declarative validation rules.
    diagnose.js               Translates Python errors into beginner language.
    diff.js  badges.js
  data/missions/
    index.js                  Curriculum registry and progress maths.
    m01-first-code.js         Mission 01, as pure data.
    m02-variables.js … m10-python-project.js   Missions 02–10, same shape.
tools/verify.mjs              End-to-end browser test of everything claimed here.
```

### Why no framework and no build step

GitHub Pages serves a repository as static files. Every build step is a thing that can break a
deploy and a thing a teacher forking this repo would have to learn. A router, a store, an event
bus and an `h()` function come to roughly 600 lines and remove the entire toolchain.

### Why a web worker

Python blocks the thread it runs on. A beginner's first `while True:` on the main thread would
freeze the page permanently. In a worker the UI stays responsive and the main thread can
`terminate()` a runaway program — which is what makes the **Stop** button real rather than
decorative. The engine then reboots itself automatically.

Being in a worker is not, by itself, enough. A silent `while True: pass` never touches the main
thread at all, so Stop always worked for that case — but a *printing* infinite loop
(`while True: print(n)`, the far more common beginner mistake) calls `write()` millions of times
a second, and the worker originally sent one `postMessage` per call. That flooded the *main*
thread with more small tasks than it could ever finish, so the timer that reveals the Stop
button — and the click on it once shown — were starved out along with everything else, even
though the worker itself was never stuck. The fix (`worker.js`) batches output on a rolling
~50ms timer regardless of how fast Python is producing it, so postMessage traffic stays around
20/second no matter how tight the loop is, and the main thread — and therefore Stop — stays
responsive. Mission 06's runaway-loop scene depends on this.

Throttling the *rate* turned out not to be the whole story. A loop that keeps running for several
seconds before a learner clicks Stop can still queue up a long run of these throttled messages one
after another — each cheap on its own, but the main thread has to work through every one already
queued before it can react to anything else, including the click on Stop itself. The longer the
loop had been running, the bigger that backlog, which is exactly what turned "the Stop button
appeared correctly" into "clicking it didn't seem to do anything, and the tab locked up anyway" a
few seconds later — a real report from testing this against the deployed site, not a theoretical
gap. Past a certain point a runaway loop's output isn't useful to the learner either way, so
`worker.js` also caps the *total* number of these messages a single run can ever send (currently
200) — once hit, further output is dropped with a one-line note instead of adding to the backlog.
That guarantees the main thread never has more than a small, bounded amount of work left to drain,
no matter how long the loop ran before Stop was clicked or how fast the interpreter turns out to
be. `runtime.js`'s `stop()` also detaches the worker's message handler *before* terminating it, so
anything already queued from the worker being killed is ignored immediately rather than still being
worked through one message at a time.

---

## How Python execution works

1. `runtime.boot()` spawns `assets/js/python/worker.js` as an **ES module worker**
   (Pyodide 314+ refuses to run in a classic worker).
2. The worker dynamically imports `pyodide.mjs` from the first CDN source that responds, then
   calls `loadPyodide()`. Roughly 12 MB is downloaded on first visit and cached by the browser
   thereafter.
3. A small Python harness is installed once. It replaces `sys.stdout`/`sys.stderr` with objects
   that post each write straight back to the terminal, so **output streams as it is produced**.
   The same harness exposes `_ptl_input()`, backing real `input()` calls from a queue supplied by
   the Inputs panel — see Mission 04 above.
4. Each run compiles the learner's code with the filename `<program>` and `exec`s it in a fresh
   namespace. Tracebacks are filtered down to frames belonging to `<program>`, so learners never
   see the harness — including every frame of a multi-level call chain, which is what Mission 09
   uses to teach reading a traceback from the bottom up.
5. The worker returns `{ok, error{type,message,line,offset}, vars[], ms}`. The `vars` snapshot is
   what drives the memory inspector, used throughout Missions 02–10.

### Configuring the runtime source

| Method | Use |
| --- | --- |
| Default | `https://cdn.jsdelivr.net/npm/pyodide@314.0.7/`, falling back to Pyodide's own dist path. |
| `?pyodide=<url>` | Per-session override, e.g. `?pyodide=/vendor/pyodide/`. |
| `localStorage['ptl.pyodideURL']` | Persistent override, for an offline classroom. |

To run fully offline, copy the contents of the `pyodide` npm package into `vendor/pyodide/`
and set the override. Both are verified paths — `tools/verify.mjs` uses exactly this mechanism.

### What is *not* faked

- Every result in a terminal came from CPython. There are no canned outputs.
- `input()` cannot truly *block* waiting on a keyboard — that needs `SharedArrayBuffer`, which
  needs COOP/COEP headers, which GitHub Pages cannot set. Instead, the Inputs panel lets a
  learner supply, in advance, what each call to `input()` will receive; the harness pops one
  queued value per call and echoes it to the terminal exactly as a real keystroke-by-keystroke
  answer would appear. If a program calls `input()` with nothing queued, it raises a real
  `EOFError` with a plain-language explanation rather than hanging.
- If the runtime cannot be downloaded, the engine chip reads *Engine unavailable*, Run is
  disabled, and the console names every source it tried. It never pretends.

---

## Progress

All progress lives in one versioned object under the localStorage key `ptl.progress.v1`:

```js
{ v, createdAt, updatedAt, learner, settings,
  missions: { m01: { started, completed, tasks{}, scenes{}, attempts{}, artifacts{} } },
  stats: { runs, errors, hintsUsed, ... },
  badges: { id: earnedAt } }
```

`artifacts` holds the learner's own code, so returning to a scene restores what they wrote.
Writes are debounced, and flushed immediately on settings changes and on `pagehide`.
`migrate()` brings older saves forward rather than discarding them. Settings → *Export progress*
writes the whole object to a JSON file for moving between machines.

---

## Adding another lesson

All ten planned missions are written, but the same two steps add an eleventh (or any future
one) with no application code changes.

**1. Write the data file** (`assets/js/data/missions/m11-whatever-comes-next.js`) — the shape is
identical to every existing mission; `m01-first-code.js` is the fullest annotated example. A
minimal one:

```js
export default {
  id: 'm11', code: 'MISSION 11', name: 'Something New',
  objective: 'Teach one more idea.',
  status: 'available',
  tasks: [{ id: 't1', label: 'Store a value' }],
  outcomes: ['Create a variable', 'Read it back'],
  scenes: [{
    id: 's1', type: 'build', task: 't1',
    title: 'Name a value',
    body: ['A variable is a label you attach to a value.'],
    code: 'name = "Ali"\n',
    showMemory: true,                       // renders the variable inspector
    check: [
      { rule: 'noError' },
      { rule: 'codeMatches', pattern: '\\w+\\s*=', label: 'Creates a variable' },
      { rule: 'stdoutNotEmpty' },
    ],
    hints: ['Put the name on the left of the `=`.'],
  }],
};
```

**2. Register it** in `assets/js/data/missions/index.js`: import it and add it to the `MISSIONS`
array. That is the whole change.

Available activity types: `concept`, `run`, `experiment`, `repair`, `detective`, `fill`,
`assemble`, `build`, `quiz`. Available validation rules are documented inline in
`assets/js/engine/validators.js`: `noError`, `hasError`, `stdoutEquals`, `stdoutContains`,
`stdoutMatches`, `stdoutNotEmpty`, `stdoutDiffersFrom`, `stdoutLines`, `stdoutDistinctLines`,
`codeContains`, `codeMatches`, `callCount`, `customText`, `balancedBrackets`.

A new *kind* of exercise is one file in `assets/js/engine/activities/` exporting
`(ctx) => ({ el, destroy? })`, plus one line in that folder's `index.js`.

---

## Deploying to GitHub Pages

**Automatic** — `.github/workflows/pages.yml` is included. In the repository, go to
**Settings → Pages → Build and deployment → Source: GitHub Actions**. Every push to `main`
publishes. The workflow uploads the repository as-is; there is no build.

**Manual** — **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.

`.nojekyll` is committed so Jekyll does not interfere. All paths are relative and routing is
hash-based, so the app works from a project subpath (`username.github.io/Python-course/`) and
survives a refresh on any route.

---

## Teacher: seeing student progress

By default the lab has no accounts and no server — every learner's progress
lives only in their own browser. A teacher can opt into two extra things
with no code changes: learners are asked for their name once, and their
progress is mirrored to a Google Sheet the teacher owns. See
[`teacher/SETUP.md`](teacher/SETUP.md) for the walkthrough (about 10
minutes, no coding). Skip it entirely and nothing about the app changes.

## Verification

`tools/verify.mjs` drives a real browser against a real Pyodide runtime and checks every claim
made in this README — including that a syntax error really does stop *every* line from running,
and that the Stop button really does interrupt an infinite loop.

```bash
npm install && npx playwright install chromium
python3 -m http.server 8777          # in another terminal
node tools/verify.mjs
```

Last run against Mission 01 alone (against a local copy of the same Pyodide 314.0.7 distribution
the CDN serves):

```
51 passed, 0 failed
console errors: none
```

That run predates Missions 02–10 and the Inputs panel added for Mission 04 — every Python
snippet and expected output in this mission set was instead checked with a local CPython
interpreter running a faithful replica of the in-browser `input()` harness, since this
development environment's egress policy blocks the Pyodide CDN `tools/verify.mjs` needs. Re-run
`tools/verify.mjs` (extended to cover the new missions) somewhere with CDN access before treating
this curriculum as browser-verified end to end.

---

## Known limitations

- **First load downloads ~12 MB.** Cached afterwards, and the lab is fully usable while it
  downloads, but the first visit on a slow connection is slow. The terminal narrates the wait.
- **The CDN path has not been exercised from this development environment**, whose egress policy
  blocks jsDelivr. The code path is identical to the verified local one — only the base URL
  differs — and two sources are tried, but the CDN itself is unverified here.
- **`input()` does not block.** See above.
- **No package installation.** `numpy` and friends are not loaded; Pyodide can, but nothing in
  the beginner curriculum needs it.
- **Stopping a program reboots the interpreter**, losing any state, because interrupting WASM
  CPython without `SharedArrayBuffer` is not possible.
- **Progress is per-browser.** No accounts. Export/import covers moving between machines, or the
  optional teacher Google Sheet sync described above.
- **Structural, not semantic, checking.** A `build` scene's requirement checklist looks for the
  shape of a correct program (uses `def`, uses `return`, calls a given function) plus its actual
  output where that output is deterministic. It cannot catch every way to satisfy the letter of a
  check while missing its spirit — the same trade-off every autograder makes.
- **Autocomplete, multi-file projects and a step debugger are not implemented.**

## Browser support

Chrome/Edge 89+, Firefox 114+, Safari 15+. Module workers are the binding constraint.

## Licence

MIT.
