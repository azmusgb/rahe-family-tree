import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('family controller retains living-person chronology and media privacy enforcement',()=>{const src=read('src/features/family/controller.js');assert.match(src,/livingChronologyPrivacy/);assert.match(src,/livingMediaPrivacy/);assert.match(src,/publicSafeLivingPersonMarkup/);assert.match(src,/person\?\.living/);});
test('tree package does not own canonical genealogy mutation',()=>{const src=read('src/features/tree/controller.js');assert.match(src,/Canonical genealogy remains owned by core\/graph modules/);assert.doesNotMatch(src,/createPerson|createRelationship|promoteEvidence/);});
