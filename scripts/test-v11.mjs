import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const corpus=JSON.parse(fs.readFileSync('public/corpus.json','utf8'));
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v11 model preserves canonical inventory counts',()=>{
  assert.equal(model.meta.version,11);
  assert.equal(model.people.length,corpus.people.length);
  assert.equal(model.relationships.length,corpus.relationships.length);
  assert.equal(model.claims.length,corpus.claims.length);
  assert.equal(model.sources.length,corpus.sources.length);
  assert.equal(model.events.length,corpus.events.length);
});

test('identity bridge remains separate and unresolved',()=>{
  const bridge=model.relationships.find(r=>r.type==='identity-bridge');
  assert(bridge);
  assert.notEqual(bridge.from,bridge.to);
  assert.match(bridge.state,/UNRESOLVED/i);
  assert.match(personName(bridge.from),/Edward Ellery DeVine/i);
  assert.match(personName(bridge.to),/William John Rahe Sr/i);
});

test('rejected relationships are never active',()=>{
  assert.equal(model.relationships.filter(r=>/REJECTED/i.test(r.state)&&r.active).length,0);
});

test('living person dates remain redacted in the research model',()=>{
  for(const p of model.people.filter(p=>p.living)) assert.doesNotMatch(p.dates,/\b(?:19|20)\d{2}\b/);
});

test('research operations are source-location backed',()=>{
  assert(model.researchTasks.length>=10);
  assert(model.negativeSearches.length>=5);
  assert(model.completenessGates.length>=5);
  assert(model.researchTasks.every(t=>t.sourceLocation?.section));
  assert(model.completenessGates.every(g=>g.status==='DEFINED — NOT AUTOMATICALLY SCORED'));
});

test('semantic audit has required safety checks',()=>{
  const ids=new Set(audit.checks.map(c=>c.id));
  for(const id of ['AUD-001','AUD-002','AUD-003','AUD-004','AUD-005','AUD-006','AUD-008']) assert(ids.has(id));
  assert(audit.checks.find(c=>c.id==='AUD-004').pass);
  assert(audit.checks.find(c=>c.id==='AUD-005').pass);
});

function personName(id){return model.people.find(p=>p.id===id)?.name||'';}
