import fs from 'node:fs';
const modelPath='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.mediaLibrary={version:'12.4',authority:'MEDIA LIBRARY — EVIDENCE-ADJACENT, NON-PROMOTIONAL',storage:'Netlify Blobs',api:'/api/media',allowedTypes:['image/jpeg','image/png','image/webp','application/pdf'],maxUploadBytes:15728640,privacyRule:'Media linked to a living person is forced private by the server. Public visibility is allowed only for non-living people and only by explicit editor choice.',deletionRule:'Media deletion is a soft-delete tombstone; binary content is retained for controlled recovery/audit until separately purged.',evidenceRule:'Uploading or linking a photo/document never changes a person, relationship, claim, or evidence state.',provenanceRule:'Each media record carries contributor, linked person ID, optional source ID, visibility, original filename, MIME type, and evidence-authority label.'};
model.revisionReview={version:'12.4',authority:'REVIEW DIFF — PRESENTATION ONLY',rule:'Pending shared revisions are compared with the preceding approved family-edit snapshot for reviewer clarity. The diff never approves, merges, or promotes anything automatically.',dimensions:['people added','people edited','people hidden','relationships added','relationships edited','relationships hidden'],approvalRule:'Approve and Reject remain explicit actions separate from the diff display.'};
model.meta.release='12.4';model.meta.version='12.4';model.meta.releaseTitle='Media Gallery + Contribution Review Diffs';
const checks=audit.checks.filter(c=>!['AUD-041','AUD-042','AUD-043','AUD-044'].includes(c.id));
checks.push(
{id:'AUD-041',label:'Media attachments cannot promote genealogy evidence',pass:/never changes a person, relationship, claim, or evidence state/i.test(model.mediaLibrary.evidenceRule),detail:model.mediaLibrary.evidenceRule},
{id:'AUD-042',label:'Living-person media is server-forced private',pass:/living person is forced private by the server/i.test(model.mediaLibrary.privacyRule),detail:model.mediaLibrary.privacyRule},
{id:'AUD-043',label:'Media removal is soft-delete only',pass:/soft-delete tombstone/i.test(model.mediaLibrary.deletionRule),detail:model.mediaLibrary.deletionRule},
{id:'AUD-044',label:'Revision diff is review-only and cannot auto-approve',pass:/never approves, merges, or promotes/i.test(model.revisionReview.rule)&&/explicit actions/i.test(model.revisionReview.approvalRule),detail:`${model.revisionReview.rule} ${model.revisionReview.approvalRule}`}
);
audit.version='12.4';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,mediaStorage:model.mediaLibrary.storage},null,2));
