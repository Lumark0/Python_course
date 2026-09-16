/**
 * Mission runner.
 *
 * Owns the frame around an activity: the briefing, the task checklist, the
 * scene stepper, persistence of where the learner got to, and the
 * completion screen. Knows nothing about *any* specific lesson — it is
 * driven entirely by the mission data object.
 */
import { h, clear, rich } from '../core/dom.js';
import { go } from '../core/router.js';
import * as store from '../core/store.js';
import { createActivity } from './activities/index.js';
import { toast } from '../ui/toast.js';
import { getMission, nextMission } from '../data/missions/index.js';

export function renderMission(missionId, sceneParam, outlet) {
  const mission = getMission(missionId);
  if (!mission) {
    outlet.appendChild(h('div.wrap.empty', null, [
      h('div.empty__ico', null, '⌁'),
      h('h1', null, 'Mission not found'),
      h('a.btn.btn--primary', { href: '#/missions' }, 'Back to missions'),
    ]));
    return;
  }

  if (sceneParam === 'complete') return renderComplete(mission, outlet);

  store.startMission(mission.id);
  const saved = store.mission(mission.id);

  const scenes = mission.scenes;
  let index = clampIndex(parseSceneParam(sceneParam, saved, scenes), scenes.length);

  const sceneHost = h('div.mission__main');

  /* On phones the sidebar would otherwise fill the entire first screen and
     push the activity below the fold, so the main column carries its own
     compact mission strip. It is hidden on wide screens. */
  const miniStatus = h('span.minibar__count');
  const miniBar = h('div.minibar', null, [
    h('div.minibar__id', null, [
      h('span.minibar__code', null, mission.code),
      h('span.minibar__name', null, mission.name),
    ]),
    h('div.row', null, [
      miniStatus,
      h('button.btn.btn--sm.btn--ghost', {
        type: 'button',
        onclick: () => aside.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      }, 'Tasks ↓'),
    ]),
  ]);
  const tasksEl = h('ul.tasklist');
  const statusEl = h('div.status-line');
  const stepperEl = h('div.stepper', { role: 'group', 'aria-label': 'Scenes in this mission' });
  const barEl = h('div.bar.bar--blocks', { 'aria-hidden': 'true' });

  let current = null;

  const aside = h('aside.mission__aside', null, [
    h('div.briefing', null, [
      h('div.briefing__id', null, mission.code),
      h('h1.briefing__name', null, mission.name),
      h('p.briefing__obj', { html: `<strong>Objective</strong><br>${rich(mission.objective)}` }),
    ]),
    h('div.card', null, [
      h('div.eyebrow', null, 'Tasks'),
      h('div', { style: { marginTop: 'var(--sp-3)' } }, [tasksEl]),
      h('div', { style: { marginTop: 'var(--sp-4)' } }, [barEl]),
      h('div', { style: { marginTop: 'var(--sp-3)' } }, [statusEl]),
    ]),
    h('div.card', null, [
      h('div.eyebrow', null, 'Scenes'),
      h('div', { style: { marginTop: 'var(--sp-3)' } }, [stepperEl]),
      h('a.btn.btn--sm.btn--ghost', { href: '#/missions', style: { marginTop: 'var(--sp-3)' } }, '← All missions'),
    ]),
  ]);

  outlet.appendChild(h('div.wrap', null, [h('div.mission', null, [aside, sceneHost])]));

  paintTasks();
  paintStepper();
  mountScene();

  /* ---------------- scene lifecycle ---------------- */

  function mountScene() {
    if (current?.destroy) { try { current.destroy(); } catch (e) { console.error(e); } }
    clear(sceneHost);
    const scene = scenes[index];
    store.markScene(mission.id, scene.id, { visited: true });
    store.update((s) => { store.mission(mission.id).lastScene = index; void s; });

    current = createActivity(scene.type, buildContext(scene));
    sceneHost.appendChild(miniBar);
    sceneHost.appendChild(h('div.row.row--between.scene-meta', null, [
      h('span.eyebrow', null, `Scene ${index + 1} of ${scenes.length}`),
      h('span.chip', null, scene.type),
    ]));
    sceneHost.appendChild(current.el);
    paintStepper();
    sceneHost.scrollIntoView({ block: 'nearest' });
  }

  function buildContext(scene) {
    return {
      scene,
      mission,
      get state() { return store.sceneState(mission.id, scene.id); },
      save: (patch) => store.markScene(mission.id, scene.id, patch),
      attempts: () => store.attempts(mission.id, scene.id),
      bumpAttempt: () => store.bumpAttempt(mission.id, scene.id),
      artifact: (key) => store.artifact(mission.id, key),
      saveArtifact: (key, value) => store.saveArtifact(mission.id, key, value),
      done: () => completeSceneTask(scene),
      next: () => advance(),
      goTo: (i) => { index = clampIndex(i, scenes.length); mountScene(); },
    };
  }

  function completeSceneTask(scene) {
    if (!scene.task) return;
    const isNew = store.completeTask(mission.id, scene.task);
    paintTasks();
    if (isNew) {
      const task = mission.tasks.find((t) => t.id === scene.task);
      toast({ title: 'Task complete', message: task ? task.label : '', kind: 'ok', icon: '✔' });
      const box = tasksEl.querySelector(`[data-task="${scene.task}"] .tasklist__box`);
      if (box) { box.dataset.pop = '1'; setTimeout(() => { delete box.dataset.pop; }, 500); }
    }
    maybeComplete();
  }

  function advance() {
    if (index < scenes.length - 1) { index += 1; mountScene(); return; }
    maybeComplete(true);
  }

  /**
   * @param {boolean} advancing true when the learner pressed Continue on
   *   the last scene. Completion is *recorded* the moment the last task is
   *   done, but the learner is never teleported away mid-celebration —
   *   they read their success feedback and leave when they choose.
   */
  function maybeComplete(advancing = false) {
    const done = mission.tasks.filter((t) => saved.tasks[t.id]).length;
    const finished = done === mission.tasks.length;
    if (finished) store.completeMission(mission.id);
    if (!advancing) return;
    if (finished) { go(`/mission/${mission.id}/complete`); return; }
    toast({
      title: 'Not finished yet',
      message: `${mission.tasks.length - done} task${mission.tasks.length - done === 1 ? '' : 's'} still open — use the scene numbers to go back.`,
      kind: 'info', icon: 'ℹ',
    });
  }

  /* ---------------- sidebar painting ---------------- */

  function paintTasks() {
    const m = store.mission(mission.id);
    clear(tasksEl);
    mission.tasks.forEach((t) => {
      const isDone = Boolean(m.tasks[t.id]);
      const isCurrent = !isDone && scenes[index]?.task === t.id;
      tasksEl.appendChild(h('li', {
        dataset: { done: isDone ? '1' : '0', current: isCurrent ? '1' : '0', task: t.id },
      }, [
        h('span.tasklist__box', { 'aria-hidden': 'true' }, isDone ? '☑' : '☐'),
        h('span.tasklist__txt', null, t.label),
      ]));
    });
    const done = mission.tasks.filter((t) => m.tasks[t.id]).length;
    statusEl.textContent = `MISSION STATUS  ${done} / ${mission.tasks.length}`;
    miniStatus.textContent = `${done} / ${mission.tasks.length}`;
    clear(barEl);
    mission.tasks.forEach((t) => barEl.appendChild(h('i', { dataset: { on: m.tasks[t.id] ? '1' : '0' } })));
  }

  function paintStepper() {
    const m = store.mission(mission.id);
    clear(stepperEl);
    scenes.forEach((s, i) => {
      const sceneDone = Boolean(m.scenes[s.id]?.done);
      const reachable = i <= furthestReachable(m);
      stepperEl.appendChild(h('button', {
        type: 'button',
        disabled: !reachable,
        'aria-current': i === index ? 'step' : null,
        'aria-label': `Scene ${i + 1}: ${s.title}`,
        title: s.title,
        dataset: { state: sceneDone ? 'done' : 'todo' },
        onclick: () => { index = i; mountScene(); paintTasks(); },
      }, String(i + 1)));
    });
  }

  function furthestReachable(m) {
    // Scenes unlock in order, but any visited scene stays open for review.
    let furthest = 0;
    scenes.forEach((s, i) => {
      if (m.scenes[s.id]?.visited || m.scenes[s.id]?.done) furthest = Math.max(furthest, i);
    });
    const firstUnfinished = scenes.findIndex((s) => !m.scenes[s.id]?.done);
    return Math.max(furthest, firstUnfinished === -1 ? scenes.length - 1 : firstUnfinished);
  }

  return () => { if (current?.destroy) current.destroy(); };
}

function parseSceneParam(param, saved, scenes) {
  if (param != null && param !== '') {
    const n = Number(param);
    if (Number.isFinite(n)) return n - 1;
  }
  if (typeof saved.lastScene === 'number') return saved.lastScene;
  const firstUnfinished = scenes.findIndex((s) => !saved.scenes?.[s.id]?.done);
  return firstUnfinished === -1 ? 0 : firstUnfinished;
}

function clampIndex(i, len) { return Math.max(0, Math.min(len - 1, i || 0)); }

/* ---------------- completion screen ---------------- */

function renderComplete(mission, outlet) {
  const m = store.mission(mission.id);
  const done = mission.tasks.filter((t) => m.tasks[t.id]).length;
  const pct = Math.round((done / mission.tasks.length) * 100);
  const blocks = Math.round(pct / 100 * 16);
  const next = nextMission(mission.id);

  outlet.appendChild(h('div.wrap.wrap--narrow', null, [
    h('div.complete', null, [
      h('div.complete__seal', { 'aria-hidden': 'true' }, '✓'),
      h('div', null, [
        h('div.eyebrow', null, 'Mission complete'),
        h('h1.complete__title', null, mission.name),
      ]),
      h('ul.complete__list', null, mission.outcomes.map((o) => h('li', null, [
        h('i', { 'aria-hidden': 'true' }, '✓'), h('span', null, o),
      ]))),
      h('div', { style: { width: '100%' } }, [
        h('div.eyebrow', { style: { marginBottom: 'var(--sp-2)' } }, 'Progress'),
        h('div.loadblocks', { style: { color: 'var(--ok)', fontFamily: 'var(--mono)' } },
          '█'.repeat(blocks) + '░'.repeat(16 - blocks) + `  ${pct}%`),
      ]),
      next
        ? h('div.complete__next', null, [
          h('div.eyebrow', null, 'Next mission'),
          h('h2', { style: { margin: 'var(--sp-2) 0' } }, `${next.code} · ${next.name}`),
          h('p.faint', null, next.objective),
          next.status === 'available'
            ? h('a.btn.btn--primary', { href: `#/mission/${next.id}`, style: { marginTop: 'var(--sp-3)' } }, 'Begin →')
            : h('p.chip.chip--warn', { style: { marginTop: 'var(--sp-3)' } }, 'In development'),
        ])
        : null,
      h('div.row', null, [
        h('a.btn', { href: `#/mission/${mission.id}/1` }, '↺ Replay this mission'),
        h('a.btn.btn--ghost', { href: '#/missions' }, 'All missions'),
        h('a.btn.btn--ghost', { href: '#/sandbox' }, 'Open the sandbox'),
      ]),
    ]),
  ]));
}
