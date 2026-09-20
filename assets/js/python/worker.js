/* eslint-env worker */
/**
 * Python execution worker (ES module worker).
 *
 * Why a worker: Pyodide runs CPython compiled to WebAssembly, and Python
 * code blocks the thread it runs on. On the main thread a beginner's
 * `while True:` would freeze the whole page with no way out. In a worker
 * the UI stays responsive and the main thread can terminate a runaway
 * program — that is what makes the STOP button real.
 */

let pyodide = null;
let ready = false;
let runner = null;       // the Python-side entry point, set up once
let activeURL = null;    // whichever source actually served the runtime

function post(msg) { self.postMessage(msg); }
function status(stage, message, progress) { post({ type: 'status', stage, message, progress }); }

/* -----------------------------------------------------------------------
   Output is batched, not sent one postMessage per write().
   A program stuck in `while True: print(...)` never raises and never
   touches the DOM directly — Python only runs in this worker — but with
   nothing throttling it, CPython can call write() millions of times a
   second, and one postMessage per call floods the MAIN thread with more
   tiny tasks than it can ever finish. That is what makes the tab look
   frozen: not the worker (which is fine), but the main thread never
   getting a turn to run the "still running" watchdog or respond to a
   click on Stop. Capping postMessage frequency, regardless of how fast
   Python is producing output, keeps the main thread free the whole time.

   Capping frequency alone is not enough, though. Two gaps, found by
   actually testing this against a runaway `while True: print(n)`:

   1. A loop that runs for several seconds before Stop is clicked can
      still queue up hundreds of these throttled flushes one after
      another. Each is cheap, but the MAIN thread has to work through
      every message already sitting in its queue before it can do
      anything else — including reacting to a click on Stop. Fixed by
      capping the total number of flush *messages* a run can ever send
      (IO_MAX_FLUSHES_PER_RUN): past that, further output is dropped
      instead of adding to the backlog.

   2. That alone still was not enough: IO_FLUSH_CHARS bounds a flush by
      *character count*, not by how many separate write() calls it
      contains. A loop whose output is short and constant — exactly
      Mission 06's `print(n)` where n never changes, so every write is
      just "3" or "\n" — can pack tens of thousands of individual items
      into a single 200,000-character flush. The postMessage *count*
      stays capped, but each message can still be huge to deserialize,
      so the main thread ends up doing the same amount of backlog work
      it always did, just spread across fewer, bigger messages instead
      of many small ones. Fixed by capping the total number of output
      *items* a run can ever relay (IO_MAX_ITEMS_PER_RUN), checked on
      every single write — independent of how long each string is or
      how the buffer happens to get flushed — so the absolute worst
      case is always a small, fixed number of tiny objects, no matter
      how fast or how long the loop runs.

   A runaway loop's output past a certain point is not useful to the
   learner either way — they already know it is not going to stop on
   its own.
----------------------------------------------------------------------- */
const IO_FLUSH_MS = 50;
const IO_FLUSH_CHARS = 200000; // safety ceiling, not the normal trigger
const IO_MAX_FLUSHES_PER_RUN = 200; // hard ceiling on total postMessage calls, not just their rate
const IO_MAX_ITEMS_PER_RUN = 2000; // hard ceiling on total write() calls relayed, regardless of batching
let ioBuf = [];
let ioBufChars = 0;
let ioLastFlush = 0;
let ioFlushCount = 0;
let ioItemsTotal = 0;
let ioCapped = false;

function flushIO() {
  if (!ioBuf.length) return;
  if (ioCapped) { ioBuf = []; ioBufChars = 0; ioLastFlush = performance.now(); return; }
  post({ type: 'io', items: ioBuf });
  ioBuf = [];
  ioBufChars = 0;
  ioLastFlush = performance.now();
  ioFlushCount += 1;
  if (ioFlushCount >= IO_MAX_FLUSHES_PER_RUN) capIO();
}

function capIO() {
  if (ioCapped) return;
  ioCapped = true;
  post({
    type: 'io',
    items: [{ kind: 'stderr', text: '\n[Output stopped — this program is producing too much to show. Click ■ Stop to interrupt it.]\n' }],
  });
}

/* ---------------------------------------------------------------------
   Python-side harness. Installed once, reused for every run.
   - stdout/stderr are proxied straight back to the terminal so output
     streams as it is produced rather than appearing all at once.
   - user code is compiled with the filename "<program>" so tracebacks
     can be filtered down to the learner's own lines.
--------------------------------------------------------------------- */
const HARNESS = String.raw`
import sys, json, builtins, traceback

class _PTLStream:
    def __init__(self, kind):
        self._kind = kind
    def write(self, s):
        if s:
            _ptl_emit(self._kind, str(s))
        return len(s)
    def writelines(self, lines):
        for line in lines:
            self.write(line)
    def flush(self):
        pass
    def isatty(self):
        return False
    def writable(self):
        return True
    def readable(self):
        return False

sys.stdout = _PTLStream("stdout")
sys.stderr = _PTLStream("stderr")

_ptl_stdin_queue = []

def _ptl_input(prompt=""):
    if prompt:
        sys.stdout.write(str(prompt))
    if _ptl_stdin_queue:
        value = _ptl_stdin_queue.pop(0)
        sys.stdout.write(str(value) + "\n")
        return str(value)
    raise EOFError(
        "input() asked for something to type, but no input was supplied. "
        "Add lines in the Inputs panel before running."
    )

builtins.input = _ptl_input

_PTL_HIDE = {"__builtins__", "__name__", "__doc__", "__package__", "__loader__", "__spec__"}

def _ptl_safe_repr(value, limit=160):
    try:
        text = repr(value)
    except Exception:
        return "<unrepresentable>"
    if len(text) > limit:
        text = text[: limit - 1] + "…"
    return text

def _ptl_snapshot(env):
    out = []
    for name, value in env.items():
        if name in _PTL_HIDE or name.startswith("_ptl"):
            continue
        if callable(value) and getattr(value, "__module__", None) == "builtins":
            continue
        out.append({
            "name": name,
            "type": type(value).__name__,
            "value": _ptl_safe_repr(value),
        })
    return out

def _ptl_user_lineno(exc):
    line = None
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == "<program>":
            line = tb.tb_lineno
        tb = tb.tb_next
    return line

def _ptl_format(exc):
    """A traceback with only the learner's frames in it."""
    frames = [
        f for f in traceback.extract_tb(exc.__traceback__)
        if f.filename == "<program>"
    ]
    parts = []
    if frames:
        parts.append("Traceback (most recent call last):")
        parts.extend(traceback.format_list(frames))
    parts.extend(traceback.format_exception_only(type(exc), exc))
    return "".join(parts).rstrip("\n")

def _ptl_run(code, stdin_json):
    global _ptl_stdin_queue
    try:
        _ptl_stdin_queue = list(json.loads(stdin_json or "[]"))
    except Exception:
        _ptl_stdin_queue = []

    env = {"__name__": "__main__", "__doc__": None}
    result = {"ok": True, "error": None, "vars": []}

    try:
        compiled = compile(code, "<program>", "exec")
    except SyntaxError as exc:
        result["ok"] = False
        result["error"] = {
            "type": type(exc).__name__,
            "message": exc.msg or str(exc),
            "line": exc.lineno,
            "offset": exc.offset,
            "text": (exc.text or "").rstrip("\n"),
            "formatted": "".join(
                traceback.format_exception_only(type(exc), exc)
            ).rstrip("\n"),
        }
        return json.dumps(result)
    except ValueError as exc:
        result["ok"] = False
        result["error"] = {
            "type": "ValueError", "message": str(exc),
            "line": None, "offset": None, "text": "",
            "formatted": "ValueError: " + str(exc),
        }
        return json.dumps(result)

    try:
        exec(compiled, env)
    except SystemExit as exc:
        sys.stdout.write("\n[program exited with code %s]\n" % (exc.code,))
    except BaseException as exc:
        result["ok"] = False
        result["error"] = {
            "type": type(exc).__name__,
            "message": str(exc),
            "line": _ptl_user_lineno(exc),
            "offset": None,
            "text": "",
            "formatted": _ptl_format(exc),
        }

    try:
        result["vars"] = _ptl_snapshot(env)
    except Exception:
        result["vars"] = []
    return json.dumps(result)

_ptl_run
`;

/** Import the Pyodide loader, trying each configured source in turn. */
async function importLoader(sources) {
  const failures = [];
  for (const base of sources) {
    try {
      const mod = await import(/* @vite-ignore */ base + 'pyodide.mjs');
      return { loadPyodide: mod.loadPyodide, indexURL: base };
    } catch (err) {
      failures.push(`${base} — ${err && err.message ? err.message : err}`);
    }
  }
  throw new Error(`Could not load the Python runtime from any source:\n${failures.join('\n')}`);
}

async function init(sources) {
  if (ready) { post({ type: 'ready', version: pyodide.version, reinit: true, indexURL: activeURL }); return; }
  try {
    status('fetch', 'Fetching Python runtime', 0.05);
    // Pyodide 314+ ships as an ES module and refuses to run in a classic
    // worker, so the loader is imported dynamically from whichever base
    // URL the app was configured with (CDN by default).
    const { loadPyodide, indexURL } = await importLoader(sources);
    activeURL = indexURL;

    status('boot', 'Starting CPython in WebAssembly', 0.25);
    pyodide = await loadPyodide({
      indexURL,
      stdout: () => {},   // replaced by the harness below
      stderr: () => {},
    });

    status('stdlib', 'Mounting the standard library', 0.75);
    pyodide.globals.set('_ptl_emit', (kind, text) => {
      // Cheapest possible check first: once capped, do zero further work
      // per call — no push, no length math — since a tight loop can call
      // this millions of times a second.
      if (ioCapped) return;
      ioItemsTotal += 1;
      if (ioItemsTotal > IO_MAX_ITEMS_PER_RUN) { capIO(); return; }
      ioBuf.push({ kind, text });
      ioBufChars += text.length;
      const now = performance.now();
      if (ioBufChars >= IO_FLUSH_CHARS || now - ioLastFlush >= IO_FLUSH_MS) flushIO();
    });

    status('warm', 'Warming up the interpreter', 0.9);
    runner = pyodide.runPython(HARNESS);
    // A throwaway run so the first learner program is not the one that
    // pays the JIT/import warm-up cost.
    runner('pass', '[]');

    ready = true;
    status('done', 'Python ready', 1);
    post({
      type: 'ready',
      version: pyodide.version,
      python: pyodide.runPython('import sys; sys.version.split()[0]'),
      indexURL: activeURL,
    });
  } catch (err) {
    post({ type: 'fatal', message: String(err && err.message ? err.message : err) });
  }
}

async function run(runId, code, stdin) {
  if (!ready) { post({ type: 'result', runId, ok: false, fatal: 'Python engine is not ready yet.' }); return; }
  const started = performance.now();
  ioBuf = []; ioBufChars = 0; ioLastFlush = started; ioFlushCount = 0; ioItemsTotal = 0; ioCapped = false;
  post({ type: 'run:start', runId });
  try {
    const raw = runner(code, JSON.stringify(stdin || []));
    const parsed = JSON.parse(raw);
    flushIO();
    post({
      type: 'result',
      runId,
      ok: parsed.ok,
      error: parsed.error,
      vars: parsed.vars,
      ms: Math.round(performance.now() - started),
    });
  } catch (err) {
    flushIO();
    post({
      type: 'result', runId, ok: false,
      error: { type: 'InternalError', message: String(err), line: null, formatted: String(err) },
      vars: [],
      ms: Math.round(performance.now() - started),
    });
  }
}

self.onmessage = (event) => {
  const msg = event.data || {};
  if (msg.type === 'init') init(msg.sources || [msg.indexURL]);
  else if (msg.type === 'run') run(msg.runId, msg.code, msg.stdin);
};
