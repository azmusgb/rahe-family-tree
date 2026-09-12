import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'exports');
const read = name => fs.readFileSync(path.join(OUT, name));
const readText = name => read(name).toString('utf8');

const required = [
  'index.json',
  'manifest.json',
  'canonical-export.json',
  'people.csv',
  'relationships.csv',
  'claims.csv',
  'sources.csv',
  'family-tree.ged',
  'canonical-graph.graphml',
  'rahe-family-tree-canonical-export.zip'
];

test('canonical export bundle contains every required format', () => {
  for (const name of required) assert.equal(fs.existsSync(path.join(OUT, name)), true, `${name} should exist`);
});

test('export manifest is evidence-aware and populated', () => {
  const index = JSON.parse(readText('index.json'));
  assert.equal(index.exportVersion, '16.0-export-1');
  assert.ok(index.counts.people > 0);
  assert.ok(index.counts.relationships > 0);
  assert.ok(index.counts.claims > 0);
  assert.ok(index.counts.sources > 0);
  assert.match(index.identityBridgeRule, /remain separate nodes/i);
  assert.match(index.gedcomRule, /only SUPPORTED active pedigree/i);
  assert.equal(index.files.length, 8);
  assert.ok(index.archive.bytes > 100);
  assert.match(index.archive.sha256, /^[a-f0-9]{64}$/);
});

test('canonical JSON preserves the unresolved DeVine/Rahe identity bridge', () => {
  const data = JSON.parse(readText('canonical-export.json'));
  const bridges = data.relationships.filter(rel => rel.type === 'identity-bridge');
  assert.ok(bridges.length > 0, 'identity bridge must be present');
  for (const bridge of bridges) {
    assert.match(String(bridge.state || bridge.evidenceState || ''), /UNRESOLVED/i);
    assert.notEqual(bridge.activePedigree, true);
  }

  const names = data.people.map(person => person.name);
  assert.ok(names.some(name => /Edward Ellery DeVine|Edward Ellery DeVeine/i.test(name)));
  assert.ok(names.some(name => /William John Rahe Sr/i.test(name)));
});

test('public export exposes no four-digit year for living people', () => {
  const data = JSON.parse(readText('canonical-export.json'));
  const leaked = data.people.filter(person => person.living && /\b(?:19|20)\d{2}\b/.test(String(person.dates || '')));
  assert.deepEqual(leaked.map(person => person.id), []);
});

test('GEDCOM never promotes unresolved or provisional assertions into family records', () => {
  const ged = readText('family-tree.ged');
  assert.match(ged, /^0 HEAD/m);
  assert.match(ged, /^0 TRLR/m);
  assert.match(ged, /Only SUPPORTED active pedigree relationships/i);
  assert.doesNotMatch(ged, /_STATE (?:PROVISIONAL|UNRESOLVED|REJECTED)\s*\n(?:1 (?:HUSB|WIFE|CHIL))/i);
});

test('GraphML preserves evidence-state metadata for the full graph', () => {
  const graphml = readText('canonical-graph.graphml');
  assert.match(graphml, /<graphml xmlns="http:\/\/graphml\.graphdrawing\.org\/xmlns">/);
  assert.match(graphml, /attr\.name="evidenceState"/);
  assert.match(graphml, /relationship:identity-bridge|identity-bridge/);
});

test('ZIP archive is a valid deterministic ZIP container', () => {
  const zip = read('rahe-family-tree-canonical-export.zip');
  assert.equal(zip.readUInt32LE(0), 0x04034b50, 'ZIP should start with local-file signature');
  assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054b50, 'ZIP should end with EOCD signature');
});
