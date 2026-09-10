import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v12 foundation declares immutable canonical layer',()=>{
  assert.match(String(model.meta.release),/^12\./);
  assert.equal(model.v12Foundation.version,'12.0');
  assert(model.v12Foundation.guarantees.some(x=>/Canonical v10 evidence remains immutable/i.test(x)));
});

test('v12 editor guarantees duplicate prevention and undo redo',()=>{
  assert(model.v12Foundation.guarantees.some(x=>/Duplicate people and duplicate relationships are blocked/i.test(x)));
  assert(model.v12Foundation.guarantees.some(x=>/undo and redo/i.test(x)));
});

test('shared-data readiness preserves evidence separation',()=>{
  const s=model.v12Foundation.sharedDataReadiness;
  assert.match(s.status,/BACKEND NOT YET CONNECTED/i);
  assert(s.layers.includes('canonical_evidence'));
  assert(s.layers.includes('contribution_draft'));
  assert.match(s.rule,/may not silently overwrite source-controlled evidence states/i);
});

test('v12 semantic audit gates pass',()=>{
  for(const id of ['AUD-026','AUD-027','AUD-028'])assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert.match(String(audit.version),/^12\./);
  assert.equal(audit.pass,true);
});
