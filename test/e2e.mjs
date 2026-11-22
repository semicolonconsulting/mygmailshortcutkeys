// End-to-end check: loads the built Chrome extension into Chromium, serves a mock
// Gmail page at https://mail.google.com/mail/u/0/, and presses real keys.
// Run `npm run build` first.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ext = join(root, 'dist', 'chrome');
const html = readFileSync(join(root, 'test', 'fixtures', 'mock-gmail.html'), 'utf8');
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'gsk-')), {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
await ctx.route('https://mail.google.com/**', (r) => r.fulfill({ contentType: 'text/html', body: html }));

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log('ok  ', name);
  } catch (e) {
    failures++;
    console.log('FAIL', name, '\n     ', e.message.split('\n').join('\n      '));
  }
}

// The install hook opens the options page; grab it for the options tests.
let sw = ctx.serviceWorkers()[0] || (await ctx.waitForEvent('serviceworker'));
const extId = new URL(sw.url()).host;

const page = await ctx.newPage();
page.setDefaultTimeout(5000);
const fresh = async () => {
  await page.goto('https://mail.google.com/mail/u/0/?n=' + Math.random() + '#inbox');
  await page.waitForTimeout(300);
  await page.click('#m2'); // focus page, not a text field
};
const log = () => page.evaluate(() => window.log.filter((l) => !l.startsWith('pagekey:')));

await check('Delete key deletes the selected email via the visible toolbar button', async () => {
  await fresh();
  await page.keyboard.press('Delete');
  assert.deepEqual(await log(), ['delete:m1']);
});

await check('Backspace (Mac "delete") also deletes', async () => {
  await fresh();
  await page.keyboard.press('Backspace');
  assert.deepEqual(await log(), ['delete:m1']);
});

await check(`${MOD}+ArrowLeft archives (and the hidden duplicate toolbar is ignored)`, async () => {
  await fresh();
  await page.keyboard.press(`${MOD}+ArrowLeft`);
  assert.deepEqual(await log(), ['archive:m1']);
});

await check(`${MOD}+Z undoes via Gmail's Undo link`, async () => {
  await fresh();
  await page.keyboard.press(`${MOD}+ArrowLeft`);
  await page.keyboard.press(`${MOD}+Z`);
  assert.deepEqual(await log(), ['archive:m1', 'undo:m1']);
  assert.equal(await page.locator('#m1').count(), 1);
});

await check('the bound key does not reach Gmail itself', async () => {
  await fresh();
  await page.keyboard.press('Delete');
  const all = await page.evaluate(() => window.log);
  assert.ok(!all.includes('pagekey:Delete'), JSON.stringify(all));
});

await check('keys are ignored while typing in To, the compose body and search', async () => {
  await fresh();
  for (const sel of ['#to', '#body', '#search']) {
    await page.click(sel);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Delete');
    await page.keyboard.press(`${MOD}+ArrowLeft`);
    await page.keyboard.press(`${MOD}+Z`);
  }
  assert.deepEqual(await log(), []);
});

await check('holding Delete (key repeat) deletes only one email', async () => {
  await fresh();
  await page.keyboard.down('Delete');
  await page.keyboard.down('Delete'); // repeat
  await page.keyboard.down('Delete');
  await page.keyboard.up('Delete');
  assert.deepEqual(await log(), ['delete:m1']);
});

const opts = await ctx.newPage();
await opts.goto(`chrome-extension://${extId}/options/options.html`);

await check('options page lists the defaults', async () => {
  await opts.waitForSelector('#rows tr');
  const rows = await opts.$$eval('#rows tr', (trs) =>
    trs.map((tr) => [tr.querySelector('.combo').textContent, tr.querySelector('select').value])
  );
  const modLabel = process.platform === 'darwin' ? '⌘' : 'Ctrl';
  assert.deepEqual(rows, [
    ['Delete', 'delete'],
    ['Backspace', 'delete'],
    [process.platform === 'darwin' ? '⌘ ←' : 'Ctrl+←', 'archive'],
    [process.platform === 'darwin' ? '⌘ Z' : 'Ctrl+Z', 'undo'],
  ]);
  void modLabel;
});

await check('a custom mapping recorded in options works in Gmail right away', async () => {
  await opts.click('#add');
  await opts.keyboard.press('Shift+S');
  await opts.locator('#rows tr').last().locator('select').selectOption('star');
  await opts.waitForFunction(() => document.getElementById('status').textContent === 'Saved.');
  await fresh();
  await page.keyboard.press('Shift+S');
  // Star has no toolbar button, so it goes through Gmail's own "s" shortcut.
  assert.deepEqual(await log(), ['native:s:115']);
});

await check('the enable switch turns everything off', async () => {
  await opts.uncheck('#enabled');
  await page.waitForTimeout(200);
  await fresh();
  await page.keyboard.press('Delete');
  assert.deepEqual(await log(), []);
  await opts.check('#enabled');
});

await opts.screenshot({ path: join(root, 'dist', 'options-screenshot.png'), fullPage: true });
await ctx.close();
console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
