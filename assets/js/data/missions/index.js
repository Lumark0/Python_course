/**
 * Curriculum registry.
 *
 * All ten missions are imported and registered here. Each mission file is
 * pure data (see m01-first-code.js for the shape contract); nothing in this
 * file or the engine needs to change to add, reorder or retire one — only
 * this import list and the MISSIONS array below. A mission not yet written
 * would carry `status: 'planned'` and no scenes; there are none right now.
 */
import m01 from './m01-first-code.js';
import m02 from './m02-variables.js';
import m03 from './m03-data-types.js';
import m04 from './m04-input-station.js';
import m05 from './m05-decision-lab.js';
import m06 from './m06-loop-laboratory.js';
import m07 from './m07-list-workshop.js';
import m08 from './m08-function-factory.js';
import m09 from './m09-debugging-center.js';
import m10 from './m10-python-project.js';

export const MISSIONS = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10];

export function getMission(id) { return MISSIONS.find((m) => m.id === id) || null; }

export function nextMission(id) {
  const i = MISSIONS.findIndex((m) => m.id === id);
  return i >= 0 && i < MISSIONS.length - 1 ? MISSIONS[i + 1] : null;
}

export const PLAYABLE = MISSIONS.filter((m) => m.status === 'available');

/**
 * Overall course progress.
 *
 * Deliberately measured against the *published* missions only. Showing
 * "8%" because nine missions are unwritten would punish a learner for our
 * roadmap; the map screen shows the roadmap separately.
 */
export function overallProgress(state) {
  const published = MISSIONS.filter((m) => m.status === 'available');
  const totalTasks = published.reduce((n, m) => n + m.tasks.length, 0);
  if (!totalTasks) return { pct: 0, done: 0, total: 0 };
  const done = published.reduce((n, m) => {
    const saved = state.missions[m.id];
    if (!saved) return n;
    return n + m.tasks.filter((t) => saved.tasks[t.id]).length;
  }, 0);
  return { pct: Math.round((done / totalTasks) * 100), done, total: totalTasks };
}

/** available | in-progress | complete | locked */
export function missionState(mission, state) {
  if (mission.status !== 'available') return 'locked';
  const saved = state.missions[mission.id];
  if (!saved || !saved.started) return 'available';
  if (saved.completed) return 'complete';
  return 'in-progress';
}
