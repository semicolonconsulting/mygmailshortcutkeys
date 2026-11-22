# Publishing guide

Everything to paste is in [listing.md](listing.md). The images are in this folder.
Build the packages first:

```sh
npm run build
# dist/shortcut-keys-for-gmail-chrome-<version>.zip
# dist/shortcut-keys-for-gmail-firefox-<version>.zip
```

## Chrome Web Store

1. Register as a developer at https://chrome.google.com/webstore/devconsole
   (one-time US$5 fee, plus account verification).
2. **Add new item** → upload `dist/shortcut-keys-for-gmail-chrome-<version>.zip`.
3. **Store listing** tab
   - Description and summary from listing.md. Category: Productivity → Communication.
   - Language: English.
   - Store icon: `src/icons/icon128.png`.
   - Screenshots: `store/screenshot-1-hero.png`, `store/screenshot-2-settings.png` (1280×800).
   - Small promo tile: `store/promo-tile-440x280.png`.
   - Homepage and support URL: the GitHub repo.
4. **Privacy practices** tab: copy the answers from listing.md (single purpose, the two
   permission justifications, "no remote code", no data collected, tick the three
   certifications). Privacy policy URL: the PRIVACY.md link in listing.md.
5. **Distribution**: Public, all regions (or as you like). Free.
6. **Submit for review.** First reviews usually take a few days. Host permissions on
   mail.google.com can trigger an "in-depth review" notice; that's expected.

## Firefox Add-ons (AMO)

1. Sign in at https://addons.mozilla.org/developers/ with a Mozilla account (free).
2. **Submit a New Add-on** → *On this site* (listed) → upload
   `dist/shortcut-keys-for-gmail-firefox-<version>.zip`.
3. Validation should pass. When asked about source code, answer **No** (no build tools,
   no minification).
4. Fill in name, summary, description from listing.md. Category: Social & Communication.
   License: MIT. Support site: the GitHub repo. Privacy policy: paste the text of PRIVACY.md.
5. Add the two screenshots (optional on AMO but helps) and the reviewer notes from listing.md.
6. Submit. Automated review is often minutes; a human review may follow later.

## Releasing an update

1. Bump `version` in `src/manifest.json` and `package.json` (stores reject a re-used version).
2. `npm test && npm run build && npm run test:e2e`
3. Upload the new zips: Chrome → item → **Package** → *Upload new package*;
   AMO → **Upload New Version**.

## Regenerating images

`node scripts/store-assets.mjs` (after `npm run build`) redraws the screenshots and tile.
`npm run icons` redraws the icons.
