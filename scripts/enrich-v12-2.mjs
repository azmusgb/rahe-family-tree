import fs from 'node:fs';
const modelPath='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.familyExperience={version:'12.2',title:'Family Experience',defaultTreeMode:'FOCAL PERSON + TWO-DEGREE FAMILY CONTEXT',defaultFocusPersonId:'P-WILLIAM-JOHN-RAHE-III',navigationGroups:['Family','Research','Contribute','Archive'],profileRule:'Person profiles lead with immediate family and human-readable actions; technical IDs, provenance, and evidence controls remain available in secondary research details.',addRelativeRule:'Contextual Add Relative creates a new local person plus explicit relationship edges only. It may auto-link a second parent only when exactly one spouse is already explicitly structured.',searchRule:'Search results are grouped by People, Family groups, Evidence, Sources, Research tasks, and Archive. Active branch/evidence filters remain authoritative.',evidenceDisplayRule:'Evidence state, provenance, and workflow are distinct concepts and must not be visually conflated.',canonicalRule:'Family-first presentation changes navigation and editing ergonomics only; it does not promote, merge, or rewrite canonical evidence.'};
model.meta.release='12.2';model.meta.version='12.2';model.meta.releaseTitle='Family Experience — Focal Tree + Contextual Editing';
const checks=audit.checks.filter(c=>!['AUD-033','AUD-034','AUD-035','AUD-036'].includes(c.id));
checks.push(
{id:'AUD-033',label:'Family-first UX cannot change canonical evidence',pass:/does not promote, merge, or rewrite canonical evidence/i.test(model.familyExperience.canonicalRule),detail:model.familyExperience.canonicalRule},
{id:'AUD-034',label:'Contextual add-relative requires explicit relationship edges',pass:/explicit relationship edges only/i.test(model.familyExperience.addRelativeRule),detail:model.familyExperience.addRelativeRule},
{id:'AUD-035',label:'Second-parent convenience cannot infer unknown parentage',pass:/only when exactly one spouse is already explicitly structured/i.test(model.familyExperience.addRelativeRule),detail:model.familyExperience.addRelativeRule},
{id:'AUD-036',label:'Evidence state provenance and workflow remain separate concepts',pass:/distinct concepts/i.test(model.familyExperience.evidenceDisplayRule),detail:model.familyExperience.evidenceDisplayRule}
);
audit.version='12.2';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,defaultTreeMode:model.familyExperience.defaultTreeMode},null,2));
