import fs from 'node:fs';

const corpusPath = 'public/corpus.json';
const modelPath = 'public/research-model.json';
const auditPath = 'public/semantic-audit.json';
const data = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

const norm = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[^\x00-\x7F]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const stateTokens = (value = '') => ['SUPPORTED', 'PROVISIONAL', 'UNRESOLVED', 'REJECTED', 'DERIVATIVE']
  .filter(token => String(value).toUpperCase().includes(token));

const sourceIds = (value = '') => [...new Set((String(value).match(/\b[CWV]\d{3}\b/g) || []))];
const findSection = prefix => data.sections.find(s => !s.legacy && s.title.startsWith(prefix)) || data.sections.find(s => s.title.startsWith(prefix));
const asLocation = (section, block = null, row = null, column = null) => ({ section, block, row, column });

const people = (data.people || []).map(p => ({
  id: p.id,
  name: p.name,
  aliases: [...new Set(String(p.name).split(/\s*\/\s*|;|\bor\b/i).map(x => x.trim()).filter(Boolean))],
  branch: p.branch,
  dates: p.dates,
  role: p.role,
  state: p.state,
  stateTokens: stateTokens(p.state),
  living: Boolean(p.living),
  references: [...new Set(p.references || [])],
  sourceLocation: { section: p.section, row: p.row ?? null }
}));

const personById = new Map(people.map(p => [p.id, p]));
const personSearch = people.map(p => ({ p, tokens: [p.name, ...p.aliases].map(norm).filter(Boolean) }));

function peopleMentioned(text = '') {
  const haystack = ` ${norm(text)} `;
  return personSearch
    .filter(({ tokens }) => tokens.some(t => t.length >= 8 && haystack.includes(` ${t} `)))
    .map(({ p }) => p.id);
}

const claims = (data.claims || []).map(c => ({
  ...c,
  sourceIds: sourceIds(`${c.basis} ${c.nextAction}`),
  peopleIds: [...new Set(peopleMentioned(`${c.claim} ${c.basis} ${c.nextAction}`))],
  stateTokens: stateTokens(c.state),
  branchCode: /^CL-([A-Z]+)-/.exec(c.id)?.[1] || 'GEN'
}));

const claimById = new Map(claims.map(c => [c.id, c]));
const claimText = claims.map(c => ({ c, text: norm(`${c.claim} ${c.basis} ${c.nextAction}`) }));

const relationships = (data.relationships || []).map(r => {
  const from = personById.get(r.from);
  const to = personById.get(r.to);
  const names = [from?.name, to?.name].filter(Boolean).map(norm);
  const linkedClaims = new Set();
  if (r.source?.claimId && claimById.has(r.source.claimId)) linkedClaims.add(r.source.claimId);
  for (const { c, text } of claimText) {
    if (names.length === 2 && names.every(n => n.length >= 8 && text.includes(n))) linkedClaims.add(c.id);
  }
  const ids = sourceIds(`${r.source?.basis || ''} ${[...linkedClaims].map(id => claimById.get(id)?.basis || '').join(' ')}`);
  return {
    ...r,
    active: !String(r.state).toUpperCase().includes('REJECTED'),
    stateTokens: stateTokens(r.state),
    claimIds: [...linkedClaims],
    sourceIds: ids
  };
});

const sourceUsage = new Map();
for (const claim of claims) for (const id of claim.sourceIds) {
  if (!sourceUsage.has(id)) sourceUsage.set(id, { claimIds: new Set(), relationshipIds: new Set() });
  sourceUsage.get(id).claimIds.add(claim.id);
}
for (const rel of relationships) for (const id of rel.sourceIds) {
  if (!sourceUsage.has(id)) sourceUsage.set(id, { claimIds: new Set(), relationshipIds: new Set() });
  sourceUsage.get(id).relationshipIds.add(rel.id);
}

const sources = (data.sources || []).map(s => ({
  ...s,
  claimIds: [...(sourceUsage.get(s.id)?.claimIds || [])],
  relationshipIds: [...(sourceUsage.get(s.id)?.relationshipIds || [])]
}));

function classifyEvent(excerpt = '') {
  const t = norm(excerpt);
  const rules = [
    ['birth', /\bbirth\b|\bborn\b|\bb\s\d/],
    ['baptism', /\bbaptis|\bchristen/],
    ['marriage', /\bmarri|\bwedding|\bspouse/],
    ['census', /\bcensus\b|\bhousehold\b/],
    ['military', /\bmilitary\b|\bdraft\b|\benlist|\bveteran/],
    ['residence', /\bresiden|\baddress\b|\bdirectory\b/],
    ['death', /\bdeath\b|\bdied\b|\bdeceased\b/],
    ['burial', /\bburial\b|\bcemetery\b|\binterment\b/],
    ['immigration', /\bimmigra|\bemigra|\bnaturaliz|\barrival\b/]
  ];
  return rules.find(([, rx]) => rx.test(t))?.[0] || 'record';
}

const events = (data.events || []).map(e => ({
  ...e,
  displayType: classifyEvent(e.excerpt),
  displayTypeIsDerived: true,
  peopleIds: [...new Set(peopleMentioned(e.excerpt))],
  sourceIds: sourceIds(e.excerpt),
  stateTokens: stateTokens(e.state)
}));

function firstTable(section) {
  return section?.blocks?.find(b => b.type === 'table') || null;
}

const researchSection = findSection('17.');
const researchTable = firstTable(researchSection);
const researchTasks = researchTable ? researchTable.rows.slice(1).map((r, index) => ({
  id: `RQ-${String(index + 1).padStart(3, '0')}`,
  priority: r[0] || '',
  record: r[1] || '',
  branch: r[2] || '',
  payoff: r[3] || '',
  state: /CRITICAL/i.test(r[0] || '') ? 'CRITICAL' : /HIGH/i.test(r[0] || '') ? 'HIGH' : /MEDIUM/i.test(r[0] || '') ? 'MEDIUM' : 'QUEUE',
  sourceLocation: asLocation(researchSection.id, null, index + 1),
  peopleIds: [...new Set(peopleMentioned(r.join(' | ')))]
})) : [];

const acquisitionSequences = ['18.1', '18.2'].flatMap(prefix => {
  const section = findSection(prefix);
  const table = firstTable(section);
  if (!section || !table) return [];
  return table.rows.slice(1).map((r, index) => ({
    id: `SEQ-${prefix.replace('.', '')}-${String(index + 1).padStart(2, '0')}`,
    sequence: section.title,
    order: r[0] || String(index + 1),
    record: r[1] || '',
    purpose: r[2] || '',
    sourceLocation: asLocation(section.id, null, index + 1)
  }));
});

const stopSection = findSection('18.3');
const stopTable = firstTable(stopSection);
const stopRules = stopTable ? stopTable.rows.slice(1).map((r, index) => ({
  id: `STOP-${String(index + 1).padStart(2, '0')}`,
  line: r[0] || '',
  rule: r[1] || '',
  sourceLocation: asLocation(stopSection.id, null, index + 1)
})) : [];

const negativeSection = findSection('13.');
const negativeTable = firstTable(negativeSection);
const negativeSearches = negativeTable ? negativeTable.rows.slice(1).map((r, index) => ({
  id: `NEG-${String(index + 1).padStart(3, '0')}`,
  target: r[0] || '',
  result: r[1] || '',
  nextAction: r[2] || '',
  sourceLocation: asLocation(negativeSection.id, null, index + 1)
})) : [];

const gatesSection = findSection('22.');
const gatesTable = firstTable(gatesSection);
const completenessGates = gatesTable ? gatesTable.rows.slice(1).map((r, index) => ({
  id: `GATE-${String(index + 1).padStart(2, '0')}`,
  gate: r[0] || '',
  passCondition: r[1] || '',
  status: 'DEFINED — NOT AUTOMATICALLY SCORED',
  sourceLocation: asLocation(gatesSection.id, null, index + 1)
})) : [];

const branchNames = [...new Set(people.flatMap(p => String(p.branch || '').split('/').map(x => x.trim()).filter(Boolean)))].sort();
const branchSummaries = branchNames.map(name => ({
  id: `BR-${norm(name).replace(/ /g, '-').toUpperCase()}`,
  name,
  peopleIds: people.filter(p => norm(p.branch).includes(norm(name))).map(p => p.id),
  claimIds: claims.filter(c => norm(`${c.claim} ${c.basis} ${c.nextAction}`).includes(norm(name))).map(c => c.id),
  taskIds: researchTasks.filter(t => norm(`${t.branch} ${t.record}`).includes(norm(name))).map(t => t.id)
}));

const finalCertification = data.sections.find(s => s.title.startsWith('25. v10 Final Single-Source Certification'));
const identityBridge = relationships.find(r => r.type === 'identity-bridge');
const sourceSet = new Set(sources.map(s => s.id));
const relationshipOrphans = relationships.filter(r => !personById.has(r.from) || !personById.has(r.to)).map(r => r.id);
const unresolvedSourceRefs = claims.flatMap(c => c.sourceIds.filter(id => !sourceSet.has(id)).map(id => ({ claimId: c.id, sourceId: id })));
const livingLeaks = people.filter(p => p.living && /\b(?:19|20)\d{2}\b/.test(p.dates || '')).map(p => p.id);
const rejectedActive = relationships.filter(r => String(r.state).toUpperCase().includes('REJECTED') && r.active).map(r => r.id);

const checks = [
  { id: 'AUD-001', label: 'Appendix F person inventory preserved', pass: people.length === Number(data.meta?.people || people.length), detail: `${people.length} structured people / identities` },
  { id: 'AUD-002', label: 'Relationship endpoints resolve', pass: relationshipOrphans.length === 0, detail: relationshipOrphans.length ? relationshipOrphans.join(', ') : 'All endpoints resolve to stable person IDs' },
  { id: 'AUD-003', label: 'Rejected relationships excluded from active graph', pass: rejectedActive.length === 0, detail: rejectedActive.length ? rejectedActive.join(', ') : 'No rejected relationship is active' },
  { id: 'AUD-004', label: 'DeVine/Rahe bridge remains unresolved and separate', pass: Boolean(identityBridge) && String(identityBridge.state).toUpperCase().includes('UNRESOLVED') && identityBridge.from !== identityBridge.to, detail: identityBridge ? `${identityBridge.from} ↔ ${identityBridge.to}: ${identityBridge.state}` : 'Identity bridge missing' },
  { id: 'AUD-005', label: 'v10 final certification remains canonical/control', pass: Boolean(finalCertification) && !finalCertification.legacy, detail: finalCertification ? `${finalCertification.id} legacy=${finalCertification.legacy}` : 'Final certification section missing' },
  { id: 'AUD-006', label: 'Living-person person-card dates are withheld', pass: livingLeaks.length === 0, detail: livingLeaks.length ? livingLeaks.join(', ') : 'No living person date field contains a year' },
  { id: 'AUD-007', label: 'Claim source IDs resolve to canonical/verified source register', pass: unresolvedSourceRefs.length === 0, detail: unresolvedSourceRefs.length ? `${unresolvedSourceRefs.length} unresolved source-ID reference(s); retained for audit` : 'All explicit C/W/V IDs resolve' },
  { id: 'AUD-008', label: 'Every structured relationship retains a source section', pass: relationships.every(r => Boolean(r.source?.section)), detail: `${relationships.filter(r => r.source?.section).length}/${relationships.length} relationships carry source section IDs` }
];

const audit = {
  version: 11,
  sourceSha256: data.meta?.sha256 || '',
  generatedFrom: 'public/corpus.json',
  pass: checks.every(c => c.pass),
  checks,
  exceptions: {
    orphanPeople: people.filter(p => !relationships.some(r => r.from === p.id || r.to === p.id)).map(p => p.id),
    unresolvedSourceRefs,
    relationshipOrphans,
    livingLeaks,
    rejectedActive
  }
};

const model = {
  meta: {
    version: 11,
    title: 'Rahe Family Research Workbench',
    sourceSha256: data.meta?.sha256 || '',
    sourceTitle: data.meta?.title || '',
    researchState: '10 September 2026',
    evidencePolicy: 'Evidence states are source-controlled. Derived display classifications never promote claims.',
    counts: {
      people: people.length,
      relationships: relationships.length,
      claims: claims.length,
      sources: sources.length,
      events: events.length,
      researchTasks: researchTasks.length,
      negativeSearches: negativeSearches.length,
      completenessGates: completenessGates.length
    }
  },
  people,
  relationships,
  claims,
  sources,
  events,
  researchTasks,
  acquisitionSequences,
  stopRules,
  negativeSearches,
  completenessGates,
  branchSummaries,
  audit
};

fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
console.log(JSON.stringify({ version: 11, ...model.meta.counts, auditPass: audit.pass }, null, 2));
