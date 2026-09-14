import{generationLanes}from'../../canonical-graph-engine.js';
import{spouseUnits}from'./graph.js';

export function generationLayout(graph,ids=new Set(graph.nodes.keys())){
  const visible=[...ids].filter(id=>graph.nodes.has(id));
  const rels=graph.relationships.filter(rel=>ids.has(rel.from)&&ids.has(rel.to));
  const lanes=generationLanes(rels,visible);
  const byLane=new Map();
  for(const id of visible){const lane=lanes.get(id)||0;if(!byLane.has(lane))byLane.set(lane,[]);byLane.get(lane).push(id);}
  for(const members of byLane.values())members.sort((a,b)=>String(graph.nodes.get(a)?.name||a).localeCompare(String(graph.nodes.get(b)?.name||b)));
  return{lanes,byLane,orderedLanes:[...byLane.keys()].sort((a,b)=>a-b)};
}

export function coupleLayout(graph,ids=new Set(graph.nodes.keys())){
  const laneModel=generationLayout(graph,ids);
  return spouseUnits(graph).filter(unit=>unit.people.every(id=>ids.has(id))).map(unit=>({
    ...unit,
    lane:Math.min(...unit.people.map(id=>laneModel.lanes.get(id)||0)),
  }));
}
