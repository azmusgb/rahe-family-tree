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
const atLeast=(version,major,minor)=>{const[a,b]=version.split('.').map(Number);return a>major||(a===major&&b>=minor);};

test('v18 canonical-platform release fingerprints remain synchronized',()=>{
  const versions=[
    releaseOf(entry,/APP_VERSION='(\d+\.\d+\.\d+)'/),
    releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/),
    releaseOf(shell,/data-ui-release="(\d+\.\d+\.\d+)"/),
    releaseOf(experience,/UI_RELEASE='(\d+\.\d+\.\d+)'/)
  ];
  assert.equal(new Set(versions).size,1);
  const version=versions[0];assert.ok(atLeast(version,18,0));
  const escaped=version.replaceAll('.','\\.');
  assert.match(shell,new RegExp(`styles\\.css\\?v=${escaped}`));
  assert.match(shell,new RegExp(`app\\.bundle\\.js\\?v=${escaped}`));
  const[major,minor]=version.split('.').map(Number);assert.match(experience,new RegExp(`family\\.archive\\.uiReload\\.v${major}\\.${minor}`));
  assert.match(build,/releaseTrain:'v18(?:-canonical-platform|-5-research-automation)'/);
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
  const rejected=relationships.filter(r=>/REJECTED/i.test(String(r.state||r.evidenceState||'')));
  assert.ok(rejected.every(r=>r.active===false&&r.activePedigree!==true),'any rejected relationships present must remain inactive');
  assert.ok(Number(completeness.counts?.conflicts||0)>0,'conflict/rejection history must remain represented by the canonical completeness model');
  assert.ok((model.researchTasks||[]).length>0,'research queue must remain populated');
  assert.ok((model.sources||[]).length>0,'source registry must remain populated');
});
