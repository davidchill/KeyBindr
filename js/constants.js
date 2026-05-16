/* ── Sizing & layout constants ─────────────────────────────────── */
export const VERSION        = '0.6.1';
export const UNIT           = 44;
export const GAP            = 4;
export const FN_H           = 30;
export const MIN_KB_SCALE   = 0.45;
export const KB_PADDING     = 24;

/* ── Layout IDs ───────────────────────────────────────────────── */
export const LAYOUTS = [
  { id: 'full',       name: 'Full (104-key)'    },
  { id: 'tkl',        name: 'Tenkeyless (TKL)'  },
  { id: '60',         name: '60%'               },
  { id: 'split',      name: 'Split'             },
  { id: 'voyager',    name: 'ZSA Voyager'       },
  { id: 'moonlander', name: 'ZSA Moonlander'    },
  { id: 'ergodox',    name: 'ErgoDox EZ'        },
];

export const ZSA_IDS = new Set(['voyager', 'moonlander', 'ergodox']);

/* ── Key maps ─────────────────────────────────────────────────── */
export const KEY_MAPS = {
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

export const VALID_LAYOUTS  = new Set(LAYOUTS.map(l => l.id));
export const VALID_KEY_MAPS = new Set(Object.keys(KEY_MAPS));

/* ── Summary constants ────────────────────────────────────────── */
export const SUMMARY_COLS     = 4;
export const SUMMARY_CAT_WRAP = 8;

/* ── Split layout ─────────────────────────────────────────────── */
export const SPLIT_AFTER = new Set(['Digit5', 'KeyT', 'KeyG', 'KeyB', 'Space']);
export const SPLIT_GAP   = 28;

/* ── Default categories ───────────────────────────────────────── */
export const DEFAULT_CATEGORIES = [
  { id: 'movement',  name: 'Movement',     color: '#3b82f6' },
  { id: 'edit',      name: 'Edit / Undo',  color: '#f97316' },
  { id: 'selection', name: 'Selection',    color: '#a855f7' },
  { id: 'file',      name: 'File / Save',  color: '#22c55e' },
  { id: 'view',      name: 'View / Zoom',  color: '#06b6d4' },
  { id: 'tool',      name: 'Tool / Mode',  color: '#ef4444' },
  { id: 'combat',    name: 'Combat',       color: '#eab308' },
  { id: 'custom',    name: 'Custom',       color: '#ec4899' },
];

/* ── Keyboard layout data ─────────────────────────────────────── */
export const MAIN_ROWS = [
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

export const NAV_ROWS = [
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

export const NUMPAD_KEYS = [
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

/* ── ZSA split ergonomic keyboards ───────────────────────────── */
export const ZSA_STAGGER = { outer:20, pinky:12, ring:6, mid:0, index:6, inner:10, extra:58 };

export const ZSA_KEYBOARDS = {
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
          { stagger: ZSA_STAGGER.extra, keys: [
            { id:'BracketLeft', label:'[', sub:'{' },
            { id:'MndrInL1',    label:'' },
            { id:'MndrInL2',    label:'' },
          ]},
        ],
        thumbs: [
          { id:'MndrThL1', label:'', width:2 },
          { id:'MndrThL2', label:'' },
          { id:'MndrThL3', label:'' },
          { id:'MndrThL4', label:'' },
        ],
      },
      {
        side: 'right', thumbCols: 3, thumbLayout: 'moonlander',
        columns: [
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
          { id:'MndrThR1', label:'', width:2 },
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

/* ── Modifier display ─────────────────────────────────────────── */
export const MOD_MAP_MAC = { Ctrl: 'Cmd', Alt: 'Opt', Shift: 'Shift', Win: 'Cmd' };

/* ── Key full names (for popover search) ──────────────────────── */
export const KEY_FULL_NAMES = {
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

/* ── Theme & scheme ───────────────────────────────────────────── */
export const THEME_KEY = 'keybindr-theme';
export const SCHEME_KEY = 'keybindr-scheme';

export const SCHEME_OPTIONS = [
  { label: 'Default',   value: 'default' },
  { label: 'Synthwave', value: 'synthwave' },
  { label: 'Phosphor',  value: 'phosphor' },
  { label: 'Crimson',   value: 'crimson' },
  { label: 'Forge',     value: 'forge' },
];

/* ── Undo ─────────────────────────────────────────────────────── */
export const UNDO_LIMIT = 50;

/* ── Layout & key map UI options ──────────────────────────────── */
export const LAYOUT_OPTIONS = [
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

export const KEYMAP_OPTIONS = [
  { label: 'QWERTY', value: 'qwerty' },
  { label: 'Dvorak', value: 'dvorak' },
  { label: 'Colemak', value: 'colemak' },
  { label: 'AZERTY', value: 'azerty' },
  { label: 'QWERTZ', value: 'qwertz' },
];
