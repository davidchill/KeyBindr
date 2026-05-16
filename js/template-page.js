import { TEMPLATES } from './templates.js';
import { state } from './state.js';
import { renderKeyboard, initKeyboardScale, setKeyboardCallbacks } from './keyboard.js';
import { renderLegend, reapplyFilter, initCustomCategories } from './categories.js';
import { renderSummary, setSummaryCallbacks } from './summary.js';
import { applyTheme } from './theme.js';
import { VERSION, THEME_KEY, DEFAULT_CATEGORIES } from './constants.js';
import {
  buildPlainText, buildMarkdown, markdownToHtml,
  exportMap, shareDate, siteUrl,
} from './export.js';

function getTemplateId() {
  return document.documentElement.dataset.templateId
    || new URLSearchParams(location.search).get('id')
    || '';
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

function initSharePanel() {
  const btn   = document.getElementById('template-share-btn');
  const panel = document.getElementById('share-panel');
  if (!btn || !panel) return;

  function openPanel() {
    const rect = btn.getBoundingClientRect();
    panel.style.top   = `${rect.bottom + 6}px`;
    panel.style.right = `${window.innerWidth - rect.right}px`;
    panel.classList.remove('hidden');
  }
  function closePanel() { panel.classList.add('hidden'); }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.contains('hidden') ? openPanel() : closePanel();
  });
  document.addEventListener('click', e => {
    if (!panel.classList.contains('hidden') && !panel.contains(e.target)) closePanel();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  // Copy Link — canonical page URL, no compression needed
  document.getElementById('share-copy-link')?.addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    try {
      await navigator.clipboard.writeText(window.location.href);
      const orig = nameEl.textContent;
      nameEl.textContent = 'Copied!';
      setTimeout(() => { nameEl.textContent = orig; closePanel(); }, 1500);
    } catch (_) {}
  });

  // Copy Text
  document.getElementById('share-copy-text')?.addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    try {
      await navigator.clipboard.writeText(buildPlainText());
      const orig = nameEl.textContent;
      nameEl.textContent = 'Copied!';
      setTimeout(() => { nameEl.textContent = orig; closePanel(); }, 1500);
    } catch (_) {}
  });

  // Copy as Markdown
  document.getElementById('share-copy-md')?.addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    const md = buildMarkdown();
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/plain': new Blob([md], { type: 'text/plain' }),
        'text/html':  new Blob([markdownToHtml(md)], { type: 'text/html' }),
      })]);
    } catch (_) {
      try { await navigator.clipboard.writeText(md); } catch (_) { return; }
    }
    const orig = nameEl.textContent;
    nameEl.textContent = 'Copied!';
    setTimeout(() => { nameEl.textContent = orig; closePanel(); }, 1500);
  });

  // Post on X
  document.getElementById('share-twitter')?.addEventListener('click', () => {
    const name = document.getElementById('map-name')?.value || 'Keyboard Shortcuts';
    const text = encodeURIComponent(`Check out the ${name} keyboard shortcut map — visualized with KeyBindr`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, '_blank', 'noopener');
    closePanel();
  });

  // Share on Reddit
  document.getElementById('share-reddit')?.addEventListener('click', () => {
    const name = document.getElementById('map-name')?.value || 'Keyboard Shortcuts';
    const url  = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${name} — KeyBindr`);
    window.open(`https://www.reddit.com/submit?url=${url}&title=${title}`, '_blank', 'noopener');
    closePanel();
  });

  // Share via Email
  document.getElementById('share-email')?.addEventListener('click', () => {
    const name    = document.getElementById('map-name')?.value || 'Keyboard Shortcuts';
    const subject = encodeURIComponent(`${name} — KeyBindr`);
    const body    = encodeURIComponent(`${name}\n\nView this keyboard shortcut map online:\n${window.location.href}\n\n---\nCreated with KeyBindr — ${siteUrl()}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    closePanel();
  });

  // Export JSON
  document.getElementById('share-export')?.addEventListener('click', () => {
    exportMap();
    closePanel();
  });

  // Export PNG
  document.getElementById('share-export-png')?.addEventListener('click', async () => {
    closePanel();
    const target = document.querySelector('.app-main');
    if (!target || typeof htmlToImage === 'undefined') {
      alert('PNG export is not available right now.');
      return;
    }
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const legend = document.getElementById('legend');
    const wasCollapsed = legend?.classList.contains('collapsed');
    if (wasCollapsed) legend.classList.remove('collapsed');
    const mapName  = (document.getElementById('map-name')?.value || 'template').trim().replace(/\s+/g, '-').toLowerCase();
    const datePart = new Date().toISOString().slice(0, 10);
    try {
      const blob = await htmlToImage.toBlob(target, { pixelRatio: 2, backgroundColor: isDark ? '#1a1a1a' : '#ffffff' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${mapName}-${datePart}.png` });
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (_) {
      alert('PNG export failed. Try Print instead.');
    }
    if (wasCollapsed) legend.classList.add('collapsed');
  });

  // Print
  document.getElementById('share-print')?.addEventListener('click', () => {
    closePanel();
    window.print();
  });
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
    const titleEl   = document.getElementById('template-title');
    const catEl     = document.getElementById('template-category');
    const ctaEl     = document.getElementById('template-cta');
    const mapNameEl = document.getElementById('map-name');
    if (titleEl)   titleEl.textContent  = template.name;
    if (catEl)     catEl.textContent    = template.appCategory;
    if (ctaEl)     ctaEl.href           = `https://keybindr.app/?template=${id}`;
    if (mapNameEl) mapNameEl.value      = template.name;
  } else {
    document.title = 'Template not found — KeyBindr';
    const titleEl = document.getElementById('template-title');
    if (titleEl) titleEl.textContent = id ? `Template "${id}" not found` : 'No template specified';
  }

  renderKeyboard();
  initKeyboardScale();
  renderLegend();
  renderSummary();
  initSharePanel();

  document.getElementById('footer-version').textContent = `v${VERSION}`;
}

init();
