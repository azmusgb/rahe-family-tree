import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8')),audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));
const js=fs.readFileSync('v12-6-2.js','utf8'),css=fs.readFileSync('v12-6-2.css','utf8');
const later=x=>{const [a=0,b=0,c=0]=String(x).split('.').map(Number);return a>12||a===12&&(b>6||b===6&&c>=2);};
test('v12.6.2 visual QA remains active',()=>{assert(later(model.meta.release));assert.equal(model.familyExperience.version,'12.6.2');assert.match(model.familyExperience.qaRule,/PRESENTATION-ONLY/i);});
test('mobile and accessibility capabilities persist',()=>{assert.match(model.familyExperience.responsiveRule,/MOBILE RETAINS FAMILY TREE/i);assert.match(model.familyExperience.accessibilityRule,/ARIA CURRENT STATE/i);assert.match(js,/aria-current/);assert.match(css,/prefers-reduced-motion/);});
test('touch and responsive corrections exist',()=>{assert.match(css,/--tap:44px/);assert.match(css,/min-height:44px/);assert.match(css,/safe-area-inset-bottom/);assert.match(js,/long-label/);});
test('privacy remains binding',()=>{assert.match(model.familyExperience.privacyRule,/PUBLIC PORTRAIT/i);assert.match(model.familyExperience.privacyRule,/LIVING-PERSON PRIVACY/i);});
test('v12.6.2 semantic gates remain passing',()=>{for(const id of['AUD-058','AUD-059','AUD-060','AUD-061'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);assert(later(audit.version));assert.equal(audit.pass,true);});
