import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience-core.js','utf8');
const experienceRoot=fs.readFileSync('src/runtime/experience.js','utf8');
const branding=fs.readFileSync('src/runtime/site-branding.js','utf8');
const neutralBranding=fs.readFileSync('src/runtime/neutral-family-branding.js','utf8');
const brandingCss=fs.readFileSync('src/styles/core.css','utf8');
const navigation=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const mobile=fs.readFileSync('src/styles/core.css','utf8');
const density=fs.readFileSync('src/runtime/mobile-family-density.js','utf8');
const narrative=fs.readFileSync('src/runtime/family-narrative.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

function releaseOf(text,pattern){const match=text.match(pattern);assert.ok(match,'release fingerprint missing');return match[1];}
function atLeast(version,major,minor){const [a,b]=version.split('.').map(Number);return a>major||(a===major&&b>=minor);}

test('v17.1 mobile capabilities remain intact under the current release',()=>{
  const shellVersion=releaseOf(index,/data-ui-release="(\d+\.\d+\.\d+)"/);
  const entryVersion=releaseOf(entry,/APP_VERSION='(\d+\.\d+\.\d+)'/);
  const coreVersion=releaseOf(experience,/UI_RELEASE='(\d+\.\d+\.\d+)'/);
  const buildVersion=releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/);
  assert.equal(shellVersion,entryVersion);
  assert.equal(entryVersion,coreVersion);
  assert.equal(entryVersion,buildVersion);
  assert.ok(atLeast(entryVersion,17,1));
  assert.match(index,new RegExp(`styles\\.css\\?v=${shellVersion.replaceAll('.','\\.')}`));
  assert.match(index,new RegExp(`app\\.bundle\\.js\\?v=${shellVersion.replaceAll('.','\\.')}`));
  const [major,minor]=coreVersion.split('.').map(Number);
  assert.match(experience,new RegExp(`uiReload\\.v${major}\\.${minor}`));
  assert.match(build,/shell\.replace\(/);
});

test('site shell uses neutral family-history branding while record names remain data-driven',()=>{
  assert.match(index,/<title>Family History Archive<\/title>/);
  assert.match(index,/FAMILY HISTORY<small>ARCHIVE<\/small>/);
  assert.match(index,/<a href="#dashboard">Family History<\/a>/);
  assert.match(index,/FAMILY HISTORY ARCHIVE/);
  assert.match(index,/Our family, connected\./);
  assert.match(index,/<p class="eyebrow">FAMILY HISTORY<\/p>/);
  assert.match(index,/<section class="route-shell"[^>]* hidden>/);
  assert.match(experienceRoot,/import\('\.\/neutral-family-branding\.js'\)/);
  assert.match(neutralBranding,/const SITE_TITLE='Family History Archive'/);
  assert.match(neutralBranding,/FAMILY HISTORY<small>ARCHIVE<\/small>/);
  assert.match(neutralBranding,/setText\(document\.querySelector\('\.brand \.monogram'\),'F'\)/);
  assert.match(neutralBranding,/routeShell\.hidden!==home/);
  assert.match(neutralBranding,/every documented family branch/i);
  assert.match(neutralBranding,/import\{researchRoutes\}from'\.\/navigation-model\.js'/);
  assert.match(neutralBranding,/researchRoutes\.has\(routeKey\(\)\)/);
  assert.doesNotMatch(neutralBranding,/RAHE FAMILY/i);
  assert.match(styleRoot,/@import '\.\/core\.css';/);
  const home=brandingCss.indexOf('Source: home.css');
  const responsive=brandingCss.indexOf('Source: responsive.css');
  const editorial=brandingCss.indexOf('Source: home-editorial.css');
  assert.ok(home>-1&&responsive>home&&editorial>responsive);
  assert.match(brandingCss,/\.v17-home-hero::after\{content:'F'\}/);
  assert.doesNotMatch(brandingCss,/\.v17-home-hero::after\{content:'R'\}/);
});

test('mobile Family stylesheet is semantic and layered before final responsive safeguards',()=>{
  assert.match(styleRoot,/@import '\.\/core\.css';/);
  const family=mobile.indexOf('Source: mobile-family.css');
  const responsive=mobile.indexOf('Source: responsive.css');
  assert.ok(family>-1&&responsive>family);
  assert.match(mobile,/@media\(max-width:720px\)/);
  assert.match(mobile,/body\[data-route="people"\]\[data-v158-context="family"\]/);
  assert.match(mobile,/body\[data-route="media"\]\[data-v158-context="family"\]/);
  assert.doesNotMatch(styleRoot,/v17-1\.css/);
});

test('mobile People directory establishes compact rows, readable text, and touch targets',()=>{
  assert.match(mobile,/\.v17-person-card>button[\s\S]*min-height:88px/);
  assert.match(mobile,/\.v17-branch-chip\{min-width:46px;min-height:46px/);
  assert.match(mobile,/\.v17-person-card-copy>b\{font-size:17px/);
  assert.match(mobile,/\.v17-person-card-copy>small\{font-size:11px/);
  assert.match(mobile,/text-overflow:ellipsis/);
  assert.match(mobile,/#family-mobile-dock:not\(\[hidden\]\) :where\(a,button,summary\)\{min-width:46px;min-height:46px!important/);
});

test('mobile Photos keeps quick type choices foregrounded and advanced filters disclosed',()=>{
  assert.match(narrative,/data-v162-media-type="all"/);
  assert.match(narrative,/data-v162-media-type="photo"/);
  assert.match(narrative,/data-v162-media-type="document"/);
  assert.match(density,/media-filters/);
  assert.match(density,/Privacy protected/);
  assert.match(mobile,/\.v162-media-quick button\{flex:0 0 auto;min-height:44px/);
  assert.match(mobile,/\.media-filters>summary\{min-height:44px/);
});

test('Family footer and safe-area behavior remain non-technical',()=>{
  assert.match(density,/Family history backed by source-controlled research/);
  assert.doesNotMatch(density,/commit SHA|build timestamp|graph nodes|graph edges/);
  assert.match(mobile,/safe-area-inset-bottom/);
  assert.match(mobile,/overflow-x:clip/);
});

test('v17.1 mobile presentation cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge,'identity bridge must remain present');
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.notEqual(bridge.type,'parent-child');
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
  for(const source of[mobile,density,narrative,branding,neutralBranding]){
    assert.doesNotMatch(source,/\.state\s*=\s*[^=]/);
    assert.doesNotMatch(source,/relationships?\.push/);
    assert.doesNotMatch(source,/claims?\.push/);
  }
});
