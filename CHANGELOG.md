# Changelog

## [0.2.6] – 2026-05-05

### Changed

- **Coming Soon overlay — secret URL access** — removed the "Preview the app →" button from the overlay; the app now unlocks only when visited with the secret query parameter `?open=keybindr`; on match, the unlock state is written to `localStorage` (returning visits go straight to the app) and the param is stripped from the URL via `history.replaceState` so it never appears in the address bar after the first visit

---

## [0.2.5] – 2026-05-05

### Added

- **Print** — "Print" button in the header triggers `window.print()`; a `@media print` CSS rule hides the header, layout bar, category legend, and copy buttons so only the keyboard and hotkey summary render on the printed page; basic light-mode print styles applied for ink clarity
- **Copy as Text** — "Copy Text" button in the hotkey summary header copies all assigned shortcuts to the clipboard as formatted plain text, grouped by category with shortcut strings padded for alignment; button briefly shows "Copied!" as confirmation feedback
- **Copy as Markdown** — "Copy Markdown" button copies the summary as a Markdown document with `## Category` headings and `| Shortcut | Action | Description |` tables per group, ready to paste into Notion, GitHub, or any Markdown editor
- **Coming Soon overlay** — full-page overlay shown to first-time visitors displaying the KeyBindr logo, "Coming Soon" headline, and tagline; a subtle "Preview the app →" link dismisses it and saves state to `localStorage` under `keybindr-preview-unlocked` so returning visitors go straight to the app

---

## [0.2.4] – 2026-05-04

### Added

- **New Map tile in Templates modal** — a dashed-border "New Map" tile is always visible at the top of the template grid; clicking it expands inline (spanning 2 columns) to show a name input pre-filled with the current map name, plus Create and Cancel buttons; Create clears all hotkeys, sets the map name, saves to `localStorage`, and closes the modal; the tile collapses when the modal closes; tab filters never hide it
- **"New" button in layout bar** — ghost button to the left of the map name; clears both the map name and all assigned hotkeys with a confirmation prompt if either is non-empty
- **"Save" button in layout bar** — ghost button between the map name and Clear All; opens the Templates modal
- **Custom categories** — `+` icon button next to the CATEGORIES label opens an inline form (name text input + native color picker + Add + Cancel); new categories are appended to the built-in list via `allCategories()`, appear immediately in the legend chips, key-assignment category dropdown, and hotkey summary; custom categories are persisted to `localStorage` under `customCategories` in the `keybindr` key and restored on load; Enter confirms, Escape cancels

### Changed

- **Layout bar order** — reorganised to: New → map name → Save → Clear All | Templates | Form Factor → Key Map; Templates button now sits between two vertical dividers in the centre of the bar
- **Clear All auto-names** — after clearing all hotkeys the map name field is set to "New Template"
- **Layout bar visual refresh** — deeper layered box-shadow (`0 4px 20px`), border tightened to `--border-2`, corner radius increased to 14px, inner top-edge highlight added; gap reduced to 6px with spacer margin on dividers
- **Ghost buttons** — `.btn-ghost` border is now `transparent` at rest (only appears on hover), making the bar feel less cluttered; applies to New, Save, and Clear All
- **Map name input** — transparent background and border at rest; border and surface-2 background appear on hover/focus; font bumped to 0.9rem 600 weight so it reads as a title
- **Templates button accent** — subtle accent-color tint on border and background (`color-mix`) with stronger tint on hover, making it visually distinct from the ghost buttons
- **Layout selects** — same ghost treatment as ghost buttons: transparent border/bg at rest, styled on hover/focus; label opacity reduced to 0.7
- **Legend bar** — border tightened to `--border-2`, corner radius increased to 14px, matching shadow applied
- **Category chips** — each chip receives a `--cat-color` CSS custom property set from its category color; border and background are subtly tinted using `color-mix(in srgb, var(--cat-color) …%, …)`; hover deepens the tint; swatch gets a soft `box-shadow` glow in the category color
- **Header Export/Import buttons** — font-size reduced to 0.78rem, weight 600, letter-spacing 0.02em for a tighter, more refined label

---

## [0.2.3] – 2026-05-03

### Fixed

- **Keyboard container box** — `keyboard-section` no longer carries `overflow-x: auto`, which caused the browser to force `overflow-y` to `auto` and render the section as a visible scroll container with a compositing-layer grey background. Replaced with a two-element structure: `keyboard-section` (pure flex centering wrapper, no overflow) and an inner `keyboard-scroll` div (no overflow either); the existing `body { overflow-x: hidden }` handles narrow-viewport clipping at the page level.
- **Top of keyboard clipped** — added `padding-top: 8px` to `keyboard-section` so the keyboard's 1px outline box-shadow is never clipped at the container's top edge.
- **Grey halo in light mode** — the keyboard drop shadow (`0 32px 80px rgba(0,0,0,0.7)`) was calibrated for dark mode; on the light lavender background it rendered as a visible dark grey cloud. Introduced a `--keyboard-shadow` CSS variable: dark mode keeps the original dramatic shadow; light mode uses a much softer `0 8px 32px rgba(0,0,0,0.12)` equivalent. Applied to both the standard `.keyboard` shell and `.zsa-split-mode .zsa-half`.
- **Double-border "box" in light mode** — `--keyboard-outline` in `[data-theme="light"]` changed from the solid `#9094b4` ring (which combined with the existing `border` to produce a visible double border) to `rgba(0,0,0,0.12)`, blending with the keyboard case edge instead of framing it.

---

## [0.2.2] – 2026-05-03

### Changed

- **Renamed "Presets" to "Templates"** — `presets.js` renamed to `templates.js`; `PRESETS` constant renamed to `TEMPLATES`; all IDs, CSS classes, function names, and user-facing labels updated consistently (`btn-templates`, `template-modal`, `template-tile`, etc.)
- **Inter font** — Google Fonts Inter (400/500/600/700) added via `<link>` preconnect; browser button/input default font override added to reset so all form elements inherit the font stack correctly
- **Key visual depth** — key face now uses a top-to-bottom gradient (`--key-face-top` → `--key-face`) with an inset top-light highlight and inset bottom shadow; hover and active states updated to match; keyboard shell border-radius increased from 14px to 16px with a stronger layered drop shadow
- **Non-alpha key brightening** — modifier, function, navigation, and numpad keys use a dedicated lighter face gradient (`--key-mod-face-top` / `--key-mod-face`) and a new brighter label color (`--key-mod: #8890c4`); both variables defined for dark and light themes
- **Alpha key typography** — `font-weight: 500` and `letter-spacing: 0.01em` applied to single-character alpha/digit key labels
- **Layout bar reorganised** — Templates button, Clear All button, and map name input moved from the header into the layout bar (in that order, left to right), separated from the form factor and key map selectors by a vertical divider; header now contains only the brand, theme picker, Export JSON, and Import JSON

---

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
