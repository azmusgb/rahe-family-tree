import fs from 'node:fs';
const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));

const provenance='FAMILY-SUPPLIED SUPPLEMENT — OUTSIDE v10 CONTROLLING CORPUS';
const living=(id,name,aliases,branch,role)=>({id,name,aliases,branch,dates:'Living / birth details withheld',role,state:'SUPPORTED / family-established',stateTokens:['SUPPORTED'],living:true,references:[],sourceLocation:null,provenance});
const people=[
  living('P-AIMEE-MICHELLE-RAHE-HARDESTY','Aimee Hardesty',['Aimee Hardesty','Aimee Michelle Rahe','Aimee Rahe Hardesty'],'Rahe/Hardesty','daughter of William John Rahe Jr. + Kathleen Ann Dennewitz Rahe; spouse Walter T. Hardesty Sr.'),
  living('P-WALTER-T-HARDESTY-SR','Walter T. Hardesty Sr.',['Walter T Hardesty Sr','Walter T. Hardesty Sr.'],'Hardesty','spouse Aimee Hardesty; father of Elizabeth A. Hardesty and Walter Hardesty Jr.'),
  living('P-ELIZABETH-A-HARDESTY','Elizabeth A. Hardesty',['Elizabeth A Hardesty','Elizabeth A. Hardesty'],'Hardesty','child of Walter T. Hardesty Sr. + Aimee Hardesty'),
  living('P-WALTER-HARDESTY-JR','Walter Hardesty Jr.',['Walter Hardesty Jr','Walter Hardesty Jr.'],'Hardesty','child of Walter T. Hardesty Sr. + Aimee Hardesty'),
  living('P-WILLIAM-JOHN-RAHE-IV','William John Rahe IV',['William John Rahe IV'],'Rahe','child of William John Rahe III + Melissa Rahe'),
  living('P-ABEL-M-RAHE','Abel M. Rahe',['Abel M. Rahe'],'Rahe','child of William John Rahe III + Melissa Rahe'),
  living('P-OWEN-G-RAHE','Owen G. Rahe',['Owen G. Rahe'],'Rahe','child of William John Rahe III + Melissa Rahe'),
  living('P-DECLAN-S-RAHE','Declan S. Rahe',['Declan S. Rahe'],'Rahe','child of William John Rahe III + Melissa Rahe')
];
const parent=(id,from,to,role)=>({id,type:'parent-child',from,to,role,state:'SUPPORTED / family-established',active:true,stateTokens:['SUPPORTED'],claimIds:[],sourceIds:[],source:null,provenance});
const spouse=(id,from,to)=>({id,type:'spouse',from,to,role:'spouse',state:'SUPPORTED / family-established',active:true,stateTokens:['SUPPORTED'],claimIds:[],sourceIds:[],source:null,provenance});
const relationships=[
  parent('SUP-REL-001','P-WILLIAM-JOHN-RAHE-JR','P-AIMEE-MICHELLE-RAHE-HARDESTY','father → daughter'),
  parent('SUP-REL-002','P-KATHLEEN-ANN-DENNEWITZ-RAHE','P-AIMEE-MICHELLE-RAHE-HARDESTY','mother → daughter'),
  spouse('SUP-REL-003','P-AIMEE-MICHELLE-RAHE-HARDESTY','P-WALTER-T-HARDESTY-SR'),
  parent('SUP-REL-004','P-AIMEE-MICHELLE-RAHE-HARDESTY','P-ELIZABETH-A-HARDESTY','mother → daughter'),
  parent('SUP-REL-005','P-WALTER-T-HARDESTY-SR','P-ELIZABETH-A-HARDESTY','father → daughter'),
  parent('SUP-REL-006','P-AIMEE-MICHELLE-RAHE-HARDESTY','P-WALTER-HARDESTY-JR','mother → son'),
  parent('SUP-REL-007','P-WALTER-T-HARDESTY-SR','P-WALTER-HARDESTY-JR','father → son'),
  parent('SUP-REL-008','P-WILLIAM-JOHN-RAHE-III','P-WILLIAM-JOHN-RAHE-IV','father → child'),
  parent('SUP-REL-009','P-MELISSA-RAHE','P-WILLIAM-JOHN-RAHE-IV','mother → child'),
  parent('SUP-REL-010','P-WILLIAM-JOHN-RAHE-III','P-ABEL-M-RAHE','father → child'),
  parent('SUP-REL-011','P-MELISSA-RAHE','P-ABEL-M-RAHE','mother → child'),
  parent('SUP-REL-012','P-WILLIAM-JOHN-RAHE-III','P-OWEN-G-RAHE','father → child'),
  parent('SUP-REL-013','P-MELISSA-RAHE','P-OWEN-G-RAHE','mother → child'),
  parent('SUP-REL-014','P-WILLIAM-JOHN-RAHE-III','P-DECLAN-S-RAHE','father → child'),
  parent('SUP-REL-015','P-MELISSA-RAHE','P-DECLAN-S-RAHE','mother → child')
];
model.familySupplement={
  version:2,
  authority:provenance,
  evidenceRule:'These living-family identities and relationships were supplied directly by the family/user after v10. They are displayed as family-established supplemental facts and are not represented as if they originated in the v10 source document.',
  privacyRule:'Public display withholds living-person birth dates and years, even when supplied in a family screenshot.',
  aggregateReplacement:{canonicalPersonId:'P-CURRENT-RAHE-CHILDREN',displayTreatment:'SUPERSEDED IN UI BY NAMED FAMILY-SUPPLIED CHILDREN; canonical row retained in model for traceability.'},
  hardestyRule:'The family screenshot directly supports Walter T. Hardesty Sr. as Aimee Hardesty’s spouse and shows Elizabeth A. Hardesty and Walter Hardesty Jr. as their children. Only fully visible named family members are added; partially cropped people are not inferred.',
  people,relationships,
  familyGroups:[
    {id:'SUP-FG-001',label:'William John Rahe Jr. × Kathleen Ann Dennewitz Rahe',branch:'Rahe/Dennewitz',spouseIds:['P-WILLIAM-JOHN-RAHE-JR','P-KATHLEEN-ANN-DENNEWITZ-RAHE'],childIds:['P-WILLIAM-JOHN-RAHE-III','P-AIMEE-MICHELLE-RAHE-HARDESTY'],state:'SUPPORTED / family-established',supplemental:true},
    {id:'SUP-FG-002',label:'Aimee Hardesty × Walter T. Hardesty Sr.',branch:'Rahe/Hardesty',spouseIds:['P-AIMEE-MICHELLE-RAHE-HARDESTY','P-WALTER-T-HARDESTY-SR'],childIds:['P-ELIZABETH-A-HARDESTY','P-WALTER-HARDESTY-JR'],state:'SUPPORTED / family-established',supplemental:true},
    {id:'SUP-FG-003',label:'William John Rahe III × Melissa Rahe',branch:'Rahe',spouseIds:['P-WILLIAM-JOHN-RAHE-III','P-MELISSA-RAHE'],childIds:['P-WILLIAM-JOHN-RAHE-IV','P-ABEL-M-RAHE','P-OWEN-G-RAHE','P-DECLAN-S-RAHE'],state:'SUPPORTED / family-established',supplemental:true}
  ]
};
model.meta.release='11.5';model.meta.version='11.5';model.meta.releaseTitle='Named Living-Family Supplement + Complete Visible Hardesty Branch';
model.meta.counts.canonicalPeople=model.people.length;
model.meta.counts.supplementalPeople=people.length;
model.meta.counts.displayPeople=model.people.filter(p=>p.id!=='P-CURRENT-RAHE-CHILDREN').length+people.length;
model.meta.counts.canonicalRelationships=model.relationships.length;
model.meta.counts.supplementalRelationships=relationships.length;

const checks=audit.checks.filter(c=>!['AUD-020','AUD-021','AUD-022'].includes(c.id));
checks.push(
{id:'AUD-020',label:'Family-supplied supplement is provenance-separated from v10',pass:/OUTSIDE v10 CONTROLLING CORPUS/i.test(model.familySupplement.authority),detail:model.familySupplement.evidenceRule},
{id:'AUD-021',label:'Named living descendants replace aggregate display placeholder without deleting source row',pass:model.familySupplement.people.length===8&&model.people.some(p=>p.id==='P-CURRENT-RAHE-CHILDREN')&&model.meta.counts.displayPeople===77,detail:'8 named family-supplied people added; canonical aggregate row retained but superseded in display.'},
{id:'AUD-022',label:'Hardesty spouse and visible children are explicit without inferring cropped people',pass:model.familySupplement.people.some(p=>p.id==='P-WALTER-T-HARDESTY-SR')&&model.familySupplement.relationships.some(r=>r.type==='spouse'&&r.from==='P-AIMEE-MICHELLE-RAHE-HARDESTY'&&r.to==='P-WALTER-T-HARDESTY-SR')&&['P-ELIZABETH-A-HARDESTY','P-WALTER-HARDESTY-JR'].every(id=>model.familySupplement.people.some(p=>p.id===id)),detail:model.familySupplement.hardestyRule}
);
audit.version='11.5';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,canonicalPeople:model.meta.counts.canonicalPeople,supplementalPeople:people.length,displayPeople:model.meta.counts.displayPeople,supplementalRelationships:relationships.length,auditPass:audit.pass},null,2));
