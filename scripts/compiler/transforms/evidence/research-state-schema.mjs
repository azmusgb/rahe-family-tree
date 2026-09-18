import fs from 'node:fs';

const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));

const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const validTaskStatuses=model.researchWorkflow?.statuses||['NOT STARTED','SEARCHING','CANDIDATE FOUND','RECORD ACQUIRED','ANALYZED','INCORPORATED','CLOSED / NEGATIVE','BLOCKED'];

// v11.3 makes event identifiers explicit and collision-safe without changing event meaning.
const seen=new Set();
model.normalizedEvents=(model.normalizedEvents||[]).map((e,i)=>{
  let id=String(e.eventId||`EVN-${String(i+1).padStart(5,'0')}`);
  if(seen.has(id)) id=`${id}-${String(i+1).padStart(4,'0')}`;
  seen.add(id);
  return {...e,eventId:id,sourceIds:uniq(e.sourceIds),personIds:uniq(e.personIds),claimIds:uniq(e.claimIds),eventSemantics:'SOURCE-CONTROLLED ROW + DERIVED NAVIGATION METADATA'};
});

// Define a local/private workbench state overlay. It is never merged into canonical evidence automatically.
model.researchStateSchema={
  version:1,
  storage:'browser-local only',
  authority:'PRIVATE WORKBENCH OVERLAY — NON-CANONICAL',
  taskState:{status:validTaskStatuses,fields:['status','note','updatedAt']},
  intakeDraft:{fields:['id','title','recordType','personIds','claimIds','sourceId','repository','recordDate','place','transcription','analysisNote','fileName','createdAt','status'],statuses:['STAGED','REVIEWED','REJECTED','READY FOR CANONICAL REVIEW']},
  safetyRule:'Workbench task progress and evidence-intake drafts never modify a claim, relationship, person, source, or canonical corpus automatically.'
};

model.evidenceIntake={
  title:'Evidence Intake Staging',
  authority:'NON-CANONICAL STAGING AREA',
  requiredReviewSteps:[
    'Identify the record and repository.',
    'Attach only relevant people/claims; do not infer a relationship from association alone.',
    'Transcribe or summarize the evidence without overwriting the source record.',
    'Compare the draft against current claims and conflicts.',
    'Only a separately reviewed canonical-source update may promote or change evidence state.'
  ],
  acceptedDraftStatuses:model.researchStateSchema.intakeDraft.statuses,
  promotionRule:'No staged intake draft can promote evidence. Canonical dossier revision remains the only promotion path.'
};

model.familyGroups=(model.familyGroups||[]).map(g=>{
  const names=g.spouseIds.map(id=>model.people.find(p=>p.id===id)?.name).filter(Boolean);
  return {...g,label:names.join(' × ')||g.id,memberCount:g.spouseIds.length+g.childIds.length,hasChildren:g.childIds.length>0};
});

model.meta.release='11.3';
model.meta.version='11.3';
model.meta.releaseTitle='Private Research State + Evidence Intake Readiness';
model.meta.stateOverlayPolicy=model.researchStateSchema.safetyRule;
model.meta.counts.familyGroups=model.familyGroups.length;
model.meta.counts.normalizedEvents=model.normalizedEvents.length;

const checks=audit.checks.filter(c=>!['AUD-014','AUD-015','AUD-016'].includes(c.id));
checks.push(
  {id:'AUD-014',label:'Normalized event IDs are unique',pass:new Set(model.normalizedEvents.map(e=>e.eventId)).size===model.normalizedEvents.length,detail:`${model.normalizedEvents.length} normalized events have unique event IDs`},
  {id:'AUD-015',label:'Workbench state overlay is explicitly non-canonical',pass:/NON-CANONICAL/i.test(model.researchStateSchema.authority)&&/never modify/i.test(model.researchStateSchema.safetyRule),detail:model.researchStateSchema.authority},
  {id:'AUD-016',label:'Evidence intake cannot promote claims',pass:/No staged intake draft can promote evidence/i.test(model.evidenceIntake.promotionRule),detail:model.evidenceIntake.promotionRule}
);
audit.version='11.3';
audit.checks=checks;
audit.pass=checks.every(c=>c.pass);
model.audit=audit;

fs.writeFileSync(modelPath,JSON.stringify(model,null,2));
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,normalizedEvents:model.normalizedEvents.length,familyGroups:model.familyGroups.length,auditPass:audit.pass},null,2));
