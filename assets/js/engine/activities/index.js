/**
 * Activity registry.
 *
 * The one place the application learns about activity types. Adding a new
 * kind of exercise = write `my-activity.js` exporting
 * `(ctx) => ({ el, destroy? })` and add a line here.
 */
import { concept } from './concept.js';
import { run } from './run.js';
import { experiment } from './experiment.js';
import { repair } from './repair.js';
import { detective } from './detective.js';
import { fill } from './fill.js';
import { assemble } from './assemble.js';
import { build } from './build.js';
import { quiz } from './quiz.js';

export const ACTIVITIES = { concept, run, experiment, repair, detective, fill, assemble, build, quiz };

export function createActivity(type, ctx) {
  const factory = ACTIVITIES[type];
  if (!factory) {
    const el = document.createElement('div');
    el.className = 'fb fb--err';
    el.textContent = `Unknown activity type: "${type}"`;
    return { el };
  }
  return factory(ctx);
}

export const ACTIVITY_TYPES = Object.keys(ACTIVITIES);
