import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('styles-v14.css','utf8');
const v14=fs.readFileSync('v14.css','utf8');
const familyRuntime=fs.readFileSync('v12-6.js','utf8');
const portraitRuntime=fs.readFileSync('v12-6-1.js','utf8');
const experience=fs.readFileSync('experience-v13-5.js','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v14 exposes one stylesheet entrypoint',()=>{
  assert.equal((index.match(/<link rel="stylesheet"/g)||[]).length,1);
  assert.match(index,/styles-v14\.css\?v=14\.0\.0/);
  assert.match(index,/FAMILY VIEW · v14\.0/);
  assert.match(entry,/@import url\("v11\.css"\)/);
  assert.match(entry,/@import url\("experience-v13-5\.css"\)/);
  assert.match(entry,/@import url\("v14\.css"\)/);
});

test('production build flattens the historical cascade into one css asset',()=>{
  assert.match(build,/const cssSources=/);
  assert.match(build,/dist\/styles-v14\.css/);
  assert.match(build,/cssParts\.join/);
  assert.match(build,/experience:'14\.0'/);
});

test('legacy family dashboard replacement is retired',()=>{
  assert.doesNotMatch(familyRuntime,/familyHome\(/);
  assert.doesNotMatch(familyRuntime,/family-home-hero/);
  assert.doesNotMatch(familyRuntime,/content\.innerHTML\s*=\s*familyHome/);
  assert.match(familyRuntime,/FAMILY VIEW · v14\.0/);
});

test('only the modern mobile dock is created',()=>{
  assert.doesNotMatch(portraitRuntime,/createElement\(['"]nav['"]\).*mobile-family-nav/);
  assert.match(portraitRuntime,/removeLegacyMobileNav/);
  assert.match(experience,/family-mobile-dock/);
  assert.match(experience,/Home<\/a>.*Tree<\/a>.*Search<\/button>.*People<\/a>.*Media<\/a>/s);
});

test('v14 family enhancements do not leak into research mode',()=>{
  assert.match(experience,/const isFamilyMode=/);
  assert.match(experience,/if\(!isFamilyMode\(\)\)\{dock\?\.remove\(\);return;\}/);
  assert.match(experience,/badge\.textContent=isFamilyMode\(\)\?'FAMILY VIEW · v14\.0':'RESEARCH MODE · v14\.0'/);
  assert.match(experience,/if\(!isFamilyMode\(\)\|\|routeKey\(\)!=='dashboard'\)return/);
});

test('v14 establishes coherent tokens typography and safe-area navigation',()=>{
  for(const token of['--space-4','--radius-md','--shadow-md','--mobile-nav-height'])assert.match(v14,new RegExp(token));
  assert.match(v14,/\.mobile-family-nav\{display:none!important\}/);
  assert.match(v14,/safe-area-inset-bottom/);
  assert.match(v14,/font-size:15px/);
  assert.match(v14,/body\.media-route:has\(#media-library \.empty\)/);
});

test('v14 presentation work cannot change canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
