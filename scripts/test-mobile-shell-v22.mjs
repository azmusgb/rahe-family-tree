import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const nav=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const mobile=fs.readFileSync('src/runtime/mobile-ui-shell.js','utf8');

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
});
