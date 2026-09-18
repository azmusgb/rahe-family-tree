import { spawnSync } from 'node:child_process';

const node = process.execPath;

export function runScript(label, script) {
  process.stdout.write(`\n[compiler:${label}] ${script}\n`);
  const result = spawnSync(node, [script], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function runScripts(label, scripts) {
  for (const script of scripts) runScript(label, script);
}

export function runWithFallback(label, primary, fallback) {
  process.stdout.write(`\n[compiler:${label}] ${primary}\n`);
  const result = spawnSync(node, [primary], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status === 0) return;
  process.stdout.write(`[compiler:${label}] primary failed; reconciling with ${fallback}\n`);
  runScript(label, fallback);
}
