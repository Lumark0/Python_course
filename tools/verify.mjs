/**
 * End-to-end verification of the lab, driven by a real browser running the
 * real Pyodide runtime. This is the script whose output is quoted in the
 * README — every claim about the app is checked here rather than asserted.
 *
 *   npm install                       (playwright only; the app has no deps)
 *   npx playwright install chromium
 *   python3 -m http.server 8777       (in another terminal)
 *   node tools/verify.mjs [--base http://127.0.0.1:8777] [--pyodide <url>]
 *
 * Pass --pyodide with a local Pyodide directory to run without network
 * access; omit it to verify against the CDN build that ships to Pages.
 * Pass --exe to use a Chromium already present on the machine (CI images
 * often ship one) instead of Playwright's own download.
 */
import { chromium } from 'playwright';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const HOST = arg('base', 'http://127.0.0.1:8777');
const PYODIDE = arg('pyodide', null);
const BASE = `${HOST}/index.html${PYODIDE ? `?pyodide=${encodeURIComponent(PYODIDE)}` : ''}`;

let passed = 0;
let failed = 0;
const ok = (name, condition) => {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}`); }
};
const section = (name) => console.log(`\n${name}`);

const EXE = arg('exe', process.env.CHROMIUM_PATH || null);
const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`); });

const engineReady = () => page.waitForFunction(
  () => document.querySelector('#engineChip')?.dataset.state === 'ready',
  null, { timeout: 180000 },
);
const tasks = () => page.textContent('.status-line');
const go = (hash) => page.goto(BASE + hash, { waitUntil: 'load' });

/* ------------------------------------------------------------------ */
section('Engine');
await go('#/');
ok('application shell renders', await page.isVisible('#app'));
await engineReady();
const version = await page.textContent('.engine-chip__text');
ok(`real Python reported by the engine (${version})`, /Python 3\./.test(version));
await page.waitForFunction(
  () => /is running in your browser/.test(document.querySelector('.term__out')?.textContent || ''),
  null, { timeout: 60000 },
);
ok('home screen runs real Python on load', true);

/* ------------------------------------------------------------------ */
section('Mission 01 — scene by scene');
await go('#/mission/m01/1');
await engineReady();

ok('continue is gated until the scene is solved', !(await page.isVisible('.scene__foot .btn--primary')));
await page.click('.machine__cmds button:nth-child(1)');
await page.waitForTimeout(700);
ok('s1: vague instruction rejected', (await page.textContent('.machine__screen')).includes('do not understand'));
await page.click('.machine__cmds button:nth-child(3)');
await page.waitForTimeout(700);
ok('s1: exact instruction obeyed', (await page.textContent('.machine__screen')).trim() === 'Hello, Python!');
ok('s1: task recorded', (await tasks()).includes('1 / 8'));
await page.click('.scene__foot .btn--primary');

await page.waitForTimeout(400);
ok('s2: line anatomy rendered', (await page.$$('.anatomy__col')).length === 4);
ok('s2: run is blocked until a prediction is made', await page.isDisabled('.runbar .btn--primary'));
await page.click('.quiz__opt:nth-child(2)');
await page.waitForTimeout(200);
ok('s2: run unlocked after predicting', !(await page.isDisabled('.runbar .btn--primary')));
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--ok', { timeout: 60000 });
ok('s2: real output in the terminal', (await page.textContent('.term__out')).includes('Hello, Python!'));
await page.waitForTimeout(2200);
ok('s2: pipeline visualiser shows the result', (await page.textContent('.pipe__node:last-child .pipe__content')).includes('Hello, Python!'));
await page.click('.scene__foot .btn--primary');

await page.waitForTimeout(400);
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--hint', { timeout: 60000 });
ok('s3: unchanged program is not accepted', await page.isVisible('.fb--hint'));
await page.fill('.editor__ta', 'print("Systems nominal, Commander.")');
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--ok', { timeout: 60000 });
ok('s3: edited program accepted', (await tasks()).includes('3 / 8'));
ok('s3: character-level diff proves authorship', (await page.$$('.diff ins')).length > 0);
await page.click('.scene__foot .btn--primary');

await page.waitForTimeout(400);
await page.click('.quiz .quiz__opt:nth-child(1)');
await page.waitForTimeout(200);
ok('s4: wrong answer is explained, not just marked', await page.isVisible('.fb--err'));
await page.click('.quiz .quiz__opt:nth-child(2)');
await page.waitForTimeout(200);
ok('s4: checkpoint passed without consuming a task', (await tasks()).includes('3 / 8'));
await page.click('.scene__foot .btn--primary');

await page.waitForTimeout(400);
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--err', { timeout: 60000 });
ok('s5: genuine SyntaxError from CPython', /SyntaxError/.test(await page.textContent('.term__out')));
ok('s5: error translated into plain language', (await page.textContent('.fb--err')).includes('bracket'));
await page.click('.mission__main .card .btn.btn--sm');
await page.waitForTimeout(150);
ok('s5: hint ladder reveals one rung at a time', (await page.$$('.fb--hint')).length === 1);
await page.fill('.editor__ta', 'print("Hello, Python!")');
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--ok', { timeout: 60000 });
ok('s5: repair accepted', (await tasks()).includes('4 / 8'));
await page.click('.scene__foot .btn--primary');

await page.waitForTimeout(400);
await (await page.$$('.dtok'))[0].click();
await page.waitForTimeout(150);
ok('s6: cannot accuse before collecting evidence', (await page.textContent('.fb')).includes('Run the program first'));
await page.click('.runbar .btn--primary');
await page.waitForTimeout(3000);
ok('s6: real traceback used as evidence', /SyntaxError/.test(await page.textContent('.term__out')));
const dtoks = await page.$$('.dtok');
await dtoks[0].click();
await page.waitForTimeout(200);
ok('s6: decoy gives tailored feedback', (await page.textContent('.fb--err')).includes('Line 1'));
const faultIndex = await page.evaluate(() => {
  const t = [...document.querySelectorAll('.dtok')];
  return t.map((e, i) => [i, e.textContent]).filter(([, v]) => v === '(')[1][0];
});
await dtoks[faultIndex].click();
await page.waitForTimeout(250);
ok('s6: correct fault localised', (await tasks()).includes('5 / 8'));
await page.click('.scene__foot .btn--primary');

await page.waitForTimeout(400);
await page.fill('.fillline__input', 'Ali');
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--err', { timeout: 60000 });
ok('s7: unquoted word produces a real NameError', /NameError/.test(await page.textContent('.term__out')));
ok('s7: NameError coached toward quotation marks', (await page.textContent('.fb--err')).includes('"Ali"'));
await page.fill('.fillline__input', '"Ali"');
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--ok', { timeout: 60000 });
ok('s7: completed line accepted', (await tasks()).includes('6 / 8'));
await page.click('.scene__foot .btn--primary');

await page.waitForTimeout(400);
const pick = async (label) => {
  await page.evaluate((lab) => {
    const tray = document.querySelectorAll('.blocks')[1];
    [...tray.querySelectorAll('button')].find((b) => b.textContent === lab && !b.disabled)?.click();
  }, label);
  await page.waitForTimeout(90);
};
await pick('Print'); await pick('('); await pick('"Lab systems ready"'); await pick(')');
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--err', { timeout: 60000 });
ok('s8: `Print` vs `print` fails for the real reason', /NameError/.test(await page.textContent('.term__out')));
await page.click('.runbar .btn--ghost');
await page.waitForTimeout(150);
await pick('print'); await pick('('); await pick('"Lab systems ready"'); await pick(')');
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--ok', { timeout: 60000 });
ok('s8: assembled line accepted', (await tasks()).includes('7 / 8'));
await page.click('.scene__foot .btn--primary');

await page.waitForTimeout(400);
ok('s9: requirements visible before the first run', (await page.$$('.reqs li')).length === 5);
await page.fill('.editor__ta', 'print("Ali")\nprint("Ali")\nprint("Ali")');
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--hint', { timeout: 60000 });
ok('s9: three identical lines rejected', await page.isVisible('.fb--hint'));
await page.fill('.editor__ta', 'print("Ali Hassan")\nprint("Lahore Training Centre")\nprint("Football")');
await page.click('.runbar .btn--primary');
await page.waitForSelector('.fb--ok', { timeout: 60000 });
ok('s9: learner-written program accepted', (await tasks()).includes('8 / 8'));
await page.click('.scene__foot .btn--primary');

/* ------------------------------------------------------------------ */
section('Completion and persistence');
await page.waitForTimeout(700);
ok('mission completion screen shown', await page.isVisible('.complete__seal'));
ok('next mission announced', (await page.textContent('.complete__next')).includes('Variable Control'));
ok('header ring reads 100%', (await page.textContent('#topPct')) === '100%');
await go('#/progress');
await page.waitForTimeout(1000);
ok('progress survives a page reload', (await page.textContent('body')).includes('100%'));
await go('#/achievements');
await page.waitForTimeout(600);
const badges = await page.$$eval('.badge[data-earned="1"]', (n) => n.length);
ok(`badges awarded (${badges})`, badges >= 5);

/* ------------------------------------------------------------------ */
section('Execution semantics — the claims the lessons make');
await go('#/sandbox');
await engineReady();
const loadExample = (label) => page.evaluate(
  (l) => [...document.querySelectorAll('.card .btn')].find((b) => b.textContent === l).click(), label,
);

await loadExample('A syntax error');
await page.click('.runbar .btn--primary');
await page.waitForTimeout(2500);
const syn = await page.textContent('.term__out');
ok('syntax error really does prevent every line from running', !syn.includes('this line looks fine') && /SyntaxError/.test(syn));

await loadExample('A runtime error');
await page.click('.runbar .btn--primary');
await page.waitForTimeout(2500);
const rt = await page.textContent('.term__out');
ok('runtime error stops midway, not before the start', rt.includes('this line DOES run') && !rt.includes('this one never happens'));

await loadExample('A variable');
await page.click('.runbar .btn--primary');
await page.waitForTimeout(2500);
ok('memory inspector reflects the real namespace', (await page.textContent('.mem')).includes("'Ali'"));

await page.fill('.editor__ta', 'x = input("Name? ")');
await page.click('.runbar .btn--primary');
await page.waitForTimeout(2500);
ok('input() fails honestly instead of being faked', /EOFError|no input was supplied/.test(await page.textContent('.term__out')));

section('Interruption');
await page.fill('.editor__ta', 'while True:\n    pass');
await page.click('.runbar .btn--primary');
await page.waitForTimeout(5200);
ok('runaway loop offers a Stop control', !(await page.$eval('.btn--danger', (n) => n.hidden)));
await page.click('.btn--danger');
await page.waitForTimeout(800);
ok('stopping reports the interruption', (await page.textContent('.term__out')).includes('stopped'));
await engineReady();
ok('engine recovers by itself after a stop', true);
await page.fill('.editor__ta', 'print("alive")');
await page.click('.runbar .btn--primary');
await page.waitForTimeout(3000);
ok('code runs again after recovery', (await page.textContent('.term__out')).includes('alive'));

section('Interface');
await go('#/settings');
await page.waitForTimeout(500);
const segment = (label) => page.evaluate(
  (l) => [...document.querySelectorAll('.seg button')].find((b) => b.textContent === l).click(), label,
);
await segment('Light');
ok('light theme applies', await page.getAttribute('html', 'data-theme') === 'light');
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(800);
ok('theme persists', await page.getAttribute('html', 'data-theme') === 'light');
await segment('Dark');
await go('#/does-not-exist');
await page.waitForTimeout(400);
ok('unknown routes handled', (await page.textContent('body')).includes('Sector not found'));

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(BASE + '#/mission/m01/2', { waitUntil: 'load' });
await mobile.waitForTimeout(2500);
ok('no horizontal overflow at 390px', !(await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
ok('activity is above the fold on a phone', await mobile.evaluate(() => {
  const el = document.querySelector('.scene__title');
  return el ? el.getBoundingClientRect().top < window.innerHeight : false;
}));
await mobile.close();

/* ------------------------------------------------------------------ */
console.log(`\n${passed} passed, ${failed} failed`);
console.log(`console errors: ${consoleErrors.length ? consoleErrors.join(' | ') : 'none'}`);
await browser.close();
process.exit(failed || consoleErrors.length ? 1 : 0);
