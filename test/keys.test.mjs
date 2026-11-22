import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const K = require('../src/shared/keys.js');

const ev = (o) => ({ metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, code: '', ...o });

test('Mac: ⌘ is Mod, Ctrl stays separate', () => {
  assert.equal(K.comboFromEvent(ev({ key: 'ArrowLeft', code: 'ArrowLeft', metaKey: true }), true), 'Mod+ArrowLeft');
  assert.equal(K.comboFromEvent(ev({ key: 'z', code: 'KeyZ', metaKey: true }), true), 'Mod+Z');
  assert.equal(K.comboFromEvent(ev({ key: 'z', code: 'KeyZ', ctrlKey: true }), true), 'Ctrl+Z');
});

test('Windows/Linux: Ctrl is Mod, Win key is Meta', () => {
  assert.equal(K.comboFromEvent(ev({ key: 'ArrowLeft', code: 'ArrowLeft', ctrlKey: true }), false), 'Mod+ArrowLeft');
  assert.equal(K.comboFromEvent(ev({ key: 'z', code: 'KeyZ', ctrlKey: true }), false), 'Mod+Z');
  assert.equal(K.comboFromEvent(ev({ key: 'z', code: 'KeyZ', metaKey: true }), false), 'Meta+Z');
});

test('plain keys, Option letters and bare modifiers', () => {
  assert.equal(K.comboFromEvent(ev({ key: 'Delete', code: 'Delete' }), true), 'Delete');
  assert.equal(K.comboFromEvent(ev({ key: 'Backspace', code: 'Backspace' }), true), 'Backspace');
  assert.equal(K.comboFromEvent(ev({ key: 'å', code: 'KeyA', altKey: true }), true), 'Alt+A');
  assert.equal(K.comboFromEvent(ev({ key: '#', code: 'Digit3', shiftKey: true }), false), 'Shift+3');
  assert.equal(K.comboFromEvent(ev({ key: '+', code: 'Equal', shiftKey: true }), false), 'Shift+Plus');
  assert.equal(K.comboFromEvent(ev({ key: 'Shift', code: 'ShiftLeft', shiftKey: true }), false), null);
  assert.equal(K.comboFromEvent(ev({ key: 'Meta', code: 'MetaLeft', metaKey: true }), true), null);
});

test('formatCombo per platform', () => {
  assert.equal(K.formatCombo('Mod+ArrowLeft', true), '⌘ ←');
  assert.equal(K.formatCombo('Mod+ArrowLeft', false), 'Ctrl+←');
  assert.equal(K.formatCombo('Mod+Shift+Z', true), '⌘ ⇧ Z');
  assert.equal(K.formatCombo('Shift+Plus', false), 'Shift++');
});

test('defaults cover the three requested shortcuts', () => {
  const map = K.bindingMap(K.normalizeBindings(undefined));
  assert.equal(map.get('Delete'), 'delete');
  assert.equal(map.get('Backspace'), 'delete');
  assert.equal(map.get('Mod+ArrowLeft'), 'archive');
  assert.equal(map.get('Mod+Z'), 'undo');
});

test('normalizeBindings drops junk and keeps an empty list empty', () => {
  assert.deepEqual(K.normalizeBindings([]), []);
  assert.deepEqual(
    K.normalizeBindings([{ combo: 'S', action: 'star' }, { combo: 'X', action: 'nope' }, null, { combo: '', action: 'star' }]),
    [{ combo: 'S', action: 'star' }]
  );
});

test('every action has a strategy in the content script', async () => {
  globalThis.GSK = {};
  globalThis.location = { hash: '' };
  await import('../src/content/actions.js');
  const ids = Object.keys(globalThis.GSK.actions.STRATEGIES).sort();
  assert.deepEqual(ids, K.ACTIONS.map((a) => a.id).sort());
});
