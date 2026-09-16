/**
 * Progress store.
 *
 * Everything the learner earns lives in one versioned object in
 * localStorage. Versioning means a future schema change can migrate
 * instead of wiping someone's work.
 */
import { emit } from './bus.js';

const KEY = 'ptl.progress.v1';
const VERSION = 1;

const DEFAULTS = () => ({
  v: VERSION,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  learner: { name: '' },
  settings: { theme: 'dark', motion: 'full', density: 'normal', fontSize: 15 },
  missions: {},            // id -> { started, completed, tasks:{}, scenes:{}, attempts:{}, artifacts:{} }
  stats: { runs: 0, errors: 0, hintsUsed: 0, charsTyped: 0, secondsInLab: 0 },
  badges: {},              // id -> earnedAt
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (err) {
    console.warn('[store] could not read progress, starting fresh', err);
    return DEFAULTS();
  }
}

/** Future-proofing: bring older saves forward instead of discarding them. */
function migrate(data) {
  const base = DEFAULTS();
  if (!data || typeof data !== 'object') return base;
  // v1 is the first schema; deep-merge onto defaults so new keys appear.
  return {
    ...base, ...data,
    v: VERSION,
    learner: { ...base.learner, ...(data.learner || {}) },
    settings: { ...base.settings, ...(data.settings || {}) },
    stats: { ...base.stats, ...(data.stats || {}) },
    missions: data.missions || {},
    badges: data.badges || {},
  };
}

let saveTimer = null;

/** Write immediately. Used for anything a learner might act on at once. */
function writeNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    // Private browsing / quota. The lab still works, it just forgets.
    console.warn('[store] progress could not be saved', err);
    emit('store:unavailable', err);
  }
}

function persist() {
  state.updatedAt = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeNow, 120);
}

/** Flush any debounced write. Exposed for tests and shutdown handlers. */
export function flush() { if (saveTimer) writeNow(); }

/* A learner who flips a setting and immediately reloads, or closes the tab
   mid-scene, must not lose the write that was still waiting on the debounce. */
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export function getState() { return state; }

/** Mutate through a function, then notify. */
export function update(fn) {
  fn(state);
  persist();
  emit('store:changed', state);
  return state;
}

export function mission(id) {
  if (!state.missions[id]) {
    state.missions[id] = { started: null, completed: null, tasks: {}, scenes: {}, attempts: {}, artifacts: {} };
  }
  return state.missions[id];
}

export function startMission(id) {
  update((s) => { const m = mission(id); if (!m.started) m.started = Date.now(); void s; });
}

export function completeTask(missionId, taskId) {
  const m = mission(missionId);
  if (m.tasks[taskId]) return false;            // already done — no duplicate celebration
  update(() => { m.tasks[taskId] = Date.now(); });
  emit('task:completed', { missionId, taskId });
  return true;
}

export function markScene(missionId, sceneId, patch = {}) {
  const m = mission(missionId);
  update(() => { m.scenes[sceneId] = { ...(m.scenes[sceneId] || {}), ...patch }; });
}

export function sceneState(missionId, sceneId) {
  return mission(missionId).scenes[sceneId] || {};
}

export function bumpAttempt(missionId, sceneId) {
  const m = mission(missionId);
  const n = (m.attempts[sceneId] || 0) + 1;
  update(() => { m.attempts[sceneId] = n; });
  return n;
}

export function attempts(missionId, sceneId) {
  return mission(missionId).attempts[sceneId] || 0;
}

/** Learner-authored code, kept so returning to a scene restores their work. */
export function saveArtifact(missionId, key, value) {
  const m = mission(missionId);
  update(() => { m.artifacts[key] = value; });
}
export function artifact(missionId, key) {
  return mission(missionId).artifacts[key];
}

export function completeMission(id) {
  const m = mission(id);
  if (m.completed) return false;
  update(() => { m.completed = Date.now(); });
  emit('mission:completed', { missionId: id });
  return true;
}

export function bumpStat(key, by = 1) {
  update((s) => { s.stats[key] = (s.stats[key] || 0) + by; });
}

export function setSetting(key, value) {
  update((s) => { s.settings[key] = value; });
  flush();                       // applied instantly, so stored instantly
  emit('settings:changed', state.settings);
}

export function awardBadge(id) {
  if (state.badges[id]) return false;
  update((s) => { s.badges[id] = Date.now(); });
  emit('badge:earned', { id });
  return true;
}

export function hasBadge(id) { return Boolean(state.badges[id]); }

export function resetAll() {
  state = DEFAULTS();
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  persist();
  emit('store:changed', state);
}

export function exportJSON() { return JSON.stringify(state, null, 2); }

export function importJSON(text) {
  const parsed = JSON.parse(text);
  state = migrate(parsed);
  persist();
  emit('store:changed', state);
}
