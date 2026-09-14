// Focused Family Graph navigation shell.
// Presentation/navigation only: updates URL-backed tree state and rearranges existing
// controls without mutating genealogy, evidence, source, claim, or privacy data.
import{displayPeople,personById,esc}from'../../core.js';

const SCOPES=[
  ['family','Family'],
  ['ancestors','Ancestors'],
  ['descendants','Descendants'],
  ['direct','Direct line'],
  ['connected','Connected']
];
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
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
function visibleTargets(focus){
  return [...document.querySelectorAll('#family-graph .graph-node[data-person]')]
    .map(node=>node.dataset.person).filter(id=>id&&id!==focus&&personById(id))
    .filter((id,index,array)=>array.indexOf(id)===index)
    .sort((a,b)=>cleanName(personById(a)?.name).localeCompare(cleanName(personById(b)?.name)));
}

function installCommandbar(){
  if(route()!=='tree')return;
  const graph=document.querySelector('.graph-shell');if(!graph)return;
  document.querySelector('.family-graph-commandbar')?.remove();
  const{focus,scope,depth,pathTo}=urlState(),focusPerson=personById(focus),targets=visibleTargets(focus);
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
          <label><span>To</span><select data-family-graph-path-target aria-label="Choose relationship target"><option value="">Choose person…</option>${targets.map(id=>`<option value="${esc(id)}" ${pathTo===id?'selected':''}>${esc(cleanName(personById(id)?.name||id))}</option>`).join('')}</select></label>
          ${pathTo?'<button type="button" data-family-graph-clear-path>Clear path</button>':''}
        </div>
      </details>
      <details class="family-graph-tools"><summary>Tree tools</summary><div data-family-graph-tools-slot></div></details>
    </div>`;
  const summary=document.querySelector('.family-graph-summary');(summary||graph).insertAdjacentElement('beforebegin',bar);
}

function consolidateLegacyControls(){
  if(route()!=='tree')return;
  const slot=document.querySelector('[data-family-graph-tools-slot]');if(!slot)return;
  const advanced=document.querySelector('.tree-advanced-nav');
  if(advanced){
    advanced.classList.add('family-graph-advanced-source');
    const primary=advanced.querySelector('.tree-advanced-primary');if(primary&&!slot.contains(primary))slot.append(primary);
    const recent=advanced.querySelector('.tree-recent-trail');if(recent&&!slot.contains(recent))slot.append(recent);
  }
  const focusbar=document.querySelector('.tree-focusbar');if(focusbar)focusbar.classList.add('family-graph-focusbar-source');
  const pathTools=document.querySelector('[data-tree-path-tools]');if(pathTools)pathTools.classList.add('family-graph-path-source');
}

function annotateSummary(){
  const summary=document.querySelector('.family-graph-summary');if(!summary)return;
  const{scope}=urlState();summary.dataset.scope=scope;
  const key=summary.querySelector('.family-graph-key');if(key&&!key.querySelector('[data-family-graph-scope-label]')){
    const scopeLabel=document.createElement('span');scopeLabel.dataset.familyGraphScopeLabel='true';scopeLabel.className='family-graph-scope-label';scopeLabel.textContent=SCOPES.find(([value])=>value===scope)?.[1]||'Connected';key.prepend(scopeLabel);
  }else if(key){const label=key.querySelector('[data-family-graph-scope-label]');if(label)label.textContent=SCOPES.find(([value])=>value===scope)?.[1]||'Connected';}
}

function reconcile(){
  if(route()!=='tree'){document.querySelector('.family-graph-commandbar')?.remove();return;}
  installCommandbar();consolidateLegacyControls();annotateSummary();
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;reconcile();}));}

document.addEventListener('change',event=>{
  const person=event.target.closest?.('[data-family-graph-person]');if(person){replaceState({focus:person.value,pathTo:''});return;}
  const path=event.target.closest?.('[data-family-graph-path-target]');if(path){replaceState({pathTo:path.value||''});}
});
document.addEventListener('click',event=>{
  const scope=event.target.closest?.('[data-family-graph-scope]');if(scope){event.preventDefault();replaceState({scope:scope.dataset.familyGraphScope,pathTo:''});return;}
  const depth=event.target.closest?.('[data-family-graph-depth]');if(depth){event.preventDefault();replaceState({scope:'family',depth:Number(depth.dataset.familyGraphDepth),pathTo:''});return;}
  if(event.target.closest?.('[data-family-graph-clear-path]')){event.preventDefault();replaceState({pathTo:''});}
});
window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);window.addEventListener('family-view-rendered',schedule);window.addEventListener('family-native-rendered',schedule);window.addEventListener('resize',schedule,{passive:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
