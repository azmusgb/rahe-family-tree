// Relationship-path comprehension for the Family Graph.
// Read-only presentation: derives narration from the existing canonical path engine
// and the already rendered tree without mutating genealogy, evidence, or privacy data.
import{model,allPedigreeRelationships,personById,esc}from'../../../core.js';
import{findRelationshipPath}from'../../../canonical-graph-engine.js';

const VALID_STATES=new Set(['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED']);
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const allRelationships=()=>[...allPedigreeRelationships(),...(model.contextRelationships||[])];
const renderedIds=()=>new Set([...document.querySelectorAll('#family-graph .graph-node[data-person]')].map(node=>node.dataset.person).filter(Boolean));
const displayName=id=>cleanName(personById(id)?.name||id);
const stateFor=value=>VALID_STATES.has(String(value||'').toUpperCase())?String(value).toUpperCase():'UNRESOLVED';
const sentenceCase=value=>String(value||'relationship path').replace(/^./,char=>char.toUpperCase());

function clearPresentation(){
  document.querySelector('.relationship-path-card')?.remove();
  document.querySelectorAll('#family-graph .graph-node').forEach(node=>node.classList.remove('tree-path-start','tree-path-middle','tree-path-end'));
  document.querySelectorAll('#family-graph .tree-path-segment').forEach(segment=>{
    segment.classList.remove('tree-path-segment-supported','tree-path-segment-provisional','tree-path-segment-unresolved','tree-path-segment-rejected');
    delete segment.dataset.pathStep;delete segment.dataset.evidenceState;
  });
}

function evidenceNote(state){
  if(state==='SUPPORTED')return'This path is supported by the controlling relationship evidence shown in the tree.';
  if(state==='PROVISIONAL')return'This path includes provisional relationship evidence and should be read as provisional.';
  if(state==='UNRESOLVED')return'This path includes unresolved relationship evidence; the connection is not established as fact.';
  return'This path includes rejected relationship evidence and should not be treated as an active family conclusion.';
}

function annotateGraph(result){
  const svg=document.querySelector('#family-graph');if(!svg)return;
  result.personIds.forEach((id,index)=>{
    const node=svg.querySelector(`.graph-node[data-person="${CSS.escape(id)}"]`);if(!node)return;
    node.classList.add(index===0?'tree-path-start':index===result.personIds.length-1?'tree-path-end':'tree-path-middle');
  });
  [...svg.querySelectorAll('.tree-path-segment')].forEach((segment,index)=>{
    const hop=result.hops[index];if(!hop)return;const state=stateFor(hop.evidenceState);
    segment.classList.add(`tree-path-segment-${state.toLowerCase()}`);
    segment.dataset.pathStep=String(index+1);segment.dataset.evidenceState=state;
  });
}

function renderCard(result){
  const anchor=document.querySelector('.tree-path-summary')||document.querySelector('.graph-toolbar');if(!anchor)return;
  const fromName=displayName(result.from),toName=displayName(result.to),state=stateFor(result.evidenceState);
  const card=document.createElement('section');card.className='relationship-path-card';card.dataset.evidenceState=state;card.setAttribute('aria-label',`Relationship path from ${fromName} to ${toName}`);card.setAttribute('aria-live','polite');
  const steps=result.hops.map((hop,index)=>{
    const from=displayName(result.personIds[index]),to=displayName(result.personIds[index+1]),hopState=stateFor(hop.evidenceState);
    return`<li class="relationship-path-step" data-evidence-state="${hopState}"><span class="relationship-path-step-number" aria-hidden="true">${index+1}</span><span class="relationship-path-step-copy"><strong>${esc(from)}</strong><span class="relationship-path-relation">${esc(hop.label)}</span><strong>${esc(to)}</strong></span><span class="relationship-path-step-state">${hopState}</span></li>`;
  }).join('');
  card.innerHTML=`<div class="relationship-path-heading"><div><span class="relationship-path-eyebrow">Relationship path</span><h3>${esc(fromName)} <span aria-hidden="true">→</span> ${esc(toName)}</h3></div><div class="relationship-path-badges"><span>${esc(sentenceCase(result.classification))}</span><span>${result.hops.length} hop${result.hops.length===1?'':'s'}</span><span data-evidence-state="${state}">${state}</span></div></div><ol class="relationship-path-steps">${steps}</ol><p class="relationship-path-note">${esc(evidenceNote(state))}</p>`;
  anchor.insertAdjacentElement('afterend',card);
}

function reconcile(){
  clearPresentation();if(route()!=='tree')return;
  const url=new URL(location.href),from=url.searchParams.get('focus')||'',to=url.searchParams.get('pathTo')||'';if(!from||!to||from===to)return;
  const ids=renderedIds();if(!ids.has(from)||!ids.has(to))return;
  const relationships=allRelationships().filter(rel=>ids.has(rel.from)&&ids.has(rel.to));
  const result=findRelationshipPath(from,to,relationships,{includeContext:true,maxHops:32});if(!result)return;
  annotateGraph(result);renderCard(result);
}

let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;reconcile();}));}
window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);window.addEventListener('resize',schedule,{passive:true});window.addEventListener('family-view-rendered',schedule);window.addEventListener('family-native-rendered',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
