import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const model=fs.readFileSync('src/runtime/navigation-model.js','utf8');
const routeState=fs.readFileSync('src/runtime/mobile-route-state.js','utf8');
const perf=fs.readFileSync('src/runtime/performance-contracts.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');

test('detail-aware mobile Back is transient and bounded',()=>{
  assert.match(model,/export const routeIdentity=/);
  assert.match(routeState,/const LIMIT=12/);
  assert.match(routeState,/trail\.push\(current\)/);
  assert.match(routeState,/candidate!==here/);
  assert.doesNotMatch(routeState,/localStorage|sessionStorage|history\.back/);
});

test('detail-aware route state starts before the legacy mobile shell',()=>{
  const state=experience.indexOf("import './mobile-route-state.js'");
  const shell=experience.indexOf("import './mobile-ui-shell.js'");
  assert.ok(state>=0&&state<shell);
});

test('canonical navigation model owns contextual peers',()=>{
  assert.match(model,/export const navigationPeers=Object\.freeze/);
  assert.match(model,/export const contextualDestinations=/);
});

test('tree performance telemetry is metadata-only',()=>{
  assert.match(perf,/tree:navigation-to-interactive/);
  assert.match(perf,/family-performance/);
  assert.match(perf,/svgNodes/);
  assert.doesNotMatch(perf,/localStorage|sessionStorage/);
});
