import { state, saveToStorage } from './state.js';
import { findKeyDef, getKeyLabel, refreshKey } from './keyboard.js';
import { KEY_FULL_NAMES } from './constants.js';

let activeKeyId = null;
let _suggestionIdx = -1;
let _cbs = { pushUndo: () => {}, renderLegend: () => {}, renderSummary: () => {}, track: () => {} };

export function setPopoverCallbacks(cb) { Object.assign(_cbs, cb); }
export function getActiveKeyId() { return activeKeyId; }

function getKeyFullName(keyId, def) {
  if (KEY_FULL_NAMES[keyId]) return KEY_FULL_NAMES[keyId];
  return (def ? getKeyLabel(def) : '') || keyId;
}

export function openPopover(keyId) {
  activeKeyId = keyId;
  const def = findKeyDef(keyId);
  const label = (def ? getKeyLabel(def) : '') || keyId;

  document.getElementById('popover-key-badge').textContent = label || keyId;
  document.getElementById('popover-title').textContent = getKeyFullName(keyId, def);

  document.querySelectorAll('.mod-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.mod-chip input').forEach(cb => cb.checked = false);
  document.getElementById('hotkey-label').value    = '';
  document.getElementById('hotkey-desc').value     = '';
  document.getElementById('hotkey-category').value = '';

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

export function closePopover() {
  activeKeyId = null;
  hideLabelSuggestions();
  document.getElementById('popover').classList.add('hidden');
  document.getElementById('popover-overlay').classList.add('hidden');
}

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

export function renderLabelSuggestions() {
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

export function hideLabelSuggestions() {
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

export function moveSuggestionFocus(dir) {
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

export function updateConflictWarning() {
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

export function saveHotkey() {
  if (!activeKeyId) return;
  const label = document.getElementById('hotkey-label').value.trim();
  if (!label) {
    document.getElementById('hotkey-label').focus();
    document.getElementById('hotkey-label').style.borderColor = 'var(--danger)';
    setTimeout(() => document.getElementById('hotkey-label').style.borderColor = '', 1200);
    return;
  }

  _cbs.pushUndo();
  const modifiers = [...document.querySelectorAll('.mod-chip input:checked')].map(cb => cb.value);

  state.hotkeys[activeKeyId] = {
    label,
    description: document.getElementById('hotkey-desc').value.trim(),
    category:    document.getElementById('hotkey-category').value,
    modifiers,
  };

  _cbs.track('key_assigned', {
    key_id:          activeKeyId,
    category:        state.hotkeys[activeKeyId].category || 'none',
    has_modifiers:   modifiers.length > 0,
    has_description: !!state.hotkeys[activeKeyId].description,
  });

  refreshKey(activeKeyId);
  _cbs.renderLegend();
  _cbs.renderSummary();
  saveToStorage();
  closePopover();
}

export function clearHotkey() {
  if (!activeKeyId) return;
  _cbs.pushUndo();
  _cbs.track('key_cleared', { key_id: activeKeyId });
  delete state.hotkeys[activeKeyId];
  refreshKey(activeKeyId);
  _cbs.renderLegend();
  _cbs.renderSummary();
  saveToStorage();
  closePopover();
}
