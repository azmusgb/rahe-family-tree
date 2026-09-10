import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8')),audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));
const atLeast=x=>{const[a=0,b=0,c=0]=String(x).split('.').map(Number);return a>12||a===12&&(b>6||b===6&&c>=1);};
test('v12.6.1 family polish remains active',()=>{assert(atLeast(model.meta.release));assert.match(model.familyExperience.profilePriority,/PERSON.*IMMEDIATE FAMILY.*LIFE STORY.*MEDIA/i);});
test('public portraits remain privacy gated presentation',()=>{assert.match(model.familyExperience.portraitRule,/PUBLIC IMAGE MEDIA/i);assert.match(model.familyExperience.portraitRule,/INITIALS.*FALLBACK/i);});
test('research detail remains available',()=>{assert.match(model.familyExperience.researchDisclosure,/Research Mode/i);assert.match(model.familyExperience.treeDepthLabel,/6 HOPS/i);assert.match(model.familyExperience.treeDepthLabel,/Full tree/i);});
test('v12.6.1 semantic gates remain passing',()=>{for(const id of['AUD-054','AUD-055','AUD-056','AUD-057'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);assert(atLeast(audit.version));assert.equal(audit.pass,true);});
