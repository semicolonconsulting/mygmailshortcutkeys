(function () {
  'use strict';

  const ext = globalThis.browser || globalThis.chrome;
  const K = globalThis.GSK.keys;
  const isMac = K.isMacPlatform();

  const rowsEl = document.getElementById('rows');
  const emptyEl = document.getElementById('empty');
  const statusEl = document.getElementById('status');
  const enabledEl = document.getElementById('enabled');

  let bindings = [];
  let recordingIndex = -1;

  document.querySelector('[data-mod]').textContent = isMac ? '⌘' : 'Ctrl';
  document.getElementById('mod-name').textContent = isMac ? 'the Command key (⌘)' : 'the Ctrl key';

  function setStatus(text, warn) {
    statusEl.textContent = text || '';
    statusEl.classList.toggle('warn', !!warn);
  }

  function duplicates() {
    const seen = new Map();
    const dup = new Set();
    bindings.forEach((b) => {
      if (!b.combo) return;
      if (seen.has(b.combo)) dup.add(b.combo);
      seen.set(b.combo, true);
    });
    return dup;
  }

  async function save() {
    const complete = bindings.filter((b) => b.combo);
    await ext.storage.sync.set({ bindings: complete });
    const dup = duplicates();
    if (dup.size) {
      setStatus(`${[...dup].map((c) => K.formatCombo(c, isMac)).join(', ')} is mapped more than once. Only the first one is used.`, true);
    } else {
      setStatus('Saved.');
    }
  }

  function render() {
    rowsEl.textContent = '';
    const dup = duplicates();
    bindings.forEach((b, i) => {
      const tr = document.createElement('tr');

      const comboTd = document.createElement('td');
      const comboBtn = document.createElement('button');
      comboBtn.className = 'combo';
      comboBtn.type = 'button';
      if (i === recordingIndex) {
        comboBtn.textContent = 'Press a key…';
        comboBtn.classList.add('recording');
      } else {
        comboBtn.textContent = b.combo ? K.formatCombo(b.combo, isMac) : 'Click to set a key';
      }
      if (b.combo && dup.has(b.combo)) comboBtn.classList.add('conflict');
      comboBtn.title = 'Click, then press the key combination';
      comboBtn.addEventListener('click', () => startRecording(i));
      comboTd.appendChild(comboBtn);

      const actionTd = document.createElement('td');
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Action');
      for (const a of K.ACTIONS) {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.label;
        select.appendChild(opt);
      }
      select.value = b.action;
      select.addEventListener('change', () => {
        b.action = select.value;
        save();
      });
      actionTd.appendChild(select);

      const removeTd = document.createElement('td');
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', 'Remove shortcut');
      removeBtn.addEventListener('click', () => {
        bindings.splice(i, 1);
        if (recordingIndex === i) recordingIndex = -1;
        render();
        save();
      });
      removeTd.appendChild(removeBtn);

      tr.append(comboTd, actionTd, removeTd);
      rowsEl.appendChild(tr);
    });
    emptyEl.hidden = bindings.length > 0;
  }

  function startRecording(i) {
    recordingIndex = i;
    render();
    setStatus('Press the key combination, or Esc to cancel.');
  }

  window.addEventListener(
    'keydown',
    (e) => {
      if (recordingIndex < 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const b = bindings[recordingIndex];
        if (b && !b.combo) bindings.splice(recordingIndex, 1);
        recordingIndex = -1;
        render();
        setStatus('');
        return;
      }
      const combo = K.comboFromEvent(e, isMac);
      if (!combo) return; // waiting for a non-modifier key
      bindings[recordingIndex].combo = combo;
      recordingIndex = -1;
      render();
      save();
    },
    true
  );

  document.getElementById('add').addEventListener('click', () => {
    const used = new Set(bindings.map((b) => b.action));
    const next = K.ACTIONS.find((a) => !used.has(a.id)) || K.ACTIONS[0];
    bindings.push({ combo: '', action: next.id });
    startRecording(bindings.length - 1);
  });

  document.getElementById('reset').addEventListener('click', () => {
    bindings = K.DEFAULT_BINDINGS.map((b) => ({ ...b }));
    recordingIndex = -1;
    render();
    save();
  });

  enabledEl.addEventListener('change', () => {
    ext.storage.sync.set({ enabled: enabledEl.checked });
    setStatus(enabledEl.checked ? 'Shortcuts on.' : 'Shortcuts off.');
  });

  ext.storage.sync.get(['enabled', 'bindings']).then((data) => {
    enabledEl.checked = data.enabled !== false;
    bindings = K.normalizeBindings(data.bindings);
    render();
  });
})();
