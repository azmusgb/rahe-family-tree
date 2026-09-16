import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const runtime=fs.readFileSync('src/runtime/family-narrative.js','utf8');
const peopleRuntime=fs.readFileSync('src/runtime/people-person-experience.js','utf8');
const nativeRuntime=fs.readFileSync('src/runtime/native-family-v17.js','utf8');
const nativeController=fs.readFileSync('src/runtime/native-family-v17-controller.js','utf8');
const styles=fs.readdirSync('src/styles').filter(f=>f.endsWith('.css')&&f!=='index.css').sort().map(f=>fs.readFileSync('src/styles/'+f,'utf8')).join('\n');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const routeCapabilities=fs.readFileSync('src/runtime/route-capabilities.js','utf8');
const tokens=fs.readFileSync('src/styles/tokens.css','utf8');
const baseStyles=fs.readFileSync('src/styles/core.css','utf8');
const shellStyles=fs.readFileSync('src/styles/core.css','utf8');
const homeStyles=fs.readFileSync('src/styles/core.css','utf8');
const peopleStyles=fs.readFileSync('src/styles/core.css','utf8');
const personStyles=fs.readFileSync('src/styles/core.css','utf8');
const treeStyles=fs.readFileSync('src/styles/core.css','utf8');
const mediaStyles=fs.readFileSync('src/styles/core.css','utf8');
const responsiveStyles=fs.readFileSync('src/styles/core.css','utf8');
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

test('v16.2 presentation remains under semantic Family design-system ownership',()=>{
  assert.doesNotMatch(styleRoot,/legacy-compat\.generated\.css/);
  assert.match(build,/const legacyStyleSources=\[\]/);
  assert.match(build,/compatibilityBoundary:null/);
  assert.match(build,/legacySourceCount:0/);
  assert.equal(fs.existsSync('src/styles/v16-2.css'),false);
  assert.match(routeCapabilities,/name:'family-narrative'[\s\S]*routes:\['dashboard','people','person','media'\][\s\S]*import\('\.\/family-narrative\.js'\)/);
  assert.doesNotMatch(experience,/import\('\.\/family-narrative\.js'\)/);
  assert.match(routeCapabilities,/name:'unified-family-experience'[\s\S]*routes:\['dashboard','tree'\][\s\S]*import\('\.\/unified-family-experience\.js'\)/);
  assert.doesNotMatch(experience,/import\('\.\/unified-family-experience\.js'\)/);
  assert.match(experience,/const presentationModules=\[[\s\S]*import\('\.\/mobile-family-density\.js'\),[\s\S]*import\('\.\/family-branches-v17-5\.js'\)[\s\S]*\];/);
  assert.match(experience,/Promise\.allSettled\(presentationModules\)\.then\(\(\)=>import\('\.\/neutral-family-branding\.js'\)\)/);
  for(const token of['v162-family-journey','v162-moments','v162-family-path','v162-media-quick'])assert.match(styles,new RegExp(token));
  const semantic=['tokens.css','core.css','composition.css','experience.css','home-responsive.css','interaction.css','mobile.css','print.css'];
  let previous=-1;
  for(const file of semantic){const index=styleRoot.indexOf(`@import './${file}';`);assert.ok(index>previous,`${file} should follow the previous semantic layer`);previous=index;}
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
  assert.match(tokens,/--family-text-meta\s*:\s*\.75rem\s*;/);
  assert.match(treeStyles,/rgba\(23,63,53,\.012\)/);
  assert.match(responsiveStyles,/node-id\s*\{[\s\S]*?font-size\s*:\s*9px\s*!important/);
});

test('v17 native controller owns Home Tree People Person Families and Branch instead of legacy reshapers',()=>{
  assert.match(experience,/import '\.\/native-family-v17-controller\.js'/);
  assert.doesNotMatch(experience,/home-flow\.js/);
  assert.doesNotMatch(experience,/people-person-experience\.js/);
  assert.doesNotMatch(experience,/compact-disclosure\.js/);
  assert.match(nativeController,/nativeRoutes=new Set\(\['dashboard','tree','people','person','families','branch'\]\)/);
  assert.match(nativeController,/data-v17-native="tree"/);
  assert.match(nativeController,/renderFamiliesIndex\(\)/);
  assert.match(nativeController,/renderFamilyBranch\(routeBranchName\(\)\)/);
  for(const marker of['data-v17-native="home"','data-v17-native="people"','data-v17-native="person"'])assert.match(nativeRuntime,new RegExp(marker));
});

test('v17 retires route-specific v15.7 v15.9 and v15.10 presentation imports',()=>{
  assert.doesNotMatch(build,/'v15-7\.css'/);
  assert.doesNotMatch(build,/'v15-9\.css'/);
  assert.doesNotMatch(build,/'v15-10\.css'/);
  for(const token of['v17-home-hero','v17-home-tree','person-card','person-header','v17-life-timeline'])assert.ok(homeStyles.includes(token)||peopleStyles.includes(token)||personStyles.includes(token)||baseStyles.includes(token),`${token} should be owned by semantic Family CSS`);
});

test('v17 public Family controller suppresses living-person chronology location and media surfaces',()=>{
  assert.match(nativeController,/if\(!person\?\.living\)return/);
  assert.match(nativeController,/v17-person-places/);
  assert.match(nativeController,/Detailed chronology and location records are protected/);
  assert.match(nativeController,/removeAttribute\('data-v17-person-photo'\)/);
  assert.match(nativeController,/Living-person media remains private/);
  assert.match(nativeController,/v17-branch-summary>div:first-child>p:not\(\.eyebrow\)/);
  assert.match(nativeController,/split\(' · '\)\[0\]/);
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
