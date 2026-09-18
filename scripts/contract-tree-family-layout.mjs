import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('v19.2 readable layout is presentation-only and loaded after navigation',async()=>{
  const controller=await read('src/features/tree/controller.js');
  const runtime=await read('src/features/tree/layout.js');
  assert.match(controller,/family-graph-navigation\.js'[\s\S]*family-graph-layout\.js'/);
  assert.match(runtime,/relativeGenerations/);
  assert.match(runtime,/family-lineage-rail/);
  assert.match(runtime,/generationLabel/);
  assert.doesNotMatch(runtime,/model\.(?:people|relationships|claims)\s*=/);
  assert.doesNotMatch(runtime,/\.state\s*=/);
});

test('v19.2 asserted couple context never promotes derivative spouse leads',async()=>{
  const runtime=await read('src/features/tree/layout.js');
  assert.match(runtime,/COUPLE_TYPES=new Set\(\['spouse'\]\)/);
  assert.match(runtime,/family-lineage-spouse/);
  assert.doesNotMatch(runtime,/COUPLE_TYPES=new Set\([^\n]*spouse-lead/);
});

test('v19.2 generation metadata comes from people and preserves advanced SVG labels',async()=>{
  const runtime=await read('src/features/tree/layout.js');
  const css=await read('src/styles/experience.css');
  assert.match(runtime,/nearest\?\.generations\.add\(offset\)/);
  assert.match(runtime,/dataset\.familyGenerations=offsets\.join/);
  assert.match(runtime,/dataset\.familyGenerationLabel=offsets\.map\(generationLabel\)/);
  assert.doesNotMatch(runtime,/text\.textContent\s*=\s*generationLabel/);
  assert.match(runtime,/Focus generation/);
  assert.match(runtime,/Grandparents/);
  assert.match(runtime,/Grandchildren/);
  assert.match(runtime,/aria-label','Direct family line by generation/);
  assert.match(runtime,/aria-current/);
  assert.match(css,/family-generation-focus-lane/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/prefers-reduced-motion/);
});

test('v19.2 stylesheet is layered after Family Graph navigation and before interaction contracts',async()=>{
  const index=await read('src/styles/index.css');
  const experienceImport=index.indexOf("@import './experience.css';");
  const interactions=index.indexOf("@import './interaction.css';");
  const experience=await read('src/styles/experience.css');
  const nav=experience.indexOf('Source: family-graph-navigation.css');
  const layout=experience.indexOf('Source: family-graph-layout.css');
  assert.ok(experienceImport>-1&&interactions>experienceImport);
  assert.ok(nav>-1&&layout>nav);
});
