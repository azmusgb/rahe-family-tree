import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const runtime=fs.readFileSync('v15-family-focus.js','utf8');
const css=fs.readFileSync('v15-family-focus.css','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v15.3 person profile capabilities remain available as compatibility behavior',()=>{
  assert.match(runtime,/v153-family-network/);
  assert.match(runtime,/profileRelationCard\('Parents'/);
  assert.match(runtime,/profileRelationCard\('Spouse'/);
  assert.match(runtime,/profileRelationCard\('Children'/);
  assert.match(runtime,/v153-life-story/);
  assert.match(runtime,/Family record at a glance/);
  assert.match(runtime,/v153-profile-nav/);
  assert.match(css,/v15\.3 — person profiles/);
});

test('v15.4 tree capability layer retains focal-person semantics beneath native v17 shell',()=>{
  assert.match(runtime,/v154-tree-person/);
  assert.match(runtime,/data-tree-scope="ancestors"/);
  assert.match(runtime,/data-tree-scope="descendants"/);
  assert.match(runtime,/Interactive family tree/);
  assert.match(css,/v15\.4 — tree redesign/);
  assert.match(css,/\.edge\.identity-bridge/);
});

test('v15.2 home material remains historical compatibility input',()=>{
  assert.match(runtime,/Discover the people, places, and stories that connect the Rahe family/);
  assert.match(runtime,/dashboard-family-layout/);
  assert.match(runtime,/Stories, places & milestones/);
  assert.match(runtime,/v152-research-secondary/);
  assert.match(css,/v15\.2 — family home polish/);
});

test('family-focus layer remains bundled beneath the native v17 release',()=>{
  assert.match(index,/data-ui-release="17\.0\.0"/);
  assert.match(index,/styles\.css\?v=17\.0\.0/);
  assert.match(index,/app\.bundle\.js\?v=17\.0\.0/);
  assert.match(entry,/src\/runtime\/index\.js/);
  assert.match(experience,/\.\.\/\.\.\/v15-family-focus\.js/);
  assert.match(build,/app-entry\.js/);
  assert.match(styleRoot,/v15-family-focus\.css/);
  assert.match(build,/const appVersion='17\.0\.0'/);
});

test('family-focus presentation cannot mutate canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
  assert.doesNotMatch(runtime,/createRelationship|createPerson|state\s*=|\.state\s*=/);
});