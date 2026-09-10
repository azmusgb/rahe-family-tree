import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8')),audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));
test('v12.6.1 family polish is active',()=>{assert.equal(model.meta.release,'12.6.1');assert.equal(model.familyExperience.version,'12.6.1');assert.match(model.familyExperience.profilePriority,/PERSON.*IMMEDIATE FAMILY.*LIFE STORY.*MEDIA/i);});
test('public portraits remain privacy gated presentation',()=>{assert.match(model.familyExperience.portraitRule,/PUBLIC IMAGE MEDIA/i);assert.match(model.familyExperience.portraitRule,/INITIALS.*FALLBACK/i);});
test('research detail remains available',()=>{assert.match(model.familyExperience.researchDisclosure,/Research Mode/i);assert.match(model.familyExperience.treeDepthLabel,/6 HOPS/i);assert.match(model.familyExperience.treeDepthLabel,/Full tree/i);});
test('v12.6.1 semantic gates pass',()=>{for(const id of['AUD-054','AUD-055','AUD-056','AUD-057'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);assert.equal(audit.version,'12.6.1');assert.equal(audit.pass,true);});
