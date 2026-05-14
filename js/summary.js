import { state, saveToStorage } from './state.js';
import {
  SUMMARY_COLS, SUMMARY_CAT_WRAP,
  MAIN_ROWS, NAV_ROWS, NUMPAD_KEYS,
  ZSA_IDS, ZSA_KEYBOARDS,
} from './constants.js';
import {
  findKeyDef, displayMod, getKeyLabel,
  setHoverHighlight, clearHoverHighlight,
  renderKeyboard,
} from './keyboard.js';

/* ── Callbacks injected by app.js to avoid circular imports ───── */
let _openPopover          = () => {};
let _populateCategorySelect = () => {};
let _renderLegend         = () => {};

export function setSummaryCallbacks({ openPopover, populateCategorySelect, renderLegend }) {
  if (openPopover)           _openPopover           = openPopover;
  if (populateCategorySelect) _populateCategorySelect = populateCategorySelect;
  if (renderLegend)          _renderLegend          = renderLegend;
}

/* ── Category drag state ──────────────────────────────────────── */
let _catDragState  = null;
let _dragItemId    = null;
let _dragItemCatId = null;

/* ── Summary column init ──────────────────────────────────────── */
export function initSummaryCols() {
  if (!state.summaryCols || state.summaryCols.length !== SUMMARY_COLS) {
    const itemCounts = {};
    Object.values(state.hotkeys).forEach(hk => {
      if (hk.category) itemCounts[hk.category] = (itemCounts[hk.category] || 0) + 1;
    });
    const sorted = [...state.categories].sort((a, b) => (itemCounts[b.id] || 0) - (itemCounts[a.id] || 0));
    const colTotals = Array(SUMMARY_COLS).fill(0);
    state.summaryCols = Array.from({ length: SUMMARY_COLS }, () => []);
    sorted.forEach(cat => {
      const minCol = colTotals.indexOf(Math.min(...colTotals));
      state.summaryCols[minCol].push(cat.id);
      colTotals[minCol] += (itemCounts[cat.id] || 0);
    });
  }
  const present = new Set(state.summaryCols.flat());
  state.categories.forEach(cat => {
    if (!present.has(cat.id)) {
      const col = state.summaryCols.reduce((mi, c, i, a) => c.length < a[mi].length ? i : mi, 0);
      state.summaryCols[col].push(cat.id);
    }
  });
}

/* ── Drag indicator helpers ───────────────────────────────────── */
export function clearDragIndicators() {
  document.querySelectorAll('.drop-before, .drop-after').forEach(el =>
    el.classList.remove('drop-before', 'drop-after'));
  document.querySelectorAll('.summary-col.drag-over').forEach(el =>
    el.classList.remove('drag-over'));
}

export function clearItemDragIndicators() {
  document.querySelectorAll('.item-drop-before, .item-drop-after').forEach(el =>
    el.classList.remove('item-drop-before', 'item-drop-after'));
  document.querySelectorAll('.items-drag-target').forEach(el =>
    el.classList.remove('items-drag-target'));
}

/* ── Category drag (pointer events) ──────────────────────────── */
export function startCatDrag(catId, groupEl, e, clickEl) {
  const hdr = groupEl.querySelector('.summary-group-header');
  const ghostEl = hdr.cloneNode(true);
  ghostEl.className = 'cat-drag-ghost';
  ghostEl.style.width = groupEl.getBoundingClientRect().width + 'px';
  const catColor = groupEl.style.getPropertyValue('--cat-color');
  if (catColor) ghostEl.style.setProperty('--cat-color', catColor);
  document.body.appendChild(ghostEl);

  const rect = (clickEl || groupEl).getBoundingClientRect();
  _catDragState = { catId, groupEl, ghostEl,
    offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
    targetGroupEl: null, targetBefore: false, targetColEl: null };
  document.querySelectorAll(`.summary-group[data-cat-id="${catId}"]`).forEach(el => el.classList.add('dragging'));

  document.addEventListener('pointermove',   onCatDragMove);
  document.addEventListener('pointerup',     onCatDragEnd);
  document.addEventListener('pointercancel', onCatDragEnd);
  document.addEventListener('keydown',       onCatDragKeydown);
}

function onCatDragMove(e) {
  if (!_catDragState) return;
  const { ghostEl } = _catDragState;

  ghostEl.style.left = (e.clientX - _catDragState.offsetX) + 'px';
  ghostEl.style.top  = (e.clientY - _catDragState.offsetY) + 'px';

  ghostEl.style.display = 'none';
  const below = document.elementFromPoint(e.clientX, e.clientY);
  ghostEl.style.display = '';

  clearDragIndicators();
  _catDragState.targetGroupEl = null;
  _catDragState.targetColEl   = null;

  const targetHeader = below?.closest('.summary-group-header, .summary-group-header-cont');
  const targetGroup  = targetHeader?.closest('.summary-group[data-cat-id]');
  const isCont       = targetGroup?.classList.contains('summary-group-cont');
  const allowTarget  = targetGroup
    && targetGroup.dataset.catId !== _catDragState.catId
    && (!isCont || state.summarySettings.overflow);

  if (allowTarget) {
    const r = targetHeader.getBoundingClientRect();
    const before = e.clientY < r.top + r.height / 2;
    targetGroup.classList.add(before ? 'drop-before' : 'drop-after');
    _catDragState.targetGroupEl = targetGroup;
    _catDragState.targetBefore  = before;
  } else {
    const targetCol = below?.closest('.summary-col');
    if (targetCol) {
      const colGroups = [...targetCol.querySelectorAll('.summary-group[data-cat-id]:not(.summary-group-cont)')]
        .filter(g => g.dataset.catId !== _catDragState.catId);
      const lastGroup = colGroups[colGroups.length - 1];
      if (lastGroup && e.clientY > lastGroup.getBoundingClientRect().bottom) {
        lastGroup.classList.add('drop-after');
        _catDragState.targetGroupEl = lastGroup;
        _catDragState.targetBefore  = false;
      } else {
        targetCol.classList.add('drag-over');
        _catDragState.targetColEl = targetCol;
      }
    }
    if (state.summarySettings.overflow && !_catDragState.targetGroupEl) {
      let nearest = null, minDist = Infinity;
      document.querySelectorAll('.summary-group[data-cat-id]').forEach(g => {
        if (g.dataset.catId === _catDragState.catId) return;
        const r = g.getBoundingClientRect();
        const nearX = Math.max(r.left, Math.min(e.clientX, r.right));
        const nearY = Math.max(r.top, Math.min(e.clientY, r.bottom));
        const dist = Math.hypot(e.clientX - nearX, e.clientY - nearY);
        if (dist < minDist) { minDist = dist; nearest = g; }
      });
      if (nearest) {
        const r = nearest.getBoundingClientRect();
        const before = e.clientY < r.top + r.height / 2;
        nearest.classList.add(before ? 'drop-before' : 'drop-after');
        _catDragState.targetGroupEl = nearest;
        _catDragState.targetBefore  = before;
      }
    }
  }
}

export function snapshotLayoutFromDOM() {
  const cols = document.querySelectorAll('.summary-col');
  if (!cols.length) return;
  state.summaryCols = [...cols].map(col =>
    [...col.querySelectorAll('.summary-group[data-cat-id]:not(.summary-group-cont)')].map(g => g.dataset.catId)
  );
}

function onCatDragEnd() {
  if (!_catDragState) return;
  const { groupEl, ghostEl, targetGroupEl, targetBefore, targetColEl } = _catDragState;

  if (targetGroupEl || targetColEl) {
    if (state.summarySettings.overflow) {
      if (targetGroupEl) {
        moveCategoryInOverflowOrder(_catDragState.catId, targetGroupEl.dataset.catId, targetBefore);
      } else if (targetColEl) {
        const lastGroup = [...targetColEl.querySelectorAll('.summary-group[data-cat-id]:not(.summary-group-cont)')].pop();
        if (lastGroup) moveCategoryInOverflowOrder(_catDragState.catId, lastGroup.dataset.catId, false);
      }
    } else {
      if (targetGroupEl) {
        moveCategoryInLayout(_catDragState.catId, targetGroupEl.dataset.catId, targetBefore);
      } else {
        const colIdx = parseInt(targetColEl.dataset.col, 10);
        if (!isNaN(colIdx)) moveCategoryToColumn(_catDragState.catId, colIdx);
      }
    }
  }

  ghostEl.remove();
  document.querySelectorAll(`.summary-group[data-cat-id="${_catDragState.catId}"]`).forEach(el => el.classList.remove('dragging'));
  clearDragIndicators();
  _catDragState = null;

  document.removeEventListener('pointermove',   onCatDragMove);
  document.removeEventListener('pointerup',     onCatDragEnd);
  document.removeEventListener('pointercancel', onCatDragEnd);
  document.removeEventListener('keydown',       onCatDragKeydown);
}

function onCatDragKeydown(e) {
  if (e.key !== 'Escape' || !_catDragState) return;
  const { catId, ghostEl } = _catDragState;
  ghostEl.remove();
  document.querySelectorAll(`.summary-group[data-cat-id="${catId}"]`).forEach(el => el.classList.remove('dragging'));
  clearDragIndicators();
  _catDragState = null;
  document.removeEventListener('pointermove',   onCatDragMove);
  document.removeEventListener('pointerup',     onCatDragEnd);
  document.removeEventListener('pointercancel', onCatDragEnd);
  document.removeEventListener('keydown',       onCatDragKeydown);
}

/* ── Item order normalization ─────────────────────────────────── */
export function normalizeItemOrder() {
  state.catItemOrder = state.catItemOrder || {};
  const catMap = {};
  Object.entries(state.hotkeys).forEach(([keyId, hk]) => {
    const cid = hk.category;
    if (cid) (catMap[cid] = catMap[cid] || []).push(keyId);
  });
  Object.keys(catMap).forEach(catId => {
    const existing = state.catItemOrder[catId] || [];
    const current  = new Set(catMap[catId]);
    const kept     = existing.filter(id => current.has(id));
    const added    = catMap[catId].filter(id => !kept.includes(id));
    state.catItemOrder[catId] = [...kept, ...added];
  });
  Object.keys(state.catItemOrder).forEach(catId => {
    if (!catMap[catId]) delete state.catItemOrder[catId];
  });
}

/* ── Category / item move operations ─────────────────────────── */
export function moveItemInSummary(keyId, srcCatId, tgtCatId, targetKeyId, before) {
  if (srcCatId !== tgtCatId) state.hotkeys[keyId].category = tgtCatId || null;
  if (srcCatId && state.catItemOrder[srcCatId]) {
    state.catItemOrder[srcCatId] = state.catItemOrder[srcCatId].filter(id => id !== keyId);
  }
  if (tgtCatId) {
    if (!state.catItemOrder[tgtCatId]) state.catItemOrder[tgtCatId] = [];
    const arr = state.catItemOrder[tgtCatId].filter(id => id !== keyId);
    if (targetKeyId && arr.includes(targetKeyId)) {
      const idx = arr.indexOf(targetKeyId);
      arr.splice(before ? idx : idx + 1, 0, keyId);
    } else {
      arr.push(keyId);
    }
    state.catItemOrder[tgtCatId] = arr;
  }
  saveToStorage();
  renderKeyboard();
  _renderLegend();
  renderSummary();
}

export function moveCategoryInOverflowOrder(srcId, targetId, before) {
  const order    = [...(state.summarySettings.catOrder || [])];
  const filtered = order.filter(id => id !== srcId);
  const tgtIdx   = filtered.indexOf(targetId);
  if (tgtIdx === -1) {
    filtered.push(srcId);
  } else {
    filtered.splice(before ? tgtIdx : tgtIdx + 1, 0, srcId);
  }
  state.summarySettings.catOrder = filtered;
  saveToStorage();
  renderSummary();
}

export function moveCategoryInLayout(srcId, targetId, before) {
  state.summaryCols.forEach(col => {
    const i = col.indexOf(srcId);
    if (i !== -1) col.splice(i, 1);
  });
  let tgtCol = -1, tgtIdx = -1;
  state.summaryCols.forEach((col, ci) => {
    const i = col.indexOf(targetId);
    if (i !== -1) { tgtCol = ci; tgtIdx = i; }
  });
  if (tgtCol === -1) return;
  state.summaryCols[tgtCol].splice(before ? tgtIdx : tgtIdx + 1, 0, srcId);
  saveToStorage();
  renderSummary();
}

export function moveCategoryToColumn(srcId, colIdx) {
  state.summaryCols.forEach(col => {
    const i = col.indexOf(srcId);
    if (i !== -1) col.splice(i, 1);
  });
  state.summaryCols[colIdx].push(srcId);
  saveToStorage();
  renderSummary();
}

/* ── Hotkey ordering ──────────────────────────────────────────── */
export function getOrderedHotkeys() {
  const result = [];
  const seen   = new Set();
  const add    = key => {
    if (!key || key.type === 'gap' || !key.id || seen.has(key.id) || !state.hotkeys[key.id]) return;
    seen.add(key.id);
    result.push({ keyId: key.id, hk: state.hotkeys[key.id], def: findKeyDef(key.id) });
  };
  if (ZSA_IDS.has(state.layout)) {
    const kb = ZSA_KEYBOARDS[state.layout];
    kb.halves.forEach(half => {
      half.columns.forEach(col => col.keys.forEach(add));
      half.thumbs?.forEach(add);
    });
  } else {
    MAIN_ROWS.forEach(row => row.keys && row.keys.forEach(add));
    NAV_ROWS.forEach(row => row.keys && row.keys.forEach(add));
    NUMPAD_KEYS.forEach(add);
  }
  return result;
}

/* ── Summary item element ─────────────────────────────────────── */
export function makeSummaryItem({ hk, def, keyId }) {
  const mods     = hk.modifiers || [];
  const keyLabel = def ? getKeyLabel(def) : keyId;

  const item = document.createElement('div');
  item.className = 'summary-item';
  item.dataset.keyId = keyId;
  item.draggable = true;
  item.addEventListener('mouseenter', () => setHoverHighlight(keyId));
  item.addEventListener('mouseleave', clearHoverHighlight);
  item.addEventListener('click', () => {
    _populateCategorySelect();
    _openPopover(keyId);
  });

  item.addEventListener('dragstart', e => {
    e.stopPropagation();
    _dragItemId    = keyId;
    _dragItemCatId = hk.category || null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', keyId);
    setTimeout(() => item.classList.add('item-dragging'), 0);
  });
  item.addEventListener('dragend', () => {
    _dragItemId    = null;
    _dragItemCatId = null;
    item.classList.remove('item-dragging');
    clearItemDragIndicators();
  });
  item.addEventListener('dragover', e => {
    e.preventDefault();
    if (!_dragItemId || _dragItemId === keyId) return;
    e.stopPropagation();
    clearItemDragIndicators();
    const before = e.clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2;
    item.classList.add(before ? 'item-drop-before' : 'item-drop-after');
  });
  item.addEventListener('drop', e => {
    if (!_dragItemId || _dragItemId === keyId) return;
    e.preventDefault();
    e.stopPropagation();
    clearItemDragIndicators();
    const before = e.clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2;
    moveItemInSummary(_dragItemId, _dragItemCatId, hk.category || null, keyId, before);
  });

  const grip = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  grip.setAttribute('class', 'summary-item-grip');
  grip.setAttribute('viewBox', '0 0 8 14');
  grip.setAttribute('width', '8');
  grip.setAttribute('height', '14');
  grip.innerHTML = '<circle cx="2" cy="2" r="1.2" fill="currentColor"/><circle cx="6" cy="2" r="1.2" fill="currentColor"/><circle cx="2" cy="7" r="1.2" fill="currentColor"/><circle cx="6" cy="7" r="1.2" fill="currentColor"/><circle cx="2" cy="12" r="1.2" fill="currentColor"/><circle cx="6" cy="12" r="1.2" fill="currentColor"/>';

  const modsCell = document.createElement('div');
  modsCell.className = 'summary-mods-cell';
  if (!mods.length) modsCell.hidden = true;
  mods.forEach(mod => {
    const chip = document.createElement('kbd');
    chip.className = 'summary-chip summary-chip-mod';
    chip.textContent = displayMod(mod);
    modsCell.appendChild(chip);
  });

  const keyCell = document.createElement('div');
  keyCell.className = 'summary-key-cell';
  const keyChip = document.createElement('kbd');
  keyChip.className = 'summary-chip';
  keyChip.textContent = keyLabel;
  keyCell.appendChild(keyChip);

  const info = document.createElement('div');
  info.className = 'summary-info';

  const lbl = document.createElement('span');
  lbl.className = 'summary-action';
  lbl.textContent = hk.label;
  info.appendChild(lbl);

  if (hk.description) {
    const desc = document.createElement('span');
    desc.className = 'summary-desc';
    desc.textContent = hk.description;
    info.appendChild(desc);
  }

  item.appendChild(grip);
  item.appendChild(modsCell);
  item.appendChild(keyCell);
  item.appendChild(info);
  return item;
}

/* ── Summary group elements ───────────────────────────────────── */
export function makeSummaryGroup(cat, items, totalCount) {
  const isCollapsed = state.collapsedCats.has(cat.id);
  if (totalCount === undefined) totalCount = items.length;
  const group = document.createElement('div');
  group.className = 'summary-group' + (isCollapsed ? ' collapsed' : '');
  group.dataset.catId = cat.id;
  group.style.setProperty('--cat-color', cat.color);

  group.addEventListener('dragover', e => {
    if (!_dragItemId) return;
    e.preventDefault();
    e.stopPropagation();
    clearItemDragIndicators();
    group.classList.add('items-drag-target');
  });
  group.addEventListener('dragleave', e => {
    if (!group.contains(e.relatedTarget)) group.classList.remove('items-drag-target');
  });
  group.addEventListener('drop', e => {
    if (!_dragItemId) return;
    e.preventDefault();
    e.stopPropagation();
    group.classList.remove('items-drag-target');
    if (_dragItemCatId !== cat.id) moveItemInSummary(_dragItemId, _dragItemCatId, cat.id, null, false);
  });

  const hdr = document.createElement('div');
  hdr.className = 'summary-group-header';

  const grip = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  grip.setAttribute('class', 'summary-grip');
  grip.setAttribute('viewBox', '0 0 8 14');
  grip.setAttribute('width', '8');
  grip.setAttribute('height', '14');
  grip.innerHTML = '<circle cx="2" cy="2" r="1.2" fill="currentColor"/><circle cx="6" cy="2" r="1.2" fill="currentColor"/><circle cx="2" cy="7" r="1.2" fill="currentColor"/><circle cx="6" cy="7" r="1.2" fill="currentColor"/><circle cx="2" cy="12" r="1.2" fill="currentColor"/><circle cx="6" cy="12" r="1.2" fill="currentColor"/>';
  hdr.appendChild(grip);

  hdr.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.summary-collapse-btn')) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const onPreMove = ev => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return;
      cleanup();
      startCatDrag(cat.id, group, e);
    };
    const cleanup = () => {
      document.removeEventListener('pointermove', onPreMove);
      document.removeEventListener('pointerup',   cleanup);
      document.removeEventListener('pointercancel', cleanup);
    };
    document.addEventListener('pointermove', onPreMove);
    document.addEventListener('pointerup',   cleanup);
    document.addEventListener('pointercancel', cleanup);
  });

  const swatch = document.createElement('span');
  swatch.className = 'summary-group-swatch';
  swatch.style.background = cat.color;
  hdr.appendChild(swatch);

  const name = document.createElement('span');
  name.className = 'summary-group-name';
  name.textContent = cat.name;
  hdr.appendChild(name);

  const count = document.createElement('span');
  count.className = 'summary-group-count';
  count.textContent = totalCount;
  hdr.appendChild(count);

  const chevron = document.createElement('button');
  chevron.className = 'summary-collapse-btn';
  chevron.setAttribute('aria-label', isCollapsed ? 'Expand category' : 'Collapse category');
  chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  chevron.addEventListener('click', e => {
    e.stopPropagation();
    if (state.collapsedCats.has(cat.id)) {
      state.collapsedCats.delete(cat.id);
      group.classList.remove('collapsed');
      chevron.setAttribute('aria-label', 'Collapse category');
    } else {
      state.collapsedCats.add(cat.id);
      group.classList.add('collapsed');
      chevron.setAttribute('aria-label', 'Expand category');
    }
    saveToStorage();
  });
  hdr.appendChild(chevron);

  group.appendChild(hdr);

  const itemsEl = document.createElement('div');
  itemsEl.className = 'summary-items';
  items.forEach(entry => itemsEl.appendChild(makeSummaryItem(entry)));
  group.appendChild(itemsEl);

  return group;
}

export function makeSummaryGroupContinuation(cat, items) {
  const group = document.createElement('div');
  group.className = 'summary-group summary-group-cont';
  group.dataset.catId = cat.id;
  group.style.setProperty('--cat-color', cat.color);

  const hdr = document.createElement('div');
  hdr.className = 'summary-group-header summary-group-header-cont';

  hdr.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const primaryEl = document.querySelector(`.summary-grid .summary-group[data-cat-id="${cat.id}"]:not(.summary-group-cont)`) || group;
    const onPreMove = ev => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return;
      cleanup();
      startCatDrag(cat.id, primaryEl, e, group);
    };
    const cleanup = () => {
      document.removeEventListener('pointermove', onPreMove);
      document.removeEventListener('pointerup',   cleanup);
      document.removeEventListener('pointercancel', cleanup);
    };
    document.addEventListener('pointermove', onPreMove);
    document.addEventListener('pointerup',   cleanup);
    document.addEventListener('pointercancel', cleanup);
  });

  const swatch = document.createElement('span');
  swatch.className = 'summary-group-swatch';
  swatch.style.background = cat.color;
  hdr.appendChild(swatch);

  const name = document.createElement('span');
  name.className = 'summary-group-name summary-group-name-cont';
  name.textContent = cat.name;
  hdr.appendChild(name);

  group.appendChild(hdr);

  const itemsEl = document.createElement('div');
  itemsEl.className = 'summary-items';
  items.forEach(entry => itemsEl.appendChild(makeSummaryItem(entry)));
  group.appendChild(itemsEl);

  return group;
}

/* ── Column layout engine ─────────────────────────────────────── */
export function computeColumnLayout(buckets, overflowAt) {
  const catOrder = state.summarySettings.catOrder || [];
  const orderMap = {};
  catOrder.forEach((id, i) => { orderMap[id] = i; });
  const hasOrder = catOrder.length > 0;

  const cats = state.categories
    .map(cat => ({ cat, items: buckets[cat.id] || [] }))
    .filter(x => x.items.length > 0)
    .sort((a, b) => {
      if (hasOrder) {
        const ia = orderMap[a.cat.id] ?? Infinity;
        const ib = orderMap[b.cat.id] ?? Infinity;
        return ia - ib;
      }
      return b.items.length - a.items.length;
    });

  const columns    = Array.from({ length: SUMMARY_COLS }, () => []);
  const colHeights = Array(SUMMARY_COLS).fill(0);

  function placeChunks(cat, items) {
    const chunks = [];
    let rem = [...items];
    while (rem.length > 0) chunks.push(rem.splice(0, overflowAt));
    if (chunks.length <= 1) {
      const minCol = colHeights.indexOf(Math.min(...colHeights));
      columns[minCol].push({ cat, items, isCont: false, totalCount: items.length });
      colHeights[minCol] += items.length;
    } else {
      const needed = Math.min(chunks.length, SUMMARY_COLS);
      let bestStart = 0, bestScore = Infinity;
      for (let i = 0; i <= SUMMARY_COLS - needed; i++) {
        const score = Math.max(...colHeights.slice(i, i + needed));
        if (score < bestScore) { bestScore = score; bestStart = i; }
      }
      chunks.forEach((chunk, j) => {
        const col = bestStart + j;
        columns[col].push({ cat, items: chunk, isCont: j > 0, totalCount: items.length });
        colHeights[col] += chunk.length;
      });
    }
  }

  if (hasOrder) {
    cats.forEach(({ cat, items }) => placeChunks(cat, items));
  } else {
    const small = [];
    cats.forEach(({ cat, items }) => {
      const chunks = [];
      let rem = [...items];
      while (rem.length > 0) chunks.push(rem.splice(0, overflowAt));
      if (chunks.length <= 1) { small.push({ cat, items }); return; }
      const needed = Math.min(chunks.length, SUMMARY_COLS);
      let bestStart = 0, bestScore = Infinity;
      for (let i = 0; i <= SUMMARY_COLS - needed; i++) {
        const score = Math.max(...colHeights.slice(i, i + needed));
        if (score < bestScore) { bestScore = score; bestStart = i; }
      }
      chunks.forEach((chunk, j) => {
        const col = bestStart + j;
        columns[col].push({ cat, items: chunk, isCont: j > 0, totalCount: items.length });
        colHeights[col] += chunk.length;
      });
    });
    small.forEach(({ cat, items }) => {
      const minCol = colHeights.indexOf(Math.min(...colHeights));
      columns[minCol].push({ cat, items, isCont: false, totalCount: items.length });
      colHeights[minCol] += items.length;
    });
  }

  return columns;
}

/* ── Render summary ───────────────────────────────────────────── */
export function renderSummary() {
  const container = document.getElementById('summary-grid');
  const empty     = document.getElementById('summary-empty');
  const entries   = getOrderedHotkeys();
  const search    = document.getElementById('summary-search');
  if (search) search.value = '';

  container.innerHTML = '';

  if (!entries.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  initSummaryCols();

  const buckets = {};
  const uncategorized = [];
  entries.forEach(entry => {
    const id = entry.hk.category;
    if (id) { (buckets[id] = buckets[id] || []).push(entry); }
    else     { uncategorized.push(entry); }
  });

  normalizeItemOrder();
  Object.keys(buckets).forEach(catId => {
    const order = state.catItemOrder[catId];
    if (!order?.length) return;
    const byId = {};
    buckets[catId].forEach(e => byId[e.keyId] = e);
    buckets[catId] = order.map(id => byId[id]).filter(Boolean);
  });

  const colsEl = document.createElement('div');
  colsEl.className = 'summary-columns';

  if (state.summarySettings.overflow) {
    if (!state.summarySettings.catOrder?.length) {
      state.summarySettings.catOrder = state.categories
        .filter(c => buckets[c.id]?.length)
        .sort((a, b) => (buckets[b.id]?.length || 0) - (buckets[a.id]?.length || 0))
        .map(c => c.id);
    }
    const columns = computeColumnLayout(buckets, state.summarySettings.overflowAt);
    columns.forEach((colGroups, colIdx) => {
      const colEl = document.createElement('div');
      colEl.className = 'summary-col';
      colEl.dataset.col = colIdx;
      colGroups.forEach(({ cat, items, isCont, totalCount }) => {
        colEl.appendChild(isCont ? makeSummaryGroupContinuation(cat, items) : makeSummaryGroup(cat, items, totalCount));
      });
      colsEl.appendChild(colEl);
    });
  } else {
    Array.from({ length: SUMMARY_COLS }, (_, i) => i).forEach(colIdx => {
      const colEl = document.createElement('div');
      colEl.className = 'summary-col';
      colEl.dataset.col = colIdx;
      state.summaryCols[colIdx].forEach(catId => {
        const items = buckets[catId];
        if (!items?.length) return;
        const cat = state.categories.find(c => c.id === catId);
        if (cat) colEl.appendChild(makeSummaryGroup(cat, items, items.length));
      });
      colsEl.appendChild(colEl);
    });
  }

  container.appendChild(colsEl);

  if (uncategorized.length) {
    const uGroup = document.createElement('div');
    uGroup.className = 'summary-group';
    const uHdr = document.createElement('div');
    uHdr.className = 'summary-group-header';
    const uName = document.createElement('span');
    uName.className = 'summary-group-name';
    uName.textContent = 'Uncategorized';
    uHdr.appendChild(uName);
    uGroup.appendChild(uHdr);
    const uItems = document.createElement('div');
    uItems.className = 'summary-items';
    uncategorized.forEach(entry => uItems.appendChild(makeSummaryItem(entry)));
    uGroup.appendChild(uItems);
    container.appendChild(uGroup);
  }
}

/* ── Summary search filter ────────────────────────────────────── */
export function filterSummary() {
  const q = document.getElementById('summary-search').value.trim().toLowerCase();
  document.querySelectorAll('.summary-group').forEach(group => {
    let anyVisible = false;
    group.querySelectorAll('.summary-item').forEach(item => {
      const label = item.querySelector('.summary-action')?.textContent.toLowerCase() || '';
      const desc  = item.querySelector('.summary-desc')?.textContent.toLowerCase()  || '';
      const match = !q || label.includes(q) || desc.includes(q);
      item.style.display = match ? '' : 'none';
      if (match) anyVisible = true;
    });
    group.style.display = anyVisible ? '' : 'none';
  });
}
