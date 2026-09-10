import fs from 'node:fs';

const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));

const person=name=>model.people.find(p=>p.name===name || p.name.includes(name));
const source=id=>model.sources.find(s=>s.id===id);
const rel=(id,type,fromName,toName,state,role,sourceId,section,basis)=>({
  id,type,
  from:person(fromName)?.id||'',
  to:person(toName)?.id||'',
  state,
  role,
  active:!state.toUpperCase().includes('REJECTED'),
  stateTokens:['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED','DERIVATIVE'].filter(x=>state.toUpperCase().includes(x)),
  claimIds:[],
  sourceIds:sourceId?[sourceId]:[],
  source:{section:section||source(sourceId)?.location?.section||'',basis}
});

const contextRelationships=[
  rel('CTX-KIN-001','sibling-context','Katherine May Kinsman','Virginia Martha Kinsman','PROVISIONAL / DERIVATIVE collateral sibling lead','Derivative sibling-context lead; not proved parentage','','s204','Appendix F identifies Virginia as a derivative collateral family-context sibling lead. Public genealogy places her in the same George Walter Kinsman family context; no parent-child edge is asserted.'),
  rel('CTX-KIN-002','sibling-context','Katherine May Kinsman','Mary Monica Manning','PROVISIONAL / DERIVATIVE collateral sibling lead','Derivative sibling-context lead; not proved parentage','','s204','Appendix F identifies Mary Monica Manning as a derivative collateral family-context sibling lead. Public genealogy places her in the same George Walter Kinsman family context; no parent-child edge is asserted.'),
  rel('CTX-FER-001','baptism-sponsor','David Fleming','Edward Ellery DeVine / DeVeine','SUPPORTED sponsor relationship only','1918 baptism sponsor; not a kinship assertion','C001','s028','The St. Anne parish extract names David Fleming as a baptism sponsor for Edward Ellery DeVine/DeVeine. This is a FAN-network association, not a family relationship.'),
  rel('CTX-RAH-001','spouse-lead','Sarah Ferry','Elie Davin','PROVISIONAL / DERIVATIVE high-value lead','Public-profile spouse lead; not proof','W006','s058','The retained Ancestry Sarah Ferry profile lists Elie Davin among spouse entries. The dossier classifies that profile as a derivative high-value lead only; no proved spouse edge is asserted.')
];

model.contextRelationships=contextRelationships;
model.meta.release='11.1';
model.meta.counts.contextRelationships=contextRelationships.length;
model.meta.graphPolicy='Pedigree relationships remain separate from contextual sibling, sponsor, and derivative spouse-lead associations.';
model.orphanResolution=contextRelationships.map(r=>({personId:r.from,peerId:r.to,relationshipId:r.id,disposition:r.role,state:r.state,source:r.source}));

const resolved=new Set(contextRelationships.flatMap(r=>[r.from,r.to]));
const priorOrphans=audit.exceptions?.orphanPeople||[];
audit.version='11.1';
audit.checks=audit.checks.filter(c=>c.id!=='AUD-009');
audit.checks.push({id:'AUD-009',label:'Previously unlinked inventory entries have explicit contextual disposition',pass:priorOrphans.every(id=>resolved.has(id)),detail:priorOrphans.every(id=>resolved.has(id))?'Virginia Martha Kinsman, Mary Monica Manning, David Fleming, and Elie Davin are represented only with source-supported contextual edges.':'One or more prior orphan entries still lacks contextual disposition.'});
audit.exceptions.structuralOrphans=priorOrphans;
audit.exceptions.orphanPeople=priorOrphans.filter(id=>!resolved.has(id));
audit.pass=audit.checks.every(c=>c.pass);
model.audit=audit;

fs.writeFileSync(modelPath,JSON.stringify(model,null,2));
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,contextRelationships:contextRelationships.length,auditPass:audit.pass,remainingUnlinked:audit.exceptions.orphanPeople.length},null,2));
