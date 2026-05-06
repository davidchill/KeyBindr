# KeyBindr

A browser-based interactive tool for visualizing and documenting keyboard shortcuts. Click any key on a fully rendered keyboard to assign a label, modifiers, description, and color category. Maps can be exported and reimported as JSON.

**Version:** 0.3.0 — work in progress, active development.

---

## Features

### Keyboard

- **Multiple form factors** — Full (104-key), Tenkeyless (TKL), 60%, and Split layouts rendered on the fly
- **Key map support** — switch between QWERTY, Dvorak, Colemak, AZERTY, and QWERTZ; key labels update instantly while physical key IDs (and existing assignments) are preserved
- **Full 104-key layout** includes main block, navigation cluster, and numpad rendered from structured JavaScript data — no images or SVG sprites

### Key assignment

- **Click any key** to open an edit popover and assign:
  - Modifier keys (Ctrl, Alt, Shift, Win)
  - Action label (e.g. "Undo", "Save", "Jump")
  - Optional description
  - Color category
- **8 built-in categories** with distinct colors: Movement, Edit/Undo, Selection, File/Save, View/Zoom, Tool/Mode, Combat, Custom
- **Custom categories** — create your own categories with a name and color picker; they appear in the legend, the key-assignment dropdown, and the summary, and are persisted to `localStorage`
- **Modifier pills** and action labels displayed directly on assigned key faces, filled with the category color

### Templates & map management

- **Built-in templates** — load a ready-made hotkey map for Adobe Photoshop, Adobe Premiere Pro, World of Warcraft, or VS Code via the Templates button in the layout bar
- **New Map** — "New Map" tile in the Templates modal; enter a name and create a blank map in one step
- **Category filter tabs** — filter the template grid by Design, Video, Gaming, or Development
- Same JSON shape as Export/Import — any exported map can become a template

### Visualization & interaction

- **Hover tooltips** — hovering any assigned key shows a floating tooltip with the action label, modifiers, description, and category
- **Category filter** — click a category chip to dim all non-matching keys and highlight matching ones; click again to clear
- **Heat map mode** — toggle in the layout bar; colors every key by proximity density to assigned keys, from cool (sparse) to hot (dense clusters)
- **Hover cross-highlight** — hovering an assigned key highlights its summary row, and vice versa

### UI & theming

- **Light / Dark / System theme** — 3-button picker in the header; preference persists across sessions
- **Inter font** — UI uses Inter (Google Fonts) for crisp, consistent rendering across all platforms
- **Category legend** above the keyboard with per-category key counts and total coverage (`X / Y keys assigned`)
- **Hotkey summary panel** below the keyboard — all assigned hotkeys grouped by category in 3 columns; searchable by label or description
- **Drag-to-reorder** — drag category groups in the summary to reorder within a column or move to another column; arrangement persists

### Data & export

- **Named maps** — editable map name in the layout bar (ghost style at rest, styled on hover/focus)
- **New / Save / Clear All** — layout bar controls for starting fresh, opening the Templates modal, or wiping the current map
- **Export / Import** — save any map as a `.json` file and reload it later
- **Share via URL** — "Share" button encodes the full map as base64 JSON in the URL hash and copies the link to clipboard; recipients open the URL to auto-load the map
- **Copy as Text** — copies the full hotkey summary to the clipboard as formatted plain text, grouped by category
- **Copy as Markdown** — copies the summary as a Markdown document with category headings and shortcut tables, ready to paste into Notion, GitHub, or any Markdown editor
- **Undo / redo** — Ctrl+Z / Ctrl+Shift+Z (or buttons in the layout bar) with a 50-entry history covering all assignment changes
- **Key conflict detection** — amber warning in the edit popover when typing a label already used on another key
- **Label autocomplete** — typeahead dropdown on the Action Label field showing matching labels from other keys with key badge and divider
- **Print** — renders the keyboard and summary as a clean printable page; UI chrome is hidden via `@media print`
- **Persistent** — all assignments, map name, layout, key map, summary arrangement, and custom categories saved to `localStorage`

---

## How It Works

The keyboard is rendered entirely at runtime from three layout data arrays (`MAIN_ROWS`, `NAV_ROWS`, `NUMPAD_KEYS`) in `app.js`. The active form factor and key map are read from `state` at render time — switching either re-renders the keyboard without touching the stored hotkey data.

The numpad uses CSS Grid with explicit `grid-column` / `grid-row` placement to handle special-shaped keys (`+` and `Enter` span 2 rows, `0` spans 2 columns).

App state:

```js
{
  hotkeys:          { [keyId]: { label, description, category, modifiers[] } },
  layout:           'full' | 'tkl' | '60' | 'split',
  keyMap:           'qwerty' | 'dvorak' | 'colemak' | 'azerty' | 'qwertz',
  summaryCols:      [ [catId, ...], [catId, ...], [catId, ...] ],
  customCategories: [ { id, name, color } ]
}
```

---

## Running Locally

No build step required. Serve the `site/` directory with any static file server:

```bash
# Option A — npx serve (recommended)
npx serve site --listen 3000

# Option B — Python
python -m http.server 8080 --directory site
```

Then open `http://localhost:3000` (or `:8080`).

---

## Project Structure

```
site/
├── index.html      # App shell — header, layout bar, keyboard, legend, summary, popovers
├── style.css       # Themed stylesheet using CSS custom properties (light + dark)
├── app.js          # All layout data, key maps, and application logic
├── templates.js    # Built-in template maps (loaded before app.js, exposes TEMPLATES array)
├── package.json    # Metadata only — no dependencies, no build tools
└── CHANGELOG.md    # Version history
```

---

## Tech Stack

- Vanilla HTML / CSS / JavaScript — no framework, no build tools, no dependencies
- Runs entirely in the browser; no server-side logic

---

## Planned

- More built-in templates (community apps, additional games)
- Modifier layer views (Base / Shift / Ctrl / Alt layers per key)
- Export to machine or cloud storage (local file picker + cloud-synced folder)

---

## License

MIT
<!-- deploy -->

