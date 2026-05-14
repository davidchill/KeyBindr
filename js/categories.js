import { state, saveToStorage } from './state.js';
import { DEFAULT_CATEGORIES } from './constants.js';
import {
  renderKeyboard,
  setCategoryHighlight, clearCategoryHighlight, darkenHex,
} from './keyboard.js';
import { renderSummary } from './summary.js';

/* ── Callback injected by app.js ──────────────────────────────── */
let _showConfirm = (msg, onConfirm) => { if (confirm(msg)) onConfirm(); };

export function setCategoriesCallbacks({ showConfirm }) {
  if (showConfirm) _showConfirm = showConfirm;
}

/* ── Active filter state ──────────────────────────────────────── */
let filterCat = null;

/* ── Simple accessor ──────────────────────────────────────────── */
export function allCategories() {
  return state.categories;
}

/* ── Legend active preview ────────────────────────────────────── */
export function renderLegendActivePreview() {
  const preview = document.getElementById('legend-active-preview');
  if (!preview) return;
  preview.innerHTML = '';
  if (!filterCat) return;
  const cat = state.categories.find(c => c.id === filterCat);
  if (!cat) return;
  const count = Object.values(state.hotkeys).filter(hk => hk.category === filterCat).length;
  const chip = document.createElement('div');
  chip.className = 'cat-chip cat-active';
  chip.dataset.catId = cat.id;
  chip.style.setProperty('--cat-color', cat.color);
  const swatch1 = document.createElement('span');
  swatch1.className = 'cat-swatch';
  swatch1.style.background = cat.color;
  const nameSpan1 = document.createElement('span');
  nameSpan1.textContent = cat.name;
  chip.append(swatch1, nameSpan1);
  if (count) {
    const countSpan = document.createElement('span');
    countSpan.className = 'cat-count';
    countSpan.textContent = count;
    chip.appendChild(countSpan);
  }
  chip.addEventListener('click', () => applyFilter(cat.id));
  preview.appendChild(chip);
}

/* ── Category filter ──────────────────────────────────────────── */
export function applyFilter(catId) {
  filterCat = filterCat === catId ? null : catId;
  reapplyFilter();
  document.querySelectorAll('.cat-chip').forEach(el => {
    el.classList.toggle('cat-active', el.dataset.catId === filterCat);
  });
  renderLegendActivePreview();
}

export function reapplyFilter() {
  if (filterCat) setCategoryHighlight(filterCat);
  else clearCategoryHighlight();
}

/* ── Legend rendering ─────────────────────────────────────────── */
export function renderLegend() {
  const list = document.getElementById('category-list');
  list.innerHTML = '';

  const counts = {};
  Object.values(state.hotkeys).forEach(hk => {
    if (hk.category) counts[hk.category] = (counts[hk.category] || 0) + 1;
  });

  [...state.categories].sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
    list.appendChild(buildCatChip(cat, counts[cat.id] || 0));
  });

  const count = Object.keys(state.hotkeys).length;
  const total = document.querySelectorAll('#keyboard .key').length;
  document.getElementById('stat-assigned').innerHTML =
    total ? `${count} / ${total}<span class="stat-suffix"> keys assigned</span>`
          : `${count}<span class="stat-suffix"> keys assigned</span>`;
  renderLegendActivePreview();
}

export function buildCatChip(cat, count) {
  const chip = document.createElement('div');
  chip.className = 'cat-chip';
  chip.dataset.catId = cat.id;
  chip.style.setProperty('--cat-color', cat.color);

  const swatch = document.createElement('span');
  swatch.className = 'cat-swatch';
  swatch.style.background = cat.color;

  const nameSpan = document.createElement('span');
  nameSpan.textContent = cat.name;

  chip.append(swatch, nameSpan);

  if (count) {
    const countSpan = document.createElement('span');
    countSpan.className = 'cat-count';
    countSpan.textContent = count;
    chip.appendChild(countSpan);
  }

  const editBtn = document.createElement('button');
  editBtn.className = 'cat-edit-btn';
  editBtn.title = 'Edit category';
  editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  editBtn.addEventListener('click', e => { e.stopPropagation(); startEditCategory(chip, cat); });
  chip.appendChild(editBtn);

  chip.addEventListener('click', () => {
    if (chip.classList.contains('cat-chip-editing')) return;
    applyFilter(cat.id);
  });
  chip.addEventListener('mouseenter', () => {
    if (!chip.classList.contains('cat-chip-editing')) setCategoryHighlight(cat.id);
  });
  chip.addEventListener('mouseleave', () => {
    if (filterCat) setCategoryHighlight(filterCat);
    else clearCategoryHighlight();
  });
  if (cat.id === filterCat) chip.classList.add('cat-active');

  return chip;
}

export function startEditCategory(chip, cat) {
  chip.classList.add('cat-chip-editing');
  chip.innerHTML = '';

  const colorIn = document.createElement('input');
  colorIn.type = 'color';
  colorIn.className = 'cat-edit-color';
  colorIn.value = cat.color;

  const nameIn = document.createElement('input');
  nameIn.type = 'text';
  nameIn.className = 'cat-edit-name';
  nameIn.value = cat.name;
  nameIn.maxLength = 30;
  nameIn.autocomplete = 'off';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary cat-save-btn';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'icon-btn';
  cancelBtn.textContent = '✕';
  cancelBtn.title = 'Cancel';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'cat-delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.title = 'Delete category';

  const doSave = () => {
    const newName = nameIn.value.trim();
    if (!newName) { nameIn.focus(); return; }
    const c = state.categories.find(c => c.id === cat.id);
    if (c) { c.name = newName; c.color = colorIn.value; }
    populateCategorySelect();
    renderKeyboard();
    renderLegend();
    renderSummary();
    saveToStorage();
  };

  saveBtn.addEventListener('click',   e => { e.stopPropagation(); doSave(); });
  cancelBtn.addEventListener('click', e => { e.stopPropagation(); renderLegend(); });
  deleteBtn.addEventListener('click', e => { e.stopPropagation(); deleteCategory(cat.id); });
  nameIn.addEventListener('keydown', e => {
    if (e.key === 'Enter')  doSave();
    if (e.key === 'Escape') renderLegend();
  });

  chip.append(colorIn, nameIn, saveBtn, cancelBtn, deleteBtn);
  setTimeout(() => { nameIn.select(); nameIn.focus(); }, 30);
}

export function deleteCategory(id) {
  const cat = state.categories.find(c => c.id === id);
  if (!cat) return;
  const usedCount = Object.values(state.hotkeys).filter(hk => hk.category === id).length;
  const doDelete = () => {
    Object.values(state.hotkeys).forEach(hk => { if (hk.category === id) hk.category = ''; });
    state.categories = state.categories.filter(c => c.id !== id);
    if (filterCat === id) { filterCat = null; clearCategoryHighlight(); }
    populateCategorySelect();
    renderKeyboard();
    renderLegend();
    renderSummary();
    saveToStorage();
  };
  if (usedCount > 0) {
    _showConfirm(`Delete "${cat.name}"? ${usedCount} hotkey${usedCount > 1 ? 's' : ''} will become uncategorized.`, doDelete);
  } else {
    doDelete();
  }
}

/* ── Category select dropdown ─────────────────────────────────── */
export function populateCategorySelect() {
  const sel = document.getElementById('hotkey-category');
  sel.innerHTML = '<option value="">— No category —</option>';
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
}

/* ── Custom category form ─────────────────────────────────────── */
export function initCustomCategories() {
  const form    = document.getElementById('new-category-form');
  const nameIn  = document.getElementById('new-cat-name');
  const colorIn = document.getElementById('new-cat-color');

  document.getElementById('btn-add-cat').addEventListener('click', () => {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) setTimeout(() => nameIn.focus(), 30);
  });

  document.getElementById('btn-new-cat-cancel').addEventListener('click', () => {
    form.classList.add('hidden');
    nameIn.value = '';
  });

  const doAdd = () => {
    const name = nameIn.value.trim();
    if (!name) { nameIn.focus(); return; }
    const id = 'custom_' + Date.now();
    state.categories.push({ id, name, color: colorIn.value });
    if (typeof gtag === 'function') gtag('event', 'category_added');
    nameIn.value = '';
    form.classList.add('hidden');
    populateCategorySelect();
    renderLegend();
    saveToStorage();
  };

  document.getElementById('btn-new-cat-add').addEventListener('click', doAdd);
  nameIn.addEventListener('keydown', e => {
    if (e.key === 'Enter') doAdd();
    if (e.key === 'Escape') document.getElementById('btn-new-cat-cancel').click();
  });
}
