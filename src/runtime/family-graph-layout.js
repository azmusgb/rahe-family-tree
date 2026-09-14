// Readable Family Graph layout layer.
// Presentation-only: derives relative generations and asserted couple context from
// the already-rendered graph and active genealogy. It never mutates canonical data.
import{model,allPedigreeRelationships,personById,esc}from'../../core.js';

const STRUCTURAL_TYPES=new Set(['parent-child','direct-line-succession']);
const COUPLE_TYPES=new Set(['spouse']);
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const explicitFocus=()=>new URL(location.href).searchParams.get('focus')||'';
const renderedFocus=()=>explicitFocus()||document.querySelector('#family-graph .graph-node.focused[data-person]')?.dataset.person||'';
const renderedIds=()=>new Set([...document.querySelectorAll('#family-graph .graph-node[data-person]')].map(node=>node.dataset.person).filter(Boolean));
const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const relationships=()=>[...allPedigreeRelationships(),...(model.contextRelationships||[])].filter(rel=>rel.active!==false&&!/REJECTED/i.test(String(rel.state||rel.evidenceState||'')));

function structuralReach(seed,direction){
  if(!seed)return new Set();
  const rels=relationships().filter(rel=>STRUCTURAL_TYPES.has(rel.type));
  const seen=new Set([seed]),queue=[seed];
  for(let i=0;i<queue.length;i++){
    const id=queue[i];
    for(const rel of rels){
      if(direction!=='up'&&rel.from===id&&!seen.has(rel.to)){seen.add(rel.to);queue.push(rel.to);}
      if(direction!=='down'&&rel.to===id&&!seen.has(rel.from)){seen.add(rel.from);queue.push(rel.from);}
    }
  }
  return seen;
}

function directLineIds(focus){
  if(!focus)return new Set();
  return new Set([...structuralReach(focus,'up'),...structuralReach(focus,'down')]);
}

function relativeGenerations(focus){
  const visible=renderedIds(),rels=relationships().filter(rel=>STRUCTURAL_TYPES.has(rel.type)&&visible.has(rel.from)&&visible.has(rel.to));
  const generation=new Map();if(!focus||!visible.has(focus))return generation;
  generation.set(focus,0);const queue=[focus];
  for(let i=0;i<queue.length;i++){
    const id=queue[i],base=generation.get(id)||0;
    for(const rel of rels){
      if(rel.from===id&&!generation.has(rel.to)){generation.set(rel.to,base+1);queue.push(rel.to);}
      if(rel.to===id&&!generation.has(rel.from)){generation.set(rel.from,base-1);queue.push(rel.from);}
    }
  }
  return generation;
}

function generationLabel(offset){
  if(offset===0)return'Focus generation';
  const ancestor=offset<0,n=Math.abs(offset);
  if(n===1)return ancestor?'Parents':'Children';
  if(n===2)return ancestor?'Grandparents':'Grandchildren';
  return`${'Great-'.repeat(n-2)}${ancestor?'grandparents':'grandchildren'}`;
}

function annotateGenerationLanes(generation,focus){
  const focusNode=document.querySelector(`#family-graph .graph-node[data-person="${CSS.escape(focus)}"]`);if(!focusNode)return;
  const focusTransform=focusNode.getAttribute('transform')||'',focusMatch=focusTransform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);if(!focusMatch)return;
  const focusY=Number(focusMatch[2]);
  const lanes=[...document.querySelectorAll('#family-graph .generation-lane')].map(lane=>{const text=lane.querySelector('text');return{lane,text,y:Number(text?.getAttribute('y')||0)};}).filter(item=>item.text&&Number.isFinite(item.y)).sort((a,b)=>a.y-b.y);
  if(!lanes.length)return;
  let focusIndex=0,best=Infinity;lanes.forEach((item,index)=>{const distance=Math.abs(item.y-focusY);if(distance<best){best=distance;focusIndex=index;}});
  lanes.forEach((item,index)=>{const offset=index-focusIndex;item.lane.dataset.familyGeneration=String(offset);item.text.textContent=generationLabel(offset);});
  for(const node of document.querySelectorAll('#family-graph .graph-node[data-person]')){
    const id=node.dataset.person,offset=generation.get(id);if(offset===undefined){delete node.dataset.familyGeneration;continue;}node.dataset.familyGeneration=String(offset);
    node.classList.toggle('family-generation-focus',offset===0);
    node.classList.toggle('family-generation-ancestor',offset<0);
    node.classList.toggle('family-generation-descendant',offset>0);
  }
}

function spouseIdsFor(id,visible){
  const out=[];
  for(const rel of relationships().filter(rel=>COUPLE_TYPES.has(rel.type))){
    if(rel.from===id&&visible.has(rel.to))out.push(rel.to);
    if(rel.to===id&&visible.has(rel.from))out.push(rel.from);
  }
  return [...new Set(out)];
}

function installLineageRail(generation,focus){
  document.querySelector('.family-lineage-rail')?.remove();
  const graph=document.querySelector('.graph-shell');if(!graph||!focus)return;
  const visible=renderedIds(),direct=directLineIds(focus),groups=new Map();
  for(const id of direct){
    if(!visible.has(id))continue;const offset=generation.get(id);if(offset===undefined)continue;if(!groups.has(offset))groups.set(offset,[]);groups.get(offset).push(id);
  }
  if(!groups.size)return;
  const rail=document.createElement('section');rail.className='family-lineage-rail';rail.dataset.familyLineageRail='true';rail.setAttribute('aria-label','Direct family line by generation');
  const ordered=[...groups.entries()].sort((a,b)=>a[0]-b[0]);
  rail.innerHTML=`<div class="family-lineage-rail-head"><span class="eyebrow">LINEAGE</span><strong>Direct family line</strong><small>Choose a person to refocus the tree.</small></div><div class="family-lineage-generations">${ordered.map(([offset,ids])=>`<section class="family-lineage-generation" data-family-lineage-generation="${offset}"><span>${esc(generationLabel(offset))}</span><div>${ids.sort((a,b)=>cleanName(personById(a)?.name).localeCompare(cleanName(personById(b)?.name))).map(id=>{const person=personById(id),spouses=spouseIdsFor(id,visible).filter(spouse=>!direct.has(spouse));return`<div class="family-lineage-person ${id===focus?'is-focus':''}"><button type="button" data-family-lineage-person="${esc(id)}" aria-current="${id===focus?'true':'false'}">${esc(cleanName(person?.name||id))}</button>${spouses.map(spouse=>`<button type="button" class="family-lineage-spouse" data-family-lineage-person="${esc(spouse)}" data-family-lineage-spouse="true" aria-label="Focus spouse ${esc(cleanName(personById(spouse)?.name||spouse))}">+ ${esc(cleanName(personById(spouse)?.name||spouse))}</button>`).join('')}</div>`;}).join('')}</div></section>`).join('')}</div>`;
  const summary=document.querySelector('.family-graph-summary');(summary||graph).insertAdjacentElement('afterend',rail);
  requestAnimationFrame(()=>rail.querySelector('.family-lineage-person.is-focus')?.scrollIntoView({block:'nearest',inline:'center',behavior:'auto'}));
}

function annotateAssertedCouples(){
  const visible=renderedIds();for(const node of document.querySelectorAll('#family-graph .graph-node[data-person]'))node.classList.remove('family-asserted-couple');
  for(const rel of relationships().filter(rel=>COUPLE_TYPES.has(rel.type)&&visible.has(rel.from)&&visible.has(rel.to))){
    document.querySelector(`#family-graph .graph-node[data-person="${CSS.escape(rel.from)}"]`)?.classList.add('family-asserted-couple');
    document.querySelector(`#family-graph .graph-node[data-person="${CSS.escape(rel.to)}"]`)?.classList.add('family-asserted-couple');
  }
}

function focusPerson(id){const url=new URL(location.href);url.searchParams.set('focus',id);if(url.searchParams.get('scope')==='all')url.searchParams.set('scope','connected');url.searchParams.delete('pathTo');url.hash='tree';history.replaceState(history.state,'',url);window.dispatchEvent(new HashChangeEvent('hashchange'));}

function apply(){
  if(route()!=='tree'){document.querySelector('.family-lineage-rail')?.remove();return;}
  const svg=document.querySelector('#family-graph');if(!svg)return;
  const focus=renderedFocus(),generation=relativeGenerations(focus);annotateGenerationLanes(generation,focus);annotateAssertedCouples();installLineageRail(generation,focus);
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

document.addEventListener('click',event=>{const button=event.target.closest?.('[data-family-lineage-person]');if(!button)return;event.preventDefault();focusPerson(button.dataset.familyLineagePerson||'');});
window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);window.addEventListener('family-view-rendered',schedule);window.addEventListener('family-native-rendered',schedule);window.addEventListener('resize',schedule,{passive:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
