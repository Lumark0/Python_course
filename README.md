# Python Training Lab

An interactive laboratory where a complete beginner learns Python by **running real Python**.
CPython 3.14, compiled to WebAssembly, executes inside the browser tab. No server, no account,
no build step — the repository is the deployable artefact.

> Status: **prototype**. The application infrastructure is complete and Mission 01 is finished
> and polished. Missions 02–10 are mapped but not written.

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
| **Missions** | The ten-mission curriculum map, with published missions playable and planned ones marked. |
| **Mission 01** | Nine interactive scenes. Detailed below. |
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

---

## How Python execution works

1. `runtime.boot()` spawns `assets/js/python/worker.js` as an **ES module worker**
   (Pyodide 314+ refuses to run in a classic worker).
2. The worker dynamically imports `pyodide.mjs` from the first CDN source that responds, then
   calls `loadPyodide()`. Roughly 12 MB is downloaded on first visit and cached by the browser
   thereafter.
3. A small Python harness is installed once. It replaces `sys.stdout`/`sys.stderr` with objects
   that post each write straight back to the terminal, so **output streams as it is produced**.
4. Each run compiles the learner's code with the filename `<program>` and `exec`s it in a fresh
   namespace. Tracebacks are filtered down to frames belonging to `<program>`, so learners never
   see the harness.
5. The worker returns `{ok, error{type,message,line,offset}, vars[], ms}`. The `vars` snapshot is
   what drives the memory inspector — and is the reason Mission 02 will not need new runtime code.

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
- `input()` is not simulated. It raises a real `EOFError` with an explanation, because blocking
  input needs `SharedArrayBuffer`, which needs COOP/COEP headers, which GitHub Pages cannot set.
  Mission 04 will use a supplied-input queue; the harness already accepts one.
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

Two steps. No application code changes.

**1. Write the data file** (`assets/js/data/missions/m02-variables.js`):

```js
export default {
  id: 'm02', code: 'MISSION 02', name: 'Variable Control',
  objective: 'Give the computer a memory.',
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

**2. Register it** in `assets/js/data/missions/index.js`: import it, add it to `MISSIONS`, and
remove the matching placeholder. That is the whole change.

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

## Verification

`tools/verify.mjs` drives a real browser against a real Pyodide runtime and checks every claim
made in this README — including that a syntax error really does stop *every* line from running,
and that the Stop button really does interrupt an infinite loop.

```bash
npm install && npx playwright install chromium
python3 -m http.server 8777          # in another terminal
node tools/verify.mjs
```

Last run (against a local copy of the same Pyodide 314.0.7 distribution the CDN serves):

```
51 passed, 0 failed
console errors: none
```

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
- **Progress is per-browser.** No accounts. Export/import covers moving between machines.
- **Mission 01 only.** Missions 02–10 are placeholders in the registry.
- **Autocomplete, multi-file projects and a step debugger are not implemented.**

## Browser support

Chrome/Edge 89+, Firefox 114+, Safari 15+. Module workers are the binding constraint.

## Licence

MIT.
