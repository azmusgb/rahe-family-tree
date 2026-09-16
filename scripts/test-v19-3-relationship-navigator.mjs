import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('v19.3 relationship targets come from the explicit connected family graph',async()=>{
  const runtime=await read('src/runtime/family-graph-navigation.js');
  assert.match(runtime,/connectedComponent/);
  assert.match(runtime,/usableRelationships/);
  assert.match(runtime,/FAMILY_TYPES=new Set\(\['parent-child','direct-line-succession','spouse'\]\)/);
  assert.match(runtime,/includeContext:false/);
  assert.match(runtime,/relationshipTargets\(focus\)/);
});

test('v19.3 reveals selected connected targets outside the current rendered scope',async()=>{
  const runtime=await read('src/runtime/family-graph-navigation.js');
  assert.match(runtime,/function revealRelationshipTarget\(target\)/);
  assert.match(runtime,/if\(renderedIds\(\)\.has\(target\)\)\{replaceState\(\{pathTo:target\}\)/);
  assert.match(runtime,/searchParams\.set\('scope','connected'\)/);
  assert.match(runtime,/for\(const key of\['q','branch','state'\]\)url\.searchParams\.delete\(key\)/);
  assert.match(runtime,/localStorage\.setItem\(COLLAPSE_KEY,'\[\]'\)/);
  assert.match(runtime,/outside this view will open Connected and reveal the path/);
  assert.match(runtime,/aria-describedby="family-graph-relationship-help"/);
});

test('v19.3 navigation remains presentation-only and privacy-neutral',async()=>{
  const runtime=await read('src/runtime/family-graph-navigation.js');
  assert.doesNotMatch(runtime,/model\./);
  assert.doesNotMatch(runtime,/\.state\s*=/);
  assert.doesNotMatch(runtime,/living\s*=/);
  assert.match(runtime,/history\.replaceState/);
  assert.match(runtime,/HashChangeEvent/);
});

test('v19.3 relationship panel remains mobile and keyboard accessible',async()=>{
  const css=await read('src/styles/experience.css');
  assert.match(css,/family-graph-relationship-help/);
  assert.match(css,/family-graph-relationship-panel select\{width:100%;max-width:none;min-height:44px\}/);
  assert.match(css,/focus-visible/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/prefers-reduced-motion/);
});
