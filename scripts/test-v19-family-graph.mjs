import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('v19 Family Graph is additive and read-only',async()=>{
  const controller=await read('src/runtime/tree-controller.js');
  const runtime=await read('src/runtime/family-graph-v19.js');
  assert.match(controller,/import '\.\/family-graph-v19\.js';/);
  assert.match(runtime,/activeRelationships/);
  assert.match(runtime,/STRUCTURAL_TYPES/);
  assert.match(runtime,/family-unit-frame/);
  assert.match(runtime,/family-graph-direct/);
  assert.match(runtime,/family-graph-collateral/);
  assert.doesNotMatch(runtime,/model\.(?:people|relationships|claims)\s*=/);
  assert.doesNotMatch(runtime,/\.state\s*=/);
});

test('v19 preserves evidence-state semantics instead of inventing relationship authority',async()=>{
  const runtime=await read('src/runtime/family-graph-v19.js');
  assert.match(runtime,/REJECTED/);
  assert.match(runtime,/SUPPORTED/);
  assert.match(runtime,/PROVISIONAL/);
  assert.match(runtime,/UNRESOLVED/);
  assert.match(runtime,/identity-bridge/);
  assert.match(runtime,/family-edge-identity/);
});

test('v19 mobile person preview protects living detail and uses the authoritative tree router',async()=>{
  const runtime=await read('src/runtime/family-graph-v19.js');
  const experience=await read('src/runtime/experience-core.js');
  const css=await read('src/styles/family-graph-v19.css');
  assert.match(runtime,/Living · private details protected/);
  assert.match(runtime,/data-family-preview-focus/);
  assert.match(runtime,/data-family-preview-profile/);
  assert.match(runtime,/aria-modal/);
  assert.match(runtime,/family-graph-person-preview/);
  assert.match(experience,/dataset\.familyGraph==='v19'/);
  assert.match(experience,/family-graph-person-preview/);
  assert.match(experience,/stopImmediatePropagation/);
  assert.match(css,/\.family-person-preview/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/prefers-reduced-motion/);
});

test('v19 semantic stylesheet is loaded after mobile composition and before interaction contracts',async()=>{
  const index=await read('src/styles/index.css');
  const mobile=index.indexOf("@import './mobile-experience.css';");
  const graph=index.indexOf("@import './family-graph-v19.css';");
  const interactions=index.indexOf("@import './interaction-contracts.css';");
  assert.ok(mobile>-1&&graph>mobile&&interactions>graph);
});
