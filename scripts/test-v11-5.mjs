import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v11.5 family supplement includes visible Hardesty family and named Rahe children',()=>{
  assert.equal(model.meta.release,'11.5');
  assert.equal(model.familySupplement.people.length,8);
  const names=model.familySupplement.people.map(p=>p.name);
  for(const n of ['Aimee Hardesty','Walter T. Hardesty Sr.','Elizabeth A. Hardesty','Walter Hardesty Jr.','William John Rahe IV','Abel M. Rahe','Owen G. Rahe','Declan S. Rahe'])assert(names.includes(n));
});

test('living-family supplement withholds birth dates and years',()=>{
  for(const p of model.familySupplement.people){assert.equal(p.living,true);assert.equal(p.dates,'Living / birth details withheld');assert.doesNotMatch(p.dates,/\b(?:19|20)\d{2}\b/);}
});

test('Hardesty spouse and visible children are explicit',()=>{
  const r=model.familySupplement.relationships;
  assert(r.some(x=>x.type==='spouse'&&x.from==='P-AIMEE-MICHELLE-RAHE-HARDESTY'&&x.to==='P-WALTER-T-HARDESTY-SR'));
  const has=(parent,child)=>r.some(x=>x.type==='parent-child'&&x.from===parent&&x.to===child&&x.active);
  for(const child of ['P-ELIZABETH-A-HARDESTY','P-WALTER-HARDESTY-JR']){assert(has('P-AIMEE-MICHELLE-RAHE-HARDESTY',child));assert(has('P-WALTER-T-HARDESTY-SR',child));}
  assert.match(model.familySupplement.hardestyRule,/partially cropped people are not inferred/i);
});

test('Aimee and named Rahe children have dual parent edges',()=>{
  const r=model.familySupplement.relationships;
  const has=(parent,child)=>r.some(x=>x.type==='parent-child'&&x.from===parent&&x.to===child&&x.active);
  assert(has('P-WILLIAM-JOHN-RAHE-JR','P-AIMEE-MICHELLE-RAHE-HARDESTY'));
  assert(has('P-KATHLEEN-ANN-DENNEWITZ-RAHE','P-AIMEE-MICHELLE-RAHE-HARDESTY'));
  for(const child of ['P-WILLIAM-JOHN-RAHE-IV','P-ABEL-M-RAHE','P-OWEN-G-RAHE','P-DECLAN-S-RAHE']){assert(has('P-WILLIAM-JOHN-RAHE-III',child));assert(has('P-MELISSA-RAHE',child));}
});

test('canonical aggregate row remains retained but display count reflects named replacement',()=>{
  assert(model.people.some(p=>p.id==='P-CURRENT-RAHE-CHILDREN'));
  assert.equal(model.meta.counts.canonicalPeople,70);
  assert.equal(model.meta.counts.supplementalPeople,8);
  assert.equal(model.meta.counts.displayPeople,77);
  assert.equal(model.meta.counts.supplementalRelationships,15);
});

test('v11.5 supplement audit gates pass',()=>{
  for(const id of ['AUD-020','AUD-021','AUD-022'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert.equal(audit.version,'11.5');
  assert.equal(audit.pass,true);
});
