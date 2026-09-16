/**
 * Curriculum registry.
 *
 * The full ten-mission arc is declared here from day one so the app,
 * the map screen and the progress maths are all built against the real
 * shape of the course. Missions still in development carry
 * `status: 'planned'` and a stub; shipping one means importing its data
 * file and flipping the status. Nothing else changes.
 */
import m01 from './m01-first-code.js';

/** Placeholder entries: everything the UI needs, minus the scenes. */
const PLANNED = [
  { id: 'm02', code: 'MISSION 02', name: 'Variable Control',  objective: 'Give the computer a memory.',            summary: 'Variables, assignment, naming, reassignment.',       concepts: ['variables', 'assignment', 'names'] },
  { id: 'm03', code: 'MISSION 03', name: 'Data Type Lab',     objective: 'Learn what kind of thing a value is.',    summary: 'str, int, float, bool, conversion.',                 concepts: ['types', 'int', 'str', 'float', 'bool'] },
  { id: 'm04', code: 'MISSION 04', name: 'Input Station',     objective: 'Let a human talk to your program.',       summary: 'input(), prompts, converting what you receive.',      concepts: ['input()', 'conversion'] },
  { id: 'm05', code: 'MISSION 05', name: 'Decision Lab',      objective: 'Teach the program to choose.',            summary: 'if / elif / else, comparison, indentation.',          concepts: ['if', 'comparison', 'blocks'] },
  { id: 'm06', code: 'MISSION 06', name: 'Loop Laboratory',   objective: 'Make the computer repeat itself.',        summary: 'for, while, range(), and the runaway loop.',          concepts: ['for', 'while', 'range'] },
  { id: 'm07', code: 'MISSION 07', name: 'List Workshop',     objective: 'Store many things under one name.',       summary: 'Lists, indexing, append, iteration.',                 concepts: ['list', 'index', 'iteration'] },
  { id: 'm08', code: 'MISSION 08', name: 'Function Factory',  objective: 'Build your own instructions.',            summary: 'def, parameters, return, reuse.',                     concepts: ['def', 'parameters', 'return'] },
  { id: 'm09', code: 'MISSION 09', name: 'Debugging Center',  objective: 'Find faults on purpose.',                 summary: 'Reading tracebacks, isolating, testing a fix.',       concepts: ['traceback', 'isolation', 'testing'] },
  { id: 'm10', code: 'MISSION 10', name: 'Python Project',    objective: 'Build something that is yours.',          summary: 'Combine everything into one working program.',        concepts: ['project'] },
].map((m) => ({ ...m, status: 'planned', minutes: null, tasks: [], scenes: [], outcomes: [] }));

export const MISSIONS = [m01, ...PLANNED];

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
