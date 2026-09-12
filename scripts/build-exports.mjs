import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(PUBLIC, 'exports');
const corpusPath = path.join(PUBLIC, 'corpus.json');
const modelPath = path.join(PUBLIC, 'research-model.json');
const graphPath = path.join(PUBLIC, 'canonical-graph.json');

for (const required of [corpusPath, modelPath, graphPath]) {
  if (!fs.existsSync(required)) throw new Error(`Required export input is missing: ${path.relative(ROOT, required)}`);
}

const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

fs.mkdirSync(OUT, { recursive: true });

const CONTROL_STATES = ['SUPPORTED', 'PROVISIONAL', 'UNRESOLVED', 'REJECTED'];
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const escCsv = value => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const csv = (headers, rows) => [headers, ...rows].map(row => row.map(escCsv).join(',')).join('\n') + '\n';
const xml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[ch]);
const uniq = values => [...new Set(values.filter(Boolean))];
const stateOf = value => {
  const text = String(value?.controllingState || value?.state || value?.evidenceState || '').toUpperCase();
  return CONTROL_STATES.find(state => text.includes(state)) || 'UNRESOLVED';
};

const people = [...(model.people || []), ...(model.familySupplement?.people || [])];
const relationships = [...(model.relationships || []), ...(model.familySupplement?.relationships || []), ...(model.contextRelationships || [])];
const peopleById = new Map(people.map(person => [person.id, person]));

const publicLeak = people.filter(person => person.living && /\b(?:19|20)\d{2}\b/.test(String(person.dates || '')));
if (publicLeak.length) {
  throw new Error(`Export blocked: living-person year exposure in ${publicLeak.map(person => person.id).join(', ')}`);
}

const identityBridge = relationships.filter(rel => rel.type === 'identity-bridge');
if (!identityBridge.length || identityBridge.some(rel => stateOf(rel) !== 'UNRESOLVED' || rel.activePedigree)) {
  throw new Error('Export blocked: identity bridge must remain unresolved and outside the active pedigree.');
}

const canonicalJson = {
  schemaVersion: '16.0-export-1',
  authority: 'PUBLIC-SAFE EXPORT OF THE STRUCTURED CANONICAL RESEARCH MODEL. THIS EXPORT DOES NOT PROMOTE EVIDENCE.',
  controllingStates: CONTROL_STATES,
  generatedFrom: {
    corpusVersion: corpus.version || corpus.schemaVersion || null,
    modelVersion: model.version || model.schemaVersion || model.platform?.version || null,
    graphVersion: graph.schemaVersion || null
  },
  people,
  relationships,
  familyGroups: [...(model.familyGroups || []), ...(model.familySupplement?.familyGroups || [])],
  claims: model.claims || [],
  sources: model.sources || [],
  conflicts: model.conflicts || [],
  negativeSearches: model.negativeSearches || [],
  researchTasks: model.researchTasks || [],
  normalizedEvents: model.normalizedEvents || [],
  geography: model.geography || null,
  households: model.households || null,
  canonicalGraph: graph
};

const personRows = people.map(person => [
  person.id,
  person.name,
  person.branch || '',
  person.dates || '',
  person.role || '',
  stateOf(person),
  person.strength || person.evidenceStrength || '',
  person.living ? 'true' : 'false',
  person.provenance ? 'SUPPLEMENT' : 'CANONICAL'
]);

const relationshipRows = relationships.map(rel => [
  rel.id,
  rel.type || '',
  rel.from || '',
  peopleById.get(rel.from)?.name || '',
  rel.to || '',
  peopleById.get(rel.to)?.name || '',
  stateOf(rel),
  rel.strength || rel.evidenceStrength || '',
  rel.active === false ? 'false' : 'true',
  rel.activePedigree ? 'true' : 'false',
  (rel.sourceIds || []).join('|')
]);

const claimRows = (model.claims || []).map(claim => [
  claim.id,
  claim.claim || '',
  stateOf(claim),
  claim.strength || claim.evidenceStrength || '',
  (claim.sourceIds || []).join('|'),
  (claim.peopleIds || []).join('|'),
  claim.basis || '',
  claim.nextAction || ''
]);

const sourceRows = (model.sources || []).map(source => [
  source.id,
  source.name || source.title || '',
  source.class || source.type || '',
  source.weight || source.control || '',
  (source.legacyIds || source.legacyId || []).toString(),
  source.url || source.persistentId || ''
]);

function gedcomName(name) {
  const text = String(name || '').replace(/[\r\n]+/g, ' ').trim();
  return text || 'Unknown';
}

function buildGedcom() {
  const lines = [
    '0 HEAD',
    '1 SOUR RAHE-FAMILY-TREE',
    '1 GEDC',
    '2 VERS 5.5.1',
    '2 FORM LINEAGE-LINKED',
    '1 CHAR UTF-8',
    '1 NOTE Public-safe export. Only SUPPORTED active pedigree relationships are encoded as GEDCOM family links.',
    '1 NOTE Qualified/unresolved/rejected assertions remain available in JSON, CSV, and GraphML exports and are not silently promoted.'
  ];

  const personXref = new Map(people.map((person, index) => [person.id, `@I${index + 1}@`]));
  for (const person of people) {
    lines.push(`0 ${personXref.get(person.id)} INDI`);
    lines.push(`1 NAME ${gedcomName(person.name)}`);
    lines.push(`1 _CANONID ${person.id}`);
    lines.push(`1 _STATE ${stateOf(person)}`);
    if (person.branch) lines.push(`1 _BRANCH ${String(person.branch).replace(/[\r\n]+/g, ' ')}`);
    if (person.dates) lines.push(`1 NOTE Display dates/lead: ${String(person.dates).replace(/[\r\n]+/g, ' ')}`);
    if (person.living) lines.push('1 RESN privacy');
  }

  const supported = relationships.filter(rel =>
    stateOf(rel) === 'SUPPORTED' &&
    rel.active !== false &&
    rel.activePedigree !== false &&
    ['parent-child', 'spouse'].includes(rel.type) &&
    peopleById.has(rel.from) && peopleById.has(rel.to)
  );

  const spouses = supported.filter(rel => rel.type === 'spouse');
  const parents = supported.filter(rel => rel.type === 'parent-child');
  const families = [];
  const familyByPair = new Map();

  for (const rel of spouses) {
    const pair = [rel.from, rel.to].sort();
    const key = pair.join('|');
    const family = { id: `@F${families.length + 1}@`, spouses: pair, children: [], relationshipIds: [rel.id] };
    families.push(family);
    familyByPair.set(key, family);
  }

  for (const rel of parents) {
    let family = families.find(candidate => candidate.spouses.includes(rel.from) && candidate.children.includes(rel.to));
    if (!family) {
      family = families.find(candidate => candidate.spouses.includes(rel.from));
    }
    if (!family) {
      family = { id: `@F${families.length + 1}@`, spouses: [rel.from], children: [], relationshipIds: [] };
      families.push(family);
    }
    if (!family.children.includes(rel.to)) family.children.push(rel.to);
    family.relationshipIds.push(rel.id);
  }

  for (const family of families) {
    lines.push(`0 ${family.id} FAM`);
    if (family.spouses[0]) lines.push(`1 HUSB ${personXref.get(family.spouses[0])}`);
    if (family.spouses[1]) lines.push(`1 WIFE ${personXref.get(family.spouses[1])}`);
    for (const child of family.children) lines.push(`1 CHIL ${personXref.get(child)}`);
    lines.push('1 _STATE SUPPORTED');
    lines.push(`1 NOTE Canonical relationship IDs: ${uniq(family.relationshipIds).join(', ')}`);
  }

  lines.push('0 TRLR');
  return lines.join('\n') + '\n';
}

function buildGraphMl() {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n` +
    `  <key id="kind" for="node" attr.name="kind" attr.type="string"/>\n` +
    `  <key id="label" for="node" attr.name="label" attr.type="string"/>\n` +
    `  <key id="state" for="all" attr.name="evidenceState" attr.type="string"/>\n` +
    `  <key id="edgeType" for="edge" attr.name="type" attr.type="string"/>\n` +
    `  <key id="active" for="edge" attr.name="active" attr.type="boolean"/>\n` +
    `  <graph id="rahe-canonical" edgedefault="directed">\n` +
    nodes.map(node => `    <node id="${xml(node.id)}"><data key="kind">${xml(node.kind)}</data><data key="label">${xml(node.label)}</data><data key="state">${xml(node.state || 'UNRESOLVED')}</data></node>`).join('\n') + '\n' +
    edges.map(edge => `    <edge id="${xml(edge.id)}" source="${xml(edge.from)}" target="${xml(edge.to)}"><data key="edgeType">${xml(edge.type)}</data><data key="state">${xml(edge.evidenceState || 'UNRESOLVED')}</data><data key="active">${edge.active === false ? 'false' : 'true'}</data></edge>`).join('\n') + '\n' +
    `  </graph>\n</graphml>\n`;
}

const files = new Map();
files.set('canonical-export.json', JSON.stringify(canonicalJson, null, 2) + '\n');
files.set('people.csv', csv(['id', 'name', 'branch', 'dates_or_lead', 'role', 'controlling_state', 'strength', 'living', 'layer'], personRows));
files.set('relationships.csv', csv(['id', 'type', 'from_id', 'from_name', 'to_id', 'to_name', 'controlling_state', 'strength', 'active', 'active_pedigree', 'source_ids'], relationshipRows));
files.set('claims.csv', csv(['id', 'claim', 'controlling_state', 'strength', 'source_ids', 'people_ids', 'basis', 'next_action'], claimRows));
files.set('sources.csv', csv(['id', 'name', 'class_or_type', 'weight_or_control', 'legacy_ids', 'url_or_persistent_id'], sourceRows));
files.set('family-tree.ged', buildGedcom());
files.set('canonical-graph.graphml', buildGraphMl());

const manifest = {
  exportVersion: '16.0-export-1',
  authority: 'PUBLIC-SAFE, EVIDENCE-AWARE EXPORT. THE CONTROLLING v10 DOSSIER REMAINS AUTHORITATIVE.',
  privacy: 'Living-person birth details are withheld. Export generation fails if a public living-person year is detected.',
  gedcomRule: 'GEDCOM encodes only SUPPORTED active pedigree parent-child/spouse relationships. Other states remain in JSON/CSV/GraphML.',
  identityBridgeRule: 'Edward Ellery DeVine/DeVeine and William John Rahe Sr. remain separate nodes joined only by an UNRESOLVED identity bridge outside the active pedigree.',
  counts: {
    people: people.length,
    relationships: relationships.length,
    claims: (model.claims || []).length,
    sources: (model.sources || []).length,
    graphNodes: (graph.nodes || []).length,
    graphEdges: (graph.edges || []).length
  },
  files: [...files.entries()].map(([name, content]) => ({ name, bytes: Buffer.byteLength(content), sha256: sha256(content) }))
};
files.set('manifest.json', JSON.stringify(manifest, null, 2) + '\n');

for (const [name, content] of files) fs.writeFileSync(path.join(OUT, name), content);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const fixedTime = 0;
  const fixedDate = 33; // 1980-01-01

  for (const [name, text] of entries) {
    const data = Buffer.from(text, 'utf8');
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(fixedTime, 10);
    local.writeUInt16LE(fixedDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(fixedTime, 12);
    central.writeUInt16LE(fixedDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuf);

    offset += local.length + nameBuf.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

const zipEntries = [...files.entries()].sort(([a], [b]) => a.localeCompare(b));
fs.writeFileSync(path.join(OUT, 'rahe-family-tree-canonical-export.zip'), zipStore(zipEntries));

const index = {
  ...manifest,
  archive: {
    name: 'rahe-family-tree-canonical-export.zip',
    bytes: fs.statSync(path.join(OUT, 'rahe-family-tree-canonical-export.zip')).size,
    sha256: sha256(fs.readFileSync(path.join(OUT, 'rahe-family-tree-canonical-export.zip')))
  }
};
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');

console.log(`Built evidence-aware export package: ${index.counts.people} people, ${index.counts.relationships} relationships, ${index.counts.claims} claims, ${index.counts.sources} sources.`);
