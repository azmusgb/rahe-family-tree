import{generationLayout,coupleLayout}from'./layout.js';

export function annotateTreeSvg(svg,graph,ids=new Set(graph.nodes.keys())){
  if(!svg)return null;
  const layout=generationLayout(graph,ids),couples=coupleLayout(graph,ids);
  svg.dataset.treeEngine='v19';
  for(const node of svg.querySelectorAll?.('.graph-node[data-person]')||[]){
    const id=node.dataset.person;if(!id||!ids.has(id))continue;
    node.dataset.generation=String(layout.lanes.get(id)||0);
    const person=graph.nodes.get(id);
    if(person?.photo||person?.image||person?.portrait)node.dataset.hasPhoto='true';else delete node.dataset.hasPhoto;
  }
  svg.querySelectorAll?.('[data-v19-couple]')?.forEach(node=>node.removeAttribute('data-v19-couple'));
  for(const unit of couples){for(const id of unit.people){const node=svg.querySelector?.(`.graph-node[data-person="${CSS.escape(id)}"]`);node?.setAttribute('data-v19-couple',unit.id);}}
  return{layout,couples};
}

export function highlightRelationshipPath(svg,path){
  svg?.querySelectorAll?.('.graph-node.tree-path-node')?.forEach(node=>node.classList.remove('tree-path-node'));
  for(const id of path?.personIds||[])svg?.querySelector?.(`.graph-node[data-person="${CSS.escape(id)}"]`)?.classList.add('tree-path-node');
  return path||null;
}
