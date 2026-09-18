// Focused Family Graph navigation shell.
// Presentation/navigation only: updates URL-backed tree state and rearranges existing
// controls without mutating genealogy, evidence, source, claim, or privacy data.
import{displayPeople,allPedigreeRelationships,personById,esc}from'../../../core.js';
import{connectedComponent,usableRelationships}from'../../../canonical-graph-engine.js';

const SCOPES=[
  ['family','Family'],
  ['ancestors','Ancestors'],
  ['descendants','Descendants'],
  ['direct','Direct line'],
  ['connected','Connected']
];
const FAMILY_TYPES=new Set(['parent-child','direct-line-succession','spouse']);
const COLLAPSE_KEY='family.archive.treeCollapsed.v2';
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const scopeLabel=scope=>scope==='all'?'Full tree':SCOPES.find(([value])=>value===scope)?.[1]||'Connected';
const urlState=()=>{const url=new URL(location.href);return{url,focus:url.searchParams.get('focus')||document.querySelector('#family-graph .graph-node.focused[data-person]')?.dataset.person||'',scope:url.searchParams.get('scope')||'connected',depth:Number(url.searchParams.get('depth')||2),pathTo:url.searchParams.get('pathTo')||''};};

function replaceState(changes={}){
  const state=urlState(),url=state.url;
  const focus=changes.focus===undefined?state.focus:changes.focus;
  const scope=changes.scope===undefined?state.scope:changes.scope;
  const depth=changes.depth===undefined?state.depth:changes.depth;
  const pathTo=changes.pathTo===undefined?state.pathTo:changes.pathTo;
  if(focus&&scope!=='all')url.searchParams.set('focus',focus);else url.searchParams.delete('focus');
  url.searchParams.set('scope',scope);
  if(scope==='family')url.searchParams.set('depth',String(Math.max(1,Math.min(3,Number(depth)||2))));else url.searchParams.delete('depth');
  if(pathTo)url.searchParams.set('pathTo',pathTo);else url.searchParams.delete('pathTo');
  url.hash='tree';
  history.replaceState(history.state,'',url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function personOptions(focus){
  return displayPeople().slice().sort((a,b)=>cleanName(a.name).localeCompare(cleanName(b.name))||String(a.id).localeCompare(String(b.id)))
    .map(person=>`<option value="${esc(person.id)}" ${person.id===focus?'selected':''}>${esc(cleanName(person.name))}</option>`).join('');
}
function renderedIds(){return new Set([...document.querySelectorAll('#family-graph .graph-node[data-person]')].map(node=>node.dataset.person).filter(Boolean));}
function relationshipTargets(focus){
  if(!focus||!personById(focus))return[];
  const people=displayPeople(),visiblePeople=new Set(people.map(person=>person.id));
  const relationships=usableRelationships(allPedigreeRelationships(),{includeContext:false})
    .filter(rel=>FAMILY_TYPES.has(rel.type)&&visiblePeople.has(rel.from)&&visiblePeople.has(rel.to));
  return[...connectedComponent(focus,relationships,{includeContext:false})]
    .filter(id=>id!==focus&&visiblePeople.has(id)&&personById(id))
    .sort((a,b)=>cleanName(personById(a)?.name).localeCompare(cleanName(personById(b)?.name))||String(a).localeCompare(String(b)));
}
function revealRelationshipTarget(target){
  if(!target){replaceState({pathTo:''});return;}
  if(renderedIds().has(target)){replaceState({pathTo:target});return;}
  const{url,focus}=urlState();
  if(focus)url.searchParams.set('focus',focus);
  url.searchParams.set('scope','connected');
  url.searchParams.delete('depth');
  url.searchParams.set('pathTo',target);
  for(const key of['q','branch','state'])url.searchParams.delete(key);
  for(const selector of['#search','#branch','#state']){const control=document.querySelector(selector);if(control)control.value='';}
  try{localStorage.setItem(COLLAPSE_KEY,'[]');}catch{}
  url.hash='tree';
  history.replaceState(history.state,'',url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function installCommandbar(){
  if(route()!=='tree')return false;
  const graph=document.querySelector('.graph-shell');if(!graph)return false;
  const existing=document.querySelector('.family-graph-commandbar');
  const advanced=document.querySelector('.tree-advanced-nav');
  // The advanced-tree runtime is the authority for component/collapse/compact/export
  // controls. Rebuild this composition only after that runtime has emitted a fresh
  // source set. This prevents a navigation-only refresh from destroying controls
  // that were deliberately moved into the disclosure on the prior render.
  const freshPrimary=advanced?.querySelector(':scope > .tree-advanced-primary');
  if(existing&&!freshPrimary)return false;
  existing?.remove();
  const{focus,scope,depth,pathTo}=urlState(),focusPerson=personById(focus),targets=relationshipTargets(focus),rendered=renderedIds();
  const outsideView=targets.filter(id=>!rendered.has(id)).length;
  const bar=document.createElement('section');bar.className='family-graph-commandbar';bar.setAttribute('aria-label','Family tree navigation');bar.dataset.familyGraphNavigation='true';
  bar.innerHTML=`
    <div class="family-graph-commandbar-main">
      <label class="family-graph-person-picker"><span>Viewing</span><select data-family-graph-person aria-label="Choose focal person">${personOptions(focus)}</select></label>
      <div class="family-graph-scope-tabs" role="group" aria-label="Tree scope">
        ${SCOPES.map(([value,label])=>`<button type="button" data-family-graph-scope="${value}" aria-pressed="${scope===value?'true':'false'}" class="${scope===value?'active':''}">${label}</button>`).join('')}
      </div>
      ${scope==='family'?`<div class="family-graph-depth" role="group" aria-label="Family context depth"><span>Context</span>${[1,2,3].map(value=>`<button type="button" data-family-graph-depth="${value}" aria-pressed="${depth===value?'true':'false'}" class="${depth===value?'active':''}">${value} gen</button>`).join('')}</div>`:''}
    </div>
    <div class="family-graph-commandbar-secondary">
      <details class="family-graph-relationship" ${pathTo?'open':''}>
        <summary>${pathTo?'Relationship highlighted':'Find relationship'}</summary>
        <div class="family-graph-relationship-panel">
          <label><span>From</span><strong>${esc(focusPerson?cleanName(focusPerson.name):'Current person')}</strong></label>
          <label><span>To</span><select data-family-graph-path-target aria-label="Choose relationship target" aria-describedby="family-graph-relationship-help" ${targets.length?'':'disabled'}><option value="">${targets.length?'Choose person…':'No connected relatives'}</option>${targets.map(id=>`<option value="${esc(id)}" ${pathTo===id?'selected':''}>${esc(cleanName(personById(id)?.name||id))}</option>`).join('')}</select></label>
          <small id="family-graph-relationship-help" class="family-graph-relationship-help">${targets.length?`${targets.length} connected relative${targets.length===1?'':'s'} available${outsideView?` · ${outsideView} outside this view will open Connected and reveal the path`:''}.`:'Choose a focal person with connected family relationships.'}</small>
          ${pathTo?'<button type="button" data-family-graph-clear-path>Clear path</button>':''}
        </div>
      </details>
      <details class="family-graph-tools"><summary>Tree tools</summary><div data-family-graph-tools-slot></div></details>
    </div>`;
  const summary=document.querySelector('.family-graph-summary');(summary||graph).insertAdjacentElement('beforebegin',bar);
  return true;
}

function consolidateLegacyControls(){
  if(route()!=='tree')return;
  const slot=document.querySelector('[data-family-graph-tools-slot]');if(!slot)return;
  const advanced=document.querySelector('.tree-advanced-nav');
  if(advanced){
    advanced.classList.add('family-graph-advanced-source');
    const primary=advanced.querySelector(':scope > .tree-advanced-primary');if(primary)slot.append(primary);
    const recent=advanced.querySelector(':scope > .tree-recent-trail');if(recent)slot.append(recent);
  }
  const exportTools=document.querySelector('.graph-toolbar [data-tree-advanced-export]');if(exportTools)slot.append(exportTools);
  const focusbar=document.querySelector('.tree-focusbar');if(focusbar)focusbar.classList.add('family-graph-focusbar-source');
  const pathTools=document.querySelector('[data-tree-path-tools]');if(pathTools)pathTools.classList.add('family-graph-path-source');
}

function annotateSummary(){
  const summary=document.querySelector('.family-graph-summary');if(!summary)return;
  const{scope}=urlState();summary.dataset.scope=scope;
  const key=summary.querySelector('.family-graph-key');if(key&&!key.querySelector('[data-family-graph-scope-label]')){
    const label=document.createElement('span');label.dataset.familyGraphScopeLabel='true';label.className='family-graph-scope-label';label.textContent=scopeLabel(scope);key.prepend(label);
  }else if(key){const label=key.querySelector('[data-family-graph-scope-label]');if(label)label.textContent=scopeLabel(scope);}
}

function reconcile(){
  if(route()!=='tree'){document.querySelector('.family-graph-commandbar')?.remove();return;}
  const rebuilt=installCommandbar();if(rebuilt)consolidateLegacyControls();annotateSummary();
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;reconcile();}));}

document.addEventListener('change',event=>{
  const person=event.target.closest?.('[data-family-graph-person]');if(person){const state=urlState();replaceState({focus:person.value,scope:state.scope==='all'?'connected':state.scope,pathTo:''});return;}
  const path=event.target.closest?.('[data-family-graph-path-target]');if(path)revealRelationshipTarget(path.value||'');
});
document.addEventListener('click',event=>{
  const scope=event.target.closest?.('[data-family-graph-scope]');if(scope){event.preventDefault();replaceState({scope:scope.dataset.familyGraphScope,pathTo:''});return;}
  const depth=event.target.closest?.('[data-family-graph-depth]');if(depth){event.preventDefault();replaceState({scope:'family',depth:Number(depth.dataset.familyGraphDepth),pathTo:''});return;}
  if(event.target.closest?.('[data-family-graph-clear-path]')){event.preventDefault();replaceState({pathTo:''});}
});
window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);window.addEventListener('family-view-rendered',schedule);window.addEventListener('family-native-rendered',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
