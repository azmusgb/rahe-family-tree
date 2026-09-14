import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const releaseOf=(text,pattern)=>{const match=text.match(pattern);assert.ok(match,'release fingerprint missing');return match[1];};
const atLeast=(version,major,minor)=>{const[a,b]=version.split('.').map(Number);return a>major||(a===major&&b>=minor);};

test('v17.6 stabilization remains wired through the consolidated tree controller in later releases',()=>{
  const version=releaseOf(read('app-entry.js'),/APP_VERSION='(\d+\.\d+\.\d+)'/);
  assert.ok(atLeast(version,17,6));
  const experience=read('src/runtime/experience.js'),controller=read('src/runtime/tree-controller.js'),runtime=read('src/runtime/v17-6-stability.js');
  assert.match(experience,/tree-controller\.js/);
  assert.match(controller,/v17-6-stability\.js/);
  assert.match(runtime,/family\.archive\.treeState\.v17\.6/);
  assert.match(runtime,/family-auth-changed/);
  assert.match(runtime,/media-library-card\.is-private/);
  assert.match(runtime,/clearMediaViewer/);
  assert.match(runtime,/media-viewer-original/);
  assert.match(runtime,/replaceChildren\(\)/);
  assert.match(runtime,/HashChangeEvent\('hashchange'\)/);
  assert.match(runtime,/popstate/);
  assert.doesNotMatch(runtime,/data-v176-export-svg|data-v176-print-tree|data-v176-copy-link/);
  assert.doesNotMatch(runtime,/inlineSvgPresentation|graph-toolbar|rahe-family-tree\.svg/);
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
