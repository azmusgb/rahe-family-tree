import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v11.4 review packet schema is explicitly non-canonical',()=>{
  assert.equal(model.meta.release,'11.4');
  assert.match(model.reviewPacketSchema.authority,/NON-CANONICAL/i);
  assert.match(model.reviewPacketSchema.promotionRule,/cannot alter canonical evidence state/i);
});

test('review packets require source-reference validation semantics',()=>{
  assert.match(model.reviewPacketSchema.sourceIdPolicy,/registered canonical source/i);
  assert.match(model.reviewPacketSchema.sourceIdPolicy,/unregistered\/local reference/i);
});

test('research workflow persistence changes display only',()=>{
  assert.match(model.researchWorkflow.persistence.authority,/PRIVATE BROWSER OVERLAY/i);
  assert.match(model.researchWorkflow.persistence.behavior,/override display only/i);
  assert.match(model.researchWorkflow.persistence.behavior,/canonical task rows remain unchanged/i);
});

test('v11.4 semantic gates pass',()=>{
  for(const id of ['AUD-017','AUD-018','AUD-019'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert.equal(audit.version,'11.4');
  assert.equal(audit.pass,true);
});
