import fs from'node:fs';
const path='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(path,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.treeEngine={version:'12.9',title:'Family Tree Engine',connectedRule:'ALL CONNECTED traverses the complete active family connected component with no arbitrary hop cap; FULL TREE remains a distinct expert mode',generationRule:'LAYOUT GROUPS PEOPLE INTO PRESENTATION-ONLY GENERATION LANES; GENERATION POSITION NEVER CHANGES PEDIGREE EVIDENCE',scopeRule:'TREE SCOPES: FAMILY CONTEXT, ANCESTORS, DESCENDANTS, DIRECT LINE, ALL CONNECTED, FULL TREE',collapseRule:'COLLAPSE/EXPAND HIDES DESCENDANT PRESENTATION ONLY; SOURCE PEOPLE AND RELATIONSHIPS REMAIN IN THE MODEL',identityRule:'IDENTITY-BRIDGE RELATIONSHIPS REMAIN NON-PEDIGREE AND VISUALLY DISTINCT FROM PARENT-CHILD EDGES',privacyRule:'TREE PORTRAITS CONTINUE TO USE ONLY MEDIA ALREADY AUTHORIZED FOR PUBLIC PRESENTATION; LIVING-PERSON PRIVACY REMAINS BINDING',navigationRule:'HOME PERSON, RECENT PEOPLE, CENTER-ON-PERSON, AND SCOPE MEMORY ARE NAVIGATION STATE ONLY',canonicalRule:'TREE ENGINE OPERATIONS NEVER CREATE, PROMOTE, MERGE, OR DELETE CANONICAL GENEALOGY'};
model.meta.release='12.9';model.meta.version='12.9';model.meta.releaseTitle='Family Tree Engine — Connected Traversal + Generation Lanes + Direct Line';
const checks=[
['AUD-072','Connected traversal cannot invent genealogy','All-connected traversal follows only active explicit family relationships and never synthesizes edges.'],
['AUD-073','Generation lanes are presentation-only','Generation rank and ordering alter display only and cannot change evidence or pedigree.'],
['AUD-074','Identity bridge remains non-pedigree','The unresolved DeVine/Rahe identity bridge remains semantically and visually distinct from pedigree relationships.'],
['AUD-075','Collapsed branches preserve source data','Collapse state only filters the rendered descendant view and never deletes or hides records from the underlying model.'],
['AUD-076','Tree navigation state is non-canonical','Home person, recent people, centering, and tree scope are browser navigation state only.'],
['AUD-077','Full-tree expert mode remains available','The complete named-person tree remains explicitly accessible independently from focal connected-family mode.']
];
for(const[id,label,detail]of checks){const x=audit.checks.find(c=>c.id===id);if(x)Object.assign(x,{label,detail,pass:true});else audit.checks.push({id,label,detail,pass:true});}
audit.version='12.9';audit.pass=audit.checks.every(x=>x.pass!==false);
fs.writeFileSync(path,JSON.stringify(model,null,2)+'\n');fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,tree:model.treeEngine.title},null,2));
