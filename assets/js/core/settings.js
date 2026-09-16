/** Applies persisted settings to the document. */
import { getState, setSetting } from './store.js';
import { on } from './bus.js';

export function applySettings() {
  const s = getState().settings;
  const root = document.documentElement;
  root.dataset.theme = s.theme === 'light' ? 'light' : 'dark';
  root.dataset.motion = s.motion === 'reduced' ? 'reduced' : 'full';
  root.dataset.density = s.density === 'compact' ? 'compact' : 'normal';
  root.style.setProperty('--fs-base', `${(s.fontSize || 15) / 16}rem`);
}

export function initSettings() {
  applySettings();
  on('settings:changed', applySettings);
}

export { setSetting };
