import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const runtime=fs.readFileSync('src/features/family/focus.js','utf8');
const css=fs.readdirSync('src/styles').filter(f=>f.endsWith('.css')&&f!=='index.css').sort().map(f=>fs.readFileSync('src/styles/'+f,'utf8')).join('\n');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const releaseOf=(text,pattern)=>{const match=text.match(pattern);assert.ok(match,'release fingerprint missing');return match[1];};

test('v15.3 person profile capabilities remain available under semantic person ownership',()=>{
  assert.match(runtime,/v153-family-network/);
  assert.match(runtime,/profileRelationCard\('Parents'/);
  assert.match(runtime,/profileRelationCard\('Spouse'/);
  assert.match(runtime,/profileRelationCard\('Children'/);
  assert.match(runtime,/v153-life-story/);
  assert.match(runtime,/Family record at a glance/);
  assert.match(runtime,/v153-profile-nav/);
  assert.match(css,/v153-family-network/);
  assert.match(css,/v153-profile-nav/);
});

test('v15.4 tree capability retains focal-person semantics under semantic tree ownership',()=>{
  assert.match(runtime,/tree-person-summary/);
  assert.match(runtime,/data-tree-scope="ancestors"/);
  assert.match(runtime,/data-tree-scope="descendants"/);
  assert.match(runtime,/Interactive family tree/);
  assert.match(css,/tree-person-summary/);
  assert.match(css,/\.edge\.identity-bridge/);
});

test('v15.2 home material remains under semantic home ownership',()=>{
  assert.match(runtime,/Discover the people, places, and stories that connect the Rahe family/);
  assert.match(runtime,/dashboard-family-layout/);
  assert.match(runtime,/Stories, places & milestones/);
  assert.match(runtime,/v152-research-secondary/);
  assert.match(css,/dashboard-family-layout/);
  assert.match(css,/v152-research-secondary/);
});

test('family-focus behavior remains bundled with historical CSS fully retired',()=>{
  const shellVersion=releaseOf(index,/data-ui-release="(\d+\.\d+\.\d+)"/),buildVersion=releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/);assert.equal(shellVersion,buildVersion);const escaped=shellVersion.replaceAll('.','\\.');
  assert.match(index,new RegExp(`data-ui-release="${escaped}"`));
  assert.match(index,new RegExp(`styles\\.css\\?v=${escaped}`));
  assert.match(index,new RegExp(`app\\.bundle\\.js\\?v=${escaped}`));
  assert.match(entry,/src\/app\/runtime\.js/);
  assert.doesNotMatch(entry,/src\/runtime\/index\.js/);
  assert.match(experience,/\.\.\/\.\.\/v15-family-focus\.js/);
  assert.match(build,/app-entry\.js/);
  assert.doesNotMatch(styleRoot,/legacy-compat\.generated\.css/);
  assert.match(build,/const legacyStyleSources=\[\]/);
  assert.equal(fs.existsSync('v15-family-focus.css'),false);
  assert.match(build,/shell\.replace\(/);
});

test('family-focus presentation cannot mutate canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
  assert.doesNotMatch(runtime,/createRelationship|createPerson|state\s*=|\.state\s*=/);
});
