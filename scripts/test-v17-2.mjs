import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience-core.js','utf8');
const experienceRoot=fs.readFileSync('src/runtime/experience.js','utf8');
const capabilities=fs.readFileSync('src/runtime/route-capabilities.js','utf8');
const graph=fs.readFileSync('graph.js','utf8');
const baseControls=fs.readFileSync('src/runtime/base-controls.js','utf8');
const treeEngine=fs.readFileSync('src/runtime/tree-engine.js','utf8');
const treeAdvanced=fs.readFileSync('src/runtime/tree-advanced.js','utf8');
const treePolish=fs.readFileSync('src/runtime/tree-polish.js','utf8');
const unified=fs.readFileSync('src/runtime/unified-family-experience.js','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const unifiedCss=fs.readFileSync('src/styles/core.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

function releaseOf(text,pattern){const match=text.match(pattern);assert.ok(match,'release fingerprint missing');return match[1];}
function atLeast(version,major,minor){const [a,b]=version.split('.').map(Number);return a>major||(a===major&&b>=minor);}

test('current browser release fingerprints advance without breaking the v17.2 tree contract',()=>{
  const shellVersion=releaseOf(index,/data-ui-release="(\d+\.\d+\.\d+)"/);
  const entryVersion=releaseOf(entry,/APP_VERSION='(\d+\.\d+\.\d+)'/);
  const coreVersion=releaseOf(experience,/UI_RELEASE='(\d+\.\d+\.\d+)'/);
  const buildVersion=releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/);
  assert.equal(shellVersion,entryVersion);
  assert.equal(entryVersion,coreVersion);
  assert.equal(entryVersion,buildVersion);
  assert.ok(atLeast(entryVersion,17,2));
  assert.match(build,/shell\.replace\(/);
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

test('tree memory uses neutral keys while historical client preferences are migrated by the shared controls boundary',()=>{
  for(const source of[experience,treeEngine,treeAdvanced,treePolish])assert.match(source,/family\.archive\./);
  assert.match(treeEngine,/LEGACY_HOME_KEY='rahe\.family\.home-person\.v1'/);
  assert.match(treeEngine,/LEGACY_COLLAPSE_KEY='rahe\.family\.tree\.collapsed\.v1'/);
  assert.match(baseControls,/rahe\.family\.recentPeople\.v1/);
  assert.match(baseControls,/rahe\.family\.recent-people\.v1/);
  assert.match(baseControls,/family\.archive\.recentPeople\.v2/);
  assert.match(treeAdvanced,/family\.archive\.recentPeople\.v2/);
  assert.doesNotMatch(treeEngine,/data-v129-recent/);
});

test('unified family experience is route-loaded for Home and Tree and exposes peer branches',()=>{
  assert.match(capabilities,/name:'unified-family-experience'[\s\S]*routes:\['dashboard','tree'\][\s\S]*import\('\.\/unified-family-experience\.js'\)/);
  assert.doesNotMatch(experienceRoot,/import\('\.\/unified-family-experience\.js'\)/);
  assert.match(unified,/import\{branchHref\}from'\.\/family-branches-v17-5\.js'/);
  assert.doesNotMatch(unified,/function peopleHref\(/);
  assert.match(unified,/href="\$\{esc\(branchHref\(branch\)\)\}"/);
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
  assert.match(styleRoot,/@import '\.\/core\.css';/);
  const tree=unifiedCss.indexOf('Source: tree.css');
  const family=unifiedCss.indexOf('Source: unified-family.css');
  assert.ok(tree>-1&&family>tree);
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
  for(const source of[unified,unifiedCss,treeEngine,treeAdvanced,treePolish]){
    assert.doesNotMatch(source,/relationships?\.push/);
    assert.doesNotMatch(source,/claims?\.push/);
    assert.doesNotMatch(source,/\.state\s*=\s*[^=]/);
  }
});
