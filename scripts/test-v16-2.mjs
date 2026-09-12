import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const runtime=fs.readFileSync('src/runtime/family-narrative.js','utf8');
const peopleRuntime=fs.readFileSync('src/runtime/people-person-experience.js','utf8');
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

test('branch summaries exclude living-person locations and use canonical branch membership',()=>{
  assert.match(runtime,/historical=people\.filter\(p=>!p\.living\)/);
  assert.match(runtime,/people=displayPeople\(\)\.filter\(p=>matchesBranch\(p,branch\)\)/);
  assert.match(runtime,/if\(!isHistoricalEvent\(event\)/);
  assert.doesNotMatch(runtime,/const branch=cleanBranch\(selected\)/);
  assert.match(peopleRuntime,/ensureBranchOptions/);
  assert.match(peopleRuntime,/syncBranchBrowser/);
});

test('immediate family excludes superseded hidden aggregate people and clears global tree filters',()=>{
  assert.match(runtime,/displayedIds=\(\)=>new Set\(displayPeople\(\)\.map/);
  assert.match(runtime,/ids\.has\(r\.from\)&&ids\.has\(r\.to\)/);
  assert.match(runtime,/for\(const key of\['q','branch','state','from','to'\]\)u\.searchParams\.delete\(key\)/);
  assert.match(runtime,/searchParams\.set\('focus',id\)/);
  assert.match(runtime,/searchParams\.set\('scope','family'\)/);
});

test('family narrative adds branch context immediate family and synchronized media quick filters',()=>{
  assert.match(runtime,/v162-branch-context/);
  assert.match(runtime,/IMMEDIATE FAMILY/);
  assert.match(runtime,/View in tree/);
  assert.match(runtime,/data-v162-media-type="photo"/);
  assert.match(runtime,/data-v162-media-type="document"/);
  assert.match(runtime,/data-media-clear/);
  assert.match(runtime,/requestAnimationFrame\(\(\)=>requestAnimationFrame\(syncMediaQuick\)\)/);
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
