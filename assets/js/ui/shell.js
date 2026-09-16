/**
 * Application chrome: navigation state, the progress ring, the engine
 * status chip and the mobile drawer.
 */
import { $, $$ } from '../core/dom.js';
import { on } from '../core/bus.js';
import { getState } from '../core/store.js';
import { overallProgress } from '../data/missions/index.js';
import * as runtime from '../python/runtime.js';

const RING_CIRCUMFERENCE = 2 * Math.PI * 15.5;

export function initShell() {
  const rail = $('#rail');
  const scrim = $('#railScrim');
  const toggle = $('#navToggle');

  /* ---- mobile drawer ---- */
  function setDrawer(open) {
    rail.dataset.open = open ? '1' : '0';
    scrim.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', () => setDrawer(rail.dataset.open !== '1'));
  scrim.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });
  on('route:changed', () => setDrawer(false));

  /* ---- active nav item ---- */
  on('route:changed', ({ path }) => {
    const key = path === '/' ? 'home'
      : path.startsWith('/mission/') ? 'current'
        : path.slice(1).split('/')[0];
    $$('[data-nav]').forEach((a) => {
      if (a.dataset.nav === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  });

  /* ---- progress ring ---- */
  const ring = $('#ringValue');
  const pct = $('#topPct');
  ring.style.strokeDasharray = String(RING_CIRCUMFERENCE);

  function paintProgress() {
    const p = overallProgress(getState());
    ring.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - p.pct / 100));
    pct.textContent = `${p.pct}%`;
    $('.topbar__progress').setAttribute('title', `Overall progress: ${p.done} of ${p.total} tasks`);
  }
  on('store:changed', paintProgress);
  paintProgress();

  /* ---- engine chip: never claims more than is true ---- */
  const chip = $('#engineChip');
  const chipText = chip.querySelector('.engine-chip__text');

  function paintEngine(s) {
    const map = {
      idle:    ['idle', 'Engine idle'],
      loading: ['loading', `Loading Python ${Math.round((s.progress || 0) * 100)}%`],
      ready:   ['ready', `Python ${s.python || 'ready'}`],
      running: ['running', 'Running…'],
      error:   ['error', 'Engine unavailable'],
    };
    const [state, label] = map[s.status] || map.idle;
    chip.dataset.state = state;
    chipText.textContent = label;
    chip.title = s.status === 'error' ? String(s.error || 'Engine unavailable') : label;
  }
  on('python:status', paintEngine);
  paintEngine(runtime.getStatus());
}

export function hideBoot() {
  const boot = $('#boot');
  const app = $('#app');
  app.hidden = false;
  if (!boot) return;
  boot.dataset.leaving = '1';
  setTimeout(() => boot.remove(), 500);
}
