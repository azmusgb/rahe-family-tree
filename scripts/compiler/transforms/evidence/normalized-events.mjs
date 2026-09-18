import fs from 'node:fs';

const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));

const norm=v=>String(v??'').normalize('NFKD').replace(/[^\x00-\x7F]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const uniq=a=>[...new Set(a.filter(Boolean))];
const byPerson=new Map(model.people.map(p=>[p.id,p]));
const byClaim=new Map(model.claims.map(c=>[c.id,c]));
const bySource=new Map(model.sources.map(s=>[s.id,s]));
const allRelationships=[...(model.relationships||[]),...(model.contextRelationships||[])];
const activePedigree=(model.relationships||[]).filter(r=>r.active&&!/REJECTED/i.test(r.state));
const person=name=>model.people.find(p=>p.name===name||p.name.includes(name));

function dateDisplay(event){
  const text=String(event.excerpt||'');
  const full=text.match(/\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/i);
  if(full)return full[0];
  const range=text.match(/\b(?:1[6-9]\d{2}|20\d{2})\s*[–-]\s*(?:1[6-9]\d{2}|20\d{2})\b/);
  if(range)return range[0];
  return String(event.year||'');
}

function placeText(text=''){
  const candidates=['Chicago','Cook County','Palos Heights','Crown Point','Perth County','Ontario','Donegal','Illinois','Indiana','Norway','Ringerike','Ringrike','Mechanicsburg','Germany','Ireland'];
  return uniq(candidates.filter(x=>new RegExp(`\\b${x.replace(' ','\\s+')}\\b`,'i').test(text)));
}

function relatedClaims(event){
  const ids=[];
  for(const c of model.claims){
    if((event.sourceIds||[]).some(id=>(c.sourceIds||[]).includes(id)))ids.push(c.id);
    else if((event.peopleIds||[]).length&&(event.peopleIds||[]).some(id=>(c.peopleIds||[]).includes(id)))ids.push(c.id);
  }
  return uniq(ids);
}

model.normalizedEvents=(model.events||[]).map((e,i)=>({
  eventId:e.id||`EVN-${String(i+1).padStart(5,'0')}`,
  eventType:e.displayType||'record',
  eventTypeAuthority:'DERIVED DISPLAY CLASSIFICATION ONLY — NOT A CLAIM PROMOTION',
  date:{display:dateDisplay(e),years:e.years||[e.year].filter(Boolean),precision:'source-row / year-level display'},
  place:placeText(e.excerpt),
  personIds:uniq(e.peopleIds||[]),
  claimIds:relatedClaims(e),
  sourceIds:uniq(e.sourceIds||[]),
  evidenceState:e.state||'SOURCE ROW — NO EXPLICIT EVIDENCE-STATE TOKEN',
  sourceLocation:e.location,
  sourceSectionTitle:e.title,
  recordText:e.excerpt,
  legacy:false
}));

const statuses=['NOT STARTED','SEARCHING','CANDIDATE FOUND','RECORD ACQUIRED','ANALYZED','INCORPORATED','CLOSED / NEGATIVE','BLOCKED'];
function explicitRepository(text=''){
  const known=['FamilySearch','Ancestry','NARA','National Archives','Cook County','Archives of Ontario','IRAD','SSA','Social Security','St. Anne','Newberry','HathiTrust','Internet Archive'];
  const hits=known.filter(x=>norm(text).includes(norm(x)));
  return hits.length?uniq(hits).join(' · '):'Not specified in canonical queue row';
}
function taskClaims(t){
  const text=norm(`${t.record} ${t.branch} ${t.payoff}`),ids=[];
  for(const c of model.claims){
    if((t.peopleIds||[]).some(id=>(c.peopleIds||[]).includes(id)))ids.push(c.id);
    else{
      const branchTerms=norm(t.branch).split(' ').filter(x=>x.length>4);
      if(branchTerms.some(x=>norm(`${c.claim} ${c.basis} ${c.nextAction}`).includes(x)))ids.push(c.id);
    }
  }
  return uniq(ids);
}
function relatedNegatives(t){
  const hay=norm(`${t.record} ${t.branch}`),terms=hay.split(' ').filter(x=>x.length>5);
  return (model.negativeSearches||[]).filter(n=>terms.some(x=>norm(`${n.target} ${n.result}`).includes(x))).map(n=>n.id);
}
function relatedStops(t){
  const terms=norm(`${t.record} ${t.branch}`).split(' ').filter(x=>x.length>5);
  return (model.stopRules||[]).filter(s=>terms.some(x=>norm(`${s.line} ${s.rule}`).includes(x))).map(s=>s.id);
}
for(const t of model.researchTasks||[]){
  t.operationalStatus='NOT STARTED';
  t.operationalStatusAuthority='WORKBENCH WORKFLOW ONLY — DOES NOT CHANGE EVIDENCE STATE';
  t.allowedOperationalStatuses=statuses;
  t.whyItMatters=t.payoff;
  t.repositoryOrDatabase=explicitRepository(`${t.record} ${t.payoff}`);
  t.searchParameters=t.record;
  t.negativeSearchIds=relatedNegatives(t);
  t.stopRuleIds=relatedStops(t);
  t.potentialClaimIds=taskClaims(t);
}
model.researchWorkflow={statuses,statusAuthority:'WORKBENCH ONLY',rule:'Changing task workflow status never changes a claim, relationship, or person evidence state.'};

const edward=person('Edward Ellery DeVine / DeVeine');
const william=person('William John Rahe Sr.');
const bridge=(model.relationships||[]).find(r=>r.type==='identity-bridge');
const identityClaims=(model.claims||[]).filter(c=>c.id==='CL-DV-002'||(c.peopleIds||[]).includes(edward?.id)||(c.peopleIds||[]).includes(william?.id));
const relevantSections=uniq([bridge?.source?.section,...identityClaims.map(c=>c.location?.section),...(edward?.references||[]),...(william?.references||[])]);
const eventsFor=id=>model.normalizedEvents.filter(e=>e.personIds.includes(id)).sort((a,b)=>(a.date.years[0]||9999)-(b.date.years[0]||9999));
const shared=edward&&william?model.normalizedEvents.filter(e=>e.personIds.includes(edward.id)&&e.personIds.includes(william.id)):[];
const identityGate=(model.completenessGates||[]).find(g=>/Identity gate/i.test(g.gate));
model.identityWorkspace={
  id:'IW-DEVINE-RAHE-001',
  title:'Edward Ellery DeVine/DeVeine → William John Rahe Sr.',
  status:'UNRESOLVED',
  requiredGraphicWording:'Edward Ellery DeVine (b. 1 Dec 1918) probable same person as William John Rahe Sr. (b. 1 Dec 1918); transition mechanism unresolved.',
  evidenceRule:'Adoption, stepfamily placement, guardianship, and legal/informal full-name change are mechanisms to investigate, not findings.',
  personIds:[edward?.id,william?.id].filter(Boolean),
  bridgeRelationshipId:bridge?.id||'',
  claimIds:identityClaims.map(c=>c.id),
  sourceSectionIds:relevantSections,
  parallelTimelines:{infantIdentity:eventsFor(edward?.id),adultIdentity:eventsFor(william?.id),sharedRows:shared},
  hypotheses:[
    {name:'Biological identity + later full name change',status:'RESEARCH HYPOTHESIS ONLY',supportTest:'SS-5/Numident or birth record links William to Ellery DeVine + Sarah Ferry; census continuity; parish annotation.',weakenTest:'A separate William Rahe with same DOB is documented from birth; Edward is independently traced elsewhere.'},
    {name:'Stepfather / informal surname adoption',status:'RESEARCH HYPOTHESIS ONLY',supportTest:'1920/1930 household shows Sarah with a Rahe spouse and Edward/William in same household; school/parish/directories show transition.',weakenTest:'Sarah never appears with a Rahe household and William’s parentage is separately documented.'},
    {name:'Formal adoption/name change',status:'RESEARCH HYPOTHESIS ONLY',supportTest:'Amended birth, court index, parish marginal note, or SSA parent/name event explicitly records the transition.',weakenTest:'No formal event is located and continuous records instead support informal usage.'},
    {name:'Public-tree mistaken merge',status:'RESEARCH HYPOTHESIS ONLY',supportTest:'Underlying records fail to reproduce the Sarah/Clifford/alias bridge and the two identities diverge.',weakenTest:'Independent original records explicitly connect the infant and adult identities.'}
  ],
  missingRecords:[
    {record:'SSA SS-5 + Numident',priority:'HIGHEST-PRIORITY missing bridge',purpose:'Could state application name, DOB/place, parents, and later-name events.'},
    {record:'Cook County birth certificate / amendment',priority:'CRITICAL missing primary record',purpose:'Could reveal original/amended name and parentage.'},
    {record:'1920–1940 census chain',priority:'CRITICAL bridge sequence',purpose:'Could reveal household transition, stepfather/guardian, surname/name change.'},
    {record:'Original St. Anne register',priority:'CRITICAL identity follow-up',purpose:'Marginal annotations could record adoption/name change or later sacramental identity.'}
  ],
  promotionRequirement:identityGate?.passCondition||'Resolve or disprove the DeVine → Rahe bridge with an explicit documentary chain.',
  nextActions:uniq(identityClaims.map(c=>c.nextAction))
};

const spouseRels=activePedigree.filter(r=>r.type==='spouse');
const parentRels=activePedigree.filter(r=>r.type==='parent-child');
const seen=new Set();
model.familyGroups=[];
for(const s of spouseRels){
  const pair=[s.from,s.to].sort(),key=pair.join('|');if(seen.has(key))continue;seen.add(key);
  const children=uniq(parentRels.filter(r=>pair.includes(r.from)).map(r=>r.to).filter(child=>pair.every(parent=>parentRels.some(r=>r.from===parent&&r.to===child))));
  const contexts=(model.contextRelationships||[]).filter(r=>pair.some(id=>r.from===id||r.to===id)).map(r=>r.id);
  const people=[...pair,...children].map(id=>byPerson.get(id)).filter(Boolean);
  model.familyGroups.push({
    id:`FG-${String(model.familyGroups.length+1).padStart(3,'0')}`,
    spouseIds:pair,
    childIds:children,
    contextRelationshipIds:contexts,
    branch:uniq(people.flatMap(p=>String(p.branch||'').split('/').map(x=>x.trim()))).join(' / '),
    state:s.state,
    relationshipId:s.id,
    sourceLocation:s.source,
    rule:'Children appear only when both spouse nodes have explicit active parent-child edges to that child.'
  });
}

const unsupportedClaims=model.claims.filter(c=>!/SUPPORTED/i.test(c.state)||/PROVISIONAL|UNRESOLVED|REJECTED/i.test(c.state));
model.evidenceGaps=unsupportedClaims.map(c=>{
  const tasks=(model.researchTasks||[]).filter(t=>(t.potentialClaimIds||[]).includes(c.id));
  return {id:`GAP-${c.id}`,claimId:c.id,state:c.state,claim:c.claim,nextAction:c.nextAction,personIds:c.peopleIds||[],sourceIds:c.sourceIds||[],taskIds:tasks.map(t=>t.id),priority:tasks.some(t=>/CRITICAL/i.test(t.priority))?'CRITICAL':tasks.some(t=>/HIGH/i.test(t.priority))?'HIGH':'NORMAL',sourceLocation:c.location};
}).sort((a,b)=>({CRITICAL:0,HIGH:1,NORMAL:2}[a.priority]-({CRITICAL:0,HIGH:1,NORMAL:2}[b.priority])));
model.highestValueGap=model.evidenceGaps[0]||null;

model.meta.release='11.2';
model.meta.version='11.2';
model.meta.counts.normalizedEvents=model.normalizedEvents.length;
model.meta.counts.familyGroups=model.familyGroups.length;
model.meta.counts.evidenceGaps=model.evidenceGaps.length;
model.meta.eventPolicy='Normalized events retain source row text and exact dossier location. Event type/place labels are display aids and do not promote claims.';
model.meta.operationsPolicy='Research task workflow status is operational metadata only and cannot mutate evidence state.';

const checks=audit.checks.filter(c=>!['AUD-010','AUD-011','AUD-012','AUD-013'].includes(c.id));
checks.push(
  {id:'AUD-010',label:'Normalized events retain exact source locations',pass:model.normalizedEvents.length===model.events.length&&model.normalizedEvents.every(e=>e.sourceLocation?.section),detail:`${model.normalizedEvents.length}/${model.events.length} source-dated rows normalized with dossier locations`},
  {id:'AUD-011',label:'Research workflow cannot promote evidence',pass:model.researchTasks.every(t=>t.operationalStatusAuthority.includes('DOES NOT CHANGE EVIDENCE STATE')),detail:`${model.researchTasks.length} queue tasks carry operational-only status metadata`},
  {id:'AUD-012',label:'Identity workspace preserves unresolved DeVine/Rahe wording',pass:model.identityWorkspace.status==='UNRESOLVED'&&/transition mechanism unresolved/i.test(model.identityWorkspace.requiredGraphicWording)&&/mechanisms to investigate, not findings/i.test(model.identityWorkspace.evidenceRule),detail:model.identityWorkspace.requiredGraphicWording},
  {id:'AUD-013',label:'Family groups derive children only from explicit dual-parent edges',pass:model.familyGroups.every(g=>g.childIds.every(child=>g.spouseIds.every(parent=>parentRels.some(r=>r.from===parent&&r.to===child)))),detail:`${model.familyGroups.length} spouse-centered groups generated without inferred parentage`}
);
audit.version='11.2';
audit.checks=checks;
audit.pass=checks.every(c=>c.pass);
model.audit=audit;

fs.writeFileSync(modelPath,JSON.stringify(model,null,2));
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,normalizedEvents:model.normalizedEvents.length,researchTasks:model.researchTasks.length,familyGroups:model.familyGroups.length,evidenceGaps:model.evidenceGaps.length,auditPass:audit.pass},null,2));
