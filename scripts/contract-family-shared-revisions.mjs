import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));
const v121plus=x=>{const [a=0,b=0]=String(x).split('.').map(Number);return a>12||(a===12&&b>=1);};

test('v12.1 shared family data remains append-only and non-canonical',()=>{
  assert(v121plus(model.meta.release));
  assert.match(model.sharedFamilyData.authority,/CANONICAL v10 REMAINS IMMUTABLE/i);
  assert.match(model.sharedFamilyData.storage,/PostgreSQL|Netlify Blobs/i);
});

test('shared writes remain protected and review-gated',()=>{
  assert.match(model.sharedFamilyData.writeProtection,/FAMILY_EDITOR_WRITE_KEY|Contributor|Editor|Admin/i);
  assert(model.sharedFamilyData.workflow.includes('submit pending revision'));
  assert(model.sharedFamilyData.workflow.includes('explicit approve or reject'));
});

test('browser-local edits retain cross-device migration without promotion',()=>{
  assert.match(model.sharedFamilyData.migrationRule,/pending shared revision/i);
  assert.match(model.sharedFamilyData.privacyRule,/Canonical evidence states are never modified/i);
});

test('v12.1 audit gates remain passing',()=>{
  for(const id of ['AUD-029','AUD-030','AUD-031','AUD-032'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert(v121plus(audit.version));assert.equal(audit.pass,true);
});
