import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v11.2 normalized events preserve source rows and do not promote evidence',()=>{
  assert.match(String(model.meta.release),/^11\.[2-9]/);
  assert.equal(model.normalizedEvents.length,model.events.length);
  assert(model.normalizedEvents.every(e=>e.eventId&&e.sourceLocation?.section&&e.recordText));
  assert(model.normalizedEvents.every(e=>/NOT A CLAIM PROMOTION/i.test(e.eventTypeAuthority)));
});

test('research queue v2 workflow status is operational only',()=>{
  assert(model.researchTasks.length>0);
  for(const t of model.researchTasks){
    assert.equal(t.operationalStatus,'NOT STARTED');
    assert.match(t.operationalStatusAuthority,/DOES NOT CHANGE EVIDENCE STATE/i);
    assert.equal(t.whyItMatters,t.payoff);
    assert(Array.isArray(t.potentialClaimIds));
  }
});

test('DeVine Rahe identity workspace remains unresolved',()=>{
  const w=model.identityWorkspace;
  assert(w);
  assert.equal(w.status,'UNRESOLVED');
  assert.match(w.requiredGraphicWording,/probable same person/i);
  assert.match(w.requiredGraphicWording,/transition mechanism unresolved/i);
  assert.match(w.evidenceRule,/mechanisms to investigate, not findings/i);
  assert(w.hypotheses.every(h=>h.status==='RESEARCH HYPOTHESIS ONLY'));
  assert(w.missingRecords.some(r=>/SS-5/i.test(r.record)));
});

test('family groups never infer a child without both explicit parent edges',()=>{
  const parent=model.relationships.filter(r=>r.active&&r.type==='parent-child'&&!/REJECTED/i.test(r.state));
  assert(model.familyGroups.length>0);
  for(const g of model.familyGroups)for(const child of g.childIds)for(const p of g.spouseIds)assert(parent.some(r=>r.from===p&&r.to===child));
});

test('evidence gaps preserve source claim states and next actions',()=>{
  assert(model.evidenceGaps.length>0);
  for(const g of model.evidenceGaps){
    const c=model.claims.find(c=>c.id===g.claimId);
    assert(c);
    assert.equal(g.state,c.state);
    assert.equal(g.nextAction,c.nextAction);
  }
});

test('v11.2 semantic audit gates remain present and passing',()=>{
  for(const id of ['AUD-010','AUD-011','AUD-012','AUD-013'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert.match(String(audit.version),/^11\.[2-9]/);
  assert.equal(audit.pass,true);
});
