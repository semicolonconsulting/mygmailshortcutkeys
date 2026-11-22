/*
 * How each action is carried out inside Gmail.
 *
 * Each action tries, in order:
 *   1. a custom function (hash navigation, focusing search, Undo toast...)
 *   2. clicking the matching visible toolbar button, found by its English
 *      aria-label / tooltip, then by Gmail's language-independent `act` code
 *   3. sending Gmail's own keyboard shortcut (needs "Keyboard shortcuts on"
 *      in Gmail settings), via the page-world bridge in page-bridge.js
 */
(function (root) {
  'use strict';

  // Native Gmail shortcut keys. keyCode is what Gmail's handlers read.
  const K = {
    a: { key: 'a', code: 'KeyA', keyCode: 65 },
    b: { key: 'b', code: 'KeyB', keyCode: 66 },
    c: { key: 'c', code: 'KeyC', keyCode: 67 },
    e: { key: 'e', code: 'KeyE', keyCode: 69 },
    f: { key: 'f', code: 'KeyF', keyCode: 70 },
    j: { key: 'j', code: 'KeyJ', keyCode: 74 },
    k: { key: 'k', code: 'KeyK', keyCode: 75 },
    l: { key: 'l', code: 'KeyL', keyCode: 76 },
    m: { key: 'm', code: 'KeyM', keyCode: 77 },
    r: { key: 'r', code: 'KeyR', keyCode: 82 },
    s: { key: 's', code: 'KeyS', keyCode: 83 },
    u: { key: 'u', code: 'KeyU', keyCode: 85 },
    v: { key: 'v', code: 'KeyV', keyCode: 86 },
    z: { key: 'z', code: 'KeyZ', keyCode: 90 },
    I: { key: 'I', code: 'KeyI', keyCode: 73, shiftKey: true },
    U: { key: 'U', code: 'KeyU', keyCode: 85, shiftKey: true },
    hash: { key: '#', code: 'Digit3', keyCode: 51, shiftKey: true },
    bang: { key: '!', code: 'Digit1', keyCode: 49, shiftKey: true },
    equals: { key: '=', code: 'Equal', keyCode: 187 },
    slash: { key: '/', code: 'Slash', keyCode: 191 },
  };

  const STRATEGIES = {
    delete: { labels: ['Delete'], act: '10', native: [K.hash] },
    archive: { labels: ['Archive'], act: '7', native: [K.e] },
    undo: { run: clickUndoToast, native: [K.z] },
    markRead: { labels: ['Mark as read'], act: '1', native: [K.I] },
    markUnread: { labels: ['Mark as unread'], act: '2', native: [K.U] },
    spam: { labels: ['Report spam'], native: [K.bang] },
    star: { native: [K.s] },
    important: { native: [K.equals] },
    mute: { native: [K.m] },
    snooze: { labels: ['Snooze'], native: [K.b] },
    moveTo: { labels: ['Move to'], native: [K.v] },
    label: { labels: ['Labels'], native: [K.l] },
    reply: { native: [K.r] },
    replyAll: { native: [K.a] },
    forward: { native: [K.f] },
    compose: { selectors: ['[gh="cm"]'], native: [K.c] },
    newer: { native: [K.k] },
    older: { native: [K.j] },
    backToList: { labelPrefixes: ['Back to'], native: [K.u] },
    search: { run: focusSearch, native: [K.slash] },
    goInbox: { run: () => goTo('inbox') },
    goSent: { run: () => goTo('sent') },
    goStarred: { run: () => goTo('starred') },
    goDrafts: { run: () => goTo('drafts') },
  };

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    if (el.getClientRects().length === 0) return false;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    if (el.getAttribute('aria-disabled') === 'true' || el.getAttribute('aria-hidden') === 'true') return false;
    return true;
  }

  function insideCompose(el) {
    // Compose windows are dialogs; never click their buttons.
    return !!el.closest('[role="dialog"]');
  }

  function candidates() {
    return Array.from(document.querySelectorAll('[role="button"], [act], button'));
  }

  function labelOf(el) {
    return (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').trim().toLowerCase();
  }

  function findButton(strategy) {
    const els = candidates().filter((el) => isVisible(el) && !insideCompose(el));
    if (strategy.selectors) {
      for (const sel of strategy.selectors) {
        const hit = Array.from(document.querySelectorAll(sel)).find(isVisible);
        if (hit) return hit;
      }
    }
    if (strategy.labels) {
      const wanted = strategy.labels.map((l) => l.toLowerCase());
      const hit = els.find((el) => wanted.includes(labelOf(el)));
      if (hit) return hit;
    }
    if (strategy.labelPrefixes) {
      const wanted = strategy.labelPrefixes.map((l) => l.toLowerCase());
      const hit = els.find((el) => wanted.some((w) => labelOf(el).startsWith(w)));
      if (hit) return hit;
    }
    if (strategy.act) {
      const hit = els.find((el) => el.getAttribute('act') === strategy.act);
      if (hit) return hit;
    }
    return null;
  }

  /** Gmail's toolbar buttons react to the full mouse sequence, not just click(). */
  function realClick(el) {
    const r = el.getBoundingClientRect();
    const opts = {
      bubbles: true, cancelable: true, view: window, button: 0,
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
    };
    el.dispatchEvent(new MouseEvent('mouseover', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
  }

  function sendNativeKeys(keys) {
    // page-bridge.js (MAIN world) turns this into real-looking key events with keyCode set,
    // which content-script-created events can't carry into the page on Firefox.
    document.dispatchEvent(new CustomEvent('gsk:native-keys', { detail: JSON.stringify(keys) }));
  }

  function clickUndoToast() {
    const direct = document.getElementById('link_undo');
    if (direct && isVisible(direct)) {
      realClick(direct);
      return true;
    }
    // Fallback: an "Undo" control inside Gmail's notification bar.
    const bars = document.querySelectorAll('[role="alert"], [aria-live]');
    for (const bar of bars) {
      const btn = Array.from(bar.querySelectorAll('[role="link"], [role="button"], span, a')).find(
        (el) => isVisible(el) && el.textContent.trim().toLowerCase() === 'undo'
      );
      if (btn) {
        realClick(btn);
        return true;
      }
    }
    return false;
  }

  function focusSearch() {
    const box = Array.from(document.querySelectorAll('input[name="q"], form[role="search"] input')).find(isVisible);
    if (!box) return false;
    box.focus();
    box.select && box.select();
    return true;
  }

  function goTo(view) {
    location.hash = '#' + view;
    return true;
  }

  /** Perform an action. Returns how it was done: "custom", "button", "keys" or null. */
  function perform(actionId) {
    const s = STRATEGIES[actionId];
    if (!s) return null;
    if (s.run && s.run()) return 'custom';
    const btn = findButton(s);
    if (btn) {
      realClick(btn);
      return 'button';
    }
    if (s.native) {
      sendNativeKeys(s.native);
      return 'keys';
    }
    return null;
  }

  root.GSK = Object.assign(root.GSK || {}, { actions: { perform, STRATEGIES } });
})(globalThis);
