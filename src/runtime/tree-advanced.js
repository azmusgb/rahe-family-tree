// Advanced family-tree navigation and export layer.
// Presentation/navigation only: this module never mutates canonical people,
// relationships, claims, evidence states, source records, or privacy metadata.
import{model,displayPeople,allPedigreeRelationships,branchMembership,personById,esc}from'../../core.js';
import{connectedComponent,findRelationshipPath,generationLanes,usableRelationships}from'../../canonical-graph-engine.js';

const TREE_STATE_KEY='family.archive.treeState.v17.6';
const ADVANCED_KEY='family.archive.treeAdvanced.v18.1';
const RECENT_KEY='family.archive.recentPeople.v2';
const COLLAPSE_KEY='family.archive.treeCollapsed.v2';
const FAMILY_TYPES=new Set(['parent-child','direct-line-succession','spouse']);
const STRUCTURAL_TYPES=new Set(['parent-child','direct-line-succession']);
const VALID_SCOPES=new Set(['family','ancestors','descendants','direct','connected','all']);
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const safeJson=(raw,fallback)=>{try{return JSON.parse(raw)||fallback;}catch{return fallback;}};
const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const branchesFor=person=>{const values=branchMembership(person);return(values.length?values:[String(person?.branch||'Family').split('/')[0].trim()]).filter(Boolean);};
const allRelationships=()=>[...allPedigreeRelationships(),...(model.contextRelationships||[])];
const activeFamilyRelationships=()=>usableRelationships(allRelationships(),{includeContext:false}).filter(rel=>FAMILY_TYPES.has(rel.type));
const visiblePersonIds=()=>new Set(displayPeople().map(person=>person.id));
const readAdvanced=()=>{try{return safeJson(localStorage.getItem(ADVANCED_KEY)||'{}',{});}catch{return{};}};
const writeAdvanced=value=>{try{localStorage.setItem(ADVANCED_KEY,JSON.stringify(value));}catch{}};
const readCollapsed=()=>{try{return new Set(safeJson(localStorage.getItem(COLLAPSE_KEY)||'[]',[]));}catch{return new Set();}};
const writeCollapsed=set=>{try{localStorage.setItem(COLLAPSE_KEY,JSON.stringify([...set]));}catch{}};
const reducedMotion=()=>matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;

function adjacencyFor(rels){
  const map=new Map();
  const add=(a,b)=>{if(!map.has(a))map.set(a,new Set());map.get(a).add(b);};
  for(const rel of rels){add(rel.from,rel.to);add(rel.to,rel.from);}
  return map;
}
function componentList(){
  const people=displayPeople(),ids=new Set(people.map(person=>person.id)),rels=activeFamilyRelationships().filter(rel=>ids.has(rel.from)&&ids.has(rel.to)),seen=new Set(),components=[];
  for(const person of people){
    if(seen.has(person.id))continue;
    const idsInComponent=connectedComponent(person.id,rels,{includeContext:false});
    const members=[...idsInComponent].filter(id=>ids.has(id)).map(personById).filter(Boolean);
    for(const member of members)seen.add(member.id);
    if(!members.length){seen.add(person.id);members.push(person);}
    components.push({members,ids:new Set(members.map(member=>member.id))});
  }
  return components;
}
function distancesFrom(seed,componentIds,adjacency){
  const dist=new Map([[seed,0]]),queue=[seed];
  for(let i=0;i<queue.length;i++)for(const next of adjacency.get(queue[i])||[])if(componentIds.has(next)&&!dist.has(next)){dist.set(next,dist.get(queue[i])+1);queue.push(next);}
  return dist;
}
function componentQuality(component,rels){
  const ids=component.ids,members=component.members,componentRels=rels.filter(rel=>ids.has(rel.from)&&ids.has(rel.to));
  const branches=new Set(members.flatMap(branchesFor));
  const supported=componentRels.filter(rel=>/SUPPORTED/i.test(String(rel.state||rel.evidenceState||''))).length;
  const structural=componentRels.filter(rel=>STRUCTURAL_TYPES.has(rel.type)).length;
  const historical=members.filter(person=>!person.living).length;
  const lanes=generationLanes(componentRels,members.map(person=>person.id));
  const laneValues=[...lanes.values()],depthSpan=laneValues.length?Math.max(...laneValues)-Math.min(...laneValues):0;
  return members.length*1000000+branches.size*60000+structural*6000+supported*1200+historical*80+depthSpan*400;
}
function bestAnchorInComponent(component,rels){
  const ids=component.ids,members=component.members,componentRels=rels.filter(rel=>ids.has(rel.from)&&ids.has(rel.to)),adjacency=adjacencyFor(componentRels),lanes=generationLanes(componentRels,members.map(person=>person.id)),laneValues=[...lanes.values()],laneMid=laneValues.length?(Math.min(...laneValues)+Math.max(...laneValues))/2:0;
  return members.slice().sort((a,b)=>{
    const score=person=>{
      const dist=distancesFrom(person.id,ids,adjacency),reachable=dist.size,totalDistance=[...dist.values()].reduce((sum,value)=>sum+value,0),eccentricity=Math.max(0,...dist.values());
      const incident=componentRels.filter(rel=>rel.from===person.id||rel.to===person.id),structural=incident.filter(rel=>STRUCTURAL_TYPES.has(rel.type)).length,supported=incident.filter(rel=>/SUPPORTED/i.test(String(rel.state||rel.evidenceState||''))).length,branchSpread=new Set(incident.map(rel=>personById(rel.from===person.id?rel.to:rel.from)).filter(Boolean).flatMap(branchesFor)).size;
      const centrality=reachable>1?Math.round((reachable-1)*10000/Math.max(1,totalDistance)):0;
      const lanePenalty=Math.abs((lanes.get(person.id)||0)-laneMid);
      return centrality*100+incident.length*500+structural*260+supported*90+branchSpread*80+(person.living?0:25)-eccentricity*40-lanePenalty*20;
    };
    return score(b)-score(a)||cleanName(a.name).localeCompare(cleanName(b.name))||String(a.id).localeCompare(String(b.id));
  })[0]||null;
}
function chooseDefaultAnchor(){
  const rels=activeFamilyRelationships(),components=componentList();
  if(!components.length)return displayPeople()[0]||null;
  const best=components.slice().sort((a,b)=>componentQuality(b,rels)-componentQuality(a,rels)||cleanName(a.members[0]?.name).localeCompare(cleanName(b.members[0]?.name)))[0];
  return bestAnchorInComponent(best,rels)||best.members[0]||null;
}
function hasSavedTreeState(){
  try{const saved=safeJson(localStorage.getItem(TREE_STATE_KEY)||'{}',{});return Boolean(saved.focus||saved.scope||saved.depth);}catch{return false;}
}
function installUsefulDefaultAnchor(){
  if(route()!=='tree')return false;
  const url=new URL(location.href),hasExplicit=url.searchParams.has('focus')||url.searchParams.has('scope')||url.searchParams.has('depth');
  if(hasExplicit||hasSavedTreeState())return false;
  const anchor=chooseDefaultAnchor();if(!anchor)return false;
  url.searchParams.set('focus',anchor.id);url.searchParams.set('scope','connected');url.searchParams.delete('depth');
  history.replaceState(history.state,'',url.toString());
  document.documentElement.dataset.treeDefaultAnchor=anchor.id;
  return true;
}
function componentLabel(component,index){
  const branchCounts=new Map();for(const person of component.members)for(const branch of branchesFor(person))branchCounts.set(branch,(branchCounts.get(branch)||0)+1);
  const top=[...branchCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,2).map(([branch])=>branch);
  return`${top.join(' / ')||`Component ${index+1}`} · ${component.members.length} people`;
}
function currentFocus(){return new URL(location.href).searchParams.get('focus')||'';}
function currentScope(){const scope=new URL(location.href).searchParams.get('scope')||'connected';return VALID_SCOPES.has(scope)?scope:'connected';}
function currentDepth(){const depth=Number(new URL(location.href).searchParams.get('depth')||2);return[1,2,3].includes(depth)?depth:2;}
function replaceTreeState({focus=currentFocus(),scope=currentScope(),depth=currentDepth(),pathTo,compact}={}){
  const url=new URL(location.href);
  if(focus&&scope!=='all')url.searchParams.set('focus',focus);else url.searchParams.delete('focus');
  url.searchParams.set('scope',scope);
  if(scope==='family')url.searchParams.set('depth',String(depth));else url.searchParams.delete('depth');
  if(pathTo===null)url.searchParams.delete('pathTo');else if(pathTo)url.searchParams.set('pathTo',pathTo);
  if(compact===true)url.searchParams.set('compact','1');else if(compact===false)url.searchParams.delete('compact');
  url.hash='tree';history.replaceState(history.state,'',url);window.dispatchEvent(new HashChangeEvent('hashchange'));
}
function recordRecentFocus(){
  if(route()!=='tree')return;const focus=currentFocus();if(!focus||!personById(focus))return;
  try{const recent=safeJson(localStorage.getItem(RECENT_KEY)||'[]',[]).filter(id=>id!==focus&&personById(id));recent.unshift(focus);localStorage.setItem(RECENT_KEY,JSON.stringify(recent.slice(0,8)));}catch{}
}
function recentFocusIds(){try{return safeJson(localStorage.getItem(RECENT_KEY)||'[]',[]).filter(id=>personById(id)).slice(0,8);}catch{return[];}}
function compactEnabled(){const url=new URL(location.href),saved=readAdvanced();if(url.searchParams.has('compact'))return url.searchParams.get('compact')==='1';if(typeof saved.compact==='boolean')return saved.compact;return matchMedia?.('(max-width:760px)')?.matches===true;}
function applyCompactClass(){document.body.classList.toggle('tree-compact',route()==='tree'&&compactEnabled());}

function installAdvancedNavigation(){
  if(route()!=='tree')return;
  const shell=document.querySelector('.graph-shell');if(!shell)return;
  const old=document.querySelector('.tree-advanced-nav');old?.remove();
  const focus=currentFocus(),focusPerson=personById(focus),components=componentList().filter(component=>component.members.length),rels=activeFamilyRelationships();
  const currentComponentIndex=Math.max(0,components.findIndex(component=>component.ids.has(focus)));
  const componentOptions=components.map((component,index)=>{const anchor=bestAnchorInComponent(component,rels);return`<option value="${esc(anchor?.id||component.members[0]?.id||'')}" ${index===currentComponentIndex?'selected':''}>${esc(componentLabel(component,index))}</option>`;}).join('');
  const recent=recentFocusIds().filter(id=>id!==focus).slice(0,6);
  const nav=document.createElement('section');nav.className='tree-advanced-nav';nav.setAttribute('aria-label','Advanced tree navigation');
  nav.innerHTML=`<div class="tree-advanced-primary"><label><span>Connected component</span><select data-tree-component>${componentOptions}</select></label><div class="tree-advanced-actions"><button type="button" data-tree-collapse-focus ${focus?'':'disabled'}>Collapse focus branch</button><button type="button" data-tree-expand-all>Expand all</button><button type="button" data-tree-compact-toggle aria-pressed="${compactEnabled()?'true':'false'}">${compactEnabled()?'Comfort view':'Compact view'}</button></div></div><nav class="tree-focus-breadcrumb" aria-label="Tree focus breadcrumb"><span>Family tree</span><i aria-hidden="true">›</i><span>${esc(currentScope()==='connected'?'Connected family':currentScope().replace(/^./,c=>c.toUpperCase()))}</span>${focusPerson?`<i aria-hidden="true">›</i><b aria-current="page">${esc(cleanName(focusPerson.name))}</b>`:''}</nav>${recent.length?`<div class="tree-recent-trail"><span>Recently viewed</span>${recent.map(id=>`<button type="button" data-tree-recent-focus="${esc(id)}">${esc(cleanName(personById(id)?.name||id))}</button>`).join('')}</div>`:''}`;
  shell.insertAdjacentElement('beforebegin',nav);
}
function installRelationshipPathControl(){
  if(route()!=='tree')return;const toolbar=document.querySelector('.graph-toolbar');if(!toolbar)return;
  toolbar.querySelector('[data-tree-path-tools]')?.remove();
  const focus=currentFocus();if(!focus)return;
  const visible=[...document.querySelectorAll('.graph-node[data-person]')].map(node=>node.dataset.person).filter(id=>id&&id!==focus&&personById(id));
  if(!visible.length)return;
  const target=new URL(location.href).searchParams.get('pathTo')||'';
  const wrap=document.createElement('span');wrap.dataset.treePathTools='true';wrap.className='tree-path-tools';
  wrap.innerHTML=`<label>Highlight path to <select data-tree-path-target><option value="">Choose person…</option>${visible.sort((a,b)=>cleanName(personById(a)?.name).localeCompare(cleanName(personById(b)?.name))).map(id=>`<option value="${esc(id)}" ${id===target?'selected':''}>${esc(cleanName(personById(id)?.name||id))}</option>`).join('')}</select></label>${target?'<button type="button" data-tree-clear-path>Clear path</button>':''}`;
  toolbar.append(wrap);
}
function nodeCenter(svg,node){
  const transform=node.getAttribute('transform')||'',match=transform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);if(!match)return null;
  const rect=node.querySelector('rect');return{x:Number(match[1])+(Number(rect?.getAttribute('width'))||248)/2,y:Number(match[2])+(Number(rect?.getAttribute('height'))||116)/2};
}
function clearPathOverlay(){document.querySelector('#family-graph [data-tree-path-overlay]')?.remove();document.querySelectorAll('.graph-node.tree-path-node').forEach(node=>node.classList.remove('tree-path-node'));document.querySelector('.tree-path-summary')?.remove();}
function applyRelationshipPath(){
  clearPathOverlay();if(route()!=='tree')return;
  const url=new URL(location.href),from=url.searchParams.get('focus')||'',to=url.searchParams.get('pathTo')||'';if(!from||!to||from===to)return;
  const result=findRelationshipPath(from,to,allRelationships(),{includeContext:true,maxHops:32});if(!result)return;
  const svg=document.querySelector('#family-graph');if(!svg)return;
  const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.dataset.treePathOverlay='true';group.classList.add('tree-relationship-path-overlay');
  for(const id of result.personIds){const node=svg.querySelector(`.graph-node[data-person="${CSS.escape(id)}"]`);node?.classList.add('tree-path-node');}
  for(let i=0;i<result.personIds.length-1;i++){
    const a=svg.querySelector(`.graph-node[data-person="${CSS.escape(result.personIds[i])}"]`),b=svg.querySelector(`.graph-node[data-person="${CSS.escape(result.personIds[i+1])}"]`),ca=a&&nodeCenter(svg,a),cb=b&&nodeCenter(svg,b);if(!ca||!cb)continue;
    const path=document.createElementNS(ns,'path'),mid=(ca.y+cb.y)/2;path.setAttribute('d',`M ${ca.x} ${ca.y} C ${ca.x} ${mid}, ${cb.x} ${mid}, ${cb.x} ${cb.y}`);path.classList.add('tree-path-segment');group.append(path);
  }
  svg.append(group);
  const toolbar=document.querySelector('.graph-toolbar');if(toolbar){const summary=document.createElement('span');summary.className='tree-path-summary';summary.textContent=`${result.classification} · ${result.hops.length} hop${result.hops.length===1?'':'s'} · ${result.evidenceState}`;toolbar.insertAdjacentElement('afterend',summary);}
}
function installCoupleGroups(){
  if(route()!=='tree')return;const svg=document.querySelector('#family-graph');if(!svg)return;
  svg.querySelector('[data-tree-couple-groups]')?.remove();
  const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.dataset.treeCoupleGroups='true';group.classList.add('tree-couple-groups');
  const ids=visiblePersonIds(),rels=activeFamilyRelationships().filter(rel=>rel.type==='spouse'&&ids.has(rel.from)&&ids.has(rel.to));
  for(const rel of rels){const a=svg.querySelector(`.graph-node[data-person="${CSS.escape(rel.from)}"]`),b=svg.querySelector(`.graph-node[data-person="${CSS.escape(rel.to)}"]`);if(!a||!b)continue;const ca=nodeCenter(svg,a),cb=nodeCenter(svg,b);if(!ca||!cb||Math.abs(ca.y-cb.y)>8)continue;const left=Math.min(ca.x,cb.x)-142,right=Math.max(ca.x,cb.x)+142,top=ca.y-69,bottom=ca.y+69;const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',String(left));rect.setAttribute('y',String(top));rect.setAttribute('width',String(right-left));rect.setAttribute('height',String(bottom-top));rect.setAttribute('rx','24');rect.classList.add('tree-couple-group');group.append(rect);}
  const defs=svg.querySelector('defs'),first=[...svg.children].find(child=>child!==defs);if(first)svg.insertBefore(group,first);else svg.append(group);
}
function enhanceGenerationLanes(){
  if(route()!=='tree')return;const svg=document.querySelector('#family-graph'),focus=currentFocus(),focusNode=focus?svg?.querySelector(`.graph-node[data-person="${CSS.escape(focus)}"]`):null;if(!svg||!focusNode)return;
  const focusCenter=nodeCenter(svg,focusNode);if(!focusCenter)return;
  const lanes=[...svg.querySelectorAll('.generation-lane')].map(lane=>{const text=lane.querySelector('text'),line=lane.querySelector('line');return{lane,text,y:Number(line?.getAttribute('y1')||0)+26};}).filter(row=>row.text);
  const nearest=lanes.slice().sort((a,b)=>Math.abs(a.y-focusCenter.y)-Math.abs(b.y-focusCenter.y))[0];if(!nearest)return;const focusIndex=lanes.indexOf(nearest);
  lanes.forEach((row,index)=>{const delta=index-focusIndex;row.text.textContent=delta===0?'FOCUS':delta<0?`${Math.abs(delta)} GEN ↑`:`${delta} GEN ↓`;});
}
function inlineSvgPresentation(source,clone){
  const props=['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity','font-family','font-size','font-weight','font-style','text-anchor','dominant-baseline','visibility'];
  const sourceNodes=[source,...source.querySelectorAll('*')],cloneNodes=[clone,...clone.querySelectorAll('*')];
  sourceNodes.forEach((node,index)=>{const target=cloneNodes[index];if(!target)return;const computed=getComputedStyle(node),rules=props.map(prop=>[prop,computed.getPropertyValue(prop)]).filter(([,value])=>value).map(([prop,value])=>`${prop}:${value}`).join(';');if(rules)target.setAttribute('style',rules);});
}
function exportableSvg(){
  const svg=document.querySelector('#family-graph');if(!svg)return null;const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('version','1.1');clone.removeAttribute('style');inlineSvgPresentation(svg,clone);return clone;
}
function downloadText(name,type,text){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function exportSvg(){const clone=exportableSvg();if(!clone)return;downloadText('family-history-tree.svg','image/svg+xml;charset=utf-8',new XMLSerializer().serializeToString(clone));}
function exportPdf(){
  const clone=exportableSvg();if(!clone)return;const frame=document.createElement('iframe');frame.className='tree-pdf-frame';frame.setAttribute('aria-hidden','true');document.body.append(frame);const doc=frame.contentDocument;if(!doc){frame.remove();return;}
  const focus=personById(currentFocus()),title=focus?`Family tree — ${cleanName(focus.name)}`:'Family tree';doc.open();doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:landscape;margin:8mm}html,body{margin:0;background:#fff}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}header{margin:0 0 5mm;font-size:12pt}svg{display:block;width:100%;height:auto;max-height:180mm}</style></head><body><header>${esc(title)}</header>${new XMLSerializer().serializeToString(clone)}</body></html>`);doc.close();setTimeout(()=>{try{frame.contentWindow?.focus();frame.contentWindow?.print();}finally{setTimeout(()=>frame.remove(),15000);}},250);
}
function installExportTools(){
  if(route()!=='tree')return;const toolbar=document.querySelector('.graph-toolbar');if(!toolbar)return;toolbar.querySelector('[data-tree-advanced-export]')?.remove();
  const span=document.createElement('span');span.dataset.treeAdvancedExport='true';span.className='tree-advanced-export';span.innerHTML='<button type="button" data-tree-export-svg>SVG</button><button type="button" data-tree-export-pdf>PDF</button>';toolbar.append(span);
}
function persistAdvanced(){
  if(route()!=='tree')return;const url=new URL(location.href);writeAdvanced({compact:compactEnabled(),pathTo:url.searchParams.get('pathTo')||'',updatedAt:Date.now()});
}
function reconcile(){
  if(route()!=='tree'){document.body.classList.remove('tree-compact');return;}
  recordRecentFocus();applyCompactClass();installAdvancedNavigation();installRelationshipPathControl();installExportTools();installCoupleGroups();enhanceGenerationLanes();applyRelationshipPath();persistAdvanced();
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>requestAnimationFrame(()=>{scheduled=false;reconcile();}));}

installUsefulDefaultAnchor();

document.addEventListener('change',event=>{
  const component=event.target.closest?.('[data-tree-component]');if(component){replaceTreeState({focus:component.value,scope:'connected',pathTo:null});return;}
  const target=event.target.closest?.('[data-tree-path-target]');if(target){replaceTreeState({pathTo:target.value||null});}
});
document.addEventListener('click',event=>{
  const recent=event.target.closest?.('[data-tree-recent-focus]');if(recent){event.preventDefault();replaceTreeState({focus:recent.dataset.treeRecentFocus,scope:currentScope(),pathTo:null});return;}
  if(event.target.closest?.('[data-tree-collapse-focus]')){event.preventDefault();const focus=currentFocus();if(focus){const set=readCollapsed();set.add(focus);writeCollapsed(set);window.dispatchEvent(new HashChangeEvent('hashchange'));}return;}
  if(event.target.closest?.('[data-tree-expand-all]')){event.preventDefault();writeCollapsed(new Set());window.dispatchEvent(new HashChangeEvent('hashchange'));return;}
  if(event.target.closest?.('[data-tree-compact-toggle]')){event.preventDefault();const next=!compactEnabled();writeAdvanced({...readAdvanced(),compact:next,updatedAt:Date.now()});replaceTreeState({compact:next});return;}
  if(event.target.closest?.('[data-tree-clear-path]')){event.preventDefault();replaceTreeState({pathTo:null});return;}
  if(event.target.closest?.('[data-tree-export-svg]')){event.preventDefault();exportSvg();return;}
  if(event.target.closest?.('[data-tree-export-pdf]')){event.preventDefault();exportPdf();}
},true);
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
window.addEventListener('family-media-changed',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('popstate',schedule);
window.addEventListener('resize',schedule,{passive:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
