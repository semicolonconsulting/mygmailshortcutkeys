# My Shortcut Keys for Gmail

A Chrome and Firefox extension (Manifest V3, one shared codebase) that adds
familiar, customizable keyboard shortcuts to Gmail.

| Key (macOS) | Key (Windows / Linux) | Action |
|---|---|---|
| `delete` (Backspace) or `fn`+`delete` | `Delete` or `Backspace` | Delete the selected or open email |
| `⌘` `←` | `Ctrl` `←` | Archive |
| `⌘` `Z` | `Ctrl` `Z` | Undo the last action (clicks Gmail's own Undo) |

Any key combination can be mapped to any of 24 actions (archive, delete, undo,
read/unread, spam, star, important, mute, snooze, move, label, reply, reply all,
forward, compose, newer/older, back to list, search, go to Inbox/Sent/Starred/Drafts)
on the options page. Settings sync through the browser account.

Shortcuts never fire while you are typing: compose, inline replies, To/Cc fields,
the search box, any text field, and during IME composition (e.g. Japanese input).
Holding a key down does not repeat the action.

## Install

- **Chrome / Edge / Brave:** [My Shortcut Keys for Gmail on the Chrome Web Store](https://chromewebstore.google.com/detail/my-shortcut-keys-for-gmai/npcmjpdpogdfnlhagpoclfkhfjbpgmob)
- **Firefox:** the Firefox Add-ons listing is coming soon. Until then, load it
  from source as described below.

After installing, click the toolbar icon to open the settings page.

## Install for development

```sh
npm run build          # writes dist/chrome, dist/firefox and a zip of each
```

- **Chrome / Edge / Brave:** open `chrome://extensions`, turn on Developer mode,
  click *Load unpacked*, pick `dist/chrome`.
- **Firefox (128+):** open `about:debugging#/runtime/this-firefox`, click
  *Load Temporary Add-on…*, pick `dist/firefox/manifest.json`.

Click the toolbar icon to open the settings page.

## How actions run

Each action tries, in order (see `src/content/actions.js`):

1. A direct method where one exists (Undo link in Gmail's notification bar, the
   search box, `#inbox`-style navigation).
2. Clicking the visible Gmail toolbar button, matched by its English label and
   then by Gmail's language-independent `act` code.
3. Sending Gmail's own keyboard shortcut (`#`, `e`, `z`, `s`, …). This needs
   **Gmail Settings → See all settings → General → Keyboard shortcuts on**.
   Star, important, mute, reply, reply all, forward, and newer/older always use
   this route.

Gmail changes its markup from time to time; if an action stops working, step 2
is the usual culprit and step 3 keeps it working when shortcuts are on.

## Layout

```
src/
  manifest.json          shared manifest (build adds the browser-specific bits)
  background.js          toolbar button and first install open the settings page
  shared/keys.js         key-combo parsing, action list, defaults, typing guard
  content/actions.js     how each action is carried out in Gmail
  content/content.js     keydown listener on mail.google.com
  content/page-bridge.js page-world helper that sends Gmail's native shortcuts
  options/               settings page
scripts/build.mjs        builds dist/chrome and dist/firefox
scripts/make-icons.py    redraws the icons (needs Pillow)
test/keys.test.mjs       unit tests (npm test)
test/e2e.mjs             loads the built extension in Chromium against a mock Gmail page (npm run test:e2e, needs Playwright)
store/                 listing text, store images, publishing guide (store/PUBLISHING.md)
PRIVACY.md             privacy policy linked from both stores
```

## Tests

```sh
npm test                               # unit tests
npm run build && npm run test:e2e      # browser tests
```
