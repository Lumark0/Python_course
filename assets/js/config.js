/**
 * Teacher configuration.
 *
 * This is the only file a teacher needs to touch to turn on progress
 * tracking. Leave SHEET_WEBHOOK_URL blank and the lab behaves exactly as
 * documented in the main README: fully local, no accounts, nothing sent
 * anywhere. Fill it in and two things change — learners are asked for
 * their name once, and a summary of their progress is sent to your
 * Google Sheet after every change.
 *
 * How to get a URL to paste here: see teacher/SETUP.md. Short version —
 * create a Google Sheet, Extensions -> Apps Script, paste in
 * teacher/apps-script.gs, Deploy -> New deployment -> Web app, and copy
 * the URL it gives you.
 */
export const SHEET_WEBHOOK_URL = '';
