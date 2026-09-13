import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const entry=fs.readFileSync('app-entry.js','utf8');
const core=fs.readFileSync('src/runtime/experience-core.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const shell=fs.readFileSync('index.html','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const controller=fs.readFileSync('src/runtime/native-family-v17-controller.js','utf8');
const branches=fs.readFileSync('src/runtime/family-branches-v17-5.js','utf8');
const navigation=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const navModel=fs.readFileSync('src/runtime/navigation-model.js','utf8');
const elevation=fs.readFileSync('src/runtime/experience-elevation-v17-4.js','utf8');
const cssRoot=fs.readFileSync('src/styles/index.css','utf8');
const shellCss=fs.readFileSync('src/styles/archive-shell.css','utf8');
const branchCss=fs.readFileSync('src/styles/branches.css','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v17.5 release fingerprints are synchronized',()=>{
  assert.match(entry,/APP_VERSION='17\.5\.0'/);
  assert.match(core,/UI_RELEASE='17\.5\.0'/);
  assert.match(core,/family\.archive\.uiReload\.v17\.5/);
  assert.match(build,/const appVersion='17\.5\.0'/);
  assert.match(shell,/data-ui-release="17\.5\.0"/);
  assert.match(shell,/styles\.css\?v=17\.5\.0/);
  assert.match(shell,/app\.bundle\.js\?v=17\.5\.0/);
});

test('Home no longer puts the search/filter bar above the hero',()=>{
  assert.match(shell,/data-route="dashboard"/);
  assert.match(shellCss,/body\[data-route="dashboard"\]\[data-v158-context="family"\] \.route-shell/);
  assert.match(navigation,/\['dashboard','families','branch'\]\.includes\(route\)/);
  assert.match(navigation,/filters\.hidden=hideFamilyFilters/);
  assert.match(navigation,/data-global-search/);
});

test('family header navigation and footer are rebuilt around the family archive',()=>{
  assert.match(shell,/class="site-header sidebar"/);
  assert.match(shell,/RAHE FAMILY/);
  assert.match(shell,/class="footer site-footer"/);
  assert.match(navModel,/key:'families',label:'Families',href:'#families'/);
  assert.match(navigation,/RAHE FAMILY<small>HISTORY ARCHIVE<\/small>/);
  assert.match(shellCss,/\.site-header\.sidebar/);
  assert.match(shellCss,/\.site-footer-grid/);
});

test('Families and Branch are first-class native family routes',()=>{
  assert.match(controller,/nativeRoutes=new Set\(\['dashboard','tree','people','person','families','branch'\]\)/);
  assert.match(controller,/renderFamiliesIndex\(\)/);
  assert.match(controller,/renderFamilyBranch\(routeBranchName\(\)\)/);
  assert.match(experience,/family-branches-v17-5\.js/);
  assert.match(cssRoot,/@import '.\/branches\.css';/);
  assert.match(branchCss,/\.v175-family-grid/);
});

test('branch pages are public-safe and evidence-aware',()=>{
  assert.match(branches,/linked\.every\(person=>!person\.living\)/);
  assert.match(branches,/eventState\(event\)==='REJECTED'/);
  assert.match(branches,/PROVISIONAL\|UNRESOLVED/);
  assert.match(branches,/Living — details protected/);
  assert.match(branches,/This page does not promote them/);
  assert.doesNotMatch(branches,/relationships?\.push/);
  assert.doesNotMatch(branches,/claims?\.push/);
});

test('Home branch cards are promoted to real branch destinations',()=>{
  assert.match(branches,/function promoteHomeBranchLinks/);
  assert.match(branches,/branchHref\(branch\)/);
  assert.match(branches,/data-v175-people-link/);
});

test('Tree context reflects the effective tree engine state',()=>{
  assert.match(elevation,/tree-mode-buttons \[data-tree-scope\]\.active/);
  assert.match(elevation,/return url\.searchParams\.get\('focus'\)\?'family':'connected'/);
  assert.match(elevation,/document\.addEventListener\('click'.*data-v172-tree-branch/s);
});

test('canonical genealogy semantics remain unchanged',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(rel=>rel.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.notEqual(bridge.type,'parent-child');
  assert.ok((model.relationships||[]).filter(rel=>/REJECTED/i.test(String(rel.state||''))).every(rel=>rel.active===false));
});
