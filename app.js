/* ── Constants ────────────────────────────────────────────────── */
const UNIT = 44;
const GAP  = 4;
const FN_H = 30;

const CATEGORIES = [
  { id: 'movement',  name: 'Movement',     color: '#3b82f6' },
  { id: 'edit',      name: 'Edit / Undo',  color: '#f97316' },
  { id: 'selection', name: 'Selection',    color: '#a855f7' },
  { id: 'file',      name: 'File / Save',  color: '#22c55e' },
  { id: 'view',      name: 'View / Zoom',  color: '#06b6d4' },
  { id: 'tool',      name: 'Tool / Mode',  color: '#ef4444' },
  { id: 'combat',    name: 'Combat',       color: '#eab308' },
  { id: 'custom',    name: 'Custom',       color: '#ec4899' },
];

/* ── Layout data ──────────────────────────────────────────────── */
// width in units (default 1). type:'gap' = invisible spacer.
// alpha:true makes the label render larger (single-char keys).

const MAIN_ROWS = [
  { fn: true, keys: [
    { id:'Escape',        label:'Esc' },
    { type:'gap', width:0.5 },
    { id:'F1',  label:'F1'  }, { id:'F2',  label:'F2'  },
    { id:'F3',  label:'F3'  }, { id:'F4',  label:'F4'  },
    { type:'gap', width:0.5 },
    { id:'F5',  label:'F5'  }, { id:'F6',  label:'F6'  },
    { id:'F7',  label:'F7'  }, { id:'F8',  label:'F8'  },
    { type:'gap', width:0.5 },
    { id:'F9',  label:'F9'  }, { id:'F10', label:'F10' },
    { id:'F11', label:'F11' }, { id:'F12', label:'F12' },
  ]},
  { keys: [
    { id:'Backquote',    label:'`',  sub:'~' },
    { id:'Digit1',       label:'1',  sub:'!' },
    { id:'Digit2',       label:'2',  sub:'@' },
    { id:'Digit3',       label:'3',  sub:'#' },
    { id:'Digit4',       label:'4',  sub:'$' },
    { id:'Digit5',       label:'5',  sub:'%' },
    { id:'Digit6',       label:'6',  sub:'^' },
    { id:'Digit7',       label:'7',  sub:'&' },
    { id:'Digit8',       label:'8',  sub:'*' },
    { id:'Digit9',       label:'9',  sub:'(' },
    { id:'Digit0',       label:'0',  sub:')' },
    { id:'Minus',        label:'-',  sub:'_' },
    { id:'Equal',        label:'=',  sub:'+' },
    { id:'Backspace',    label:'Backspace', width:2 },
  ]},
  { keys: [
    { id:'Tab',          label:'Tab',     width:1.5 },
    { id:'KeyQ', label:'Q', alpha:true }, { id:'KeyW', label:'W', alpha:true },
    { id:'KeyE', label:'E', alpha:true }, { id:'KeyR', label:'R', alpha:true },
    { id:'KeyT', label:'T', alpha:true }, { id:'KeyY', label:'Y', alpha:true },
    { id:'KeyU', label:'U', alpha:true }, { id:'KeyI', label:'I', alpha:true },
    { id:'KeyO', label:'O', alpha:true }, { id:'KeyP', label:'P', alpha:true },
    { id:'BracketLeft',  label:'[', sub:'{' },
    { id:'BracketRight', label:']', sub:'}' },
    { id:'Backslash',    label:'\\', sub:'|', width:1.5 },
  ]},
  { keys: [
    { id:'CapsLock',     label:'Caps Lock', width:1.75 },
    { id:'KeyA', label:'A', alpha:true }, { id:'KeyS', label:'S', alpha:true },
    { id:'KeyD', label:'D', alpha:true }, { id:'KeyF', label:'F', alpha:true },
    { id:'KeyG', label:'G', alpha:true }, { id:'KeyH', label:'H', alpha:true },
    { id:'KeyJ', label:'J', alpha:true }, { id:'KeyK', label:'K', alpha:true },
    { id:'KeyL', label:'L', alpha:true },
    { id:'Semicolon',    label:';', sub:':' },
    { id:'Quote',        label:"'", sub:'"' },
    { id:'Enter',        label:'Enter', width:2.25 },
  ]},
  { keys: [
    { id:'ShiftLeft',    label:'Shift', width:2.25 },
    { id:'KeyZ', label:'Z', alpha:true }, { id:'KeyX', label:'X', alpha:true },
    { id:'KeyC', label:'C', alpha:true }, { id:'KeyV', label:'V', alpha:true },
    { id:'KeyB', label:'B', alpha:true }, { id:'KeyN', label:'N', alpha:true },
    { id:'KeyM', label:'M', alpha:true },
    { id:'Comma',        label:',', sub:'<' },
    { id:'Period',       label:'.', sub:'>' },
    { id:'Slash',        label:'/', sub:'?' },
    { id:'ShiftRight',   label:'Shift', width:2.75 },
  ]},
  { keys: [
    { id:'ControlLeft',  label:'Ctrl', width:1.25 },
    { id:'MetaLeft',     label:'⊞',   width:1.25 },
    { id:'AltLeft',      label:'Alt',  width:1.25 },
    { id:'Space',        label:'',     width:6.25 },
    { id:'AltRight',     label:'Alt',  width:1.25 },
    { id:'MetaRight',    label:'⊞',   width:1.25 },
    { id:'ContextMenu',  label:'☰',   width:1.25 },
    { id:'ControlRight', label:'Ctrl', width:1.25 },
  ]},
];

const NAV_ROWS = [
  { fn: true, keys: [
    { id:'PrintScreen', label:'PrtSc' },
    { id:'ScrollLock',  label:'ScrLk' },
    { id:'Pause',       label:'Pause' },
  ]},
  { keys: [
    { id:'Insert',   label:'Ins'  },
    { id:'Home',     label:'Home' },
    { id:'PageUp',   label:'PgUp' },
  ]},
  { keys: [
    { id:'Delete',   label:'Del'  },
    { id:'End',      label:'End'  },
    { id:'PageDown', label:'PgDn' },
  ]},
  { spacer: true },
  { keys: [
    { type:'gap', width:1 },
    { id:'ArrowUp',   label:'↑' },
    { type:'gap', width:1 },
  ]},
  { keys: [
    { id:'ArrowLeft',  label:'←' },
    { id:'ArrowDown',  label:'↓' },
    { id:'ArrowRight', label:'→' },
  ]},
];

// Numpad uses CSS Grid with explicit column/row placement.
// col/row are 1-based. w/h are span counts.
const NUMPAD_KEYS = [
  { id:'NumLock',        label:'Num\nLk',     col:1, row:1, w:1, h:1 },
  { id:'NumpadDivide',   label:'/',            col:2, row:1, w:1, h:1 },
  { id:'NumpadMultiply', label:'×',            col:3, row:1, w:1, h:1 },
  { id:'NumpadSubtract', label:'−',            col:4, row:1, w:1, h:1 },
  { id:'Numpad7',        label:'7', sub:'Hm',  col:1, row:2, w:1, h:1 },
  { id:'Numpad8',        label:'8', sub:'↑',   col:2, row:2, w:1, h:1 },
  { id:'Numpad9',        label:'9', sub:'Pu',  col:3, row:2, w:1, h:1 },
  { id:'NumpadAdd',      label:'+',            col:4, row:2, w:1, h:2 },
  { id:'Numpad4',        label:'4', sub:'←',   col:1, row:3, w:1, h:1 },
  { id:'Numpad5',        label:'5', sub:'·',   col:2, row:3, w:1, h:1 },
  { id:'Numpad6',        label:'6', sub:'→',   col:3, row:3, w:1, h:1 },
  { id:'Numpad1',        label:'1', sub:'En',  col:1, row:4, w:1, h:1 },
  { id:'Numpad2',        label:'2', sub:'↓',   col:2, row:4, w:1, h:1 },
  { id:'Numpad3',        label:'3', sub:'Pd',  col:3, row:4, w:1, h:1 },
  { id:'NumpadEnter',    label:'Enter',         col:4, row:4, w:1, h:2 },
  { id:'Numpad0',        label:'0', sub:'Ins',  col:1, row:5, w:2, h:1 },
  { id:'NumpadDecimal',  label:'.', sub:'Del',  col:3, row:5, w:1, h:1 },
];

/* ── App state ────────────────────────────────────────────────── */
const state = { hotkeys: {} };
let activeKeyId = null;

/* ── Helpers ──────────────────────────────────────────────────── */
const u = (n = 1) => UNIT * n + GAP * (n - 1);

function findKeyDef(id) {
  for (const row of MAIN_ROWS) {
    const k = row.keys.find(k => k.id === id);
    if (k) return k;
  }
  for (const row of NAV_ROWS) {
    if (row.spacer) continue;
    const k = row.keys.find(k => k.id === id);
    if (k) return k;
  }
  return NUMPAD_KEYS.find(k => k.id === id) || null;
}

/* ── Key element factory ──────────────────────────────────────── */
function makeKey(key, gridManaged = false) {
  const el = document.createElement('button');
  el.className = 'key';
  el.dataset.id = key.id;
  el.tabIndex = 0;
  if (key.alpha) el.dataset.alpha = '';

  if (!gridManaged) {
    el.style.width = u(key.width || 1) + 'px';
  }

  el.addEventListener('click', () => openPopover(key.id));
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopover(key.id); }});

  refreshKeyEl(el, key);
  return el;
}

function refreshKeyEl(el, key) {
  const hotkey = state.hotkeys[key.id];
  el.innerHTML = '';

  if (hotkey) {
    el.classList.add('has-hotkey');
    const cat = CATEGORIES.find(c => c.id === hotkey.category);
    const color = cat ? cat.color : '#4a4f6a';
    el.style.background = color;
    el.style.setProperty('box-shadow', `0 3px 0 color-mix(in srgb, ${color} 40%, black), 0 1px 2px rgba(0,0,0,0.5)`);

    const wrap = document.createElement('div');
    wrap.className = 'key-hotkey';

    if (hotkey.modifiers?.length) {
      const mods = document.createElement('div');
      mods.className = 'key-mods';
      hotkey.modifiers.forEach(m => {
        const pill = document.createElement('span');
        pill.className = 'key-mod-pill';
        pill.textContent = m;
        mods.appendChild(pill);
      });
      wrap.appendChild(mods);
    }

    const lbl = document.createElement('span');
    lbl.className = 'key-action';
    lbl.textContent = hotkey.label;
    wrap.appendChild(lbl);
    el.appendChild(wrap);

  } else {
    el.classList.remove('has-hotkey');
    el.style.background = '';
    el.style.removeProperty('box-shadow');

    const inner = document.createElement('div');
    inner.className = 'key-inner';

    if (key.sub) {
      const sub = document.createElement('span');
      sub.className = 'key-sub';
      sub.textContent = key.sub;
      inner.appendChild(sub);
    }

    const primary = document.createElement('span');
    primary.className = 'key-primary';
    primary.textContent = key.label || '';
    inner.appendChild(primary);
    el.appendChild(inner);
  }
}

/* ── Rendering ────────────────────────────────────────────────── */
function renderRows(rows, container) {
  rows.forEach(row => {
    if (row.spacer) {
      const sp = document.createElement('div');
      sp.style.height = UNIT + 'px';
      container.appendChild(sp);
      return;
    }

    const rowEl = document.createElement('div');
    rowEl.className = 'key-row' + (row.fn ? ' fn-row' : '');

    row.keys.forEach(key => {
      if (key.type === 'gap') {
        const gap = document.createElement('div');
        gap.className = 'key-gap';
        gap.style.width = u(key.width) + 'px';
        if (row.fn) gap.style.height = FN_H + 'px';
        rowEl.appendChild(gap);
      } else {
        const el = makeKey(key);
        if (row.fn) el.style.height = FN_H + 'px';
        rowEl.appendChild(el);
      }
    });

    container.appendChild(rowEl);
  });
}

function renderNumpad(container) {
  const grid = document.createElement('div');
  grid.className = 'numpad-grid';

  NUMPAD_KEYS.forEach(key => {
    const el = makeKey(key, true);
    el.style.gridColumn = `${key.col} / span ${key.w}`;
    el.style.gridRow    = `${key.row} / span ${key.h}`;
    grid.appendChild(el);
  });

  container.appendChild(grid);
}

function renderKeyboard() {
  const kb = document.getElementById('keyboard');
  kb.innerHTML = '';

  const body = document.createElement('div');
  body.className = 'keyboard-body';

  // Main block
  const mainBlock = document.createElement('div');
  mainBlock.className = 'key-block';
  renderRows(MAIN_ROWS, mainBlock);
  body.appendChild(mainBlock);

  // Nav cluster
  const navBlock = document.createElement('div');
  navBlock.className = 'key-block';
  renderRows(NAV_ROWS, navBlock);
  body.appendChild(navBlock);

  // Numpad — add a top spacer to align with the fn row + gap
  const numBlock = document.createElement('div');
  numBlock.className = 'key-block';
  const spacer = document.createElement('div');
  spacer.style.height = FN_H + 'px';
  numBlock.appendChild(spacer);
  renderNumpad(numBlock);
  body.appendChild(numBlock);

  kb.appendChild(body);
}

function refreshKey(keyId) {
  const el = document.querySelector(`.key[data-id="${keyId}"]`);
  if (!el) return;
  const def = findKeyDef(keyId);
  if (def) refreshKeyEl(el, def);
}

/* ── Legend ───────────────────────────────────────────────────── */
function renderLegend() {
  const list = document.getElementById('category-list');
  list.innerHTML = '';

  const counts = {};
  Object.values(state.hotkeys).forEach(hk => {
    if (hk.category) counts[hk.category] = (counts[hk.category] || 0) + 1;
  });

  CATEGORIES.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = 'cat-chip';
    chip.innerHTML = `
      <span class="cat-swatch" style="background:${cat.color}"></span>
      <span>${cat.name}</span>
      ${counts[cat.id] ? `<span class="cat-count">${counts[cat.id]}</span>` : ''}
    `;
    list.appendChild(chip);
  });

  const count = Object.keys(state.hotkeys).length;
  document.getElementById('stat-assigned').textContent =
    count === 1 ? '1 key assigned' : `${count} keys assigned`;
}

/* ── Category select ──────────────────────────────────────────── */
function populateCategorySelect() {
  const sel = document.getElementById('hotkey-category');
  sel.innerHTML = '<option value="">— No category —</option>';
  CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
}

/* ── Popover ──────────────────────────────────────────────────── */
function openPopover(keyId) {
  activeKeyId = keyId;
  const def = findKeyDef(keyId);
  const label = def?.label || keyId;

  document.getElementById('popover-key-badge').textContent = label;
  document.getElementById('popover-title').textContent = label;

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

  document.getElementById('popover').classList.remove('hidden');
  document.getElementById('popover-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('hotkey-label').focus(), 30);
}

function closePopover() {
  activeKeyId = null;
  document.getElementById('popover').classList.add('hidden');
  document.getElementById('popover-overlay').classList.add('hidden');
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

  const modifiers = [...document.querySelectorAll('.mod-chip input:checked')].map(cb => cb.value);

  state.hotkeys[activeKeyId] = {
    label,
    description: document.getElementById('hotkey-desc').value.trim(),
    category:    document.getElementById('hotkey-category').value,
    modifiers,
  };

  refreshKey(activeKeyId);
  renderLegend();
  saveToStorage();
  closePopover();
}

function clearHotkey() {
  if (!activeKeyId) return;
  delete state.hotkeys[activeKeyId];
  refreshKey(activeKeyId);
  renderLegend();
  saveToStorage();
  closePopover();
}

/* ── Storage ──────────────────────────────────────────────────── */
function saveToStorage() {
  try {
    localStorage.setItem('hotkeyMapper', JSON.stringify({
      hotkeys: state.hotkeys,
      mapName: document.getElementById('map-name').value,
    }));
  } catch (_) {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('hotkeyMapper');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.hotkeys) state.hotkeys = data.hotkeys;
    if (data.mapName) document.getElementById('map-name').value = data.mapName;
  } catch (_) {}
}

/* ── Export / Import ──────────────────────────────────────────── */
function exportMap() {
  const name = document.getElementById('map-name').value || 'hotkey-map';
  const data = { version: 1, name, hotkeys: state.hotkeys };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = name.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importMap(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.hotkeys) throw new Error();
      state.hotkeys = data.hotkeys;
      if (data.name) document.getElementById('map-name').value = data.name;
      renderKeyboard();
      renderLegend();
      saveToStorage();
    } catch (_) {
      alert('Invalid file. Please import a Hotkey Mapper JSON file.');
    }
  };
  reader.readAsText(file);
}

/* ── Events ───────────────────────────────────────────────────── */
function initEvents() {
  document.getElementById('popover-close').addEventListener('click', closePopover);
  document.getElementById('popover-overlay').addEventListener('click', closePopover);

  document.querySelectorAll('.mod-chip input').forEach(cb => {
    cb.addEventListener('change', () => cb.closest('.mod-chip').classList.toggle('active', cb.checked));
  });

  document.getElementById('btn-save-hotkey').addEventListener('click', saveHotkey);
  document.getElementById('btn-clear-hotkey').addEventListener('click', clearHotkey);

  document.getElementById('hotkey-label').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveHotkey();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activeKeyId) closePopover();
  });

  document.getElementById('map-name').addEventListener('input', saveToStorage);

  document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (!Object.keys(state.hotkeys).length) return;
    if (confirm('Clear all assigned hotkeys from this map?')) {
      state.hotkeys = {};
      renderKeyboard();
      renderLegend();
      saveToStorage();
    }
  });

  document.getElementById('btn-export').addEventListener('click', exportMap);

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });

  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files[0]) importMap(e.target.files[0]);
    e.target.value = '';
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
function init() {
  loadFromStorage();
  renderKeyboard();
  populateCategorySelect();
  renderLegend();
  initEvents();
}

document.addEventListener('DOMContentLoaded', init);
