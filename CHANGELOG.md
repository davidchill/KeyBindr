# Changelog

## [0.2.1] – 2026-05-01

### Added

- **Presets system** — "Presets" button in the header opens a modal with a grid of built-in app/game maps; category filter tabs (All / Design / Video / Gaming / Development) narrow the grid; loading a preset replaces the current map with a confirmation prompt if the map is non-empty
- **Built-in presets** — Adobe Photoshop (24 keys, tool shortcuts), Adobe Premiere Pro (23 keys, playback + edit tools), World of Warcraft (31 keys, movement + abilities + UI panels), VS Code (21 keys, Ctrl-modified editing and navigation shortcuts); all use the same JSON shape as the existing Export format
- **Hover cross-highlight** — hovering an assigned key on the keyboard highlights the matching entry in the hotkey summary, and vice versa; implemented via a shared `.pair-highlight` class toggled by `mouseenter`/`mouseleave` on both key elements and summary items

### Changed

- **Hotkey summary** expanded from 2 columns to 3; `state.summaryCols` is now a three-element array; existing saved layouts are automatically migrated on load
- **Summary item alignment** — summary chips given `min-width: 28px` so all single-character key chips render at a consistent width, keeping action label text left-aligned across rows within a section

---

## [0.2.0] – 2026-05-01

### Added

- **Theme picker** — 3-button segmented control (Sun / Monitor / Moon) in the header switches between Light, System, and Dark modes; preference persisted to `localStorage`
- **Light mode** — full alternative color palette with appropriately adjusted surface, border, keyboard shell, and key label colors
- **Form factor switcher** — dropdown to select Full (104-key), Tenkeyless (TKL), 60%, or Split layout; the keyboard re-renders instantly and the choice persists
- **Key map switcher** — dropdown to relabel keys for QWERTY, Dvorak, Colemak, AZERTY, or QWERTZ; key IDs remain physical-position-based so existing assignments are preserved
- **Split layout** — main block bisected by a dashed gap after the B/T/G/5/Space keys, matching standard ergonomic split keyboard form
- **Floating layout bar** — form factor and key map controls rendered as a compact floating card between the header and keyboard, not a full-width nav strip
- **Hotkey summary panel** — live-updating panel below the keyboard listing all assigned hotkeys grouped by category; shows modifier + key chips, action label, and optional description
- **Drag-to-reorder summary categories** — each category group in the summary has a drag handle; groups can be reordered within a column or dragged to the opposite column; arrangement persists to `localStorage`

### Changed

- **Categories bar** moved from below the keyboard to above it
- **Dark mode contrast** — page background deepened (`#090b14`), keyboard shell brightened and differentiated (`#1c2038`), sub-labels and alpha key labels noticeably brighter
- **Light mode contrast** — page background darkened (`#e8eaf6`), keyboard shell darkened (`#b0b4d0`) for a clearer physical separation from the page surface; key labels darkened for improved legibility
- Summary groups keep all hotkeys in one column — entire category groups are assigned to left or right, items within a group stack vertically

---

## [0.1.1] – 2026-04-29

### Added

- `README.md` — full project synopsis for the GitHub repo covering features, how it works, local dev setup, project structure, tech stack, and planned work

---

## [0.1.0] – 2026-04-22

### Initial Release

First working build of Hotkey Mapper — a browser-based interactive tool for visualizing and documenting keyboard shortcuts.

#### Site structure
- `site/index.html` — single-page app shell with sticky header, keyboard section, legend section, and edit popover
- `site/style.css` — full dark-theme stylesheet using CSS custom properties; responsive scrollable keyboard layout
- `site/app.js` — all keyboard layout data and application logic in vanilla JS; no dependencies

#### Keyboard
- Full 104-key US QWERTY layout rendered entirely via JavaScript from structured layout data
- Three sections: main block (6 rows), navigation cluster (PrtSc/ScrLk/Pause, Ins/Home/PgUp, Del/End/PgDn, arrow keys), and numpad
- Numpad uses CSS Grid with explicit column/row placement to support the spanning `+` and `Enter` keys (2-row height) and `0` key (2-column width)
- Function row renders at reduced height (30px vs. 44px standard) to match real keyboard proportions
- Modifier keys (Ctrl, Alt, Shift, ⊞ Win) and special keys render with smaller labels; alpha keys render at larger size
- Sub-labels (shifted characters) shown on number row, symbol, and numpad keys

#### Key assignment (popover)
- Click any key to open the edit popover (centered modal with backdrop blur)
- Fields: modifier checkboxes (Ctrl, Alt, Shift, Win), action label, optional description, category select
- Assigned keys display modifier pills and action label directly on the key face, filled with the category color
- Save with button or Enter key; clear removes the assignment and restores the default key label
- Escape key closes the popover

#### Categories & legend
- 8 built-in color-coded categories: Movement, Edit/Undo, Selection, File/Save, View/Zoom, Tool/Mode, Combat, Custom
- Legend bar below keyboard shows all categories with swatches and per-category assigned key counts
- Unassigned keys with a category use a neutral gray fill

#### Persistence & data
- Map name editable in the header; persisted to `localStorage` alongside all hotkey assignments
- Export: downloads the current map as a named `.json` file
- Import: reads a previously exported `.json` file and restores the full map
- Clear All: removes all assignments with a confirmation prompt

#### Dev tooling
- `.claude/launch.json` configured with two static file server options: `npx serve` (port 3000) and `python -m http.server` (port 8080)
