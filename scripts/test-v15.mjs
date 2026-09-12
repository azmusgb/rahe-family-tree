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
const navShell=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const navModel=fs.readFileSync('src/runtime/navigation-model.js','utf8');
const nativeController=fs.readFileSync('src/runtime/native-family-v17-controller.js','utf8');
const nativeRuntime=fs.readFileSync('src/runtime/native-family-v17.js','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const css=fs.readFileSync('v15.css','utf8');
const navCss=fs.readFileSync('v15-8.css','utf8');
const mainRuntime=fs.readFileSync('v11.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('mobile family navigation remains a persistent touch shell under v17.1',()=>{assert.match(index,/id="family-mobile-dock"/);assert.match(index,/href="#dashboard"[^>]*data-dock-route="dashboard"/);assert.match(index,/href="#tree"[^>]*data-dock-route="tree"/);assert.match(index,/data-dock-search/);assert.match(index,/href="#people"[^>]*data-dock-route="people"/);assert.match(index,/href="#media"[^>]*data-dock-route="media"/);assert.match(index,/app\.bundle\.js\?v=17\.1\.0/);assert.doesNotMatch(entry,/v15-runtime\.js/);assert.match(runtimeIndex,/import '\.\/experience\.js'/);});

test('browser bootstrap delegates historical layers through stable runtime domains',()=>{assert.match(entry,/import '\.\/src\/runtime\/index\.js'/);assert.doesNotMatch(entry,/^import '\.\/v\d/m);for(const domain of['base','media-core','deployment','family','media','tree','search','media-page','experience'])assert.match(runtimeIndex,new RegExp(`import './${domain}\\.js'`));const expected=['base','media-core','deployment','family','media','tree','search','media-page','experience'];const actual=[...runtimeIndex.matchAll(/import '\.\/([^']+)\.js'/g)].map(match=>match[1]);assert.deepEqual(actual,expected);});

test('base boundary preserves bootstrap order and owns recent-person controls',()=>{const expected=['../../v11.js','./base-controls.js'];const actual=[...base.matchAll(/import ['"]([^'"]+\.js)['"]/g)].map(match=>match[1]);assert.deepEqual(actual,expected);assert.match(baseControls,/rahe\.family\.recent-people\.v1/);assert.match(baseControls,/data-tree-depth/);assert.match(baseControls,/data-tree-person/);assert.equal(fs.existsSync('v12-3-controls.js'),false);});

test('experience boundary cuts Home People Person and Tree into native v17 ownership',()=>{const expected=['./experience-core.js','../../v15-1-runtime.js','../../v15-family-focus.js','../../platform-v13-runtime.js','./page-architecture.js','./navigation-shell.js','./native-family-v17-controller.js'];const actual=[...experience.matchAll(/import ['"]([^'"]+\.js)['"]/g)].map(match=>match[1]);assert.deepEqual(actual,expected);assert.doesNotMatch(experience,/home-flow\.js/);assert.doesNotMatch(experience,/people-person-experience\.js/);assert.doesNotMatch(experience,/compact-disclosure\.js/);assert.match(nativeController,/nativeRoutes=new Set\(\['dashboard','tree','people','person'\]\)/);for(const marker of['data-v17-native="home"','data-v17-native="people"','data-v17-native="person"'])assert.match(nativeRuntime,new RegExp(marker));assert.match(nativeController,/data-v17-native="tree"/);});

test('v15.8 navigation semantics remain the shared family and research shell',()=>{for(const token of["label:'Home'","label:'Tree'","label:'People'","label:'Photos'","label:'Timeline'","label:'Places & Migration'","label:'Stories'"])assert.match(navModel,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.match(navShell,/Research Center/);assert.match(navShell,/RESEARCH CENTER/);assert.match(navShell,/Find someone in the family/);assert.match(navShell,/data-dock-route="media"[^>]*><span>Photos<\/span>/);assert.match(navShell,/v158-mobile-more/);assert.match(navCss,/body\[data-v158-context="research"\]/);});

test('legacy Family-only v15.7 v15.9 and v15.10 CSS are retired from the production cascade',()=>{assert.doesNotMatch(styleRoot,/v15-7\.css/);assert.doesNotMatch(styleRoot,/v15-9\.css/);assert.doesNotMatch(styleRoot,/v15-10\.css/);for(const file of['home.css','people.css','person.css'])assert.match(styleRoot,new RegExp(`@import './${file.replace('.','\\.')}'`));});

test('semantic stylesheet boundary preserves remaining compatibility cascade order',()=>{const expected=['v11.css','v11-nav.css','v11-2.css','v11-3.css','v11-4.css','v11-6.css','v12.css','v12-2.css','v12-3.css','v12-4.css','v12-5.css','v12-6.css','v12-6-1.css','v12-6-2.css','v12-7.css','v12-8.css','v12-9.css','v12-9-1.css','v13-0.css','dashboard-v13-2.css','media-page-v13-4.css','experience-v13-5.css','v14.css','v15.css','v15-1.css','v15-family-focus.css','platform-v13.css','v15-5.css','v15-6.css','v15-8.css'];const actual=[...styleRoot.matchAll(/@import ['"]\.\.\/\.\.\/([^'"]+\.css)['"]/g)].map(match=>match[1]);assert.deepEqual(actual,expected);assert.match(styleRoot,/@import '\.\/mobile-family\.css';\s*@import '\.\/responsive\.css';/);assert.match(build,/src\/styles\/index\.css/);assert.doesNotMatch(build,/const cssSources=/);});

test('mobile dock remains a real touch surface above application content',()=>{assert.match(css,/#family-mobile-dock:not\(\[hidden\]\)/);assert.match(css,/z-index:2147483000!important/);assert.match(css,/pointer-events:auto!important/);assert.match(css,/touch-action:manipulation/);assert.match(css,/--tap-target:48px/);});

test('v17.1 experience runtime keeps dock navigation and freshness protection but drops legacy Home enhancers',()=>{assert.match(runtime,/#family-mobile-dock a\[href\^="#"\]/);assert.match(runtime,/event\.preventDefault\(\);navigate/);assert.match(runtime,/pageshow/);assert.match(runtime,/event\.persisted/);assert.match(runtime,/location\.reload\(\)/);assert.match(runtime,/build-info\.json\?ui-check=/);assert.match(runtime,/UI_RELEASE='17\.1\.0'/);assert.match(runtime,/STALE_RELOAD_KEY='rahe\.family\.uiReload\.v17\.1'/);assert.doesNotMatch(runtime,/enhanceRecentPeople/);assert.doesNotMatch(runtime,/addDashboardPaths/);assert.doesNotMatch(runtime,/enhanceMediaMetric/);});

test('semantic experience consumes the authoritative render lifecycle instead of observing DOM mutations',()=>{assert.doesNotMatch(runtime,/MutationObserver/);assert.match(runtime,/family-view-rendered/);assert.match(mainRuntime,/dispatchEvent\(new CustomEvent\('family-view-rendered'/);});

test('media is owned by the main router and search typing does not rerender the whole app',()=>{assert.match(mainRuntime,/routes\.media=/);assert.match(mainRuntime,/media:\(\)=>'<section data-media-route-host/);assert.match(mainRuntime,/\$\('#search'\)\.addEventListener\('input',\(\)=>syncUrl\(\)\)/);assert.doesNotMatch(mainRuntime,/for\(const id of\['search','branch','state'\]\)\$\('#'\+id\)\.addEventListener\('input',render\)/);});

test('v17.1 production build emits one JavaScript bundle and one unversioned stylesheet asset name',()=>{assert.match(index,/app\.bundle\.js\?v=17\.1\.0/);assert.match(index,/styles\.css\?v=17\.1\.0/);assert.match(build,/const appVersion='17\.1\.0'/);assert.match(build,/outfile=dist\/app\.bundle\.js/);assert.match(build,/outfile=dist\/styles\.css/);assert.match(build,/bundler:`esbuild@\$\{ESBUILD_VERSION\}`/);assert.match(build,/browserAssets:\['app\.bundle\.js','styles\.css'\]/);});

test('v17 native Family work cannot alter canonical genealogy semantics',()=>{assert.equal(model.meta.release,'13.0');for(const source of[nativeRuntime,nativeController]){assert.doesNotMatch(source,/\.state\s*=\s*[^=]/);assert.doesNotMatch(source,/relationships?\.push/);assert.doesNotMatch(source,/claims?\.push/);}const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');assert.ok(bridge);assert.match(String(bridge.state||''),/UNRESOLVED/i);assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));});