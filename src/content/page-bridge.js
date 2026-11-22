/*
 * Runs in the page's own JavaScript world (manifest "world": "MAIN").
 * Receives key sequences from the content script and dispatches them as
 * keydown/keypress/keyup with legacy keyCode/which/charCode set, which is
 * what Gmail's built-in shortcut handler reads.
 */
(function () {
  'use strict';

  function makeEvent(type, k) {
    const ev = new KeyboardEvent(type, {
      key: k.key,
      code: k.code,
      shiftKey: !!k.shiftKey,
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
    });
    const charCode = type === 'keypress' ? k.key.charCodeAt(0) : 0;
    const keyCode = type === 'keypress' ? charCode : k.keyCode;
    Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
    Object.defineProperty(ev, 'which', { get: () => keyCode });
    Object.defineProperty(ev, 'charCode', { get: () => charCode });
    return ev;
  }

  document.addEventListener('gsk:native-keys', (e) => {
    let keys;
    try {
      keys = JSON.parse(e.detail);
    } catch (_) {
      return;
    }
    if (!Array.isArray(keys)) return;
    const target = document.activeElement && document.activeElement !== document.documentElement
      ? document.activeElement
      : document.body;
    for (const k of keys) {
      if (!k || typeof k.key !== 'string' || typeof k.keyCode !== 'number') continue;
      for (const type of ['keydown', 'keypress', 'keyup']) target.dispatchEvent(makeEvent(type, k));
    }
  });
})();
