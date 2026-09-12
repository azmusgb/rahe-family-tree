import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const tokens=fs.readFileSync('src/styles/tokens.css','utf8');
const shell=fs.readFileSync('src/styles/shell.css','utf8');
const base=fs.readFileSync('src/styles/base.css','utf8');
const tree=fs.readFileSync('src/styles/tree.css','utf8');
const person=fs.readFileSync('src/styles/person.css','utf8');
const media=fs.readFileSync('src/styles/media.css','utf8');
const responsive=fs.readFileSync('src/styles/responsive.css','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

const semantic=['tokens.css','base.css','shell.css','navigation.css','home.css','people.css','person.css','stories.css','tree.css','media.css','explore.css','research.css','responsive.css'];

test('semantic Family design system loads last in deliberate order',()=>{
  let previous=-1;
  for(const file of semantic){
    const index=styleRoot.indexOf(`@import './${file}';`);
    assert.ok(index>previous,`${file} should load after the previous semantic layer`);
    previous=index;
  }
  assert.doesNotMatch(styleRoot,/v16-3\.css/);
  assert.equal(fs.existsSync('src/styles/v16-3.css'),false);
});

test('design tokens collapse radius shadow typography and page-width decisions',()=>{
  for(const token of['--family-radius-panel','--family-radius-card','--family-radius-control','--family-radius-chip','--family-shadow-card','--family-text-display','--family-text-meta','--family-page-person','--family-page-media'])assert.match(tokens,new RegExp(token));
  assert.match(shell,/grid-template-columns:224px/);
  assert.match(shell,/--family-page-home/);
  assert.match(shell,/--family-page-person/);
  assert.match(shell,/--family-page-media/);
});

test('family surfaces are content-first rather than nested panel-first',()=>{
  assert.match(shell,/Broad family sections use whitespace rather than card chrome/);
  assert.match(person,/family-overview-card\.v159-person-overview[\s\S]*border:0!important/);
  assert.match(person,/#content>\.panel[\s\S]*border-radius:0!important/);
  assert.match(media,/media-library-note[\s\S]*background:transparent!important/);
});

test('tree is visually genealogical and mobile typography keeps readable floors',()=>{
  assert.match(tree,/rgba\(23,63,53,\.012\)/);
  assert.match(tree,/node-branch,.node-state/);
  assert.match(tree,/font-size:10px!important/);
  assert.match(responsive,/node-id\{font-size:9px!important/);
  assert.match(base,/font-size:max\(var\(--family-text-meta\),12px\)!important/);
});

test('semantic styling cannot alter genealogy or evidence states',()=>{
  const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
  assert.ok(bridge);
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.ok((model.relationships||[]).filter(r=>/REJECTED/i.test(String(r.state||''))).every(r=>r.active===false));
});
