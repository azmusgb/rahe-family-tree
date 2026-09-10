import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model=JSON.parse(fs.readFileSync('public/research-model.json','utf8'));
const audit=JSON.parse(fs.readFileSync('public/semantic-audit.json','utf8'));

test('v11.6 declares a non-canonical local family editor',()=>{
  assert.equal(model.meta.release,'11.6');
  assert.match(model.familyEditor.authority,/NON-CANONICAL/i);
  for(const capability of ['add person','edit person','add relationship','edit relationship','export edits','import edits','reset edits']) assert(model.familyEditor.capabilities.includes(capability));
});

test('published records are protected from destructive editor deletion',()=>{
  assert.match(model.familyEditor.deleteRule,/only hides it in the local overlay/i);
  assert.match(model.familyEditor.deleteRule,/source-controlled record remains intact/i);
});

test('living-person privacy remains default in family editor',()=>{
  assert.match(model.familyEditor.privacyRule,/Living \/ birth details withheld/i);
  assert.match(model.familyEditor.privacyRule,/do not alter the canonical corpus/i);
});

test('v11.6 semantic gates pass',()=>{
  for(const id of ['AUD-023','AUD-024','AUD-025']) assert.equal(audit.checks.find(c=>c.id===id)?.pass,true,id);
  assert.equal(audit.version,'11.6');
  assert.equal(audit.pass,true);
});
