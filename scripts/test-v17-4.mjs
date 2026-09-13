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

const releaseForward=/17\.[4-9]\.0/;
test('v17.4+ release fingerprints remain synchronized',()=>{
  assert.match(entry,new RegExp(`APP_VERSION='${releaseForward.source}'`));
  assert.match(core,new RegExp(`UI_RELEASE='${releaseForward.source}'`));
  assert.match(core,/family\.archive\.uiReload\.v17\.[4-9]/);
  assert.match(build,new RegExp(`const appVersion='${releaseForward.source}'`));
  assert.match(shell,new RegExp(`data-ui-release="${releaseForward.source}"`));
  assert.match(shell,new RegExp(`styles\\.css\\?v=${releaseForward.source}`));
  assert.match(shell,new RegExp(`app\\.bundle\\.js\\?v=${releaseForward.source}`));
});

test('v17.4 premium layer remains loaded and bundled semantically',()=>{
  assert.match(experience,/experience-elevation-v17-4\.js/);
  assert.match(cssRoot,/@import '.\/elevation\.css';/);
  assert.match(css,/v17\.4 — elevated family experience/);
});

test('Home retains the continuation rail without replacing canonical family content',()=>{
  assert.match(elevation,/function installHomeDiscovery/);
  assert.match(elevation,/KEEP EXPLORING/);
  assert.match(elevation,/Follow another path through the family/);
  assert.match(elevation,/family\.archive\.recentPeople\.v2/);
  assert.match(elevation,/data-person=/);
  assert.match(css,/\.v174-discovery-grid/);
});

test('Person pages retain privacy-aware summary and active section navigation',()=>{
  assert.match(elevation,/function installPersonSnapshot/);
  assert.match(elevation,/person\.living\?'Protected':events\.length/);
  assert.match(elevation,/person\.living\?'Protected':places\.length/);
  assert.match(elevation,/function installActivePersonNav/);
  assert.match(elevation,/IntersectionObserver/);
  assert.match(css,/\.v174-profile-snapshot/);
  assert.match(css,/\.v17-person-nav a\.is-active/);
});

test('Tree context switcher derives the effective tree scope',()=>{
  assert.match(elevation,/function installTreeContext/);
  assert.match(elevation,/tree-mode-buttons \[data-tree-scope\]\.active/);
  assert.match(elevation,/return url\.searchParams\.get\('focus'\)\?'family':'connected'/);
  assert.match(elevation,/data-tree-scope="family"/);
  assert.match(elevation,/data-tree-scope="ancestors"/);
  assert.match(elevation,/data-tree-scope="descendants"/);
  assert.match(elevation,/data-tree-scope="connected"/);
  assert.match(css,/\.v174-tree-context/);
});

test('v17.4+ remains presentation-only and preserves genealogy evidence rules',()=>{
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
