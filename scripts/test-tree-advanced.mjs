import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const runtime=read('src/features/tree/advanced.js');
const controller=read('src/features/tree/controller.js');
const stability=read('src/features/tree/stability.js');
const treeEngine=read('src/features/tree/engine.js');
const composition=read('src/features/tree/index.js');
const experience=read('src/app/experience.js');
const styles=read('src/styles/core.css');
const printStyles=read('src/styles/print.css');
const interactionStyles=read('src/styles/interaction.css');
const styleRoot=read('src/styles/index.css');

test('advanced tree remains additive behind one deterministic controller without changing the stable tree boundary',()=>{
  const imports=[...composition.matchAll(/import ['\"]([^'\"]+\.js)['\"]/g)].map(match=>match[1]);
  assert.deepEqual(imports,['../../runtime/tree-engine.js','../../runtime/tree-polish.js']);
  assert.match(experience,/import '\.\/tree-controller\.js';/);
  assert.doesNotMatch(experience,/void import\('\.\/tree-controller\.js'\)/);
  assert.doesNotMatch(experience,/void import\('\.\/tree-advanced\.js'\)/);
  assert.doesNotMatch(experience,/void import\('\.\/v17-6-stability\.js'\)/);
  assert.match(controller,/import '\.\/v17-6-stability\.js';\s*import '\.\/tree-advanced\.js';/);
  assert.match(styleRoot,/@import '\.\/core\.css';/);assert.ok(styles.indexOf('Source: tree.css')<styles.indexOf('Source: unified-family.css')&&styles.indexOf('Source: unified-family.css')<styles.indexOf('Source: tree-advanced.css'));
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

test('tree navigation includes components, breadcrumbs, one recents owner, collapse, compact mode, and path highlighting',()=>{
  for(const token of['data-tree-component','tree-focus-breadcrumb','tree-recent-trail','data-tree-collapse-focus','data-tree-expand-all','data-tree-compact-toggle','data-tree-path-target','tree-relationship-path-overlay'])assert.ok(runtime.includes(token),`missing ${token}`);
  assert.doesNotMatch(treeEngine,/data-v129-recent/);
  assert.doesNotMatch(stability,/data-v176-export-svg|data-v176-print-tree|data-v176-copy-link/);
});

test('relationship paths are constrained to rendered people so summaries cannot describe invisible hops',()=>{
  assert.match(runtime,/renderedPersonIds/);
  assert.match(runtime,/allRelationships\(\)\.filter\(rel=>rendered\.has\(rel\.from\)&&rendered\.has\(rel\.to\)\)/);
  assert.match(runtime,/No visible relationship path in the current tree scope\./);
});

test('generation lanes are sorted by vertical position before focus-relative labels are assigned',()=>{
  assert.match(runtime,/filter\(row=>row\.text\)\.sort\(\(a,b\)=>a\.y-b\.y\)/);
  assert.match(runtime,/delta===0\?'FOCUS'/);
});

test('tree export provides one neutral style-preserving SVG/PDF/copy-link toolset and waits for print readiness',()=>{
  assert.match(runtime,/inlineSvgPresentation/);
  assert.match(runtime,/family-history-tree\.svg/);
  assert.match(runtime,/data-tree-copy-link/);
  assert.match(runtime,/data-tree-export-svg/);
  assert.match(runtime,/data-tree-export-pdf/);
  assert.match(runtime,/@page\{size:landscape/);
  assert.match(runtime,/doc\.fonts\?\.ready/);
  assert.match(runtime,/requestAnimationFrame\(\(\)=>win\.requestAnimationFrame/);
  assert.match(runtime,/win\.print\(\)/);
  assert.doesNotMatch(stability,/rahe-family-tree\.svg|inlineSvgPresentation|graph-toolbar/);
});

test('advanced tree styles cover couple groups, path emphasis, mobile density, print, focus, and reduced motion',()=>{
  for(const selector of['.tree-couple-group','.tree-path-segment','body.tree-compact','@media(max-width:760px)'])assert.ok(styles.includes(selector),`missing ${selector}`);
  assert.match(printStyles,/@media print/);
  assert.match(interactionStyles,/@media[^\{]*prefers-reduced-motion\s*:\s*reduce/);
});
