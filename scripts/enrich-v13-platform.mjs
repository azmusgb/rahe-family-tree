import fs from 'node:fs';
import crypto from 'node:crypto';

const modelPath='public/research-model.json';
const corpusPath='public/corpus.json';
const auditPath='public/semantic-audit.json';
const graphPath='public/canonical-graph.json';
const provenancePath='public/provenance-index.json';
const diffPath='public/canonical-diff.json';

const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const corpus=JSON.parse(fs.readFileSync(corpusPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));

const norm=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^\x00-\x7F]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const hash=value=>crypto.createHash('sha256').update(String(value)).digest('hex').slice(0,12).toUpperCase();
const stateOf=value=>{
  const text=String(value?.controllingState||value?.state||value?.evidenceState||'').toUpperCase();
  return ['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED'].find(x=>text.includes(x))||'UNRESOLVED';
};
const locOf=value=>value?.sourceLocation||value?.source||value?.location||null;
const sourceIdsOf=value=>[...new Set([...(value?.sourceIds||[]),...(String(value?.basis||value?.source?.basis||'').match(/\b[CWV]\d{3}\b/g)||[])])];
const uniq=values=>[...new Set(values.filter(Boolean))];
const allPeople=[...(model.people||[]),...(model.familySupplement?.people||[])];
const allRelationships=[...(model.relationships||[]),...(model.familySupplement?.relationships||[]),...(model.contextRelationships||[])];
const peopleById=new Map(allPeople.map(x=>[x.id,x]));
const sourcesById=new Map((model.sources||[]).map(x=>[x.id,x]));

const placeMap=new Map();
for(const event of model.normalizedEvents||[]){
  for(const label of event.place||[]){
    const key=norm(label);
    if(!key)continue;
    if(!placeMap.has(key))placeMap.set(key,{id:`PLACE-${hash(key)}`,label:String(label).trim(),eventIds:[],personIds:[],years:[],sourceLocations:[]});
    const p=placeMap.get(key);
    p.eventIds.push(event.eventId);
    p.personIds.push(...(event.personIds||[]));
    p.years.push(...(event.date?.years||[]));
    if(event.sourceLocation)p.sourceLocations.push(event.sourceLocation);
  }
}
const places=[...placeMap.values()].map(p=>({...p,eventIds:uniq(p.eventIds),personIds:uniq(p.personIds),years:uniq(p.years).sort((a,b)=>a-b),sourceLocations:p.sourceLocations}));
const placeIdByNorm=new Map(places.map(p=>[norm(p.label),p.id]));

const households=[];
for(const event of model.normalizedEvents||[]){
  const text=`${event.eventType||''} ${event.sourceSectionTitle||''} ${event.recordText||''}`;
  if(!/census|household|residen|directory|address/i.test(text))continue;
  const memberIds=uniq(event.personIds||[]).filter(id=>peopleById.has(id));
  if(!memberIds.length)continue;
  const year=event.date?.years?.[0]||null;
  const sourceKey=`${event.sourceLocation?.section||''}:${event.sourceLocation?.row??''}:${event.eventId}`;
  households.push({
    id:`HH-${hash(sourceKey)}`,
    eventId:event.eventId,
    year,
    placeLabels:[...(event.place||[])],
    memberIds,
    sourceLocation:event.sourceLocation||null,
    evidenceState:stateOf(event),
    recordText:event.recordText||'',
    rule:'ROW-BOUNDED OBSERVATION ONLY — MEMBERSHIP COMES ONLY FROM EXPLICIT PERSON LINKS ON THE SAME SOURCE EVENT'
  });
}

const familyGroups=[...(model.familyGroups||[]),...(model.familySupplement?.familyGroups||[])];
const nodes=[];
for(const p of allPeople)nodes.push({id:`person:${p.id}`,entityId:p.id,kind:'person',label:p.name,state:stateOf(p),layer:p.provenance?'SUPPLEMENT':'CANONICAL',living:Boolean(p.living)});
for(const f of familyGroups)nodes.push({id:`family:${f.id}`,entityId:f.id,kind:'family-unit',label:f.label||f.id,state:stateOf(f),layer:f.supplemental?'SUPPLEMENT':'CANONICAL'});
for(const c of model.claims||[])nodes.push({id:`claim:${c.id}`,entityId:c.id,kind:'claim',label:c.claim||c.id,state:stateOf(c),layer:'CANONICAL'});
for(const s of model.sources||[])nodes.push({id:`source:${s.id}`,entityId:s.id,kind:'source',label:s.name||s.id,state:'SUPPORTED',layer:'CANONICAL'});
for(const e of model.normalizedEvents||[])nodes.push({id:`event:${e.eventId}`,entityId:e.eventId,kind:'event',label:e.eventType||e.eventId,state:stateOf(e),layer:'CANONICAL'});
for(const p of places)nodes.push({id:`place:${p.id}`,entityId:p.id,kind:'place',label:p.label,state:'UNRESOLVED',layer:'DERIVED-NAVIGATION'});
for(const h of households)nodes.push({id:`household:${h.id}`,entityId:h.id,kind:'household-observation',label:[h.year,...h.placeLabels].filter(Boolean).join(' · ')||h.id,state:h.evidenceState,layer:'DERIVED-NAVIGATION'});
for(const t of model.researchTasks||[])nodes.push({id:`task:${t.id}`,entityId:t.id,kind:'research-task',label:t.record||t.id,state:'UNRESOLVED',layer:'OPERATIONAL'});

const edges=[];
const addEdge=(type,from,to,meta={})=>{
  if(!from||!to)return;
  const signature=`${type}|${from}|${to}|${meta.entityId||''}`;
  edges.push({id:`GE-${hash(signature)}`,type,from,to,...meta});
};
for(const r of allRelationships){
  addEdge(`relationship:${r.type}`,`person:${r.from}`,`person:${r.to}`,{entityId:r.id,evidenceState:stateOf(r),active:r.active!==false&&!/REJECTED/i.test(String(r.state||'')),activePedigree:Boolean(r.activePedigree),layer:r.provenance?'SUPPLEMENT':(model.contextRelationships||[]).some(x=>x.id===r.id)?'CONTEXT':'CANONICAL',sourceIds:sourceIdsOf(r),sourceLocation:locOf(r)});
}
for(const f of familyGroups){
  for(const id of f.spouseIds||[])addEdge('family:spouse',`person:${id}`,`family:${f.id}`,{entityId:f.id,evidenceState:stateOf(f),active:true,layer:f.supplemental?'SUPPLEMENT':'CANONICAL',sourceLocation:f.sourceLocation||null});
  for(const id of f.childIds||[])addEdge('family:child',`family:${f.id}`,`person:${id}`,{entityId:f.id,evidenceState:stateOf(f),active:true,layer:f.supplemental?'SUPPLEMENT':'CANONICAL',sourceLocation:f.sourceLocation||null});
}
for(const c of model.claims||[]){
  for(const id of c.peopleIds||[])addEdge('evidence:person-claim',`person:${id}`,`claim:${c.id}`,{entityId:c.id,evidenceState:stateOf(c),active:true,layer:'CANONICAL',sourceLocation:c.location||null});
  for(const id of c.sourceIds||[])if(sourcesById.has(id))addEdge('evidence:claim-source',`claim:${c.id}`,`source:${id}`,{entityId:c.id,evidenceState:stateOf(c),active:true,layer:'CANONICAL'});
}
for(const e of model.normalizedEvents||[]){
  for(const id of e.personIds||[])if(peopleById.has(id))addEdge('event:person',`person:${id}`,`event:${e.eventId}`,{entityId:e.eventId,evidenceState:stateOf(e),active:true,layer:'CANONICAL',sourceLocation:e.sourceLocation||null});
  for(const label of e.place||[]){const id=placeIdByNorm.get(norm(label));if(id)addEdge('event:place',`event:${e.eventId}`,`place:${id}`,{entityId:e.eventId,evidenceState:stateOf(e),active:true,layer:'DERIVED-NAVIGATION',sourceLocation:e.sourceLocation||null});}
}
for(const h of households){
  addEdge('household:event',`event:${h.eventId}`,`household:${h.id}`,{entityId:h.id,evidenceState:h.evidenceState,active:true,layer:'DERIVED-NAVIGATION',sourceLocation:h.sourceLocation});
  for(const id of h.memberIds)addEdge('household:member',`household:${h.id}`,`person:${id}`,{entityId:h.id,evidenceState:h.evidenceState,active:true,layer:'DERIVED-NAVIGATION',sourceLocation:h.sourceLocation});
}
for(const t of model.researchTasks||[]){
  for(const id of t.peopleIds||[])if(peopleById.has(id))addEdge('research:person-task',`person:${id}`,`task:${t.id}`,{entityId:t.id,evidenceState:'UNRESOLVED',active:false,layer:'OPERATIONAL',sourceLocation:t.sourceLocation||null});
  for(const id of t.potentialClaimIds||[])addEdge('research:claim-task',`claim:${id}`,`task:${t.id}`,{entityId:t.id,evidenceState:'UNRESOLVED',active:false,layer:'OPERATIONAL',sourceLocation:t.sourceLocation||null});
}

const provenance={version:'13.10',authority:'TRACEABILITY ONLY — PROVENANCE NEVER PROMOTES EVIDENCE',entities:{}};
const putProv=(kind,item,extra={})=>{if(!item?.id)return;provenance.entities[item.id]={kind,entityId:item.id,controllingState:stateOf(item),sourceIds:sourceIdsOf(item),claimIds:uniq(item.claimIds||[]),sourceLocation:locOf(item),layer:item.provenance?'SUPPLEMENT':'CANONICAL',...extra};};
for(const p of allPeople)putProv('person',p);
for(const r of allRelationships)putProv('relationship',r,{from:r.from,to:r.to,type:r.type,active:r.active!==false&&!/REJECTED/i.test(String(r.state||''))});
for(const c of model.claims||[])putProv('claim',c,{sourceIds:uniq(c.sourceIds||[]),peopleIds:uniq(c.peopleIds||[])});
for(const s of model.sources||[])putProv('source',s,{sourceLocation:s.location||null});
for(const e of model.normalizedEvents||[])provenance.entities[e.eventId]={kind:'event',entityId:e.eventId,controllingState:stateOf(e),sourceIds:[],claimIds:[],sourceLocation:e.sourceLocation||null,peopleIds:uniq(e.personIds||[]),layer:'CANONICAL'};
for(const t of model.researchTasks||[])putProv('research-task',t,{peopleIds:uniq(t.peopleIds||[]),claimIds:uniq(t.potentialClaimIds||[]),layer:'OPERATIONAL'});
for(const f of familyGroups)putProv('family-unit',f,{peopleIds:uniq([...(f.spouseIds||[]),...(f.childIds||[])]),layer:f.supplemental?'SUPPLEMENT':'CANONICAL'});

function compareById(expected=[],actual=[],state=true){
  const a=new Map(expected.map(x=>[x.id,x])),b=new Map(actual.map(x=>[x.id,x]));
  const missing=[...a.keys()].filter(id=>!b.has(id));
  const extra=[...b.keys()].filter(id=>!a.has(id));
  const stateChanged=[];
  if(state)for(const[id,x]of a){const y=b.get(id);if(y&&stateOf(x)!==stateOf(y))stateChanged.push({id,from:stateOf(x),to:stateOf(y)});}
  return{missing,extra,stateChanged};
}
const canonicalDiff={
  version:'13.10',
  authority:'CANONICAL CORPUS → STRUCTURED MODEL COMPLETENESS DIFF; ZERO-CHANGE DOES NOT PROMOTE EVIDENCE',
  people:compareById(corpus.people||[],model.people||[]),
  relationships:compareById(corpus.relationships||[],model.relationships||[]),
  claims:compareById(corpus.claims||[],model.claims||[]),
  sources:compareById(corpus.sources||[],model.sources||[],false)
};
canonicalDiff.hasCanonicalLoss=[canonicalDiff.people,canonicalDiff.relationships,canonicalDiff.claims,canonicalDiff.sources].some(x=>x.missing.length>0);
canonicalDiff.hasEvidencePromotion=[canonicalDiff.people,canonicalDiff.relationships,canonicalDiff.claims].some(x=>x.stateChanged.some(c=>['PROVISIONAL','UNRESOLVED','REJECTED'].includes(c.from)&&c.to==='SUPPORTED'));

const graph={
  schemaVersion:'13.10',
  authority:'CANONICAL GRAPH IS A READ MODEL; SOURCE-CONTROLLED EVIDENCE STATES REMAIN AUTHORITATIVE',
  nodeKinds:['person','family-unit','claim','source','event','place','household-observation','research-task'],
  edgeKinds:uniq(edges.map(e=>e.type)).sort(),
  nodes,
  edges,
  integrity:{
    duplicateNodeIds:nodes.map(n=>n.id).filter((id,i,a)=>a.indexOf(id)!==i),
    orphanEdges:edges.filter(e=>!nodes.some(n=>n.id===e.from)||!nodes.some(n=>n.id===e.to)).map(e=>e.id),
    activeRejectedEdges:edges.filter(e=>e.active&&e.evidenceState==='REJECTED').map(e=>e.id),
    identityBridgeSafe:(model.relationships||[]).filter(r=>r.type==='identity-bridge').every(r=>stateOf(r)==='UNRESOLVED'&&!r.activePedigree),
    selfPersonEdges:edges.filter(e=>e.from===e.to&&e.from.startsWith('person:')).map(e=>e.id)
  },
  counts:{nodes:nodes.length,edges:edges.length,places:places.length,households:households.length,familyUnits:familyGroups.length}
};
graph.integrity.pass=!graph.integrity.duplicateNodeIds.length&&!graph.integrity.orphanEdges.length&&!graph.integrity.activeRejectedEdges.length&&graph.integrity.identityBridgeSafe&&!graph.integrity.selfPersonEdges.length;

model.platform={
  version:'13.10',
  title:'Canonical Graph + Provenance + Relationship + Research Platform',
  authority:'PRESENTATION / TRACEABILITY / OPERATIONAL LAYER — NEVER SILENTLY MUTATES CANONICAL EVIDENCE',
  features:['canonical-graph','provenance-index','canonical-diff','tree-engine-2','relationship-finder','person-family-dossiers','source-evidence-matrix','research-command-center-2','timeline-geography-households']
};
model.canonicalGraph={schemaVersion:graph.schemaVersion,authority:graph.authority,counts:graph.counts,integrity:graph.integrity,nodeKinds:graph.nodeKinds,edgeKinds:graph.edgeKinds};
model.provenanceIndex=provenance;
model.canonicalDiff=canonicalDiff;
model.geography={version:'13.10',rule:'PLACE LABELS COME ONLY FROM NORMALIZED SOURCE EVENTS; NO COORDINATES OR ROUTES ARE INVENTED',places};
model.households={version:'13.10',rule:'HOUSEHOLD OBSERVATIONS ARE ROW-BOUNDED AND DO NOT INFER MEMBERSHIP ACROSS RECORDS',observations:households};

const checks=[
  ['AUD-090','Canonical graph has no duplicate node IDs',graph.integrity.duplicateNodeIds.length===0,`${graph.integrity.duplicateNodeIds.length} duplicate node IDs`],
  ['AUD-091','Canonical graph has no orphan edges',graph.integrity.orphanEdges.length===0,`${graph.integrity.orphanEdges.length} orphan graph edges`],
  ['AUD-092','Rejected evidence never appears as an active graph edge',graph.integrity.activeRejectedEdges.length===0,`${graph.integrity.activeRejectedEdges.length} active rejected graph edges`],
  ['AUD-093','DeVine/DeVeine identity bridge remains unresolved and non-pedigree',graph.integrity.identityBridgeSafe,'Identity bridge graph semantics preserved'],
  ['AUD-094','Canonical graph has no person self-edges',graph.integrity.selfPersonEdges.length===0,`${graph.integrity.selfPersonEdges.length} self person edges`],
  ['AUD-095','Structured model has no canonical person loss',canonicalDiff.people.missing.length===0,`${canonicalDiff.people.missing.length} missing people`],
  ['AUD-096','Structured model has no canonical relationship loss',canonicalDiff.relationships.missing.length===0,`${canonicalDiff.relationships.missing.length} missing relationships`],
  ['AUD-097','Structured model has no canonical claim loss',canonicalDiff.claims.missing.length===0,`${canonicalDiff.claims.missing.length} missing claims`],
  ['AUD-098','Structured model has no canonical source loss',canonicalDiff.sources.missing.length===0,`${canonicalDiff.sources.missing.length} missing sources`],
  ['AUD-099','Canonical diff detects no silent evidence promotion',!canonicalDiff.hasEvidencePromotion,'No PROVISIONAL/UNRESOLVED/REJECTED → SUPPORTED drift detected']
];
for(const[id,label,pass,detail]of checks){const existing=audit.checks.find(c=>c.id===id);if(existing)Object.assign(existing,{label,pass,detail});else audit.checks.push({id,label,pass,detail});}
audit.version='13.10-platform';
audit.pass=audit.checks.every(x=>x.pass!==false);

fs.writeFileSync(modelPath,JSON.stringify(model,null,2)+'\n');
fs.writeFileSync(graphPath,JSON.stringify(graph,null,2)+'\n');
fs.writeFileSync(provenancePath,JSON.stringify(provenance,null,2)+'\n');
fs.writeFileSync(diffPath,JSON.stringify(canonicalDiff,null,2)+'\n');
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({platform:model.platform.version,graph:graph.counts,graphPass:graph.integrity.pass,canonicalLoss:canonicalDiff.hasCanonicalLoss,evidencePromotion:canonicalDiff.hasEvidencePromotion,auditPass:audit.pass},null,2));
if(!graph.integrity.pass||canonicalDiff.hasCanonicalLoss||canonicalDiff.hasEvidencePromotion||!audit.pass)process.exitCode=1;
