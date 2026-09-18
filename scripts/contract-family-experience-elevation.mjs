import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const entry=fs.readFileSync('app-entry.js','utf8');
const core=fs.readFileSync('src/runtime/experience-core.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const capabilities=fs.readFileSync('src/runtime/route-capabilities.js','utf8');
const elevation=fs.readFileSync('src/runtime/experience-elevation-v17-4.js','utf8');
const cssRoot=fs.readFileSync('src/styles/index.css','utf8');
const css=fs.readFileSync('src/styles/core.css','utf8');
const shell=fs.readFileSync('index.html','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

const releaseOf=(text,pattern)=>{const match=text.match(pattern);assert.ok(match,'release fingerprint missing');return match[1];};
const atLeast=(version,major,minor)=>{const [a,b]=version.split('.').map(Number);return a>major||(a===major&&b>=minor);};
test('v17.4+ capabilities remain synchronized in later releases',()=>{
  const entryVersion=releaseOf(entry,/APP_VERSION='(\d+\.\d+\.\d+)'/);
  const coreVersion=releaseOf(core,/UI_RELEASE='(\d+\.\d+\.\d+)'/);
  const buildVersion=releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/);
  const shellVersion=releaseOf(shell,/data-ui-release="(\d+\.\d+\.\d+)"/);
  assert.equal(entryVersion,coreVersion);
  assert.equal(entryVersion,buildVersion);
  assert.equal(entryVersion,shellVersion);
  assert.ok(atLeast(entryVersion,17,4));
  const [major,minor]=entryVersion.split('.').map(Number),escaped=entryVersion.replaceAll('.','\\.');
  assert.match(core,new RegExp(`family\\.archive\\.uiReload\\.v${major}\\.${minor}`));
  assert.match(shell,new RegExp(`styles\\.css\\?v=${escaped}`));
  assert.match(shell,new RegExp(`app\\.bundle\\.js\\?v=${escaped}`));
});

test('v17.4 premium layer remains route-loaded and styled semantically',()=>{
  assert.match(capabilities,/name:'experience-elevation-v17-4'[\s\S]*routes:\['dashboard','person','tree'\][\s\S]*import\('\.\/experience-elevation-v17-4\.js'\)/);
  assert.doesNotMatch(experience,/import\('\.\/experience-elevation-v17-4\.js'\)/);
  assert.match(cssRoot,/@import '.\/core\.css';/);
  assert.match(css,/Source: elevation\.css/);
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
  assert.match(css,/\.tree-context/);
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
