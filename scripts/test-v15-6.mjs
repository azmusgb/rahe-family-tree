import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const css=fs.readdirSync('src/styles').filter(f=>f.endsWith('.css')&&f!=='index.css').sort().map(f=>fs.readFileSync('src/styles/'+f,'utf8')).join('\n');
const styles=fs.readFileSync('src/styles/index.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience-core.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

function releaseOf(text,pattern){const match=text.match(pattern);assert.ok(match,'release fingerprint missing');return match[1];}
function atLeast(version,major,minor){const [a,b]=version.split('.').map(Number);return a>major||(a===major&&b>=minor);}

test('v15.6 family archive design material is owned by the semantic system',()=>{
  assert.doesNotMatch(styles,/legacy-compat\.generated\.css/);
  assert.equal(fs.existsSync('v15-6.css'),false);
  assert.equal(fs.existsSync('v15-8.css'),false);
  assert.match(build,/const legacyStyleSources=\[\]/);
  for(const token of['--bg:#f4f1e9','--surface:#fffdf8','--ink:#182a24','--green:#123f34','--brand-soft:#e7efe9','--line:#ddd9ce','--focus:#8a5c12'])assert.match(css,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('v15.6 shared masthead behavior remains under semantic navigation ownership',()=>{
  assert.doesNotMatch(css,/--sidebar-w/);
  assert.match(css,/body\[data-nav-context="family"\] \.site-header\.sidebar/);
  assert.match(css,/\.primary-nav/);
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
  const entryVersion=releaseOf(entry,/UI_RELEASE\s*=\s*'(\d+\.\d+\.\d+)'/);
  const experienceVersion=releaseOf(experience,/UI_RELEASE\s*=\s*'(\d+\.\d+\.\d+)'/);
  assert.equal(shellVersion,entryVersion);
  assert.equal(shellVersion,experienceVersion);
  assert.ok(atLeast(shellVersion,15,6));
  assert.match(index,new RegExp(`app-entry\\.js\\?v=${shellVersion.replace(/\./g,'\\.')}`));
  assert.match(index,new RegExp(`src/styles/index\\.css\\?v=${shellVersion.replace(/\./g,'\\.')}`));
});

test('current release shell cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.audit?.pass,true);
  assert.equal(model.audit?.canonicalLoss,false);
  assert.equal(model.audit?.evidencePromotion,false);
});
