import { TEMPLATES } from './templates.js';
import { state } from './state.js';
import { renderKeyboard, initKeyboardScale, setKeyboardCallbacks } from './keyboard.js';
import { renderLegend, reapplyFilter, initCustomCategories } from './categories.js';
import { renderSummary, setSummaryCallbacks } from './summary.js';
import { applyTheme } from './theme.js';
import { VERSION, THEME_KEY, DEFAULT_CATEGORIES } from './constants.js';

function getTemplateId() {
  return new URLSearchParams(location.search).get('id') || '';
}

function findTemplate(id) {
  const lower = id.toLowerCase();
  return TEMPLATES.find(t => t.id === lower || t.name.toLowerCase().replace(/\s+/g, '-') === lower) || null;
}

function loadTemplate(template) {
  if (template.tabs) {
    state.hotkeys = Object.fromEntries(
      Object.entries(template.tabs[0].hotkeys).map(([k, v]) => [k, { ...v }])
    );
    const tabCount = template.tabs.length;
    if (tabCount > 1) {
      const note = document.getElementById('template-tab-note');
      if (note) {
        note.textContent = `Showing tab 1 of ${tabCount} (${template.tabs[0].name}). Open in KeyBindr to see all tabs.`;
        note.hidden = false;
      }
    }
  } else {
    state.hotkeys = Object.fromEntries(
      Object.entries(template.hotkeys).map(([k, v]) => [k, { ...v }])
    );
  }
  if (template.categories?.length) {
    state.categories = template.categories.map(c => ({ ...c }));
  } else {
    const usedIds = new Set(Object.values(state.hotkeys).map(hk => hk.category).filter(Boolean));
    state.categories = DEFAULT_CATEGORIES.filter(c => usedIds.has(c.id)).map(c => ({ ...c }));
  }
}

// type="module" is implicitly deferred — DOM is ready when this runs
function init() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

  setKeyboardCallbacks({ reapplyFilter });

  setSummaryCallbacks({ renderLegend });

  const id = getTemplateId();
  const template = id ? findTemplate(id) : null;

  if (template) {
    loadTemplate(template);
    document.title = `${template.name} Shortcuts — KeyBindr`;
    const titleEl = document.getElementById('template-title');
    const catEl   = document.getElementById('template-category');
    const ctaEl   = document.getElementById('template-cta');
    if (titleEl) titleEl.textContent = template.name;
    if (catEl)   catEl.textContent   = template.appCategory;
    if (ctaEl)   ctaEl.href = `https://keybindr.app/?template=${id}`;
  } else {
    document.title = 'Template not found — KeyBindr';
    const titleEl = document.getElementById('template-title');
    if (titleEl) titleEl.textContent = id ? `Template "${id}" not found` : 'No template specified';
  }

  renderKeyboard();
  initKeyboardScale();
  renderLegend();
  renderSummary();

  document.getElementById('footer-version').textContent = `v${VERSION}`;
}

init();
