import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
test('mobile Home polish is route-scoped and preserves readable composition',()=>{
  const css=read('src/styles/home-mobile-polish.css');
  const index=read('src/styles/index.css');
  assert.match(index,/@import '\.\/home-mobile-polish\.css';/);
  assert.match(css,/data-experience="family"\]\[data-route="dashboard"/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/grid-auto-columns:minmax\(250px,84vw\)/);
  assert.match(css,/scroll-snap-type:x proximity/);
  assert.match(css,/font-size:15px;line-height:1\.5/);
  assert.doesNotMatch(css,/display:none/);
});
