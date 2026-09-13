import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const json=path=>JSON.parse(read(path));
const entry=read('app-entry.js');
const build=read('scripts/build.mjs');
const shell=read('index.html');
const experience=read('src/runtime/experience-core.js');
const platformUi=read('platform-v13-ui.js');
const platformRuntime=read('platform-v13-runtime.js');
const graphEngine=read('canonical-graph-engine.js');
const model=json('public/research-model.json');
const graph=json('public/canonical-graph.json');
const diff=json('public/canonical-diff.json');
const completeness=json('public/canonical-completeness.json');

const releaseOf=(text,pattern)=>{const m=text.match(pattern);assert.ok(m,'release fingerprint missing');return m[1];};

test('v18 release fingerprints are synchronized',()=>{
  const versions=[
    releaseOf(entry,/APP_VERSION='(\d+\.\d+\.\d+)'/),
    releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/),
    releaseOf(shell,/data-ui-release="(\d+\.\d+\.\d+)"/),
    releaseOf(experience,/UI_RELEASE='(\d+\.\d+\.\d+)'/)
  ];
  assert.deepEqual(new Set(versions),new Set(['18.0.0']));
  assert.match(shell,/styles\.css\?v=18\.0\.0/);
  assert.match(shell,/app\.bundle\.js\?v=18\.0\.0/);
  assert.match(experience,/family\.archive\.uiReload\.v18\.0/);
  assert.match(build,/releaseTrain:'v18-canonical-platform'/);
});

test('canonical platform surfaces remain wired into the runtime',()=>{
  for(const token of[
    'renderRelationshipFinder','renderCanonicalGraphAudit','renderResearchCommandCenterV2',
    'renderPersonPlatformPanel','renderSourceEvidenceMatrix','renderGeographyHouseholds'
  ])assert.match(platformRuntime,new RegExp(token));
  assert.match(platformRuntime,/platform-v13-ui\.js/);
  assert.match(platformUi,/CANONICAL GRAPH SCHEMA/);
  assert.match(platformUi,/RESEARCH COMMAND CENTER 2\.0/);
  assert.match(platformUi,/SOURCE → ASSERTION MATRIX/);
  assert.match(platformUi,/GEOGRAPHY INDEX/);
});

test('tree traversal and relationship finding remain evidence-aware',()=>{
  for(const fn of['usableRelationships','connectedComponent','ancestors','descendants','directLine','collateral','findRelationshipPath','pedigreeCycles','generationLanes'])assert.match(graphEngine,new RegExp(`export function ${fn}`));
  assert.match(graphEngine,/controllingState\(r\)==='REJECTED'/);
  assert.match(graphEngine,/identity-bridge/);
  assert.match(graphEngine,/UNRESOLVED/);
});

test('canonical completeness and graph integrity are release-blocking clean',()=>{
  assert.equal(graph.integrity?.pass,true);
  assert.equal(diff.hasCanonicalLoss,false);
  assert.equal(diff.hasEvidencePromotion,false);
  const failed=Array.isArray(completeness.failed)?completeness.failed:(completeness.checks||[]).filter(x=>x.pass!==true).map(x=>x.id);
  assert.deepEqual(failed,[]);
});

test('controlling evidence semantics preserve rejected and unresolved material',()=>{
  const relationships=[...(model.relationships||[]),...(model.contextRelationships||[])];
  const bridge=relationships.find(r=>r.type==='identity-bridge');
  assert.ok(bridge,'identity bridge must remain represented');
  assert.match(String(bridge.state||bridge.evidenceState||''),/UNRESOLVED/i);
  assert.notEqual(bridge.activePedigree,true);
  assert.ok((model.claims||[]).some(c=>/REJECTED/i.test(String(c.state||''))),'rejected claims must remain retained for audit');
  assert.ok((model.researchTasks||[]).length>0,'research queue must remain populated');
  assert.ok((model.sources||[]).length>0,'source registry must remain populated');
});
