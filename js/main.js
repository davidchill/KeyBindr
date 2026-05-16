import {
  VERSION, UNIT, GAP, FN_H, MIN_KB_SCALE, KB_PADDING,
  LAYOUTS, ZSA_IDS, KEY_MAPS, VALID_LAYOUTS, VALID_KEY_MAPS,
  SUMMARY_COLS, SUMMARY_CAT_WRAP, SPLIT_AFTER, SPLIT_GAP,
  DEFAULT_CATEGORIES, MAIN_ROWS, NAV_ROWS, NUMPAD_KEYS,
  ZSA_STAGGER, ZSA_KEYBOARDS, MOD_MAP_MAC, KEY_FULL_NAMES,
  LAYOUT_OPTIONS, KEYMAP_OPTIONS, THEME_KEY, SCHEME_KEY, SCHEME_OPTIONS,
  UNDO_LIMIT,
} from './constants.js';
import { TEMPLATES } from './templates.js';
import {
  state, genTabId, syncActiveTab,
  saveToStorage, loadFromStorage,
  buildShareUrl, loadFromHash,
} from './state.js';
import { applyTheme, initTheme, applyScheme, setThemeChangeCallback } from './theme.js';
import {
  renderSummary, filterSummary, getOrderedHotkeys,
  setSummaryCallbacks, snapshotLayoutFromDOM,
  startCatDrag, clearDragIndicators, clearItemDragIndicators,
  moveItemInSummary, moveCategoryInLayout, moveCategoryInOverflowOrder, moveCategoryToColumn,
  makeSummaryItem, makeSummaryGroup,
} from './summary.js';
import {
  allCategories, renderLegend, renderLegendActivePreview,
  buildCatChip, applyFilter, reapplyFilter,
  startEditCategory, deleteCategory,
  populateCategorySelect, initCustomCategories,
} from './categories.js';
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
} from './keyboard.js';
import { applyHeatmap, clearHeatmap, toggleHeatmap, isHeatmapActive, setHeatmapCallbacks } from './heatmap.js';
import {
  openPopover, closePopover, getActiveKeyId,
  renderLabelSuggestions, hideLabelSuggestions,
  moveSuggestionFocus, updateConflictWarning,
  saveHotkey, clearHotkey, setPopoverCallbacks,
} from './popover.js';
import {
  shareDate, siteUrl,
  buildPlainText, buildMarkdown, markdownToHtml,
  copyToClipboard, exportMap, exportMapCSV,
  validateImport, importMap, setExportCallbacks,
} from './export.js';
import {
  switchTab, showTabNameDialog, renameTab, deleteTab, addTab, renderTabBar,
  setTabsCallbacks,
} from './tabs.js';
import { showConfirm, closeConfirm, initConfirmEvents } from './confirm.js';

/* ── Analytics ────────────────────────────────────────────────── */
const _sessionCounts = { saves: 0, shares: 0, prints: 0, exports: 0, imports: 0 };

function track(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

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

/* ── Templates ────────────────────────────────────────────────── */
let _collapseNewTile = null;
let _addingNewTab = false;

function openTemplatesModal(addingNewTab = false) {
  _addingNewTab = addingNewTab === true;
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

function handleTemplateParam() {
  const id = new URLSearchParams(location.search).get('template');
  if (!id) return;
  const template = TEMPLATES.find(t => t.id === id.toLowerCase());
  if (template) loadTemplate(template);
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
    const tile = document.createElement('a');
    tile.className = 'template-tile';
    tile.href = `${template.id}.html`;
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

/* ── Action dropdown ──────────────────────────────────────────── */
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
    const trackEl = document.createElement('span');
    trackEl.className = 'toggle-track';
    toggleLabel.appendChild(cb);
    toggleLabel.appendChild(trackEl);
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
        if (focused) { e.preventDefault(); selectSuggestionFromFocused(focused); return; }
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

  document.addEventListener('keydown', e => {
    if (!document.getElementById('confirm-modal').classList.contains('hidden')) {
      if (e.key === 'Escape') { e.stopPropagation(); closeConfirm(false); }
      if (e.key === 'Enter')  { e.stopPropagation(); closeConfirm(true);  }
      return;
    }
    if (e.key !== 'Escape') return;
    if (getActiveKeyId()) closePopover();
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
  const modal    = document.getElementById('help-modal');
  const overlay  = document.getElementById('help-overlay');
  const btn      = document.getElementById('btn-help');
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

function selectSuggestionFromFocused(focused) {
  const text = focused.querySelector('.label-suggestion-text')?.textContent;
  if (text) {
    document.getElementById('hotkey-label').value = text;
    hideLabelSuggestions();
    updateConflictWarning();
    document.getElementById('hotkey-label').focus();
  }
}

function init() {
  setThemeChangeCallback(() => { if (isHeatmapActive()) applyHeatmap(); });
  setKeyboardCallbacks({
    openPopover,
    reapplyFilter,
    applyHeatmap,
    isHeatmapActive,
  });
  setHeatmapCallbacks({ track, renderKeyboard, renderLegend });
  setSummaryCallbacks({ openPopover, populateCategorySelect, renderLegend });
  setPopoverCallbacks({ pushUndo, renderLegend, renderSummary, track });
  setExportCallbacks({ pushUndo, renderKeyboard, renderLegend, renderSummary, track, sessionCounts: _sessionCounts });
  setTabsCallbacks({ renderKeyboard, renderLegend, renderSummary, openTemplatesModal, track });

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
  initConfirmEvents();
  initLayoutControls();
  initTemplates();
  handleTemplateParam();
  initCustomCategories();
  initPlatformToggle();
  initLegendToggle();
  initSummarySettings();
  initHelpModal();
  initFooter();
}

document.addEventListener('DOMContentLoaded', init);
