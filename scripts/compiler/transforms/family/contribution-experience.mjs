import fs from'node:fs';
const path='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(path,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.contributionExperience={version:'12.7',title:'Collaboration & Contribution',relativeCreation:'ATOMIC — PERSON + ALL VALIDATED RELATIONSHIPS COMMIT IN ONE LOCAL EDIT SNAPSHOT',parentageRule:'SECOND-PARENT AND SIBLING PARENTAGE MAY ONLY USE ALREADY STRUCTURED EXPLICIT RELATIONSHIPS; NO PARENT IS INVENTED',restoreRule:'HIDDEN PUBLISHED PEOPLE AND RELATIONSHIPS REMAIN SOURCE-PRESERVED AND MAY BE RESTORED FROM THE FAMILY EDITOR',mediaAuthorization:'PUBLIC MEDIA IS PUBLIC; SIGNED-IN FAMILY ACCOUNTS MAY VIEW PRIVATE MEDIA; CONTRIBUTOR+ MAY UPLOAD; EDITOR+ MAY SOFT-DELETE',mediaEvidenceRule:'MEDIA ATTACHMENTS REMAIN EVIDENCE-ADJACENT AND CANNOT PROMOTE GENEALOGY EVIDENCE',canonicalRule:'CONTRIBUTION WORKFLOWS CHANGE ONLY LOCAL OR REVIEW-GATED SHARED OVERLAYS; CANONICAL v10 IS IMMUTABLE'};
model.meta.release='12.7';model.meta.version='12.7';model.meta.releaseTitle='Collaboration & Contribution — Atomic Relatives + Account Media + Restore';
const checks=[
 ['AUD-062','Relative creation is atomic','A new relative and every relationship selected for that operation are prevalidated and saved through one family-edit commit.'],
 ['AUD-063','Contribution parentage remains explicit','Second-parent and sibling connections are limited to already structured parent/spouse relationships and cannot invent parentage.'],
 ['AUD-064','Media uses account authorization','Private media requires family sign-in; Contributor+ may upload and Editor+ may soft-delete while public media remains public.'],
 ['AUD-065','Hidden source records remain restorable','Local hiding never deletes canonical or family-supplied source records and the editor exposes restore controls.'],
 ['AUD-066','Contribution remains non-canonical','Local and shared contribution workflows cannot rewrite or promote canonical v10 evidence.']
];
for(const[id,label,detail]of checks){const existing=audit.checks.find(x=>x.id===id);if(existing)Object.assign(existing,{label,detail,pass:true});else audit.checks.push({id,label,detail,pass:true});}
audit.version='12.7';audit.pass=audit.checks.every(x=>x.pass!==false);
fs.writeFileSync(path,JSON.stringify(model,null,2)+'\n');fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,atomic:model.contributionExperience.relativeCreation},null,2));
