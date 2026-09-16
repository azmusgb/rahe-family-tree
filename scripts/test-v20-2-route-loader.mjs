import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{createRouteCapabilityLoader}from'../src/runtime/route-capability-loader.js';

const loaderSource=fs.readFileSync('src/runtime/route-capability-loader.js','utf8');
const navigationRuntime=fs.readFileSync('src/runtime/navigation-runtime.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('route capability loader only loads capabilities matched to the committed route and deduplicates loads',async()=>{
  const loader=createRouteCapabilityLoader();
  let loads=0;
  loader.register({name:'stories',routes:['stories'],load:async()=>{loads+=1;}});
  const dashboard=await loader.ensure('dashboard',{sequence:1});
  assert.equal(dashboard.status,'ready');
  assert.deepEqual(dashboard.capabilities,[]);
  assert.equal(loads,0);
  const first=await loader.ensure('stories',{sequence:2});
  const second=await loader.ensure('stories',{sequence:3});
  assert.equal(first.status,'ready');
  assert.equal(second.status,'ready');
  assert.deepEqual(first.capabilities,['stories']);
  assert.equal(loads,1);
});

test('failed route capability loads are reported and remain retryable',async()=>{
  const loader=createRouteCapabilityLoader();
  let attempts=0;
  loader.register({name:'research',routes:['research','intake'],load:async()=>{attempts+=1;if(attempts===1)throw new Error('simulated chunk failure');}});
  const failed=await loader.ensure('research',{sequence:4});
  assert.equal(failed.status,'failed');
  assert.equal(failed.failures[0].name,'research');
  const recovered=await loader.ensure('research',{sequence:5});
  assert.equal(recovered.status,'ready');
  assert.equal(attempts,2);
});

test('unregistering a pending capability cannot poison a replacement with the same name',async()=>{
  const loader=createRouteCapabilityLoader();
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  let firstLoads=0;
  let replacementLoads=0;
  const dispose=loader.register({name:'stories',routes:['stories'],load:async()=>{firstLoads+=1;await gate;}});
  const staleEnsure=loader.ensure('stories',{sequence:6});
  await Promise.resolve();
  dispose();
  loader.register({name:'stories',routes:['stories'],load:async()=>{replacementLoads+=1;}});
  release();
  const staleResult=await staleEnsure;
  assert.equal(staleResult.status,'failed');
  assert.equal(firstLoads,1);
  assert.deepEqual(loader.snapshot('stories').loaded,[]);
  const currentResult=await loader.ensure('stories',{sequence:7});
  assert.equal(currentResult.status,'ready');
  assert.equal(replacementLoads,1);
  assert.deepEqual(loader.snapshot('stories').loaded,['stories']);
});

test('loader is wired to the route commit lifecycle without moving presentation modules yet',()=>{
  assert.match(navigationRuntime,/import'\.\/route-capability-loader\.js'/);
  assert.match(loaderSource,/family-route-committed/);
  assert.match(loaderSource,/family-route-capabilities-ready/);
  assert.match(loaderSource,/family-route-capabilities-failed/);
  assert.match(loaderSource,/routeCapabilityState='loading'/);
  assert.match(experience,/const presentationModules=\[/);
  for(const module of['stories-runtime','record-ingestion','person-experience-v17-3','family-branches-v17-5'])assert.match(experience,new RegExp(`import\\('./${module}\\.js'\\)`));
});

test('route capability foundation is presentation-only and cannot promote genealogy evidence',()=>{
  assert.doesNotMatch(loaderSource,/research-model|relationships?\.push|claims?\.push|\.state\s*=/);
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
