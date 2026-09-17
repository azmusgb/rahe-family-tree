import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const nav=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const mobile=fs.readFileSync('src/runtime/mobile-ui-shell.js','utf8');
const evolution=fs.readFileSync('src/runtime/mobile-ui-phase7.js','utf8');

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

test('mobile shell schedules one frame and observes only routed content',()=>{
  const scheduleBody=mobile.match(/function schedule\(\)\{([\s\S]*?)\n\}/)?.[1]||'';
  assert.match(scheduleBody,/requestAnimationFrame\(\(\)=>\{scheduled=false;apply\(\);\}\)/);
  assert.doesNotMatch(scheduleBody,/requestAnimationFrame\(\(\)=>requestAnimationFrame/);
  assert.match(mobile,/contentObserver\.observe\(content,\{childList:true,subtree:true\}\)/);
  assert.doesNotMatch(mobile,/observe\(document\.body/);
});

test('mobile people search handoff uses transient runtime state',()=>{
  assert.doesNotMatch(mobile,/sessionStorage|PENDING_SEARCH_KEY|PENDING_FOCUS_KEY|attempt<20|tryFocus/);
  assert.match(mobile,/let pendingPeopleSearchValue=''/);
  assert.match(mobile,/let pendingPeopleSearchFocus=false/);
  assert.match(mobile,/function consumePeopleSearchRequest\(\)/);
  assert.match(mobile,/function focusPeopleSearch\(input\)/);
  assert.match(mobile,/requestAnimationFrame\(\(\)=>\{if\(input\.isConnected\)input\.focus\(\{preventScroll:false\}\);\}\)/);
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

test('More sheet manages modal focus and returns focus to its trigger',()=>{
  assert.match(mobile,/function syncMoreModalState\(details\)/);
  assert.match(mobile,/document\.body\.dataset\.mobileModalOpen='more'/);
  assert.match(mobile,/target\?\.focus\(\{preventScroll:true\}\)/);
  assert.match(mobile,/moreReturnFocus\?\.focus\?\.\(\{preventScroll:true\}\)/);
  assert.match(mobile,/details\.matches\('#family-mobile-dock details\.mobile-more'\)/);
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
