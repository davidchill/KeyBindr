<p align="center">
  <img src="logos/logo-wide.png" alt="KeyBindr — Visualize your shortcuts" width="600">
</p>

<p align="center">
  A browser-based interactive tool for visualizing and documenting keyboard shortcuts.<br>
  Click any key on a fully rendered keyboard to assign labels, modifiers, descriptions, and color categories.
</p>

<p align="center">
  <strong>Version:</strong> 0.4.12 — work in progress, active development.
</p>

---

## Features

### Keyboard

- **Multiple form factors** — Full (104-key), Tenkeyless (TKL), 60%, Split, ZSA Voyager, ZSA Moonlander, and ErgoDox EZ layouts rendered on the fly
- **Key map support** — switch between QWERTY, Dvorak, Colemak, AZERTY, and QWERTZ; key labels update instantly while physical key IDs and existing assignments are preserved
- **Full 104-key layout** includes main block, navigation cluster, and numpad rendered from structured JavaScript data — no images or SVG sprites

### Key assignment

- **Click any key** to open an edit popover and assign:
  - Modifier keys (Ctrl, Alt, Shift, Win)
  - Action label (e.g. "Undo", "Save", "Jump")
  - Optional description
  - Color category
- **Fully custom categories** — blank maps start with no categories; create any category with a name and color picker; edit or delete categories inline; templates auto-populate only the categories they use; categories persist to `localStorage`
- **Modifier pills** and action labels displayed directly on assigned key faces, filled with the category color

### Templates & map management

- **Built-in templates** — load a ready-made hotkey map for Adobe Photoshop, Adobe Premiere Pro, World of Warcraft, or VS Code via the Templates button; each tile shows the app's official product icon
- **New Map** — "New Map" tile in the Templates modal; enter a name and create a blank map in one step
- **Category filter tabs** — filter the template grid by Design, Video, Gaming, or Development
- Same JSON shape as Export/Import — any exported map can become a template

### Visualization & interaction

- **Hover tooltips** — hovering any assigned key shows a floating tooltip with the action label, modifiers, description, and category
- **Category hover highlight** — hovering a category chip dims all non-matching keys and fades other summary groups; clicking locks the filter with a ✓ indicator; click again to clear
- **Heat map mode** — toggle in the layout bar; colors every key by proximity density to assigned keys, from cool (sparse) to warm (dense clusters)
- **Hover cross-highlight** — hovering an assigned key highlights its summary row, and vice versa

### UI & theming

- **Collapsible categories bar** — toggle button in the categories header collapses the chip list with a smooth animation; when collapsed, any active (filtered) category chip remains visible; state persists across sessions
- **Click-to-edit from summary** — clicking any row in the Hotkey Summary opens the edit popover pre-filled for that key; a pencil icon appears on hover as a visual affordance
- **Responsive scaling** — keyboard scales dynamically to fit any viewport via `ResizeObserver` and `transform: scale()`; visual corner radius compensated inversely so rounded corners look consistent at any zoom level; header collapses to a hamburger menu on narrow screens (≤768 px); a tablet breakpoint (≤1024 px) trims the layout bar to Templates + Form Factor + Key Map to avoid crowding; categories and summary reflow for single-column display
- **Style dropdown** — "Style" button in the header nav opens a panel with two sections: Color Scheme (five full UI themes: Default, Synthwave, Phosphor, Crimson, Forge) and Mode (Light / System / Dark); each scheme has independent dark and light variants with per-scheme aurora background and key hover glow; preferences persist under `keybindr-scheme` and `keybindr-theme`
- **Windows / Mac platform toggle** — Win / Mac segmented control in the header nav left side; switches modifier labels throughout the UI (`Ctrl → Cmd`, `Alt → Opt`) in summary chips, key tooltips, and copy output; persists across sessions
- **Chakra Petch font** — UI uses Chakra Petch (Google Fonts) for a technical, game-UI character across all platforms
- **Category legend** above the keyboard with per-category key counts and total coverage (`X / Y keys assigned`)
- **Hotkey summary panel** below the keyboard — all assigned hotkeys grouped by category in 4 draggable columns; searchable by label or description; long labels and descriptions wrap within their column
- **Drag-to-reorder** — drag category groups in the summary to reorder within a column or move to another; arrangement persists

### Data & export

- **Named maps** — editable map name in the layout bar
- **New / Save / Clear All** — layout bar controls for starting fresh, opening the Templates modal, or wiping the current map
- **Export / Import** — save any map as a `.json` file and reload it later
- **Share panel** — "Share" button opens a dropdown with seven options: Copy Link (shareable URL with map encoded in the hash), Post on X, Share on Reddit, Share via Email, Copy as Markdown, Export JSON, and Print
- **Copy as Text / Markdown** — copies the full hotkey summary as formatted plain text or a Markdown document with category headings and shortcut tables
- **Undo / Redo** — Ctrl+Z / Ctrl+Shift+Z (or layout bar buttons) with a 50-entry history
- **Key conflict detection** — warning in the edit popover when a label is already used on another key
- **Label autocomplete** — typeahead dropdown on the Action Label field showing matching labels from existing assignments
- **Print** — clean printable layout; UI chrome hidden via `@media print`
- **Persistent** — all assignments, map name, layout, key map, summary arrangement, and custom categories saved to `localStorage`

### Analytics

- **Google Analytics 4** — comprehensive event tracking via GA4 custom events, including key assignments, exports, imports, template loads, shares, prints, layout/keymap/theme changes, undo/redo, heatmap toggles, and more
- **Session counters** — exports, imports, saves, shares, and prints each carry a `session_count` parameter so GA4 can report how many times each action is taken per visit
- **Returning user detection** — fires `returning_user` on page load when a saved map exists in `localStorage`; fires `map_loaded_from_url` when a shared URL is opened

---

## How It Works

The keyboard is rendered entirely at runtime from layout data arrays (`MAIN_ROWS`, `NAV_ROWS`, `NUMPAD_KEYS`, `ZSA_KEYBOARDS`) in `app.js`. Switching form factor or key map re-renders the keyboard without touching stored hotkey data.

The numpad uses CSS Grid with explicit `grid-column` / `grid-row` placement to handle special-shaped keys (`+` and `Enter` span 2 rows, `0` spans 2 columns). ZSA split keyboards use a column-stagger renderer with computed thumb cluster offsets.

App state:

```js
{
  hotkeys:          { [keyId]: { label, description, category, modifiers[] } },
  layout:           'full' | 'tkl' | '60' | 'split' | 'voyager' | 'moonlander' | 'ergodox',
  keyMap:           'qwerty' | 'dvorak' | 'colemak' | 'azerty' | 'qwertz',
  summaryCols:      [ [catId, ...], [catId, ...], [catId, ...], [catId, ...] ],
  categories:       [ { id, name, color } ],
  platform:         'windows' | 'mac'
}
```

Theme preference, color scheme, and categories-bar collapsed state are stored separately under `keybindr-theme`, `keybindr-scheme`, and `keybindr-legend-collapsed`.

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
├── index.html          # App shell — header, layout bar, keyboard, legend, summary, popovers
├── style.css           # Themed stylesheet using CSS custom properties (light + dark)
├── app.js              # All layout data, key maps, and application logic
├── templates.js        # Built-in template maps (loaded before app.js)
├── package.json        # Metadata only — no dependencies, no build tools
├── logos/              # Brand assets (app icon, square logo, wide banner)
├── favicon.svg
├── favicon-96x96.png
├── favicon.ico
├── apple-touch-icon.png
├── site.webmanifest
├── og-image.png        # 1200×630 Open Graph image for social sharing
└── CHANGELOG.md
```

---

## Tech Stack

- Vanilla HTML / CSS / JavaScript — no framework, no build tools, no dependencies
- Runs entirely in the browser; no server-side logic

---

## Planned

- More built-in templates (community apps, additional games)
- Modifier layer views (Base / Shift / Ctrl / Alt layers per key)
- Export to cloud storage (local file picker + cloud-synced folder)

---

## License

MIT
<!-- deploy -->
