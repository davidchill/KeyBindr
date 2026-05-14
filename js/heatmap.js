import { state } from './state.js';

let heatmapActive = false;
let _cbs = { track: () => {}, renderKeyboard: () => {}, renderLegend: () => {} };

export function setHeatmapCallbacks(cb) { Object.assign(_cbs, cb); }
export function isHeatmapActive() { return heatmapActive; }

export function applyHeatmap() {
  const keys = [...document.querySelectorAll('#keyboard .key')];
  if (!keys.length) return;

  const assignedIds = new Set(Object.keys(state.hotkeys));
  if (!assignedIds.size) return;

  const centers = new Map();
  keys.forEach(el => {
    const r = el.getBoundingClientRect();
    centers.set(el.dataset.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  });

  const assignedCenters = [...assignedIds]
    .map(id => centers.get(id))
    .filter(Boolean);

  const scores = new Map();
  const SIGMA = 90;
  keys.forEach(el => {
    const c = centers.get(el.dataset.id);
    if (!c) return;
    let score = 0;
    assignedCenters.forEach(ac => {
      const dx = c.x - ac.x, dy = c.y - ac.y;
      score += Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA));
    });
    scores.set(el, score);
  });

  const vals = [...scores.values()];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  scores.forEach((score, el) => {
    const t = (score - min) / range;
    const hue = Math.round(240 - t * 240);
    const sat = Math.round(45 + t * 40);
    const lit = Math.round(28 + t * 14);
    el.style.background = `hsl(${hue}, ${sat}%, ${lit}%)`;
    el.style.setProperty('box-shadow',
      `0 3px 0 hsl(${hue}, ${sat}%, ${lit - 10}%), 0 1px 2px rgba(0,0,0,0.5)`);
  });
}

export function clearHeatmap() {
  document.querySelectorAll('#keyboard .key').forEach(el => {
    el.style.background = '';
    el.style.removeProperty('box-shadow');
  });
}

export function toggleHeatmap() {
  heatmapActive = !heatmapActive;
  _cbs.track('heatmap_toggled', { active: heatmapActive });
  document.getElementById('btn-heatmap').classList.toggle('btn-on', heatmapActive);
  document.getElementById('heatmap-legend').classList.toggle('hidden', !heatmapActive);
  if (heatmapActive) {
    applyHeatmap();
  } else {
    _cbs.renderKeyboard();
    _cbs.renderLegend();
  }
}
