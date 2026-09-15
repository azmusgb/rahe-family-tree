import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const navShell=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const css=fs.readdirSync('src/styles').filter(f=>f.endsWith('.css')&&f!=='index.css').sort().map(f=>fs.readFileSync('src/styles/'+f,'utf8')).join('\n');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const releaseOf=(text,pattern)=>{const match=text.match(pattern);assert.ok(match,'release fingerprint missing');return match[1];};

test('v20 keeps the route overview and filter deck without the v15.1 runtime writer',()=>{
  assert.match(index,/class="route-shell"/);
  assert.match(index,/class="page-heading"/);
  assert.match(index,/id="filters"/);
  assert.match(css,/\.route-shell\{/);
  assert.doesNotMatch(experience,/v15-1-runtime\.js/);
});

test('semantic navigation owns the production desktop and mobile shell',()=>{
  assert.match(navShell,/nav\.dataset\.navigationOwner='shell'/);
  assert.match(navShell,/primary-nav/);
  assert.match(navShell,/nav-menus/);
  assert.match(navShell,/family-mobile-dock/);
  assert.match(index,/id="family-mobile-dock"/);
  assert.match(css,/\.primary-nav/);
  assert.match(css,/\.nav-menu/);
  assert.match(css,/\.nav-popover/);
});

test('historical v15.1 stylesheet remains retired',()=>{
  assert.equal(fs.existsSync('v15-1.css'),false);
  assert.doesNotMatch(styleRoot,/legacy-compat\.generated\.css/);
  assert.match(build,/const legacyStyleSources=\[\]/);
});

test('v20 browser entry remains stable while the build enables lazy chunks',()=>{
  const shellVersion=releaseOf(index,/data-ui-release="(\d+\.\d+\.\d+)"/),buildVersion=releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/);assert.equal(shellVersion,buildVersion);const escaped=shellVersion.replaceAll('.','\\.');
  assert.match(index,new RegExp(`styles\\.css\\?v=${escaped}`));
  assert.match(index,new RegExp(`app\\.bundle\\.js\\?v=${escaped}`));
  assert.match(entry,/src\/runtime\/index\.js/);
  assert.match(build,/--splitting/);
  assert.match(build,/--outdir=dist/);
  assert.match(build,/--entry-names=app\.bundle/);
  assert.match(build,/--chunk-names=chunks\/\[name\]-\[hash\]/);
  assert.match(build,/browserAssets:\[\.\.\.jsAssets,'styles\.css'\]/);
  assert.match(build,/bundleStrategy:\{entry:'app\.bundle\.js',splitting:true,chunkDirectory:'chunks'\}/);
});

test('runtime consolidation cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
