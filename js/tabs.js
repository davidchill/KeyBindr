import { state, genTabId, syncActiveTab, saveToStorage } from './state.js';

let _dragTabId = null;
let _cbs = {
  renderKeyboard: () => {},
  renderLegend: () => {},
  renderSummary: () => {},
  showConfirm: () => {},
  openTemplatesModal: () => {},
  track: () => {},
};

export function setTabsCallbacks(cb) { Object.assign(_cbs, cb); }

export function switchTab(id) {
  syncActiveTab();
  state.activeTabId = id;
  const tab = state.tabs.find(t => t.id === id);
  state.hotkeys = tab ? JSON.parse(JSON.stringify(tab.hotkeys)) : {};
  renderTabBar();
  _cbs.renderKeyboard();
  _cbs.renderLegend();
  _cbs.renderSummary();
  saveToStorage();
}

export function showTabNameDialog(onConfirm, opts = {}) {
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

export function renameTab(tabId, currentName) {
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
      _cbs.showConfirm(`Delete "${currentName}"?${detail}`, () => deleteTab(tabId));
    } : null,
  });
}

export function deleteTab(tabId) {
  const idx = state.tabs.findIndex(t => t.id === tabId);
  if (idx === -1 || state.tabs.length <= 1) return;
  state.tabs.splice(idx, 1);
  if (state.activeTabId === tabId) {
    const next = state.tabs[Math.min(idx, state.tabs.length - 1)];
    state.activeTabId = next.id;
    state.hotkeys = { ...next.hotkeys };
  }
  renderTabBar();
  _cbs.renderKeyboard();
  _cbs.renderLegend();
  _cbs.renderSummary();
  saveToStorage();
}

export function addTab() {
  _cbs.openTemplatesModal(true);
}

export function renderTabBar() {
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
