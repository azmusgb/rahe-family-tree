import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8')),audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));
const ui=fs.readFileSync('v12-8.js','utf8'),server=fs.readFileSync('netlify/functions/media.mts','utf8');
test('v12.8 media-first experience is active',()=>{assert.equal(model.meta.release,'12.8');assert.equal(model.mediaExperience.version,'12.8');assert.match(model.mediaExperience.portraitRule,/FEATURED PUBLIC IMAGE MEDIA/i);});
test('server enforces living or unresolved media privacy',()=>{assert.match(model.mediaExperience.privacyRule,/SERVER-SIDE PRIVACY LOOKUP/i);assert.match(server,/privacyIndex/);assert.match(server,/privateRequired/);assert.match(server,/mustPrivate\?'private'/);});
test('multi-person media tagging is explicit and non-genealogical',()=>{assert.match(model.mediaExperience.taggingRule,/MULTIPLE EXPLICIT PERSON IDS/i);assert.match(ui,/name=\"personIds\"/);assert.match(model.mediaExperience.evidenceRule,/CANNOT PROMOTE EVIDENCE/i);});
test('featured portrait and gallery behaviors exist',()=>{assert.match(ui,/data-media-feature/);assert.match(ui,/portraitFor/);assert.match(ui,/v128-media-filters/);assert.match(ui,/data-media-open/);});
test('v12.8 semantic gates pass',()=>{for(const id of['AUD-067','AUD-068','AUD-069','AUD-070','AUD-071'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);assert.equal(audit.version,'12.8');assert.equal(audit.pass,true);});
