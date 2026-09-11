import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const corpus = JSON.parse(fs.readFileSync('public/corpus.json','utf8'));
const report = JSON.parse(fs.readFileSync('public/canonical-completeness.json','utf8'));
const byName = name => corpus.people.filter(p => p.name === name);
const rels = corpus.relationships || [];
const personId = name => byName(name)[0]?.id;

test('machine-readable canonical completeness report passes', () => {
  assert.equal(report.releaseTarget, '13.0');
  assert.equal(report.pass, true, JSON.stringify(report.checks.filter(c => !c.pass), null, 2));
  assert.equal(report.exceptions.sourceMissing.length, 0);
  assert.equal(report.exceptions.claimMissing.length, 0);
  assert.equal(report.exceptions.claimWithoutPeople.length, 0);
  assert.equal(report.exceptions.selfEdges.length, 0);
  assert.equal(report.exceptions.orphanEdges.length, 0);
});

test('controlling evidence state is separate from strength qualifiers', () => {
  for (const p of corpus.people) {
    if (p.controllingState !== null) assert.match(p.controllingState, /^(SUPPORTED|PROVISIONAL|UNRESOLVED|REJECTED)$/);
    assert.ok(Array.isArray(p.qualifiers));
  }
  for (const r of rels) {
    if (r.controllingState !== null) assert.match(r.controllingState, /^(SUPPORTED|PROVISIONAL|UNRESOLVED|REJECTED)$/);
    assert.ok(Array.isArray(r.qualifiers));
  }
  for (const c of corpus.claims) {
    if (c.controllingState !== null) assert.match(c.controllingState, /^(SUPPORTED|PROVISIONAL|UNRESOLVED|REJECTED)$/);
    assert.ok(Array.isArray(c.qualifiers));
  }
});

test('Edward Ellery DeVine is never his own parent and identity bridge stays unresolved', () => {
  const edward = personId('Edward Ellery DeVine / DeVeine');
  const william = personId('William John Rahe Sr.');
  const ellery = personId('Ellery / Elley DeVine / DeVeine');
  assert.ok(edward && william && ellery);
  assert.equal(rels.some(r => r.type === 'parent-child' && r.from === edward && r.to === edward), false);
  assert.ok(rels.some(r => r.type === 'parent-child' && r.from === ellery && r.to === edward && r.controllingState === 'SUPPORTED'));
  const bridge = rels.find(r => r.type === 'identity-bridge');
  assert.ok(bridge);
  assert.notEqual(bridge.from, bridge.to);
  assert.match(bridge.state, /UNRESOLVED/i);
});

test('same-name Johann Gottlieb resolution links Johanna to the earlier person', () => {
  const johanns = byName('Johann Gottlieb Dennewitz');
  const johanna = personId('Johanna D. Rungert');
  assert.ok(johanns.length >= 2 && johanna);
  const spouse = rels.find(r => r.type === 'spouse' && (r.from === johanna || r.to === johanna));
  assert.ok(spouse);
  assert.equal([spouse.from, spouse.to].includes(johanns[0].id), true);
  assert.equal([spouse.from, spouse.to].includes(johanns[1].id), false);
});

test('Sarah Ferry derivative spouse leads cannot become supported pedigree edges', () => {
  const sarah = personId('Sarah Ferry');
  for (const name of ['Elie Davin','Clifford Henry Rahe','Jack Dale']) {
    const other = personId(name);
    assert.ok(other);
    const lead = rels.find(r => r.type === 'spouse-lead' && [r.from,r.to].includes(sarah) && [r.from,r.to].includes(other));
    assert.ok(lead, name);
    assert.equal(lead.activePedigree, false, name);
    if (name !== 'Clifford Henry Rahe') assert.notEqual(lead.controllingState, 'SUPPORTED', name);
  }
});

test('Hazel parentage remains provisional while adult spouse identity remains distinct', () => {
  const hazel = personId('Hazel Emma Berg Dennewitz');
  for (const parent of ['Arnold “Carl” Eric Berg','Katherine May Kinsman']) {
    const id = personId(parent);
    const rel = rels.find(r => r.type === 'parent-child' && r.from === id && r.to === hazel);
    assert.ok(rel, parent);
    assert.equal(rel.controllingState, 'PROVISIONAL', parent);
    assert.equal(rel.strength, 'STRONG', parent);
  }
  const george = personId('George Otto Dennewitz Jr.');
  const spouse = rels.find(r => r.type === 'spouse' && [r.from,r.to].includes(hazel) && [r.from,r.to].includes(george));
  assert.ok(spouse);
  assert.equal(spouse.controllingState, 'SUPPORTED');
});

test('Appendix E V-register and claims are complete and linked', () => {
  const ids = new Set(corpus.sources.map(s => s.id));
  for (let i=1;i<=13;i++) assert.equal(ids.has(`V${String(i).padStart(3,'0')}`), true, `V${String(i).padStart(3,'0')}`);
  for (const claim of corpus.claims) assert.ok(claim.peopleIds?.length, claim.id);
});

test('private and rejected alternates are not silently activated', () => {
  assert.equal(rels.some(r => r.activePedigree && /George Berg|Ella Kline/.test(`${corpus.people.find(p=>p.id===r.from)?.name||''} ${corpus.people.find(p=>p.id===r.to)?.name||''}`)), false);
  assert.equal(rels.some(r => r.activePedigree && /Laura K\. Dennewitz|Scottish golfer/.test(`${corpus.people.find(p=>p.id===r.from)?.name||''} ${corpus.people.find(p=>p.id===r.to)?.name||''}`)), false);
});
