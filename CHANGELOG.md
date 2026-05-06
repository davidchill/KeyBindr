# Changelog

## [0.4.3] – 2026-05-06

### Added

- **Color scheme system** — five full UI themes selectable from a dropdown in the header nav: **Default** (cyan/navy), **Synthwave** (hot pink + electric blue), **Phosphor** (terminal green), **Crimson** (blood red / obsidian), and **Forge** (amber / warm charcoal); preference persisted to `localStorage` under `keybindr-scheme`
- **Per-scheme aurora background** — each scheme defines its own set of four radial-gradient color blobs fixed to the viewport corners/edges, giving each theme a distinctive atmospheric ambient glow; dark and light variants defined independently per scheme
- **Key hover glow** — keys emit a neon bloom on hover using a `--key-glow` CSS variable set per scheme; default scheme glows cyan, Synthwave glows electric blue, Phosphor glows green, Crimson glows red, Forge glows amber
- **`--key-glow` variable** — new CSS custom property in `:root` and each `[data-scheme]` override block; used in `.key:hover` box-shadow via `color-mix(in srgb, var(--key-glow) …%, transparent)` so it adapts automatically to the active scheme

### Changed

- **Font** — UI typeface switched from Inter to **Chakra Petch** (Google Fonts); angular, technical character that reinforces the tool's game-UI aesthetic
- **Accent color** — default scheme accent shifted from indigo `#6366f1` to electric cyan `#00c8f5` / `#33d6ff`; brand gradient start updated to match
- **Hardcoded accent tints replaced with `color-mix()`** — six places that previously used hardcoded `rgba(99,102,241,…)` now use `color-mix(in srgb, var(--accent) …%, transparent)`; they adapt automatically to any active scheme's accent color without additional overrides
- **Hotkey summary card background** — gradient changed from `keyboard-bg → bg` (which bled into the page) to `surface-2 → surface`, matching the categories bar treatment for visual consistency
- **Section spacing** — categories bar sits 12px below the layout bar (`padding-top` on `.app-main`); keyboard section sits 20px below categories bar; hotkey summary sits 20px below keyboard; each gap is independently controlled via `margin-top` and section padding rather than a uniform `gap`

---

## [0.4.2] – 2026-05-06

### Added

- **Collapsible categories bar** — chevron toggle button in the categories header collapses the chip list with a smooth CSS grid animation (`grid-template-rows: 1fr → 0fr`); collapsed state persists to `localStorage` under `keybindr-legend-collapsed`
- **Active chip preserved when collapsed** — a `.legend-active-preview` div between the header and the collapsible body mirrors the currently selected filter chip at all times; visible only when collapsed and a filter is active; clicking the mirrored chip deselects the filter as normal
- **Click-to-edit from hotkey summary** — clicking any row in the Hotkey Summary opens the edit popover pre-filled with that key's existing label, description, modifiers, and category; a pencil icon appears on hover as a visual affordance
- **GA4 custom event tracking** — comprehensive set of `gtag` custom events wired throughout `app.js` via a central `track()` helper: `key_assigned`, `key_cleared`, `map_exported`, `map_imported`, `template_loaded`, `new_map_created`, `new_map_started`, `clear_all`, `layout_changed`, `keymap_changed`, `theme_changed`, `heatmap_toggled`, `map_shared` (with `method` param), `map_printed`, `summary_copied`, `category_added`, `undo_used`, `redo_used`, `returning_user`, `map_loaded_from_url`, `categories_toggled`
- **GA4 session counters** — exports, imports, saves (template loads + new map), shares, and prints each carry a `session_count` parameter incremented per session so GA4 can report average action frequency per visit

### Changed

- **Hotkey summary expanded to 4 columns** — `summaryCols` is now a four-element array; categories distributed in quarters; existing saved three-column layouts are automatically re-initialised; `[0, 1, 2, 3]` render loop in `renderSummary`; CSS grid updated to `repeat(4, 1fr)`
- **Summary description text wraps** — removed `white-space: nowrap` / `overflow: hidden` / `text-overflow: ellipsis` from `.summary-action` and `.summary-desc`; long labels and descriptions now wrap naturally within their column; `word-break: break-word` added to handle unbroken strings
- **Hotkey summary horizontal inset** — `.summary-section` gains `padding-left: 15px` and `padding-right: 15px`, tightening its width relative to the keyboard and categories bar above it

### Docs

- **README rewritten** — logo-wide banner added at top via centered HTML `<img>`; all new features documented; state shape updated to reflect four-column `summaryCols` and `keybindr-legend-collapsed` storage key; ZSA form factors listed; Analytics section added

---

## [0.4.1] – 2026-05-05

### Fixed

- **Space key chip blank in summary** — Space key had `label: ''` in the layout data (the only named key without a label), causing `getKeyLabel` to return an empty string and render a blank chip in the hotkey summary; changed to `label: 'Space'` for consistency with all other named keys

### Added

- **Category hover highlight** — hovering a category chip in the legend dims all non-matching keyboard keys and fades non-matching summary groups; moving the mouse away restores the view; uses `cat-dim` / `cat-highlight` CSS classes driven by `setCategoryHighlight` / `clearCategoryHighlight`
- **Persistent category filter highlight** — clicking a category chip now keeps the hover highlight active after the mouse moves away; hovering a different chip temporarily shows that category's highlight, then reverts to the selected one on mouse-out; unified `reapplyFilter` to call `setCategoryHighlight` so keyboard and summary use the same visual path
- **Category filter checkmark indicator** — active category chip shows a `✓` after its label (via `::after` in the category color) so the selected filter is always clearly indicated without requiring hover
- **Category-colored summary section headers** — each category group header in the hotkey summary renders its name in the category's own color via a `--cat-color` CSS variable set per group; replaces the previous uniform `--text-muted` treatment
- **GitHub footer link** — GitHub mark icon + "GitHub" text link to `https://github.com/davidchill/KeyBindr` added to the footer, left of the version number; muted at rest, brightens to `--text` on hover

### Changed

- **Summary key chip sizing** — `font-size` increased from `0.7rem` to `0.75rem` (~1px); `min-width` increased from `28px` to `29px`
- **Form Factor / Key Map dropdown styling** — selects now use `appearance: none` with an explicit border (`--border`), filled background (`--surface-2`), and a custom chevron SVG data URL (muted stroke in both dark and light themes); `padding-right: 28px` makes room for the arrow; replaces the previous invisible-at-rest style
- **Non-keyboard section depth** — layout bar, categories legend, and hotkey summary card all switch from flat `--surface` to a `linear-gradient(180deg, --surface-2, --surface)` background; box-shadow upgraded to a two-layer spread plus an `inset 0 1px 0` top highlight for a more elevated, card-like appearance
- **Hotkey summary background darkened** — summary card gradient changed from the surface range to `linear-gradient(180deg, --keyboard-bg, --bg)`, bringing its tone in line with the keyboard shell
- **Summary item border contrast** — `border` on `.summary-item` bumped from `var(--border)` to `var(--border-2)` so row outlines are clearly legible against the darker card background

---

## [0.4.0] – 2026-05-05

### Added

- **Share panel** — "Share" button now opens a dropdown panel anchored below the button with five sharing options: Copy Link (shareable URL with the map encoded in the hash), Post on X (Twitter intent), Share on Reddit (reddit.com/submit), Share via Email (mailto: with map name as subject), and Copy as Markdown (full hotkey summary in Markdown format); panel closes on click-outside; "Copied!" confirmation feedback on clipboard actions
- **Brand tagline** — "Map your muscle memory" added to the navbar to the right of the KeyBindr wordmark, separated by a subtle vertical divider; styled in `--text-muted` at 0.78rem
- **Favicons** — full favicon pack wired up: `favicon.svg` (SVG, all modern browsers), `favicon-96x96.png` (PNG fallback), `apple-touch-icon.png` (iOS home screen), `site.webmanifest` (PWA/Android); all files moved to `site/` root; webmanifest updated with name "KeyBindr", `theme_color: #6366f1`, `background_color: #090b14`
- **Google Analytics** — GA4 tracking snippet added to `<head>` (measurement ID: G-Y1EQFTC8YR)

---

## [0.3.2] – 2026-05-06

### Changed

- **Dark mode depth** — keyboard shell darkened (`#1c2038` → `#0e1122`) and key faces brightened (`#1f2235` → `#252840`) to create a clear visual separation between shell and keys; key-face gradients richer with distinct top/bottom stops; key label colors pushed brighter across all three tiers (`--key-alpha`, `--key-mod`, `--key-sub`); drop shadow intensified for stronger depth; `--text-muted` brightened for better secondary text legibility
- **Light mode depth** — equivalent changes mirrored: keyboard shell darkened (`#b0b4d0` → `#9299c0`) and key faces lightened toward near-white (`--key-face-top: #f2f5ff`); key ridge darkened for a stronger shadow line under each key; shell shadow strengthened to match dark mode improvements
- **Brand logo** — generic SVG keyboard icon in the header replaced with the KeyBindr app icon PNG (`logos/icon-app.png`), rendered at 28px with a 7px border-radius; three logo files added to `site/logos/` (`icon-app.png`, `logo-square.png`, `logo-wide.png`)
- **Brand gradient** — "KeyBindr" wordmark now renders with a blue → indigo → magenta gradient (`#5ab5f5` → `#818cf8` → `#c040e0`) via `background-clip: text`, pulled directly from the logo key gradient; `--brand-gradient` CSS variable added to `:root` for future reuse
- **Primary button gradient** — Save / primary action button uses `--brand-gradient` instead of flat indigo; hover applies `filter: brightness(1.12)` so the gradient lightens uniformly
- **Header wordmark size** — "KeyBindr" brand name in the header increased from `1.05rem` to `1.3rem` (~4px larger) for stronger presence in the toolbar
- **Coming Soon page** — generic SVG keyboard icon replaced with the app icon PNG at 96px; "KeyBindr" wordmark on the overlay now uses the brand gradient, matching the header treatment
- **Brand wordmark weight** — "KeyBindr" font weight bumped to `800` (extra bold) in both the header and Coming Soon overlay; Google Fonts import updated to include weight 800
- **Logo updated** — switched to `main_nobackground.png` across header and Coming Soon overlay; all four logo assets now in `site/logos/`
- **Header icon sizing** — brand icon in the navbar increased to 36px; header vertical padding reduced from 10px to 6px to keep the navbar height unchanged

---

## [0.3.1] – 2026-05-06

### Added

- **Mobile-responsive keyboard** — a `ResizeObserver` watches the keyboard section and applies `transform: scale()` with a JS-managed wrapper height whenever the keyboard is wider than the available viewport. Scale is measured fresh after every `renderKeyboard()` call (including layout and key map switches) and re-applied on resize without a layout flash. Works across all form factors including ZSA split keyboards.
- **Mobile header** — a hamburger button appears at ≤ 768px, hiding the Share / Print / Export / Import action buttons. Tapping it drops a full-width panel below the header containing the theme picker and all four action buttons at full width; tapping outside collapses it.
- **Compact mobile layout bar** — on narrow viewports the layout bar stretches edge-to-edge as a toolbar and hides the less-critical controls (New, map name, Save, Undo/Redo, Clear All, Heat Map), leaving only Templates, Form Factor, and Key Map selectors.
- **Mobile categories layout** — the CATEGORIES title row is promoted to its own full-width flex row so category chips have the full container width and wrap into a proper 2-per-row grid instead of stacking in a narrow column beside the label.
- **Mobile hotkey summary** — Copy Text / Copy Markdown buttons are hidden on mobile (where they are rarely useful); the search box expands to full width; "HOTKEY SUMMARY" title no longer wraps; summary columns collapse from 3 to 1.

---

## [0.3.0] – 2026-05-05

### Added

- **Hover tooltips on keys** — hovering any assigned key shows a floating tooltip with the action label, modifier pills, optional description, and category swatch; tooltip auto-positions above the key and flips below if near the top of the viewport
- **Category filter highlighting** — clicking a category chip in the legend dims all non-matching keys to 15% opacity and outlines matching keys with a white ring; click the same chip again to clear the filter; active chip gets a colored glow ring; filter state persists across keyboard re-renders
- **Key conflict detection** — typing in the Action Label field in the edit popover shows an amber warning banner if the same label is already assigned to another key; non-blocking (user can still save); warning clears automatically when the label no longer conflicts
- **Label autocomplete** — typeahead dropdown on the Action Label input shows all matching labels from other assigned keys as the user types; each suggestion shows a miniature key badge (matching the popover header style) on the left and the label on the right, separated by a `|` divider; keyboard-navigable (↑ ↓ Enter Escape); selecting a suggestion fills the input and fires the conflict check
- **Undo / redo** — 50-entry undo stack covering all hotkey mutations (save, clear single key, clear all); Ctrl+Z to undo, Ctrl+Shift+Z or Ctrl+Y to redo; undo/redo icon buttons added to the layout bar (disabled when stack is empty)
- **Popover key name** — popover header now shows two distinct values: left badge displays the short key label (e.g. `Alt`, `F5`, `7`), right title displays the full descriptive name (e.g. `Right Alt`, `Function 5`, `Number 7`); covers all disambiguated keys: sided modifiers (Left/Right Shift/Ctrl/Alt/Win), F1–F12 as "Function N", number row Digit0–9 as "Number N", arrow keys, numpad keys, Page Up/Down, and symbol keys
- **Coverage indicator** — legend stat updated from "X keys assigned" to "X / Y keys assigned" where Y is the total number of renderable keys in the current layout; updates automatically when the layout changes
- **Search in hotkey summary** — live-filter text input in the summary header; matches against both action label and description; hides non-matching items and collapses entire category groups when nothing in them matches; input clears on map load or template switch
- **Share via URL** — "Share" button in the header encodes the full current map (hotkeys, map name, layout, key map, custom categories) as base64 JSON in the URL hash (`#map=…`); URL is copied to clipboard with "Copied!" feedback; visiting a share link auto-loads the map on page open and immediately clears the hash from the address bar
- **Heat map mode** — "Heat Map" toggle button in the layout bar; when active, every key is colored by a Gaussian proximity score relative to all assigned keys — keys surrounded by dense clusters render hot (red → orange → yellow) and isolated or unassigned areas render cool (green → blue); button shows an accent-colored active state; heat map re-applies automatically when the layout changes; toggling off restores category colors

### Changed

- **Map name input** — now always shows a visible background and border (was transparent at rest); pencil icon added to the right edge of the field to make its editability explicit
- **Autocomplete key badge** — uses the same visual style as the popover header key badge (surface background, border, bottom ridge shadow) at a smaller scale (22px height) for visual consistency

---

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
