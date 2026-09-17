import { spawnSync } from 'node:child_process';

const node = process.execPath;

function run(label, script, args = []) {
  process.stdout.write(`\n[build:${label}] ${script}${args.length ? ` ${args.join(' ')}` : ''}\n`);
  const result = spawnSync(node, [script, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runWithFallback(label, primary, fallback) {
  process.stdout.write(`\n[build:${label}] ${primary}\n`);
  const first = spawnSync(node, [primary], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  if (first.error) throw first.error;
  if (first.status === 0) return;
  process.stdout.write(`[build:${label}] primary failed; reconciling with ${fallback}\n`);
  run(label, fallback);
}

// v23.1 canonical compiler. The historical enrichment programs remain temporary
// adapters while their behavior is collapsed into permanent semantic stages.
// Their ordering is intentionally preserved so this refactor is output-equivalent.
const historicalDerivations = [
  'scripts/enrich-v11-1.mjs',
  'scripts/enrich-v11-2.mjs',
  'scripts/enrich-v11-3.mjs',
  'scripts/enrich-v11-4.mjs',
  'scripts/enrich-v11-5.mjs',
  'scripts/enrich-v11-6.mjs',
  'scripts/enrich-v12-0.mjs',
  'scripts/enrich-v12-1.mjs',
  'scripts/enrich-v12-2.mjs',
  'scripts/enrich-v12-3.mjs',
  'scripts/enrich-v12-4.mjs',
  'scripts/enrich-v12-5.mjs',
  'scripts/enrich-v12-6.mjs',
  'scripts/enrich-v12-6-1.mjs',
  'scripts/enrich-v12-6-2.mjs',
  'scripts/enrich-v12-7.mjs',
  'scripts/enrich-v12-8.mjs',
  'scripts/enrich-v12-9.mjs',
  'scripts/enrich-v12-9-1.mjs',
  'scripts/enrich-v13-0.mjs',
];

export function buildCanonicalModel({ includeUpgrade = true, includeSiteBuild = false } = {}) {
  if (includeUpgrade) run('ingest', 'scripts/upgrade-corpus.mjs');
  run('validate-source', 'scripts/canonical-integrity.mjs');
  run('normalize', 'scripts/build-research-model.mjs');

  for (const script of historicalDerivations) run('derive-legacy-adapter', script);

  runWithFallback(
    'derive-platform',
    'scripts/enrich-v13-platform.mjs',
    'scripts/reconcile-v13-platform.mjs',
  );

  run('export', 'scripts/build-exports.mjs');
  if (includeSiteBuild) run('site', 'scripts/build.mjs');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = new Set(process.argv.slice(2));
  buildCanonicalModel({
    includeUpgrade: !args.has('--no-upgrade'),
    includeSiteBuild: args.has('--site'),
  });
}
