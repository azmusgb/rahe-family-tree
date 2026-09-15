import{model,displayPeople,allPedigreeRelationships}from'../../core.js';
import{buildFamilyGraph,chooseDefaultAnchor}from'./graph.js';
import{scopeIds,relationshipPath}from'./traversal.js';
import{readTreeState,writeTreeState,storageState}from'./state.js';
import{annotateTreeSvg,highlightRelationshipPath}from'./render.js';
import{compactMode,applyCompactMode}from'./mobile.js';
import{serializeSvg,svgBlob,printTree}from'./export.js';

const route=()=>globalThis.location?.hash?.slice(1).split('/')[0]||'dashboard';
const relationships=()=>[...allPedigreeRelationships(),...(model.contextRelationships||[])];

export function currentFamilyGraph(){return buildFamilyGraph(displayPeople(),relationships());}

export function refreshFamilyGraph(){
  if(route()!=='tree')return null;
  const graph=currentFamilyGraph(),saved=storageState(),state=readTreeState();
  let focus=state.focus;
  const invalidFocus=Boolean(focus)&&!graph.nodes.has(focus);
  if(state.scope==='all'){
    if(invalidFocus){
      const next=writeTreeState({...state,focus:''});
      history.replaceState(history.state,'',next);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return null;
    }
    focus='';
  }else if(!focus||invalidFocus){
    const anchor=chooseDefaultAnchor(graph);focus=anchor?.id||'';
    if(focus){
      const next=writeTreeState({...state,focus,scope:'connected'});
      history.replaceState(history.state,'',next);
      if(invalidFocus){window.dispatchEvent(new HashChangeEvent('hashchange'));return null;}
    }
  }
  const effective={...state,focus};
  if(focus)saved.remember(focus);saved.save(effective);
  const visible=scopeIds(effective,graph),svg=document.querySelector('#family-graph');
  annotateTreeSvg(svg,graph,visible);
  const path=effective.pathTo?relationshipPath(focus,effective.pathTo,graph,{includeContext:false}):null;
  highlightRelationshipPath(svg,path);
  const reduced=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  applyCompactMode(compactMode(effective,{width:innerWidth,reducedMotion:reduced}));
  document.documentElement.dataset.treeEngine='v19';
  globalThis.FamilyGraphV19={
    version:'19.0.0',graph,state:effective,visibleIds:visible,path,
    refresh:refreshFamilyGraph,
    setState:patch=>{const next=writeTreeState({...effective,...patch});history.replaceState(history.state,'',next);window.dispatchEvent(new HashChangeEvent('hashchange'));},
    relationshipPath:(to,options={})=>relationshipPath(focus,to,graph,options),
    serializeSvg:()=>serializeSvg(document.querySelector('#family-graph')),
    svgBlob:()=>svgBlob(document.querySelector('#family-graph')),
    print:()=>printTree(),
  };
  window.dispatchEvent(new CustomEvent('family-graph-v19-ready',{detail:{focus,scope:effective.scope,visibleCount:visible.size}}));
  return globalThis.FamilyGraphV19;
}

let queued=false;
export function scheduleFamilyGraphRefresh(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;refreshFamilyGraph();}));}

export function installFamilyGraphInteractions(){
  window.addEventListener('family-view-rendered',scheduleFamilyGraphRefresh);
  window.addEventListener('hashchange',scheduleFamilyGraphRefresh);
  window.addEventListener('popstate',scheduleFamilyGraphRefresh);
  window.addEventListener('resize',scheduleFamilyGraphRefresh,{passive:true});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',scheduleFamilyGraphRefresh):scheduleFamilyGraphRefresh();
}
