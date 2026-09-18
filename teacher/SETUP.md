# Teacher setup — seeing student progress

This turns on two things: students are asked for their name once, and
their progress is written to a Google Sheet you own. Nothing is required
to keep using the lab exactly as it was before — skip this file entirely
and it stays a local-only, no-accounts app.

Budget about 10 minutes the first time. You will not need to write or
understand any code.

## 1. Create the sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it whatever you like, e.g. "Python Lab —
   Class Progress."
2. In the menu, click **Extensions → Apps Script**. A new tab opens with
   a code editor and a file called `Code.gs` containing a sample function.

## 2. Paste in the script

1. In this repository, open `teacher/apps-script.gs` and copy its entire
   contents.
2. Back in the Apps Script editor, select everything in `Code.gs`
   (Ctrl+A) and delete it, then paste in what you copied.
3. Click the save icon (or Ctrl+S). You can rename the project at the
   top (e.g. "Python Lab Progress") if you like — it doesn't matter.

## 3. Deploy it as a web app

1. Click the blue **Deploy** button (top right) → **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. The first time, Google will ask you to authorize the script — click
   **Authorize access**, choose your account, and if you see a screen
   saying "Google hasn't verified this app," click **Advanced** →
   **Go to (project name) (unsafe)**. This warning appears because it's
   your own personal script, not because anything is actually unsafe.
6. You'll be given a **Web app URL** ending in `/exec`. Copy it — this
   is the only thing you need from this step.

## 4. Put the URL into the lab

1. On GitHub, open your repository and navigate to `assets/js/config.js`.
2. Click the pencil (✏️) icon to edit it.
3. Replace the empty quotes with your URL, so the line reads like:
   ```js
   export const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
   (Keep the quotes, paste your own URL between them.)
4. Scroll down and commit the change directly to `main`.
5. Wait a minute or two for the **Actions** tab to finish redeploying,
   the same way it did the first time you set up Pages.

## 5. Try it

1. Open your live site in a private/incognito browser window (so it
   doesn't reuse a name you may have already tried).
2. You should see a "Welcome to the lab" name prompt before anything
   else. Type a test name and click Start.
3. Do a little bit of Mission 01 — run some code, complete a task.
4. Go back to your Google Sheet. Within a few seconds, a new tab named
   **Progress** should appear (if it isn't already open) with a row for
   your test name, updating as you interact with the lab.

If nothing appears after a minute: reopen `assets/js/config.js` and
double-check the URL was pasted correctly with no extra spaces or line
breaks, and that it still ends in `/exec`.

## What each column means

| Column | Meaning |
| --- | --- |
| Name | Whatever the student typed at the welcome screen |
| Last active | When this row last updated |
| Overall % | Percentage of all published-mission tasks completed |
| Tasks done / Tasks total | The same, as a fraction |
| Missions | Per-mission status and task count, e.g. `m01: complete (8)` |
| Runs / Errors / Hints used | From that student's whole session |
| Badges | Number of achievements earned |
| Minutes in lab | Rough time-on-task, counted only while the tab is in the foreground |

## Notes

- **One row per student**, matched by the name they typed (not
  case-sensitive). If two students type their name differently
  ("Ali" vs "ali hassan"), they'll get separate rows — it's worth
  telling the class to use their real, consistent name.
- **This is a name, not a login.** Nothing stops a student from typing
  someone else's name. For a classroom practice tool this is normally an
  acceptable trade-off for the zero setup it takes; if you need real
  verified identity, that's a bigger change (school Google/Microsoft
  sign-in) — ask if you want that instead.
- **If you ever edit `teacher/apps-script.gs` again** (to change what's
  tracked, for example), you need to redeploy: Deploy → Manage
  deployments → pencil icon → Version: New version → Deploy. Simply
  saving the script does not update the live URL.
- The web app URL should be treated as semi-private — anyone who has it
  could technically send it fake data — but nothing sensitive is
  exposed by it, and only your own Google account can read the sheet
  itself.
