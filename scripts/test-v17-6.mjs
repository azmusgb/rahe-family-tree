import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('v17.6 release fingerprint and stability layer are wired',()=>{
  assert.match(read('app-entry.js'),/APP_VERSION='17\.6\.0'/);
  assert.match(read('src/runtime/experience.js'),/v17-6-stability\.js/);
  const runtime=read('src/runtime/v17-6-stability.js');
  assert.match(runtime,/family\.archive\.treeState\.v17\.6/);
  assert.match(runtime,/family-auth-changed/);
  assert.match(runtime,/media-library-card\.is-private/);
  assert.match(runtime,/clearMediaViewer/);
  assert.match(runtime,/media-viewer-original/);
  assert.match(runtime,/replaceChildren\(\)/);
  assert.match(runtime,/data-v176-export-svg/);
  assert.match(runtime,/inlineSvgPresentation/);
  assert.match(runtime,/getComputedStyle/);
  assert.match(runtime,/data-v176-print-tree/);
  assert.match(runtime,/HashChangeEvent\('hashchange'\)/);
  assert.match(runtime,/popstate/);
});

test('failed session refresh and explicit logout clear authorization without logging out valid admin action errors',()=>{
  const auth=read('auth.js');
  assert.match(auth,/const clearLocalAuth=\(\)=>\{current=null;bootstrapAvailable=false;publish\(\);\}/);
  assert.match(auth,/refreshAuth\(\)[\s\S]*catch\(error\)\{clearLocalAuth\(\);throw error;\}/);
  assert.match(auth,/data-auth-logout[\s\S]*clearLocalAuth\(\);rerender\(\);await api/);
  assert.match(auth,/auth-create-user[\s\S]*catch\(err\)\{status\(err\.message\);rerender\(\);\}/);
  assert.doesNotMatch(auth,/auth-create-user[\s\S]*catch\(err\)\{current=null/);
});

test('Playwright is bounded, diagnosable, and restored as a validation gate',()=>{
  const config=read('playwright.config.mjs'),workflow=read('.github/workflows/validate-change.yml');
  assert.match(config,/globalTimeout:8\*60_000/);
  assert.match(config,/actionTimeout:12_000/);
  assert.match(config,/navigationTimeout:20_000/);
  assert.match(config,/reuseExistingServer:false/);
  assert.match(config,/trace:'retain-on-failure'/);
  assert.match(config,/video:'retain-on-failure'/);
  assert.match(workflow,/Run bounded browser interaction suite/);
  assert.match(workflow,/timeout-minutes: 12/);
  assert.match(workflow,/playwright-diagnostics/);
});
