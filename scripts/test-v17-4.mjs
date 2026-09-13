import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';

const entry=fs.readFileSync('app-entry.js','utf8');
const experience=fs.readFileSync('src/runtime/experience-core.js','utf8');
const experienceRoot=fs.readFileSync('src/runtime/experience.js','utf8');
const albums=fs.readFileSync('src/runtime/albums-experience-v17-4.js','utf8');
const nav=fs.readFileSync('src/runtime/navigation-model.js','utf8');
const navShell=fs.readFileSync('src/runtime/navigation-shell.js','utf8');
const styleRoot=fs.readFileSync('src/styles/index.css','utf8');
const albumsCss=fs.readFileSync('src/styles/albums.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));

test('v17.4 release fingerprints are synchronized for production output',()=>{
  assert.match(entry,/APP_VERSION='17\.4\.0'/);
  assert.match(experience,/UI_RELEASE='17\.4\.0'/);
  assert.match(experience,/family\.archive\.uiReload\.v17\.4/);
  assert.match(build,/const appVersion='17\.4\.0'/);
  assert.match(build,/shell\.replaceAll\('17\.2\.0',appVersion\)/);
});

test('Albums is loaded behind the stable Family experience boundary and owns the Family media label',()=>{
  assert.match(experienceRoot,/albums-experience-v17-4\.js/);
  assert.match(nav,/\{key:'media',label:'Albums',href:'#media'\}/);
  assert.match(nav,/media:'Albums'/);
  assert.match(navShell,/<span>Albums<\/span>/);
  assert.match(albums,/document\.body\.dataset\.albumsRelease=RELEASE/);
});

test('album browsing is assembled from existing visible media metadata and existing filters',()=>{
  assert.match(albums,/function branchAlbums\(items\)/);
  assert.match(albums,/function decadeAlbums\(items\)/);
  assert.match(albums,/function typeAlbums\(items\)/);
  assert.match(albums,/data-v174-album-branch/);
  assert.match(albums,/data-v174-album-decade/);
  assert.match(albums,/data-v174-album-type/);
  assert.match(albums,/document\.querySelector\('#branch'\)/);
  assert.match(albums,/document\.querySelector\('#media-decade'\)/);
  assert.match(albums,/document\.querySelector\('#media-type'\)/);
  assert.match(albums,/dispatchEvent\(new Event\('change'/);
});

test('anonymous album composition has defense-in-depth living and unresolved privacy guards',()=>{
  assert.match(albums,/item\?\.visibility==='public'/);
  assert.match(albums,/Boolean\(person\?\.living\)/);
  assert.match(albums,/UNRESOLVED\|REJECTED/);
  assert.match(albums,/authenticated\?\(cache\|\|\[\]\):\(cache\|\|\[\]\)\.filter\(publicSafe\)/);
  assert.doesNotMatch(albums,/localStorage/);
});

test('Albums styling is semantic editorial and mobile-safe',()=>{
  assert.match(styleRoot,/@import '\.\/media\.css';\s*@import '\.\/albums\.css';/);
  assert.match(albumsCss,/\.v174-branch-albums/);
  assert.match(albumsCss,/\.v174-decade-albums/);
  assert.match(albumsCss,/\.v174-type-albums/);
  assert.match(albumsCss,/@media\(max-width:720px\)/);
  assert.match(albumsCss,/min-height:44px/);
  assert.match(albumsCss,/font-size:11px/);
  assert.match(albumsCss,/@media\(prefers-reduced-motion:reduce\)/);
});

test('v17.4 presentation cannot alter canonical genealogy or evidence semantics',()=>{
  assert.equal(model.meta.release,'13.0');
  const bridge=(model.relationships||[]).find(rel=>rel.type==='identity-bridge');
  assert.ok(bridge,'identity bridge must remain present');
  assert.match(String(bridge.state||''),/UNRESOLVED/i);
  assert.notEqual(bridge.type,'parent-child');
  assert.ok((model.relationships||[]).filter(rel=>/REJECTED/i.test(String(rel.state||''))).every(rel=>rel.active===false));
  assert.doesNotMatch(albums,/relationships?\.push/);
  assert.doesNotMatch(albums,/claims?\.push/);
  assert.doesNotMatch(albums,/\.state\s*=\s*[^=]/);
});
