import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const css=fs.readFileSync('v15-6.css','utf8');
const styles=fs.readFileSync('src/styles/index.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience-core.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

function releaseOf(text,pattern){const match=text.match(pattern);assert.ok(match,'release fingerprint missing');return match[1];}
function atLeast(version,major,minor){const [a,b]=version.split('.').map(Number);return a>major||(a===major&&b>=minor);}

test('v15.6 family archive material remains compatibility input beneath the semantic system',()=>{
  assert.match(styles,/@import '\.\.\/\.\.\/v15-6\.css';\s*@import '\.\.\/\.\.\/v15-8\.css';/);
  assert.doesNotMatch(styles,/v15-7\.css/);
  assert.match(css,/Family Archive Design System/);
  for(const token of['--bg:#f3f5f1','--surface:#fff','--ink:#18201d','--green:#173f35','--brand-soft:#e8f0eb','--line:#dce3dd','--focus:#2a6b5b'])assert.match(css,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('v15.6 keeps the shared masthead material used under later releases',()=>{
  assert.match(css,/Preserve the horizontal v15\.5 shell/);
  assert.doesNotMatch(css,/--sidebar-w/);
  assert.match(css,/@media \(min-width:721px\)[\s\S]*\.sidebar/);
  assert.match(css,/\.v151-primary-nav/);
  assert.match(css,/\.v155-actions-popover/);
});

test('legacy material still includes accessible common family surfaces',()=>{
  for(const selector of['dashboard-hero','person-card','family-overview-card','graph-shell','media-card','claim-card'])assert.match(css,new RegExp(selector));
  assert.match(css,/font-family:Georgia,"Times New Roman",serif/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/#family-mobile-dock/);
});

test('keyboard focus indicators use the solid accessible focus token',()=>{
  assert.match(css,/:where\(input,select,textarea\):focus\{[^}]*outline:3px solid var\(--focus\)!important/);
  assert.match(css,/:where\(button,\.action,\[role="button"\]\):focus-visible,[^{]*\{outline:3px solid var\(--focus\)!important/);
  assert.doesNotMatch(css,/outline:3px solid rgba\(42,107,91,/);
});

test('browser release assets and freshness guard track the current release',()=>{
  const shellVersion=releaseOf(index,/data-ui-release="(\d+\.\d+\.\d+)"/);
  const entryVersion=releaseOf(entry,/APP_VERSION='(\d+\.\d+\.\d+)'/);
  const buildVersion=releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/);
  const coreVersion=releaseOf(experience,/UI_RELEASE='(\d+\.\d+\.\d+)'/);
  assert.equal(shellVersion,entryVersion);
  assert.equal(entryVersion,buildVersion);
  assert.equal(entryVersion,coreVersion);
  assert.ok(atLeast(entryVersion,17,5));
  const escaped=shellVersion.replaceAll('.','\\.');
  assert.match(index,new RegExp(`styles\\.css\\?v=${escaped}`));
  assert.match(index,new RegExp(`app\\.bundle\\.js\\?v=${escaped}`));
  assert.match(index,new RegExp(`FAMILY VIEW · v${escaped}`));
  assert.match(build,/shell\.replace\(/);
  assert.match(build,/outfile=dist\/styles\.css/);
  assert.match(build,/browserAssets:\['app\.bundle\.js','styles\.css'\]/);
  const [major,minor]=coreVersion.split('.').map(Number);
  assert.match(experience,new RegExp(`family\\.archive\\.uiReload\\.v${major}\\.${minor}`));
});

test('current release shell cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});