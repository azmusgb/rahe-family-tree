import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const entry=fs.readFileSync('app-entry.js','utf8');
const core=fs.readFileSync('src/runtime/experience-core.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const elevation=fs.readFileSync('src/runtime/experience-elevation-v17-4.js','utf8');
const cssRoot=fs.readFileSync('src/styles/index.css','utf8');
const css=fs.readFileSync('src/styles/elevation.css','utf8');
const shell=fs.readFileSync('index.html','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v17.4 release fingerprints are synchronized',()=>{
  assert.match(entry,/APP_VERSION='17\.4\.0'/);
  assert.match(core,/UI_RELEASE='17\.4\.0'/);
  assert.match(core,/family\.archive\.uiReload\.v17\.4/);
  assert.match(build,/const appVersion='17\.4\.0'/);
  assert.match(shell,/data-ui-release="17\.4\.0"/);
  assert.match(shell,/styles\.css\?v=17\.4\.0/);
  assert.match(shell,/app\.bundle\.js\?v=17\.4\.0/);
});

test('v17.4 premium layer is loaded and bundled semantically',()=>{
  assert.match(experience,/experience-elevation-v17-4\.js/);
  assert.match(cssRoot,/@import '.\/elevation\.css';/);
  assert.match(css,/v17\.4 — elevated family experience/);
});

test('Home gains a continuation rail without replacing canonical family content',()=>{
  assert.match(elevation,/function installHomeDiscovery/);
  assert.match(elevation,/KEEP EXPLORING/);
  assert.match(elevation,/Follow another path through the family/);
  assert.match(elevation,/family\.archive\.recentPeople\.v2/);
  assert.match(elevation,/data-person=/);
  assert.match(css,/\.v174-discovery-grid/);
});

test('Person pages gain a privacy-aware summary and active section navigation',()=>{
  assert.match(elevation,/function installPersonSnapshot/);
  assert.match(elevation,/person\.living\?'Protected':events\.length/);
  assert.match(elevation,/person\.living\?'Protected':places\.length/);
  assert.match(elevation,/function installActivePersonNav/);
  assert.match(elevation,/IntersectionObserver/);
  assert.match(css,/\.v174-profile-snapshot/);
  assert.match(css,/\.v17-person-nav a\.is-active/);
});

test('Tree gains a clear focal-context switcher backed by existing tree scope controls',()=>{
  assert.match(elevation,/function installTreeContext/);
  assert.match(elevation,/data-tree-scope="family"/);
  assert.match(elevation,/data-tree-scope="ancestors"/);
  assert.match(elevation,/data-tree-scope="descendants"/);
  assert.match(elevation,/data-tree-scope="connected"/);
  assert.match(css,/\.v174-tree-context/);
  assert.match(css,/\.v174-tree-scope button\.active/);
});

test('v17.4 remains presentation-only and preserves genealogy evidence rules',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(rel=>rel.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.notEqual(bridge.type,'parent-child');
  assert.ok((model.relationships||[]).filter(rel=>/REJECTED/i.test(String(rel.state||''))).every(rel=>rel.active===false));
  assert.doesNotMatch(elevation,/relationships?\.push/);
  assert.doesNotMatch(elevation,/claims?\.push/);
  assert.doesNotMatch(elevation,/\.state\s*=\s*[^=]/);
});
