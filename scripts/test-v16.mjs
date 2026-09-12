import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const nav=fs.readFileSync('src/runtime/navigation-model.js','utf8');
const shell=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const stories=fs.readFileSync('src/runtime/stories-view.js','utf8');
const storiesRuntime=fs.readFileSync('src/runtime/stories-runtime.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const styles=fs.readFileSync('src/styles/index.css','utf8');
const v16=fs.readFileSync('src/styles/v16.css','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v16 centralizes family and research navigation semantics',()=>{
  for(const token of["label:'Home'","label:'Tree'","label:'People'","label:'Photos'","label:'Stories'","label:'Timeline'","label:'Places & Migration'","label:'Research Center'"]) {
    if(token.includes('Research Center'))assert.match(shell,/Research Center/);else assert.match(nav,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.match(shell,/familyPrimaryHtml\(\)/);
  assert.match(shell,/linksHtml\(familyExplore\)/);
});

test('stories is a first-class source-controlled family route without evidence mutation',()=>{
  assert.match(storiesRuntime,/location\.hash\.slice\(1\).*stories/);
  assert.match(storiesRuntime,/renderStories\(\)/);
  assert.match(stories,/Source-controlled highlights grouped by era/);
  assert.doesNotMatch(stories,/\.state\s*=/);
  assert.doesNotMatch(stories,/active\s*=/);
  assert.doesNotMatch(stories,/relationship/);
  assert.match(experience,/import\('\.\/stories-runtime\.js'\)/);
});

test('v16 semantic stylesheet is authoritative after historical compatibility layers',()=>{
  assert.match(styles,/@import '\.\/record-ingestion\.css';\s*@import '\.\/v16\.css';/);
  for(const token of['--v16-page-max','data-route="tree"','data-route="people"','data-route="person"','data-route="media"','v16-stories'])assert.match(v16,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(v16,/topbar-actions\{display:none\}/);
});

test('v16 presentation cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
