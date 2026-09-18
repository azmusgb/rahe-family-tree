import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('tree controller owns graph presentation in deterministic order',()=>{
  const src=read('src/features/tree/controller.js');
  const order=['../../platform/performance/contracts.js','./stability.js','./advanced.js','./family-graph.js','./navigation.js','./graph-stability.js','./layout.js','./relationship-path.js'];
  let pos=-1;for(const spec of order){const next=src.indexOf(spec);assert.ok(next>pos,'expected '+spec+' after previous tree layer');pos=next;}
});
test('navigation runtime is the single committed-route controller',()=>{
  const src=read('src/features/navigation/runtime.js');
  assert.match(src,/family-route-intent/);assert.match(src,/family-route-committed/);assert.match(src,/family-route-content-ready/);
  assert.match(src,/deferHashNavigation/);assert.match(src,/historyTraversal/);
});
test('mobile back state preserves full route identity',()=>{
  const src=read('src/features/navigation/mobile-route-state.js');
  assert.match(src,/routeIdentity/);assert.match(src,/mobileBackDestination/);assert.match(src,/data-mobile-smart-back/);
});
test('navigation shell retains persistent semantic containers',()=>{
  const src=read('src/features/navigation/shell.js');
  assert.match(src,/primary-nav/);assert.match(src,/nav-menus/);assert.match(src,/navigationOwner='shell'/);
});
