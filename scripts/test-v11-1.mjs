import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v11.1 contextual orphan dispositions are explicit and non-promotional',()=>{
  assert.match(String(model.meta.release),/^11\.[1-9]$/);
  assert.equal(model.contextRelationships.length,4);
  const ids=new Set(model.contextRelationships.map(r=>r.id));
  for(const id of ['CTX-KIN-001','CTX-KIN-002','CTX-FER-001','CTX-RAH-001'])assert(ids.has(id));
  assert(model.contextRelationships.every(r=>r.from&&r.to&&r.source?.section));
});

test('Kinsman collateral leads remain sibling-context rather than invented parent-child edges',()=>{
  for(const id of ['CTX-KIN-001','CTX-KIN-002']){
    const r=model.contextRelationships.find(x=>x.id===id);
    assert.equal(r.type,'sibling-context');
    assert.match(r.state,/PROVISIONAL/i);
    assert.match(r.state,/DERIVATIVE/i);
  }
});

test('David Fleming is represented as sponsor only',()=>{
  const r=model.contextRelationships.find(x=>x.id==='CTX-FER-001');
  assert.equal(r.type,'baptism-sponsor');
  assert.match(r.role,/not a kinship assertion/i);
  assert.deepEqual(r.sourceIds,['C001']);
});

test('Elie Davin remains a derivative spouse lead, not a proved spouse edge',()=>{
  const r=model.contextRelationships.find(x=>x.id==='CTX-RAH-001');
  assert.equal(r.type,'spouse-lead');
  assert.match(r.state,/PROVISIONAL/i);
  assert.match(r.state,/DERIVATIVE/i);
  assert.doesNotMatch(r.state,/SUPPORTED/i);
});

test('semantic audit resolves display orphans while retaining structural-orphan disclosure',()=>{
  const c=audit.checks.find(x=>x.id==='AUD-009');
  assert(c?.pass);
  assert.equal(audit.exceptions.orphanPeople.length,0);
  assert(audit.exceptions.structuralOrphans.length>=4);
});
