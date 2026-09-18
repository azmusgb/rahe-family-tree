import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const nav=fs.readFileSync('src/runtime/navigation-model.js','utf8');
const perf=fs.readFileSync('src/platform/performance/contracts.js','utf8');
const experience=fs.readFileSync('src/app/experience.js','utf8');

test('v23 navigation model owns contextual relationships and detail identity',()=>{
  assert.match(nav,/export const navigationPeers=Object\.freeze/);
  assert.match(nav,/person:\['people','tree','media'\]/);
  assert.match(nav,/branch:\['families','tree','timeline'\]/);
  assert.match(nav,/export const contextualDestinations=/);
  assert.match(nav,/export const routeIdentity=/);
  assert.match(nav,/location\.hash/);
});

test('v23 performance telemetry measures route and tree readiness without genealogy payloads',()=>{
  assert.match(perf,/family-performance/);
  assert.match(perf,/tree:navigation-to-interactive/);
  assert.match(perf,/tree:interactive/);
  assert.match(perf,/svgNodes/);
  assert.doesNotMatch(perf,/person\.name|birth|death|evidence|sourceId/);
  assert.match(experience,/import '\.\/performance-contracts\.js'/);
});
