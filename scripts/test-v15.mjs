import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const runtime=fs.readFileSync('v15-runtime.js','utf8');
const css=fs.readFileSync('v15.css','utf8');
const mainRuntime=fs.readFileSync('v11.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v15 owns a persistent mobile navigation shell',()=>{
  assert.match(index,/id="family-mobile-dock"/);
  assert.match(index,/href="#dashboard"[^>]*data-dock-route="dashboard"/);
  assert.match(index,/href="#tree"[^>]*data-dock-route="tree"/);
  assert.match(index,/data-dock-search/);
  assert.match(index,/href="#people"[^>]*data-dock-route="people"/);
  assert.match(index,/href="#media"[^>]*data-dock-route="media"/);
  assert.doesNotMatch(index,/experience-v13-5\.js/);
  assert.match(index,/app\.bundle\.js\?v=15\.4\.0/);
  assert.match(entry,/v15-runtime\.js/);
});

test('mobile dock is a real touch surface above application content',()=>{
  assert.match(css,/#family-mobile-dock:not\(\[hidden\]\)/);
  assert.match(css,/z-index:2147483000!important/);
  assert.match(css,/pointer-events:auto!important/);
  assert.match(css,/touch-action:manipulation/);
  assert.match(css,/--tap-target:48px/);
});

test('v15 runtime routes dock clicks directly and refreshes restored iOS documents',()=>{
  assert.match(runtime,/#family-mobile-dock a\[href\^="#"\]/);
  assert.match(runtime,/event\.preventDefault\(\);navigate/);
  assert.match(runtime,/pageshow/);
  assert.match(runtime,/event\.persisted/);
  assert.match(runtime,/location\.reload\(\)/);
  assert.match(runtime,/build-info\.json\?ui-check=/);
});

test('v15 consumes the authoritative render lifecycle instead of observing DOM mutations',()=>{
  assert.doesNotMatch(runtime,/MutationObserver/);
  assert.match(runtime,/family-view-rendered/);
  assert.match(mainRuntime,/dispatchEvent\(new CustomEvent\('family-view-rendered'/);
});

test('media is owned by the main router and search typing does not rerender the whole app',()=>{
  assert.match(mainRuntime,/routes\.media=/);
  assert.match(mainRuntime,/media:\(\)=>'<section data-media-route-host/);
  assert.match(mainRuntime,/\$\('#search'\)\.addEventListener\('input',\(\)=>syncUrl\(\)\)/);
  assert.doesNotMatch(mainRuntime,/for\(const id of\['search','branch','state'\]\)\$\('#'\+id\)\.addEventListener\('input',render\)/);
});

test('v15 production build emits exactly one JavaScript bundle and one stylesheet',()=>{
  assert.match(index,/app\.bundle\.js\?v=15\.4\.0/);
  assert.match(index,/styles-v15\.css\?v=15\.4\.0/);
  assert.match(build,/outfile=dist\/app\.bundle\.js/);
  assert.match(build,/outfile=dist\/styles-v15\.css/);
  assert.match(build,/bundler:`esbuild@\$\{ESBUILD_VERSION\}`/);
  assert.match(build,/browserAssets:\['app\.bundle\.js','styles-v15\.css'\]/);
});

test('v15 shell work cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
