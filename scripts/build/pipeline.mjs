import { spawnSync } from 'node:child_process';

const node = process.execPath;

function run(label, script, args = []) {
  process.stdout.write(`\n[build:${label}] ${script}${args.length ? ` ${args.join(' ')}` : ''}\n`);
  const result = spawnSync(node, [script, ...args], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const semanticStages = Object.freeze([
  ['derive-evidence', 'scripts/compiler/stages/evidence.mjs'],
  ['derive-family', 'scripts/compiler/stages/family.mjs'],
  ['derive-tree', 'scripts/compiler/stages/tree.mjs'],
  ['derive-research', 'scripts/compiler/stages/research.mjs'],
  ['derive-platform', 'scripts/compiler/stages/platform.mjs'],
]);

export function buildCanonicalModel({ includeUpgrade = true, includeSiteBuild = false } = {}) {
  if (includeUpgrade) run('ingest', 'scripts/upgrade-corpus.mjs');
  run('validate-source', 'scripts/canonical-integrity.mjs');
  run('normalize', 'scripts/build-research-model.mjs');
  for (const [label, script] of semanticStages) run(label, script);
  run('export', 'scripts/build-exports.mjs');
  if (includeSiteBuild) run('site', 'scripts/build.mjs');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = new Set(process.argv.slice(2));
  buildCanonicalModel({ includeUpgrade: !args.has('--no-upgrade'), includeSiteBuild: args.has('--site') });
}
