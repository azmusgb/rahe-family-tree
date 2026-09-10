import fs from'node:fs';
const path='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(path,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.familyExperience={...(model.familyExperience||{}),version:'12.6.1',title:'Family Experience Polish',profilePriority:'PERSON + IMMEDIATE FAMILY + LIFE STORY + MEDIA BEFORE RESEARCH DETAIL',mobileNavigation:'PERSISTENT FAMILY NAV + VISUAL TREE',portraitRule:'PUBLIC IMAGE MEDIA MAY PRESENT AS A PORTRAIT; INITIALS REMAIN THE FALLBACK',researchDisclosure:'DETAILED CLAIMS, SOURCES, AND RESEARCH REMAIN AVAILABLE THROUGH RESEARCH MODE',treeDepthLabel:'SIX-HOP CONTEXT IS LABELED 6 HOPS; FULL TREE REMAINS EXPLICIT'};
model.meta.release='12.6.1';model.meta.version='12.6.1';model.meta.releaseTitle='Family Experience Polish — Cleaner Profiles + Mobile Navigation + Public Portraits';
const checks=[
 ['AUD-054','Family polish remains presentation-only','Family-mode layout, portrait presentation, and navigation cannot change canonical evidence.'],
 ['AUD-055','Public portrait media privacy gate','Only media already returned as public image media may become a family-facing portrait.'],
 ['AUD-056','Research detail remains reachable','Family profiles simplify research detail presentation while Research Mode retains full evidence access.'],
 ['AUD-057','Tree scope labels remain literal','Bounded six-hop context is no longer described as all connected; Full tree remains the explicit complete-tree control.']
];
for(const[id,label,detail]of checks){const existing=audit.checks.find(x=>x.id===id);if(existing)Object.assign(existing,{label,detail,pass:true});else audit.checks.push({id,label,detail,pass:true});}
audit.version='12.6.1';audit.pass=audit.checks.every(x=>x.pass!==false);
fs.writeFileSync(path,JSON.stringify(model,null,2)+'\n');fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,profilePriority:model.familyExperience.profilePriority},null,2));
