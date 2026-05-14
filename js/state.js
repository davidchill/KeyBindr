import { VALID_LAYOUTS, VALID_KEY_MAPS, DEFAULT_CATEGORIES } from './constants.js';

/* ── App state ────────────────────────────────────────────────── */
export const state = {
  hotkeys:        {},
  tabs:           [{ id: 'tab-default', name: 'Default', hotkeys: {} }],
  activeTabId:    'tab-default',
  layout:         'full',
  keyMap:         'qwerty',
  categories:     [],
  platform:       'windows',
  collapsedCats:  new Set(),
  summarySettings: { overflow: false, overflowAt: 8, catOrder: [] },
  catItemOrder:   {},
};

/* ── Tab helpers ──────────────────────────────────────────────── */
export function genTabId() {
  return 'tab-' + Math.random().toString(36).slice(2, 8);
}

export function syncActiveTab() {
  const tab = state.tabs.find(t => t.id === state.activeTabId);
  if (tab) tab.hotkeys = JSON.parse(JSON.stringify(state.hotkeys));
}

/* ── Persistence ──────────────────────────────────────────────── */
export function saveToStorage() {
  syncActiveTab();
  try {
    localStorage.setItem('keybindr', JSON.stringify({
      hotkeys:         state.hotkeys,
      tabs:            state.tabs,
      activeTabId:     state.activeTabId,
      mapName:         document.getElementById('map-name').value,
      layout:          state.layout,
      keyMap:          state.keyMap,
      summaryCols:     state.summaryCols,
      categories:      state.categories,
      platform:        state.platform,
      collapsedCats:   [...state.collapsedCats],
      summarySettings: state.summarySettings,
      catItemOrder:    state.catItemOrder,
    }));
  } catch (_) {}
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem('keybindr');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.hotkeys) state.hotkeys = data.hotkeys;
    if (data.mapName) document.getElementById('map-name').value = data.mapName;
    if (data.layout && VALID_LAYOUTS.has(data.layout))   state.layout = data.layout;
    if (data.keyMap && VALID_KEY_MAPS.has(data.keyMap)) state.keyMap = data.keyMap;
    if (data.summaryCols) state.summaryCols = data.summaryCols;
    // Migrate old customCategories format, or load new categories array
    state.categories = data.categories || data.customCategories || [];
    // Restore any DEFAULT_CATEGORIES referenced by hotkeys but not yet in state.categories
    const usedCatIds  = new Set(Object.values(state.hotkeys).map(hk => hk.category).filter(Boolean));
    const existingIds = new Set(state.categories.map(c => c.id));
    DEFAULT_CATEGORIES.forEach(cat => {
      if (usedCatIds.has(cat.id) && !existingIds.has(cat.id)) state.categories.push({ ...cat });
    });
    if (data.collapsedCats) state.collapsedCats = new Set(data.collapsedCats);
    if (data.summarySettings) state.summarySettings = { ...state.summarySettings, ...data.summarySettings };
    if (data.catItemOrder)    state.catItemOrder    = data.catItemOrder;
    if (data.platform) {
      state.platform = data.platform;
      document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.platform === state.platform);
      });
    }
    // Load tabs (with migration from pre-tabs saves)
    if (data.tabs && Array.isArray(data.tabs) && data.tabs.length > 0) {
      state.tabs = data.tabs;
      state.activeTabId = data.activeTabId || data.tabs[0].id;
    } else {
      // Migration: wrap existing hotkeys in a Default tab
      state.tabs = [{ id: 'tab-default', name: 'Default', hotkeys: JSON.parse(JSON.stringify(state.hotkeys)) }];
      state.activeTabId = 'tab-default';
    }
    // Always load active tab's hotkeys as the working copy
    const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
    state.activeTabId = activeTab.id;
    state.hotkeys = JSON.parse(JSON.stringify(activeTab.hotkeys));
  } catch (_) {}
}

/* ── Share URL ────────────────────────────────────────────────── */
export function buildShareUrl() {
  const data = {
    hotkeys:    state.hotkeys,
    mapName:    document.getElementById('map-name').value,
    layout:     state.layout,
    keyMap:     state.keyMap,
    categories: state.categories,
  };
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
  return `${location.origin}${location.pathname}#lzmap=${compressed}`;
}

export function loadFromHash() {
  try {
    const hash = window.location.hash;
    let json;
    if (hash.startsWith('#lzmap=')) {
      json = LZString.decompressFromEncodedURIComponent(hash.slice(7));
    } else if (hash.startsWith('#map=')) {
      json = decodeURIComponent(atob(hash.slice(5)));
    } else {
      return false;
    }
    const data = JSON.parse(json);
    if (data.hotkeys) state.hotkeys = data.hotkeys;
    if (data.mapName) document.getElementById('map-name').value = data.mapName;
    if (data.layout && VALID_LAYOUTS.has(data.layout))  state.layout = data.layout;
    if (data.keyMap && VALID_KEY_MAPS.has(data.keyMap)) state.keyMap = data.keyMap;
    state.categories = data.categories || data.customCategories || [];
    history.replaceState(null, '', location.pathname);
    return true;
  } catch (_) { return false; }
}
