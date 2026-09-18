import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{findRelationshipPath,pedigreeCycles,collateral,controllingState}from'../canonical-graph-engine.js';

const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const graph=JSON.parse(fs.readFileSync('public/canonical-graph.json','utf8'));
const provenance=JSON.parse(fs.readFileSync('public/provenance-index.json','utf8'));
const diff=JSON.parse(fs.readFileSync('public/canonical-diff.json','utf8'));
const allRelationships=[...(model.relationships||[]),...(model.familySupplement?.relationships||[]),...(model.contextRelationships||[])];
const allPeople=[...(model.people||[]),...(model.familySupplement?.people||[])];
const byName=rx=>allPeople.find(p=>rx.test(p.name));

test('canonical graph schema covers required genealogy entity kinds',()=>{
  for(const kind of['person','family-unit','claim','source','event','place','household-observation','research-task'])assert.ok(graph.nodeKinds.includes(kind),kind);
  assert.equal(graph.integrity.pass,true);
  assert.equal(graph.integrity.duplicateNodeIds.length,0);
  assert.equal(graph.integrity.orphanEdges.length,0);
  assert.equal(graph.integrity.activeRejectedEdges.length,0);
});

test('canonical diff blocks source loss and silent evidence promotion',()=>{
  assert.equal(diff.hasCanonicalLoss,false);
  assert.equal(diff.hasEvidencePromotion,false);
  for(const key of['people','relationships','claims','sources'])assert.equal(diff[key].missing.length,0,key);
});

test('DeVine and William identities remain separate with unresolved bridge semantics',()=>{
  const infant=byName(/Edward Ellery DeVine/i),adult=byName(/William John Rahe Sr/i);
  assert.ok(infant&&adult);
  assert.notEqual(infant.id,adult.id);
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge'&&new Set([r.from,r.to]).has(infant.id)&&new Set([r.from,r.to]).has(adult.id));
  assert.ok(bridge);
  assert.equal(controllingState(bridge),'UNRESOLVED');
  assert.notEqual(bridge.activePedigree,true);
  assert.equal(graph.integrity.identityBridgeSafe,true);
});

test('relationship finder traverses explicit evidence-qualified graph without mutating state',()=>{
  const adult=byName(/William John Rahe Sr/i),sarah=byName(/^Sarah Ferry/i);
  assert.ok(adult&&sarah);
  const before=JSON.stringify(allRelationships);
  const path=findRelationshipPath(adult.id,sarah.id,allRelationships,{includeContext:true});
  assert.ok(path);
  assert.ok(path.hops.length>=1);
  assert.equal(JSON.stringify(allRelationships),before);
  assert.ok(['SUPPORTED','PROVISIONAL','UNRESOLVED'].includes(path.evidenceState));
});

test('Tree Engine 2 sibling classification requires shared explicit parent edges',()=>{
  const rels=[
    {id:'r1',type:'parent-child',from:'PARENT',to:'A',state:'SUPPORTED',active:true,activePedigree:true},
    {id:'r2',type:'parent-child',from:'PARENT',to:'B',state:'SUPPORTED',active:true,activePedigree:true}
  ];
  const path=findRelationshipPath('A','B',rels,{includeContext:false});
  assert.equal(path.classification,'sibling');
  assert.deepEqual([...collateral('A',rels)].sort(),['A','B','PARENT'].sort());
  assert.deepEqual(pedigreeCycles(rels),[]);
});

test('provenance index preserves source-controlled state and traceability',()=>{
  const claim=(model.claims||[])[0];assert.ok(claim);
  const p=provenance.entities[claim.id];assert.ok(p);
  assert.equal(p.kind,'claim');
  assert.equal(p.controllingState,controllingState(claim));
  assert.ok(Array.isArray(p.sourceIds));
});

test('household observations are row-bounded and geography does not invent coordinates',()=>{
  for(const h of model.households?.observations||[]){
    assert.match(h.rule,/ROW-BOUNDED/);
    assert.ok(h.eventId);
    assert.ok(Array.isArray(h.memberIds));
  }
  for(const p of model.geography?.places||[]){
    assert.equal(Object.hasOwn(p,'lat'),false);
    assert.equal(Object.hasOwn(p,'long'),false);
    assert.ok(p.eventIds.length>0);
  }
});

test('platform capability contract exposes the shipped block without mutation authority',()=>{
  assert.equal(model.platform?.version,'13.10');
  for(const feature of['canonical-graph','provenance-index','canonical-diff','tree-engine-2','relationship-finder','person-family-dossiers','source-evidence-matrix','research-command-center-2','timeline-geography-households'])assert.ok(model.platform.features.includes(feature),feature);
  assert.match(model.platform.authority,/NEVER SILENTLY MUTATES CANONICAL EVIDENCE/);
});
