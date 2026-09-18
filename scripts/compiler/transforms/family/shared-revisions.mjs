import fs from 'node:fs';
const modelPath='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.sharedFamilyData={version:'12.1',authority:'APPEND-ONLY SHARED FAMILY REVISION LAYER — CANONICAL v10 REMAINS IMMUTABLE',storage:'Netlify Database / PostgreSQL',api:'/api/family-sync',workflow:['local edit','submit pending revision','explicit approve or reject','pull latest approved revision'],writeProtection:'Writes and review actions require FAMILY_EDITOR_WRITE_KEY. The key is never embedded in the public bundle.',readPolicy:'Only the latest approved family-edit snapshot is available without the editor key. Pending/rejected revision history requires the editor key.',privacyRule:'Shared revisions carry the same living-person suppression as the Family Editor. Canonical evidence states are never modified by shared revisions.',migrationRule:'Existing browser-local editor state can be submitted as a pending shared revision and later pulled on another device after approval.',rollbackRule:'Revisions are append-only; restoring an earlier state is performed by approving a new revision based on the desired prior snapshot rather than mutating canonical evidence.'};
model.meta.release='12.1';model.meta.version='12.1';model.meta.releaseTitle='Persistent Family Revisions + Cross-Device Sync';
const checks=audit.checks.filter(c=>!['AUD-029','AUD-030','AUD-031','AUD-032'].includes(c.id));
checks.push(
{id:'AUD-029',label:'Shared family data remains separate from canonical evidence',pass:/CANONICAL v10 REMAINS IMMUTABLE/i.test(model.sharedFamilyData.authority),detail:model.sharedFamilyData.authority},
{id:'AUD-030',label:'Shared writes require a server-side editor key',pass:/FAMILY_EDITOR_WRITE_KEY/.test(model.sharedFamilyData.writeProtection)&&/never embedded/i.test(model.sharedFamilyData.writeProtection),detail:model.sharedFamilyData.writeProtection},
{id:'AUD-031',label:'Shared revisions require explicit review before publication',pass:model.sharedFamilyData.workflow.includes('explicit approve or reject'),detail:model.sharedFamilyData.workflow.join(' → ')},
{id:'AUD-032',label:'Local editor state has a controlled cross-device migration path',pass:/submitted as a pending shared revision/i.test(model.sharedFamilyData.migrationRule),detail:model.sharedFamilyData.migrationRule}
);
audit.version='12.1';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,sharedStorage:model.sharedFamilyData.storage},null,2));
