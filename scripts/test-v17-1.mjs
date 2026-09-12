import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience-core.js','utf8');
const experienceRoot=fs.readFileSync('src/runtime/experience.js','utf8');
const branding=fs.readFileSync('src/runtime/site-branding.js','utf8');
const navigation=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const mobile=fs.readFileSync('src/styles/mobile-family.css','utf8');
const density=fs.readFileSync('src/runtime/mobile-family-density.js','utf8');
const narrative=fs.readFileSync('src/runtime/family-narrative.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v17.1 release fingerprints are synchronized',()=>{
  assert.match(index,/data-ui-release="17\.1\.0"/);
  assert.match(index,/styles\.css\?v=17\.1\.0/);
  assert.match(index,/app\.bundle\.js\?v=17\.1\.0/);
  assert.match(entry,/APP_VERSION='17\.1\.0'/);
  assert.match(experience,/UI_RELEASE='17\.1\.0'/);
  assert.match(experience,/uiReload\.v17\.1/);
  assert.match(build,/const appVersion='17\.1\.0'/);
});

test('site shell represents the connected family archive rather than a single surname',()=>{
  assert.match(index,/<title>Family History Archive<\/title>/);
  assert.match(index,/FAMILY<small>HISTORY ARCHIVE<\/small>/);
  assert.match(index,/Family archive \/ <b id="crumb">/);
  assert.match(index,/FAMILY HISTORY ARCHIVE/);
  assert.match(index,/Our family, connected\./);
  assert.doesNotMatch(index,/THE RAHE FAMILY|The Rahe Family|Rahe family \/|>RAHE<small>/i);
  assert.match(experienceRoot,/import '\.\/site-branding\.js';/);
  assert.match(branding,/Family History Archive/);
  assert.match(branding,/every documented family branch/i);
  assert.match(navigation,/FAMILY<small>HISTORY ARCHIVE<\/small>/);
  assert.doesNotMatch(navigation,/>RAHE<small>/i);
});

test('mobile Family stylesheet is semantic and layered before final responsive safeguards',()=>{
  assert.match(styleRoot,/@import '\.\/mobile-family\.css';\s*@import '\.\/responsive\.css';/);
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
  assert.match(density,/v161-media-filters/);
  assert.match(density,/Privacy protected/);
  assert.match(mobile,/\.v162-media-quick button\{flex:0 0 auto;min-height:44px/);
  assert.match(mobile,/\.v161-media-filters>summary\{min-height:44px/);
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
  for(const source of[mobile,density,narrative,branding]){
    assert.doesNotMatch(source,/\.state\s*=\s*[^=]/);
    assert.doesNotMatch(source,/relationships?\.push/);
    assert.doesNotMatch(source,/claims?\.push/);
  }
});
