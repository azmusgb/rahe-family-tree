import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{analyzeRecord,createReviewDecision}from'../src/ingestion/record-ingestion-core.js';

const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const stateOf=value=>String(value?.controllingState||value?.evidenceState||value?.state||'').toUpperCase();

test('record ingestion matches explicit people and claim IDs without mutating evidence',()=>{
  const claim=(model.claims||[]).find(c=>c.id&&Array.isArray(c.peopleIds)&&c.peopleIds.length);
  assert.ok(claim,'test requires a claim with a linked person');
  const person=[...(model.people||[]),...(model.familySupplement?.people||[])].find(p=>p.id===claim.peopleIds[0]);
  assert.ok(person,'linked person should exist');
  const before=JSON.stringify(model.claims);
  const packet=analyzeRecord(model,{title:'Test record',recordType:'other',rawText:`Record names ${person.name}. Research reference ${claim.id}.`});
  assert.ok(packet.extracted.people.some(p=>p.id===person.id));
  assert.ok(packet.claimReviewCandidates.some(c=>c.id===claim.id));
  assert.equal(packet.controls.automaticPromotion,false);
  assert.equal(packet.claimReviewCandidates.find(c=>c.id===claim.id).proposedState,null);
  assert.equal(JSON.stringify(model.claims),before,'analysis must not mutate claims');
});

test('date differences are review signals only',()=>{
  const person=(model.people||[]).find(p=>!p.living&&/\b(1[5-9]\d{2}|20\d{2})\b/.test(String(p.dates||'')));
  assert.ok(person,'test requires a historical person with a year');
  const canonicalYear=Number(String(person.dates).match(/\b(1[5-9]\d{2}|20\d{2})\b/)[1]);
  const observed=canonicalYear+1;
  const packet=analyzeRecord(model,{rawText:`${person.name} was born ${observed}.`});
  const signal=packet.contradictionSignals.find(x=>x.personId===person.id&&x.eventType==='birth');
  assert.ok(signal,'a different explicit birth year should create a review signal');
  assert.match(signal.rule,/review signal, not a correction/i);
  assert.equal(packet.controls.automaticRelationshipCreation,false);
});

test('review approval remains non-canonical',()=>{
  const packet={digest:'abc123'};
  const review=createReviewDecision(packet,{decision:'approve-workbench',note:'Primary image inspected',reviewedAt:'2026-09-12T00:00:00.000Z'});
  assert.equal(review.decision,'approve-workbench');
  assert.equal(review.canonicalMutation,false);
  assert.equal(review.evidenceStateMutation,false);
  assert.match(review.authority,/does not promote evidence/i);
});

test('invalid and empty input is rejected defensively',()=>{
  assert.throws(()=>analyzeRecord(model,{rawText:'   '}),/required/i);
  assert.throws(()=>createReviewDecision({digest:'x'},{decision:'promote-supported'}),/invalid review decision/i);
});

test('identity bridge cannot be promoted by ingestion',()=>{
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge,'canonical model should contain the identity bridge');
  assert.match(stateOf(bridge),/UNRESOLVED/);
  const from=(model.people||[]).find(p=>p.id===bridge.from),to=(model.people||[]).find(p=>p.id===bridge.to);
  assert.ok(from&&to);
  const packet=analyzeRecord(model,{rawText:`${from.name} ${to.name} identity bridge research note.`});
  assert.equal(packet.controls.automaticPersonMerge,false);
  assert.equal(packet.controls.automaticPromotion,false);
  assert.match(stateOf(bridge),/UNRESOLVED/);
});
