import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const runtime=fs.readFileSync('src/runtime/family-narrative.js','utf8');
const peopleRuntime=fs.readFileSync('src/runtime/people-person-experience.js','utf8');
const nativeRuntime=fs.readFileSync('src/runtime/native-family-v17.js','utf8');
const nativeController=fs.readFileSync('src/runtime/native-family-v17-controller.js','utf8');
const styles=fs.readFileSync('src/styles/v16-2.css','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const tokens=fs.readFileSync('src/styles/tokens.css','utf8');
const baseStyles=fs.readFileSync('src/styles/base.css','utf8');
const shellStyles=fs.readFileSync('src/styles/shell.css','utf8');
const homeStyles=fs.readFileSync('src/styles/home.css','utf8');
const peopleStyles=fs.readFileSync('src/styles/people.css','utf8');
const personStyles=fs.readFileSync('src/styles/person.css','utf8');
const treeStyles=fs.readFileSync('src/styles/tree.css','utf8');
const mediaStyles=fs.readFileSync('src/styles/media.css','utf8');
const responsiveStyles=fs.readFileSync('src/styles/responsive.css','utf8');
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

test('v16.2 compatibility layer remains before the semantic Family design system',()=>{
  assert.match(styleRoot,/@import '\.\/v16-1\.css';\s*@import '\.\/v16-2\.css';/);
  assert.match(experience,/import\('\.\/mobile-family-density\.js'\);\s*void import\('\.\/family-narrative\.js'\);/);
  for(const token of['v162-family-journey','v162-moments','v162-family-path','v162-media-quick'])assert.match(styles,new RegExp(token));
  const semantic=['tokens.css','base.css','shell.css','navigation.css','home.css','people.css','person.css','stories.css','tree.css','media.css','explore.css','research.css','responsive.css'];
  let previous=styleRoot.indexOf("@import './v16-2.css';");
  for(const file of semantic){const index=styleRoot.indexOf(`@import './${file}';`);assert.ok(index>previous,`${file} should follow the previous semantic layer`);previous=index;}
  assert.doesNotMatch(styleRoot,/v16-3\.css/);
  assert.equal(fs.existsSync('src/styles/v16-3.css'),false);
});

test('semantic Family tokens collapse radius shadow typography and page-width decisions',()=>{
  for(const token of['--family-radius-panel','--family-radius-card','--family-radius-control','--family-radius-chip','--family-shadow-card','--family-text-display','--family-text-meta','--family-page-person','--family-page-media'])assert.match(tokens,new RegExp(token));
  assert.match(shellStyles,/grid-template-columns:224px/);
  assert.match(shellStyles,/--family-page-home/);
  assert.match(shellStyles,/--family-page-person/);
  assert.match(shellStyles,/--family-page-media/);
});

test('family surfaces are content-first and retain readable metadata floors',()=>{
  assert.match(shellStyles,/Broad family sections use whitespace rather than card chrome/);
  assert.match(personStyles,/family-overview-card\.v159-person-overview[\s\S]*border:0!important/);
  assert.match(personStyles,/#content>\.panel[\s\S]*border-radius:0!important/);
  assert.match(mediaStyles,/media-library-note[\s\S]*background:transparent!important/);
  assert.match(baseStyles,/font-size:max\(var\(--family-text-meta\),12px\)!important/);
  assert.match(treeStyles,/rgba\(23,63,53,\.012\)/);
  assert.match(responsiveStyles,/node-id\{font-size:9px!important/);
});

test('v17 native controller owns Home People and Person instead of legacy reshapers',()=>{
  assert.match(experience,/import '\.\/native-family-v17-controller\.js'/);
  assert.doesNotMatch(experience,/home-flow\.js/);
  assert.doesNotMatch(experience,/people-person-experience\.js/);
  assert.doesNotMatch(experience,/compact-disclosure\.js/);
  assert.match(nativeController,/nativeRoutes=new Set\(\['dashboard','people','person'\]\)/);
  for(const marker of['data-v17-native="home"','data-v17-native="people"','data-v17-native="person"'])assert.match(nativeRuntime,new RegExp(marker));
});

test('v17 retires route-specific v15.7 v15.9 and v15.10 presentation imports',()=>{
  assert.doesNotMatch(styleRoot,/v15-7\.css/);
  assert.doesNotMatch(styleRoot,/v15-9\.css/);
  assert.doesNotMatch(styleRoot,/v15-10\.css/);
  for(const token of['v17-home-hero','v17-home-tree','v17-person-card','v17-person-header','v17-life-timeline'])assert.ok(homeStyles.includes(token)||peopleStyles.includes(token)||personStyles.includes(token)||baseStyles.includes(token),`${token} should be owned by semantic Family CSS`);
});

test('v17 public Family controller suppresses living-person chronology location and media surfaces',()=>{
  assert.match(nativeController,/if\(!person\?\.living\)return/);
  assert.match(nativeController,/v17-person-places/);
  assert.match(nativeController,/Detailed chronology and location records are protected/);
  assert.match(nativeController,/removeAttribute\('data-v17-person-photo'\)/);
  assert.match(nativeController,/Living-person media remains private/);
  assert.match(nativeController,/v17-branch-summary p/);
});

test('native Family rendering does not promote evidence or mutate genealogy',()=>{
  for(const source of[nativeRuntime,nativeController]){
    assert.doesNotMatch(source,/\.state\s*=/);
    assert.doesNotMatch(source,/relationships?\.push/);
    assert.doesNotMatch(source,/claims?\.push/);
  }
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});

test('family narrative and semantic presentation do not promote evidence or mutate genealogy',()=>{
  assert.doesNotMatch(runtime,/\.state\s*=/);
  assert.doesNotMatch(runtime,/relationships?\.push/);
  assert.doesNotMatch(runtime,/claims?\.push/);
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});