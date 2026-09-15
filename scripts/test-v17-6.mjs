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

test('Playwright PR validation is bounded, diagnosable, cached, artifact-backed, and release-gated',()=>{
  const config=read('playwright.config.mjs'),workflow=read('.github/workflows/validate-change.yml');
  assert.match(config,/globalTimeout:8\*60_000/);
  assert.match(config,/actionTimeout:12_000/);
  assert.match(config,/navigationTimeout:20_000/);
  assert.match(config,/reuseExistingServer:false/);
  assert.match(config,/trace:'retain-on-failure'/);
  assert.match(config,/video:'retain-on-failure'/);
  assert.match(config,/name:'mobile-chromium'/);
  assert.match(config,/name:'desktop-chromium'/);
  assert.match(workflow,/name: browser smoke/);
  assert.match(workflow,/needs: build/);
  assert.match(workflow,/Restore Playwright browser cache/);
  assert.match(workflow,/uses: actions\/cache@v4/);
  assert.match(workflow,/path: ~\/\.cache\/ms-playwright/);
  assert.match(workflow,/key: playwright-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/);
  assert.match(workflow,/Install Chromium system dependencies/);
  assert.match(workflow,/npx playwright install-deps chromium/);
  assert.match(workflow,/Install Playwright Chromium on cache miss/);
  assert.match(workflow,/steps\.playwright-cache\.outputs\.cache-hit != 'true'/);
  assert.match(workflow,/npx playwright install chromium/);
  assert.match(workflow,/Download exact verified build/);
  assert.match(workflow,/Run Chromium PR smoke suite/);
  assert.match(workflow,/npx playwright test[^\n]*--workers=2/);
  assert.match(workflow,/playwright-diagnostics-/);
  assert.match(workflow,/name: validate[\s\S]*needs: \[core, canonical, experience, build, browser\]/);
  assert.match(workflow,/BROWSER: \$\{\{ needs\.browser\.result \}\}/);
});
