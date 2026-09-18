import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('v19 Family Graph is additive and read-only',async()=>{
  const controller=await read('src/features/tree/controller.js');
  const runtime=await read('src/features/tree/family-graph.js');
  assert.match(controller,/import '\.\/family-graph-v19\.js';/);
  assert.match(runtime,/activeRelationships/);
  assert.match(runtime,/STRUCTURAL_TYPES/);
  assert.match(runtime,/FAMILY_UNIT_TYPES=new Set\(\['spouse'\]\)/);
  assert.match(runtime,/family-unit-frame/);
  assert.match(runtime,/family-graph-direct/);
  assert.match(runtime,/family-graph-collateral/);
  assert.doesNotMatch(runtime,/model\.(?:people|relationships|claims)\s*=/);
  assert.doesNotMatch(runtime,/\.state\s*=/);
});

test('v19 preserves rendered evidence-state semantics instead of inventing relationship authority',async()=>{
  const runtime=await read('src/features/tree/family-graph.js');
  assert.match(runtime,/REJECTED/);
  assert.match(runtime,/state-supported/);
  assert.match(runtime,/state-provisional/);
  assert.match(runtime,/state-unresolved/);
  assert.match(runtime,/identity-bridge/);
  assert.match(runtime,/family-edge-identity/);
  assert.doesNotMatch(runtime,/edges\.find\(/);
});

test('v19 mobile person preview protects living detail and uses the authoritative tree router',async()=>{
  const runtime=await read('src/features/tree/family-graph.js');
  const experience=await read('src/runtime/experience-core.js');
  const css=await read('src/styles/experience.css');
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

test('v19 derives implicit graph focus from the rendered focused node',async()=>{
  const runtime=await read('src/features/tree/family-graph.js');
  assert.match(runtime,/graph-node\.focused\[data-person\]/);
  assert.match(runtime,/renderedFocusId\(\)/);
});

test('v19 semantic stylesheet is loaded after mobile composition and before interaction contracts',async()=>{
  const index=await read('src/styles/index.css');
  const experienceImport=index.indexOf("@import './experience.css';");
  const interactions=index.indexOf("@import './interaction.css';");
  const experience=await read('src/styles/experience.css');
  const mobile=experience.indexOf('Source: mobile-experience.css');
  const graph=experience.indexOf('Source: family-graph-v19.css');
  assert.ok(experienceImport>-1&&interactions>experienceImport);
  assert.ok(mobile>-1&&graph>mobile);
});
