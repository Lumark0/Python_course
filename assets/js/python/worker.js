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
      post({ type: 'io', kind, text });
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
  post({ type: 'run:start', runId });
  try {
    const raw = runner(code, JSON.stringify(stdin || []));
    const parsed = JSON.parse(raw);
    post({
      type: 'result',
      runId,
      ok: parsed.ok,
      error: parsed.error,
      vars: parsed.vars,
      ms: Math.round(performance.now() - started),
    });
  } catch (err) {
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
