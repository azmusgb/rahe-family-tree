import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const runtime=fs.readFileSync('src/runtime/mobile-family-density.js','utf8');
const platform=fs.readFileSync('platform-v13-runtime.js','utf8');
const styles=fs.readFileSync('src/styles/v16-1.css','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('family tree diagnostics move out of the family presentation',()=>{
  assert.match(platform,/route==='tree'&&researchMode/);
  assert.match(runtime,/tree-engine-2/);
  assert.match(runtime,/data-v161-relationship/);
  assert.match(runtime,/renderRelationshipFinder/);
  assert.match(runtime,/searchParams\.set\('depth','2'\)/);
});

test('relationship results survive the routed family tree refresh',()=>{
  assert.match(platform,/v161ReopenRelationship='true'/);
  assert.match(runtime,/reopenRelationshipResult/);
  assert.match(runtime,/delete document\.body\.dataset\.v161ReopenRelationship/);
});

test('mobile tree simplification is scoped to family context',()=>{
  assert.match(styles,/body\[data-route="tree"\]\[data-v158-context="family"\] #filters label:not\(\.search\)/);
  assert.doesNotMatch(styles,/body\[data-route="tree"\] #filters label:not\(\.search\)/);
});

test('people and media remove internal inventory language from family foreground',()=>{
  assert.match(runtime,/Inventory scope/);
  assert.match(runtime,/Person\\s\*\\\/\\s\*identity inventory/);
  assert.match(runtime,/media-page-hero/);
  assert.match(runtime,/v161-media-filters/);
  assert.match(runtime,/Privacy protected/);
});

test('family footer strips build diagnostics while research remains reachable',()=>{
  assert.match(runtime,/Family history backed by source-controlled research/);
  assert.match(runtime,/Research Center ↗/);
  assert.doesNotMatch(runtime,/build-info/);
});

test('v16.1 presentation loads after v16 and after the stable runtime chain',()=>{
  assert.match(styleRoot,/@import '\.\/v16\.css';\s*@import '\.\/v16-1\.css';/);
  assert.match(experience,/import\('\.\/mobile-family-density\.js'\)/);
  for(const token of['v161-tree-toolbar','v161-people','v161-media-filters','v161-research-band','v158-mobile-more'])assert.match(styles,new RegExp(token));
});

test('mobile density work cannot alter canonical genealogy semantics',()=>{
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
  assert.doesNotMatch(runtime,/\.state\s*=/);
  assert.doesNotMatch(runtime,/relationships?\.push/);
});
