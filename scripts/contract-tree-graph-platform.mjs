import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{buildFamilyGraph,chooseDefaultAnchor,spouseUnits}from'../src/tree/graph.js';
import{scopeIds,relationshipPath}from'../src/tree/traversal.js';
import{generationLayout}from'../src/tree/layout.js';
import{readTreeState,writeTreeState}from'../src/tree/state.js';

const people=[
  {id:'p1',name:'Parent One',branch:'Rahe',living:false},
  {id:'p2',name:'Spouse One',branch:'Rahe',living:false},
  {id:'c1',name:'Child One',branch:'Rahe',living:false},
  {id:'g1',name:'Grandchild One',branch:'Rahe',living:true},
  {id:'x1',name:'Isolated',branch:'Other',living:false},
];
const relationships=[
  {id:'r1',type:'spouse',from:'p1',to:'p2',state:'SUPPORTED'},
  {id:'r2',type:'parent-child',from:'p1',to:'c1',state:'SUPPORTED'},
  {id:'r3',type:'parent-child',from:'p2',to:'c1',state:'SUPPORTED'},
  {id:'r4',type:'parent-child',from:'c1',to:'g1',state:'PROVISIONAL'},
  {id:'rejected',type:'parent-child',from:'x1',to:'g1',state:'REJECTED'},
];

test('v19 graph builds evidence-safe connected components and useful anchor',()=>{
  const graph=buildFamilyGraph(people,relationships);
  assert.equal(graph.components.length,2);
  assert.equal(graph.relationships.some(rel=>rel.id==='rejected'),false);
  const anchor=chooseDefaultAnchor(graph);
  assert.ok(['p1','p2','c1'].includes(anchor.id));
  assert.equal(spouseUnits(graph).length,1);
});

test('v19 traversal supports connected, ancestor, descendant, direct and family scopes',()=>{
  const graph=buildFamilyGraph(people,relationships);
  assert.deepEqual([...scopeIds({focus:'c1',scope:'ancestors'},graph)].sort(),['c1','p1','p2']);
  assert.deepEqual([...scopeIds({focus:'c1',scope:'descendants'},graph)].sort(),['c1','g1']);
  assert.deepEqual([...scopeIds({focus:'c1',scope:'direct'},graph)].sort(),['c1','g1','p1','p2']);
  assert.equal(scopeIds({focus:'p1',scope:'family',depth:1},graph).has('g1'),false);
  assert.equal(scopeIds({focus:'p1',scope:'family',depth:2},graph).has('g1'),true);
  const path=relationshipPath('p1','g1',graph);
  assert.deepEqual(path.personIds,['p1','c1','g1']);
  assert.equal(path.evidenceState,'PROVISIONAL');
});

test('v19 layout produces deterministic generation lanes',()=>{
  const graph=buildFamilyGraph(people,relationships),layout=generationLayout(graph,new Set(['p1','p2','c1','g1']));
  assert.equal(layout.lanes.get('p1'),0);
  assert.equal(layout.lanes.get('p2'),0);
  assert.equal(layout.lanes.get('c1'),1);
  assert.equal(layout.lanes.get('g1'),2);
});

test('v19 URL state is persistent and bounded',()=>{
  const state=readTreeState('https://example.test/?focus=c1&scope=family&depth=99&compact=1#tree');
  assert.deepEqual(state,{focus:'c1',scope:'family',depth:6,pathTo:'',compact:true});
  const next=writeTreeState({...state,scope:'ancestors',pathTo:'p1'},'https://example.test/#tree');
  assert.equal(next.searchParams.get('focus'),'c1');
  assert.equal(next.searchParams.get('scope'),'ancestors');
  assert.equal(next.searchParams.has('depth'),false);
  assert.equal(next.searchParams.get('pathTo'),'p1');
});

test('v19 release boundary is wired without retiring canonical evidence ownership',()=>{
  const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
  const controller=read('src/runtime/tree-controller.js'),entry=read('app-entry.js'),build=read('scripts/build.mjs');
  assert.match(controller,/\.\.\/tree\/index\.js/);
  assert.match(entry,/APP_VERSION='19\.0\.0'/);
  assert.match(build,/const appVersion='19\.0\.0'/);
  assert.match(build,/releaseTrain:'v19-family-graph'/);
  for(const file of ['graph.js','traversal.js','layout.js','state.js','render.js','interactions.js','export.js','mobile.js'])assert.ok(fs.existsSync(new URL(`../src/tree/${file}`,import.meta.url)));
});
