/**
 * Python Training Lab — progress receiver.
 *
 * Paste this into a Google Sheet's Apps Script editor (Extensions ->
 * Apps Script), then deploy it as a Web App (see SETUP.md in this same
 * folder). The lab's browser code posts a small JSON summary here every
 * time a learner's progress changes; this script keeps one row per
 * learner, always up to date, in the sheet you deployed it from.
 *
 * Nothing here needs editing before you deploy it. It creates its own
 * header row the first time it receives data.
 */

const SHEET_NAME = 'Progress';
const HEADERS = [
  'Name', 'Last active', 'Overall %', 'Tasks done', 'Tasks total',
  'Missions', 'Runs', 'Errors', 'Hints used', 'Badges', 'Minutes in lab',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const name = String(body.name || '').trim();
    if (!name) return respond({ ok: false, error: 'missing name' });

    const sheet = getOrCreateSheet();
    const row = buildRow(body, name);
    upsertRow(sheet, name, row);

    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Python Training Lab progress endpoint is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function buildRow(body, name) {
  const missions = body.missions || {};
  const missionSummary = Object.keys(missions).sort().map((id) => {
    const m = missions[id];
    const state = m.completed ? 'complete' : m.started ? 'in progress' : 'not started';
    return `${id}: ${state} (${m.tasksDone || 0})`;
  }).join(', ');

  const stats = body.stats || {};
  const minutes = Math.round((stats.secondsInLab || 0) / 60);

  return [
    name,
    new Date(body.updatedAt || Date.now()),
    body.overallPct || 0,
    body.overallDone || 0,
    body.overallTotal || 0,
    missionSummary,
    stats.runs || 0,
    stats.errors || 0,
    stats.hintsUsed || 0,
    body.badges || 0,
    minutes,
  ];
}

/** One row per learner, matched by name (case-insensitive). */
function upsertRow(sheet, name, row) {
  const lastRow = sheet.getLastRow();
  const key = name.toLowerCase();

  if (lastRow > 1) {
    const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < names.length; i++) {
      if (String(names[i][0]).trim().toLowerCase() === key) {
        sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
        return;
      }
    }
  }
  sheet.appendRow(row);
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
