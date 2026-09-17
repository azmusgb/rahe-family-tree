import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const productionRoots = ['src', '.'];
const ignoredTopLevel = new Set([
  '.git', '.github', 'docs', 'e2e', 'netlify', 'node_modules', 'scripts', 'data', 'public', 'dist', 'exports',
]);

const legacyVersionedAllowlist = new Set([
  'dashboard-v13-3.js',
  'media-page-v13-5.js',
  'platform-v13-runtime.js',
  'platform-v13-ui.js',
  'v11.js',
  'v15-1-runtime.js',
  'v15-family-focus.js',
  'src/runtime/experience-elevation-v17-4.js',
  'src/runtime/family-branches-v17-5.js',
  'src/runtime/family-graph-v19.js',
  'src/runtime/mobile-ui-phase7.js',
  'src/runtime/native-family-v17-controller.js',
  'src/runtime/native-family-v17.js',
  'src/runtime/person-experience-v17-3.js',
  'src/runtime/v17-6-stability.js',
]);

function walk(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!prefix && ignoredTopLevel.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, rel));
    else out.push(rel.replaceAll('\\', '/'));
  }
  return out;
}

const files = walk(root);
const productionJs = files.filter((file) => file.endsWith('.js') || file.endsWith('.mjs'));
const versionPattern = /(?:^|[-_.])v\d+(?:[-_.]\d+)*/i;
const versioned = productionJs.filter((file) => versionPattern.test(path.basename(file)));
const unexpected = versioned.filter((file) => !legacyVersionedAllowlist.has(file));

const runtimeDir = path.join(root, 'src/runtime');
const flatRuntimeFiles = fs.existsSync(runtimeDir)
  ? fs.readdirSync(runtimeDir, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith('.js')).length
  : 0;

if (unexpected.length) {
  console.error('Architecture audit failed: new version-numbered production files are prohibited.');
  for (const file of unexpected) console.error(` - ${file}`);
  process.exit(1);
}

// v23.2 migration gate: current baseline is intentionally tolerated, but any
// growth beyond it fails. The cap ratchets downward as files move into domains.
const FLAT_RUNTIME_BASELINE = 62;
if (flatRuntimeFiles > FLAT_RUNTIME_BASELINE) {
  console.error(`Architecture audit failed: src/runtime grew from ${FLAT_RUNTIME_BASELINE} to ${flatRuntimeFiles} flat JS files.`);
  process.exit(1);
}

console.log(`Architecture audit passed: ${versioned.length} legacy versioned production files remain allowlisted; src/runtime flat JS count=${flatRuntimeFiles}.`);
