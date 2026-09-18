import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('v19.4 narrates the existing evidence-qualified relationship path without new genealogy inference',async()=>{
  const runtime=await read('src/features/tree/relationship-path.js');
  assert.match(runtime,/findRelationshipPath/);
  assert.match(runtime,/includeContext:true,maxHops:32/);
  assert.match(runtime,/relationship-path-card/);
  assert.match(runtime,/relationship-path-step/);
  assert.match(runtime,/hop\.label/);
  assert.match(runtime,/hop\.evidenceState/);
  assert.doesNotMatch(runtime,/\.state\s*=/);
  assert.doesNotMatch(runtime,/living\s*=/);
});

test('v19.4 visually distinguishes path endpoints and controlling evidence states',async()=>{
  const runtime=await read('src/features/tree/relationship-path.js');
  const css=await read('src/styles/experience.css');
  assert.match(runtime,/tree-path-start/);
  assert.match(runtime,/tree-path-middle/);
  assert.match(runtime,/tree-path-end/);
  for(const state of['supported','provisional','unresolved','rejected'])assert.match(css,new RegExp(`tree-path-segment-${state}`));
  assert.match(css,/--evidence-supported/);
  assert.match(css,/--evidence-provisional/);
  assert.match(css,/--evidence-unresolved/);
});

test('v19.4 path narration is privacy-minimal responsive and accessible',async()=>{
  const runtime=await read('src/features/tree/relationship-path.js');
  const css=await read('src/styles/experience.css');
  assert.match(runtime,/aria-label/);
  assert.match(runtime,/aria-live/);
  assert.match(runtime,/personById\(id\)\?\.name/);
  assert.doesNotMatch(runtime,/\?\.\s*(?:birth|birthDate|birthYear|location|address|streetAddress|homeAddress)\b/);
  assert.doesNotMatch(runtime,/\[(?:'|")(?:birth|birthDate|birthYear|location|address|streetAddress|homeAddress)(?:'|")\]/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/prefers-reduced-motion/);
});
