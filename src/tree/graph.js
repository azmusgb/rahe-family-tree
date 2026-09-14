import{connectedComponent,generationLanes,usableRelationships,controllingState}from'../../canonical-graph-engine.js';

const FAMILY_TYPES=new Set(['parent-child','direct-line-succession','spouse']);
const STRUCTURAL_TYPES=new Set(['parent-child','direct-line-succession']);
const clean=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const branchesFor=person=>{
  const raw=Array.isArray(person?.branches)?person.branches:[person?.branch];
  return raw.flatMap(value=>String(value||'').split('/')).map(value=>value.trim()).filter(Boolean);
};

export function familyRelationships(relationships=[]){
  return usableRelationships(relationships,{includeContext:false}).filter(rel=>FAMILY_TYPES.has(rel.type));
}

export function buildFamilyGraph(people=[],relationships=[]){
  const nodes=new Map(people.filter(Boolean).map(person=>[person.id,person]));
  const rels=familyRelationships(relationships).filter(rel=>nodes.has(rel.from)&&nodes.has(rel.to));
  const adjacency=new Map([...nodes.keys()].map(id=>[id,new Set()]));
  for(const rel of rels){adjacency.get(rel.from)?.add(rel.to);adjacency.get(rel.to)?.add(rel.from);}
  const components=[],seen=new Set();
  for(const id of nodes.keys()){
    if(seen.has(id))continue;
    const ids=connectedComponent(id,rels,{includeContext:false});
    if(!ids.size)ids.add(id);
    const visible=new Set([...ids].filter(personId=>nodes.has(personId)));
    visible.add(id);for(const personId of visible)seen.add(personId);
    components.push({ids:visible,members:[...visible].map(personId=>nodes.get(personId)).filter(Boolean)});
  }
  return{nodes,relationships:rels,adjacency,components};
}

function distances(seed,ids,adjacency){
  const out=new Map([[seed,0]]),queue=[seed];
  for(let i=0;i<queue.length;i++)for(const next of adjacency.get(queue[i])||[])if(ids.has(next)&&!out.has(next)){out.set(next,out.get(queue[i])+1);queue.push(next);}
  return out;
}

export function componentScore(component,graph){
  const ids=component.ids,rels=graph.relationships.filter(rel=>ids.has(rel.from)&&ids.has(rel.to));
  const branches=new Set(component.members.flatMap(branchesFor));
  const supported=rels.filter(rel=>controllingState(rel)==='SUPPORTED').length;
  const structural=rels.filter(rel=>STRUCTURAL_TYPES.has(rel.type)).length;
  const historical=component.members.filter(person=>!person.living).length;
  const lanes=generationLanes(rels,[...ids]),values=[...lanes.values()];
  const span=values.length?Math.max(...values)-Math.min(...values):0;
  return component.members.length*1_000_000+branches.size*60_000+structural*6_000+supported*1_200+historical*80+span*400;
}

export function bestAnchor(component,graph){
  if(!component?.members?.length)return null;
  const ids=component.ids,rels=graph.relationships.filter(rel=>ids.has(rel.from)&&ids.has(rel.to));
  const lanes=generationLanes(rels,[...ids]),laneValues=[...lanes.values()];
  const laneMid=laneValues.length?(Math.min(...laneValues)+Math.max(...laneValues))/2:0;
  const score=person=>{
    const dist=distances(person.id,ids,graph.adjacency),reachable=dist.size,total=[...dist.values()].reduce((sum,value)=>sum+value,0),eccentricity=Math.max(0,...dist.values());
    const incident=rels.filter(rel=>rel.from===person.id||rel.to===person.id);
    const structural=incident.filter(rel=>STRUCTURAL_TYPES.has(rel.type)).length;
    const supported=incident.filter(rel=>controllingState(rel)==='SUPPORTED').length;
    const branchSpread=new Set(incident.map(rel=>graph.nodes.get(rel.from===person.id?rel.to:rel.from)).filter(Boolean).flatMap(branchesFor)).size;
    const centrality=reachable>1?Math.round((reachable-1)*10_000/Math.max(1,total)):0;
    const lanePenalty=Math.abs((lanes.get(person.id)||0)-laneMid);
    return centrality*100+incident.length*500+structural*260+supported*90+branchSpread*80+(person.living?0:25)-eccentricity*40-lanePenalty*20;
  };
  return component.members.slice().sort((a,b)=>score(b)-score(a)||clean(a.name).localeCompare(clean(b.name))||String(a.id).localeCompare(String(b.id)))[0]||null;
}

export function chooseDefaultAnchor(graph){
  const component=graph.components.slice().sort((a,b)=>componentScore(b,graph)-componentScore(a,graph)||clean(a.members[0]?.name).localeCompare(clean(b.members[0]?.name)))[0];
  return component?bestAnchor(component,graph):null;
}

export function spouseUnits(graph){
  const units=[];
  for(const rel of graph.relationships.filter(rel=>rel.type==='spouse')){
    const laneMap=generationLanes(graph.relationships,[rel.from,rel.to]);
    units.push({id:rel.id||`couple:${[rel.from,rel.to].sort().join(':')}`,people:[rel.from,rel.to],lane:Math.min(laneMap.get(rel.from)||0,laneMap.get(rel.to)||0),evidenceState:controllingState(rel)});
  }
  return units;
}
