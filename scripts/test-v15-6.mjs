import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const css=fs.readFileSync('v15-6.css','utf8');
const styles=fs.readFileSync('src/styles/index.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v15.6 family archive design is the final presentation layer',()=>{
  assert.match(styles,/@import '\.\.\/\.\.\/v15-6\.css';\s*$/);
  assert.match(css,/Family Archive Design System/);
  for(const token of['--bg:#f3f5f1','--surface:#fff','--ink:#18201d','--green:#173f35','--brand-soft:#e8f0eb','--line:#dce3dd','--focus:#2a6b5b'])assert.match(css,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('v15.6 keeps the v15.5 content-first masthead architecture',()=>{
  assert.match(css,/Preserve the horizontal v15\.5 shell/);
  assert.doesNotMatch(css,/--sidebar-w/);
  assert.doesNotMatch(css,/grid-template-columns:\s*var\(--sidebar-w\)/);
  assert.match(css,/@media \(min-width:721px\)[\s\S]*\.sidebar/);
  assert.match(css,/\.v151-primary-nav/);
  assert.match(css,/\.v155-actions-popover/);
});

test('v15.6 styles all primary family surfaces with shared archive materials',()=>{
  for(const selector of['dashboard-hero','person-card','family-overview-card','graph-shell','media-card','claim-card'])assert.match(css,new RegExp(selector));
  assert.match(css,/font-family:Georgia,"Times New Roman",serif/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/#family-mobile-dock/);
});

test('browser assets and runtime version move together to 15.6.0',()=>{
  assert.match(index,/data-ui-release="15\.6\.0"/);
  assert.match(index,/styles-v15\.css\?v=15\.6\.0/);
  assert.match(index,/app\.bundle\.js\?v=15\.6\.0/);
  assert.match(index,/FAMILY VIEW · v15\.6\.0/);
  assert.match(entry,/APP_VERSION='15\.6\.0'/);
});

test('visual release cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
