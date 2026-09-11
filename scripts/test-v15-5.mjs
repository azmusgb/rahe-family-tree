import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const runtime=fs.readFileSync('src/runtime/page-architecture.js','utf8');
const css=fs.readFileSync('v15-5.css','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v15.5 classifies minimal, browse, media, and research page layouts',()=>{
  for(const route of['dashboard','person','tree'])assert.match(runtime,new RegExp(`['"]${route}['"]`));
  for(const route of['people','media','timeline'])assert.match(runtime,new RegExp(`['"]${route}['"]`));
  for(const route of['evidence','sources','research','archive'])assert.match(runtime,new RegExp(`['"]${route}['"]`));
  assert.match(runtime,/data\.pageLayout|dataset\.pageLayout/);
  assert.match(runtime,/pageArchitecture=RELEASE/);
});

test('minimal family routes reduce the command deck to global search',()=>{
  assert.match(css,/data-page-layout="minimal"[^\n]*\.route-shell/);
  assert.match(css,/\.filters>label:not\(\.search\)/);
  assert.match(css,/\.filters>button\{display:none!important\}/);
  assert.match(css,/\.filters \.search\{display:block\}/);
  assert.match(css,/data-route="dashboard"[^\n]*\.dashboard-hero\{margin-top:0\}/);
});

test('browse and media routes use route-specific filtering',()=>{
  assert.match(css,/data-page-layout="browse"[^\n]*\.filters/);
  assert.match(css,/label:has\(#state\)\{display:none\}/);
  assert.match(css,/data-page-layout="media-browse"[^\n]*\.route-shell \.filters/);
});

test('desktop utility bar is replaced by a masthead actions menu while mobile keeps one compact menu',()=>{
  assert.match(runtime,/v155-desktop-actions/);
  assert.match(runtime,/v155-mobile-actions/);
  assert.match(runtime,/data-v155-forward/);
  assert.match(css,/\.topbar\{display:none!important\}/);
  assert.match(css,/\.v155-original-actions\{display:none!important\}/);
});

test('tree gains reclaimed viewport and compact focal controls',()=>{
  assert.match(css,/data-route="tree"[^\n]*\.v154-tree-person/);
  assert.match(css,/min-height:620px;max-height:calc\(100vh - 258px\)/);
});

test('person page keeps one dominant identity header',()=>{
  assert.match(css,/\.person-source-summary h1/);
  assert.match(css,/display:none!important/);
});

test('layout release cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
