import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const runtimeIndex=fs.readFileSync('src/runtime/index.js','utf8');
const base=fs.readFileSync('src/runtime/base.js','utf8');
const baseControls=fs.readFileSync('src/runtime/base-controls.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const runtime=fs.readFileSync('src/runtime/experience-core.js','utf8');
const homeFlow=fs.readFileSync('src/runtime/home-flow.js','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const css=fs.readFileSync('v15.css','utf8');
const homeCss=fs.readFileSync('v15-7.css','utf8');
const mainRuntime=fs.readFileSync('v11.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v15 owns a persistent mobile navigation shell',()=>{
  assert.match(index,/id="family-mobile-dock"/);assert.match(index,/href="#dashboard"[^>]*data-dock-route="dashboard"/);assert.match(index,/href="#tree"[^>]*data-dock-route="tree"/);assert.match(index,/data-dock-search/);assert.match(index,/href="#people"[^>]*data-dock-route="people"/);assert.match(index,/href="#media"[^>]*data-dock-route="media"/);assert.doesNotMatch(index,/experience-v13-5\.js/);assert.match(index,/app\.bundle\.js\?v=15\.6\.0/);assert.doesNotMatch(entry,/v15-runtime\.js/);assert.match(runtimeIndex,/import '\.\/experience\.js'/);
});

test('browser bootstrap delegates historical layers through stable runtime domains',()=>{
  assert.match(entry,/import '\.\/src\/runtime\/index\.js'/);assert.doesNotMatch(entry,/^import '\.\/v\d/m);for(const domain of['base','media-core','deployment','family','media','tree','search','media-page','experience'])assert.match(runtimeIndex,new RegExp(`import './${domain}\\.js'`));const expected=['base','media-core','deployment','family','media','tree','search','media-page','experience'];const actual=[...runtimeIndex.matchAll(/import '\.\/([^']+)\.js'/g)].map(match=>match[1]);assert.deepEqual(actual,expected);
});

test('base boundary preserves bootstrap order and owns recent-person controls',()=>{
  const expected=['../../v11.js','./base-controls.js'];const actual=[...base.matchAll(/import ['"]([^'"]+\.js)['"]/g)].map(match=>match[1]);assert.deepEqual(actual,expected);assert.match(baseControls,/rahe\.family\.recent-people\.v1/);assert.match(baseControls,/data-tree-depth/);assert.match(baseControls,/data-tree-person/);assert.doesNotMatch(entry,/v12-3-controls\.js/);assert.equal(fs.existsSync('v12-3-controls.js'),false);
});

test('experience boundary preserves initialization order through family home flow',()=>{
  const expected=['./experience-core.js','../../v15-1-runtime.js','../../v15-family-focus.js','../../platform-v13-runtime.js','./page-architecture.js','./home-flow.js'];const actual=[...experience.matchAll(/import ['"]([^'"]+\.js)['"]/g)].map(match=>match[1]);assert.deepEqual(actual,expected);
});

test('v15.7 family home prioritizes tree people branches media and a separate research center',()=>{
  assert.match(homeFlow,/See how the family connects/);assert.match(homeFlow,/personContext/);assert.match(homeFlow,/branchPlaces/);assert.match(homeFlow,/dashboard-research-split'\)\?\.remove/);assert.match(homeFlow,/Open Research Center/);assert.match(homeFlow,/installMediaPreview/);assert.match(homeFlow,/visibility==='public'/);assert.doesNotMatch(homeFlow,/\.state\s*=/);assert.match(homeCss,/Mobile is deliberately recomposed rather than stacked desktop/);assert.match(homeCss,/\.v157-media-grid/);assert.match(homeCss,/scroll-snap-type:x mandatory/);
});

test('semantic stylesheet boundary preserves the deployed cascade order',()=>{
  const expected=['v11.css','v11-nav.css','v11-2.css','v11-3.css','v11-4.css','v11-6.css','v12.css','v12-2.css','v12-3.css','v12-4.css','v12-5.css','v12-6.css','v12-6-1.css','v12-6-2.css','v12-7.css','v12-8.css','v12-9.css','v12-9-1.css','v13-0.css','dashboard-v13-2.css','media-page-v13-4.css','experience-v13-5.css','v14.css','v15.css','v15-1.css','v15-family-focus.css','platform-v13.css','v15-5.css','v15-6.css','v15-7.css'];const actual=[...styleRoot.matchAll(/@import ['"]\.\.\/\.\.\/([^'"]+\.css)['"]/g)].map(match=>match[1]);assert.deepEqual(actual,expected);assert.match(build,/src\/styles\/index\.css/);assert.doesNotMatch(build,/const cssSources=/);assert.doesNotMatch(build,/\.styles-v15\.source\.css/);
});

test('mobile dock is a real touch surface above application content',()=>{assert.match(css,/#family-mobile-dock:not\(\[hidden\]\)/);assert.match(css,/z-index:2147483000!important/);assert.match(css,/pointer-events:auto!important/);assert.match(css,/touch-action:manipulation/);assert.match(css,/--tap-target:48px/);});

test('semantic experience runtime routes dock clicks directly and refreshes restored iOS documents',()=>{assert.match(runtime,/#family-mobile-dock a\[href\^="#"\]/);assert.match(runtime,/event\.preventDefault\(\);navigate/);assert.match(runtime,/pageshow/);assert.match(runtime,/event\.persisted/);assert.match(runtime,/location\.reload\(\)/);assert.match(runtime,/build-info\.json\?ui-check=/);});

test('semantic experience consumes the authoritative render lifecycle instead of observing DOM mutations',()=>{assert.doesNotMatch(runtime,/MutationObserver/);assert.match(runtime,/family-view-rendered/);assert.match(mainRuntime,/dispatchEvent\(new CustomEvent\('family-view-rendered'/);});

test('media is owned by the main router and search typing does not rerender the whole app',()=>{assert.match(mainRuntime,/routes\.media=/);assert.match(mainRuntime,/media:\(\)=>'<section data-media-route-host/);assert.match(mainRuntime,/\$\('#search'\)\.addEventListener\('input',\(\)=>syncUrl\(\)\)/);assert.doesNotMatch(mainRuntime,/for\(const id of\['search','branch','state'\]\)\$\('#'\+id\)\.addEventListener\('input',render\)/);});

test('v15 production build emits exactly one JavaScript bundle and one stylesheet',()=>{assert.match(index,/app\.bundle\.js\?v=15\.6\.0/);assert.match(index,/styles-v15\.css\?v=15\.6\.0/);assert.match(build,/outfile=dist\/app\.bundle\.js/);assert.match(build,/outfile=dist\/styles-v15\.css/);assert.match(build,/bundler:`esbuild@\$\{ESBUILD_VERSION\}`/);assert.match(build,/browserAssets:\['app\.bundle\.js','styles-v15\.css'\]/);});

test('v15 shell work cannot alter canonical genealogy semantics',()=>{assert.equal(model.meta.release,'13.0');const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');assert.ok(bridge);assert.match(String(bridge.state||''),/UNRESOLVED/i);assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));});
