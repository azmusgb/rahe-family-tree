import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience.js','utf8');
const runtime=fs.readFileSync('v15-1-runtime.js','utf8');
const css=fs.readFileSync('v15-1.css','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v15.1 rearranges the route overview and filters into one layout deck',()=>{
  assert.match(index,/class="route-shell"/);
  assert.match(index,/class="page-heading"/);
  assert.match(index,/id="filters"/);
  assert.match(css,/\.route-shell\{/);
  assert.match(css,/grid-template-columns:minmax\(260px,\.72fr\) minmax\(560px,1\.28fr\)/);
});

test('v15.1 promotes family navigation into a horizontal primary bar with disclosure menus',()=>{
  assert.match(runtime,/v151-primary-nav/);
  assert.match(runtime,/v151-nav-menu/);
  assert.match(runtime,/\['dashboard','Home'\]/);
  assert.match(runtime,/\['media','Media'\]/);
  assert.match(runtime,/\['timeline','Timeline'\]/);
  assert.match(css,/Desktop\/tablet application shell/);
  assert.match(css,/\.sidebar\{[\s\S]*flex-direction:row/);
});

test('v15.1 groups featured people and branches into its historical family discovery canvas',()=>{
  assert.match(runtime,/dashboard-family-layout/);
  assert.match(runtime,/dashboard-featured-title/);
  assert.match(runtime,/dashboard-branches-title/);
  assert.match(css,/\.dashboard-family-layout\{/);
});

test('v15.1 historical person relayout remains available beneath native v17 Family ownership',()=>{
  assert.match(runtime,/relayoutPerson/);
  assert.match(runtime,/back\.insertAdjacentElement\('afterend',overview\)/);
  assert.match(runtime,/person-source-summary/);
  assert.match(css,/Person pages lead with the family overview/);
});

test('v15.1 remains responsive and retains the mobile dock breakpoint',()=>{
  assert.match(css,/@media \(max-width:720px\)/);
  assert.match(css,/\.sidebar\{display:none!important\}/);
  assert.match(index,/id="family-mobile-dock"/);
});

test('v15.1 compatibility remains carried by the bundled v17.2 release',()=>{
  assert.match(index,/styles\.css\?v=17\.2\.0/);
  assert.match(index,/app\.bundle\.js\?v=17\.2\.0/);
  assert.match(entry,/src\/runtime\/index\.js/);
  assert.match(experience,/\.\.\/\.\.\/v15-1-runtime\.js/);
  assert.match(build,/app-entry\.js/);
  assert.match(styleRoot,/v15-1\.css/);
  assert.match(build,/const appVersion='17\.2\.0'/);
});

test('v15.1 relayout cannot alter canonical genealogy semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});