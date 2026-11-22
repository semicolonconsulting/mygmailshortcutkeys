/*
 * Listens for shortcut keys on Gmail and runs the mapped action.
 * Keys are ignored while the user is typing (compose, reply, search, any text field).
 */
(function () {
  'use strict';

  const ext = globalThis.browser || globalThis.chrome;
  const { keys, actions } = globalThis.GSK;
  const isMac = keys.isMacPlatform();

  let enabled = true;
  let bindings = keys.bindingMap(keys.normalizeBindings(undefined));

  function applySettings(data) {
    enabled = data.enabled !== false;
    bindings = keys.bindingMap(keys.normalizeBindings(data.bindings));
  }

  ext.storage.sync.get(['enabled', 'bindings']).then(applySettings, () => {});
  ext.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    ext.storage.sync.get(['enabled', 'bindings']).then(applySettings, () => {});
  });

  function onKeyDown(e) {
    // Only react to the user's real key presses, never to keys we synthesise for Gmail.
    if (!enabled || !e.isTrusted || e.defaultPrevented) return;
    const combo = keys.comboFromEvent(e, isMac);
    if (!combo) return;
    const action = bindings.get(combo);
    if (!action) return;
    if (keys.isTypingContext(e, document)) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat) return; // holding Delete must not delete a whole inbox
    try {
      actions.perform(action);
    } catch (err) {
      console.warn('[Shortcut Keys for Gmail] action failed:', action, err);
    }
  }

  // Capture phase on window so we run before Gmail and before the browser's own
  // ⌘/Ctrl+← (history back) handling.
  window.addEventListener('keydown', onKeyDown, true);
})();
