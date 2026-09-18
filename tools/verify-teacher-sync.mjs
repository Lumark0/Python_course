/**
 * Scoped verification for the name-gate + teacher-sync feature. Unlike
 * tools/verify.mjs this never waits on the Python engine (Pyodide), so it
 * works even in a sandbox whose egress policy blocks the CDN — it only
 * exercises the DOM/localStorage/network-request behaviour this feature
 * actually added.
 *
 *   python3 -m http.server 8777
 *   node tools/verify-teacher-sync.mjs [--base http://127.0.0.1:8777]
 */
import { chromium } from 'playwright';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const HOST = arg('base', 'http://127.0.0.1:8777');
const EXE = arg('exe', process.env.CHROMIUM_PATH || null);

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log(`  PASS  ${name}`); } else { failed++; console.log(`  FAIL  ${name}`); } };
const section = (name) => console.log(`\n${name}`);

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});

/* ------------------------------------------------------------------ */
section('Default behaviour (SHEET_WEBHOOK_URL empty) — no regression');
{
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${HOST}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  ok('no name gate appears', !(await page.isVisible('.namegate')));
  ok('app shell is visible', await page.isVisible('#app'));
  ok('no page errors', errors.length === 0);
  await page.close();
}

/* ------------------------------------------------------------------ */
section('With a webhook configured');
{
  // Serve a variant of config.js with a fake webhook URL, without
  // touching the real file on disk.
  const page = await browser.newPage();
  const requests = [];
  await page.route('**/config.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: "export const SHEET_WEBHOOK_URL = 'https://example.invalid/exec';",
    });
  });
  await page.route('https://example.invalid/**', async (route) => {
    requests.push({ method: route.request().method(), body: route.request().postData() });
    await route.fulfill({ status: 200, body: 'ok' });
  });

  await page.goto(`${HOST}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  ok('name gate blocks first load', await page.isVisible('.namegate'));

  await page.fill('.namegate__input', 'Test Student');
  await page.click('.namegate__form button[type="submit"]');
  await page.waitForTimeout(300);
  ok('name gate dismisses on submit', !(await page.isVisible('.namegate')));

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ptl.progress.v1') || '{}'));
  ok('name is persisted to progress store', stored.learner?.name === 'Test Student');

  await page.waitForTimeout(5000); // past the sync debounce
  ok('a sync request was sent', requests.length > 0);
  if (requests.length) {
    const payload = JSON.parse(requests[0].body);
    ok('payload carries the learner name', payload.name === 'Test Student');
    ok('payload has overall/mission summary shape', 'overallPct' in payload && 'missions' in payload);
  }

  // Reload: returning learner on the same browser should not be re-gated.
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  ok('returning learner is not re-prompted', !(await page.isVisible('.namegate')));

  await page.close();
}

/* ------------------------------------------------------------------ */
section('Settings screen');
{
  const page = await browser.newPage();
  await page.route('**/config.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: "export const SHEET_WEBHOOK_URL = 'https://example.invalid/exec';",
    });
  });
  await page.route('https://example.invalid/**', (route) => route.fulfill({ status: 200, body: 'ok' }));
  await page.goto(`${HOST}/index.html`, { waitUntil: 'load' });
  await page.fill('.namegate__input', 'Ali Hassan');
  await page.click('.namegate__form button[type="submit"]');
  await page.waitForTimeout(300);
  await page.goto(`${HOST}/index.html#/settings`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  ok('name field appears in Settings', await page.isVisible('.field-input'));
  ok('name field is pre-filled', await page.inputValue('.field-input') === 'Ali Hassan');
  await page.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
