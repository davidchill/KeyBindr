import { THEME_KEY, SCHEME_KEY, SCHEME_OPTIONS } from './constants.js';

/* ── Callback for heatmap refresh (injected by app.js to avoid circular import) */
let _onThemeChange = null;
export function setThemeChangeCallback(fn) { _onThemeChange = fn; }

/* ── Theme (dark / light / system) ───────────────────────────── */
let _systemQuery = null;

export function applyTheme(pref) {
  const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === pref);
  });
  _onThemeChange?.();
}

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);

  _systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
  _systemQuery.addEventListener('change', () => {
    if ((localStorage.getItem(THEME_KEY) || 'dark') === 'system') applyTheme('system');
  });

  document.getElementById('theme-picker').addEventListener('click', e => {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    const pref = btn.dataset.themeVal;
    localStorage.setItem(THEME_KEY, pref);
    if (typeof gtag === 'function') gtag('event', 'theme_changed', { theme: pref });
    applyTheme(pref);
  });
}

/* ── Colour scheme ────────────────────────────────────────────── */
export function applyScheme(scheme) {
  document.documentElement.setAttribute('data-scheme', scheme);
  _onThemeChange?.();
  const btn = document.getElementById('scheme-picker');
  if (btn) {
    const opt = SCHEME_OPTIONS.find(o => o.value === scheme);
    btn.querySelector('.select-label').textContent = opt ? opt.label : scheme;
  }
}
