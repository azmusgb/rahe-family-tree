import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const runtime=readFileSync(new URL('../src/runtime/tree-advanced.js',import.meta.url),'utf8');
const composition=readFileSync(new URL('../src/runtime/tree.js',import.meta.url),'utf8');
const experience=readFileSync(new URL('../src/runtime/experience.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles/tree-advanced.css',import.meta.url),'utf8');
const styleRoot=readFileSync(new URL('../src/styles/index.css',import.meta.url),'utf8');

test('advanced tree remains additive without changing the stable tree boundary',()=>{
  const imports=[...composition.matchAll(/import ['"]([^'"]+\.js)['"]/g)].map(match=>match[1]);
  assert.deepEqual(imports,['./tree-engine.js','./tree-polish.js']);
  assert.match(experience,/void import\('\.\/tree-advanced\.js'\)/);
  assert.match(styleRoot,/@import '\.\/tree\.css';\s*@import '\.\/unified-family\.css';[\s\S]*@import '\.\/tree-advanced\.css';/);
});

test('advanced tree keeps genealogy read-only and uses canonical graph helpers',()=>{
  assert.match(runtime,/connectedComponent/);
  assert.match(runtime,/findRelationshipPath/);
  assert.match(runtime,/generationLanes/);
  assert.doesNotMatch(runtime,/model\.(?:people|relationships|claims)\s*=/);
  assert.doesNotMatch(runtime,/\.state\s*=/);
});

test('component-first anchor ranking rewards useful reachable family coverage',()=>{
  assert.match(runtime,/componentQuality/);
  assert.match(runtime,/bestAnchorInComponent/);
  assert.match(runtime,/branches\.size\*60000/);
  assert.match(runtime,/centrality\*100/);
  assert.match(runtime,/searchParams\.set\('scope','connected'\)/);
});

test('tree navigation includes components, breadcrumbs, recents, collapse, compact mode, and path highlighting',()=>{
  for(const token of['data-tree-component','tree-focus-breadcrumb','tree-recent-trail','data-tree-collapse-focus','data-tree-expand-all','data-tree-compact-toggle','data-tree-path-target','tree-relationship-path-overlay'])assert.ok(runtime.includes(token),`missing ${token}`);
});

test('tree export provides style-preserving vector SVG and print-to-PDF flow',()=>{
  assert.match(runtime,/inlineSvgPresentation/);
  assert.match(runtime,/family-history-tree\.svg/);
  assert.match(runtime,/data-tree-export-svg/);
  assert.match(runtime,/data-tree-export-pdf/);
  assert.match(runtime,/@page\{size:landscape/);
  assert.match(runtime,/contentWindow\?\.print\(\)/);
});

test('advanced tree styles cover couple groups, path emphasis, mobile density, print, focus, and reduced motion',()=>{
  for(const selector of['.tree-couple-group','.tree-path-segment','body.tree-compact','@media(max-width:760px)','@media print','@media(prefers-reduced-motion:reduce)'])assert.ok(styles.includes(selector),`missing ${selector}`);
});
