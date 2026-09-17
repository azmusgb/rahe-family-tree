import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const nav=fs.readFileSync('src/runtime/navigation-model.js','utf8');
const phase7=fs.readFileSync('src/runtime/mobile-ui-phase7.js','utf8');
const routeState=fs.readFileSync('src/runtime/mobile-route-state.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');

test('v23 navigation model owns contextual peer metadata',()=>{
  assert.match(nav,/export const navigationPeers=Object\.freeze/);
  assert.match(nav,/export const contextualDestinations=route=>/);
  assert.match(phase7,/import \{contextualDestinations\} from'\.\/navigation-model\.js'/);
  assert.doesNotMatch(phase7,/const contextualDestinations=\{/);
});

test('v23 mobile route state preserves full detail identity',()=>{
  assert.match(nav,/export const routeIdentity=\(\)=>/);
  assert.match(routeState,/const next=routeIdentity\(\)/);
  assert.match(routeState,/candidate&&candidate!==here/);
  assert.match(routeState,/const LIMIT=12/);
  assert.doesNotMatch(routeState,/localStorage|sessionStorage|history\.back/);
});

test('v23 route-state controller loads before legacy mobile shell',()=>{
  const routeStateIndex=experience.indexOf("import './mobile-route-state.js'");
  const shellIndex=experience.indexOf("import './mobile-ui-shell.js'");
  assert.ok(routeStateIndex>=0&&shellIndex>=0&&routeStateIndex<shellIndex);
});
