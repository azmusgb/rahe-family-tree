import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const shell=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const runtime=fs.readFileSync('src/runtime/navigation-runtime.js','utf8');

test('navigation capture preserves disclosure hash links until route activation',()=>{
  assert.match(shell,/const navLink=event\.target\.closest/);
  assert.match(shell,/if\(!navLink\)\{if\(openOwner\)closeTransientNavigation\(openOwner\);else closeTransientNavigation\(\);\}/);
  assert.doesNotMatch(shell,/if\(navLink\)closeTransientNavigation\(\)/);
  assert.match(shell,/family-route-intent',event=>\{previewRoute\(event\.detail\?\.route\);\}/);
});

test('same-document route clicks yield before expensive hashchange work begins',()=>{
  assert.match(runtime,/function deferHashNavigation\(link,event\)/);
  assert.match(runtime,/event\.preventDefault\(\);[\s\S]*setTimeout\(\(\)=>\{[\s\S]*location\.hash=targetHash;[\s\S]*\},0\);/);
  assert.match(runtime,/markIntent\(link\);\s*deferHashNavigation\(link,event\);/);
});

test('navigation shell applies hash routes through committed-route lifecycle only',()=>{
  assert.match(shell,/family-route-committed',event=>\{closeTransientNavigation\(\);apply\(event\.detail\?\.route\|\|routeKey\(\)\);\}/);
  assert.doesNotMatch(shell,/addEventListener\('hashchange',[^\n]*apply\(/);
});

test('navigation compatibility selectors contain no duplicate arms',()=>{
  assert.match(shell,/const transientSelector='\.mobile-more\[open\],\.nav-menu\[open\],\.site-tools\[open\],\.tools-menu\[open\]';/);
  assert.doesNotMatch(shell,/mobile-more\[open\],\.mobile-more\[open\]/);
  assert.doesNotMatch(shell,/nav-menu\[open\],\.nav-menu\[open\]/);
  assert.match(shell,/primary\.classList\.add\('primary-nav'\);menus\.classList\.add\('nav-menus'\);/);
});
