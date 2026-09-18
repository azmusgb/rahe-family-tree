// v19 Family Graph presentation layer.
// Read-only by design: this module decorates the rendered Tree DOM and derives
// presentation state from existing canonical/runtime data. It never mutates
// people, relationships, claims, evidence states, source records, or privacy.
import{model,allPedigreeRelationships,personById,esc}from'../../../core.js';

const STRUCTURAL_TYPES=new Set(['parent-child','direct-line-succession']);
const SPOUSE_TYPES=new Set(['spouse','spouse-lead']);
const FAMILY_UNIT_TYPES=new Set(['spouse']);
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const explicitFocusId=()=>new URL(location.href).searchParams.get('focus')||'';
const renderedFocusId=()=>explicitFocusId()||document.querySelector('#family-graph .graph-node.focused[data-person]')?.dataset.person||'';
const allRelationships=()=>[...allPedigreeRelationships(),...(model.contextRelationships||[])];
const activeRelationships=()=>allRelationships().filter(rel=>rel.active!==false&&!/REJECTED/i.test(String(rel.state||rel.evidenceState||'')));
const renderedIds=()=>new Set([...document.querySelectorAll('#family-graph .graph-node[data-person]')].map(node=>node.dataset.person).filter(Boolean));
const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const isMobile=()=>matchMedia('(max-width:760px)').matches;

function structuralReach(seed,direction){
  if(!seed)return new Set();
  const rels=activeRelationships().filter(rel=>STRUCTURAL_TYPES.has(rel.type));
  const keep=new Set([seed]),queue=[seed];
  for(let i=0;i<queue.length;i++){
    const id=queue[i];
    for(const rel of rels){
      if(direction!=='up'&&rel.from===id&&!keep.has(rel.to)){keep.add(rel.to);queue.push(rel.to);}
      if(direction!=='down'&&rel.to===id&&!keep.has(rel.from)){keep.add(rel.from);queue.push(rel.from);}
    }
  }
  return keep;
}

function directLineIds(){
  const focus=renderedFocusId();if(!focus)return new Set();
  return new Set([...structuralReach(focus,'up'),...structuralReach(focus,'down')]);
}

function annotateNodes(){
  const focus=renderedFocusId(),direct=directLineIds();
  for(const node of document.querySelectorAll('#family-graph .graph-node[data-person]')){
    const id=node.dataset.person||'';
    node.classList.toggle('family-graph-focus',id===focus);
    node.classList.toggle('family-graph-direct',direct.has(id));
    node.classList.toggle('family-graph-collateral',Boolean(focus)&&id!==focus&&!direct.has(id));
    node.dataset.familyGraphRole=id===focus?'focus':direct.has(id)?'direct-line':'collateral';
  }
}

function annotateEdges(){
  for(const edge of document.querySelectorAll('#family-graph .edge')){
    edge.classList.remove('family-edge-supported','family-edge-provisional','family-edge-unresolved','family-edge-identity','family-edge-context');
    if(edge.classList.contains('state-supported'))edge.classList.add('family-edge-supported');
    if(edge.classList.contains('state-provisional'))edge.classList.add('family-edge-provisional');
    if(edge.classList.contains('state-unresolved'))edge.classList.add('family-edge-unresolved');
    if(edge.classList.contains('identity-bridge'))edge.classList.add('family-edge-identity');
    const pedigree=edge.classList.contains('parent-child')||edge.classList.contains('direct-line-succession')||edge.classList.contains('spouse')||edge.classList.contains('couple-child');
    if(!pedigree&&!edge.classList.contains('identity-bridge'))edge.classList.add('family-edge-context');
  }
}

function nodeBox(node){
  const transform=node.getAttribute('transform')||'',match=transform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);if(!match)return null;
  const rect=node.querySelector('rect');const w=Number(rect?.getAttribute('width'))||248,h=Number(rect?.getAttribute('height'))||116;
  return{x:Number(match[1]),y:Number(match[2]),w,h,cx:Number(match[1])+w/2,cy:Number(match[2])+h/2};
}

function installFamilyUnits(){
  const svg=document.querySelector('#family-graph');if(!svg)return;
  svg.querySelector('[data-family-units-v19]')?.remove();
  const rendered=renderedIds(),rels=activeRelationships().filter(rel=>rendered.has(rel.from)&&rendered.has(rel.to));
  // Only asserted spouse relationships create a visible family unit. Derivative
  // spouse-leads remain contextual research edges and are never framed as pedigree.
  const spouseRels=rels.filter(rel=>FAMILY_UNIT_TYPES.has(rel.type));if(!spouseRels.length)return;
  const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.dataset.familyUnitsV19='true';group.classList.add('family-unit-layer');
  const seen=new Set();
  for(const rel of spouseRels){
    const key=[rel.from,rel.to].sort().join('|');if(seen.has(key))continue;seen.add(key);
    const a=svg.querySelector(`.graph-node[data-person="${CSS.escape(rel.from)}"]`),b=svg.querySelector(`.graph-node[data-person="${CSS.escape(rel.to)}"]`);if(!a||!b)continue;
    const boxes=[nodeBox(a),nodeBox(b)].filter(Boolean);if(boxes.length!==2)continue;
    const children=rels.filter(edge=>STRUCTURAL_TYPES.has(edge.type)&&edge.to&&[rel.from,rel.to].includes(edge.from)).map(edge=>edge.to)
      .filter((id,index,array)=>array.indexOf(id)===index)
      .filter(id=>rels.filter(edge=>STRUCTURAL_TYPES.has(edge.type)&&edge.to===id).map(edge=>edge.from).includes(rel.from)&&rels.filter(edge=>STRUCTURAL_TYPES.has(edge.type)&&edge.to===id).map(edge=>edge.from).includes(rel.to));
    for(const child of children){const node=svg.querySelector(`.graph-node[data-person="${CSS.escape(child)}"]`);const box=node&&nodeBox(node);if(box)boxes.push(box);}
    const left=Math.min(...boxes.map(box=>box.x))-18,right=Math.max(...boxes.map(box=>box.x+box.w))+18,top=Math.min(...boxes.map(box=>box.y))-18,bottom=Math.max(...boxes.map(box=>box.y+box.h))+18;
    const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',String(left));rect.setAttribute('y',String(top));rect.setAttribute('width',String(right-left));rect.setAttribute('height',String(bottom-top));rect.setAttribute('rx','28');rect.classList.add('family-unit-frame');rect.dataset.familyUnit=key;
    const title=document.createElementNS(ns,'title');title.textContent=`Family unit: ${cleanName(personById(rel.from)?.name||rel.from)} and ${cleanName(personById(rel.to)?.name||rel.to)}${children.length?` with ${children.length} child${children.length===1?'':'ren'}`:''}`;rect.append(title);group.append(rect);
  }
  const defs=svg.querySelector('defs'),first=[...svg.children].find(child=>child!==defs);if(first)svg.insertBefore(group,first);else svg.append(group);
}

function installGraphSummary(){
  const shell=document.querySelector('.graph-shell');if(!shell)return;
  let summary=document.querySelector('.family-graph-summary');if(!summary){summary=document.createElement('section');summary.className='family-graph-summary';summary.dataset.familyGraphV19='true';summary.setAttribute('aria-label','Family graph view');shell.insertAdjacentElement('beforebegin',summary);}
  const focus=personById(renderedFocusId()),direct=[...document.querySelectorAll('#family-graph .graph-node.family-graph-direct')].length,collateral=[...document.querySelectorAll('#family-graph .graph-node.family-graph-collateral')].length,units=[...document.querySelectorAll('#family-graph .family-unit-frame')].length;
  summary.innerHTML=`<div><span class="eyebrow">FAMILY GRAPH</span><strong>${esc(focus?cleanName(focus.name):'Connected family')}</strong><small>${direct} direct-line · ${collateral} collateral · ${units} family unit${units===1?'':'s'}</small></div><div class="family-graph-key" aria-label="Graph meaning"><span><i class="family-key-direct"></i>Direct line</span><span><i class="family-key-collateral"></i>Collateral</span><span><i class="family-key-qualified"></i>Qualified relationship</span></div>`;
}

function closePreview({restore=true}={}){
  const sheet=document.querySelector('.family-person-preview');if(!sheet)return;
  const trigger=sheet._trigger;sheet.remove();document.body.classList.remove('family-preview-open');if(restore&&trigger?.isConnected)trigger.focus({preventScroll:true});
}
function openPreviewById(id){
  if(!isMobile()||route()!=='tree')return;const p=personById(id);if(!p)return;
  const node=document.querySelector(`#family-graph .graph-node[data-person="${CSS.escape(id)}"]`);
  closePreview({restore:false});const sheet=document.createElement('section');sheet.className='family-person-preview';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label',`Preview ${cleanName(p.name)}`);sheet._trigger=node||null;
  const state=(p.stateTokens?.[0]||p.state||'QUALIFIED').toString();
  sheet.innerHTML=`<div class="family-person-preview-handle" aria-hidden="true"></div><div class="family-person-preview-head"><div><span class="eyebrow">PERSON</span><h2>${esc(cleanName(p.name))}</h2><p>${esc(String(p.branch||'Family'))}</p></div><button type="button" data-family-preview-close aria-label="Close person preview">Close</button></div><div class="family-person-preview-meta"><span>${esc(state)}</span>${p.living?'<span>Living · private details protected</span>':p.dates?`<span>${esc(String(p.dates))}</span>`:''}</div><div class="family-person-preview-actions"><button type="button" data-family-preview-focus="${esc(id)}">Focus in tree</button><a href="#person/${encodeURIComponent(id)}" data-family-preview-profile>Open profile</a></div>`;
  document.body.append(sheet);document.body.classList.add('family-preview-open');requestAnimationFrame(()=>sheet.querySelector('[data-family-preview-close]')?.focus({preventScroll:true}));
}

function focusInTree(id){const url=new URL(location.href);url.searchParams.set('focus',id);if(url.searchParams.get('scope')==='all')url.searchParams.set('scope','family');url.hash='tree';history.replaceState(history.state,'',url);window.dispatchEvent(new HashChangeEvent('hashchange'));}

function apply(){
  if(route()!=='tree'){closePreview({restore:false});document.body.removeAttribute('data-family-graph');return;}
  const svg=document.querySelector('#family-graph');if(!svg)return;
  document.body.dataset.familyGraph='v19';annotateNodes();annotateEdges();installFamilyUnits();installGraphSummary();
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

document.addEventListener('click',event=>{
  const close=event.target.closest?.('[data-family-preview-close]');if(close){event.preventDefault();closePreview();return;}
  const focus=event.target.closest?.('[data-family-preview-focus]');if(focus){event.preventDefault();const id=focus.dataset.familyPreviewFocus;closePreview({restore:false});focusInTree(id);return;}
  if(event.target.closest?.('[data-family-preview-profile]'))closePreview({restore:false});
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.family-person-preview')){event.preventDefault();closePreview();}});
window.addEventListener('family-graph-person-preview',event=>openPreviewById(event.detail?.personId||''));
window.addEventListener('hashchange',schedule);window.addEventListener('family-view-rendered',schedule);window.addEventListener('family-native-rendered',schedule);window.addEventListener('resize',schedule,{passive:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
