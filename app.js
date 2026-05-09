/* ── Constants ────────────────────────────────────────────────── */
const VERSION = '0.5.0';
const UNIT        = 44;
const GAP         = 4;
const FN_H        = 30;
const MIN_KB_SCALE = 0.45; // below this, cap and let the section scroll
const KB_PADDING   = 24;   // breathing room subtracted from available width

/* ── Analytics ────────────────────────────────────────────────── */
const _sessionCounts = { saves: 0, shares: 0, prints: 0, exports: 0, imports: 0 };

function track(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

/* ── Keyboard scaling state ───────────────────────────────────── */
let _kbNaturalW      = 0;
let _kbNaturalH      = 0;
let _kbScaleObserver = null;

const LAYOUTS = [
  { id: 'full',       name: 'Full (104-key)'    },
  { id: 'tkl',        name: 'Tenkeyless (TKL)'  },
  { id: '60',         name: '60%'               },
  { id: 'split',      name: 'Split'             },
  { id: 'voyager',    name: 'ZSA Voyager'       },
  { id: 'moonlander', name: 'ZSA Moonlander'    },
  { id: 'ergodox',    name: 'ErgoDox EZ'        },
];

const ZSA_IDS = new Set(['voyager', 'moonlander', 'ergodox']);

// Primary label overrides per key map (unrecognised keys fall through to default)
const KEY_MAPS = {
  qwerty:  {},
  dvorak:  {
    KeyQ:"'", KeyW:',', KeyE:'.', KeyR:'P', KeyT:'Y',
    KeyY:'F', KeyU:'G', KeyI:'C', KeyO:'R', KeyP:'L',
    KeyS:'O', KeyD:'E', KeyF:'U', KeyG:'I',
    KeyH:'D', KeyJ:'H', KeyK:'T', KeyL:'N', Semicolon:'S', Quote:'-',
    KeyZ:';', KeyX:'Q', KeyC:'J', KeyV:'K', KeyB:'X',
    KeyN:'B', Comma:'W', Period:'V', Slash:'Z',
    Minus:'[', Equal:']', BracketLeft:'/', BracketRight:'=',
  },
  colemak: {
    KeyE:'F', KeyR:'P', KeyT:'G', KeyY:'J', KeyU:'L',
    KeyI:'U', KeyO:'Y', KeyP:';',
    KeyS:'R', KeyD:'S', KeyF:'T', KeyG:'D',
    KeyJ:'N', KeyK:'E', KeyL:'I', Semicolon:'O',
    KeyN:'K',
  },
  azerty:  {
    KeyQ:'A', KeyW:'Z', KeyA:'Q', KeyZ:'W',
    Semicolon:'M', KeyM:',',
  },
  qwertz:  {
    KeyY:'Z', KeyZ:'Y',
  },
};

const VALID_LAYOUTS  = new Set(LAYOUTS.map(l => l.id));
const VALID_KEY_MAPS = new Set(Object.keys(KEY_MAPS));
const SUMMARY_COLS     = 4;
const SUMMARY_CAT_WRAP = 8; // items before a category spills into the next column

// Key IDs after which a visual split gap is inserted in split layout
const SPLIT_AFTER = new Set(['Digit5', 'KeyT', 'KeyG', 'KeyB', 'Space']);
const SPLIT_GAP   = 28; // px

const DEFAULT_CATEGORIES = [
  { id: 'movement',  name: 'Movement',     color: '#3b82f6' },
  { id: 'edit',      name: 'Edit / Undo',  color: '#f97316' },
  { id: 'selection', name: 'Selection',    color: '#a855f7' },
  { id: 'file',      name: 'File / Save',  color: '#22c55e' },
  { id: 'view',      name: 'View / Zoom',  color: '#06b6d4' },
  { id: 'tool',      name: 'Tool / Mode',  color: '#ef4444' },
  { id: 'combat',    name: 'Combat',       color: '#eab308' },
  { id: 'custom',    name: 'Custom',       color: '#ec4899' },
];

/* ── Layout data ──────────────────────────────────────────────── */
// width in units (default 1). type:'gap' = invisible spacer.
// alpha:true makes the label render larger (single-char keys).

const MAIN_ROWS = [
  { fn: true, keys: [
    { id:'Escape',        label:'Esc' },
    { type:'gap', width:0.5 },
    { id:'F1',  label:'F1'  }, { id:'F2',  label:'F2'  },
    { id:'F3',  label:'F3'  }, { id:'F4',  label:'F4'  },
    { type:'gap', width:0.5 },
    { id:'F5',  label:'F5'  }, { id:'F6',  label:'F6'  },
    { id:'F7',  label:'F7'  }, { id:'F8',  label:'F8'  },
    { type:'gap', width:0.5 },
    { id:'F9',  label:'F9'  }, { id:'F10', label:'F10' },
    { id:'F11', label:'F11' }, { id:'F12', label:'F12' },
  ]},
  { keys: [
    { id:'Backquote',    label:'`',  sub:'~' },
    { id:'Digit1',       label:'1',  sub:'!' },
    { id:'Digit2',       label:'2',  sub:'@' },
    { id:'Digit3',       label:'3',  sub:'#' },
    { id:'Digit4',       label:'4',  sub:'$' },
    { id:'Digit5',       label:'5',  sub:'%' },
    { id:'Digit6',       label:'6',  sub:'^' },
    { id:'Digit7',       label:'7',  sub:'&' },
    { id:'Digit8',       label:'8',  sub:'*' },
    { id:'Digit9',       label:'9',  sub:'(' },
    { id:'Digit0',       label:'0',  sub:')' },
    { id:'Minus',        label:'-',  sub:'_' },
    { id:'Equal',        label:'=',  sub:'+' },
    { id:'Backspace',    label:'Backspace', width:2 },
  ]},
  { keys: [
    { id:'Tab',          label:'Tab',     width:1.5 },
    { id:'KeyQ', label:'Q', alpha:true }, { id:'KeyW', label:'W', alpha:true },
    { id:'KeyE', label:'E', alpha:true }, { id:'KeyR', label:'R', alpha:true },
    { id:'KeyT', label:'T', alpha:true }, { id:'KeyY', label:'Y', alpha:true },
    { id:'KeyU', label:'U', alpha:true }, { id:'KeyI', label:'I', alpha:true },
    { id:'KeyO', label:'O', alpha:true }, { id:'KeyP', label:'P', alpha:true },
    { id:'BracketLeft',  label:'[', sub:'{' },
    { id:'BracketRight', label:']', sub:'}' },
    { id:'Backslash',    label:'\\', sub:'|', width:1.5 },
  ]},
  { keys: [
    { id:'CapsLock',     label:'Caps Lock', width:1.75 },
    { id:'KeyA', label:'A', alpha:true }, { id:'KeyS', label:'S', alpha:true },
    { id:'KeyD', label:'D', alpha:true }, { id:'KeyF', label:'F', alpha:true },
    { id:'KeyG', label:'G', alpha:true }, { id:'KeyH', label:'H', alpha:true },
    { id:'KeyJ', label:'J', alpha:true }, { id:'KeyK', label:'K', alpha:true },
    { id:'KeyL', label:'L', alpha:true },
    { id:'Semicolon',    label:';', sub:':' },
    { id:'Quote',        label:"'", sub:'"' },
    { id:'Enter',        label:'Enter', width:2.25 },
  ]},
  { keys: [
    { id:'ShiftLeft',    label:'Shift', width:2.25 },
    { id:'KeyZ', label:'Z', alpha:true }, { id:'KeyX', label:'X', alpha:true },
    { id:'KeyC', label:'C', alpha:true }, { id:'KeyV', label:'V', alpha:true },
    { id:'KeyB', label:'B', alpha:true }, { id:'KeyN', label:'N', alpha:true },
    { id:'KeyM', label:'M', alpha:true },
    { id:'Comma',        label:',', sub:'<' },
    { id:'Period',       label:'.', sub:'>' },
    { id:'Slash',        label:'/', sub:'?' },
    { id:'ShiftRight',   label:'Shift', width:2.75 },
  ]},
  { keys: [
    { id:'ControlLeft',  label:'Ctrl', width:1.25 },
    { id:'MetaLeft',     label:'⊞',   width:1.25 },
    { id:'AltLeft',      label:'Alt',  width:1.25 },
    { id:'Space',        label:'Space', width:6.25 },
    { id:'AltRight',     label:'Alt',  width:1.25 },
    { id:'MetaRight',    label:'⊞',   width:1.25 },
    { id:'ContextMenu',  label:'☰',   width:1.25 },
    { id:'ControlRight', label:'Ctrl', width:1.25 },
  ]},
];

const NAV_ROWS = [
  { fn: true, keys: [
    { id:'PrintScreen', label:'PrtSc' },
    { id:'ScrollLock',  label:'ScrLk' },
    { id:'Pause',       label:'Pause' },
  ]},
  { keys: [
    { id:'Insert',   label:'Ins'  },
    { id:'Home',     label:'Home' },
    { id:'PageUp',   label:'PgUp' },
  ]},
  { keys: [
    { id:'Delete',   label:'Del'  },
    { id:'End',      label:'End'  },
    { id:'PageDown', label:'PgDn' },
  ]},
  { spacer: true },
  { keys: [
    { type:'gap', width:1 },
    { id:'ArrowUp',   label:'↑' },
    { type:'gap', width:1 },
  ]},
  { keys: [
    { id:'ArrowLeft',  label:'←' },
    { id:'ArrowDown',  label:'↓' },
    { id:'ArrowRight', label:'→' },
  ]},
];

// Numpad uses CSS Grid with explicit column/row placement.
// col/row are 1-based. w/h are span counts.
const NUMPAD_KEYS = [
  { id:'NumLock',        label:'Num\nLk',     col:1, row:1, w:1, h:1 },
  { id:'NumpadDivide',   label:'/',            col:2, row:1, w:1, h:1 },
  { id:'NumpadMultiply', label:'×',            col:3, row:1, w:1, h:1 },
  { id:'NumpadSubtract', label:'−',            col:4, row:1, w:1, h:1 },
  { id:'Numpad7',        label:'7', sub:'Hm',  col:1, row:2, w:1, h:1 },
  { id:'Numpad8',        label:'8', sub:'↑',   col:2, row:2, w:1, h:1 },
  { id:'Numpad9',        label:'9', sub:'Pu',  col:3, row:2, w:1, h:1 },
  { id:'NumpadAdd',      label:'+',            col:4, row:2, w:1, h:2 },
  { id:'Numpad4',        label:'4', sub:'←',   col:1, row:3, w:1, h:1 },
  { id:'Numpad5',        label:'5', sub:'·',   col:2, row:3, w:1, h:1 },
  { id:'Numpad6',        label:'6', sub:'→',   col:3, row:3, w:1, h:1 },
  { id:'Numpad1',        label:'1', sub:'En',  col:1, row:4, w:1, h:1 },
  { id:'Numpad2',        label:'2', sub:'↓',   col:2, row:4, w:1, h:1 },
  { id:'Numpad3',        label:'3', sub:'Pd',  col:3, row:4, w:1, h:1 },
  { id:'NumpadEnter',    label:'Enter',         col:4, row:4, w:1, h:2 },
  { id:'Numpad0',        label:'0', sub:'Ins',  col:1, row:5, w:2, h:1 },
  { id:'NumpadDecimal',  label:'.', sub:'Del',  col:3, row:5, w:1, h:1 },
];

/* ── ZSA Split Ergonomic Keyboards ───────────────────────────── */
// Column-stagger layout: each column has a `stagger` (px drop from the top
// reference line) and an array of `keys` stacked top-to-bottom.
// thumbCols: column count for the thumb key grid (1 = flat row).
// thumbOffset: left margin (px) of the thumb area — right-align on left halves.

const ZSA_STAGGER = { outer:20, pinky:12, ring:6, mid:0, index:6, inner:10, extra:58 };

const ZSA_KEYBOARDS = {
  voyager: {
    halfGap: 40,
    halves: [
      {
        side: 'left', thumbCols: 2,
        columns: [
          { stagger: ZSA_STAGGER.outer, keys: [
            { id:'Escape',    label:'Esc'   },
            { id:'Tab',       label:'Tab'   },
            { id:'CapsLock',  label:'Caps'  },
            { id:'ShiftLeft', label:'⇧'    },
          ]},
          { stagger: ZSA_STAGGER.pinky, keys: [
            { id:'Digit1', label:'1', sub:'!' },
            { id:'KeyQ',   label:'Q', alpha:true },
            { id:'KeyA',   label:'A', alpha:true },
            { id:'KeyZ',   label:'Z', alpha:true },
          ]},
          { stagger: ZSA_STAGGER.ring, keys: [
            { id:'Digit2', label:'2', sub:'@' },
            { id:'KeyW',   label:'W', alpha:true },
            { id:'KeyS',   label:'S', alpha:true },
            { id:'KeyX',   label:'X', alpha:true },
          ]},
          { stagger: ZSA_STAGGER.mid, keys: [
            { id:'Digit3', label:'3', sub:'#' },
            { id:'KeyE',   label:'E', alpha:true },
            { id:'KeyD',   label:'D', alpha:true },
            { id:'KeyC',   label:'C', alpha:true },
          ]},
          { stagger: ZSA_STAGGER.index, keys: [
            { id:'Digit4', label:'4', sub:'$' },
            { id:'KeyR',   label:'R', alpha:true },
            { id:'KeyF',   label:'F', alpha:true },
            { id:'KeyV',   label:'V', alpha:true },
          ]},
          { stagger: ZSA_STAGGER.inner, keys: [
            { id:'Digit5', label:'5', sub:'%' },
            { id:'KeyT',   label:'T', alpha:true },
            { id:'KeyG',   label:'G', alpha:true },
            { id:'KeyB',   label:'B', alpha:true },
          ]},
        ],
        thumbs: [
          { id:'VoyThL1', label:'' },
          { id:'VoyThL2', label:'' },
        ],
      },
      {
        side: 'right', thumbCols: 2,
        columns: [
          { stagger: ZSA_STAGGER.inner, keys: [
            { id:'Digit6', label:'6', sub:'^' },
            { id:'KeyY',   label:'Y', alpha:true },
            { id:'KeyH',   label:'H', alpha:true },
            { id:'KeyN',   label:'N', alpha:true },
          ]},
          { stagger: ZSA_STAGGER.index, keys: [
            { id:'Digit7', label:'7', sub:'&' },
            { id:'KeyU',   label:'U', alpha:true },
            { id:'KeyJ',   label:'J', alpha:true },
            { id:'KeyM',   label:'M', alpha:true },
          ]},
          { stagger: ZSA_STAGGER.mid, keys: [
            { id:'Digit8', label:'8', sub:'*' },
            { id:'KeyI',   label:'I', alpha:true },
            { id:'KeyK',   label:'K', alpha:true },
            { id:'Comma',  label:',', sub:'<' },
          ]},
          { stagger: ZSA_STAGGER.ring, keys: [
            { id:'Digit9',    label:'9', sub:'(' },
            { id:'KeyO',      label:'O', alpha:true },
            { id:'KeyL',      label:'L', alpha:true },
            { id:'Period',    label:'.', sub:'>' },
          ]},
          { stagger: ZSA_STAGGER.pinky, keys: [
            { id:'Digit0',    label:'0', sub:')' },
            { id:'KeyP',      label:'P', alpha:true },
            { id:'Semicolon', label:';', sub:':' },
            { id:'Slash',     label:'/', sub:'?' },
          ]},
          { stagger: ZSA_STAGGER.outer, keys: [
            { id:'Minus',      label:'-', sub:'_' },
            { id:'Equal',      label:'=', sub:'+' },
            { id:'Quote',      label:"'", sub:'"' },
            { id:'ShiftRight', label:'⇧' },
          ]},
        ],
        thumbs: [
          { id:'VoyThR1', label:'' },
          { id:'VoyThR2', label:'' },
        ],
      },
    ],
  },

  moonlander: {
    halfGap: 32,
    halves: [
      {
        side: 'left', thumbCols: 3, thumbLayout: 'moonlander',
        columns: [
          { stagger: ZSA_STAGGER.outer, keys: [
            { id:'Escape',      label:'Esc'  },
            { id:'Tab',         label:'Tab'  },
            { id:'CapsLock',    label:'Caps' },
            { id:'ShiftLeft',   label:'⇧'   },
            { id:'Backquote',   label:'`', sub:'~' },
          ]},
          { stagger: ZSA_STAGGER.pinky, keys: [
            { id:'Digit1',   label:'1', sub:'!' },
            { id:'KeyQ',     label:'Q', alpha:true },
            { id:'KeyA',     label:'A', alpha:true },
            { id:'KeyZ',     label:'Z', alpha:true },
            { id:'AltLeft',  label:'Alt' },
          ]},
          { stagger: ZSA_STAGGER.ring, keys: [
            { id:'Digit2',    label:'2', sub:'@' },
            { id:'KeyW',      label:'W', alpha:true },
            { id:'KeyS',      label:'S', alpha:true },
            { id:'KeyX',      label:'X', alpha:true },
            { id:'MetaLeft',  label:'⊞' },
          ]},
          { stagger: ZSA_STAGGER.mid, keys: [
            { id:'Digit3',     label:'3', sub:'#' },
            { id:'KeyE',       label:'E', alpha:true },
            { id:'KeyD',       label:'D', alpha:true },
            { id:'KeyC',       label:'C', alpha:true },
            { id:'MndrBotL1',  label:'' },
          ]},
          { stagger: ZSA_STAGGER.index, keys: [
            { id:'Digit4',     label:'4', sub:'$' },
            { id:'KeyR',       label:'R', alpha:true },
            { id:'KeyF',       label:'F', alpha:true },
            { id:'KeyV',       label:'V', alpha:true },
            { id:'MndrBotL2',  label:'' },
          ]},
          { stagger: ZSA_STAGGER.inner, keys: [
            { id:'Digit5',     label:'5', sub:'%' },
            { id:'KeyT',       label:'T', alpha:true },
            { id:'KeyG',       label:'G', alpha:true },
            { id:'KeyB',       label:'B', alpha:true },
            { id:'MndrBotL3',  label:'' },
          ]},
          // Inner extra column: starts at top-alpha row, 3 keys
          { stagger: ZSA_STAGGER.extra, keys: [
            { id:'BracketLeft', label:'[', sub:'{' },
            { id:'MndrInL1',    label:'' },
            { id:'MndrInL2',    label:'' },
          ]},
        ],
        thumbs: [
          { id:'MndrThL1', label:'', width:2 },  // main (large) key — 2 units wide
          { id:'MndrThL2', label:'' },
          { id:'MndrThL3', label:'' },
          { id:'MndrThL4', label:'' },
        ],
      },
      {
        side: 'right', thumbCols: 3, thumbLayout: 'moonlander',
        columns: [
          // Inner extra column (mirrored, leftmost on right half)
          { stagger: ZSA_STAGGER.extra, keys: [
            { id:'BracketRight', label:']', sub:'}' },
            { id:'MndrInR1',     label:'' },
            { id:'MndrInR2',     label:'' },
          ]},
          { stagger: ZSA_STAGGER.inner, keys: [
            { id:'Digit6',     label:'6', sub:'^' },
            { id:'KeyY',       label:'Y', alpha:true },
            { id:'KeyH',       label:'H', alpha:true },
            { id:'KeyN',       label:'N', alpha:true },
            { id:'MndrBotR1',  label:'' },
          ]},
          { stagger: ZSA_STAGGER.index, keys: [
            { id:'Digit7',     label:'7', sub:'&' },
            { id:'KeyU',       label:'U', alpha:true },
            { id:'KeyJ',       label:'J', alpha:true },
            { id:'KeyM',       label:'M', alpha:true },
            { id:'MndrBotR2',  label:'' },
          ]},
          { stagger: ZSA_STAGGER.mid, keys: [
            { id:'Digit8',     label:'8', sub:'*' },
            { id:'KeyI',       label:'I', alpha:true },
            { id:'KeyK',       label:'K', alpha:true },
            { id:'Comma',      label:',', sub:'<' },
            { id:'MndrBotR3',  label:'' },
          ]},
          { stagger: ZSA_STAGGER.ring, keys: [
            { id:'Digit9',    label:'9', sub:'(' },
            { id:'KeyO',      label:'O', alpha:true },
            { id:'KeyL',      label:'L', alpha:true },
            { id:'Period',    label:'.', sub:'>' },
            { id:'MetaRight', label:'⊞' },
          ]},
          { stagger: ZSA_STAGGER.pinky, keys: [
            { id:'Digit0',    label:'0', sub:')' },
            { id:'KeyP',      label:'P', alpha:true },
            { id:'Semicolon', label:';', sub:':' },
            { id:'Slash',     label:'/', sub:'?' },
            { id:'AltRight',  label:'Alt' },
          ]},
          { stagger: ZSA_STAGGER.outer, keys: [
            { id:'Minus',         label:'-', sub:'_' },
            { id:'Equal',         label:'=', sub:'+' },
            { id:'Quote',         label:"'", sub:'"' },
            { id:'ShiftRight',    label:'⇧' },
            { id:'ControlRight',  label:'Ctrl' },
          ]},
        ],
        thumbs: [
          { id:'MndrThR1', label:'', width:2 },  // main (large) key — 2 units wide
          { id:'MndrThR2', label:'' },
          { id:'MndrThR3', label:'' },
          { id:'MndrThR4', label:'' },
        ],
      },
    ],
  },

  ergodox: {
    halfGap: 44,
    halves: [
      {
        side: 'left', thumbCols: 2,
        columns: [
          { stagger: ZSA_STAGGER.outer, keys: [
            { id:'Escape',       label:'Esc'  },
            { id:'Tab',          label:'Tab'  },
            { id:'CapsLock',     label:'Caps' },
            { id:'ShiftLeft',    label:'⇧'   },
            { id:'ControlLeft',  label:'Ctrl' },
          ]},
          { stagger: ZSA_STAGGER.pinky, keys: [
            { id:'Digit1',   label:'1', sub:'!' },
            { id:'KeyQ',     label:'Q', alpha:true },
            { id:'KeyA',     label:'A', alpha:true },
            { id:'KeyZ',     label:'Z', alpha:true },
            { id:'AltLeft',  label:'Alt' },
          ]},
          { stagger: ZSA_STAGGER.ring, keys: [
            { id:'Digit2',    label:'2', sub:'@' },
            { id:'KeyW',      label:'W', alpha:true },
            { id:'KeyS',      label:'S', alpha:true },
            { id:'KeyX',      label:'X', alpha:true },
            { id:'MetaLeft',  label:'⊞' },
          ]},
          { stagger: ZSA_STAGGER.mid, keys: [
            { id:'Digit3',    label:'3', sub:'#' },
            { id:'KeyE',      label:'E', alpha:true },
            { id:'KeyD',      label:'D', alpha:true },
            { id:'KeyC',      label:'C', alpha:true },
            { id:'EdoxBotL1', label:'' },
          ]},
          { stagger: ZSA_STAGGER.index, keys: [
            { id:'Digit4',    label:'4', sub:'$' },
            { id:'KeyR',      label:'R', alpha:true },
            { id:'KeyF',      label:'F', alpha:true },
            { id:'KeyV',      label:'V', alpha:true },
            { id:'EdoxBotL2', label:'' },
          ]},
          { stagger: ZSA_STAGGER.inner, keys: [
            { id:'Digit5',    label:'5', sub:'%' },
            { id:'KeyT',      label:'T', alpha:true },
            { id:'KeyG',      label:'G', alpha:true },
            { id:'KeyB',      label:'B', alpha:true },
            { id:'EdoxBotL3', label:'' },
          ]},
          // Inner extra column: 3 keys starting at top-alpha row
          { stagger: ZSA_STAGGER.extra, keys: [
            { id:'BracketLeft', label:'[', sub:'{' },
            { id:'EdoxInL1',    label:'' },
            { id:'EdoxInL2',    label:'' },
          ]},
        ],
        thumbs: [
          { id:'EdoxThL1', label:'' }, { id:'EdoxThL2', label:'' },
          { id:'EdoxThL3', label:'' }, { id:'EdoxThL4', label:'' },
          { id:'EdoxThL5', label:'' }, { id:'EdoxThL6', label:'' },
        ],
      },
      {
        side: 'right', thumbCols: 2,
        columns: [
          // Inner extra column (mirrored)
          { stagger: ZSA_STAGGER.extra, keys: [
            { id:'BracketRight', label:']', sub:'}' },
            { id:'EdoxInR1',     label:'' },
            { id:'EdoxInR2',     label:'' },
          ]},
          { stagger: ZSA_STAGGER.inner, keys: [
            { id:'Digit6',    label:'6', sub:'^' },
            { id:'KeyY',      label:'Y', alpha:true },
            { id:'KeyH',      label:'H', alpha:true },
            { id:'KeyN',      label:'N', alpha:true },
            { id:'EdoxBotR1', label:'' },
          ]},
          { stagger: ZSA_STAGGER.index, keys: [
            { id:'Digit7',    label:'7', sub:'&' },
            { id:'KeyU',      label:'U', alpha:true },
            { id:'KeyJ',      label:'J', alpha:true },
            { id:'KeyM',      label:'M', alpha:true },
            { id:'EdoxBotR2', label:'' },
          ]},
          { stagger: ZSA_STAGGER.mid, keys: [
            { id:'Digit8',    label:'8', sub:'*' },
            { id:'KeyI',      label:'I', alpha:true },
            { id:'KeyK',      label:'K', alpha:true },
            { id:'Comma',     label:',', sub:'<' },
            { id:'EdoxBotR3', label:'' },
          ]},
          { stagger: ZSA_STAGGER.ring, keys: [
            { id:'Digit9',    label:'9', sub:'(' },
            { id:'KeyO',      label:'O', alpha:true },
            { id:'KeyL',      label:'L', alpha:true },
            { id:'Period',    label:'.', sub:'>' },
            { id:'MetaRight', label:'⊞' },
          ]},
          { stagger: ZSA_STAGGER.pinky, keys: [
            { id:'Digit0',    label:'0', sub:')' },
            { id:'KeyP',      label:'P', alpha:true },
            { id:'Semicolon', label:';', sub:':' },
            { id:'Slash',     label:'/', sub:'?' },
            { id:'AltRight',  label:'Alt' },
          ]},
          { stagger: ZSA_STAGGER.outer, keys: [
            { id:'Backslash',     label:'\\', sub:'|' },
            { id:'Quote',         label:"'",  sub:'"' },
            { id:'ShiftRight',    label:'⇧'  },
            { id:'ControlRight',  label:'Ctrl' },
            { id:'Minus',         label:'-', sub:'_' },
          ]},
        ],
        thumbs: [
          { id:'EdoxThR1', label:'' }, { id:'EdoxThR2', label:'' },
          { id:'EdoxThR3', label:'' }, { id:'EdoxThR4', label:'' },
          { id:'EdoxThR5', label:'' }, { id:'EdoxThR6', label:'' },
        ],
      },
    ],
  },
};

/* ── App state ────────────────────────────────────────────────── */
const state = { hotkeys: {}, tabs: [{ id: 'tab-default', name: 'Default', hotkeys: {} }], activeTabId: 'tab-default', layout: 'full', keyMap: 'qwerty', categories: [], platform: 'windows', collapsedCats: new Set(), summarySettings: { overflow: false, overflowAt: 8, catOrder: [] }, catItemOrder: {} };

const MOD_MAP_MAC = { Ctrl: 'Cmd', Alt: 'Opt', Shift: 'Shift', Win: 'Cmd' };
function displayMod(mod) {
  return state.platform === 'mac' ? (MOD_MAP_MAC[mod] ?? mod) : mod;
}

// Returns a darkened version of a hex color by blending with black at the given ratio.
// Replaces color-mix() in JS contexts where CSS fallbacks aren't possible.
function darkenHex(hex, ratio = 0.4) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * ratio)},${Math.round(g * ratio)},${Math.round(b * ratio)})`;
}

function allCategories() {
  return state.categories;
}
let activeKeyId = null;

/* ── Theme ───────────────────────────────────────────────────── */
const THEME_KEY = 'keybindr-theme';
let _systemQuery = null;

function applyTheme(pref) {
  const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === pref);
  });
}

/* ── Keyboard scale (ResizeObserver) ──────────────────────────── */
function applyKbScale() {
  const section = document.querySelector('.keyboard-section');
  const wrap    = document.querySelector('.keyboard-scale-wrap');
  const scroll  = document.querySelector('.keyboard-scroll');
  if (!section || !wrap || !scroll || !_kbNaturalW) return;

  const scale = Math.min(1, section.clientWidth / _kbNaturalW);

  if (scale < 1) {
    // Pin scroll to its natural width so overflow:hidden doesn't pre-clip it
    scroll.style.width           = _kbNaturalW + 'px';
    scroll.style.transform       = `scale(${scale})`;
    scroll.style.transformOrigin = 'top left';
    // Scale border-radius inversely so it looks the same size at any zoom level
    scroll.style.borderRadius    = Math.round(16 / scale) + 'px';
    // Collapse the layout footprint to the visual size
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

function measureAndScaleKeyboard() {
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

function initKeyboardScale() {
  if (_kbScaleObserver) return;
  const section = document.querySelector('.keyboard-section');
  if (!section) return;
  _kbScaleObserver = new ResizeObserver(applyKbScale);
  _kbScaleObserver.observe(section);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);

  _systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
  _systemQuery.addEventListener('change', () => {
    if ((localStorage.getItem(THEME_KEY) || 'dark') === 'system') applyTheme('system');
  });

  document.getElementById('theme-picker').addEventListener('click', e => {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    const pref = btn.dataset.themeVal;
    localStorage.setItem(THEME_KEY, pref);
    track('theme_changed', { theme: pref });
    applyTheme(pref);
  });
}

/* ── Scheme ──────────────────────────────────────────────────── */
const SCHEME_KEY = 'keybindr-scheme';

const SCHEME_OPTIONS = [
  { label: 'Default',   value: 'default' },
  { label: 'Synthwave', value: 'synthwave' },
  { label: 'Phosphor',  value: 'phosphor' },
  { label: 'Crimson',   value: 'crimson' },
  { label: 'Forge',     value: 'forge' },
];

function applyScheme(scheme) {
  document.documentElement.setAttribute('data-scheme', scheme);
  const btn = document.getElementById('scheme-picker');
  if (btn) {
    const opt = SCHEME_OPTIONS.find(o => o.value === scheme);
    btn.querySelector('.select-label').textContent = opt ? opt.label : scheme;
  }
}

function initScheme() {
  const saved = localStorage.getItem(SCHEME_KEY) || 'default';
  applyScheme(saved);

  document.getElementById('scheme-picker').addEventListener('click', e => {
    const current = localStorage.getItem(SCHEME_KEY) || 'default';
    showActionDropdown(e.currentTarget, SCHEME_OPTIONS.map(opt => ({
      ...opt,
      selected: opt.value === current,
      action: () => {
        localStorage.setItem(SCHEME_KEY, opt.value);
        track('scheme_changed', { scheme: opt.value });
        applyScheme(opt.value);
      }
    })));
  });
}

/* ── Helpers ──────────────────────────────────────────────────── */
const u = (n = 1) => UNIT * n + GAP * (n - 1);

function getKeyLabel(key) {
  const overrides = KEY_MAPS[state.keyMap];
  if (overrides && key.id in overrides) return overrides[key.id];
  return key.label || '';
}

function findKeyDef(id) {
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
function makeKey(key, gridManaged = false) {
  const el = document.createElement('button');
  el.className = 'key';
  el.dataset.id = key.id;
  el.tabIndex = 0;
  if (key.alpha) el.dataset.alpha = '';

  if (!gridManaged) {
    el.style.width = u(key.width || 1) + 'px';
  }

  el.addEventListener('click', () => openPopover(key.id));
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopover(key.id); }});
  el.addEventListener('mouseenter', () => { if (state.hotkeys[key.id]) setHoverHighlight(key.id); });
  el.addEventListener('mouseleave', clearHoverHighlight);

  refreshKeyEl(el, key);
  return el;
}

function refreshKeyEl(el, key) {
  const hotkey = state.hotkeys[key.id];
  el.innerHTML = '';

  if (hotkey) {
    el.classList.add('has-hotkey');
    const cat = allCategories().find(c => c.id === hotkey.category);
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

/* ── Rendering ────────────────────────────────────────────────── */
function renderRows(rows, container, hideFn = false) {
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

function renderNumpad(container) {
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
function renderZSAKeyboard(kbId) {
  const kb      = ZSA_KEYBOARDS[kbId];
  const kbEl    = document.getElementById('keyboard');
  kbEl.style.paddingBottom = '';
  kbEl.classList.add('zsa-split-mode');
  document.querySelector('.keyboard-scroll').classList.add('zsa-split-mode');

  const wrap = document.createElement('div');
  wrap.className = 'zsa-halves';
  wrap.style.gap = kb.halfGap + 'px';

  kb.halves.forEach(half => {
    const halfEl = document.createElement('div');
    halfEl.className = 'zsa-half';

    // Main columnar block
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

    // Thumb area
    if (half.thumbs?.length) {
      const thumbArea = document.createElement('div');
      thumbArea.className = 'zsa-thumb-area';

      // Push thumbs toward the inner (gap) edge of each half
      const totalColW = half.columns.length * (UNIT + GAP) - GAP;
      const thumbW    = half.thumbCols  * (UNIT + GAP) - GAP;
      const offset    = half.side === 'left' ? totalColW - thumbW : 0;
      thumbArea.style.marginLeft = offset + 'px';

      if (half.thumbLayout === 'moonlander') {
        // Left:  [ main (2-wide) ]        Right:      [ main (2-wide) ]
        //        [ t1 ][ t2 ][ t3 ]               [ t1 ][ t2 ][ t3 ]
        // Cluster rotated 40° CW (left) / 40° CCW (right) from its inner corner
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

        // Nudge clusters: 75px down, 70px inward toward the centre gap
        thumbArea.style.marginTop  = '75px';
        thumbArea.style.marginLeft = (half.side === 'left' ? offset + 70 : -70) + 'px';

        // Rotate around the inner top corner (where the cluster meets the keyboard body)
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

function renderKeyboard() {
  const kb = document.getElementById('keyboard');
  kb.innerHTML = '';
  kb.classList.remove('zsa-split-mode');
  document.querySelector('.keyboard-scroll').classList.remove('zsa-split-mode');

  if (ZSA_IDS.has(state.layout)) {
    renderZSAKeyboard(state.layout);
    reapplyFilter();
    if (heatmapActive) applyHeatmap();
    measureAndScaleKeyboard();
    return;
  }
  kb.style.paddingBottom = '';

  const hideFn    = state.layout === '60' || state.layout === 'split';
  const showNav   = state.layout === 'full' || state.layout === 'tkl';
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
  reapplyFilter();
  if (heatmapActive) applyHeatmap();
  measureAndScaleKeyboard();
}

function refreshKey(keyId) {
  const el = document.querySelector(`.key[data-id="${keyId}"]`);
  if (!el) return;
  const def = findKeyDef(keyId);
  if (def) refreshKeyEl(el, def);
}

/* ── Hover cross-highlight ────────────────────────────────────── */
function setHoverHighlight(keyId) {
  clearHoverHighlight();
  document.querySelector(`.key[data-id="${keyId}"]`)?.classList.add('pair-highlight');
  document.querySelector(`.summary-item[data-key-id="${keyId}"]`)?.classList.add('pair-highlight');
  showKeyTooltip(keyId);
}

function clearHoverHighlight() {
  document.querySelectorAll('.pair-highlight').forEach(el => el.classList.remove('pair-highlight'));
  hideKeyTooltip();
}

/* ── Category hover highlight ─────────────────────────────────── */
function setCategoryHighlight(catId) {
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

function clearCategoryHighlight() {
  document.getElementById('keyboard')?.classList.remove('cat-dim');
  document.querySelectorAll('.cat-highlight, .summary-group.cat-dim')
    .forEach(el => el.classList.remove('cat-highlight', 'cat-dim'));
}

/* ── Key tooltip ──────────────────────────────────────────────── */
let _tooltipTarget = null;

function showKeyTooltip(keyId) {
  const hotkey = state.hotkeys[keyId];
  if (!hotkey) return;

  const tip = document.getElementById('key-tooltip');
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
  const cat = allCategories().find(c => c.id === hotkey.category);
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

function positionTooltip(tip, keyEl) {
  const rect = keyEl.getBoundingClientRect();
  const tipW = tip.offsetWidth || 180;
  const tipH = tip.offsetHeight || 80;
  const gap = 8;

  let left = rect.left + rect.width / 2 - tipW / 2;
  let top = rect.top - tipH - gap;

  if (top < 8) top = rect.bottom + gap;
  if (left < 8) left = 8;
  if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;

  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}

function hideKeyTooltip() {
  const tip = document.getElementById('key-tooltip');
  if (tip) tip.hidden = true;
  _tooltipTarget = null;
}

/* ── Undo / Redo ──────────────────────────────────────────────── */
const UNDO_LIMIT = 50;
let undoStack = [];
let redoStack = [];

function snapshotState() {
  return {
    hotkeys: JSON.parse(JSON.stringify(state.hotkeys)),
    mapName: document.getElementById('map-name').value,
  };
}

function pushUndo() {
  undoStack.push(snapshotState());
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}

function applySnapshot(snap) {
  state.hotkeys = snap.hotkeys;
  document.getElementById('map-name').value = snap.mapName;
  renderKeyboard();
  renderLegend();
  renderSummary();
  saveToStorage();
  updateUndoRedoButtons();
}

function undoAction() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  applySnapshot(undoStack.pop());
  track('undo_used');
}

function redoAction() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  applySnapshot(redoStack.pop());
  track('redo_used');
}

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = undoStack.length === 0;
  if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}

/* ── Heat map ─────────────────────────────────────────────────── */
let heatmapActive = false;

function applyHeatmap() {
  const keys = [...document.querySelectorAll('#keyboard .key')];
  if (!keys.length) return;

  const assignedIds = new Set(Object.keys(state.hotkeys));
  if (!assignedIds.size) return;

  const centers = new Map();
  keys.forEach(el => {
    const r = el.getBoundingClientRect();
    centers.set(el.dataset.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  });

  const assignedCenters = [...assignedIds]
    .map(id => centers.get(id))
    .filter(Boolean);

  const scores = new Map();
  const SIGMA = 90;
  keys.forEach(el => {
    const c = centers.get(el.dataset.id);
    if (!c) return;
    let score = 0;
    assignedCenters.forEach(ac => {
      const dx = c.x - ac.x, dy = c.y - ac.y;
      score += Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA));
    });
    scores.set(el, score);
  });

  const vals = [...scores.values()];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  scores.forEach((score, el) => {
    const t = (score - min) / range;
    const hue = Math.round(240 - t * 240);
    const sat = Math.round(45 + t * 40);
    const lit = Math.round(20 + t * 22);
    el.style.background = `hsl(${hue}, ${sat}%, ${lit}%)`;
    el.style.setProperty('box-shadow',
      `0 3px 0 hsl(${hue}, ${sat}%, ${lit - 10}%), 0 1px 2px rgba(0,0,0,0.5)`);
  });
}

function clearHeatmap() {
  document.querySelectorAll('#keyboard .key').forEach(el => {
    el.style.background = '';
    el.style.removeProperty('box-shadow');
  });
}

function toggleHeatmap() {
  heatmapActive = !heatmapActive;
  track('heatmap_toggled', { active: heatmapActive });
  document.getElementById('btn-heatmap').classList.toggle('btn-on', heatmapActive);
  if (heatmapActive) {
    applyHeatmap();
  } else {
    renderKeyboard();
    renderLegend();
  }
}

/* ── Category filter ──────────────────────────────────────────── */
let filterCat = null;

function renderLegendActivePreview() {
  const preview = document.getElementById('legend-active-preview');
  if (!preview) return;
  preview.innerHTML = '';
  if (!filterCat) return;
  const cat = allCategories().find(c => c.id === filterCat);
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

function applyFilter(catId) {
  filterCat = filterCat === catId ? null : catId;
  reapplyFilter();

  document.querySelectorAll('.cat-chip').forEach(el => {
    el.classList.toggle('cat-active', el.dataset.catId === filterCat);
  });
  renderLegendActivePreview();
}

function reapplyFilter() {
  if (filterCat) setCategoryHighlight(filterCat);
  else clearCategoryHighlight();
}

/* ── Hotkey summary ───────────────────────────────────────────── */
let _catDragState  = null; // pointer-event cat drag: { catId, groupEl, ghostEl, offsetX, offsetY, targetGroupEl, targetBefore, targetColEl }
let _dragItemId    = null;
let _dragItemCatId = null;

function initSummaryCols() {
  if (!state.summaryCols || state.summaryCols.length !== SUMMARY_COLS) {
    // Count assigned hotkeys per category for LPT bin-packing
    const itemCounts = {};
    Object.values(state.hotkeys).forEach(hk => {
      if (hk.category) itemCounts[hk.category] = (itemCounts[hk.category] || 0) + 1;
    });
    // Sort categories heaviest-first so large groups spread across columns
    const sorted = [...allCategories()].sort((a, b) => (itemCounts[b.id] || 0) - (itemCounts[a.id] || 0));
    const colTotals = Array(SUMMARY_COLS).fill(0);
    state.summaryCols = Array.from({ length: SUMMARY_COLS }, () => []);
    sorted.forEach(cat => {
      const minCol = colTotals.indexOf(Math.min(...colTotals));
      state.summaryCols[minCol].push(cat.id);
      colTotals[minCol] += (itemCounts[cat.id] || 0);
    });
  }
  // Ensure any category not yet in a column is added to the shortest one
  const present = new Set(state.summaryCols.flat());
  allCategories().forEach(cat => {
    if (!present.has(cat.id)) {
      const col = state.summaryCols.reduce((mi, c, i, a) => c.length < a[mi].length ? i : mi, 0);
      state.summaryCols[col].push(cat.id);
    }
  });
}

function clearDragIndicators() {
  document.querySelectorAll('.drop-before, .drop-after').forEach(el =>
    el.classList.remove('drop-before', 'drop-after'));
  document.querySelectorAll('.summary-col.drag-over').forEach(el =>
    el.classList.remove('drag-over'));
}

function clearItemDragIndicators() {
  document.querySelectorAll('.item-drop-before, .item-drop-after').forEach(el =>
    el.classList.remove('item-drop-before', 'item-drop-after'));
  document.querySelectorAll('.items-drag-target').forEach(el =>
    el.classList.remove('items-drag-target'));
}

/* ── Category drag (pointer events) ──────────────────────────── */
function startCatDrag(catId, groupEl, e, clickEl) {
  const hdr = groupEl.querySelector('.summary-group-header');
  const ghostEl = hdr.cloneNode(true);
  ghostEl.className = 'cat-drag-ghost';
  ghostEl.style.width = groupEl.getBoundingClientRect().width + 'px';
  const catColor = groupEl.style.getPropertyValue('--cat-color');
  if (catColor) ghostEl.style.setProperty('--cat-color', catColor);
  document.body.appendChild(ghostEl);

  // Use clickEl's rect for offset when drag starts on a different element (e.g. continuation)
  const rect = (clickEl || groupEl).getBoundingClientRect();
  _catDragState = { catId, groupEl, ghostEl,
    offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
    targetGroupEl: null, targetBefore: false, targetColEl: null };
  document.querySelectorAll(`.summary-group[data-cat-id="${catId}"]`).forEach(el => el.classList.add('dragging'));

  document.addEventListener('pointermove', onCatDragMove);
  document.addEventListener('pointerup',   onCatDragEnd);
  document.addEventListener('pointercancel', onCatDragEnd);
  document.addEventListener('keydown',     onCatDragKeydown);
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

  // Only show a group indicator when hovering over a header — avoids false
  // positives from hovering over the items area of tall categories
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
      // When hovering below all groups (in the padding zone), show drop-after
      // on the last group so "append to column" has a clear visual target
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
    // In overflow mode, highlight the nearest valid group even when cursor is
    // over the dragged category's own columns — gives clear drop feedback
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

function snapshotLayoutFromDOM() {
  const cols = document.querySelectorAll('.summary-col');
  if (!cols.length) return;
  state.summaryCols = [...cols].map(col =>
    [...col.querySelectorAll('.summary-group[data-cat-id]:not(.summary-group-cont)')].map(g => g.dataset.catId)
  );
  state.summarySettings.overflow = false;
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

function normalizeItemOrder() {
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

function moveItemInSummary(keyId, srcCatId, tgtCatId, targetKeyId, before) {
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
  renderLegend();
  renderSummary();
}

function moveCategoryInOverflowOrder(srcId, targetId, before) {
  const order = [...(state.summarySettings.catOrder || [])];
  const filtered = order.filter(id => id !== srcId);
  const tgtIdx = filtered.indexOf(targetId);
  if (tgtIdx === -1) {
    filtered.push(srcId);
  } else {
    filtered.splice(before ? tgtIdx : tgtIdx + 1, 0, srcId);
  }
  state.summarySettings.catOrder = filtered;
  saveToStorage();
  renderSummary();
}

function moveCategoryInLayout(srcId, targetId, before) {
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

function moveCategoryToColumn(srcId, colIdx) {
  state.summaryCols.forEach(col => {
    const i = col.indexOf(srcId);
    if (i !== -1) col.splice(i, 1);
  });
  state.summaryCols[colIdx].push(srcId);
  saveToStorage();
  renderSummary();
}

function getOrderedHotkeys() {
  const result = [];
  const seen = new Set();
  const add = key => {
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

function makeSummaryItem({ hk, def, keyId }) {
  const mods = hk.modifiers || [];
  const keyLabel = def ? getKeyLabel(def) : keyId;

  const item = document.createElement('div');
  item.className = 'summary-item';
  item.dataset.keyId = keyId;
  item.draggable = true;
  item.addEventListener('mouseenter', () => setHoverHighlight(keyId));
  item.addEventListener('mouseleave', clearHoverHighlight);
  item.addEventListener('click', () => {
    populateCategorySelect();
    openPopover(keyId);
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
    e.preventDefault(); // must always accept so drop fires here and can bubble to group
    if (!_dragItemId || _dragItemId === keyId) return;
    e.stopPropagation();
    clearItemDragIndicators();
    const before = e.clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2;
    item.classList.add(before ? 'item-drop-before' : 'item-drop-after');
  });
  item.addEventListener('drop', e => {
    if (!_dragItemId || _dragItemId === keyId) return; // bubbles to group for category drags
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

function makeSummaryGroup(cat, items, totalCount) {
  const isCollapsed = state.collapsedCats.has(cat.id);
  if (totalCount === undefined) totalCount = items.length;
  const group = document.createElement('div');
  group.className = 'summary-group' + (isCollapsed ? ' collapsed' : '');
  group.dataset.catId = cat.id;
  group.style.setProperty('--cat-color', cat.color);

  // Item-drop handlers (category drag is pointer-event based, handled globally)
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

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'summary-group-header';

  const grip = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  grip.setAttribute('class', 'summary-grip');
  grip.setAttribute('viewBox', '0 0 8 14');
  grip.setAttribute('width', '8');
  grip.setAttribute('height', '14');
  grip.innerHTML = '<circle cx="2" cy="2" r="1.2" fill="currentColor"/><circle cx="6" cy="2" r="1.2" fill="currentColor"/><circle cx="2" cy="7" r="1.2" fill="currentColor"/><circle cx="6" cy="7" r="1.2" fill="currentColor"/><circle cx="2" cy="12" r="1.2" fill="currentColor"/><circle cx="6" cy="12" r="1.2" fill="currentColor"/>';
  hdr.appendChild(grip);

  // Drag on the whole header (threshold prevents accidental drags from plain clicks)
  hdr.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.summary-collapse-btn')) return;
    e.preventDefault(); // must be here — prevents browser text-select / image-drag that swallows pointerup
    const startX = e.clientX, startY = e.clientY;
    const onPreMove = ev => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return;
      cleanup();
      startCatDrag(cat.id, group, e);
    };
    const cleanup = () => {
      document.removeEventListener('pointermove', onPreMove);
      document.removeEventListener('pointerup', cleanup);
      document.removeEventListener('pointercancel', cleanup);
    };
    document.addEventListener('pointermove', onPreMove);
    document.addEventListener('pointerup', cleanup);
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

function makeSummaryGroupContinuation(cat, items) {
  const group = document.createElement('div');
  group.className = 'summary-group summary-group-cont';
  group.dataset.catId = cat.id;
  group.style.setProperty('--cat-color', cat.color);

  const hdr = document.createElement('div');
  hdr.className = 'summary-group-header summary-group-header-cont';

  // Continuation headers are draggable in overflow mode — same logic as primary header
  hdr.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    // Find the primary group element for this cat so the ghost looks right
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

function computeColumnLayout(buckets, overflowAt) {
  const catOrder = state.summarySettings.catOrder || [];
  const orderMap = {};
  catOrder.forEach((id, i) => { orderMap[id] = i; });
  const hasOrder = catOrder.length > 0;

  const cats = allCategories()
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
    // User-specified order: process every category strictly in sequence
    cats.forEach(({ cat, items }) => placeChunks(cat, items));
  } else {
    // Default bin-pack: large (multi-chunk) categories grab their column runs first,
    // then small categories fill remaining space via LPT
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

function renderSummary() {
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
    // Lazy-init catOrder to match the default size-descending sort
    if (!state.summarySettings.catOrder?.length) {
      state.summarySettings.catOrder = allCategories()
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
        const cat = allCategories().find(c => c.id === catId);
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

/* ── Legend ───────────────────────────────────────────────────── */
function renderLegend() {
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

function buildCatChip(cat, count) {
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

function startEditCategory(chip, cat) {
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

function deleteCategory(id) {
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
    showConfirm(`Delete "${cat.name}"? ${usedCount} hotkey${usedCount > 1 ? 's' : ''} will become uncategorized.`, doDelete);
  } else {
    doDelete();
  }
}

/* ── Summary search ───────────────────────────────────────────── */
function filterSummary() {
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

/* ── Category select ──────────────────────────────────────────── */
function populateCategorySelect() {
  const sel = document.getElementById('hotkey-category');
  sel.innerHTML = '<option value="">— No category —</option>';
  allCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
}

/* ── Key full names ───────────────────────────────────────────── */
const KEY_FULL_NAMES = {
  F1:'Function 1', F2:'Function 2', F3:'Function 3', F4:'Function 4',
  F5:'Function 5', F6:'Function 6', F7:'Function 7', F8:'Function 8',
  F9:'Function 9', F10:'Function 10', F11:'Function 11', F12:'Function 12',
  Digit1:'Number 1', Digit2:'Number 2', Digit3:'Number 3', Digit4:'Number 4',
  Digit5:'Number 5', Digit6:'Number 6', Digit7:'Number 7', Digit8:'Number 8',
  Digit9:'Number 9', Digit0:'Number 0',
  Escape:'Escape', Tab:'Tab', CapsLock:'Caps Lock', Space:'Space',
  Backspace:'Backspace', Enter:'Enter', ContextMenu:'Context Menu',
  ShiftLeft:'Left Shift',    ShiftRight:'Right Shift',
  ControlLeft:'Left Ctrl',   ControlRight:'Right Ctrl',
  AltLeft:'Left Alt',        AltRight:'Right Alt',
  MetaLeft:'Left Win',       MetaRight:'Right Win',
  PrintScreen:'Print Screen', ScrollLock:'Scroll Lock', Pause:'Pause',
  Insert:'Insert', Home:'Home', End:'End',
  PageUp:'Page Up', PageDown:'Page Down',
  Delete:'Delete',
  ArrowUp:'Up Arrow', ArrowDown:'Down Arrow',
  ArrowLeft:'Left Arrow', ArrowRight:'Right Arrow',
  NumLock:'Num Lock',
  NumpadDivide:'Numpad /', NumpadMultiply:'Numpad ×',
  NumpadSubtract:'Numpad −', NumpadAdd:'Numpad +',
  NumpadEnter:'Numpad Enter', NumpadDecimal:'Numpad .',
  Numpad0:'Numpad 0', Numpad1:'Numpad 1', Numpad2:'Numpad 2',
  Numpad3:'Numpad 3', Numpad4:'Numpad 4', Numpad5:'Numpad 5',
  Numpad6:'Numpad 6', Numpad7:'Numpad 7', Numpad8:'Numpad 8',
  Numpad9:'Numpad 9',
  Backquote:'Backtick ( ` )', Minus:'Minus ( - )', Equal:'Equals ( = )',
  BracketLeft:'Left Bracket ( [ )', BracketRight:'Right Bracket ( ] )',
  Backslash:'Backslash ( \\ )', Semicolon:'Semicolon ( ; )',
  Quote:'Quote ( \' )', Comma:'Comma ( , )', Period:'Period ( . )',
  Slash:'Slash ( / )',
};

function getKeyFullName(keyId, def) {
  if (KEY_FULL_NAMES[keyId]) return KEY_FULL_NAMES[keyId];
  return (def ? getKeyLabel(def) : '') || keyId;
}

/* ── Popover ──────────────────────────────────────────────────── */
function openPopover(keyId) {
  activeKeyId = keyId;
  const def = findKeyDef(keyId);
  const label = (def ? getKeyLabel(def) : '') || keyId;

  document.getElementById('popover-key-badge').textContent = label || keyId;
  document.getElementById('popover-title').textContent = getKeyFullName(keyId, def);

  // Reset
  document.querySelectorAll('.mod-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.mod-chip input').forEach(cb => cb.checked = false);
  document.getElementById('hotkey-label').value    = '';
  document.getElementById('hotkey-desc').value     = '';
  document.getElementById('hotkey-category').value = '';

  // Prefill existing
  const existing = state.hotkeys[keyId];
  if (existing) {
    document.getElementById('hotkey-label').value    = existing.label       || '';
    document.getElementById('hotkey-desc').value     = existing.description || '';
    document.getElementById('hotkey-category').value = existing.category    || '';
    (existing.modifiers || []).forEach(mod => {
      const cb = document.querySelector(`.mod-chip input[value="${mod}"]`);
      if (cb) { cb.checked = true; cb.closest('.mod-chip').classList.add('active'); }
    });
  }

  document.getElementById('conflict-warning').hidden = true;
  document.getElementById('popover').classList.remove('hidden');
  document.getElementById('popover-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('hotkey-label').focus(), 30);
}

function closePopover() {
  activeKeyId = null;
  hideLabelSuggestions();
  document.getElementById('popover').classList.add('hidden');
  document.getElementById('popover-overlay').classList.add('hidden');
}

/* ── Label autocomplete ───────────────────────────────────────── */
let _suggestionIdx = -1;

function buildSuggestions(query) {
  const q = query.toLowerCase();
  return Object.entries(state.hotkeys)
    .filter(([keyId, hk]) => keyId !== activeKeyId && hk.label.toLowerCase().includes(q))
    .map(([keyId, hk]) => {
      const def = findKeyDef(keyId);
      return { label: hk.label, keyName: def ? (getKeyLabel(def) || keyId) : keyId };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function renderLabelSuggestions() {
  const input = document.getElementById('hotkey-label');
  const box = document.getElementById('label-suggestions');
  const query = input.value.trim();

  if (!query) { hideLabelSuggestions(); return; }

  const matches = buildSuggestions(query);
  if (!matches.length) { hideLabelSuggestions(); return; }

  _suggestionIdx = -1;
  box.innerHTML = '';
  matches.forEach((m, i) => {
    const item = document.createElement('div');
    item.className = 'label-suggestion';
    item.dataset.idx = i;
    const keySpan = document.createElement('span');
    keySpan.className = 'label-suggestion-key';
    keySpan.textContent = m.keyName;
    const divSpan = document.createElement('span');
    divSpan.className = 'label-suggestion-divider';
    divSpan.textContent = '|';
    const textSpan = document.createElement('span');
    textSpan.className = 'label-suggestion-text';
    textSpan.textContent = m.label;
    item.append(keySpan, divSpan, textSpan);
    item.addEventListener('mousedown', e => {
      e.preventDefault();
      selectSuggestion(m.label);
    });
    box.appendChild(item);
  });

  box.hidden = false;
}

function hideLabelSuggestions() {
  const box = document.getElementById('label-suggestions');
  if (box) box.hidden = true;
  _suggestionIdx = -1;
}

function selectSuggestion(label) {
  const input = document.getElementById('hotkey-label');
  input.value = label;
  hideLabelSuggestions();
  updateConflictWarning();
  input.focus();
}

function moveSuggestionFocus(dir) {
  const box = document.getElementById('label-suggestions');
  if (!box || box.hidden) return;
  const items = box.querySelectorAll('.label-suggestion');
  if (!items.length) return;
  items[_suggestionIdx]?.classList.remove('ls-focused');
  _suggestionIdx = (_suggestionIdx + dir + items.length) % items.length;
  items[_suggestionIdx].classList.add('ls-focused');
  items[_suggestionIdx].scrollIntoView({ block: 'nearest' });
}

function checkConflict(label) {
  if (!label) return null;
  const lower = label.toLowerCase();
  for (const [keyId, hk] of Object.entries(state.hotkeys)) {
    if (keyId !== activeKeyId && hk.label.toLowerCase() === lower) return keyId;
  }
  return null;
}

function updateConflictWarning() {
  const label = document.getElementById('hotkey-label').value.trim();
  const warn = document.getElementById('conflict-warning');
  const conflictKeyId = checkConflict(label);
  if (conflictKeyId) {
    const def = findKeyDef(conflictKeyId);
    const keyName = def ? getKeyLabel(def) : conflictKeyId;
    document.getElementById('conflict-warning-text').textContent =
      `"${label}" is already assigned to ${keyName}`;
    warn.hidden = false;
  } else {
    warn.hidden = true;
  }
}

function saveHotkey() {
  if (!activeKeyId) return;
  const label = document.getElementById('hotkey-label').value.trim();
  if (!label) {
    document.getElementById('hotkey-label').focus();
    document.getElementById('hotkey-label').style.borderColor = 'var(--danger)';
    setTimeout(() => document.getElementById('hotkey-label').style.borderColor = '', 1200);
    return;
  }

  pushUndo();
  const modifiers = [...document.querySelectorAll('.mod-chip input:checked')].map(cb => cb.value);

  state.hotkeys[activeKeyId] = {
    label,
    description: document.getElementById('hotkey-desc').value.trim(),
    category:    document.getElementById('hotkey-category').value,
    modifiers,
  };

  track('key_assigned', {
    key_id:          activeKeyId,
    category:        state.hotkeys[activeKeyId].category || 'none',
    has_modifiers:   modifiers.length > 0,
    has_description: !!state.hotkeys[activeKeyId].description,
  });

  refreshKey(activeKeyId);
  renderLegend();
  renderSummary();
  saveToStorage();
  closePopover();
}

function clearHotkey() {
  if (!activeKeyId) return;
  pushUndo();
  track('key_cleared', { key_id: activeKeyId });
  delete state.hotkeys[activeKeyId];
  refreshKey(activeKeyId);
  renderLegend();
  renderSummary();
  saveToStorage();
  closePopover();
}

/* ── Context tabs ─────────────────────────────────────────────── */
function genTabId() {
  return 'tab-' + Math.random().toString(36).slice(2, 8);
}

function syncActiveTab() {
  const tab = state.tabs.find(t => t.id === state.activeTabId);
  if (tab) tab.hotkeys = JSON.parse(JSON.stringify(state.hotkeys));
}

function switchTab(id) {
  syncActiveTab();
  state.activeTabId = id;
  const tab = state.tabs.find(t => t.id === id);
  state.hotkeys = tab ? JSON.parse(JSON.stringify(tab.hotkeys)) : {};
  renderTabBar();
  renderKeyboard();
  renderLegend();
  renderSummary();
  saveToStorage();
}

function showTabNameDialog(onConfirm, opts = {}) {
  const { title = 'New Tab Name', buttonLabel = 'Create Tab', initialValue = '', onDelete = null } = opts;
  const modal     = document.getElementById('tab-name-modal');
  const input     = document.getElementById('tab-name-input');
  const ok        = document.getElementById('tab-name-ok');
  const cancel    = document.getElementById('tab-name-cancel');
  const deleteBtn = document.getElementById('tab-name-delete');
  const overlay   = document.getElementById('confirm-overlay');
  const titleEl   = document.getElementById('tab-name-title');

  titleEl.textContent = title;
  ok.textContent      = buttonLabel;
  input.value         = initialValue;
  deleteBtn.classList.toggle('hidden', !onDelete);
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
  input.focus();
  input.select();

  function commit() {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    cleanup();
    onConfirm(name);
  }

  function handleDelete() {
    cleanup();
    onDelete();
  }

  function cleanup() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    ok.removeEventListener('click', commit);
    cancel.removeEventListener('click', cleanup);
    deleteBtn.removeEventListener('click', handleDelete);
    input.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cleanup();
  }

  ok.addEventListener('click', commit);
  cancel.addEventListener('click', cleanup);
  if (onDelete) deleteBtn.addEventListener('click', handleDelete);
  input.addEventListener('keydown', onKey);
}

let _dragTabId = null;

function renameTab(tabId, currentName) {
  const canDelete = state.tabs.length > 1;
  showTabNameDialog(name => {
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;
    tab.name = name;
    renderTabBar();
    saveToStorage();
  }, {
    title: 'Rename Tab',
    buttonLabel: 'Rename',
    initialValue: currentName,
    onDelete: canDelete ? () => {
      const hotkeyCount = Object.keys(state.tabs.find(t => t.id === tabId)?.hotkeys || {}).length;
      const detail = hotkeyCount > 0
        ? ` ${hotkeyCount} hotkey${hotkeyCount > 1 ? 's' : ''} will be permanently deleted.`
        : '';
      showConfirm(`Delete "${currentName}"?${detail}`, () => deleteTab(tabId));
    } : null,
  });
}

function deleteTab(tabId) {
  const idx = state.tabs.findIndex(t => t.id === tabId);
  if (idx === -1 || state.tabs.length <= 1) return;
  state.tabs.splice(idx, 1);
  if (state.activeTabId === tabId) {
    const next = state.tabs[Math.min(idx, state.tabs.length - 1)];
    state.activeTabId = next.id;
    state.hotkeys = { ...next.hotkeys };
  }
  renderTabBar();
  renderKeyboard();
  renderLegend();
  renderSummary();
  saveToStorage();
}

function addTab() {
  _addingNewTab = true;
  openTemplatesModal();
}

function renderTabBar() {
  const el = document.getElementById('context-tabs');
  if (!el) return;
  el.innerHTML = '';

  state.tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'context-tab' + (tab.id === state.activeTabId ? ' active' : '');
    btn.draggable = true;
    btn.dataset.tabId = tab.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'context-tab-name';
    nameSpan.textContent = tab.name;
    nameSpan.title = 'Double-click to rename';
    nameSpan.addEventListener('dblclick', e => {
      e.stopPropagation();
      renameTab(tab.id, tab.name);
    });
    btn.appendChild(nameSpan);

    btn.addEventListener('click', () => { if (tab.id !== state.activeTabId) switchTab(tab.id); });

    btn.addEventListener('dragstart', e => {
      _dragTabId = tab.id;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => btn.classList.add('dragging'), 0);
    });
    btn.addEventListener('dragend', () => {
      _dragTabId = null;
      btn.classList.remove('dragging');
      el.querySelectorAll('.context-tab').forEach(t => t.classList.remove('drag-before', 'drag-after'));
    });
    btn.addEventListener('dragover', e => {
      if (!_dragTabId || _dragTabId === tab.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = btn.getBoundingClientRect();
      const before = e.clientX < rect.left + rect.width / 2;
      el.querySelectorAll('.context-tab').forEach(t => t.classList.remove('drag-before', 'drag-after'));
      btn.classList.add(before ? 'drag-before' : 'drag-after');
    });
    btn.addEventListener('dragleave', () => {
      btn.classList.remove('drag-before', 'drag-after');
    });
    btn.addEventListener('drop', e => {
      e.preventDefault();
      if (!_dragTabId || _dragTabId === tab.id) return;
      el.querySelectorAll('.context-tab').forEach(t => t.classList.remove('drag-before', 'drag-after'));
      const rect = btn.getBoundingClientRect();
      const before = e.clientX < rect.left + rect.width / 2;
      const fromIdx = state.tabs.findIndex(t => t.id === _dragTabId);
      const [moved] = state.tabs.splice(fromIdx, 1);
      const toIdx = state.tabs.findIndex(t => t.id === tab.id);
      state.tabs.splice(before ? toIdx : toIdx + 1, 0, moved);
      renderTabBar();
      saveToStorage();
    });

    el.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'context-tab-add';
  addBtn.title = 'Add tab';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', addTab);
  el.appendChild(addBtn);
}

/* ── Storage ──────────────────────────────────────────────────── */
function saveToStorage() {
  syncActiveTab();
  try {
    localStorage.setItem('keybindr', JSON.stringify({
      hotkeys:         state.hotkeys,
      tabs:            state.tabs,
      activeTabId:     state.activeTabId,
      mapName:         document.getElementById('map-name').value,
      layout:          state.layout,
      keyMap:          state.keyMap,
      summaryCols:     state.summaryCols,
      categories:      state.categories,
      platform:        state.platform,
      collapsedCats:   [...state.collapsedCats],
      summarySettings: state.summarySettings,
      catItemOrder:    state.catItemOrder,
    }));
  } catch (_) {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('keybindr');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.hotkeys) state.hotkeys = data.hotkeys;
    if (data.mapName) document.getElementById('map-name').value = data.mapName;
    if (data.layout && VALID_LAYOUTS.has(data.layout))   state.layout = data.layout;
    if (data.keyMap && VALID_KEY_MAPS.has(data.keyMap)) state.keyMap = data.keyMap;
    if (data.summaryCols) state.summaryCols = data.summaryCols;
    // Migrate old customCategories format, or load new categories array
    state.categories = data.categories || data.customCategories || [];
    // Restore any DEFAULT_CATEGORIES referenced by hotkeys but not yet in state.categories
    const usedCatIds    = new Set(Object.values(state.hotkeys).map(hk => hk.category).filter(Boolean));
    const existingIds   = new Set(state.categories.map(c => c.id));
    DEFAULT_CATEGORIES.forEach(cat => {
      if (usedCatIds.has(cat.id) && !existingIds.has(cat.id)) state.categories.push({ ...cat });
    });
    if (data.collapsedCats) state.collapsedCats = new Set(data.collapsedCats);
    if (data.summarySettings) state.summarySettings = { ...state.summarySettings, ...data.summarySettings };
    if (data.catItemOrder)    state.catItemOrder    = data.catItemOrder;
    if (data.platform) {
      state.platform = data.platform;
      document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.platform === state.platform);
      });
    }
    // Load tabs (with migration from pre-tabs saves)
    if (data.tabs && Array.isArray(data.tabs) && data.tabs.length > 0) {
      state.tabs = data.tabs;
      state.activeTabId = data.activeTabId || data.tabs[0].id;
    } else {
      // Migration: wrap existing hotkeys in a Default tab
      state.tabs = [{ id: 'tab-default', name: 'Default', hotkeys: JSON.parse(JSON.stringify(state.hotkeys)) }];
      state.activeTabId = 'tab-default';
    }
    // Always load active tab's hotkeys as the working copy
    const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
    state.activeTabId = activeTab.id;
    state.hotkeys = JSON.parse(JSON.stringify(activeTab.hotkeys));
  } catch (_) {}
}

/* ── Share via URL ────────────────────────────────────────────── */
function buildShareUrl() {
  const data = {
    hotkeys:    state.hotkeys,
    mapName:    document.getElementById('map-name').value,
    layout:     state.layout,
    keyMap:     state.keyMap,
    categories: state.categories,
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
  return `${location.origin}${location.pathname}#map=${encoded}`;
}

function loadFromHash() {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#map=')) return false;
    const data = JSON.parse(decodeURIComponent(atob(hash.slice(5))));
    if (data.hotkeys) state.hotkeys = data.hotkeys;
    if (data.mapName) document.getElementById('map-name').value = data.mapName;
    if (data.layout && VALID_LAYOUTS.has(data.layout))   state.layout = data.layout;
    if (data.keyMap && VALID_KEY_MAPS.has(data.keyMap)) state.keyMap = data.keyMap;
    state.categories = data.categories || data.customCategories || [];
    history.replaceState(null, '', location.pathname);
    return true;
  } catch (_) { return false; }
}

/* ── Copy / Print ─────────────────────────────────────────────── */
function shareDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function siteUrl() {
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

function buildPlainText() {
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

function buildMarkdown() {
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

function markdownToHtml(md) {
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
    if (line.startsWith('# '))  out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.startsWith('## ')) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line === '---')    out.push('<hr>');
    else if (line.trim())       out.push(`<p>${inline(line)}</p>`);
  }
  flushTable();
  return out.join('');
}

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1800);
  } catch (_) {}
}

/* ── Export / Import ──────────────────────────────────────────── */
function exportMap() {
  const name = document.getElementById('map-name').value || 'hotkey-map';
  track('map_exported', { key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.exports });
  const data = { version: 1, name, generatedOn: shareDate(), source: 'KeyBindr', sourceUrl: siteUrl(), hotkeys: state.hotkeys, categories: state.categories };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = name.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importMap(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.hotkeys) throw new Error();
      pushUndo();
      state.hotkeys   = data.hotkeys;
      state.categories = data.categories || [];
      if (data.name) document.getElementById('map-name').value = data.name;
      track('map_imported', { key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.imports });
      populateCategorySelect();
      renderKeyboard();
      renderLegend();
      renderSummary();
      saveToStorage();
    } catch (_) {
      alert('Invalid file. Please import a KeyBindr JSON file.');
    }
  };
  reader.readAsText(file);
}

/* ── Confirm dialog ───────────────────────────────────────────── */
let _confirmCallback = null;

function showConfirm(message, onConfirm) {
  _confirmCallback = onConfirm;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('confirm-ok').focus();
}

function closeConfirm(confirmed) {
  document.getElementById('confirm-overlay').classList.add('hidden');
  document.getElementById('confirm-modal').classList.add('hidden');
  const cb = _confirmCallback;
  _confirmCallback = null;
  if (confirmed && cb) cb();
}

/* ── Templates ────────────────────────────────────────────────── */
let _collapseNewTile = null;
let _addingNewTab = false;

function openTemplatesModal() {
  document.getElementById('template-modal').classList.remove('hidden');
  document.getElementById('template-overlay').classList.remove('hidden');
}

function closeTemplatesModal() {
  document.getElementById('template-modal').classList.add('hidden');
  document.getElementById('template-overlay').classList.add('hidden');
  if (_collapseNewTile) _collapseNewTile();
  _addingNewTab = false;
}

function loadTemplate(template) {
  const doLoad = () => {
    const categories = template.categories
      ? template.categories.map(c => ({ ...c }))
      : [];

    if (template.tabs) {
      const newTabs = template.tabs.map(t => ({
        id: genTabId(),
        name: t.name,
        hotkeys: Object.fromEntries(Object.entries(t.hotkeys).map(([k, v]) => [k, { ...v }])),
      }));
      if (_addingNewTab) {
        syncActiveTab();
        state.tabs.push(...newTabs);
      } else {
        state.tabs = newTabs;
      }
      state.activeTabId = newTabs[0].id;
      state.hotkeys = JSON.parse(JSON.stringify(newTabs[0].hotkeys));
    } else {
      const hotkeys = Object.fromEntries(
        Object.entries(template.hotkeys).map(([k, v]) => [k, { ...v }])
      );
      if (!categories.length) {
        categories.push(...DEFAULT_CATEGORIES.filter(c => new Set(Object.values(hotkeys).map(hk => hk.category).filter(Boolean)).has(c.id)).map(c => ({ ...c })));
      }
      if (_addingNewTab) {
        syncActiveTab();
        const id = genTabId();
        state.tabs.push({ id, name: template.name, hotkeys });
        state.activeTabId = id;
        state.hotkeys = JSON.parse(JSON.stringify(hotkeys));
      } else {
        state.hotkeys = hotkeys;
      }
    }
    state.categories = categories;
    document.getElementById('map-name').value = template.name;
    track('template_loaded', { template_name: template.name, template_category: template.appCategory, session_count: ++_sessionCounts.saves });
    populateCategorySelect();
    renderTabBar();
    renderKeyboard();
    renderLegend();
    renderSummary();
    saveToStorage();
    closeTemplatesModal();
  };
  const hasContent = Object.keys(state.hotkeys).length > 0;
  if (!_addingNewTab && hasContent) {
    const tabNote = template.tabs ? ` It will create ${template.tabs.length} tabs.` : '';
    showConfirm(`Load "${template.name}"? This will replace your current map.${tabNote}`, doLoad);
  } else {
    doLoad();
  }
}

function initTemplates() {
  const grid = document.getElementById('template-grid');

  // New Map tile
  const newTile = document.createElement('div');
  newTile.className = 'template-tile template-tile-new';
  newTile.dataset.new = 'true';

  const prompt = document.createElement('div');
  prompt.className = 'template-new-prompt';
  prompt.innerHTML = `
    <span class="template-new-plus">+</span>
    <span class="template-name">New Map</span>
    <span class="template-meta"><span class="template-badge template-badge-blank">Blank</span></span>
  `;

  const form = document.createElement('div');
  form.className = 'template-new-form hidden';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'template-name-input';
  nameInput.placeholder = 'Map name…';
  nameInput.maxLength = 60;
  nameInput.autocomplete = 'off';

  const actions = document.createElement('div');
  actions.className = 'template-new-actions';

  const createBtn = document.createElement('button');
  createBtn.className = 'btn btn-primary';
  createBtn.textContent = 'Create';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.textContent = 'Cancel';

  actions.appendChild(createBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(nameInput);
  form.appendChild(actions);
  newTile.appendChild(prompt);
  newTile.appendChild(form);

  const collapse = () => {
    form.classList.add('hidden');
    prompt.classList.remove('hidden');
    newTile.classList.remove('expanded');
  };
  _collapseNewTile = collapse;

  const expand = () => {
    prompt.classList.add('hidden');
    form.classList.remove('hidden');
    newTile.classList.add('expanded');
    nameInput.value = document.getElementById('map-name').value || '';
    nameInput.select();
    setTimeout(() => nameInput.focus(), 30);
  };

  const doCreate = () => {
    const name = nameInput.value.trim() || 'Untitled Map';
    const apply = () => {
      if (_addingNewTab) {
        syncActiveTab();
        const id = genTabId();
        state.tabs.push({ id, name, hotkeys: {} });
        state.activeTabId = id;
        state.hotkeys = {};
      } else {
        state.hotkeys    = {};
        state.categories = [];
      }
      document.getElementById('map-name').value = name;
      track('new_map_created', { session_count: ++_sessionCounts.saves });
      populateCategorySelect();
      renderTabBar();
      renderKeyboard();
      renderLegend();
      renderSummary();
      saveToStorage();
      closeTemplatesModal();
    };
    if (!_addingNewTab && Object.keys(state.hotkeys).length > 0) {
      showConfirm(`Start a new map named "${name}"? This will clear your current map.`, apply);
    } else {
      apply();
    }
  };

  prompt.addEventListener('click', expand);
  createBtn.addEventListener('click', doCreate);
  cancelBtn.addEventListener('click', collapse);
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doCreate();
    if (e.key === 'Escape') collapse();
  });

  grid.appendChild(newTile);

  // Existing template tiles
  [...TEMPLATES].sort((a, b) => a.name.localeCompare(b.name)).forEach(template => {
    const count = template.tabs
      ? template.tabs.reduce((sum, t) => sum + Object.keys(t.hotkeys).length, 0)
      : Object.keys(template.hotkeys).length;
    const tile = document.createElement('button');
    tile.className = 'template-tile';
    tile.dataset.category = template.appCategory;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'template-icon';
    const img = document.createElement('img');
    img.src = template.iconSrc;
    img.alt = template.name;
    img.className = template.iconClass || (template.iconWide ? 'template-logo template-logo--wide' : 'template-logo');
    iconSpan.appendChild(img);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'template-name';
    nameSpan.textContent = template.name;

    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'template-badge';
    badgeSpan.textContent = template.appCategory;

    const countSpan = document.createElement('span');
    countSpan.className = 'template-count';
    countSpan.textContent = template.tabs ? `${template.tabs.length} tabs` : `${count} keys`;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'template-meta';
    metaSpan.append(badgeSpan, countSpan);

    tile.append(iconSpan, nameSpan, metaSpan);
    tile.addEventListener('click', () => loadTemplate(template));
    grid.appendChild(tile);
  });

  document.querySelectorAll('.template-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.template-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      document.querySelectorAll('.template-tile').forEach(tile => {
        if (tile.dataset.new) return;
        tile.classList.toggle('hidden', cat !== 'all' && tile.dataset.category !== cat);
      });
    });
  });

  document.getElementById('btn-templates').addEventListener('click', openTemplatesModal);
  document.getElementById('template-close').addEventListener('click', closeTemplatesModal);
  document.getElementById('template-overlay').addEventListener('click', closeTemplatesModal);
}

/* ── Action dropdown (module-scoped so all init fns can use it) ── */
// Persistent element stays in the DOM so its GPU layer is always allocated,
// eliminating the black-texture flash on first show.
const _dropdownEl = document.createElement('div');
_dropdownEl.className = 'action-dropdown';
_dropdownEl.style.display = 'none';
document.body.appendChild(_dropdownEl);

let _dropdownOutsideClick = null;
let _dropdownAnchor = null;

function closeActionDropdown() {
  _dropdownEl.style.display = 'none';
  _dropdownEl.style.minWidth = '';
  if (_dropdownAnchor) { _dropdownAnchor.classList.remove('open'); _dropdownAnchor = null; }
  if (_dropdownOutsideClick) {
    document.removeEventListener('click', _dropdownOutsideClick, true);
    _dropdownOutsideClick = null;
  }
}

function showActionDropdown(anchor, items) {
  if (_dropdownAnchor === anchor) { closeActionDropdown(); return; }
  closeActionDropdown();
  _dropdownEl.innerHTML = '';
  const hasHeaders = items.some(it => it.header);
  items.forEach((item, i) => {
    if (item.header) {
      if (i > 0) {
        const sep = document.createElement('div');
        sep.className = 'action-dropdown-sep';
        _dropdownEl.appendChild(sep);
      }
      const hdr = document.createElement('div');
      hdr.className = 'action-dropdown-header';
      hdr.textContent = item.label;
      _dropdownEl.appendChild(hdr);
      return;
    }
    if (!hasHeaders && i > 0) {
      const sep = document.createElement('div');
      sep.className = 'action-dropdown-sep';
      _dropdownEl.appendChild(sep);
    }
    const btn = document.createElement('button');
    btn.className = 'action-dropdown-item' + (item.selected ? ' selected' : '');
    btn.textContent = item.label;
    if (item.selected) {
      const check = document.createElement('span');
      check.className = 'dropdown-check';
      check.textContent = '✓';
      btn.appendChild(check);
    }
    btn.addEventListener('click', () => { closeActionDropdown(); item.action(); });
    _dropdownEl.appendChild(btn);
  });
  const rect = anchor.getBoundingClientRect();
  _dropdownEl.style.top  = (rect.bottom + 4) + 'px';
  _dropdownEl.style.left = rect.left + 'px';
  _dropdownEl.style.display = '';
  _dropdownAnchor = anchor;
  anchor.classList.add('open');
  setTimeout(() => {
    _dropdownOutsideClick = e => {
      if (!_dropdownEl.contains(e.target) && e.target !== anchor) closeActionDropdown();
    };
    document.addEventListener('click', _dropdownOutsideClick, true);
  }, 0);
}

function showClearDropdown(anchor) {
  if (_dropdownAnchor === anchor) { closeActionDropdown(); return; }
  closeActionDropdown();

  const sel = { hotkeys: false, categories: false, tabs: false };
  _dropdownEl.innerHTML = '';

  const options = [
    { key: 'hotkeys',    label: 'Hotkeys'    },
    { key: 'categories', label: 'Categories' },
    { key: 'tabs',       label: 'Tabs'       },
  ];

  let applyBtn;
  function updateApplyBtn() {
    if (applyBtn) applyBtn.disabled = !Object.values(sel).some(Boolean);
  }

  options.forEach((opt, i) => {
    if (i > 0) {
      const sep = document.createElement('div');
      sep.className = 'action-dropdown-sep';
      _dropdownEl.appendChild(sep);
    }
    const row = document.createElement('div');
    row.className = 'clear-toggle-row';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'settings-label';
    labelSpan.textContent = opt.label;
    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'toggle-switch';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = false;
    cb.addEventListener('change', () => { sel[opt.key] = cb.checked; updateApplyBtn(); });
    const track = document.createElement('span');
    track.className = 'toggle-track';
    toggleLabel.appendChild(cb);
    toggleLabel.appendChild(track);
    row.appendChild(labelSpan);
    row.appendChild(toggleLabel);
    _dropdownEl.appendChild(row);
  });

  const footerSep = document.createElement('div');
  footerSep.className = 'action-dropdown-sep';
  _dropdownEl.appendChild(footerSep);

  applyBtn = document.createElement('button');
  applyBtn.className = 'action-dropdown-footer-btn';
  applyBtn.textContent = 'Clear';
  applyBtn.disabled = true;
  applyBtn.addEventListener('click', () => {
    if (!Object.values(sel).some(Boolean)) return;
    closeActionDropdown();
    const parts = [];
    if (sel.hotkeys)    parts.push('hotkeys');
    if (sel.categories) parts.push('categories');
    if (sel.tabs)       parts.push('tabs');
    showConfirm(`Clear ${parts.join(', ')} from this map?`, () => {
      pushUndo();
      if (sel.tabs) {
        syncActiveTab();
        const kept = sel.hotkeys ? {} : JSON.parse(JSON.stringify(state.hotkeys));
        const id = genTabId();
        state.tabs = [{ id, name: 'Default', hotkeys: kept }];
        state.activeTabId = id;
        state.hotkeys = kept;
      } else if (sel.hotkeys) {
        state.hotkeys = {};
        state.tabs.forEach(t => { t.hotkeys = {}; });
      }
      if (sel.categories) state.categories = [];
      track('clear_all', { clear_hotkeys: sel.hotkeys, clear_cats: sel.categories, clear_tabs: sel.tabs });
      renderKeyboard(); renderLegend(); renderSummary(); renderTabBar(); saveToStorage();
    });
  });
  _dropdownEl.appendChild(applyBtn);

  const rect = anchor.getBoundingClientRect();
  _dropdownEl.style.minWidth = '170px';
  _dropdownEl.style.top  = (rect.bottom + 4) + 'px';
  _dropdownEl.style.left = rect.left + 'px';
  _dropdownEl.style.display = '';
  _dropdownAnchor = anchor;
  anchor.classList.add('open');
  setTimeout(() => {
    _dropdownOutsideClick = e => {
      if (!_dropdownEl.contains(e.target) && e.target !== anchor) closeActionDropdown();
    };
    document.addEventListener('click', _dropdownOutsideClick, true);
  }, 0);
}

/* ── Layout controls ──────────────────────────────────────────── */
const LAYOUT_OPTIONS = [
  { label: 'Standard', header: true },
  { label: 'Full (104-key)', value: 'full' },
  { label: 'Tenkeyless (TKL)', value: 'tkl' },
  { label: '60%', value: '60' },
  { label: 'Split', value: 'split' },
  { label: 'Split Ergonomic', header: true },
  { label: 'ZSA Voyager', value: 'voyager' },
  { label: 'ZSA Moonlander', value: 'moonlander' },
  { label: 'ErgoDox EZ', value: 'ergodox' },
];

const KEYMAP_OPTIONS = [
  { label: 'QWERTY', value: 'qwerty' },
  { label: 'Dvorak', value: 'dvorak' },
  { label: 'Colemak', value: 'colemak' },
  { label: 'AZERTY', value: 'azerty' },
  { label: 'QWERTZ', value: 'qwertz' },
];

function initLayoutControls() {
  const layoutBtn = document.getElementById('select-layout');
  const keymapBtn = document.getElementById('select-keymap');

  function setLayoutLabel(value) {
    const opt = LAYOUT_OPTIONS.find(o => !o.header && o.value === value);
    layoutBtn.querySelector('.select-label').textContent = opt ? opt.label : value;
  }

  function setKeymapLabel(value) {
    const opt = KEYMAP_OPTIONS.find(o => o.value === value);
    keymapBtn.querySelector('.select-label').textContent = opt ? opt.label : value;
  }

  setLayoutLabel(state.layout);
  setKeymapLabel(state.keyMap);

  layoutBtn.addEventListener('click', e => {
    showActionDropdown(e.currentTarget, LAYOUT_OPTIONS.map(opt =>
      opt.header ? opt : {
        ...opt,
        selected: opt.value === state.layout,
        action: () => {
          state.layout = opt.value;
          setLayoutLabel(opt.value);
          track('layout_changed', { layout: state.layout });
          renderKeyboard();
          saveToStorage();
        }
      }
    ));
  });

  keymapBtn.addEventListener('click', e => {
    showActionDropdown(e.currentTarget, KEYMAP_OPTIONS.map(opt => ({
      ...opt,
      selected: opt.value === state.keyMap,
      action: () => {
        state.keyMap = opt.value;
        setKeymapLabel(opt.value);
        track('keymap_changed', { key_map: state.keyMap });
        renderKeyboard();
        saveToStorage();
      }
    })));
  });
}

/* ── Events ───────────────────────────────────────────────────── */
function initEvents() {
  const mobileMenuBtn = document.getElementById('btn-mobile-menu');
  const headerActions = document.querySelector('.header-actions');

  mobileMenuBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = headerActions.classList.toggle('menu-open');
    mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', e => {
    if (headerActions.classList.contains('menu-open') && !e.target.closest('.app-header')) {
      headerActions.classList.remove('menu-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('popover-close').addEventListener('click', closePopover);
  document.getElementById('popover-overlay').addEventListener('click', closePopover);

  document.querySelectorAll('.mod-chip input').forEach(cb => {
    cb.addEventListener('change', () => cb.closest('.mod-chip').classList.toggle('active', cb.checked));
  });

  document.getElementById('btn-save-hotkey').addEventListener('click', saveHotkey);
  document.getElementById('btn-clear-hotkey').addEventListener('click', clearHotkey);
  document.getElementById('btn-undo').addEventListener('click', undoAction);
  document.getElementById('btn-redo').addEventListener('click', redoAction);

  document.getElementById('hotkey-label').addEventListener('input', () => {
    renderLabelSuggestions();
    updateConflictWarning();
  });
  document.getElementById('hotkey-label').addEventListener('keydown', e => {
    const box = document.getElementById('label-suggestions');
    if (!box.hidden) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggestionFocus(1); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); moveSuggestionFocus(-1); return; }
      if (e.key === 'Escape')    { hideLabelSuggestions(); return; }
      if (e.key === 'Enter') {
        const focused = box.querySelector('.ls-focused');
        if (focused) { e.preventDefault(); selectSuggestion(focused.querySelector('.label-suggestion-text').textContent); return; }
      }
    }
    if (e.key === 'Enter') saveHotkey();
  });
  document.getElementById('hotkey-label').addEventListener('blur', () => {
    setTimeout(hideLabelSuggestions, 150);
  });

  document.addEventListener('keydown', e => {
    if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') &&
        e.target.id !== 'map-name') return;
    if (e.ctrlKey && !e.altKey) {
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoAction(); }
      if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redoAction(); }
    }
  });

  document.getElementById('confirm-ok').addEventListener('click',     () => closeConfirm(true));
  document.getElementById('confirm-cancel').addEventListener('click',  () => closeConfirm(false));
  document.getElementById('confirm-overlay').addEventListener('click', () => closeConfirm(false));

  document.addEventListener('keydown', e => {
    if (!document.getElementById('confirm-modal').classList.contains('hidden')) {
      if (e.key === 'Escape') { e.stopPropagation(); closeConfirm(false); }
      if (e.key === 'Enter')  { e.stopPropagation(); closeConfirm(true);  }
      return;
    }
    if (e.key !== 'Escape') return;
    if (activeKeyId) closePopover();
    else if (!document.getElementById('template-modal').classList.contains('hidden')) closeTemplatesModal();
  });

  document.getElementById('map-name').addEventListener('input', saveToStorage);

  document.getElementById('btn-new').addEventListener('click', () => {
    showConfirm('Create a new map? This will wipe all hotkeys, categories, and tabs.', () => {
      track('new_map_started', { session_count: ++_sessionCounts.saves });
      pushUndo();
      const id = genTabId();
      state.tabs = [{ id, name: 'New Map', hotkeys: {} }];
      state.activeTabId = id;
      state.hotkeys = {};
      state.categories = [];
      document.getElementById('map-name').value = 'New Map';
      renderKeyboard(); renderLegend(); renderSummary(); renderTabBar(); saveToStorage();
    });
  });

  document.getElementById('btn-heatmap').addEventListener('click', toggleHeatmap);

  document.getElementById('btn-clear-all').addEventListener('click', e => {
    showClearDropdown(e.currentTarget);
  });

  /* ── Style panel ── */
  const stylePanel = document.getElementById('style-panel');

  function openStylePanel(btn) {
    closeSharePanel();
    if (!stylePanel.classList.contains('hidden')) { stylePanel.classList.add('hidden'); return; }
    const rect = btn.getBoundingClientRect();
    stylePanel.style.top   = `${rect.bottom + 6}px`;
    stylePanel.style.left  = `${rect.left}px`;
    stylePanel.style.right = '';
    stylePanel.classList.remove('hidden');
  }

  function closeStylePanel() { stylePanel.classList.add('hidden'); }

  document.getElementById('btn-style').addEventListener('click', e => {
    e.stopPropagation();
    openStylePanel(e.currentTarget);
  });

  /* ── Share panel ── */
  const sharePanel = document.getElementById('share-panel');

  function openSharePanel(btn) {
    closeStylePanel();
    if (!sharePanel.classList.contains('hidden')) { sharePanel.classList.add('hidden'); return; }
    const rect = btn.getBoundingClientRect();
    sharePanel.style.top   = `${rect.bottom + 6}px`;
    sharePanel.style.right = `${window.innerWidth - rect.right}px`;
    sharePanel.classList.remove('hidden');
  }

  function closeSharePanel() { sharePanel.classList.add('hidden'); }

  document.getElementById('btn-share').addEventListener('click', e => {
    e.stopPropagation();
    openSharePanel(e.currentTarget);
  });

  document.addEventListener('click', e => {
    if (!stylePanel.classList.contains('hidden') && !stylePanel.contains(e.target)) closeStylePanel();
    if (!sharePanel.classList.contains('hidden') && !sharePanel.contains(e.target)) closeSharePanel();
  });

  document.getElementById('share-copy-link').addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      track('map_shared', { method: 'link', key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.shares });
      const orig = nameEl.textContent;
      nameEl.textContent = 'Copied!';
      setTimeout(() => { nameEl.textContent = orig; closeSharePanel(); }, 1500);
    } catch (_) {}
  });

  document.getElementById('share-twitter').addEventListener('click', () => {
    const mapName = document.getElementById('map-name').value || 'My Keyboard Map';
    const url = buildShareUrl();
    const text = encodeURIComponent(`Check out my keyboard shortcut map "${mapName}" — created with KeyBindr`);
    track('map_shared', { method: 'twitter', session_count: ++_sessionCounts.shares });
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
    closeSharePanel();
  });

  document.getElementById('share-reddit').addEventListener('click', () => {
    const mapName = document.getElementById('map-name').value || 'My Keyboard Map';
    const url = buildShareUrl();
    track('map_shared', { method: 'reddit', session_count: ++_sessionCounts.shares });
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(mapName)}`, '_blank', 'noopener');
    closeSharePanel();
  });

  document.getElementById('share-email').addEventListener('click', () => {
    const mapName = document.getElementById('map-name').value || 'My Keyboard Map';
    const url = buildShareUrl();
    const subject = encodeURIComponent(`${mapName} — KeyBindr`);
    const body = encodeURIComponent(`${mapName}\nGenerated: ${shareDate()}\n\nView this keyboard shortcut map online:\n${url}\n\n---\nCreated with KeyBindr — ${siteUrl()}`);
    track('map_shared', { method: 'email', session_count: ++_sessionCounts.shares });
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    closeSharePanel();
  });

  document.getElementById('share-copy-text').addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    try {
      await navigator.clipboard.writeText(buildPlainText());
      track('map_shared', { method: 'text', session_count: ++_sessionCounts.shares });
      const orig = nameEl.textContent;
      nameEl.textContent = 'Copied!';
      setTimeout(() => { nameEl.textContent = orig; closeSharePanel(); }, 1500);
    } catch (_) {}
  });

  document.getElementById('share-copy-md').addEventListener('click', async e => {
    const nameEl = e.currentTarget.querySelector('.share-option-name');
    const md = buildMarkdown();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([md], { type: 'text/plain' }),
          'text/html':  new Blob([markdownToHtml(md)], { type: 'text/html' }),
        }),
      ]);
    } catch (_) {
      try { await navigator.clipboard.writeText(md); } catch (_) { return; }
    }
    track('map_shared', { method: 'markdown', session_count: ++_sessionCounts.shares });
    const orig = nameEl.textContent;
    nameEl.textContent = 'Copied!';
    setTimeout(() => { nameEl.textContent = orig; closeSharePanel(); }, 1500);
  });

  document.getElementById('share-export').addEventListener('click', () => {
    track('map_exported', { key_count: Object.keys(state.hotkeys).length });
    exportMap();
    closeSharePanel();
  });

  document.getElementById('share-print').addEventListener('click', () => {
    track('map_printed', { key_count: Object.keys(state.hotkeys).length, session_count: ++_sessionCounts.prints });
    closeSharePanel();
    window.print();
  });

  document.getElementById('share-export-png').addEventListener('click', async () => {
    track('map_exported_png', { key_count: Object.keys(state.hotkeys).length });
    closeSharePanel();

    const target = document.querySelector('.app-main');
    if (!target || typeof htmlToImage === 'undefined') {
      alert('PNG export is not available right now.');
      return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = isDark ? '#1a1a1a' : '#ffffff';

    const legend = document.getElementById('legend');
    const wasCollapsed = legend && legend.classList.contains('collapsed');
    if (wasCollapsed) legend.classList.remove('collapsed');

    const mapName = (document.getElementById('map-name').value || 'hotkey-map')
      .trim().replace(/\s+/g, '-').toLowerCase();
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `${mapName}-${datePart}.png`;

    try {
      const blob = await htmlToImage.toBlob(target, {
        pixelRatio: 2,
        backgroundColor: bg,
      });
      if (wasCollapsed) legend.classList.add('collapsed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (wasCollapsed) legend.classList.add('collapsed');
      console.error('PNG export failed:', err);
      alert('PNG export failed. Check the console for details.');
    }
  });

  document.getElementById('summary-search').addEventListener('input', filterSummary);


  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });

  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files[0]) importMap(e.target.files[0]);
    e.target.value = '';
  });
}

/* ── Custom categories ────────────────────────────────────────── */
function initCustomCategories() {
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
    track('category_added');
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

/* ── Platform toggle ──────────────────────────────────────────── */
function initPlatformToggle() {
  document.getElementById('platform-toggle').addEventListener('click', e => {
    const btn = e.target.closest('.platform-btn');
    if (!btn) return;
    state.platform = btn.dataset.platform;
    document.querySelectorAll('.platform-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
    });
    renderSummary();
    if (_tooltipTarget) showKeyTooltip(_tooltipTarget);
    saveToStorage();
  });
}

/* ── Legend toggle ────────────────────────────────────────────── */
function initLegendToggle() {
  const legend    = document.getElementById('legend');
  const toggleBtn = document.getElementById('btn-legend-toggle');
  if (!legend || !toggleBtn) return;

  if (localStorage.getItem('keybindr-legend-collapsed') === 'true') {
    legend.classList.add('collapsed');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = legend.classList.toggle('collapsed');
    toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    localStorage.setItem('keybindr-legend-collapsed', String(isCollapsed));
    track('categories_toggled', { collapsed: isCollapsed });
  });
}

/* ── Summary settings panel ───────────────────────────────────── */
function initSummarySettings() {
  const panel        = document.getElementById('summary-settings-panel');
  const btn          = document.getElementById('btn-summary-settings');
  const closeBtn     = document.getElementById('summary-settings-close');
  const overflowChk  = document.getElementById('setting-overflow');
  const overflowAt   = document.getElementById('setting-overflow-at');
  const overflowRow  = document.getElementById('overflow-at-row');

  function syncUI() {
    overflowChk.checked  = state.summarySettings.overflow;
    overflowAt.value     = state.summarySettings.overflowAt;
    overflowRow.classList.toggle('settings-subrow-disabled', !state.summarySettings.overflow);
  }

  function openPanel() {
    syncUI();
    const rect = btn.getBoundingClientRect();
    panel.style.top   = `${rect.bottom + 6}px`;
    panel.style.right = `${window.innerWidth - rect.right}px`;
    panel.classList.remove('hidden');
    btn.classList.add('active');
  }

  function closePanel() {
    panel.classList.add('hidden');
    btn.classList.remove('active');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.contains('hidden') ? openPanel() : closePanel();
  });

  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('click', e => {
    if (!panel.classList.contains('hidden') && !panel.contains(e.target) && e.target !== btn) {
      closePanel();
    }
  });

  overflowChk.addEventListener('change', () => {
    state.summarySettings.overflow = overflowChk.checked;
    overflowRow.classList.toggle('settings-subrow-disabled', !state.summarySettings.overflow);
    renderSummary();
    saveToStorage();
  });

  overflowAt.addEventListener('change', () => {
    const val = Math.min(50, Math.max(4, parseInt(overflowAt.value) || 8));
    overflowAt.value = val;
    state.summarySettings.overflowAt = val;
    if (state.summarySettings.overflow) { renderSummary(); saveToStorage(); }
  });

  syncUI();
}

/* ── Help modal ───────────────────────────────────────────────── */
function initHelpModal() {
  const modal   = document.getElementById('help-modal');
  const overlay = document.getElementById('help-overlay');
  const btn     = document.getElementById('btn-help');
  const closeBtn = document.getElementById('help-close');

  function open() {
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    btn.classList.add('active');
  }

  function close() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    btn.classList.remove('active');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    modal.classList.contains('hidden') ? open() : close();
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
function initFooter() {
  document.getElementById('footer-year').textContent    = new Date().getFullYear();
  document.getElementById('footer-version').textContent = `v${VERSION}`;
}

function init() {
  initTheme();
  initScheme();
  loadFromStorage();
  const loadedFromUrl = loadFromHash();

  if (loadedFromUrl) {
    track('map_loaded_from_url', { key_count: Object.keys(state.hotkeys).length });
  } else if (Object.keys(state.hotkeys).length > 0) {
    track('returning_user', { key_count: Object.keys(state.hotkeys).length });
  }

  renderKeyboard();
  initKeyboardScale();
  populateCategorySelect();
  renderLegend();
  renderSummary();
  renderTabBar();
  initEvents();
  initLayoutControls();
  initTemplates();
  initCustomCategories();
  initPlatformToggle();
  initLegendToggle();
  initSummarySettings();
  initHelpModal();
  initFooter();
}

document.addEventListener('DOMContentLoaded', init);
