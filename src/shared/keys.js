/*
 * Shared key-combo helpers, action catalogue and default bindings.
 * Loaded as a classic script by the content script and the options page,
 * and required as a CommonJS module by the unit tests.
 *
 * Combos are stored platform-neutrally: "Mod" means ⌘ on macOS and Ctrl on
 * Windows/Linux, so synced settings work on every machine.
 */
(function (root) {
  'use strict';

  /** Every action a key can be mapped to, in the order the options page lists them. */
  const ACTIONS = [
    { id: 'delete', label: 'Delete' },
    { id: 'archive', label: 'Archive' },
    { id: 'undo', label: 'Undo last action' },
    { id: 'markRead', label: 'Mark as read' },
    { id: 'markUnread', label: 'Mark as unread' },
    { id: 'spam', label: 'Report spam' },
    { id: 'star', label: 'Star / unstar' },
    { id: 'important', label: 'Mark as important' },
    { id: 'mute', label: 'Mute conversation' },
    { id: 'snooze', label: 'Snooze' },
    { id: 'moveTo', label: 'Move to…' },
    { id: 'label', label: 'Label as…' },
    { id: 'reply', label: 'Reply' },
    { id: 'replyAll', label: 'Reply all' },
    { id: 'forward', label: 'Forward' },
    { id: 'compose', label: 'Compose' },
    { id: 'newer', label: 'Newer conversation' },
    { id: 'older', label: 'Older conversation' },
    { id: 'backToList', label: 'Back to list' },
    { id: 'search', label: 'Focus search' },
    { id: 'goInbox', label: 'Go to Inbox' },
    { id: 'goSent', label: 'Go to Sent' },
    { id: 'goStarred', label: 'Go to Starred' },
    { id: 'goDrafts', label: 'Go to Drafts' },
  ];

  const ACTION_IDS = new Set(ACTIONS.map((a) => a.id));

  const DEFAULT_BINDINGS = [
    { combo: 'Delete', action: 'delete' },
    // The key labelled "delete" on a Mac keyboard sends Backspace.
    { combo: 'Backspace', action: 'delete' },
    { combo: 'Mod+ArrowLeft', action: 'archive' },
    { combo: 'Mod+Z', action: 'undo' },
  ];

  const MODIFIER_KEYS = new Set([
    'Shift', 'Control', 'Alt', 'Meta', 'OS', 'AltGraph', 'CapsLock', 'Fn', 'FnLock', 'Hyper', 'Super',
  ]);

  function isMacPlatform(nav) {
    nav = nav || (typeof navigator !== 'undefined' ? navigator : {});
    const p = (nav.userAgentData && nav.userAgentData.platform) || nav.platform || '';
    return /mac|iphone|ipad|ipod/i.test(p);
  }

  /** Layout-friendly key name: letters and digits come from the physical key so Alt/Option combos stay readable. */
  function keyName(e) {
    const code = e.code || '';
    let m = /^Key([A-Z])$/.exec(code);
    if (m) return m[1];
    m = /^Digit([0-9])$/.exec(code);
    if (m) return m[1];
    const key = e.key;
    if (!key || key === 'Unidentified' || key === 'Dead') return null;
    if (key === ' ') return 'Space';
    if (key === '+') return 'Plus'; // keep "+" free as the combo separator
    if (key.length === 1) return key.toUpperCase();
    return key; // ArrowLeft, Delete, Backspace, Enter, Escape, F5, ...
  }

  /** Build the canonical combo string for a keydown event, or null for a bare modifier. */
  function comboFromEvent(e, isMac) {
    if (!e || MODIFIER_KEYS.has(e.key)) return null;
    const key = keyName(e);
    if (!key) return null;
    const parts = [];
    if (isMac ? e.metaKey : e.ctrlKey) parts.push('Mod');
    if (isMac && e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (!isMac && e.metaKey) parts.push('Meta');
    parts.push(key);
    return parts.join('+');
  }

  const KEY_SYMBOLS = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Backspace: 'Backspace', Delete: 'Delete', Escape: 'Esc', Enter: 'Enter', Space: 'Space', Plus: '+',
  };
  const MAC_SYMBOLS = { Mod: '⌘', Ctrl: '⌃', Alt: '⌥', Shift: '⇧', Backspace: 'delete ⌫', Delete: 'fn delete ⌦' };
  const PC_NAMES = { Mod: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Meta: 'Win' };

  /** Human-readable label for a combo on this platform, e.g. "⌘ ←" or "Ctrl+←". */
  function formatCombo(combo, isMac) {
    if (!combo) return '';
    const cleaned = combo.split('+');
    if (isMac) {
      return cleaned.map((p) => MAC_SYMBOLS[p] || KEY_SYMBOLS[p] || p).join(' ');
    }
    return cleaned.map((p) => PC_NAMES[p] || KEY_SYMBOLS[p] || p).join('+');
  }

  const TEXT_INPUT_TYPES = new Set([
    '', 'text', 'search', 'email', 'url', 'tel', 'password', 'number', 'date', 'datetime-local', 'month', 'time', 'week',
  ]);

  /** True when the element is somewhere the user types text (compose body, To field, search box, ...). */
  function isTypingElement(el) {
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const tag = node.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (tag === 'INPUT') return TEXT_INPUT_TYPES.has((node.getAttribute('type') || '').toLowerCase());
      if (node.isContentEditable) return true;
      const ce = node.getAttribute && node.getAttribute('contenteditable');
      if (ce !== null && ce !== undefined && ce !== 'false') return true;
      const role = node.getAttribute && node.getAttribute('role');
      if (role === 'textbox' || role === 'combobox' || role === 'searchbox') return true;
    }
    return false;
  }

  function isTypingContext(e, doc) {
    if (e && e.isComposing) return true; // IME (e.g. Japanese) composition in progress
    const path = e && typeof e.composedPath === 'function' ? e.composedPath() : [];
    const target = (path && path[0]) || (e && e.target);
    if (target && target.nodeType === 1 && isTypingElement(target)) return true;
    let active = doc && doc.activeElement;
    // Follow focus into iframes / shadow roots.
    while (active) {
      if (isTypingElement(active)) return true;
      if (active.shadowRoot && active.shadowRoot.activeElement) {
        active = active.shadowRoot.activeElement;
      } else if (active.tagName === 'IFRAME') {
        try {
          const inner = active.contentDocument;
          if (inner && inner.designMode === 'on') return true;
          active = inner && inner.activeElement !== inner.body ? inner.activeElement : null;
        } catch (_) {
          active = null; // cross-origin frame
        }
      } else {
        active = null;
      }
    }
    return false;
  }

  /** Validate stored bindings; anything malformed falls back to defaults. */
  function normalizeBindings(raw) {
    if (!Array.isArray(raw)) return DEFAULT_BINDINGS.map((b) => ({ ...b }));
    return raw
      .filter((b) => b && typeof b.combo === 'string' && b.combo && ACTION_IDS.has(b.action))
      .map((b) => ({ combo: b.combo, action: b.action }));
  }

  function bindingMap(bindings) {
    const map = new Map();
    for (const b of bindings) if (!map.has(b.combo)) map.set(b.combo, b.action);
    return map;
  }

  const api = {
    ACTIONS,
    ACTION_IDS,
    DEFAULT_BINDINGS,
    isMacPlatform,
    comboFromEvent,
    formatCombo,
    isTypingElement,
    isTypingContext,
    normalizeBindings,
    bindingMap,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GSK = Object.assign(root.GSK || {}, { keys: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
