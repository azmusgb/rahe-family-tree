import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
test('runtime implementations are owned by permanent domains',()=>{
  assert.equal(exists('src/runtime'),false,'legacy src/runtime directory must be retired');
  for(const p of ['src/app/runtime.js','src/app/experience.js','src/features/family/index.js','src/features/navigation/runtime.js','src/features/navigation/shell.js','src/features/tree/controller.js','src/features/person/experience.js','src/platform/performance/contracts.js']) assert.ok(exists(p),p);
});
test('browser composition root uses permanent ownership boundaries',()=>{
  const src=read('src/app/runtime.js');
  const order=['./router.js','./base-controls.js','../../media.js','../../deployment.js','../features/family/index.js','../features/media/index.js','../features/tree/index.js','../features/search/index.js','../features/media/page.js','./experience.js'];
  let pos=-1; for(const spec of order){const next=src.indexOf(spec);assert.ok(next>pos,'expected ordered import '+spec);pos=next;}
});
test('production JavaScript filenames do not encode release chronology',()=>{
  const ignored=new Set(['scripts','e2e','docs','node_modules','dist']);
  function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(dir==='.'&&ignored.has(e.name))continue;const p=dir==='.'?e.name:path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else if(/\.m?js$/.test(e.name))out.push(p);}return out;}
  const bad=walk('.').filter(p=>/(?:^|[-_.])v\d+(?:[-_.]\d+)*/i.test(path.basename(p)));
  assert.deepEqual(bad,[]);
});
