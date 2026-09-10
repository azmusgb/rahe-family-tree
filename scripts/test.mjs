import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const d=JSON.parse(fs.readFileSync('public/corpus.json','utf8'));

test('complete controlling-source coverage',()=>{
  assert.equal(d.sections.length,233);
  assert.equal(d.sections.flatMap(s=>s.blocks).filter(b=>b.type==='table').length,386);
  assert.equal(d.people.length,70);
  assert.equal(d.meta.annexes,9);
  for(const letter of 'ABCDEFG') assert(d.sections.some(s=>!s.legacy&&s.title.startsWith(`Appendix ${letter}.`)));
  assert(d.sections.some(s=>!s.legacy&&s.title.startsWith('23. v10')));
  assert(d.sections.some(s=>!s.legacy&&s.title.startsWith('25. v10 Final Single-Source Certification')));
});

test('legacy boundary ends before final v10 certification',()=>{
  const start=d.sections.findIndex(s=>s.title.startsWith('24. Part II'));
  const end=d.sections.findIndex(s=>s.title.startsWith('25. v10 Final Single-Source Certification'));
  assert(start>0 && end>start);
  assert(d.sections.slice(start,end).every(s=>s.legacy));
  assert.equal(d.sections[end].legacy,false);
  assert.equal(d.meta.canonicalFinalCertificationSection,d.sections[end].id);
});

test('identity bridge stays separate and unresolved',()=>{
  const e=d.people.find(p=>p.name==='Edward Ellery DeVine / DeVeine');
  const w=d.people.find(p=>p.name==='William John Rahe Sr.');
  assert(e && w);
  assert.notEqual(e.id,w.id);
  const bridge=d.relationships.find(r=>r.id==='REL-IDENTITY-BRIDGE');
  assert(bridge);
  assert.equal(bridge.from,e.id);
  assert.equal(bridge.to,w.id);
  assert.match(bridge.state,/UNRESOLVED/);
});

test('structured research model exists and preserves claim IDs',()=>{
  assert(d.relationships.length>=80);
  assert(d.claims.length>=20);
  assert(d.sources.length>=20);
  assert(d.events.length>=200);
  assert(d.claims.some(c=>c.id==='CL-DV-002' && /UNRESOLVED/.test(c.state)));
  assert(d.claims.some(c=>c.id==='CL-RAC-004' && /SUPPORTED/.test(c.state)));
  assert.equal(new Set(d.people.map(p=>p.id)).size,d.people.length);
  assert.equal(new Set(d.relationships.map(r=>r.id)).size,d.relationships.length);
});

test('rejected relationships do not become active graph edges',()=>{
  assert.equal(d.relationships.filter(r=>/REJECTED/.test(r.state)).length,0);
  const laura=d.people.find(p=>/Laura K\. Dennewitz/.test(p.name));
  assert.equal(laura,undefined);
});

test('public living-person birth details are withheld in payload and ledgered',()=>{
  const living=d.people.filter(p=>p.living);
  assert.equal(living.length,7);
  for(const p of living) assert.equal(p.dates,'Living / birth details withheld');
  const raw=JSON.stringify(d);
  for(const token of ['27 Oct 1942','17 Jun 1947','17 Nov 1952','2002–2014','2002-2014']) assert(!raw.includes(token));
  assert(d.meta.privacyRedactions>=80);
  assert.equal(d.meta.redactionEntries,d.redactions.length);
  assert(d.redactions.every(r=>r.location && r.reason && !('original' in r)));
});

test('source checksum matches controlling v10 file',()=>{
  assert.equal(d.meta.sha256,'f5af06930f4753c46f77ec0edf52e97519a7a68e94682963b2858878b870a6e4');
});
