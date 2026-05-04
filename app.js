/* ── Constants ────────────────────────────────────────────────── */
const UNIT = 44;
const GAP  = 4;
const FN_H = 30;

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

// Key IDs after which a visual split gap is inserted in split layout
const SPLIT_AFTER = new Set(['Digit5', 'KeyT', 'KeyG', 'KeyB', 'Space']);
const SPLIT_GAP   = 28; // px

const CATEGORIES = [
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
    { id:'Space',        label:'',     width:6.25 },
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
const state = { hotkeys: {}, layout: 'full', keyMap: 'qwerty' };
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
    applyTheme(pref);
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
    const cat = CATEGORIES.find(c => c.id === hotkey.category);
    const color = cat ? cat.color : '#4a4f6a';
    el.style.background = color;
    el.style.setProperty('box-shadow', `0 3px 0 color-mix(in srgb, ${color} 40%, black), 0 1px 2px rgba(0,0,0,0.5)`);

    const wrap = document.createElement('div');
    wrap.className = 'key-hotkey';

    if (hotkey.modifiers?.length) {
      const mods = document.createElement('div');
      mods.className = 'key-mods';
      hotkey.modifiers.forEach(m => {
        const pill = document.createElement('span');
        pill.className = 'key-mod-pill';
        pill.textContent = m;
        mods.appendChild(pill);
      });
      wrap.appendChild(mods);
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

  if (ZSA_IDS.has(state.layout)) {
    renderZSAKeyboard(state.layout);
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
}

function clearHoverHighlight() {
  document.querySelectorAll('.pair-highlight').forEach(el => el.classList.remove('pair-highlight'));
}

/* ── Hotkey summary ───────────────────────────────────────────── */
let _dragCatId = null;

function initSummaryCols() {
  if (!state.summaryCols || state.summaryCols.length !== 3) {
    const third = Math.ceil(CATEGORIES.length / 3);
    state.summaryCols = [
      CATEGORIES.slice(0, third).map(c => c.id),
      CATEGORIES.slice(third, third * 2).map(c => c.id),
      CATEGORIES.slice(third * 2).map(c => c.id),
    ];
  }
  // Ensure any category not yet in a column is added to the shortest one
  const present = new Set(state.summaryCols.flat());
  CATEGORIES.forEach(cat => {
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
  item.addEventListener('mouseenter', () => setHoverHighlight(keyId));
  item.addEventListener('mouseleave', clearHoverHighlight);

  const keyCell = document.createElement('div');
  keyCell.className = 'summary-key-cell';

  [...mods, keyLabel].forEach(part => {
    const chip = document.createElement('kbd');
    chip.className = 'summary-chip';
    chip.textContent = part;
    keyCell.appendChild(chip);
  });

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

  item.appendChild(keyCell);
  item.appendChild(info);
  return item;
}

function makeSummaryGroup(cat, items) {
  const group = document.createElement('div');
  group.className = 'summary-group';
  group.dataset.catId = cat.id;
  group.draggable = true;

  group.addEventListener('dragstart', e => {
    _dragCatId = cat.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cat.id);
    setTimeout(() => group.classList.add('dragging'), 0);
  });

  group.addEventListener('dragend', () => {
    _dragCatId = null;
    group.classList.remove('dragging');
    clearDragIndicators();
  });

  group.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();
    if (!_dragCatId || _dragCatId === cat.id) return;
    clearDragIndicators();
    const before = e.clientY < group.getBoundingClientRect().top + group.getBoundingClientRect().height / 2;
    group.classList.add(before ? 'drop-before' : 'drop-after');
  });

  group.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    if (!_dragCatId || _dragCatId === cat.id) return;
    const before = e.clientY < group.getBoundingClientRect().top + group.getBoundingClientRect().height / 2;
    moveCategoryInLayout(_dragCatId, cat.id, before);
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

  const swatch = document.createElement('span');
  swatch.className = 'summary-group-swatch';
  swatch.style.background = cat.color;
  hdr.appendChild(swatch);

  const name = document.createElement('span');
  name.className = 'summary-group-name';
  name.textContent = cat.name;
  hdr.appendChild(name);

  group.appendChild(hdr);

  const itemsEl = document.createElement('div');
  itemsEl.className = 'summary-items';
  items.forEach(entry => itemsEl.appendChild(makeSummaryItem(entry)));
  group.appendChild(itemsEl);

  return group;
}

function renderSummary() {
  const container = document.getElementById('summary-grid');
  const empty     = document.getElementById('summary-empty');
  const entries   = getOrderedHotkeys();

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

  const colsEl = document.createElement('div');
  colsEl.className = 'summary-columns';

  [0, 1, 2].forEach(colIdx => {
    const colEl = document.createElement('div');
    colEl.className = 'summary-col';
    colEl.dataset.col = colIdx;

    state.summaryCols[colIdx].forEach(catId => {
      const items = buckets[catId];
      if (!items?.length) return;
      const cat = CATEGORIES.find(c => c.id === catId);
      if (cat) colEl.appendChild(makeSummaryGroup(cat, items));
    });

    colEl.addEventListener('dragover', e => {
      e.preventDefault();
      colEl.classList.add('drag-over');
    });
    colEl.addEventListener('dragleave', e => {
      if (!colEl.contains(e.relatedTarget)) colEl.classList.remove('drag-over');
    });
    colEl.addEventListener('drop', e => {
      e.preventDefault();
      colEl.classList.remove('drag-over');
      if (_dragCatId) moveCategoryToColumn(_dragCatId, colIdx);
    });

    colsEl.appendChild(colEl);
  });

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

  CATEGORIES.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = 'cat-chip';
    chip.innerHTML = `
      <span class="cat-swatch" style="background:${cat.color}"></span>
      <span>${cat.name}</span>
      ${counts[cat.id] ? `<span class="cat-count">${counts[cat.id]}</span>` : ''}
    `;
    list.appendChild(chip);
  });

  const count = Object.keys(state.hotkeys).length;
  document.getElementById('stat-assigned').textContent =
    count === 1 ? '1 key assigned' : `${count} keys assigned`;
}

/* ── Category select ──────────────────────────────────────────── */
function populateCategorySelect() {
  const sel = document.getElementById('hotkey-category');
  sel.innerHTML = '<option value="">— No category —</option>';
  CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
}

/* ── Popover ──────────────────────────────────────────────────── */
function openPopover(keyId) {
  activeKeyId = keyId;
  const def = findKeyDef(keyId);
  const label = (def ? getKeyLabel(def) : '') || keyId;

  document.getElementById('popover-key-badge').textContent = label;
  document.getElementById('popover-title').textContent = label;

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

  document.getElementById('popover').classList.remove('hidden');
  document.getElementById('popover-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('hotkey-label').focus(), 30);
}

function closePopover() {
  activeKeyId = null;
  document.getElementById('popover').classList.add('hidden');
  document.getElementById('popover-overlay').classList.add('hidden');
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

  const modifiers = [...document.querySelectorAll('.mod-chip input:checked')].map(cb => cb.value);

  state.hotkeys[activeKeyId] = {
    label,
    description: document.getElementById('hotkey-desc').value.trim(),
    category:    document.getElementById('hotkey-category').value,
    modifiers,
  };

  refreshKey(activeKeyId);
  renderLegend();
  renderSummary();
  saveToStorage();
  closePopover();
}

function clearHotkey() {
  if (!activeKeyId) return;
  delete state.hotkeys[activeKeyId];
  refreshKey(activeKeyId);
  renderLegend();
  renderSummary();
  saveToStorage();
  closePopover();
}

/* ── Storage ──────────────────────────────────────────────────── */
function saveToStorage() {
  try {
    localStorage.setItem('keybindr', JSON.stringify({
      hotkeys:     state.hotkeys,
      mapName:     document.getElementById('map-name').value,
      layout:      state.layout,
      keyMap:      state.keyMap,
      summaryCols: state.summaryCols,
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
    if (data.layout)      state.layout      = data.layout;
    if (data.keyMap)      state.keyMap      = data.keyMap;
    if (data.summaryCols) state.summaryCols = data.summaryCols;
  } catch (_) {}
}

/* ── Export / Import ──────────────────────────────────────────── */
function exportMap() {
  const name = document.getElementById('map-name').value || 'hotkey-map';
  const data = { version: 1, name, hotkeys: state.hotkeys };
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
      state.hotkeys = data.hotkeys;
      if (data.name) document.getElementById('map-name').value = data.name;
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

/* ── Templates ────────────────────────────────────────────────── */
function openTemplatesModal() {
  document.getElementById('template-modal').classList.remove('hidden');
  document.getElementById('template-overlay').classList.remove('hidden');
}

function closeTemplatesModal() {
  document.getElementById('template-modal').classList.add('hidden');
  document.getElementById('template-overlay').classList.add('hidden');
}

function loadTemplate(template) {
  if (Object.keys(state.hotkeys).length > 0 &&
      !confirm(`Load "${template.name}"? This will replace your current map.`)) return;

  state.hotkeys = Object.fromEntries(
    Object.entries(template.hotkeys).map(([k, v]) => [k, { ...v }])
  );
  document.getElementById('map-name').value = template.name;
  renderKeyboard();
  renderLegend();
  renderSummary();
  saveToStorage();
  closeTemplatesModal();
}

function initTemplates() {
  const grid = document.getElementById('template-grid');

  TEMPLATES.forEach(template => {
    const count = Object.keys(template.hotkeys).length;
    const tile = document.createElement('button');
    tile.className = 'template-tile';
    tile.dataset.category = template.appCategory;
    tile.innerHTML = `
      <span class="template-icon">${template.icon}</span>
      <span class="template-name">${template.name}</span>
      <span class="template-meta">
        <span class="template-badge">${template.appCategory}</span>
        <span class="template-count">${count} keys</span>
      </span>`;
    tile.addEventListener('click', () => loadTemplate(template));
    grid.appendChild(tile);
  });

  document.querySelectorAll('.template-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.template-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      document.querySelectorAll('.template-tile').forEach(tile => {
        tile.classList.toggle('hidden', cat !== 'all' && tile.dataset.category !== cat);
      });
    });
  });

  document.getElementById('btn-templates').addEventListener('click', openTemplatesModal);
  document.getElementById('template-close').addEventListener('click', closeTemplatesModal);
  document.getElementById('template-overlay').addEventListener('click', closeTemplatesModal);
}

/* ── Layout controls ──────────────────────────────────────────── */
function initLayoutControls() {
  const layoutSel  = document.getElementById('select-layout');
  const keymapSel  = document.getElementById('select-keymap');

  layoutSel.value  = state.layout;
  keymapSel.value  = state.keyMap;

  layoutSel.addEventListener('change', () => {
    state.layout = layoutSel.value;
    renderKeyboard();
    saveToStorage();
  });

  keymapSel.addEventListener('change', () => {
    state.keyMap = keymapSel.value;
    renderKeyboard();
    saveToStorage();
  });
}

/* ── Events ───────────────────────────────────────────────────── */
function initEvents() {
  document.getElementById('popover-close').addEventListener('click', closePopover);
  document.getElementById('popover-overlay').addEventListener('click', closePopover);

  document.querySelectorAll('.mod-chip input').forEach(cb => {
    cb.addEventListener('change', () => cb.closest('.mod-chip').classList.toggle('active', cb.checked));
  });

  document.getElementById('btn-save-hotkey').addEventListener('click', saveHotkey);
  document.getElementById('btn-clear-hotkey').addEventListener('click', clearHotkey);

  document.getElementById('hotkey-label').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveHotkey();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (activeKeyId) closePopover();
    else if (!document.getElementById('template-modal').classList.contains('hidden')) closeTemplatesModal();
  });

  document.getElementById('map-name').addEventListener('input', saveToStorage);

  document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (!Object.keys(state.hotkeys).length) return;
    if (confirm('Clear all assigned hotkeys from this map?')) {
      state.hotkeys = {};
      renderKeyboard();
      renderLegend();
      renderSummary();
      saveToStorage();
    }
  });

  document.getElementById('btn-export').addEventListener('click', exportMap);

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });

  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files[0]) importMap(e.target.files[0]);
    e.target.value = '';
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
function init() {
  initTheme();
  loadFromStorage();
  renderKeyboard();
  populateCategorySelect();
  renderLegend();
  renderSummary();
  initEvents();
  initLayoutControls();
  initTemplates();
}

document.addEventListener('DOMContentLoaded', init);
