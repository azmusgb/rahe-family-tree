import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{buildResearchAutomation}from'../research-automation.js';

const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const people=[...(model.people||[]),...(model.familySupplement?.people||[])];
const relationships=[...(model.relationships||[]),...(model.familySupplement?.relationships||[])];
const snapshot=JSON.stringify({people,relationships,claims:model.claims,evidenceGaps:model.evidenceGaps});
const pairKey=(a,b)=>[a,b].sort().join('|');

const result=buildResearchAutomation({model,people,relationships});

test('research automation is deterministic advisory output over current canonical data',()=>{
  assert.equal(result.authority,'ADVISORY ONLY — HUMAN REVIEW REQUIRED');
  assert.equal(result.formula,'genealogical importance × evidence weakness × expected record value × feasibility');
  assert.ok(Array.isArray(result.tasks));
  assert.ok(Array.isArray(result.identityCandidates));
  assert.equal(JSON.stringify({people,relationships,claims:model.claims,evidenceGaps:model.evidenceGaps}),snapshot,'automation must not mutate canonical inputs');
});

test('generated tasks retain explicit no-promotion authority and rank only operational attention',()=>{
  for(const task of result.tasks){
    assert.equal(task.authority,'OPERATIONAL REVIEW ONLY — CANNOT CHANGE CANONICAL EVIDENCE');
    assert.ok(task.priorityScore>=1);
    assert.ok(['critical','high','medium','low'].includes(task.severity));
    assert.ok(task.factors.importance>=1&&task.factors.importance<=5);
    assert.ok(task.factors.weakness>=1&&task.factors.weakness<=5);
    assert.ok(task.factors.recordValue>=1&&task.factors.recordValue<=5);
    assert.ok(task.factors.feasibility>=1&&task.factors.feasibility<=5);
  }
});

test('identity candidates exclude living people, known active relatives, and automatic merge authority',()=>{
  const living=new Set(people.filter(person=>person.living).map(person=>person.id));
  const knownRelatives=new Set(relationships.filter(rel=>rel.active!==false&&rel.type!=='identity-bridge'&&!/REJECTED/i.test(String(rel.state||rel.evidenceState||''))).map(rel=>pairKey(rel.from,rel.to)));
  for(const candidate of result.identityCandidates){
    assert.equal(candidate.authority,'CANDIDATE REVIEW ONLY — NEVER AUTO-MERGE');
    assert.equal(living.has(candidate.personA),false);
    assert.equal(living.has(candidate.personB),false);
    assert.equal(knownRelatives.has(pairKey(candidate.personA,candidate.personB)),false,'active relatives must not be suggested as duplicate identities');
    assert.ok(['PROBABLE MATCH','POSSIBLE MATCH','CONFLICTING EVIDENCE','INSUFFICIENT EVIDENCE'].includes(candidate.classification));
  }
});

test('the DeVine/DeVeine to William John Rahe Sr identity bridge remains unresolved and separate',()=>{
  const bridge=relationships.find(rel=>rel.type==='identity-bridge'&&/UNRESOLVED/i.test(String(rel.state||rel.evidenceState||'')));
  assert.ok(bridge,'expected unresolved identity bridge in canonical data');
  const candidate=result.identityCandidates.find(item=>item.relationshipId===bridge.id);
  assert.ok(candidate,'explicit unresolved bridge should be surfaced for human review');
  assert.equal(candidate.controllingBridgeState,'UNRESOLVED');
  assert.notEqual(candidate.authority,'MERGE');
  assert.equal(JSON.stringify(relationships.find(rel=>rel.id===bridge.id)),JSON.stringify(bridge));
});

test('rejected relationships do not generate weak-parentage tasks',()=>{
  const rejected=new Set(relationships.filter(rel=>rel.active===false||/REJECTED/i.test(String(rel.state||rel.evidenceState||''))).map(rel=>rel.id));
  assert.ok(result.tasks.filter(task=>task.relationshipId).every(task=>!rejected.has(task.relationshipId)));
});

test('name-transition and census signals stay grounded in canonical research targets or explicit identity review',()=>{
  const canonicalTaskIds=new Set((model.researchTasks||[]).map(task=>task.id));
  for(const task of result.tasks.filter(task=>task.ruleId==='IDENT-001'||task.ruleId==='CENSUS-001')){
    const linked=(task.canonicalTaskIds||[]).some(id=>canonicalTaskIds.has(id));
    const explicitBridge=relationships.some(rel=>rel.type==='identity-bridge'&&rel.active!==false&&[rel.from,rel.to].includes(task.personId));
    assert.ok(linked||explicitBridge,'heuristic task must be grounded by canonical queue or explicit identity bridge');
  }
});
