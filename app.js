import {
  VERSION, UNIT, GAP, FN_H, MIN_KB_SCALE, KB_PADDING,
  LAYOUTS, ZSA_IDS, KEY_MAPS, VALID_LAYOUTS, VALID_KEY_MAPS,
  SUMMARY_COLS, SUMMARY_CAT_WRAP, SPLIT_AFTER, SPLIT_GAP,
  DEFAULT_CATEGORIES, MAIN_ROWS, NAV_ROWS, NUMPAD_KEYS,
  ZSA_STAGGER, ZSA_KEYBOARDS, MOD_MAP_MAC, KEY_FULL_NAMES,
  LAYOUT_OPTIONS, KEYMAP_OPTIONS, THEME_KEY, SCHEME_KEY, SCHEME_OPTIONS,
  UNDO_LIMIT,
} from './js/constants.js';
import { TEMPLATES } from './js/templates.js';
import {
  state, genTabId, syncActiveTab,
  saveToStorage, loadFromStorage,
  buildShareUrl, loadFromHash,
} from './js/state.js';
import { applyTheme, initTheme, applyScheme, setThemeChangeCallback } from './js/theme.js';
import {
  renderSummary, filterSummary, getOrderedHotkeys,
  setSummaryCallbacks, snapshotLayoutFromDOM,
  startCatDrag, clearDragIndicators, clearItemDragIndicators,
  moveItemInSummary, moveCategoryInLayout, moveCategoryInOverflowOrder, moveCategoryToColumn,
  makeSummaryItem, makeSummaryGroup,
} from './js/summary.js';
import {
  allCategories, renderLegend, renderLegendActivePreview,
  buildCatChip, applyFilter, reapplyFilter,
  startEditCategory, deleteCategory,
  populateCategorySelect, initCustomCategories, setCategoriesCallbacks,
} from './js/categories.js';
import {
  setKeyboardCallbacks,
  displayMod, darkenHex, getKeyLabel, findKeyDef,
  makeKey, refreshKeyEl,
  renderRows, renderNumpad, renderZSAKeyboard, renderKeyboard,
  refreshKey,
  setHoverHighlight, clearHoverHighlight,
  setCategoryHighlight, clearCategoryHighlight,
  showKeyTooltip, positionTooltip, hideKeyTooltip,
  applyKbScale, measureAndScaleKeyboard, initKeyboardScale,
} from './js/keyboard.js';

/* ── Analytics ────────────────────────────────────────────────── */
const _sessionCounts = { saves: 0, shares: 0, prints: 0, exports: 0, imports: 0 };

function track(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

/* ── Keyboard scaling state ───────────────────────────────────── */






/* ── App state — defined in js/state.js, imported above ───────── */


// Returns a darkened version of a hex color by blending with black at the given ratio.
// Replaces color-mix() in JS contexts where CSS fallbacks aren't possible.

let activeKeyId = null;

/* ── Theme ───────────────────────────────────────────────────── */


/* ── Keyboard scale (ResizeObserver) ──────────────────────────── */




/* ── Scheme ──────────────────────────────────────────────────── */



function initScheme() {
  const saved = localStorage.getItem(SCHEME_KEY) || 'default';
  applyScheme(saved);

  document.getElementById('scheme-picker').addEventListener('click', e => {
    const current = localStorage.getItem(SCHEME_KEY) || 'default';
    showActionDropdown(e.currentTarget, SCHEME_OPTIONS.map(opt => ({
      ...opt,
      selected: opt.value === current,
      action: () => {
        localStorage.setItem(SCHEME_KEY, opt.value);
        track('scheme_changed', { scheme: opt.value });
        applyScheme(opt.value);
      }
    })));
  });
}

/* ── Helpers ──────────────────────────────────────────────────── */



/* ── Key element factory ──────────────────────────────────────── */


/* ── Rendering ────────────────────────────────────────────────── */


/* ── ZSA keyboard renderer ────────────────────────────────────── */



/* ── Hover cross-highlight ────────────────────────────────────── */


/* ── Category hover highlight ─────────────────────────────────── */


/* ── Key tooltip ──────────────────────────────────────────────── */




/* ── Undo / Redo ──────────────────────────────────────────────── */
let undoStack = [];
let redoStack = [];

function snapshotState() {
  return {
    hotkeys: JSON.parse(JSON.stringify(state.hotkeys)),
    mapName: document.getElementById('map-name').value,
  };
}

function pushUndo() {
  undoStack.push(snapshotState());
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}

function applySnapshot(snap) {
  state.hotkeys = snap.hotkeys;
  document.getElementById('map-name').value = snap.mapName;
  renderKeyboard();
  renderLegend();
  renderSummary();
  saveToStorage();
  updateUndoRedoButtons();
}

function undoAction() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  applySnapshot(undoStack.pop());
  track('undo_used');
}

function redoAction() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  applySnapshot(redoStack.pop());
  track('redo_used');
}

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = undoStack.length === 0;
  if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}

/* ── Heat map ─────────────────────────────────────────────────── */
let heatmapActive = false;

function applyHeatmap() {
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

function clearHeatmap() {
  document.querySelectorAll('#keyboard .key').forEach(el => {
    el.style.background = '';
    el.style.removeProperty('box-shadow');
  });
}

function toggleHeatmap() {
  heatmapActive = !heatmapActive;
  track('heatmap_toggled', { active: heatmapActive });
  document.getElementById('btn-heatmap').classList.toggle('btn-on', heatmapActive);
  document.getElementById('heatmap-legend').classList.toggle('hidden', !heatmapActive);
  if (heatmapActive) {
    applyHeatmap();
  } else {
    renderKeyboard();
    renderLegend();
  }
}

/* ── Category filter ──────────────────────────────────────────── */




/* ── Hotkey summary ───────────────────────────────────────────── */




/* ── Category drag (pointer events) ──────────────────────────── */
















/* ── Legend ───────────────────────────────────────────────────── */




/* ── Summary search ───────────────────────────────────────────── */

/* ── Category select ──────────────────────────────────────────── */

/* ── Key full names ───────────────────────────────────────────── */

function getKeyFullName(keyId, def) {
  if (KEY_FULL_NAMES[keyId]) return KEY_FULL_NAMES[keyId];
  return (def ? getKeyLabel(def) : '') || keyId;
}

/* ── Popover ──────────────────────────────────────────────────── */
function openPopover(keyId) {
  activeKeyId = keyId;
  const def = findKeyDef(keyId);
  const label = (def ? getKeyLabel(def) : '') || keyId;

  document.getElementById('popover-key-badge').textContent = label || keyId;
  document.getElementById('popover-title').textContent = getKeyFullName(keyId, def);

  // Reset
  document.querySelectorAll('.mod-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.mod-chip input').forEach(cb => cb.checked = false);
  document.getElementById('hotkey-label').value    = '';
  document.getElementById('hotkey-desc').value     = '';
  document.getElementById('hotkey-category').value = '';

  // Prefill existing
  const existing = state.hotkeys[keyId];
  if (existing) {
    document.getElementById('hotkey-label').value    = existing.label       || '';
    document.getElementById('hotkey-desc').value     = existing.description || '';
    document.getElementById('hotkey-category').value = existing.category    || '';
    (existing.modifiers || []).forEach(mod => {
      const cb = document.querySelector(`.mod-chip input[value="${mod}"]`);
      if (cb) { cb.checked = true; cb.closest('.mod-chip').classList.add('active'); }
    });
  }

  document.getElementById('conflict-warning').hidden = true;
  document.getElementById('popover').classList.remove('hidden');
  document.getElementById('popover-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('hotkey-label').focus(), 30);
}

function closePopover() {
  activeKeyId = null;
  hideLabelSuggestions();
  document.getElementById('popover').classList.add('hidden');
  document.getElementById('popover-overlay').classList.add('hidden');
}

/* ── Label autocomplete ───────────────────────────────────────── */
let _suggestionIdx = -1;

function buildSuggestions(query) {
  const q = query.toLowerCase();
  return Object.entries(state.hotkeys)
    .filter(([keyId, hk]) => keyId !== activeKeyId && hk.label.toLowerCase().includes(q))
    .map(([keyId, hk]) => {
      const def = findKeyDef(keyId);
      return { label: hk.label, keyName: def ? (getKeyLabel(def) || keyId) : keyId };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function renderLabelSuggestions() {
  const input = document.getElementById('hotkey-label');
  const box = document.getElementById('label-suggestions');
  const query = input.value.trim();

  if (!query) { hideLabelSuggestions(); return; }

  const matches = buildSuggestions(query);
  if (!matches.length) { hideLabelSuggestions(); return; }

  _suggestionIdx = -1;
  box.innerHTML = '';
  matches.forEach((m, i) => {
    const item = document.createElement('div');
    item.className = 'label-suggestion';
    item.dataset.idx = i;
    const keySpan = document.createElement('span');
    keySpan.className = 'label-suggestion-key';
    keySpan.textContent = m.keyName;
    const divSpan = document.createElement('span');
    divSpan.className = 'label-suggestion-divider';
    divSpan.textContent = '|';
    const textSpan = document.createElement('span');
    textSpan.className = 'label-suggestion-text';
    textSpan.textContent = m.label;
    item.append(keySpan, divSpan, textSpan);
    item.addEventListener('mousedown', e => {
      e.preventDefault();
      selectSuggestion(m.label);
    });
    box.appendChild(item);
  });

  box.hidden = false;
}

function hideLabelSuggestions() {
  const box = document.getElementById('label-suggestions');
  if (box) box.hidden = true;
  _suggestionIdx = -1;
}

function selectSuggestion(label) {
  const input = document.getElementById('hotkey-label');
  input.value = label;
  hideLabelSuggestions();
  updateConflictWarning();
  input.focus();
}

function moveSuggestionFocus(dir) {
  const box = document.getElementById('label-suggestions');
  if (!box || box.hidden) return;
  const items = box.querySelectorAll('.label-suggestion');
  if (!items.length) return;
  items[_suggestionIdx]?.classList.remove('ls-focused');
  _suggestionIdx = (_suggestionIdx + dir + items.length) % items.length;
  items[_suggestionIdx].classList.add('ls-focused');
  items[_suggestionIdx].scrollIntoView({ block: 'nearest' });
}

function checkConflict(label) {
  if (!label) return null;
  const lower = label.toLowerCase();
  for (const [keyId, hk] of Object.entries(state.hotkeys)) {
    if (keyId !== activeKeyId && hk.label.trim().toLowerCase() === lower) return keyId;
  }
  return null;
}

function updateConflictWarning() {
  const label = document.getElementById('hotkey-label').value.trim();
  const warn = document.getElementById('conflict-warning');
  const conflictKeyId = checkConflict(label);
  if (conflictKeyId) {
    const def = findKeyDef(conflictKeyId);
    const keyName = def ? getKeyLabel(def) : conflictKeyId;
    document.getElementById('conflict-warning-text').textContent =
      `"${label}" is already assigned to ${keyName}`;
    warn.hidden = false;
  } else {
    warn.hidden = true;
  }
}

function saveHotkey() {
  if (!activeKeyId) return;
  const label = document.getElementById('hotkey-label').value.trim();
  if (!label) {
    document.getElementById('hotkey-label').focus();
    document.getElementById('hotkey-label').style.borderColor = 'var(--danger)';
    setTimeout(() => document.getElementById('hotkey-label').style.borderColor = '', 1200);
    return;
  }

  pushUndo();
  const modifiers = [...document.querySelectorAll('.mod-chip input:checked')].map(cb => cb.value);

  state.hotkeys[activeKeyId] = {
    label,
    description: document.getElementById('hotkey-desc').value.trim(),
    category:    document.getElementById('hotkey-category').value,
    modifiers,
  };

  track('key_assigned', {
    key_id:          activeKeyId,
    category:        state.hotkeys[activeKeyId].category || 'none',
    has_modifiers:   modifiers.length > 0,
    has_description: !!state.hotkeys[activeKeyId].description,
  });

  refreshKey(activeKeyId);
  renderLegend();
  renderSummary();
  saveToStorage();
  closePopover();
}

function clearHotkey() {
  if (!activeKeyId) return;
  pushUndo();
  track('key_cleared', { key_id: activeKeyId });
  delete state.hotkeys[activeKeyId];
  refreshKey(activeKeyId);
  renderLegend();
  renderSummary();
  saveToStorage();
  closePopover();
}

/* ── Context tabs ─────────────────────────────────────────────── */


function switchTab(id) {
  syncActiveTab();
  state.activeTabId = id;
  const tab = state.tabs.find(t => t.id === id);
  state.hotkeys = tab ? JSON.parse(JSON.stringify(tab.hotkeys)) : {};
  renderTabBar();
  renderKeyboard();
  renderLegend();
  renderSummary();
  saveToStorage();
}

function showTabNameDialog(onConfirm, opts = {}) {
  const { title = 'New Tab Name', buttonLabel = 'Create Tab', initialValue = '', onDelete = null } = opts;
  const modal     = document.getElementById('tab-name-modal');
  const input     = document.getElementById('tab-name-input');
  const ok        = document.getElementById('tab-name-ok');
  const cancel    = document.getElementById('tab-name-cancel');
  const deleteBtn = document.getElementById('tab-name-delete');
  const overlay   = document.getElementById('confirm-overlay');
  const titleEl   = document.getElementById('tab-name-title');

  titleEl.textContent = title;
  ok.textContent      = buttonLabel;
  input.value         = initialValue;
  deleteBtn.classList.toggle('hidden', !onDelete);
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
  input.focus();
  input.select();

  function commit() {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    cleanup();
    onConfirm(name);
  }

  function handleDelete() {
    cleanup();
    onDelete();
  }

  function cleanup() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    ok.removeEventListener('click', commit);
    cancel.removeEventListener('click', cleanup);
    deleteBtn.removeEventListener('click', handleDelete);
    input.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cleanup();
  }

  ok.addEventListener('click', commit);
  cancel.addEventListener('click', cleanup);
  if (onDelete) deleteBtn.addEventListener('click', handleDelete);
  input.addEventListener('keydown', onKey);
}

let _dragTabId = null;

function renameTab(tabId, currentName) {
  const canDelete = state.tabs.length > 1;
  showTabNameDialog(name => {
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;
    tab.name = name;
    renderTabBar();
    saveToStorage();
  }, {
    title: 'Rename Tab',
    buttonLabel: 'Rename',
    initialValue: currentName,
    onDelete: canDelete ? () => {
      const hotkeyCount = Object.keys(state.tabs.find(t => t.id === tabId)?.hotkeys || {}).length;
      const detail = hotkeyCount > 0
        ? ` ${hotkeyCount} hotkey${hotkeyCount > 1 ? 's' : ''} will be permanently deleted.`
        : '';
      showConfirm(`Delete "${currentName}"?${detail}`, () => deleteTab(tabId));
    } : null,
  });
}

function deleteTab(tabId) {
  const idx = state.tabs.findIndex(t => t.id === tabId);
  if (idx === -1 || state.tabs.length <= 1) return;
  state.tabs.splice(idx, 1);
  if (state.activeTabId === tabId) {
    const next = state.tabs[Math.min(idx, state.tabs.length - 1)];
    state.activeTabId = next.id;
    state.hotkeys = { ...next.hotkeys };
  }
  renderTabBar();
  renderKeyboard();
  renderLegend();
  renderSummary();
  saveToStorage();
}

function addTab() {
  _addingNewTab = true;
  openTemplatesModal();
}

function renderTabBar() {
  const el = document.getElementById('context-tabs');
  if (!el) return;
  el.innerHTML = '';

  state.tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'context-tab' + (tab.id === state.activeTabId ? ' active' : '');
    btn.draggable = true;
    btn.dataset.tabId = tab.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'context-tab-name';
    nameSpan.textContent = tab.name;
    nameSpan.title = 'Double-click to rename';
    nameSpan.addEventListener('dblclick', e => {
      e.stopPropagation();
      renameTab(tab.id, tab.name);
    });
    btn.appendChild(nameSpan);

    btn.addEventListener('click', () => { if (tab.id !== state.activeTabId) switchTab(tab.id); });

    btn.addEventListener('dragstart', e => {
      _dragTabId = tab.id;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => btn.classList.add('dragging'), 0);
    });
    btn.addEventListener('dragend', () => {
      _dragTabId = null;
      btn.classList.remove('dragging');
      el.querySelectorAll('.context-tab').forEach(t => t.classList.remove('drag-before', 'drag-after'));
    });
    btn.addEventListener('dragover', e => {
      if (!_dragTabId || _dragTabId === tab.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = btn.getBoundingClientRect();
      const before = e.clientX < rect.left + rect.width / 2;
      el.querySelectorAll('.context-tab').forEach(t => t.classList.remove('drag-before', 'drag-after'));
      btn.classList.add(before ? 'drag-before' : 'drag-after');
    });
    btn.addEventListener('dragleave', () => {
      btn.classList.remove('drag-before', 'drag-after');
    });
    btn.addEventListener('drop', e => {
      e.preventDefault();
      if (!_dragTabId || _dragTabId === tab.id) return;
      el.querySelectorAll('.context-tab').forEach(t => t.classList.remove('drag-before', 'drag-after'));
      const rect = btn.getBoundingClientRect();
      const before = e.clientX < rect.left + rect.width / 2;
      const fromIdx = state.tabs.findIndex(t => t.id === _dragTabId);
      const [moved] = state.tabs.splice(fromIdx, 1);
      const toIdx = state.tabs.findIndex(t => t.id === tab.id);
      state.tabs.splice(before ? toIdx : toIdx + 1, 0, moved);
      renderTabBar();
      saveToStorage();
    });

    el.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'context-tab-add';
  addBtn.title = 'Add tab';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', addTab);
  el.appendChild(addBtn);
}

/* ── Storage ──────────────────────────────────────────────────── */




/* ── Copy / Print ─────────────────────────────────────────────── */
function shareDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function siteUrl() {
  return location.origin + location.pathname;
}

function formatShortcut(hk, def) {
  const keyLabel = def ? getKeyLabel(def) : '';
  return [...(hk.modifiers || []).map(displayMod), keyLabel].filter(Boolean).join('+');
}

function buildSummaryBuckets() {
  const entries = getOrderedHotkeys();
  const buckets = {};
  const uncategorized = [];
  entries.forEach(entry => {
    const id = entry.hk.category;
    if (id) { (buckets[id] = buckets[id] || []).push(entry); }
    else uncategorized.push(entry);
  });
  return { buckets, uncategorized };
}

function buildPlainText() {
  const mapName = document.getElementById('map-name').value || 'Hotkey Map';
  const { buckets, uncategorized } = buildSummaryBuckets();
  const lines = [mapName, '='.repeat(mapName.length), `Generated: ${shareDate()}`, ''];

  const addGroup = (name, items) => {
    lines.push(name);
    items.forEach(({ hk, def }) => {
      const shortcut = formatShortcut(hk, def).padEnd(20);
      let line = `  ${shortcut}  ${hk.label}`;
      if (hk.description) line += `  — ${hk.description}`;
      lines.push(line);
    });
    lines.push('');
  };

  allCategories().forEach(cat => {
    if (buckets[cat.id]?.length) addGroup(cat.name, buckets[cat.id]);
  });
  if (uncategorized.length) addGroup('Uncategorized', uncategorized);

  lines.push('---', `Created with KeyBindr — ${siteUrl()}`);
  return lines.join('\n').trimEnd();
}

function buildMarkdown() {
  const mapName = document.getElementById('map-name').value || 'Hotkey Map';
  const { buckets, uncategorized } = buildSummaryBuckets();
  const lines = [`# ${mapName}`, `*Generated ${shareDate()} · [KeyBindr](${siteUrl()})*`, ''];

  const addGroup = (name, items) => {
    lines.push(`## ${name}`, '');
    lines.push('| Shortcut | Action | Description |');
    lines.push('|----------|--------|-------------|');
    items.forEach(({ hk, def }) => {
      const shortcut = formatShortcut(hk, def);
      lines.push(`| ${shortcut} | ${hk.label} | ${hk.description || ''} |`);
    });
    lines.push('');
  };

  allCategories().forEach(cat => {
    if (buckets[cat.id]?.length) addGroup(cat.name, buckets[cat.id]);
  });
  if (uncategorized.length) addGroup('Uncategorized', uncategorized);

  return lines.join('\n').trimEnd();
}

function markdownToHtml(md) {
  const inline = s =>
    s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
     .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  const out = [];
  let tableLines = [];

  const flushTable = () => {
    if (!tableLines.length) return;
    const rows = tableLines.filter(l => !/^\|[-:\s|]+\|$/.test(l));
    if (!rows.length) { tableLines = []; return; }
    out.push('<table>');
    rows.forEach((row, i) => {
      const cells = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const t = i === 0 ? 'th' : 'td';
      out.push(`<tr>${cells.map(c => `<${t}>${inline(c)}</${t}>`).join('')}</tr>`);
    });
    out.push('</table>');
    tableLines = [];
  };

  for (const line of md.split('\n')) {
    if (line.startsWith('|')) { tableLines.push(line); continue; }
    flushTable();
    if (line.startsWith('# '))  out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.startsWith('## ')) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line === '---')    out.push('<hr>');
    else if (line.trim())       out.push(`<p>${inline(line)}</p>`);
  }
  flushTable();
  return out.join('');
}

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1800);
  } catch (_) {}
}

/* ── Export / Import ──────────────────────────────────────────── */
function exportMap() {
  const name = document.getElementById('map-name').value || 'hotkey-map';
  track('map_exported', { key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.exports });
  const data = { version: 1, name, generatedOn: shareDate(), source: 'KeyBindr', sourceUrl: siteUrl(), hotkeys: state.hotkeys, categories: state.categories };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = name.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function exportMapCSV() {
  syncActiveTab();
  const mapName = document.getElementById('map-name').value || 'hotkey-map';
  track('map_exported_csv', { key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.exports });

  const catMap = Object.fromEntries(state.categories.map(c => [c.id, c.name]));
  const esc = v => {
    const s = String(v ?? '');
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = [['Tab', 'Key', 'Label', 'Modifiers', 'Category', 'Description']];
  state.tabs.forEach(tab => {
    Object.entries(tab.hotkeys).forEach(([keyId, hk]) => {
      const def      = findKeyDef(keyId);
      const keyLabel = (def ? getKeyLabel(def) : '') || keyId;
      const mods     = (hk.modifiers || []).join('+');
      const catName  = catMap[hk.category] || '';
      rows.push([tab.name, keyLabel, hk.label || '', mods, catName, hk.description || '']);
    });
  });

  const csv  = rows.map(r => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function validateImport(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Root must be a JSON object');
  if (!data.hotkeys || typeof data.hotkeys !== 'object' || Array.isArray(data.hotkeys))
    throw new Error('Missing or invalid "hotkeys" field');
  for (const [keyId, hk] of Object.entries(data.hotkeys)) {
    if (!hk || typeof hk !== 'object' || Array.isArray(hk))
      throw new Error(`Hotkey "${keyId}" must be an object`);
    if (typeof hk.label !== 'string')
      throw new Error(`Hotkey "${keyId}" must have a string label`);
    if (hk.description !== undefined && typeof hk.description !== 'string')
      throw new Error(`Hotkey "${keyId}" has an invalid description`);
    if (hk.category !== undefined && typeof hk.category !== 'string')
      throw new Error(`Hotkey "${keyId}" has an invalid category`);
    if (hk.modifiers !== undefined && !Array.isArray(hk.modifiers))
      throw new Error(`Hotkey "${keyId}" has invalid modifiers`);
  }
  if (data.categories !== undefined) {
    if (!Array.isArray(data.categories))
      throw new Error('"categories" must be an array');
    for (const cat of data.categories) {
      if (!cat || typeof cat !== 'object' || typeof cat.id !== 'string' || typeof cat.name !== 'string' || typeof cat.color !== 'string')
        throw new Error('Each category must have string "id", "name", and "color" fields');
    }
  }
  if (data.tabs !== undefined) {
    if (!Array.isArray(data.tabs))
      throw new Error('"tabs" must be an array');
    for (const tab of data.tabs) {
      if (!tab || typeof tab !== 'object' || typeof tab.name !== 'string')
        throw new Error('Each tab must have a string "name"');
      if (!tab.hotkeys || typeof tab.hotkeys !== 'object' || Array.isArray(tab.hotkeys))
        throw new Error(`Tab "${tab.name}" has missing or invalid "hotkeys"`);
    }
  }
}

function importMap(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      validateImport(data);
      pushUndo();
      state.hotkeys   = data.hotkeys;
      state.categories = data.categories || [];
      if (data.name) document.getElementById('map-name').value = data.name;
      track('map_imported', { key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.imports });
      populateCategorySelect();
      renderKeyboard();
      renderLegend();
      renderSummary();
      saveToStorage();
    } catch (err) {
      alert(`Could not import: ${err.message || 'Invalid KeyBindr JSON file.'}`);
    }
  };
  reader.readAsText(file);
}

/* ── Confirm dialog ───────────────────────────────────────────── */
let _confirmCallback = null;

function showConfirm(message, onConfirm) {
  _confirmCallback = onConfirm;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('confirm-ok').focus();
}

function closeConfirm(confirmed) {
  document.getElementById('confirm-overlay').classList.add('hidden');
  document.getElementById('confirm-modal').classList.add('hidden');
  const cb = _confirmCallback;
  _confirmCallback = null;
  if (confirmed && cb) cb();
}

/* ── Templates ────────────────────────────────────────────────── */
let _collapseNewTile = null;
let _addingNewTab = false;

function openTemplatesModal() {
  document.getElementById('template-modal').classList.remove('hidden');
  document.getElementById('template-overlay').classList.remove('hidden');
}

function closeTemplatesModal() {
  document.getElementById('template-modal').classList.add('hidden');
  document.getElementById('template-overlay').classList.add('hidden');
  if (_collapseNewTile) _collapseNewTile();
  _addingNewTab = false;
}

function loadTemplate(template) {
  const doLoad = () => {
    const categories = template.categories
      ? template.categories.map(c => ({ ...c }))
      : [];

    if (template.tabs) {
      const newTabs = template.tabs.map(t => ({
        id: genTabId(),
        name: t.name,
        hotkeys: Object.fromEntries(Object.entries(t.hotkeys).map(([k, v]) => [k, { ...v }])),
      }));
      if (_addingNewTab) {
        syncActiveTab();
        state.tabs.push(...newTabs);
      } else {
        state.tabs = newTabs;
      }
      state.activeTabId = newTabs[0].id;
      state.hotkeys = JSON.parse(JSON.stringify(newTabs[0].hotkeys));
    } else {
      const hotkeys = Object.fromEntries(
        Object.entries(template.hotkeys).map(([k, v]) => [k, { ...v }])
      );
      if (!categories.length) {
        categories.push(...DEFAULT_CATEGORIES.filter(c => new Set(Object.values(hotkeys).map(hk => hk.category).filter(Boolean)).has(c.id)).map(c => ({ ...c })));
      }
      if (_addingNewTab) {
        syncActiveTab();
        const id = genTabId();
        state.tabs.push({ id, name: template.name, hotkeys });
        state.activeTabId = id;
        state.hotkeys = JSON.parse(JSON.stringify(hotkeys));
      } else {
        state.hotkeys = hotkeys;
      }
    }
    state.categories = categories;
    document.getElementById('map-name').value = template.name;
    track('template_loaded', { template_name: template.name, template_category: template.appCategory, session_count: ++_sessionCounts.saves });
    populateCategorySelect();
    renderTabBar();
    renderKeyboard();
    renderLegend();
    renderSummary();
    saveToStorage();
    closeTemplatesModal();
  };
  const hasContent = Object.keys(state.hotkeys).length > 0;
  if (!_addingNewTab && hasContent) {
    const tabNote = template.tabs ? ` It will create ${template.tabs.length} tabs.` : '';
    showConfirm(`Load "${template.name}"? This will replace your current map.${tabNote}`, doLoad);
  } else {
    doLoad();
  }
}

function initTemplates() {
  const grid = document.getElementById('template-grid');

  // New Map tile
  const newTile = document.createElement('div');
  newTile.className = 'template-tile template-tile-new';
  newTile.dataset.new = 'true';

  const prompt = document.createElement('div');
  prompt.className = 'template-new-prompt';
  prompt.innerHTML = `
    <span class="template-new-plus">+</span>
    <span class="template-name">New Map</span>
    <span class="template-meta"><span class="template-badge template-badge-blank">Blank</span></span>
  `;

  const form = document.createElement('div');
  form.className = 'template-new-form hidden';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'template-name-input';
  nameInput.placeholder = 'Map name…';
  nameInput.maxLength = 60;
  nameInput.autocomplete = 'off';

  const actions = document.createElement('div');
  actions.className = 'template-new-actions';

  const createBtn = document.createElement('button');
  createBtn.className = 'btn btn-primary';
  createBtn.textContent = 'Create';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.textContent = 'Cancel';

  actions.appendChild(createBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(nameInput);
  form.appendChild(actions);
  newTile.appendChild(prompt);
  newTile.appendChild(form);

  const collapse = () => {
    form.classList.add('hidden');
    prompt.classList.remove('hidden');
    newTile.classList.remove('expanded');
  };
  _collapseNewTile = collapse;

  const expand = () => {
    prompt.classList.add('hidden');
    form.classList.remove('hidden');
    newTile.classList.add('expanded');
    nameInput.value = document.getElementById('map-name').value || '';
    nameInput.select();
    setTimeout(() => nameInput.focus(), 30);
  };

  const doCreate = () => {
    const name = nameInput.value.trim() || 'Untitled Map';
    const apply = () => {
      if (_addingNewTab) {
        syncActiveTab();
        const id = genTabId();
        state.tabs.push({ id, name, hotkeys: {} });
        state.activeTabId = id;
        state.hotkeys = {};
      } else {
        state.hotkeys    = {};
        state.categories = [];
      }
      document.getElementById('map-name').value = name;
      track('new_map_created', { session_count: ++_sessionCounts.saves });
      populateCategorySelect();
      renderTabBar();
      renderKeyboard();
      renderLegend();
      renderSummary();
      saveToStorage();
      closeTemplatesModal();
    };
    if (!_addingNewTab && Object.keys(state.hotkeys).length > 0) {
      showConfirm(`Start a new map named "${name}"? This will clear your current map.`, apply);
    } else {
      apply();
    }
  };

  prompt.addEventListener('click', expand);
  createBtn.addEventListener('click', doCreate);
  cancelBtn.addEventListener('click', collapse);
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doCreate();
    if (e.key === 'Escape') collapse();
  });

  grid.appendChild(newTile);

  // Existing template tiles
  [...TEMPLATES].sort((a, b) => a.name.localeCompare(b.name)).forEach(template => {
    const count = template.tabs
      ? template.tabs.reduce((sum, t) => sum + Object.keys(t.hotkeys).length, 0)
      : Object.keys(template.hotkeys).length;
    const tile = document.createElement('button');
    tile.className = 'template-tile';
    tile.dataset.category = template.appCategory;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'template-icon';
    const img = document.createElement('img');
    img.src = template.iconSrc;
    img.alt = template.name;
    img.className = template.iconClass || (template.iconWide ? 'template-logo template-logo--wide' : 'template-logo');
    iconSpan.appendChild(img);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'template-name';
    nameSpan.textContent = template.name;

    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'template-badge';
    badgeSpan.textContent = template.appCategory;

    const countSpan = document.createElement('span');
    countSpan.className = 'template-count';
    countSpan.textContent = template.tabs ? `${template.tabs.length} tabs` : `${count} keys`;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'template-meta';
    metaSpan.append(badgeSpan, countSpan);

    tile.append(iconSpan, nameSpan, metaSpan);
    tile.addEventListener('click', () => loadTemplate(template));
    grid.appendChild(tile);
  });

  document.querySelectorAll('.template-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.template-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      document.querySelectorAll('.template-tile').forEach(tile => {
        if (tile.dataset.new) return;
        tile.classList.toggle('hidden', cat !== 'all' && tile.dataset.category !== cat);
      });
    });
  });

  document.getElementById('btn-templates').addEventListener('click', openTemplatesModal);
  document.getElementById('template-close').addEventListener('click', closeTemplatesModal);
  document.getElementById('template-overlay').addEventListener('click', closeTemplatesModal);
}

/* ── Action dropdown (module-scoped so all init fns can use it) ── */
// Persistent element stays in the DOM so its GPU layer is always allocated,
// eliminating the black-texture flash on first show.
const _dropdownEl = document.createElement('div');
_dropdownEl.className = 'action-dropdown';
_dropdownEl.style.display = 'none';
document.body.appendChild(_dropdownEl);

let _dropdownOutsideClick = null;
let _dropdownAnchor = null;

function closeActionDropdown() {
  _dropdownEl.style.display = 'none';
  _dropdownEl.style.minWidth = '';
  if (_dropdownAnchor) { _dropdownAnchor.classList.remove('open'); _dropdownAnchor = null; }
  if (_dropdownOutsideClick) {
    document.removeEventListener('click', _dropdownOutsideClick, true);
    _dropdownOutsideClick = null;
  }
}

function showActionDropdown(anchor, items) {
  if (_dropdownAnchor === anchor) { closeActionDropdown(); return; }
  closeActionDropdown();
  _dropdownEl.innerHTML = '';
  const hasHeaders = items.some(it => it.header);
  items.forEach((item, i) => {
    if (item.header) {
      if (i > 0) {
        const sep = document.createElement('div');
        sep.className = 'action-dropdown-sep';
        _dropdownEl.appendChild(sep);
      }
      const hdr = document.createElement('div');
      hdr.className = 'action-dropdown-header';
      hdr.textContent = item.label;
      _dropdownEl.appendChild(hdr);
      return;
    }
    if (!hasHeaders && i > 0) {
      const sep = document.createElement('div');
      sep.className = 'action-dropdown-sep';
      _dropdownEl.appendChild(sep);
    }
    const btn = document.createElement('button');
    btn.className = 'action-dropdown-item' + (item.selected ? ' selected' : '');
    btn.textContent = item.label;
    if (item.selected) {
      const check = document.createElement('span');
      check.className = 'dropdown-check';
      check.textContent = '✓';
      btn.appendChild(check);
    }
    btn.addEventListener('click', () => { closeActionDropdown(); item.action(); });
    _dropdownEl.appendChild(btn);
  });
  const rect = anchor.getBoundingClientRect();
  _dropdownEl.style.top  = (rect.bottom + 4) + 'px';
  _dropdownEl.style.left = rect.left + 'px';
  _dropdownEl.style.display = '';
  _dropdownAnchor = anchor;
  anchor.classList.add('open');
  setTimeout(() => {
    _dropdownOutsideClick = e => {
      if (!_dropdownEl.contains(e.target) && e.target !== anchor) closeActionDropdown();
    };
    document.addEventListener('click', _dropdownOutsideClick, true);
  }, 0);
}

function showClearDropdown(anchor) {
  if (_dropdownAnchor === anchor) { closeActionDropdown(); return; }
  closeActionDropdown();

  const sel = { hotkeys: false, categories: false, tabs: false };
  _dropdownEl.innerHTML = '';

  const options = [
    { key: 'hotkeys',    label: 'Hotkeys'    },
    { key: 'categories', label: 'Categories' },
    { key: 'tabs',       label: 'Tabs'       },
  ];

  let applyBtn;
  function updateApplyBtn() {
    if (applyBtn) applyBtn.disabled = !Object.values(sel).some(Boolean);
  }

  options.forEach((opt, i) => {
    if (i > 0) {
      const sep = document.createElement('div');
      sep.className = 'action-dropdown-sep';
      _dropdownEl.appendChild(sep);
    }
    const row = document.createElement('div');
    row.className = 'clear-toggle-row';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'settings-label';
    labelSpan.textContent = opt.label;
    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'toggle-switch';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = false;
    cb.addEventListener('change', () => { sel[opt.key] = cb.checked; updateApplyBtn(); });
    const track = document.createElement('span');
    track.className = 'toggle-track';
    toggleLabel.appendChild(cb);
    toggleLabel.appendChild(track);
    row.appendChild(labelSpan);
    row.appendChild(toggleLabel);
    _dropdownEl.appendChild(row);
  });

  const footerSep = document.createElement('div');
  footerSep.className = 'action-dropdown-sep';
  _dropdownEl.appendChild(footerSep);

  applyBtn = document.createElement('button');
  applyBtn.className = 'action-dropdown-footer-btn';
  applyBtn.textContent = 'Clear';
  applyBtn.disabled = true;
  applyBtn.addEventListener('click', () => {
    if (!Object.values(sel).some(Boolean)) return;
    closeActionDropdown();
    const parts = [];
    if (sel.hotkeys)    parts.push('hotkeys');
    if (sel.categories) parts.push('categories');
    if (sel.tabs)       parts.push('tabs');
    showConfirm(`Clear ${parts.join(', ')} from this map?`, () => {
      pushUndo();
      if (sel.tabs) {
        syncActiveTab();
        const kept = sel.hotkeys ? {} : JSON.parse(JSON.stringify(state.hotkeys));
        const id = genTabId();
        state.tabs = [{ id, name: 'Default', hotkeys: kept }];
        state.activeTabId = id;
        state.hotkeys = kept;
      } else if (sel.hotkeys) {
        state.hotkeys = {};
        state.tabs.forEach(t => { t.hotkeys = {}; });
      }
      if (sel.categories) state.categories = [];
      track('clear_all', { clear_hotkeys: sel.hotkeys, clear_cats: sel.categories, clear_tabs: sel.tabs });
      renderKeyboard(); renderLegend(); renderSummary(); renderTabBar(); saveToStorage();
    });
  });
  _dropdownEl.appendChild(applyBtn);

  const rect = anchor.getBoundingClientRect();
  _dropdownEl.style.minWidth = '170px';
  _dropdownEl.style.top  = (rect.bottom + 4) + 'px';
  _dropdownEl.style.left = rect.left + 'px';
  _dropdownEl.style.display = '';
  _dropdownAnchor = anchor;
  anchor.classList.add('open');
  setTimeout(() => {
    _dropdownOutsideClick = e => {
      if (!_dropdownEl.contains(e.target) && e.target !== anchor) closeActionDropdown();
    };
    document.addEventListener('click', _dropdownOutsideClick, true);
  }, 0);
}

/* ── Layout controls ──────────────────────────────────────────── */


function initLayoutControls() {
  const layoutBtn = document.getElementById('select-layout');
  const keymapBtn = document.getElementById('select-keymap');

  function setLayoutLabel(value) {
    const opt = LAYOUT_OPTIONS.find(o => !o.header && o.value === value);
    layoutBtn.querySelector('.select-label').textContent = opt ? opt.label : value;
  }

  function setKeymapLabel(value) {
    const opt = KEYMAP_OPTIONS.find(o => o.value === value);
    keymapBtn.querySelector('.select-label').textContent = opt ? opt.label : value;
  }

  setLayoutLabel(state.layout);
  setKeymapLabel(state.keyMap);

  layoutBtn.addEventListener('click', e => {
    showActionDropdown(e.currentTarget, LAYOUT_OPTIONS.map(opt =>
      opt.header ? opt : {
        ...opt,
        selected: opt.value === state.layout,
        action: () => {
          state.layout = opt.value;
          setLayoutLabel(opt.value);
          track('layout_changed', { layout: state.layout });
          renderKeyboard();
          saveToStorage();
        }
      }
    ));
  });

  keymapBtn.addEventListener('click', e => {
    showActionDropdown(e.currentTarget, KEYMAP_OPTIONS.map(opt => ({
      ...opt,
      selected: opt.value === state.keyMap,
      action: () => {
        state.keyMap = opt.value;
        setKeymapLabel(opt.value);
        track('keymap_changed', { key_map: state.keyMap });
        renderKeyboard();
        saveToStorage();
      }
    })));
  });
}

/* ── Events ───────────────────────────────────────────────────── */
function initEvents() {
  const mobileMenuBtn = document.getElementById('btn-mobile-menu');
  const headerActions = document.querySelector('.header-actions');

  mobileMenuBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = headerActions.classList.toggle('menu-open');
    mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', e => {
    if (headerActions.classList.contains('menu-open') && !e.target.closest('.app-header')) {
      headerActions.classList.remove('menu-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('popover-close').addEventListener('click', closePopover);
  document.getElementById('popover-overlay').addEventListener('click', closePopover);

  document.querySelectorAll('.mod-chip input').forEach(cb => {
    cb.addEventListener('change', () => cb.closest('.mod-chip').classList.toggle('active', cb.checked));
  });

  document.getElementById('btn-save-hotkey').addEventListener('click', saveHotkey);
  document.getElementById('btn-clear-hotkey').addEventListener('click', clearHotkey);
  document.getElementById('btn-undo').addEventListener('click', undoAction);
  document.getElementById('btn-redo').addEventListener('click', redoAction);

  document.getElementById('hotkey-label').addEventListener('input', () => {
    renderLabelSuggestions();
    updateConflictWarning();
  });
  document.getElementById('hotkey-label').addEventListener('keydown', e => {
    const box = document.getElementById('label-suggestions');
    if (!box.hidden) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggestionFocus(1); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); moveSuggestionFocus(-1); return; }
      if (e.key === 'Escape')    { hideLabelSuggestions(); return; }
      if (e.key === 'Enter') {
        const focused = box.querySelector('.ls-focused');
        if (focused) { e.preventDefault(); selectSuggestion(focused.querySelector('.label-suggestion-text').textContent); return; }
      }
    }
    if (e.key === 'Enter') saveHotkey();
  });
  document.getElementById('hotkey-label').addEventListener('blur', () => {
    setTimeout(hideLabelSuggestions, 150);
  });

  document.addEventListener('keydown', e => {
    if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') &&
        e.target.id !== 'map-name') return;
    if (e.ctrlKey && !e.altKey) {
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoAction(); }
      if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redoAction(); }
    }
  });

  document.getElementById('confirm-ok').addEventListener('click',     () => closeConfirm(true));
  document.getElementById('confirm-cancel').addEventListener('click',  () => closeConfirm(false));
  document.getElementById('confirm-overlay').addEventListener('click', () => closeConfirm(false));

  document.addEventListener('keydown', e => {
    if (!document.getElementById('confirm-modal').classList.contains('hidden')) {
      if (e.key === 'Escape') { e.stopPropagation(); closeConfirm(false); }
      if (e.key === 'Enter')  { e.stopPropagation(); closeConfirm(true);  }
      return;
    }
    if (e.key !== 'Escape') return;
    if (activeKeyId) closePopover();
    else if (!document.getElementById('template-modal').classList.contains('hidden')) closeTemplatesModal();
  });

  document.getElementById('map-name').addEventListener('input', saveToStorage);

  document.getElementById('btn-new').addEventListener('click', () => {
    showConfirm('Create a new map? This will wipe all hotkeys, categories, and tabs.', () => {
      track('new_map_started', { session_count: ++_sessionCounts.saves });
      pushUndo();
      const id = genTabId();
      state.tabs = [{ id, name: 'New Map', hotkeys: {} }];
      state.activeTabId = id;
      state.hotkeys = {};
      state.categories = [];
      document.getElementById('map-name').value = 'New Map';
      renderKeyboard(); renderLegend(); renderSummary(); renderTabBar(); saveToStorage();
    });
  });

  document.getElementById('btn-heatmap').addEventListener('click', toggleHeatmap);

  document.getElementById('btn-clear-all').addEventListener('click', e => {
    showClearDropdown(e.currentTarget);
  });

  /* ── Style panel ── */
  const stylePanel = document.getElementById('style-panel');

  function openStylePanel(btn) {
    closeSharePanel();
    if (!stylePanel.classList.contains('hidden')) { stylePanel.classList.add('hidden'); return; }
    const rect = btn.getBoundingClientRect();
    stylePanel.style.top   = `${rect.bottom + 6}px`;
    stylePanel.style.left  = `${rect.left}px`;
    stylePanel.style.right = '';
    stylePanel.classList.remove('hidden');
  }

  function closeStylePanel() { stylePanel.classList.add('hidden'); }

  document.getElementById('btn-style').addEventListener('click', e => {
    e.stopPropagation();
    openStylePanel(e.currentTarget);
  });

  /* ── Share panel ── */
  const sharePanel = document.getElementById('share-panel');

  function openSharePanel(btn) {
    closeStylePanel();
    if (!sharePanel.classList.contains('hidden')) { sharePanel.classList.add('hidden'); return; }
    const rect = btn.getBoundingClientRect();
    sharePanel.style.top   = `${rect.bottom + 6}px`;
    sharePanel.style.right = `${window.innerWidth - rect.right}px`;
    sharePanel.classList.remove('hidden');
  }

  function closeSharePanel() { sharePanel.classList.add('hidden'); }

  document.getElementById('btn-share').addEventListener('click', e => {
    e.stopPropagation();
    openSharePanel(e.currentTarget);
  });

  document.addEventListener('click', e => {
    if (!stylePanel.classList.contains('hidden') && !stylePanel.contains(e.target)) closeStylePanel();
    if (!sharePanel.classList.contains('hidden') && !sharePanel.contains(e.target)) closeSharePanel();
  });

  document.getElementById('share-copy-link').addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      track('map_shared', { method: 'link', key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.shares });
      const orig = nameEl.textContent;
      nameEl.textContent = 'Copied!';
      setTimeout(() => { nameEl.textContent = orig; closeSharePanel(); }, 1500);
    } catch (_) {}
  });

  document.getElementById('share-twitter').addEventListener('click', () => {
    const mapName = document.getElementById('map-name').value || 'My Keyboard Map';
    const url = buildShareUrl();
    const text = encodeURIComponent(`Check out my keyboard shortcut map "${mapName}" — created with KeyBindr`);
    track('map_shared', { method: 'twitter', session_count: ++_sessionCounts.shares });
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
    closeSharePanel();
  });

  document.getElementById('share-reddit').addEventListener('click', () => {
    const mapName = document.getElementById('map-name').value || 'My Keyboard Map';
    const url = buildShareUrl();
    track('map_shared', { method: 'reddit', session_count: ++_sessionCounts.shares });
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(mapName)}`, '_blank', 'noopener');
    closeSharePanel();
  });

  document.getElementById('share-email').addEventListener('click', () => {
    const mapName = document.getElementById('map-name').value || 'My Keyboard Map';
    const url = buildShareUrl();
    const subject = encodeURIComponent(`${mapName} — KeyBindr`);
    const body = encodeURIComponent(`${mapName}\nGenerated: ${shareDate()}\n\nView this keyboard shortcut map online:\n${url}\n\n---\nCreated with KeyBindr — ${siteUrl()}`);
    track('map_shared', { method: 'email', session_count: ++_sessionCounts.shares });
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    closeSharePanel();
  });

  document.getElementById('share-copy-text').addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    try {
      await navigator.clipboard.writeText(buildPlainText());
      track('map_shared', { method: 'text', session_count: ++_sessionCounts.shares });
      const orig = nameEl.textContent;
      nameEl.textContent = 'Copied!';
      setTimeout(() => { nameEl.textContent = orig; closeSharePanel(); }, 1500);
    } catch (_) {}
  });

  document.getElementById('share-copy-md').addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    const md = buildMarkdown();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([md], { type: 'text/plain' }),
          'text/html':  new Blob([markdownToHtml(md)], { type: 'text/html' }),
        }),
      ]);
    } catch (_) {
      try { await navigator.clipboard.writeText(md); } catch (_) { return; }
    }
    track('map_shared', { method: 'markdown', session_count: ++_sessionCounts.shares });
    const orig = nameEl.textContent;
    nameEl.textContent = 'Copied!';
    setTimeout(() => { nameEl.textContent = orig; closeSharePanel(); }, 1500);
  });

  document.getElementById('share-export-csv').addEventListener('click', () => {
    exportMapCSV();
    closeSharePanel();
  });

  document.getElementById('share-export').addEventListener('click', () => {
    track('map_exported', { key_count: Object.keys(state.hotkeys).length });
    exportMap();
    closeSharePanel();
  });

  document.getElementById('share-print').addEventListener('click', () => {
    track('map_printed', { key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.prints });
    closeSharePanel();
    window.print();
  });

  document.getElementById('share-export-png').addEventListener('click', async () => {
    track('map_exported_png', { key_count: Object.keys(state.hotkeys).length });
    closeSharePanel();

    const target = document.querySelector('.app-main');
    if (!target || typeof htmlToImage === 'undefined') {
      alert('PNG export is not available right now.');
      return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = isDark ? '#1a1a1a' : '#ffffff';

    const legend = document.getElementById('legend');
    const wasCollapsed = legend && legend.classList.contains('collapsed');
    if (wasCollapsed) legend.classList.remove('collapsed');

    const mapName = (document.getElementById('map-name').value || 'hotkey-map')
      .trim().replace(/\s+/g, '-').toLowerCase();
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `${mapName}-${datePart}.png`;

    try {
      const blob = await htmlToImage.toBlob(target, {
        pixelRatio: 2,
        backgroundColor: bg,
      });
      if (wasCollapsed) legend.classList.add('collapsed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (wasCollapsed) legend.classList.add('collapsed');
      console.error('PNG export failed:', err);
      alert('PNG export failed. Check the console for details.');
    }
  });

  document.getElementById('summary-search').addEventListener('input', filterSummary);


  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });

  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files[0]) importMap(e.target.files[0]);
    e.target.value = '';
  });
}

/* ── Custom categories ────────────────────────────────────────── */

/* ── Platform toggle ──────────────────────────────────────────── */
function initPlatformToggle() {
  document.getElementById('platform-toggle').addEventListener('click', e => {
    const btn = e.target.closest('.platform-btn');
    if (!btn) return;
    state.platform = btn.dataset.platform;
    document.querySelectorAll('.platform-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
    });
    renderSummary();
    if (_tooltipTarget) showKeyTooltip(_tooltipTarget);
    saveToStorage();
  });
}

/* ── Legend toggle ────────────────────────────────────────────── */
function initLegendToggle() {
  const legend    = document.getElementById('legend');
  const toggleBtn = document.getElementById('btn-legend-toggle');
  if (!legend || !toggleBtn) return;

  if (localStorage.getItem('keybindr-legend-collapsed') === 'true') {
    legend.classList.add('collapsed');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = legend.classList.toggle('collapsed');
    toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    localStorage.setItem('keybindr-legend-collapsed', String(isCollapsed));
    track('categories_toggled', { collapsed: isCollapsed });
  });
}

/* ── Summary settings panel ───────────────────────────────────── */
function initSummarySettings() {
  const panel        = document.getElementById('summary-settings-panel');
  const btn          = document.getElementById('btn-summary-settings');
  const closeBtn     = document.getElementById('summary-settings-close');
  const overflowChk  = document.getElementById('setting-overflow');
  const overflowAt   = document.getElementById('setting-overflow-at');
  const overflowRow  = document.getElementById('overflow-at-row');

  function syncUI() {
    overflowChk.checked  = state.summarySettings.overflow;
    overflowAt.value     = state.summarySettings.overflowAt;
    overflowRow.classList.toggle('settings-subrow-disabled', !state.summarySettings.overflow);
  }

  function openPanel() {
    syncUI();
    const rect = btn.getBoundingClientRect();
    panel.style.top   = `${rect.bottom + 6}px`;
    panel.style.right = `${window.innerWidth - rect.right}px`;
    panel.classList.remove('hidden');
    btn.classList.add('active');
  }

  function closePanel() {
    panel.classList.add('hidden');
    btn.classList.remove('active');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.contains('hidden') ? openPanel() : closePanel();
  });

  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('click', e => {
    if (!panel.classList.contains('hidden') && !panel.contains(e.target) && e.target !== btn) {
      closePanel();
    }
  });

  overflowChk.addEventListener('change', () => {
    state.summarySettings.overflow = overflowChk.checked;
    overflowRow.classList.toggle('settings-subrow-disabled', !state.summarySettings.overflow);
    renderSummary();
    saveToStorage();
  });

  overflowAt.addEventListener('change', () => {
    const val = Math.min(50, Math.max(4, parseInt(overflowAt.value) || 8));
    overflowAt.value = val;
    state.summarySettings.overflowAt = val;
    if (state.summarySettings.overflow) { renderSummary(); saveToStorage(); }
  });

  syncUI();
}

/* ── Help modal ───────────────────────────────────────────────── */
function initHelpModal() {
  const modal   = document.getElementById('help-modal');
  const overlay = document.getElementById('help-overlay');
  const btn     = document.getElementById('btn-help');
  const closeBtn = document.getElementById('help-close');

  function open() {
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    btn.classList.add('active');
  }

  function close() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    btn.classList.remove('active');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    modal.classList.contains('hidden') ? open() : close();
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
function initFooter() {
  document.getElementById('footer-year').textContent    = new Date().getFullYear();
  document.getElementById('footer-version').textContent = `v${VERSION}`;
}

function init() {
  setThemeChangeCallback(() => { if (heatmapActive) applyHeatmap(); });
  setKeyboardCallbacks({
    openPopover,
    reapplyFilter,
    applyHeatmap,
    isHeatmapActive: () => heatmapActive,
  });
  setSummaryCallbacks({ openPopover, populateCategorySelect, renderLegend });
  setCategoriesCallbacks({ showConfirm });
  initTheme();
  initScheme();
  loadFromStorage();
  const loadedFromUrl = loadFromHash();

  if (loadedFromUrl) {
    track('map_loaded_from_url', { key_count: Object.keys(state.hotkeys).length });
  } else if (Object.keys(state.hotkeys).length > 0) {
    track('returning_user', { key_count: Object.keys(state.hotkeys).length });
  }

  renderKeyboard();
  initKeyboardScale();
  populateCategorySelect();
  renderLegend();
  renderSummary();
  renderTabBar();
  initEvents();
  initLayoutControls();
  initTemplates();
  initCustomCategories();
  initPlatformToggle();
  initLegendToggle();
  initSummarySettings();
  initHelpModal();
  initFooter();
}

document.addEventListener('DOMContentLoaded', init);
