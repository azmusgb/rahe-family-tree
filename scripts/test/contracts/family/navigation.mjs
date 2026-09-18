import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));
const laterV12=x=>{const [a=0,b=0]=String(x).split('.').map(Number);return a>12||(a===12&&b>=3);};

test('v12.3 visual family experience remains presentation-only',()=>{
  assert(laterV12(model.meta.release));
  assert.equal(model.visualFamilyExperience.version,'12.3');
  assert.match(model.visualFamilyExperience.canonicalRule,/Canonical v10 evidence/i);
  assert.match(model.visualFamilyExperience.canonicalRule,/immutable/i);
});

test('media foundation cannot promote evidence and protects living media',()=>{
  assert(Array.isArray(model.mediaAssets));
  assert.match(model.visualFamilyExperience.media.evidenceRule,/does not promote/i);
  assert.match(model.visualFamilyExperience.media.privacyRule,/explicitly marked public/i);
});

test('tree semantics keep identity bridge distinct',()=>{
  assert.match(model.visualFamilyExperience.relationshipSemantics.identityBridge,/unresolved/i);
  assert.match(model.visualFamilyExperience.relationshipSemantics.identityBridge,/distinct/i);
  assert.match(model.visualFamilyExperience.tree.familyDepth,/1\/2\/3 generation/i);
});

test('v12.3 audit gates remain passing',()=>{
  for(const id of ['AUD-037','AUD-038','AUD-039','AUD-040'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert(laterV12(audit.version));
  assert.equal(audit.pass,true);
});
