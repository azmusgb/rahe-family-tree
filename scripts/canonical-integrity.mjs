import fs from 'node:fs';

const corpusPath = 'public/corpus.json';
const reportPath = 'public/canonical-completeness.json';
const data = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

const CONTROL_STATES = ['SUPPORTED', 'PROVISIONAL', 'UNRESOLVED', 'REJECTED'];
const upper = value => String(value ?? '').toUpperCase();
const norm = value => String(value ?? '').normalize('NFKD').replace(/[^\x00-\x7F]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const section = prefix => data.sections.find(s => !s.legacy && s.title.startsWith(prefix)) || data.sections.find(s => s.title.startsWith(prefix));
const allText = JSON.stringify(data.sections || []);

function evidence(raw, context = '') {
  const text = upper(raw);
  let controllingState = null;
  if (/PARENTAGE/.test(upper(context)) && /PROVISIONAL/.test(text)) controllingState = 'PROVISIONAL';
  else if (/REJECT/.test(text)) controllingState = 'REJECTED';
  else if (/UNRESOLVED|NOT YET PROVED|NOT PROVED|UNKNOWN/.test(text)) controllingState = 'UNRESOLVED';
  else if (/PROVISIONAL/.test(text)) controllingState = 'PROVISIONAL';
  else if (/SUPPORTED/.test(text)) controllingState = 'SUPPORTED';
  const strength = /VERY HIGH/.test(text) ? 'VERY HIGH'
    : /PROVISIONAL[- ]STRONG|STRONGLY CORROBORATED/.test(text) ? 'STRONG'
    : /PROVISIONAL[- ]HIGH|\bHIGH\b|NEAR[- ]SUPPORTED/.test(text) ? 'HIGH'
    : /FAMILY[- ]ESTABLISHED/.test(text) ? 'FAMILY-ESTABLISHED'
    : null;
  const qualifiers = [];
  for (const q of ['DERIVATIVE', 'LEAD', 'COLLATERAL', 'PROBABLE', 'HYPOTHESIS', 'WITHDRAWN', 'WRONG PERSON', 'UNSUBSTANTIATED ALTERNATE']) {
    if (text.includes(q)) qualifiers.push(q);
  }
  return { controllingState, strength, qualifiers };
}

const peopleByName = new Map();
for (const p of data.people || []) {
  const key = norm(p.name);
  if (!peopleByName.has(key)) peopleByName.set(key, []);
  peopleByName.get(key).push(p);
  const e = evidence(p.state, p.role);
  p.controllingState = e.controllingState;
  p.strength = e.strength;
  p.qualifiers = e.qualifiers;
}
const person = (name, occurrence = 0) => peopleByName.get(norm(name))?.[occurrence] || null;
const pid = (name, occurrence = 0) => person(name, occurrence)?.id || null;
const personById = new Map((data.people || []).map(p => [p.id, p]));

let relationships = (data.relationships || []).filter(r => r.from && r.to && r.from !== r.to);

// Repair same-name ambiguity: Johanna D. Rungert belongs with the earlier c.1740 Johann Gottlieb,
// not the 1778 same-named descendant.
const johanns = peopleByName.get(norm('Johann Gottlieb Dennewitz')) || [];
const johanna = person('Johanna D. Rungert');
if (johanns.length >= 2 && johanna) {
  relationships = relationships.filter(r => !(r.type === 'spouse' && (r.from === johanna.id || r.to === johanna.id)));
  relationships.push({
    id: 'REL-CANON-JOHANN-RUNGERT', type: 'spouse', from: johanns[0].id, to: johanna.id, role: 'spouse',
    state: 'PROVISIONAL', source: { section: section('3.')?.id || '', basis: 'Direct-line relationship register; earlier same-named Johann Gottlieb' }
  });
}

// Repair the DeVine father resolution explicitly; fuzzy name matching must never make Edward his own parent.
const ellery = person('Ellery / Elley DeVine / DeVeine');
const edward = person('Edward Ellery DeVine / DeVeine');
const sarah = person('Sarah Ferry');
if (edward) relationships = relationships.filter(r => !(r.type === 'parent-child' && r.to === edward.id && r.from === edward.id));
function ensureRelationship(id, type, from, to, rawState, role, sourcePrefix, basis, extra = {}) {
  if (!from || !to || from === to) return;
  const existing = relationships.find(r => r.type === type && r.from === from && r.to === to);
  if (existing) {
    existing.state = rawState;
    existing.role = role || existing.role;
    existing.source = { ...(existing.source || {}), section: existing.source?.section || section(sourcePrefix)?.id || '', basis: existing.source?.basis || basis };
    Object.assign(existing, extra);
    return existing;
  }
  const rel = { id, type, from, to, role, state: rawState, source: { section: section(sourcePrefix)?.id || '', basis }, ...extra };
  relationships.push(rel);
  return rel;
}
if (ellery && edward) ensureRelationship('REL-CANON-DEVINE-FATHER', 'parent-child', ellery.id, edward.id, 'SUPPORTED / VERY HIGH', 'father', '8.', '1918 St. Anne extract');
if (sarah && edward) ensureRelationship('REL-CANON-DEVINE-MOTHER', 'parent-child', sarah.id, edward.id, 'SUPPORTED / VERY HIGH', 'mother', '8.', '1918 St. Anne extract');

// Sarah Ferry spouse chronology is mixed. Keep derivative spouse assertions as inactive research leads;
// only Clifford carries a canonical PROVISIONAL high-value lead state.
const spouseLeadSpecs = [
  ['Elie Davin', 'DERIVATIVE lead', 'UNRESOLVED'],
  ['Clifford Henry Rahe', 'PROVISIONAL high-value lead', 'PROVISIONAL'],
  ['Jack Dale', 'DERIVATIVE lead', 'UNRESOLVED']
];
if (sarah) {
  const targetIds = new Set(spouseLeadSpecs.map(([name]) => pid(name)).filter(Boolean));
  relationships = relationships.filter(r => !(r.type === 'spouse' && ((r.from === sarah.id && targetIds.has(r.to)) || (r.to === sarah.id && targetIds.has(r.from)))));
  for (const [name, rawState, normalizedState] of spouseLeadSpecs) {
    const other = person(name);
    if (!other) continue;
    relationships.push({
      id: `REL-LEAD-SARAH-${other.id}`,
      type: 'spouse-lead', from: sarah.id, to: other.id, role: 'derivative spouse chronology lead', state: rawState,
      controllingState: normalizedState, strength: normalizedState === 'PROVISIONAL' ? 'HIGH' : null,
      qualifiers: ['LEAD', ...(rawState.includes('DERIVATIVE') ? ['DERIVATIVE'] : [])], active: false, activePedigree: false,
      source: { section: section('9.')?.id || section('Appendix F.')?.id || '', basis: 'Canonical source preserves spouse chronology as derivative/provisional lead only' }
    });
  }
}

// Split controlling evidence state from strength/qualifier text on every relationship.
for (const r of relationships) {
  const from = personById.get(r.from);
  const to = personById.get(r.to);
  const context = `${r.role || ''} ${from?.name || ''} ${to?.name || ''}`;
  let e = evidence(r.state, context);
  // Hazel's adult identity/spouse is supported, but parentage is explicitly PROVISIONAL-STRONG.
  const hazelId = pid('Hazel Emma Berg Dennewitz');
  if (r.type === 'parent-child' && r.to === hazelId && [pid('Arnold “Carl” Eric Berg'), pid('Katherine May Kinsman')].includes(r.from)) {
    r.state = 'PROVISIONAL-STRONG';
    e = evidence(r.state, 'parentage');
  }
  if (!r.controllingState) r.controllingState = e.controllingState;
  if (!r.strength) r.strength = e.strength;
  r.qualifiers = [...new Set([...(r.qualifiers || []), ...e.qualifiers])];
  if (typeof r.active !== 'boolean') r.active = r.controllingState !== 'REJECTED' && r.type !== 'spouse-lead';
  if (typeof r.activePedigree !== 'boolean') r.activePedigree = r.active && ['spouse', 'parent-child', 'direct-line-succession'].includes(r.type);
}

// Appendix E's V001-V013 register can live in its E.4 child section. Scan all canonical tables,
// rather than only the Appendix E heading section.
const sourcesById = new Map((data.sources || []).map(s => [s.id, s]));
for (const s of data.sections || []) {
  if (s.legacy) continue;
  for (const b of s.blocks || []) {
    if (b.type !== 'table') continue;
    for (let row = 1; row < (b.rows || []).length; row++) {
      const r = b.rows[row];
      const id = String(r?.[0] || '').trim();
      if (!/^V\d{3}$/.test(id) || sourcesById.has(id)) continue;
      sourcesById.set(id, {
        id, name: r[1] || '', class: 'Verified web/repository source', use: r[2] || '',
        weight: 'Procedure/source verification only', legacyIds: '', location: { section: s.id, row }
      });
    }
  }
}
const sources = [...sourcesById.values()];

// Attach deterministic person links to claim rows; these are structural links only and never promote evidence.
const claimPeople = {
  'CL-DB-001': ['George Otto Dennewitz Jr.', 'Hazel Emma Berg Dennewitz'],
  'CL-DB-002': ['Hazel Emma Berg Dennewitz'],
  'CL-DB-003': ['George Otto Dennewitz Jr.', 'Hazel Emma Berg Dennewitz', 'Linda Kay Dennewitz', 'Jean C./Carol Dennewitz'],
  'CL-DB-004': ['Kathleen Ann Dennewitz Rahe'],
  'CL-BK-001': ['Hazel Emma Berg Dennewitz', 'Arnold “Carl” Eric Berg', 'Katherine May Kinsman'],
  'CL-BK-002': ['Arnold “Carl” Eric Berg', 'Oscar Ferdinand Berg', 'Emma Matilda [maiden unknown]'],
  'CL-BK-003': ['Emma Matilda [maiden unknown]'],
  'CL-KIN-001': ['Katherine May Kinsman', 'Walter / George Walter Kinsman', 'Mary Jane Hickey / McLaughlin'],
  'CL-HH-001': ['Kate Alice Holman', 'Carl Otto Holman Sr.', 'Annette Olsdtr. Hafnor'],
  'CL-FER-001': ['Owen Ferry', 'Peter / Patrick Ferry', 'Cecily / Cecelia / Sheelah O’Donnell'],
  'CL-FER-002': ['Sarah Ferry', 'Owen Ferry', 'Isabella / Margaret Isabella McFadden'],
  'CL-FER-003': ['Sarah Ferry', 'Cicily / Cecelia Frances Ferry Fleming', 'David Fleming'],
  'CL-DV-001': ['Edward Ellery DeVine / DeVeine', 'Ellery / Elley DeVine / DeVeine', 'Sarah Ferry'],
  'CL-DV-002': ['Edward Ellery DeVine / DeVeine', 'William John Rahe Sr.'],
  'CL-RAHE-001': ['Sarah Ferry', 'Clifford Henry Rahe'],
  'CL-RAHE-002': ['Clifford Henry Rahe', 'Edward Ellery DeVine / DeVeine', 'William John Rahe Sr.'],
  'CL-RAC-001': ['Jean Mary Racky', 'John Francis Racky', 'Anna Rose Hoffman'],
  'CL-RAC-002': ['John Francis Racky', 'Anna Rose Hoffman'],
  'CL-RAC-003': ['William John Rahe Sr.', 'Jean Mary Racky'],
  'CL-RAC-004': ['William John Rahe Sr.', 'Jean Mary Racky'],
  'CL-DEN-EARLY': ['Johann Ernst Dennewitz', 'Johann Gottlieb Dennewitz', 'John C. Dennewitz']
};
for (const c of data.claims || []) {
  const e = evidence(c.state, c.claim);
  c.controllingState = e.controllingState;
  c.strength = e.strength;
  c.qualifiers = e.qualifiers;
  c.peopleIds = [...new Set((claimPeople[c.id] || []).flatMap(name => (peopleByName.get(norm(name)) || []).map(p => p.id)))];
}

function sourceRows() {
  const ids = new Set();
  for (const s of data.sections || []) {
    if (s.legacy) continue;
    for (const b of s.blocks || []) if (b.type === 'table') for (const r of b.rows || []) {
      const id = String(r?.[0] || '').trim();
      if (/^[CWV]\d{3}$/.test(id)) ids.add(id);
    }
  }
  return ids;
}
function claimRows() {
  const ids = new Set();
  for (const s of data.sections || []) for (const b of s.blocks || []) if (b.type === 'table') for (const r of b.rows || []) {
    const id = String(r?.[0] || '').trim();
    if (/^CL-/.test(id)) ids.add(id);
  }
  return ids;
}
function rowCount(prefix) {
  const s = section(prefix);
  const t = s?.blocks?.find(b => b.type === 'table');
  return t ? Math.max(0, t.rows.length - 1) : 0;
}

const appendixF = section('Appendix F.');
const appendixFTable = appendixF?.blocks?.find(b => b.type === 'table');
const expectedPeople = appendixFTable ? Math.max(0, appendixFTable.rows.length - 1) : 0;
const expectedSourceIds = sourceRows();
const expectedClaimIds = claimRows();
const structuredSourceIds = new Set(sources.map(s => s.id));
const structuredClaimIds = new Set((data.claims || []).map(c => c.id));
const identityBridge = relationships.find(r => r.type === 'identity-bridge');
const selfEdges = relationships.filter(r => r.from === r.to).map(r => r.id);
const orphanEdges = relationships.filter(r => !personById.has(r.from) || !personById.has(r.to)).map(r => r.id);
const activeNames = new Set(relationships.filter(r => r.activePedigree).flatMap(r => [personById.get(r.from)?.name, personById.get(r.to)?.name]).filter(Boolean));
const requiredAppendices = 'ABCDEFG'.split('').map(letter => `Appendix ${letter}.`);
const appendixCoverage = Object.fromEntries(requiredAppendices.map(prefix => [prefix, Boolean(section(prefix))]));
const sourceMissing = [...expectedSourceIds].filter(id => !structuredSourceIds.has(id));
const claimMissing = [...expectedClaimIds].filter(id => !structuredClaimIds.has(id));
const claimWithoutPeople = (data.claims || []).filter(c => !c.peopleIds?.length).map(c => c.id);

const checks = [
  { id: 'CAN-001', label: 'Appendix F person inventory imported deterministically', pass: expectedPeople > 0 && data.people.length === expectedPeople, detail: `${data.people.length}/${expectedPeople}` },
  { id: 'CAN-002', label: 'All canonical source IDs including Appendix E V-register are imported', pass: sourceMissing.length === 0, detail: sourceMissing.length ? sourceMissing : `${structuredSourceIds.size}/${expectedSourceIds.size}` },
  { id: 'CAN-003', label: 'All claim-register IDs are imported', pass: claimMissing.length === 0, detail: claimMissing.length ? claimMissing : `${structuredClaimIds.size}/${expectedClaimIds.size}` },
  { id: 'CAN-004', label: 'Structured claims retain person links', pass: claimWithoutPeople.length === 0, detail: claimWithoutPeople },
  { id: 'CAN-005', label: 'No relationship self-edges', pass: selfEdges.length === 0, detail: selfEdges },
  { id: 'CAN-006', label: 'All relationship endpoints resolve', pass: orphanEdges.length === 0, detail: orphanEdges },
  { id: 'CAN-007', label: 'Edward DeVine and William Rahe remain separate with unresolved identity bridge', pass: Boolean(identityBridge) && identityBridge.from !== identityBridge.to && upper(identityBridge.state).includes('UNRESOLVED'), detail: identityBridge || null },
  { id: 'CAN-008', label: 'Hazel parentage remains provisional-strong', pass: relationships.filter(r => r.type === 'parent-child' && r.to === pid('Hazel Emma Berg Dennewitz') && [pid('Arnold “Carl” Eric Berg'), pid('Katherine May Kinsman')].includes(r.from)).every(r => r.controllingState === 'PROVISIONAL'), detail: relationships.filter(r => r.type === 'parent-child' && r.to === pid('Hazel Emma Berg Dennewitz')).map(r => ({ id: r.id, state: r.state, controllingState: r.controllingState })) },
  { id: 'CAN-009', label: 'George Berg + Ella Kline remains outside active pedigree', pass: ![...activeNames].some(n => /George Berg|Ella Kline/i.test(n || '')), detail: 'No active pedigree relationship contains the unsubstantiated alternate' },
  { id: 'CAN-010', label: 'Scottish golfer George Kinsman remains excluded', pass: ![...activeNames].some(n => /Scottish golfer/i.test(n || '')), detail: 'Wrong-person collision is not active' },
  { id: 'CAN-011', label: 'Laura K. Dennewitz rejected duplicate remains excluded', pass: ![...activeNames].some(n => /Laura K\. Dennewitz/i.test(n || '')), detail: 'Rejected duplicate is not active' },
  { id: 'CAN-012', label: '1942 civil and 1948 Catholic Rahe-Racky events remain separate in source', pass: allText.includes('15 May 1942') && allText.includes('16 May 1948'), detail: 'Both event dates present independently' },
  { id: 'CAN-013', label: 'Negative-search log retained', pass: rowCount('13.') > 0, detail: rowCount('13.') },
  { id: 'CAN-014', label: 'Research/acquisition queue retained', pass: rowCount('17.') > 0, detail: rowCount('17.') },
  { id: 'CAN-015', label: 'Conflict/rejection/quarantine register retained', pass: rowCount('12.') > 0, detail: rowCount('12.') },
  { id: 'CAN-016', label: 'Appendices A-G retained', pass: Object.values(appendixCoverage).every(Boolean), detail: appendixCoverage },
  { id: 'CAN-017', label: 'Part II lossless annex layer retained', pass: (data.meta?.annexes || 0) > 0 && (data.sections || []).some(s => s.legacy), detail: { annexes: data.meta?.annexes || 0, legacySections: (data.sections || []).filter(s => s.legacy).length } },
  { id: 'CAN-018', label: 'Living-person public dates remain withheld', pass: (data.people || []).filter(p => p.living).every(p => !/\b(?:19|20)\d{2}\b/.test(p.dates || '')), detail: (data.people || []).filter(p => p.living).map(p => p.id) }
];

const report = {
  schemaVersion: 1,
  releaseTarget: '13.0',
  sourceTitle: data.meta?.title || '',
  sourceSha256: data.meta?.sha256 || '',
  generatedFrom: 'public/corpus.json',
  pass: checks.every(c => c.pass),
  counts: {
    appendixFPeople: expectedPeople,
    structuredPeople: data.people.length,
    relationships: relationships.length,
    claimRegister: expectedClaimIds.size,
    structuredClaims: structuredClaimIds.size,
    sourceRegister: expectedSourceIds.size,
    structuredSources: structuredSourceIds.size,
    conflicts: rowCount('12.'),
    negativeSearches: rowCount('13.'),
    researchQueue: rowCount('17.'),
    legacyAnnexes: data.meta?.annexes || 0
  },
  checks,
  exceptions: { sourceMissing, claimMissing, claimWithoutPeople, selfEdges, orphanEdges }
};

data.relationships = relationships;
data.sources = sources;
data.meta = { ...data.meta, relationships: relationships.length, sources: sources.length, canonicalCompletenessPass: report.pass, canonicalCompletenessReport: 'canonical-completeness.json' };
fs.writeFileSync(corpusPath, JSON.stringify(data));
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pass: report.pass, counts: report.counts, failed: checks.filter(c => !c.pass).map(c => c.id) }, null, 2));
if (!report.pass) process.exitCode = 1;
