import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const runtimeIndex=fs.readFileSync('src/runtime/index.js','utf8');
const familyBoundary=fs.readFileSync('src/runtime/family.js','utf8');
const treeBoundary=fs.readFileSync('src/runtime/tree.js','utf8');
const mediaBoundary=fs.readFileSync('src/runtime/media.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const experienceRuntime=fs.readFileSync('src/runtime/experience-core.js','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const v14=fs.readFileSync('v14.css','utf8');
const familyRuntime=fs.readFileSync('src/runtime/family-mode.js','utf8');
const portraitRuntime=fs.readFileSync('src/runtime/family-profile.js','utf8');
const qaRuntime=fs.readFileSync('src/runtime/family-qa.js','utf8');
const contributionRuntime=fs.readFileSync('src/runtime/family-contributions.js','utf8');
const mediaRuntime=fs.readFileSync('src/runtime/media-enhancements.js','utf8');
const treeRuntime=fs.readFileSync('src/runtime/tree-engine.js','utf8');
const treePolish=fs.readFileSync('src/runtime/tree-polish.js','utf8');
const dashboard=fs.readFileSync('dashboard-v13-3.js','utf8');
const mediaPage=fs.readFileSync('media-page-v13-5.js','utf8');
const mainRuntime=fs.readFileSync('v11.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v14 design-system gains remain under the current v15 entrypoint',()=>{assert.equal((index.match(/<link rel="stylesheet"/g)||[]).length,1);assert.match(index,/styles-v15\.css\?v=15\.6\.0/);assert.match(index,/FAMILY VIEW · v15\.6\.0/);for(const token of['--space-4','--radius-md','--shadow-md','--mobile-nav-height'])assert.match(v14,new RegExp(token));});

test('current browser runtime uses one cache-busted production bundle',()=>{const scripts=[...index.matchAll(/<script type="module" src="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(scripts,['app.bundle.js?v=15.6.0']);for(const moduleName of['v11.js','media-page-v13-5.js','v15-1-runtime.js','v15-family-focus.js','platform-v13-runtime.js'])assert.match(entry,new RegExp(moduleName.replaceAll('.','\\.')));assert.doesNotMatch(entry,/search-v13-2\.js/);assert.doesNotMatch(entry,/v15-runtime\.js/);assert.match(runtimeIndex,/import '\.\/search\.js'/);assert.match(runtimeIndex,/import '\.\/experience\.js'/);const expected=['experience-core','../../v15-1-runtime','../../v15-family-focus','../../platform-v13-runtime','page-architecture','home-flow','navigation-shell','people-person-experience','compact-disclosure','mobile-family-overhaul','mobile-tree-experience'];const actual=[...experience.matchAll(/import ['"]([^'"]+)\.js['"]/g)].map(match=>match[1].replace(/^\.\//,''));assert.deepEqual(actual,expected);});

test('family semantic boundary preserves historical initialization order',()=>{const expected=['./family-mode.js','./family-profile.js','./family-qa.js','./family-contributions.js'];const actual=[...familyBoundary.matchAll(/import ['"]([^'"]+\.js)['"]/g)].map(match=>match[1]);assert.deepEqual(actual,expected);for(const retired of['v12-6.js','v12-6-1.js','v12-6-2.js','v12-7.js'])assert.equal(fs.existsSync(retired),false);});

test('tree semantic boundary preserves historical initialization order',()=>{const expected=['./tree-engine.js','./tree-polish.js'];const actual=[...treeBoundary.matchAll(/import ['"]([^'"]+\.js)['"]/g)].map(match=>match[1]);assert.deepEqual(actual,expected);for(const retired of['v12-9.js','v12-9-1.js'])assert.equal(fs.existsSync(retired),false);});

test('media semantic boundary owns the v12.8 enhancement layer',()=>{assert.match(mediaBoundary,/import '\.\/media-enhancements\.js'/);assert.equal(fs.existsSync('v12-8.js'),false);});

test('production build bundles JavaScript and rationalizes historical CSS into one asset',()=>{assert.match(build,/ESBUILD_VERSION='0\.25\.10'/);assert.match(build,/app-entry\.js/);assert.match(build,/--bundle/);assert.match(build,/outfile=dist\/app\.bundle\.js/);assert.match(build,/src\/styles\/index\.css/);for(const sheet of['v14.css','v15.css','v15-1.css','v15-5.css','v15-6.css','v15-7.css','v15-8.css','v15-9.css','v15-10.css','v15-11.css'])assert.match(styleRoot,new RegExp(sheet.replace('.','\\.')));assert.match(styleRoot,/mobile-tree-experience\.css/);assert.match(build,/outfile=dist\/styles-v15\.css/);assert.match(build,/browserAssets:\['app\.bundle\.js','styles-v15\.css'\]/);});

test('legacy family dashboard replacement remains retired',()=>{assert.doesNotMatch(familyRuntime,/familyHome\(/);assert.doesNotMatch(familyRuntime,/family-home-hero/);assert.doesNotMatch(familyRuntime,/content\.innerHTML\s*=\s*familyHome/);});

test('legacy mobile navigation remains retired and v15 dock is static',()=>{assert.doesNotMatch(portraitRuntime,/createElement\(['"]nav['"]\).*mobile-family-nav/);assert.match(portraitRuntime,/removeLegacyMobileNav/);assert.match(index,/id="family-mobile-dock"/);assert.match(index,/Home<\/span>.*Tree<\/span>.*Search<\/span>.*People<\/span>.*Media<\/span>/s);});

test('family enhancements remain isolated from research mode',()=>{assert.match(experienceRuntime,/isFamilyMode/);assert.match(experienceRuntime,/dock\.hidden=!family/);assert.match(experienceRuntime,/RESEARCH MODE · v\$\{UI_RELEASE\}/);});

test('legacy presentation enhancers remain shallow while semantic experience consumes render events',()=>{const modules=[familyRuntime,portraitRuntime,qaRuntime,contributionRuntime,mediaRuntime,treeRuntime,treePolish,dashboard,mediaPage];for(const source of modules){assert.doesNotMatch(source,/subtree:true/);assert.match(source,/subtree:false/);}assert.doesNotMatch(experienceRuntime,/MutationObserver/);assert.match(experienceRuntime,/family-view-rendered/);});

test('mobile tree nodes use one-tap native person navigation',()=>{assert.doesNotMatch(treePolish,/mobileCentered/);assert.doesNotMatch(treePolish,/stopImmediatePropagation/);assert.match(treePolish,/Tap a person to open their profile/);assert.match(mainRuntime,/const p=e\.target\.closest\('\[data-person\]'\)/);});

test('dedicated media page owns its viewer without legacy click collisions',()=>{assert.match(mediaRuntime,/#person-media-viewer/);assert.doesNotMatch(mediaRuntime,/querySelector\('#media-viewer/);assert.match(mediaRuntime,/\.person-media-section \[data-media-open\]/);assert.doesNotMatch(mediaRuntime,/hydrateTree\(items\);mountDashboardLibrary\(items,force\)/);assert.match(mediaPage,/id="media-viewer"/);assert.match(mediaPage,/data-media-open/);});

test('primary controls retain delegated click and native route wiring',()=>{for(const selector of['data-person','data-claim','data-source','data-task','data-branch','data-filter-state','data-graph'])assert.match(mainRuntime,new RegExp(selector));assert.match(mainRuntime,/window\.addEventListener\('hashchange',render\)/);assert.match(mainRuntime,/#print'\)\.addEventListener\('click'/);assert.match(mainRuntime,/#export'\)\.addEventListener\('click'/);assert.match(mainRuntime,/closest\('#share'\)/);for(const route of['dashboard','tree','people','media'])assert.match(index,new RegExp(`href="#${route}"`));});

test('v14 presentation work cannot change canonical genealogy semantics',()=>{assert.equal(model.meta.release,'13.0');const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');assert.ok(bridge);assert.match(String(bridge.state||''),/UNRESOLVED/i);assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));});
