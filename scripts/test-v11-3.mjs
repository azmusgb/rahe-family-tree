import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v11.3 research overlay is explicitly non-canonical',()=>{
  assert.match(String(model.meta.release),/^11\.[3-9]$/);
  assert.match(model.researchStateSchema.authority,/NON-CANONICAL/i);
  assert.match(model.researchStateSchema.safetyRule,/never modify/i);
  assert(model.researchStateSchema.taskState.status.includes('RECORD ACQUIRED'));
});

test('evidence intake staging cannot promote evidence',()=>{
  assert.match(model.evidenceIntake.authority,/NON-CANONICAL/i);
  assert.match(model.evidenceIntake.promotionRule,/No staged intake draft can promote evidence/i);
  assert(model.evidenceIntake.requiredReviewSteps.length>=5);
});

test('normalized event IDs are unique and source-backed',()=>{
  const ids=model.normalizedEvents.map(e=>e.eventId);
  assert.equal(new Set(ids).size,ids.length);
  assert(model.normalizedEvents.every(e=>e.sourceLocation?.section));
  assert(model.normalizedEvents.every(e=>/SOURCE-CONTROLLED/i.test(e.eventSemantics)));
});

test('family groups have explicit labels without inventing children',()=>{
  assert(model.familyGroups.every(g=>g.label&&Number.isInteger(g.memberCount)));
  for(const g of model.familyGroups) assert.equal(g.memberCount,g.spouseIds.length+g.childIds.length);
});

test('v11.3 semantic gates remain present and passing',()=>{
  for(const id of ['AUD-014','AUD-015','AUD-016']) assert(audit.checks.find(x=>x.id===id)?.pass);
  assert(audit.pass);
});
