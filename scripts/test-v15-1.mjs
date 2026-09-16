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

test('v15.1 route overview and filter layout remain under semantic CSS ownership',()=>{
  assert.match(index,/class="route-shell"/);
  assert.match(index,/class="page-heading"/);
  assert.match(index,/id="filters"/);
  assert.match(css,/\.route-shell\{/);
  assert.match(css,/grid-template-columns:minmax\(260px,\.72fr\) minmax\(560px,1\.28fr\)/);
});

test('semantic navigation replaces the retired v15.1 navigation writer',()=>{
  assert.doesNotMatch(experience,/v15-1-runtime\.js/);
  assert.match(navShell,/primary-nav/);
  assert.match(navShell,/nav-menu/);
  assert.match(navShell,/navigationOwner='shell'/);
  assert.match(css,/\.primary-nav/);
  assert.match(css,/\.nav-menu/);
  assert.match(css,/\.nav-popover/);
  assert.match(css,/body\[data-nav-context="family"\] \.site-header\.sidebar/);
});

test('retiring the v15.1 writer remains compatible with the current split browser bundle strategy',()=>{
  const shellVersion=releaseOf(index,/data-ui-release="(\d+\.\d+\.\d+)"/),buildVersion=releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/);assert.equal(shellVersion,buildVersion);const escaped=shellVersion.replaceAll('.','\\.');
  assert.match(index,new RegExp(`styles\\.css\\?v=${escaped}`));
  assert.match(index,new RegExp(`app\\.bundle\\.js\\?v=${escaped}`));
  assert.match(entry,/src\/runtime\/index\.js/);
  assert.match(build,/--splitting/);
  assert.match(build,/--outdir=dist/);
  assert.match(build,/--entry-names=app\.bundle/);
  assert.match(build,/browserAssets:\[\.\.\.jsAssets,'styles\.css'\]/);
  assert.match(build,/splitting:true/);
  assert.doesNotMatch(styleRoot,/legacy-compat\.generated\.css/);
  assert.match(build,/const legacyStyleSources=\[\]/);
  assert.equal(fs.existsSync('v15-1.css'),false);
});

test('retired v15.1 production writer cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
