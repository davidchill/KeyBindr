import {
  UNIT, GAP, FN_H,
  MAIN_ROWS, NAV_ROWS, NUMPAD_KEYS,
  ZSA_KEYBOARDS, ZSA_IDS,
  KEY_MAPS, SPLIT_AFTER, SPLIT_GAP,
  MOD_MAP_MAC,
} from './constants.js';
import { state } from './state.js';

/* ── Callbacks injected by app.js to avoid circular imports ───── */
let _openPopover    = () => {};
let _reapplyFilter  = () => {};
let _applyHeatmap   = () => {};
let _isHeatmapActive = () => false;

export function setKeyboardCallbacks({ openPopover, reapplyFilter, applyHeatmap, isHeatmapActive }) {
  if (openPopover)     _openPopover     = openPopover;
  if (reapplyFilter)   _reapplyFilter   = reapplyFilter;
  if (applyHeatmap)    _applyHeatmap    = applyHeatmap;
  if (isHeatmapActive) _isHeatmapActive = isHeatmapActive;
}

/* ── Keyboard scaling state ───────────────────────────────────── */
let _kbNaturalW      = 0;
let _kbNaturalH      = 0;
let _kbScaleObserver = null;

/* ── Tooltip state ────────────────────────────────────────────── */
let _tooltipTarget = null;

/* ── Utilities ────────────────────────────────────────────────── */
export function displayMod(mod) {
  return state.platform === 'mac' ? (MOD_MAP_MAC[mod] ?? mod) : mod;
}

export function darkenHex(hex, ratio = 0.4) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * ratio)},${Math.round(g * ratio)},${Math.round(b * ratio)})`;
}

// Key width in pixels: n units wide
const u = (n = 1) => UNIT * n + GAP * (n - 1);

/* ── Key label / definition lookups ──────────────────────────── */
export function getKeyLabel(key) {
  const overrides = KEY_MAPS[state.keyMap];
  if (overrides && key.id in overrides) return overrides[key.id];
  return key.label || '';
}

export function findKeyDef(id) {
  for (const row of MAIN_ROWS) {
    const k = row.keys.find(k => k.id === id);
    if (k) return k;
  }
  for (const row of NAV_ROWS) {
    if (row.spacer) continue;
    const k = row.keys.find(k => k.id === id);
    if (k) return k;
  }
  const nk = NUMPAD_KEYS.find(k => k.id === id);
  if (nk) return nk;
  for (const kb of Object.values(ZSA_KEYBOARDS)) {
    for (const half of kb.halves) {
      for (const col of half.columns) {
        const k = col.keys.find(k => k.id === id);
        if (k) return k;
      }
      const tk = half.thumbs?.find(k => k.id === id);
      if (tk) return tk;
    }
  }
  return null;
}

/* ── Key element factory ──────────────────────────────────────── */
export function makeKey(key, gridManaged = false) {
  const el = document.createElement('button');
  el.className = 'key';
  el.dataset.id = key.id;
  el.tabIndex = 0;
  if (key.alpha) el.dataset.alpha = '';

  if (!gridManaged) {
    el.style.width = u(key.width || 1) + 'px';
  }

  el.addEventListener('click', () => _openPopover(key.id));
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _openPopover(key.id); }
  });
  el.addEventListener('mouseenter', () => { if (state.hotkeys[key.id]) setHoverHighlight(key.id); });
  el.addEventListener('mouseleave', clearHoverHighlight);

  refreshKeyEl(el, key);
  return el;
}

export function refreshKeyEl(el, key) {
  const hotkey = state.hotkeys[key.id];
  el.innerHTML = '';

  if (hotkey) {
    el.classList.add('has-hotkey');
    const cat = state.categories.find(c => c.id === hotkey.category);
    const color = cat ? cat.color : '#4a4f6a';
    el.style.background = color;
    el.style.setProperty('box-shadow', `0 3px 0 ${darkenHex(color)}, 0 1px 2px rgba(0,0,0,0.5)`);

    const wrap = document.createElement('div');
    wrap.className = 'key-hotkey';

    if (hotkey.modifiers?.length) {
      const active = new Set(hotkey.modifiers);
      [
        ['Ctrl',  'mod-tl'],
        ['Shift', 'mod-tr'],
        ['Alt',   'mod-bl'],
        ['Win',   'mod-br'],
      ].forEach(([mod, cls]) => {
        if (!active.has(mod)) return;
        const dot = document.createElement('span');
        dot.className = `key-mod-corner ${cls}`;
        el.appendChild(dot);
      });
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
    primary.textContent = getKeyLabel(key);
    inner.appendChild(primary);
    el.appendChild(inner);
  }
}

/* ── Row / numpad renderers ───────────────────────────────────── */
export function renderRows(rows, container, hideFn = false) {
  rows.forEach(row => {
    if (hideFn && row.fn) return;

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

        if (state.layout === 'split' && SPLIT_AFTER.has(key.id)) {
          const sg = document.createElement('div');
          sg.className = 'key-gap split-gap';
          sg.style.width  = SPLIT_GAP + 'px';
          sg.style.height = (row.fn ? FN_H : UNIT) + 'px';
          rowEl.appendChild(sg);
        }
      }
    });

    container.appendChild(rowEl);
  });
}

export function renderNumpad(container) {
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

/* ── ZSA keyboard renderer ────────────────────────────────────── */
export function renderZSAKeyboard(kbId) {
  const kb   = ZSA_KEYBOARDS[kbId];
  const kbEl = document.getElementById('keyboard');
  kbEl.style.paddingBottom = '';
  kbEl.classList.add('zsa-split-mode');
  document.querySelector('.keyboard-scroll').classList.add('zsa-split-mode');

  const wrap = document.createElement('div');
  wrap.className = 'zsa-halves';
  wrap.style.gap = kb.halfGap + 'px';

  kb.halves.forEach(half => {
    const halfEl = document.createElement('div');
    halfEl.className = 'zsa-half';

    const colsEl = document.createElement('div');
    colsEl.className = 'zsa-columns';

    half.columns.forEach(col => {
      const colEl = document.createElement('div');
      colEl.className = 'zsa-col';
      colEl.style.marginTop = col.stagger + 'px';
      col.keys.forEach(key => colEl.appendChild(makeKey(key)));
      colsEl.appendChild(colEl);
    });

    halfEl.appendChild(colsEl);

    if (half.thumbs?.length) {
      const thumbArea = document.createElement('div');
      thumbArea.className = 'zsa-thumb-area';

      const totalColW = half.columns.length * (UNIT + GAP) - GAP;
      const thumbW    = half.thumbCols  * (UNIT + GAP) - GAP;
      const offset    = half.side === 'left' ? totalColW - thumbW : 0;
      thumbArea.style.marginLeft = offset + 'px';

      if (half.thumbLayout === 'moonlander') {
        const flex = document.createElement('div');
        flex.className = 'zsa-mndr-thumb';

        const mainKeyEl = makeKey(half.thumbs[0]);
        if (half.side === 'right') mainKeyEl.style.marginLeft = 'auto';
        flex.appendChild(mainKeyEl);

        const row = document.createElement('div');
        row.className = 'zsa-mndr-row';
        half.thumbs.slice(1).forEach(key => row.appendChild(makeKey(key)));
        flex.appendChild(row);

        thumbArea.appendChild(flex);

        thumbArea.style.marginTop  = '75px';
        thumbArea.style.marginLeft = (half.side === 'left' ? offset + 70 : -70) + 'px';

        const angle  = half.side === 'left' ? 40 : -40;
        const origin = half.side === 'left' ? 'top right' : 'top left';
        thumbArea.style.transform       = `rotate(${angle}deg)`;
        thumbArea.style.transformOrigin = origin;
      } else {
        const thumbGrid = document.createElement('div');
        thumbGrid.className = 'zsa-thumb-grid';
        if (half.thumbCols > 1) {
          thumbGrid.style.gridTemplateColumns = `repeat(${half.thumbCols}, ${u(1)}px)`;
        }
        half.thumbs.forEach(key => thumbGrid.appendChild(makeKey(key)));
        thumbArea.appendChild(thumbGrid);
      }

      halfEl.appendChild(thumbArea);
    }

    wrap.appendChild(halfEl);
  });

  document.getElementById('keyboard').appendChild(wrap);
}

export function renderKeyboard() {
  const kb = document.getElementById('keyboard');
  kb.innerHTML = '';
  kb.classList.remove('zsa-split-mode');
  document.querySelector('.keyboard-scroll').classList.remove('zsa-split-mode');

  if (ZSA_IDS.has(state.layout)) {
    renderZSAKeyboard(state.layout);
    _reapplyFilter();
    if (_isHeatmapActive()) _applyHeatmap();
    measureAndScaleKeyboard();
    return;
  }
  kb.style.paddingBottom = '';

  const hideFn     = state.layout === '60' || state.layout === 'split';
  const showNav    = state.layout === 'full' || state.layout === 'tkl';
  const showNumpad = state.layout === 'full';

  const body = document.createElement('div');
  body.className = 'keyboard-body';

  const mainBlock = document.createElement('div');
  mainBlock.className = 'key-block';
  renderRows(MAIN_ROWS, mainBlock, hideFn);
  body.appendChild(mainBlock);

  if (showNav) {
    const navBlock = document.createElement('div');
    navBlock.className = 'key-block';
    renderRows(NAV_ROWS, navBlock);
    body.appendChild(navBlock);
  }

  if (showNumpad) {
    const numBlock = document.createElement('div');
    numBlock.className = 'key-block';
    const spacer = document.createElement('div');
    spacer.style.height = FN_H + 'px';
    numBlock.appendChild(spacer);
    renderNumpad(numBlock);
    body.appendChild(numBlock);
  }

  kb.appendChild(body);
  _reapplyFilter();
  if (_isHeatmapActive()) _applyHeatmap();
  measureAndScaleKeyboard();
}

export function refreshKey(keyId) {
  const el = document.querySelector(`.key[data-id="${keyId}"]`);
  if (!el) return;
  const def = findKeyDef(keyId);
  if (def) refreshKeyEl(el, def);
}

/* ── Hover cross-highlight ────────────────────────────────────── */
export function setHoverHighlight(keyId) {
  clearHoverHighlight();
  document.querySelector(`.key[data-id="${keyId}"]`)?.classList.add('pair-highlight');
  document.querySelector(`.summary-item[data-key-id="${keyId}"]`)?.classList.add('pair-highlight');
  showKeyTooltip(keyId);
}

export function clearHoverHighlight() {
  document.querySelectorAll('.pair-highlight').forEach(el => el.classList.remove('pair-highlight'));
  hideKeyTooltip();
}

/* ── Category hover highlight ─────────────────────────────────── */
export function setCategoryHighlight(catId) {
  clearCategoryHighlight();
  const matchingKeyIds = new Set(
    Object.entries(state.hotkeys)
      .filter(([, hk]) => hk.category === catId)
      .map(([keyId]) => keyId)
  );
  document.getElementById('keyboard').classList.add('cat-dim');
  matchingKeyIds.forEach(keyId => {
    document.querySelector(`.key[data-id="${keyId}"]`)?.classList.add('cat-highlight');
  });
  document.querySelectorAll('.summary-group').forEach(g => {
    g.classList.add(g.dataset.catId === catId ? 'cat-highlight' : 'cat-dim');
  });
}

export function clearCategoryHighlight() {
  document.getElementById('keyboard')?.classList.remove('cat-dim');
  document.querySelectorAll('.cat-highlight, .summary-group.cat-dim')
    .forEach(el => el.classList.remove('cat-highlight', 'cat-dim'));
}

/* ── Key tooltip ──────────────────────────────────────────────── */
export function showKeyTooltip(keyId) {
  const hotkey = state.hotkeys[keyId];
  if (!hotkey) return;

  const tip   = document.getElementById('key-tooltip');
  const keyEl = document.querySelector(`.key[data-id="${keyId}"]`);
  if (!tip || !keyEl) return;

  tip.querySelector('.kt-label').textContent = hotkey.label;

  const modsEl = tip.querySelector('.kt-mods');
  modsEl.innerHTML = '';
  (hotkey.modifiers || []).forEach(m => {
    const pill = document.createElement('span');
    pill.className = 'kt-mod-pill';
    pill.textContent = displayMod(m);
    modsEl.appendChild(pill);
  });

  tip.querySelector('.kt-desc').textContent = hotkey.description || '';

  const catEl = tip.querySelector('.kt-cat');
  const cat = state.categories.find(c => c.id === hotkey.category);
  if (cat) {
    const swatch = document.createElement('span');
    swatch.className = 'kt-cat-swatch';
    swatch.style.background = cat.color;
    const label = document.createElement('span');
    label.textContent = cat.name;
    catEl.replaceChildren(swatch, label);
  } else {
    catEl.replaceChildren();
  }

  tip.hidden = false;
  _tooltipTarget = keyId;
  positionTooltip(tip, keyEl);
}

export function positionTooltip(tip, keyEl) {
  const rect = keyEl.getBoundingClientRect();
  const tipW = tip.offsetWidth || 180;
  const tipH = tip.offsetHeight || 80;
  const gap  = 8;

  let left = rect.left + rect.width / 2 - tipW / 2;
  let top  = rect.top - tipH - gap;

  if (top < 8) top = rect.bottom + gap;
  if (left < 8) left = 8;
  if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;

  tip.style.left = left + 'px';
  tip.style.top  = top + 'px';
}

export function hideKeyTooltip() {
  const tip = document.getElementById('key-tooltip');
  if (tip) tip.hidden = true;
  _tooltipTarget = null;
}

/* ── Keyboard scaling (ResizeObserver) ───────────────────────── */
export function applyKbScale() {
  const section = document.querySelector('.keyboard-section');
  const wrap    = document.querySelector('.keyboard-scale-wrap');
  const scroll  = document.querySelector('.keyboard-scroll');
  if (!section || !wrap || !scroll || !_kbNaturalW) return;

  const scale = Math.min(1, section.clientWidth / _kbNaturalW);

  if (scale < 1) {
    scroll.style.width           = _kbNaturalW + 'px';
    scroll.style.transform       = `scale(${scale})`;
    scroll.style.transformOrigin = 'top left';
    scroll.style.borderRadius    = Math.round(16 / scale) + 'px';
    wrap.style.width             = Math.floor(_kbNaturalW * scale) + 'px';
    wrap.style.height            = Math.round(_kbNaturalH * scale) + 'px';
    wrap.style.overflow          = 'hidden';
    wrap.style.flexShrink        = '0';
  } else {
    scroll.style.width           = '';
    scroll.style.transform       = '';
    scroll.style.transformOrigin = '';
    scroll.style.borderRadius    = '';
    wrap.style.width             = '';
    wrap.style.height            = '';
    wrap.style.overflow          = '';
    wrap.style.flexShrink        = '';
  }
}

export function measureAndScaleKeyboard() {
  const wrap   = document.querySelector('.keyboard-scale-wrap');
  const scroll = document.querySelector('.keyboard-scroll');
  if (!wrap || !scroll) return;

  scroll.style.width        = '';
  scroll.style.transform    = '';
  scroll.style.borderRadius = '';
  wrap.style.width          = '';
  wrap.style.height         = '';
  wrap.style.overflow       = '';
  wrap.style.flexShrink     = '';

  _kbNaturalW = scroll.offsetWidth;
  _kbNaturalH = scroll.offsetHeight;

  applyKbScale();
}

export function initKeyboardScale() {
  if (_kbScaleObserver) return;
  const section = document.querySelector('.keyboard-section');
  if (!section) return;
  _kbScaleObserver = new ResizeObserver(applyKbScale);
  _kbScaleObserver.observe(section);
}
