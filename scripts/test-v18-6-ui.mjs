import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('18.6 page actions use the shared UI command layer',async()=>{
  const runtime=await read('src/runtime/page-architecture.js');
  const commands=await read('src/runtime/ui-commands.js');
  assert.match(runtime,/data-ui-command/);
  assert.match(runtime,/page-actions--desktop/);
  assert.match(runtime,/page-actions--mobile/);
  assert.match(commands,/runUiCommand/);
  assert.match(commands,/toggle-experience/);
});

test('18.6 tree context avoids duplicate advanced navigation',async()=>{
  const runtime=await read('src/runtime/tree-polish.js');
  assert.match(runtime,/tree-advanced-nav/);
  assert.match(runtime,/tree-context-fallback/);
  assert.match(runtime,/tree-recent-history--fallback/);
  assert.match(runtime,/Recently viewed/);
});

test('18.6 has a centralized print contract',async()=>{
  const root=await read('src/styles/index.css');
  const print=await read('src/styles/print.css');
  assert.match(root,/@import '\.\/print\.css';/);
  assert.match(print,/@media print/);
  assert.match(print,/#family-graph/);
});
