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
const styleRoot=read('src/styles/index.css');
const tokens=read('src/styles/tokens.css');
const compositions=['base-composition.css','shell-composition.css','home-composition.css','person-composition.css','people-composition.css','tree-composition.css','responsive-composition.css'].map(name=>read(`src/styles/${name}`)).join('\n');
const homeEditorial=read('src/styles/home-editorial.css');
const model=json('public/research-model.json');
const graph=json('public/canonical-graph.json');
const diff=json('public/canonical-diff.json');
const completeness=json('public/canonical-completeness.json');
const retirement=json('public/css-retirement-report.json');

const releaseOf=(text,pattern)=>{const m=text.match(pattern);assert.ok(m,'release fingerprint missing');return m[1];};

test('v18 release fingerprints are synchronized',()=>{
  const versions=[
    releaseOf(entry,/APP_VERSION='(\d+\.\d+\.\d+)'/),
    releaseOf(build,/const appVersion='(\d+\.\d+\.\d+)'/),
    releaseOf(shell,/data-ui-release="(\d+\.\d+\.\d+)"/),
    releaseOf(experience,/UI_RELEASE='(\d+\.\d+\.\d+)'/)
  ];
  assert.deepEqual(new Set(versions),new Set(['18.5.0']));
  assert.match(shell,/styles\.css\?v=18\.5\.0/);
  assert.match(shell,/app\.bundle\.js\?v=18\.5\.0/);
  assert.match(experience,/family\.archive\.uiReload\.v18\.5/);
  assert.match(build,/releaseTrain:'v18-5-research-intelligence'/);
});

test('semantic design system owns stylesheet composition with zero compatibility sources',()=>{
  assert.doesNotMatch(styleRoot,/legacy-compat\.generated\.css/);
  assert.doesNotMatch(styleRoot,/redesign-fixes\.css/);
  assert.doesNotMatch(styleRoot,/@import ['"](?:\.\.\/)*?(?:v\d|dashboard-v\d|media-page-v\d|experience-v\d|platform-v\d)/);
  for(const semantic of['tokens.css','base.css','shell.css','navigation.css','home.css','home-editorial.css','people.css','person.css','tree.css','media.css','research.css','record-ingestion.css','mobile-family.css','responsive.css']){
    assert.match(styleRoot,new RegExp(`@import '\\.\\/${semantic.replace('.','\\.')}';`));
  }
  assert.equal(fs.existsSync('src/styles/redesign-fixes.css'),false,'post-cascade redesign fix layer must stay retired');
  assert.match(homeEditorial,/\.v17-home-hero h2/);
  assert.match(homeEditorial,/\.v17-home-hero \.v17-home-metrics/);
  assert.match(build,/const legacyStyleSources=\[\]/);
  assert.match(build,/const generatedLegacyStyle=null/);
  assert.match(build,/compatibilityBoundary:null/);
  assert.match(build,/legacySourceCount:0/);
  assert.equal(retirement.retiredFiles,33);
  assert.equal(retirement.originalSelectorArms,2717);
  assert.equal(retirement.migratedSelectorArms,2698);
  assert.equal(retirement.prunedSelectorArms,19);
  const retired=['v11.css','v11-nav.css','v11-2.css','v11-3.css','v11-4.css','v11-6.css','v12.css','v12-2.css','v12-3.css','v12-4.css','v12-5.css','v12-6.css','v12-6-1.css','v12-6-2.css','v12-7.css','v12-8.css','v12-9.css','v12-9-1.css','v13-0.css','dashboard-v13-2.css','media-page-v13-4.css','experience-v13-5.css','v14.css','v15.css','v15-1.css','v15-family-focus.css','platform-v13.css','v15-5.css','v15-6.css','v15-8.css','src/styles/v16.css','src/styles/v16-1.css','src/styles/v16-2.css'];
  for(const file of retired)assert.equal(fs.existsSync(file),false,`${file} must stay retired`);
});

test('tokens.css is the single-source owner of active Family design tokens',()=>{
  assert.match(tokens,/Family design system — single-source tokens/);
  assert.match(tokens,/--family-font-display:"Iowan Old Style"/);
  assert.match(tokens,/--family-radius-panel:24px/);
  assert.match(tokens,/--family-shadow-card:0 1px 1px/);
  assert.match(tokens,/--evidence-provisional:#a8762b/);
  assert.match(tokens,/--evidence-unresolved:#963f39/);
  assert.match(tokens,/--evidence-rejected:#77766f/);
  assert.match(tokens,/--green2:#275a4a/);

  const migratedSpacing={
    '--space-1':'4px','--space-2':'8px','--space-3':'12px','--space-4':'16px',
    '--space-5':'24px','--space-6':'32px','--space-7':'48px','--space-8':'64px'
  };
  for(const [name,value] of Object.entries(migratedSpacing)){
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    assert.match(tokens,new RegExp(`${escaped}:${value.replace('.', '\\.')}[;}]`),`${name} must preserve its independent historical value`);
  }
  assert.doesNotMatch(tokens,/--space-[1-8]:var\(--family-space-/,'migrated spacing tokens must not become aliases whose values can drift under scoped Family overrides');

  const unique=[
    '--bg','--paper','--surface','--ink','--text','--muted','--green','--green-2','--line','--focus','--danger',
    '--family-bg','--family-surface','--family-ink','--family-green','--family-green-2','--family-accent',
    '--family-font-display','--family-font-ui','--family-radius-panel','--family-radius-card','--family-radius-control',
    '--family-shadow-card','--family-shadow-card-hover','--family-shadow-float','--family-motion-fast','--family-motion-normal',
    '--evidence-supported','--evidence-provisional','--evidence-unresolved','--evidence-rejected','--v16-text-meta',
    ...Object.keys(migratedSpacing)
  ];
  for(const name of unique){
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    assert.equal((tokens.match(new RegExp(`${escaped}\\s*:`, 'g'))||[]).length,1,`${name} must have exactly one base declaration`);
  }

  assert.doesNotMatch(compositions,/--[a-z0-9-]+\s*:/i,'composition files must consume tokens instead of declaring custom properties');
  assert.doesNotMatch(compositions,/:root\s*\{/,'composition files must not own root design tokens');
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
