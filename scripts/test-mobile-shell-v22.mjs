import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const nav=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const mobile=fs.readFileSync('src/runtime/mobile-ui-shell.js','utf8');
const evolution=fs.readFileSync('src/runtime/mobile-ui-phase7.js','utf8');
const ownership=fs.readFileSync('src/runtime/mobile-ui-ownership.js','utf8');
const transient=fs.readFileSync('src/runtime/mobile-ui-transient.js','utf8');
const legacyMobile=fs.readFileSync('src/runtime/mobile-experience.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');

test('navigation shell owns final family mobile dock order',()=>{
  const home=nav.indexOf('data-dock-route="dashboard"');
  const families=nav.indexOf('data-dock-route="families"');
  const tree=nav.indexOf('data-dock-route="tree"');
  const people=nav.indexOf('data-dock-route="people"');
  assert.ok(home>=0&&home<families&&families<tree&&tree<people);
});

test('mobile UI shell does not reorder navigation-owned dock nodes',()=>{
  assert.doesNotMatch(mobile,/desiredDockOrder|reorderDock\(|function dockKey/);
});

test('dedicated mobile header exclusively owns phone chrome',()=>{
  assert.match(mobile,/siteHeader\.hidden=mobileViewport/);
  assert.match(mobile,/dataset\.mobileHeaderOwner='dedicated'/);
  assert.match(mobile,/header\.hidden=!mobileViewport/);
});

test('mobile shell schedules one frame, composes only the active route, and avoids subtree observers',()=>{
  const scheduleBody=mobile.match(/function schedule\(\)\{([\s\S]*?)\n\}/)?.[1]||'';
  assert.match(scheduleBody,/requestAnimationFrame\(\(\)=>\{scheduled=false;apply\(\);\}\)/);
  assert.doesNotMatch(scheduleBody,/requestAnimationFrame\(\(\)=>requestAnimationFrame/);
  assert.match(mobile,/function composeActiveRoute\(route\)/);
  assert.match(mobile,/if\(route==='dashboard'\)composeHome\(\)/);
  assert.match(mobile,/else if\(route==='people'\)composePeople\(\)/);
  assert.match(mobile,/else if\(route==='person'\)composePerson\(\)/);
  assert.match(mobile,/else if\(route==='tree'\)composeTree\(\)/);
  assert.match(mobile,/composeActiveRoute\(route\)/);
  assert.doesNotMatch(mobile,/MutationObserver|contentObserver|observedContent|observeContent/);
});

test('mobile people search handoff uses transient runtime state',()=>{
  assert.doesNotMatch(mobile,/sessionStorage|PENDING_SEARCH_KEY|PENDING_FOCUS_KEY|attempt<20|tryFocus/);
  assert.match(mobile,/let pendingPeopleSearchValue=''/);
  assert.match(mobile,/let pendingPeopleSearchFocus=false/);
  assert.match(mobile,/function consumePeopleSearchRequest\(\)/);
  assert.match(mobile,/if\(!request\.focus\)pendingPeopleSearchFocus=false/);
  assert.match(mobile,/function focusPeopleSearch\(input\)/);
  assert.match(mobile,/input\.focus\(\{preventScroll:false\}\)/);
  assert.match(mobile,/if\(!input\.isConnected\|\|routeKey\(\)!=='people'\|\|!isMobile\(\)\)return/);
  assert.match(mobile,/if\(document\.activeElement!==input\)input\.focus\(\{preventScroll:false\}\)/);
  assert.match(mobile,/if\(document\.activeElement===input\)pendingPeopleSearchFocus=false/);
});

test('mobile home collapses secondary previews into one compact discovery launcher',()=>{
  assert.match(mobile,/const MOBILE_HOME_COLLAPSED_SURFACES=\['\.v17-home-story','\.v17-featured-people','\.v17-home-media','\.v17-research-door'\]/);
  assert.match(mobile,/function setMobileHomePreviewState\(home,collapsed\)/);
  assert.match(mobile,/node\.dataset\.v22MobileCollapsed='true'/);
  assert.match(mobile,/node\.hidden=true/);
  assert.match(mobile,/node\.hidden=false/);
  assert.match(mobile,/className='v21-mobile-launcher v22-mobile-discover'/);
  assert.match(mobile,/href="#stories">Stories/);
  assert.match(mobile,/href="#people">People/);
  assert.match(mobile,/href="#media">Photos/);
  assert.match(mobile,/href="#timeline">Timeline/);
  assert.match(mobile,/href="#migration">Places/);
  assert.match(mobile,/href="#research">Research/);
  assert.match(mobile,/composeHomeDiscover\(home,treePreview\|\|launcher\)/);
});

test('desktop restoration removes mobile-only home composition',()=>{
  assert.match(mobile,/function restoreHomeComposition\(home,actions\)/);
  assert.match(mobile,/home\.querySelector\('\.v22-mobile-discover'\)\?\.remove\(\)/);
  assert.match(mobile,/setMobileHomePreviewState\(home,false\)/);
});

test('mobile More sheet has a stable accessible label and grouped destinations',()=>{
  assert.match(mobile,/heading\.id='mobile-more-title'/);
  assert.match(mobile,/panel\.setAttribute\('aria-labelledby',heading\.id\)/);
  assert.match(mobile,/panel\.setAttribute\('role','dialog'\)/);
  assert.match(mobile,/panel\.setAttribute\('aria-modal','true'\)/);
  assert.match(mobile,/search\.setAttribute\('aria-label','Search the family archive'\)/);
  assert.match(mobile,/className='v21-more-discover'/);
  assert.match(mobile,/className='v21-more-research'/);
});

test('mobile back navigation follows an internal route trail before route fallbacks',()=>{
  assert.match(mobile,/const MOBILE_ROUTE_TRAIL_LIMIT=12/);
  assert.match(mobile,/const mobileRouteTrail=\[\]/);
  assert.match(mobile,/function recordMobileRoute\(\)/);
  assert.match(mobile,/function navigateMobileBack\(\)/);
  assert.match(mobile,/back\.dataset\.mobileSmartBack='true'/);
  assert.match(mobile,/event\.target\.closest\('\[data-mobile-smart-back\]'\)/);
});

test('More modal interaction has one transient owner',()=>{
  assert.doesNotMatch(mobile,/syncMoreModalState|moreReturnFocus/);
  assert.match(transient,/function focusMorePanel\(details\)/);
  assert.match(transient,/function focusableIn\(element\)/);
  assert.match(transient,/function cancelPendingFocus\(\)/);
  assert.match(transient,/document\.body\.dataset\.mobileModalOpen='more'/);
  assert.match(transient,/returnFocus\.focus\(\{preventScroll:true\}\)/);
  assert.match(transient,/document\.addEventListener\('toggle'/);
});

test('person and tree mobile surfaces expose explicit interaction semantics',()=>{
  assert.match(mobile,/root\.dataset\.v22PersonFlow='compact'/);
  assert.match(mobile,/control\.dataset\.mobilePersonAction='true'/);
  assert.match(mobile,/bar\.setAttribute\('role','toolbar'\)/);
  assert.match(mobile,/bar\.setAttribute\('aria-label','Family tree controls'\)/);
  assert.match(mobile,/graph\.setAttribute\('role','region'\)/);
  assert.match(mobile,/graph\.setAttribute\('aria-label','Interactive family tree canvas'\)/);
  assert.match(mobile,/content\.dataset\.v22TreeCanvas='focused'/);
});

test('phase 7 More menu is route-aware without taking ownership of the dock',()=>{
  assert.match(evolution,/const contextualDestinations=\{/);
  assert.match(evolution,/person:\[\['People','#people'\],\['Tree','#tree'\],\['Photos','#media'\]\]/);
  assert.match(evolution,/research:\[\['Evidence','#evidence'\],\['Sources','#sources'\],\['Family home','#dashboard'\]\]/);
  assert.match(evolution,/if\(!items\.length\)\{/);
  assert.match(evolution,/existing\?\.remove\(\)/);
  assert.match(evolution,/section\.dataset\.v22ContextActions='true'/);
  assert.match(evolution,/link\.dataset\.v22ContextDestination='true'/);
  assert.doesNotMatch(evolution,/rebuildMobileDock|desiredDockOrder|reorderDock/);
});

test('phase 7 suppresses duplicate person navigation only on phones and restores it on desktop',()=>{
  assert.match(evolution,/legacy\.hidden=true/);
  assert.match(evolution,/legacy\.dataset\.v22Suppressed='true'/);
  assert.match(evolution,/legacy\.hidden=false/);
  assert.match(evolution,/tabs\.dataset\.v22PrimaryPersonNav='true'/);
  assert.match(evolution,/tabs\.setAttribute\('aria-label','Person sections'\)/);
});

test('phase 7 tree focus mode is transient, reversible, and keyboard escapable',()=>{
  assert.match(evolution,/function setTreeFocus\(enabled,\{moveFocus=true\}=\{\}\)/);
  assert.match(evolution,/content\.dataset\.v22TreeFocus='true'/);
  assert.match(evolution,/node\.dataset\.v22FocusHidden='true'/);
  assert.match(evolution,/node\.hidden=false;delete node\.dataset\.v22FocusHidden/);
  assert.match(evolution,/button\.dataset\.v22TreeFocus='true'/);
  assert.match(evolution,/button\.setAttribute\('aria-pressed','false'\)/);
  assert.match(evolution,/event\.key!=='Escape'\|\|document\.body\.dataset\.v22TreeFocus!=='true'/);
  assert.doesNotMatch(evolution,/localStorage|sessionStorage/);
});

test('phase 7 route-selects person/tree work and clears tree focus when leaving the route',()=>{
  assert.match(evolution,/const route=routeKey\(\)/);
  assert.match(evolution,/if\(route==='person'\)syncPersonNavigation\(\)/);
  assert.match(evolution,/if\(route==='tree'\)syncTreeFocusControl\(\)/);
  assert.match(evolution,/else if\(document\.body\.dataset\.v22TreeFocus==='true'\)setTreeFocus\(false,\{moveFocus:false\}\)/);
});

test('phase 8 declares v22 transient ownership before legacy mobile enhancement executes',()=>{
  assert.match(ownership,/mobileTransientOwner='v22-shell'/);
  assert.match(ownership,/mobileNavigationOwner='v22-shell'/);
  assert.match(ownership,/mobileSearchOwner='v22-shell'/);
  const ownerIndex=experience.indexOf("import './mobile-ui-ownership.js'");
  const legacyIndex=experience.indexOf("import './mobile-experience.js'");
  const shellIndex=experience.indexOf("import './mobile-ui-shell.js'");
  const transientIndex=experience.indexOf("import './mobile-ui-transient.js'");
  assert.ok(ownerIndex>=0&&ownerIndex<legacyIndex&&legacyIndex<shellIndex&&shellIndex<transientIndex);
});

test('phase 8 retires legacy More modal ownership and persistent last-route state',()=>{
  assert.doesNotMatch(legacyMobile,/function enhanceMoreMenu|function openMore|function closeMore|function trapSheetFocus|mobile-more-backdrop/);
  assert.doesNotMatch(legacyMobile,/lastRoute/);
  assert.match(legacyMobile,/recentPeople/);
  assert.match(legacyMobile,/recentFamilies/);
  assert.match(legacyMobile,/lastTree/);
});

test('phase 8 transient controller owns backdrop, keyboard trap, escape, focus entry, and focus return',()=>{
  assert.match(transient,/function ensureBackdrop\(\)/);
  assert.match(transient,/function closeMore\(\{restoreFocus=true\}=\{\}\)/);
  assert.match(transient,/function openMore\(details\)/);
  assert.match(transient,/function focusMorePanel\(details\)/);
  assert.match(transient,/function trapFocus\(event\)/);
  assert.match(transient,/event\.key==='Escape'/);
  assert.match(transient,/event\.key!=='Tab'/);
  assert.match(transient,/!panel\.contains\(document\.activeElement\)/);
  assert.match(transient,/mobile-sheet-open/);
  assert.match(transient,/mobileModalOpen='more'/);
  assert.match(transient,/returnFocus\.focus\(\{preventScroll:true\}\)/);
  assert.match(transient,/backdrop\.setAttribute\('aria-hidden','true'\)/);
  assert.doesNotMatch(transient,/localStorage|sessionStorage/);
});
