import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience-core.js','utf8');
const experienceRoot=fs.readFileSync('src/runtime/experience.js','utf8');
const graph=fs.readFileSync('graph.js','utf8');
const treeEngine=fs.readFileSync('src/runtime/tree-engine.js','utf8');
const treePolish=fs.readFileSync('src/runtime/tree-polish.js','utf8');
const unified=fs.readFileSync('src/runtime/unified-family-experience.js','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const unifiedCss=fs.readFileSync('src/styles/unified-family.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('current browser release fingerprints advance without breaking the v17.2 tree contract',()=>{
  assert.match(index,/data-ui-release="17\.2\.0"/);
  assert.match(entry,/APP_VERSION='17\.4\.0'/);
  assert.match(experience,/UI_RELEASE='17\.4\.0'/);
  assert.match(build,/const appVersion='17\.4\.0'/);
  assert.match(build,/shell\.replaceAll\('17\.2\.0',appVersion\)/);
});

test('plain tree entry uses the largest branch-neutral connected-family component',()=>{
  assert.match(graph,/function neutralDefaultFocus\(rels\)/);
  assert.match(graph,/requestedScope\|\|\(explicit\?'family':'connected'\)/);
  assert.match(graph,/component\.size\*100000/);
  assert.match(graph,/branchCoverage\*10000/);
  assert.match(graph,/branchSpread/);
  assert.doesNotMatch(graph,/const DEFAULT_FOCUS/);
  assert.doesNotMatch(graph,/P-WILLIAM-JOHN-RAHE-III/);
  assert.match(graph,/Connected family view/);
});

test('tree memory uses neutral keys while migrating historical client preferences',()=>{
  for(const source of[experience,treeEngine,treePolish])assert.match(source,/family\.archive\./);
  assert.match(treeEngine,/LEGACY_HOME_KEY='rahe\.family\.home-person\.v1'/);
  assert.match(treeEngine,/LEGACY_COLLAPSE_KEY='rahe\.family\.tree\.collapsed\.v1'/);
  assert.match(treeEngine,/rahe\.family\.recentPeople\.v1/);
  assert.match(treeEngine,/rahe\.family\.recent-people\.v1/);
  assert.match(experience,/family\.archive\.recentPeople\.v2/);
});

test('unified family experience exposes peer branches on Home and Tree',()=>{
  assert.match(experienceRoot,/unified-family-experience\.js/);
  assert.match(unified,/function branchNames\(\)/);
  assert.match(unified,/function balancedFeatured\(limit=6\)/);
  assert.match(unified,/v172-home-branches/);
  assert.match(unified,/One archive, many connected lines/);
  assert.match(unified,/v172-tree-branches/);
  assert.match(unified,/data-v172-tree-connected/);
  assert.match(unified,/data-v172-tree-branch/);
});

test('tree branch and scope navigation clears stale filters and owns neutral fallback behavior',()=>{
  assert.match(unified,/function clearLiveTreeFilters\(\)/);
  assert.match(unified,/\['search','branch','state'\]/);
  assert.match(unified,/clearLiveTreeFilters\(\);history\.replaceState/);
  assert.match(unified,/\[data-tree-scope\]/);
  assert.match(unified,/stopImmediatePropagation\(\)/);
  assert.match(unified,/chooseRepresentative\(displayPeople\(\),activeRelationships\(\)\)/);
});

test('tree portraits are public-only and defense-in-depth excludes living people',()=>{
  assert.match(unified,/filter\(item=>item\.visibility==='public'\)/);
  assert.match(unified,/person\?\.living\|\|node\.querySelector\('\.v172-node-photo'\)/);
  assert.match(unified,/v172-node-photo/);
  assert.match(unifiedCss,/\.v172-node-photo\{pointer-events:none\}/);
});

test('unified family styles remain semantic and mobile-safe',()=>{
  assert.match(styleRoot,/@import '\.\/tree\.css';\s*@import '\.\/unified-family\.css';/);
  assert.match(unifiedCss,/\.v172-branch-grid/);
  assert.match(unifiedCss,/\.v172-tree-branch-actions button/);
  assert.match(unifiedCss,/@media\(max-width:720px\)/);
  assert.match(unifiedCss,/min-height:44px/);
});

test('v17.2 presentation cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(rel=>rel.type==='identity-bridge');
  assert.ok(bridge,'identity bridge must remain present');
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.notEqual(bridge.type,'parent-child');
  assert.ok((model.relationships||[]).filter(rel=>/REJECTED/i.test(String(rel.state||''))).every(rel=>rel.active===false));
  for(const source of[unified,unifiedCss,treeEngine,treePolish]){
    assert.doesNotMatch(source,/relationships?\.push/);
    assert.doesNotMatch(source,/claims?\.push/);
    assert.doesNotMatch(source,/\.state\s*=\s*[^=]/);
  }
});
