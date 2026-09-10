import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v12.1 shared family data is append-only and non-canonical',()=>{
  assert.equal(model.meta.release,'12.1');
  assert.match(model.sharedFamilyData.authority,/CANONICAL v10 REMAINS IMMUTABLE/i);
  assert.match(model.sharedFamilyData.storage,/PostgreSQL/i);
});

test('shared writes are protected and review-gated',()=>{
  assert.match(model.sharedFamilyData.writeProtection,/FAMILY_EDITOR_WRITE_KEY/);
  assert(model.sharedFamilyData.workflow.includes('submit pending revision'));
  assert(model.sharedFamilyData.workflow.includes('explicit approve or reject'));
});

test('browser-local edits can migrate across devices without promotion',()=>{
  assert.match(model.sharedFamilyData.migrationRule,/pending shared revision/i);
  assert.match(model.sharedFamilyData.privacyRule,/Canonical evidence states are never modified/i);
});

test('v12.1 audit gates pass',()=>{
  for(const id of ['AUD-029','AUD-030','AUD-031','AUD-032'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert.equal(audit.version,'12.1');assert.equal(audit.pass,true);
});
