// Builds dist/chrome and dist/firefox from the shared src/ folder and zips each.
// Usage: node scripts/build.mjs [chrome|firefox ...]   (default: both)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');
const base = JSON.parse(readFileSync(join(src, 'manifest.json'), 'utf8'));

const targets = {
  chrome: (m) => ({ ...m, background: { service_worker: 'background.js' }, minimum_chrome_version: '111' }),
  firefox: (m) => ({
    ...m,
    background: { scripts: ['background.js'] },
    browser_specific_settings: {
      gecko: {
        id: 'shortcut-keys-for-gmail@semicolonconsulting',
        strict_min_version: '128.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
  }),
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(targets);
for (const name of wanted) {
  if (!targets[name]) throw new Error(`Unknown target ${name}`);
  const out = join(dist, name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(src, out, { recursive: true });
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(targets[name](base), null, 2) + '\n');
  const zip = join(dist, `shortcut-keys-for-gmail-${name}-${base.version}.zip`);
  if (existsSync(zip)) rmSync(zip);
  execFileSync('zip', ['-qr', '-X', zip, '.'], { cwd: out });
  console.log(`built ${name}: dist/${name}/ and ${zip.slice(root.length + 1)}`);
}
