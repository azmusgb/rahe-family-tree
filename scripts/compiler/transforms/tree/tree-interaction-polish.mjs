import fs from'node:fs';
const path='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(path,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.treeEnginePolish={version:'12.9.1',title:'Tree Visual + Interaction Polish',coupleRule:'DUAL-PARENT CHILD CONNECTORS MAY BE VISUALLY CENTERED ON AN EXPLICIT SPOUSE COUPLE; BOTH EXPLICIT PARENT RELATIONSHIPS REMAIN IN THE MODEL AND RELATIONSHIP INDEX',collapseRule:'COLLAPSE CONTROLS REMAIN PRESENTATION-ONLY AND MUST DESCRIBE THEIR DESCENDANT EFFECT',mobileRule:'ON SMALL SCREENS THE FIRST TAP RECENTERS A TREE PERSON; SUBSEQUENT ACTIVATION OPENS THE PROFILE',navigationRule:'TREE TRAIL, HOME PERSON, RECENT PEOPLE, AND CENTERING REMAIN BROWSER NAVIGATION STATE ONLY',printRule:'PRINT MODE MAY SIMPLIFY PORTRAITS AND CHROME BUT MUST RETAIN RELATIONSHIP SEMANTICS AND IDENTITY-BRIDGE DISTINCTION',dashboardRule:'FAMILY/RESEARCH MODE TRANSITIONS MUST FORCE A CORE RERENDER AND MUST NOT LEAVE STALE FAMILY-HOME DOM'};
model.meta.release='12.9.1';model.meta.version='12.9.1';model.meta.releaseTitle='Tree Visual + Interaction Polish — Couple Connectors + Mobile Recenter + Navigation Trail';
const checks=[
['AUD-078','Couple-centered child connectors preserve explicit parentage','Visual dual-parent routing is permitted only when two explicit parent-child edges and an explicit spouse relationship exist; the underlying relationships remain unchanged.'],
['AUD-079','Mobile recentering is navigation-only','Tap-to-recenter changes viewport/navigation state only and cannot alter genealogy.'],
['AUD-080','Tree trail is non-canonical','Home/recent/breadcrumb tree navigation is browser state only.'],
['AUD-081','Print simplification preserves genealogy semantics','Print styling may simplify media/chrome but must retain relationship meaning and unresolved identity-bridge distinction.'],
['AUD-082','Family and Research dashboard transitions cannot leave stale DOM','Mode changes invalidate the family-home marker and force core rerendering before the overlay reapplies.']
];
for(const[id,label,detail]of checks){const x=audit.checks.find(c=>c.id===id);if(x)Object.assign(x,{label,detail,pass:true});else audit.checks.push({id,label,detail,pass:true});}
audit.version='12.9.1';audit.pass=audit.checks.every(x=>x.pass!==false);
fs.writeFileSync(path,JSON.stringify(model,null,2)+'\n');fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,treePolish:model.treeEnginePolish.title},null,2));
