import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const runtime=fs.readFileSync('src/runtime/family-narrative.js','utf8');
const styles=fs.readFileSync('src/styles/v16-2.css','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('family narrative uses supported historical normalized events only for homepage moments',()=>{
  assert.match(runtime,/stateOf\(e\)==='SUPPORTED'/);
  assert.match(runtime,/isHistoricalEvent\(e\)/);
  assert.match(runtime,/peopleFor\(e\)\.every\(person=>!person\.living\)/);
  assert.match(runtime,/normalizedEvents/);
  assert.match(runtime,/Across generations and places/);
  assert.match(runtime,/Explore all stories/);
});

test('branch summaries exclude living-person event locations while retaining branch counts',()=>{
  assert.match(runtime,/historical=people\.filter\(p=>!p\.living\)/);
  assert.match(runtime,/ids=new Set\(historical\.map/);
  assert.match(runtime,/if\(!isHistoricalEvent\(event\)/);
  assert.match(runtime,/profile\.people\.length/);
});

test('family narrative adds branch context immediate family and media quick filters',()=>{
  assert.match(runtime,/v162-branch-context/);
  assert.match(runtime,/IMMEDIATE FAMILY/);
  assert.match(runtime,/View in tree/);
  assert.match(runtime,/data-v162-media-type="photo"/);
  assert.match(runtime,/data-v162-media-type="document"/);
  assert.match(runtime,/searchParams\.set\('focus',id\)/);
});

test('v16.2 loads after v16.1 and after stable family density runtime',()=>{
  assert.match(styleRoot,/@import '\.\/v16-1\.css';\s*@import '\.\/v16-2\.css';/);
  assert.match(experience,/import\('\.\/mobile-family-density\.js'\);\s*void import\('\.\/family-narrative\.js'\);/);
  for(const token of['v162-family-journey','v162-moments','v162-family-path','v162-media-quick'])assert.match(styles,new RegExp(token));
});

test('family narrative does not promote evidence or mutate genealogy',()=>{
  assert.doesNotMatch(runtime,/\.state\s*=/);
  assert.doesNotMatch(runtime,/relationships?\.push/);
  assert.doesNotMatch(runtime,/claims?\.push/);
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
