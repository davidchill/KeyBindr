import { state, saveToStorage, syncActiveTab } from './state.js';
import { displayMod, getKeyLabel, findKeyDef } from './keyboard.js';
import { getOrderedHotkeys } from './summary.js';
import { allCategories, populateCategorySelect } from './categories.js';

let _cbs = {
  pushUndo: () => {},
  renderKeyboard: () => {},
  renderLegend: () => {},
  renderSummary: () => {},
  track: () => {},
  sessionCounts: null,
};

export function setExportCallbacks(cb) { Object.assign(_cbs, cb); }

export function shareDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function siteUrl() {
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

export function buildPlainText() {
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

export function buildMarkdown() {
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

export function markdownToHtml(md) {
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
    if (line.startsWith('# '))       out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.startsWith('## ')) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line === '---')         out.push('<hr>');
    else if (line.trim())            out.push(`<p>${inline(line)}</p>`);
  }
  flushTable();
  return out.join('');
}

export async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1800);
  } catch (_) {}
}

export function exportMap() {
  const name = document.getElementById('map-name').value || 'hotkey-map';
  const sc = _cbs.sessionCounts;
  _cbs.track('map_exported', { key_count: Object.keys(state.hotkeys).length, session_count: sc ? ++sc.exports : undefined });
  const data = { version: 1, name, generatedOn: shareDate(), source: 'KeyBindr', sourceUrl: siteUrl(), hotkeys: state.hotkeys, categories: state.categories };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = name.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMapCSV() {
  syncActiveTab();
  const mapName = document.getElementById('map-name').value || 'hotkey-map';
  const sc = _cbs.sessionCounts;
  _cbs.track('map_exported_csv', { key_count: Object.keys(state.hotkeys).length, session_count: sc ? ++sc.exports : undefined });

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

export function validateImport(data) {
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

export function importMap(file) {
  const sc = _cbs.sessionCounts;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      validateImport(data);
      _cbs.pushUndo();
      state.hotkeys    = data.hotkeys;
      state.categories = data.categories || [];
      if (data.name) document.getElementById('map-name').value = data.name;
      _cbs.track('map_imported', { key_count: Object.keys(state.hotkeys).length, session_count: sc ? ++sc.imports : undefined });
      populateCategorySelect();
      _cbs.renderKeyboard();
      _cbs.renderLegend();
      _cbs.renderSummary();
      saveToStorage();
    } catch (err) {
      alert(`Could not import: ${err.message || 'Invalid KeyBindr JSON file.'}`);
    }
  };
  reader.readAsText(file);
}
