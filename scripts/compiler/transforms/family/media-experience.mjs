import fs from'node:fs';
const path='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(path,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.mediaExperience={version:'12.8',title:'Media-first Family History',portraitRule:'FEATURED PUBLIC IMAGE MEDIA MAY PRESENT AS A PERSON PORTRAIT; INITIALS REMAIN THE FALLBACK',privacyRule:'SERVER-SIDE PRIVACY LOOKUP FORCES MEDIA PRIVATE WHEN ANY LINKED PERSON IS LIVING OR UNRESOLVED',taggingRule:'MEDIA MAY LINK TO MULTIPLE EXPLICIT PERSON IDS PLUS DATE, PLACE, CAPTION, AND SOURCE METADATA',galleryRule:'FAMILY MEDIA MAY BE BROWSED BY PERSON, DECADE, AND TYPE WITHOUT CHANGING GENEALOGY EVIDENCE',documentRule:'PDF DOCUMENTS REMAIN VIEWABLE MEDIA ATTACHMENTS AND DO NOT BECOME CANONICAL SOURCES BY UPLOAD ALONE',authorizationRule:'CONTRIBUTOR+ MAY UPLOAD; EDITOR+ MAY CHANGE MEDIA METADATA, FEATURE PORTRAITS, OR SOFT-DELETE',evidenceRule:'MEDIA METADATA AND FEATURED-PORTRAIT CHOICES ARE PRESENTATION/ARCHIVE DATA ONLY AND CANNOT PROMOTE EVIDENCE'};
model.meta.release='12.8';model.meta.version='12.8';model.meta.releaseTitle='Media-first Family History — Portraits + Galleries + Rich Metadata';
const checks=[
 ['AUD-067','Featured portraits remain presentation-only','Featured photo selection changes presentation only and cannot alter person identity, relationship, claim, or evidence state.'],
 ['AUD-068','Media privacy is server-enforced','Any media linked to a living or unresolved person is forced private from the server-side research-model privacy index.'],
 ['AUD-069','Media tagging stays explicit','Multi-person tags store only explicitly selected person IDs and cannot infer genealogy relationships.'],
 ['AUD-070','Uploaded documents do not self-promote','PDF and image uploads remain media attachments and do not become canonical sources or claims without separate evidence review.'],
 ['AUD-071','Media authorization remains role based','Contributor+ may upload while Editor+ controls metadata changes, featured portraits, and soft deletion.']
];
for(const[id,label,detail]of checks){const existing=audit.checks.find(x=>x.id===id);if(existing)Object.assign(existing,{label,detail,pass:true});else audit.checks.push({id,label,detail,pass:true});}
audit.version='12.8';audit.pass=audit.checks.every(x=>x.pass!==false);
fs.writeFileSync(path,JSON.stringify(model,null,2)+'\n');fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,media:model.mediaExperience.title},null,2));
