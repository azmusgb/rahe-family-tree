import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('canonical build invokes semantic compiler stages',()=>{
  const pipeline=read('scripts/build/pipeline.mjs');
  for(const stage of ['evidence.mjs','family.mjs','tree.mjs','research.mjs','platform.mjs']) assert.ok(pipeline.includes(stage),stage);
  assert.doesNotMatch(pipeline,/enrich-v|reconcile-v/);
});
test('semantic stages invoke permanent transform modules only',()=>{
  for(const stage of ['evidence','family','tree','research','platform']){const src=read('scripts/compiler/stages/'+stage+'.mjs');assert.match(src,/scripts\/compiler\/transforms\//);assert.doesNotMatch(src,/enrich-v|reconcile-v/);}
});
test('historical enrich adapters are absent from active scripts root',()=>{
  const historical=fs.readdirSync('scripts').filter(n=>/^(?:enrich-v|reconcile-v)/.test(n));
  assert.deepEqual(historical,[]);
});
