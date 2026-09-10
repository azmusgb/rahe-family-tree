import fs from 'node:fs';
const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));

const people=[
  {id:'P-AIMEE-MICHELLE-RAHE-HARDESTY',name:'Aimee Michelle Rahe / Aimee Rahe Hardesty',aliases:['Aimee Michelle Rahe','Aimee Rahe Hardesty','Aimee Hardesty'],branch:'Rahe/Hardesty',dates:'Living / birth details withheld',role:'daughter of William John Rahe Jr. + Kathleen Ann Dennewitz Rahe; Hardesty married-name identity family-supplied; spouse identity not supplied',state:'SUPPORTED / family-established',stateTokens:['SUPPORTED'],living:true,references:[],sourceLocation:null,provenance:'FAMILY-SUPPLIED SUPPLEMENT — OUTSIDE v10 CONTROLLING CORPUS'},
  {id:'P-WILLIAM-JOHN-RAHE-IV',name:'William John Rahe IV',aliases:['William John Rahe IV'],branch:'Rahe',dates:'Living / birth details withheld',role:'child of William John Rahe III + Melissa Rahe',state:'SUPPORTED / family-established',stateTokens:['SUPPORTED'],living:true,references:[],sourceLocation:null,provenance:'FAMILY-SUPPLIED SUPPLEMENT — OUTSIDE v10 CONTROLLING CORPUS'},
  {id:'P-ABEL-M-RAHE',name:'Abel M. Rahe',aliases:['Abel M. Rahe'],branch:'Rahe',dates:'Living / birth details withheld',role:'child of William John Rahe III + Melissa Rahe',state:'SUPPORTED / family-established',stateTokens:['SUPPORTED'],living:true,references:[],sourceLocation:null,provenance:'FAMILY-SUPPLIED SUPPLEMENT — OUTSIDE v10 CONTROLLING CORPUS'},
  {id:'P-OWEN-G-RAHE',name:'Owen G. Rahe',aliases:['Owen G. Rahe'],branch:'Rahe',dates:'Living / birth details withheld',role:'child of William John Rahe III + Melissa Rahe',state:'SUPPORTED / family-established',stateTokens:['SUPPORTED'],living:true,references:[],sourceLocation:null,provenance:'FAMILY-SUPPLIED SUPPLEMENT — OUTSIDE v10 CONTROLLING CORPUS'},
  {id:'P-DECLAN-S-RAHE',name:'Declan S. Rahe',aliases:['Declan S. Rahe'],branch:'Rahe',dates:'Living / birth details withheld',role:'child of William John Rahe III + Melissa Rahe',state:'SUPPORTED / family-established',stateTokens:['SUPPORTED'],living:true,references:[],sourceLocation:null,provenance:'FAMILY-SUPPLIED SUPPLEMENT — OUTSIDE v10 CONTROLLING CORPUS'}
];
const rel=(id,from,to,role)=>({id,type:'parent-child',from,to,role,state:'SUPPORTED / family-established',active:true,stateTokens:['SUPPORTED'],claimIds:[],sourceIds:[],source:null,provenance:'FAMILY-SUPPLIED SUPPLEMENT — OUTSIDE v10 CONTROLLING CORPUS'});
const relationships=[
  rel('SUP-REL-001','P-WILLIAM-JOHN-RAHE-JR','P-AIMEE-MICHELLE-RAHE-HARDESTY','father → daughter'),
  rel('SUP-REL-002','P-KATHLEEN-ANN-DENNEWITZ-RAHE','P-AIMEE-MICHELLE-RAHE-HARDESTY','mother → daughter'),
  rel('SUP-REL-003','P-WILLIAM-JOHN-RAHE-III','P-WILLIAM-JOHN-RAHE-IV','father → child'),
  rel('SUP-REL-004','P-MELISSA-RAHE','P-WILLIAM-JOHN-RAHE-IV','mother → child'),
  rel('SUP-REL-005','P-WILLIAM-JOHN-RAHE-III','P-ABEL-M-RAHE','father → child'),
  rel('SUP-REL-006','P-MELISSA-RAHE','P-ABEL-M-RAHE','mother → child'),
  rel('SUP-REL-007','P-WILLIAM-JOHN-RAHE-III','P-OWEN-G-RAHE','father → child'),
  rel('SUP-REL-008','P-MELISSA-RAHE','P-OWEN-G-RAHE','mother → child'),
  rel('SUP-REL-009','P-WILLIAM-JOHN-RAHE-III','P-DECLAN-S-RAHE','father → child'),
  rel('SUP-REL-010','P-MELISSA-RAHE','P-DECLAN-S-RAHE','mother → child')
];
model.familySupplement={
  version:1,
  authority:'FAMILY-SUPPLIED SUPPLEMENT — OUTSIDE v10 CONTROLLING CORPUS',
  evidenceRule:'These living-family identities and relationships were supplied directly by the family/user after v10. They are displayed as family-established supplemental facts and are not represented as if they originated in the v10 source document.',
  privacyRule:'Public display withholds living-person birth dates and years.',
  aggregateReplacement:{canonicalPersonId:'P-CURRENT-RAHE-CHILDREN',displayTreatment:'SUPERSEDED IN UI BY NAMED FAMILY-SUPPLIED CHILDREN; canonical row retained in model for traceability.'},
  hardestyRule:'Aimee’s Hardesty married-name identity is family-supplied. No Hardesty spouse node or spouse edge is asserted because the spouse identity has not been supplied.',
  people,relationships,
  familyGroups:[
    {id:'SUP-FG-001',label:'William John Rahe Jr. × Kathleen Ann Dennewitz Rahe',branch:'Rahe/Dennewitz',spouseIds:['P-WILLIAM-JOHN-RAHE-JR','P-KATHLEEN-ANN-DENNEWITZ-RAHE'],childIds:['P-WILLIAM-JOHN-RAHE-III','P-AIMEE-MICHELLE-RAHE-HARDESTY'],state:'SUPPORTED / family-established',supplemental:true},
    {id:'SUP-FG-002',label:'William John Rahe III × Melissa Rahe',branch:'Rahe',spouseIds:['P-WILLIAM-JOHN-RAHE-III','P-MELISSA-RAHE'],childIds:['P-WILLIAM-JOHN-RAHE-IV','P-ABEL-M-RAHE','P-OWEN-G-RAHE','P-DECLAN-S-RAHE'],state:'SUPPORTED / family-established',supplemental:true}
  ]
};
model.meta.release='11.5';model.meta.version='11.5';model.meta.releaseTitle='Named Living-Family Supplement + Hardesty Branch';
model.meta.counts.canonicalPeople=model.people.length;
model.meta.counts.supplementalPeople=people.length;
model.meta.counts.displayPeople=model.people.filter(p=>p.id!=='P-CURRENT-RAHE-CHILDREN').length+people.length;
model.meta.counts.canonicalRelationships=model.relationships.length;
model.meta.counts.supplementalRelationships=relationships.length;

const checks=audit.checks.filter(c=>!['AUD-020','AUD-021','AUD-022'].includes(c.id));
checks.push(
{id:'AUD-020',label:'Family-supplied supplement is provenance-separated from v10',pass:/OUTSIDE v10 CONTROLLING CORPUS/i.test(model.familySupplement.authority),detail:model.familySupplement.evidenceRule},
{id:'AUD-021',label:'Named living descendants replace aggregate display placeholder without deleting source row',pass:model.familySupplement.people.length===5&&model.people.some(p=>p.id==='P-CURRENT-RAHE-CHILDREN')&&model.meta.counts.displayPeople===74,detail:'5 named family-supplied people added; canonical aggregate row retained but superseded in display.'},
{id:'AUD-022',label:'Hardesty branch does not invent an unidentified spouse',pass:model.familySupplement.people.some(p=>p.id==='P-AIMEE-MICHELLE-RAHE-HARDESTY')&&!model.familySupplement.relationships.some(r=>r.type==='spouse'),detail:model.familySupplement.hardestyRule}
);
audit.version='11.5';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,canonicalPeople:model.meta.counts.canonicalPeople,supplementalPeople:people.length,displayPeople:model.meta.counts.displayPeople,supplementalRelationships:relationships.length,auditPass:audit.pass},null,2));
