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
