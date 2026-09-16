/**
 * Entry point.
 *
 * Boot order matters: settings are applied before first paint (no flash of
 * the wrong theme), the UI mounts immediately, and only *then* does the
 * ~12 MB Python runtime start downloading in the background. The lab is
 * usable the whole time it loads.
 */
import { $ } from './core/dom.js';
import { route, start } from './core/router.js';
import { initSettings } from './core/settings.js';
import { initShell, hideBoot } from './ui/shell.js';
import { initBadges } from './engine/badges.js';
import * as runtime from './python/runtime.js';

import { home } from './views/home.js';
import { missions } from './views/missions.js';
import { sandbox } from './views/sandbox.js';
import { progress } from './views/progress.js';
import { achievements } from './views/achievements.js';
import { settings } from './views/settings.js';
import { renderMission } from './engine/mission.js';

initSettings();
initShell();
initBadges();

route('/',              (p, o) => home(p, o));
route('/missions',      (p, o) => missions(p, o));
route('/mission/:id',   (p, o) => renderMission(p.id, null, o));
route('/mission/:id/:scene', (p, o) => renderMission(p.id, p.scene, o));
route('/sandbox',       (p, o) => sandbox(p, o));
route('/progress',      (p, o) => progress(p, o));
route('/achievements',  (p, o) => achievements(p, o));
route('/settings',      (p, o) => settings(p, o));

start($('#view'));
hideBoot();

/* Start the interpreter download after the first frame, so the shell
   paints first and the learner is never staring at a blocked page. */
requestAnimationFrame(() => {
  requestAnimationFrame(() => runtime.boot());
});

/* Time in the lab, for the progress screen. */
import { bumpStat } from './core/store.js';
let seconds = 0;
setInterval(() => {
  if (document.visibilityState === 'visible') {
    seconds += 15;
    if (seconds >= 60) { bumpStat('secondsInLab', seconds); seconds = 0; }
  }
}, 15000);
