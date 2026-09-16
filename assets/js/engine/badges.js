/**
 * Achievements. Deliberately small and mostly about *behaviour* rather
 * than completion — "you caused your first error and read it" is a better
 * thing to celebrate for a beginner than "you clicked next five times".
 */
import { getState, awardBadge, hasBadge } from '../core/store.js';
import { on } from '../core/bus.js';
import { toast } from '../ui/toast.js';
import { getMission } from '../data/missions/index.js';

export const BADGES = [
  { id: 'first-run',  icon: '▶',  name: 'First Execution',  desc: 'Ran real Python in your browser.' },
  { id: 'first-error',icon: '⚠',  name: 'Error Explorer',   desc: 'Made Python complain — and kept going.' },
  { id: 'repairer',   icon: '🔧', name: 'Repair Technician',desc: 'Fixed a broken program.' },
  { id: 'detective',  icon: '🔍', name: 'Code Detective',    desc: 'Located a fault by reading the error.' },
  { id: 'author',     icon: '✎',  name: 'Program Author',    desc: 'Wrote a program from an empty file.' },
  { id: 'mission-01', icon: '✦',  name: 'Mission 01 Clear',  desc: 'Completed YOUR FIRST CODE.' },
  { id: 'unaided',    icon: '★',  name: 'Unaided',           desc: 'Completed a mission without opening a hint.' },
  { id: 'persistent', icon: '∞',  name: 'Persistent',        desc: 'Ran 15 programs. Iteration is the job.' },
];

export function badgeById(id) { return BADGES.find((b) => b.id === id); }

function announce(id) {
  const b = badgeById(id);
  if (b) toast({ title: `Badge earned — ${b.name}`, message: b.desc, kind: 'ok', icon: b.icon });
}

/** Re-evaluate every rule. Cheap, so it can run on any state change. */
export function evaluateBadges() {
  const s = getState();
  const stats = s.stats;

  if (stats.runs >= 1) give('first-run');
  if (stats.errors >= 1) give('first-error');
  if (stats.runs >= 15) give('persistent');

  // Badges tied to *kinds* of work, resolved through the mission data —
  // so a new mission with a repair scene earns the same badge for free.
  const BY_TYPE = { repair: 'repairer', detective: 'detective', build: 'author' };
  for (const [mid, saved] of Object.entries(s.missions)) {
    const mission = getMission(mid);
    if (!mission) continue;
    for (const scene of mission.scenes) {
      if (saved.scenes?.[scene.id]?.done && BY_TYPE[scene.type]) give(BY_TYPE[scene.type]);
    }
    if (saved.completed) {
      if (mid === 'm01') give('mission-01');
      if (stats.hintsUsed === 0) give('unaided');
    }
  }
}

function give(id) {
  if (hasBadge(id)) return;
  if (awardBadge(id)) announce(id);
}

export function initBadges() {
  on('store:changed', () => evaluateBadges());
  evaluateBadges();
}
