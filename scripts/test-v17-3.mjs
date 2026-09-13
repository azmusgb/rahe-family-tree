import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience-core.js','utf8');
const experienceRoot=fs.readFileSync('src/runtime/experience.js','utf8');
const personRuntime=fs.readFileSync('src/runtime/person-experience-v17-3.js','utf8');
const personCss=fs.readFileSync('src/styles/person.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v17.3 release fingerprints are synchronized for production output',()=>{
  assert.match(entry,/APP_VERSION='17\.3\.0'/);
  assert.match(experience,/UI_RELEASE='17\.3\.0'/);
  assert.match(experience,/family\.archive\.uiReload\.v17\.3/);
  assert.match(build,/const appVersion='17\.3\.0'/);
  assert.match(build,/shell\.replaceAll\('17\.2\.0',appVersion\)/);
});

test('Person experience is loaded behind the stable Family experience boundary',()=>{
  assert.match(experienceRoot,/person-experience-v17-3\.js/);
  assert.match(personRuntime,/family-person-v17-3-ready/);
  assert.match(personRuntime,/routePersonId/);
  assert.match(personRuntime,/isFamily/);
});

test('historical profiles lead with a source-backed life story',()=>{
  assert.match(personRuntime,/function supportedMoments\(person,limit=4\)/);
  assert.match(personRuntime,/person\.living\)return\[\]/);
  assert.match(personRuntime,/eventState\(event\)==='SUPPORTED'/);
  assert.match(personRuntime,/A life in the family record/);
  assert.match(personRuntime,/v173-story-moment/);
  assert.match(personRuntime,/Selected supported moments from the source-controlled archive/);
});

test('living profiles use privacy-safe story framing without chronology cards',()=>{
  assert.match(personRuntime,/Part of the living family/);
  assert.match(personRuntime,/private chronology and location details protected/);
  assert.match(personRuntime,/if\(person\.living\)return/);
});

test('research evidence is progressively disclosed rather than dominating Family profiles',()=>{
  assert.match(personRuntime,/v173-research-details/);
  assert.match(personRuntime,/See the records behind this person/);
  assert.match(personRuntime,/document\.createElement\('details'\)/);
  assert.match(personCss,/\.v173-research-details/);
  assert.match(personCss,/\.v173-research-body/);
});

test('v17.3 Person styling creates editorial hierarchy and mobile-safe text',()=>{
  assert.match(personCss,/\.v173-person-story/);
  assert.match(personCss,/grid-template-columns:minmax\(220px,.72fr\)/);
  assert.match(personCss,/\.v173-story-moment span\{[^}]*font-size:11px/);
  assert.match(personCss,/\.v17-life-event>div>span\{[^}]*font-size:11px/);
  assert.match(personCss,/@media\(max-width:720px\)/);
  assert.match(personCss,/min-height:56px/);
});

test('v17.3 presentation preserves canonical genealogy and evidence states',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(rel=>rel.type==='identity-bridge');
  assert.ok(bridge,'identity bridge must remain present');
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.notEqual(bridge.type,'parent-child');
  assert.ok((model.relationships||[]).filter(rel=>/REJECTED/i.test(String(rel.state||''))).every(rel=>rel.active===false));
  assert.doesNotMatch(personRuntime,/relationships?\.push/);
  assert.doesNotMatch(personRuntime,/claims?\.push/);
  assert.doesNotMatch(personRuntime,/\.state\s*=\s*[^=]/);
});
