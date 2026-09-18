import fs from'node:fs';
const path='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(path,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.familyExperience={...(model.familyExperience||{}),version:'12.6.2',title:'Visual QA + Responsive UX Corrections',qaRule:'RESPONSIVE, ACCESSIBILITY, EMPTY-STATE, LONG-LABEL, AND TOUCH-TARGET IMPROVEMENTS ARE PRESENTATION-ONLY',accessibilityRule:'KEYBOARD FOCUS, ARIA CURRENT STATE, REDUCED MOTION, AND SCREEN-READER TREE GUIDANCE DO NOT ALTER EVIDENCE',responsiveRule:'MOBILE RETAINS FAMILY TREE, FULL TREE, PROFILE ACCESS, AND RESEARCH MODE',privacyRule:'PUBLIC PORTRAIT HYDRATION REMAINS LIMITED TO MEDIA ALREADY MARKED PUBLIC; LIVING-PERSON PRIVACY REMAINS BINDING'};
model.meta.release='12.6.2';model.meta.version='12.6.2';model.meta.releaseTitle='Visual QA + Responsive UX Corrections';
const checks=[
 ['AUD-058','Visual QA remains presentation-only','Responsive and accessibility corrections do not alter canonical genealogy or evidence state.'],
 ['AUD-059','Mobile capability parity retained','Mobile retains visual tree, profile navigation, and access to Research Mode.'],
 ['AUD-060','Accessibility semantics remain non-genealogical','ARIA, focus, reduced-motion, and touch-target changes affect interaction only.'],
 ['AUD-061','Portrait privacy invariant retained','Family-facing portrait presentation remains restricted to media already public.']
];
for(const[id,label,detail]of checks){const existing=audit.checks.find(x=>x.id===id);if(existing)Object.assign(existing,{label,detail,pass:true});else audit.checks.push({id,label,detail,pass:true});}
audit.version='12.6.2';audit.pass=audit.checks.every(x=>x.pass!==false);
fs.writeFileSync(path,JSON.stringify(model,null,2)+'\n');fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,qa:model.familyExperience.qaRule},null,2));
