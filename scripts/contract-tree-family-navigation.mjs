import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Family Graph navigation is URL-backed and presentation only',async()=>{
  const runtime=await read('src/features/tree/navigation.js');
  assert.match(runtime,/searchParams\.set\('focus'/);
  assert.match(runtime,/searchParams\.set\('scope'/);
  assert.match(runtime,/searchParams\.set\('pathTo'/);
  assert.match(runtime,/HashChangeEvent/);
  assert.doesNotMatch(runtime,/model\./);
  assert.doesNotMatch(runtime,/\.state\s*=/);
});

test('Family Graph navigation exposes the requested family scopes and relationship finder',async()=>{
  const runtime=await read('src/features/tree/navigation.js');
  for(const label of['Family','Ancestors','Descendants','Direct line','Connected'])assert.match(runtime,new RegExp(label));
  assert.match(runtime,/Find relationship/);
  assert.match(runtime,/Tree tools/);
  assert.match(runtime,/data-family-graph-path-target/);
});

test('choosing a focal person exits legacy full-tree scope',async()=>{
  const runtime=await read('src/features/tree/navigation.js');
  assert.match(runtime,/state\.scope==='all'\?'connected':state\.scope/);
});

test('Legacy tree controls are consolidated rather than duplicated',async()=>{
  const runtime=await read('src/features/tree/navigation.js');
  const css=await read('src/styles/experience.css');
  assert.match(runtime,/tree-advanced-primary/);
  assert.match(runtime,/tree-recent-trail/);
  assert.match(runtime,/family-graph-focusbar-source/);
  assert.match(css,/family-graph-focusbar-source\{display:none!important\}/);
  assert.match(css,/family-graph-path-source\{display:none!important\}/);
});

test('navigation composition remains accessible and mobile safe',async()=>{
  const runtime=await read('src/features/tree/navigation.js');
  const css=await read('src/styles/experience.css');
  assert.match(runtime,/aria-label="Choose focal person"/);
  assert.match(runtime,/role="group" aria-label="Tree scope"/);
  assert.match(runtime,/aria-pressed/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
});
