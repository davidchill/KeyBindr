# Hotkey Mapper

A browser-based interactive tool for visualizing and documenting keyboard shortcuts. Click any key on a fully rendered 104-key US QWERTY keyboard to assign a label, modifiers, description, and color category. Maps can be saved, exported, and reimported as JSON.

**Version:** 0.1.1 — work in progress, active development.

---

## Features

- **Full 104-key keyboard** rendered in the browser — main block, navigation cluster, and numpad, all from structured layout data in JavaScript
- **Click any key** to open an edit popover and assign:
  - Modifier keys (Ctrl, Alt, Shift, Win)
  - Action label (e.g. "Undo", "Save", "Jump")
  - Optional description
  - Color category
- **8 built-in categories** with distinct colors: Movement, Edit/Undo, Selection, File/Save, View/Zoom, Tool/Mode, Combat, Custom
- **Category legend** below the keyboard with per-category key counts
- **Modifier pills** and action labels displayed directly on assigned key faces
- **Named maps** — give your map a name in the header
- **Export / Import** — save any map as a `.json` file and reload it later
- **Clear All** — wipe all assignments with a confirmation prompt
- **Persistent** — all assignments and the map name are saved to `localStorage`

---

## How It Works

The keyboard is rendered entirely at runtime from three layout data arrays (`MAIN_ROWS`, `NAV_ROWS`, `NUMPAD_KEYS`) defined in `app.js`. No images, no SVG sprites — every key is a DOM element styled with CSS.

The numpad uses CSS Grid with explicit `grid-column` / `grid-row` placement to handle the special-shaped keys (`+` spans 2 rows, `Enter` spans 2 rows, `0` spans 2 columns).

App state is a plain object:

```js
{ mapName: string, hotkeys: { [keyId]: { label, description, category, modifiers[] } } }
```

State is read from and written to `localStorage` on every save.

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
├── index.html      # App shell — header, keyboard mount, legend, edit popover
├── style.css       # Dark-theme stylesheet using CSS custom properties
├── app.js          # All layout data and application logic
├── package.json    # Metadata only — no dependencies, no build tools
└── CHANGELOG.md    # Version history
```

---

## Tech Stack

- Vanilla HTML / CSS / JavaScript — no framework, no build tools, no dependencies
- Runs entirely in the browser; no server-side logic

---

## Planned

- Pre-built templates for common apps and games (Photoshop, Premiere, World of Warcraft)
- Template gallery / import from dropdown
- Additional keyboard layouts beyond US QWERTY

---

## License

MIT

