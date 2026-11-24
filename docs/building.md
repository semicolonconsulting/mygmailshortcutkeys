# Build from source

## Install from source

```sh
npm run build          # writes dist/chrome, dist/firefox and a zip of each
```

- **Chrome / Edge / Brave:** open `chrome://extensions`, turn on Developer mode,
  click *Load unpacked*, pick `dist/chrome`.
- **Firefox (128+):** open `about:debugging#/runtime/this-firefox`, click
  *Load Temporary Add-on…*, pick `dist/firefox/manifest.json`.

Click the toolbar icon to open the settings page.

## Tests

```sh
npm test                               # unit tests
npm run build && npm run test:e2e      # browser tests
```

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
