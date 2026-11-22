// Renders store images into store/: hero and settings screenshots (1280x800) and the small promo tile (440x280).
// Needs Playwright and a fresh `npm run build`.
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'store');
const icon = 'data:image/png;base64,' + readFileSync(join(root, 'src/icons/icon128.png')).toString('base64');

const css = `
  * { box-sizing: border-box; margin: 0; }
  body { font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; color: #f1f3f4;
         background: radial-gradient(circle at 20% 0%, #3c4043 0%, #202124 60%); }
  .kc { display: inline-flex; align-items: center; justify-content: center; min-width: 1.9em; height: 1.9em; padding: 0 .45em;
        border-radius: .32em; background: #fff; color: #202124; font-weight: 600;
        box-shadow: 0 .14em 0 #9aa0a6; margin-right: .3em; }
`;

const hero = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
  body { width: 1280px; height: 800px; padding: 80px 96px; display: flex; flex-direction: column; justify-content: center; }
  .top { display: flex; align-items: center; gap: 28px; margin-bottom: 56px; }
  .top img { width: 112px; height: 112px; }
  h1 { font-size: 60px; font-weight: 700; letter-spacing: -0.5px; }
  .sub { font-size: 26px; color: #bdc1c6; margin-top: 8px; }
  .row { display: flex; align-items: center; font-size: 40px; margin: 18px 0; }
  .keys { width: 300px; display: flex; }
  .act { font-weight: 500; }
  .alt { font-size: 22px; color: #9aa0a6; margin-left: 18px; }
  .foot { margin-top: 48px; font-size: 24px; color: #bdc1c6; }
</style></head><body>
  <div class="top"><img src="${icon}"><div><h1>Shortcut Keys for Gmail</h1>
    <div class="sub">Familiar keys for your inbox. Map any key to any Gmail action.</div></div></div>
  <div class="row"><div class="keys"><span class="kc">delete</span></div><span class="act">Delete</span></div>
  <div class="row"><div class="keys"><span class="kc">⌘</span><span class="kc">←</span></div><span class="act">Archive</span><span class="alt">Ctrl + ← on Windows</span></div>
  <div class="row"><div class="keys"><span class="kc">⌘</span><span class="kc">Z</span></div><span class="act">Undo</span><span class="alt">Ctrl + Z on Windows</span></div>
  <div class="foot">Never fires while you type · 24 actions · No data collected</div>
</body></html>`;

const tile = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
  body { width: 440px; height: 280px; padding: 28px 30px; display: flex; flex-direction: column; justify-content: center; }
  .top { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
  img { width: 56px; height: 56px; }
  h1 { font-size: 26px; font-weight: 700; line-height: 1.15; }
  .keys { display: flex; gap: 14px; font-size: 22px; }
  .k { display: flex; }
</style></head><body>
  <div class="top"><img src="${icon}"><h1>Shortcut Keys<br>for Gmail</h1></div>
  <div class="keys"><div class="k"><span class="kc">delete</span></div><div class="k"><span class="kc">⌘</span><span class="kc">←</span></div><div class="k"><span class="kc">⌘</span><span class="kc">Z</span></div></div>
</body></html>`;

const browser = await chromium.launch();
for (const [name, html, w, h] of [['screenshot-1-hero.png', hero, 1280, 800], ['promo-tile-440x280.png', tile, 440, 280]]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  await p.screenshot({ path: join(out, name) });
  await p.close();
}
await browser.close();

// Settings page, loaded inside the real extension, shown as on a Mac.
const ext = join(root, 'dist', 'chrome');
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'gsk-')), {
  channel: 'chromium', headless: true, viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
await ctx.addInitScript(() => {
  Object.defineProperty(Navigator.prototype, 'platform', { get: () => 'MacIntel' });
  Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => ({ platform: 'macOS' }) });
});
const sw = ctx.serviceWorkers()[0] || (await ctx.waitForEvent('serviceworker'));
const id = new URL(sw.url()).host;
const page = await ctx.newPage();
await page.goto(`chrome-extension://${id}/options/options.html`);
await page.waitForSelector('#rows tr');
await page.evaluate(() => chrome.storage.sync.set({ bindings: [
  { combo: 'Backspace', action: 'delete' }, { combo: 'Mod+ArrowLeft', action: 'archive' }, { combo: 'Mod+Z', action: 'undo' },
  { combo: 'Shift+S', action: 'star' }, { combo: 'Mod+Shift+U', action: 'markUnread' },
] }));
await page.reload();
await page.waitForSelector('#rows tr:nth-child(5)');
await page.screenshot({ path: join(out, 'screenshot-2-settings.png') });
await ctx.close();
console.log('store images written to store/');
