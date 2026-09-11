const STRUCTURAL=new Set(['parent-child','direct-line-succession']);
const PEER=new Set(['spouse','spouse-lead','sibling-context','baptism-sponsor']);

export const controllingState=value=>{
  const text=String(value?.controllingState||value?.state||value?.evidenceState||'').toUpperCase();
  return ['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED'].find(x=>text.includes(x))||'UNRESOLVED';
};

export function usableRelationships(rels=[],{includeContext=true,includeInactive=false}={}){
  return rels.filter(r=>{
    if(!r?.from||!r?.to||r.from===r.to)return false;
    if(controllingState(r)==='REJECTED')return false;
    if(!includeInactive&&r.active===false)return false;
    if(!includeContext&&!STRUCTURAL.has(r.type)&&r.type!=='spouse')return false;
    return true;
  });
}

function hopFor(rel,current,next){
  const structural=STRUCTURAL.has(rel.type);
  let direction='peer',label=rel.type.replaceAll('-',' ');
  if(structural){
    if(rel.from===current&&rel.to===next){direction='down';label='parent of';}
    else{direction='up';label='child of';}
  }else if(rel.type==='spouse'){label='spouse of';}
  else if(rel.type==='spouse-lead'){label='possible spouse of';}
  else if(rel.type==='identity-bridge'){direction='identity';label='unresolved identity bridge to';}
  else if(rel.type==='sibling-context'){label='sibling-context connection to';}
  else if(rel.type==='baptism-sponsor'){label='sponsor/context connection to';}
  return{relationshipId:rel.id,type:rel.type,from:current,to:next,direction,label,evidenceState:controllingState(rel),activePedigree:Boolean(rel.activePedigree),source:rel.source||rel.sourceLocation||null};
}

export function buildAdjacency(rels=[],options={}){
  const map=new Map();
  const add=(id,hop)=>{if(!map.has(id))map.set(id,[]);map.get(id).push(hop);};
  for(const rel of usableRelationships(rels,options)){
    add(rel.from,hopFor(rel,rel.from,rel.to));
    add(rel.to,hopFor(rel,rel.to,rel.from));
  }
  return map;
}

export function connectedComponent(seed,rels=[],options={}){
  if(!seed)return new Set();
  const adjacency=buildAdjacency(rels,options),seen=new Set([seed]),queue=[seed];
  for(let i=0;i<queue.length;i++)for(const hop of adjacency.get(queue[i])||[])if(!seen.has(hop.to)){seen.add(hop.to);queue.push(hop.to);}
  return seen;
}

export function ancestors(seed,rels=[]){
  const active=usableRelationships(rels,{includeContext:false}).filter(r=>STRUCTURAL.has(r.type));
  const seen=new Set([seed]),queue=[seed];
  for(let i=0;i<queue.length;i++)for(const r of active)if(r.to===queue[i]&&!seen.has(r.from)){seen.add(r.from);queue.push(r.from);}
  seen.delete(seed);return seen;
}

export function descendants(seed,rels=[]){
  const active=usableRelationships(rels,{includeContext:false}).filter(r=>STRUCTURAL.has(r.type));
  const seen=new Set([seed]),queue=[seed];
  for(let i=0;i<queue.length;i++)for(const r of active)if(r.from===queue[i]&&!seen.has(r.to)){seen.add(r.to);queue.push(r.to);}
  seen.delete(seed);return seen;
}

export function directLine(seed,rels=[]){return new Set([seed,...ancestors(seed,rels),...descendants(seed,rels)]);}

export function collateral(seed,rels=[]){
  const active=usableRelationships(rels,{includeContext:false});
  const parentIds=new Set(active.filter(r=>STRUCTURAL.has(r.type)&&r.to===seed).map(r=>r.from));
  const siblingIds=new Set();
  for(const parent of parentIds)for(const r of active)if(STRUCTURAL.has(r.type)&&r.from===parent&&r.to!==seed)siblingIds.add(r.to);
  const spouseIds=new Set(active.filter(r=>r.type==='spouse'&&(r.from===seed||r.to===seed)).map(r=>r.from===seed?r.to:r.from));
  const childIds=new Set(active.filter(r=>STRUCTURAL.has(r.type)&&r.from===seed).map(r=>r.to));
  return new Set([seed,...parentIds,...siblingIds,...spouseIds,...childIds]);
}

function pathClassification(hops=[]){
  if(!hops.length)return'same person';
  if(hops.length===1&&hops[0].type==='spouse')return'spouse';
  const dirs=hops.map(h=>h.direction);
  if(dirs.every(x=>x==='down'))return hops.length===1?'parent':hops.length===2?'grandparent':`${hops.length-2}× great-grandparent`;
  if(dirs.every(x=>x==='up'))return hops.length===1?'child':hops.length===2?'grandchild':`${hops.length-2}× great-grandchild`;
  if(hops.length===2&&dirs[0]==='up'&&dirs[1]==='down')return'sibling';
  if(hops.some(h=>h.direction==='identity'))return'identity-linked path';
  if(hops.some(h=>!STRUCTURAL.has(h.type)&&h.type!=='spouse'))return'context/evidence-qualified connection';
  return'family relationship path';
}

export function findRelationshipPath(from,to,rels=[],{includeContext=true,maxHops=24}={}){
  if(!from||!to)return null;
  if(from===to)return{from,to,hops:[],personIds:[from],classification:'same person',evidenceState:'SUPPORTED'};
  const adjacency=buildAdjacency(rels,{includeContext}),queue=[from],seen=new Set([from]),prev=new Map();
  let found=false;
  for(let qi=0;qi<queue.length&&!found;qi++){
    const current=queue[qi];
    const depth=(()=>{let d=0,c=current;while(prev.has(c)){d++;c=prev.get(c).from;}return d;})();
    if(depth>=maxHops)continue;
    const hops=[...(adjacency.get(current)||[])].sort((a,b)=>{
      const score=h=>h.activePedigree?0:h.type==='spouse'?1:h.type==='identity-bridge'?3:2;
      return score(a)-score(b)||a.evidenceState.localeCompare(b.evidenceState)||a.to.localeCompare(b.to);
    });
    for(const hop of hops){if(seen.has(hop.to))continue;seen.add(hop.to);prev.set(hop.to,{from:current,hop});queue.push(hop.to);if(hop.to===to){found=true;break;}}
  }
  if(!found)return null;
  const reversed=[];let cursor=to;
  while(cursor!==from){const step=prev.get(cursor);if(!step)return null;reversed.push(step.hop);cursor=step.from;}
  const hops=reversed.reverse(),personIds=[from,...hops.map(h=>h.to)];
  const states=hops.map(h=>h.evidenceState);
  const evidenceState=states.includes('UNRESOLVED')?'UNRESOLVED':states.includes('PROVISIONAL')?'PROVISIONAL':states.includes('REJECTED')?'REJECTED':'SUPPORTED';
  return{from,to,hops,personIds,classification:pathClassification(hops),evidenceState};
}

export function pedigreeCycles(rels=[]){
  const structural=usableRelationships(rels,{includeContext:false}).filter(r=>STRUCTURAL.has(r.type));
  const children=new Map();for(const r of structural){if(!children.has(r.from))children.set(r.from,[]);children.get(r.from).push(r.to);}
  const cycles=[],visiting=new Set(),visited=new Set(),stack=[];
  const visit=id=>{if(visiting.has(id)){const at=stack.indexOf(id);cycles.push([...stack.slice(at),id]);return;}if(visited.has(id))return;visiting.add(id);stack.push(id);for(const child of children.get(id)||[])visit(child);stack.pop();visiting.delete(id);visited.add(id);};
  for(const id of children.keys())visit(id);
  return cycles;
}

export function generationLanes(rels=[],peopleIds=[]){
  const active=usableRelationships(rels,{includeContext:false}).filter(r=>STRUCTURAL.has(r.type)),rank=new Map(peopleIds.map(id=>[id,0]));
  for(let pass=0;pass<peopleIds.length;pass++){let changed=false;for(const r of active){if(!rank.has(r.from)||!rank.has(r.to))continue;const next=Math.max(rank.get(r.to)||0,(rank.get(r.from)||0)+1);if(next!==rank.get(r.to)){rank.set(r.to,next);changed=true;}}if(!changed)break;}
  return rank;
}
