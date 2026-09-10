import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));
const laterV12=x=>{const [a=0,b=0]=String(x).split('.').map(Number);return a>12||(a===12&&b>=2);};

test('v12.2 focal-person family experience remains defined',()=>{
  assert(laterV12(model.meta.release));
  assert(laterV12(model.familyExperience.version));
  assert.match(model.familyExperience.defaultTreeMode,/FOCAL PERSON/i);
  assert(model.familyExperience.navigationGroups.includes('Family'));
  assert(model.familyExperience.navigationGroups.includes('Research'));
  assert(model.familyExperience.navigationGroups.includes('Contribute'));
});

test('contextual add-relative cannot invent second parentage',()=>{
  assert.match(model.familyExperience.addRelativeRule,/explicit relationship edges only/i);
  assert.match(model.familyExperience.addRelativeRule,/exactly one spouse is already explicitly structured/i);
});

test('family-first UX remains non-promotional',()=>{
  assert.match(model.familyExperience.canonicalRule,/does not promote, merge, or rewrite canonical evidence/i);
  assert.match(model.familyExperience.evidenceDisplayRule,/distinct concepts/i);
});

test('v12.2 semantic audit gates remain passing',()=>{
  for(const id of ['AUD-033','AUD-034','AUD-035','AUD-036'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert(laterV12(audit.version));
  assert.equal(audit.pass,true);
});
