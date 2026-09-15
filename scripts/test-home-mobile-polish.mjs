import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('mobile Home is an authoritative route-scoped editorial composition',()=>{
  const css=read('src/styles/home-mobile-polish.css');
  const index=read('src/styles/index.css');
  assert.match(index,/@import '\.\/home-mobile-polish\.css';/);
  assert.match(css,/data-experience="family"\]\[data-route="dashboard"/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/min-height:0!important/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
  assert.match(css,/\.v17-home-hero>div>p:not\(\.eyebrow\)/);
  assert.match(css,/font-size:14px!important;line-height:1\.52/);
  assert.match(css,/\.v17-story-moments/);
  assert.match(css,/\.v17-home-people-grid/);
  assert.match(css,/\.v17-home-tree-row/);
  assert.match(css,/grid-auto-columns:78vw/);
  assert.match(css,/scroll-snap-type:x mandatory/);
  assert.match(css,/\.dashboard-paths\{\s*display:grid;grid-template-columns:1fr 1fr/);
  assert.match(css,/\.v174-discovery-grid>button\{\s*min-height:82px/);
  const withoutScrollbarRules=css.replace(/[^{}]*::-webkit-scrollbar\{[^{}]*\}/g,'');
  assert.doesNotMatch(withoutScrollbarRules,/display:none/);
});
