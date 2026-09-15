import{ancestors,descendants,directLine,findRelationshipPath}from'../../canonical-graph-engine.js';

export const VALID_SCOPES=new Set(['family','ancestors','descendants','direct','connected','all']);

export function ancestorIds(focus,graph){return ancestors(focus,graph.relationships);}
export function descendantIds(focus,graph){return descendants(focus,graph.relationships);}
export function directLineIds(focus,graph){return directLine(focus,graph.relationships);}

export function connectedIds(focus,graph){
  const component=graph.components.find(item=>item.ids.has(focus));
  return component?new Set(component.ids):new Set(focus?[focus]:[]);
}

export function familyIds(focus,graph,depth=2){
  if(!focus)return new Set();
  const max=Math.max(1,Number(depth)||2),seen=new Set([focus]),queue=[{id:focus,depth:0}];
  for(let i=0;i<queue.length;i++){
    const current=queue[i];if(current.depth>=max)continue;
    for(const next of graph.adjacency.get(current.id)||[])if(!seen.has(next)){seen.add(next);queue.push({id:next,depth:current.depth+1});}
  }
  return seen;
}

export function scopeIds({focus,scope='connected',depth=2}={},graph){
  if(scope==='all')return new Set(graph.nodes.keys());
  if(!focus||!graph.nodes.has(focus))return new Set();
  if(scope==='ancestors')return new Set([focus,...ancestorIds(focus,graph)]);
  if(scope==='descendants')return new Set([focus,...descendantIds(focus,graph)]);
  if(scope==='direct')return directLineIds(focus,graph);
  if(scope==='family')return familyIds(focus,graph,depth);
  return connectedIds(focus,graph);
}

export function relationshipPath(from,to,graph,{includeContext=false,maxHops=32}={}){
  return findRelationshipPath(from,to,graph.relationships,{includeContext,maxHops});
}
