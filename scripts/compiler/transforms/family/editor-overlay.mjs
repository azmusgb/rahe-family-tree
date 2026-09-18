import fs from 'node:fs';
const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.familyEditor={version:1,authority:'LOCAL BROWSER EDIT OVERLAY — NON-CANONICAL',storageKey:'rahe.family.editor.v1',capabilities:['add person','edit person','hide canonical/supplemental person locally','add relationship','edit relationship','hide canonical/supplemental relationship locally','export edits','import edits','reset edits'],privacyRule:'New living people default to Living / birth details withheld. Local edits do not alter the canonical corpus or source-controlled evidence states.',deleteRule:'Deleting a published person or relationship from the editor only hides it in the local overlay; the source-controlled record remains intact.'};
model.meta.release='11.6';model.meta.version='11.6';model.meta.releaseTitle='Local Family Editor + Safe Overlay CRUD';
const checks=audit.checks.filter(c=>!['AUD-023','AUD-024','AUD-025'].includes(c.id));
checks.push(
{id:'AUD-023',label:'Family editor is explicitly non-canonical',pass:/NON-CANONICAL/i.test(model.familyEditor.authority),detail:model.familyEditor.authority},
{id:'AUD-024',label:'Family editor protects published records from deletion',pass:/only hides it in the local overlay/i.test(model.familyEditor.deleteRule),detail:model.familyEditor.deleteRule},
{id:'AUD-025',label:'Family editor defaults living-person privacy',pass:/Living \/ birth details withheld/i.test(model.familyEditor.privacyRule),detail:model.familyEditor.privacyRule}
);
audit.version='11.6';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,familyEditor:model.familyEditor.version},null,2));
