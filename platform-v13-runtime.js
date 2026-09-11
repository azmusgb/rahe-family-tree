import{model}from'./core.js';
import{renderTreeEngine2Header,renderRelationshipFinder,renderCanonicalGraphAudit,renderResearchCommandCenterV2,renderPersonPlatformPanel,renderSourceEvidenceMatrix,renderGeographyHouseholds,installPlatformHandlers}from'./platform-v13-ui.js';

let installed=false;
function marker(name,html){return`<div data-platform-v13="${name}">${html}</div>`;}
function addAfter(target,name,html){if(!target||document.querySelector(`[data-platform-v13="${name}"]`))return;target.insertAdjacentHTML('afterend',marker(name,html));}
function prepend(target,name,html){if(!target||document.querySelector(`[data-platform-v13="${name}"]`))return;target.insertAdjacentHTML('afterbegin',marker(name,html));}
function append(target,name,html){if(!target||document.querySelector(`[data-platform-v13="${name}"]`))return;target.insertAdjacentHTML('beforeend',marker(name,html));}

function relationshipUrl(from='',to=''){
  const u=new URL(location.href);
  if(from)u.searchParams.set('from',from);else u.searchParams.delete('from');
  if(to)u.searchParams.set('to',to);else u.searchParams.delete('to');
  u.hash='tree';
  return u;
}
function routeRelationshipFinder(from='',to=''){
  const next=relationshipUrl(from,to);
  history.pushState(null,'',next);
  window.dispatchEvent(new Event('hashchange'));
}

export function enhancePlatformRoute(){
  if(!model)return;
  const content=document.querySelector('#content');if(!content)return;
  const raw=location.hash.slice(1),[route,id]=raw.split('/');
  if(route==='tree')prepend(content,'tree-engine-2',renderTreeEngine2Header()+renderRelationshipFinder());
  if(route==='evidence')append(content,'canonical-graph-audit',renderCanonicalGraphAudit());
  if(route==='research')prepend(content,'research-command-center',renderResearchCommandCenterV2());
  if(route==='migration')prepend(content,'geography-households',renderGeographyHouseholds());
  if(route==='timeline')append(content,'timeline-geography-households',renderGeographyHouseholds());
  if(route==='families')append(content,'family-households',renderGeographyHouseholds());
  if(route==='person'&&id){const hero=content.querySelector('.person-hero');addAfter(hero,'person-graph-context',renderPersonPlatformPanel(id));}
  if(route==='source'&&id)append(content,'source-evidence-matrix',renderSourceEvidenceMatrix(id));
}

if(!installed){
  installed=true;
  installPlatformHandlers();
  document.addEventListener('submit',event=>{
    if(event.target?.id!=='relationship-finder')return;
    event.preventDefault();event.stopImmediatePropagation();
    const data=new FormData(event.target);
    routeRelationshipFinder(String(data.get('relationship-from')||''),String(data.get('relationship-to')||''));
  },true);
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href^="#relationships"]');
    if(!link)return;
    event.preventDefault();event.stopImmediatePropagation();
    const match=link.getAttribute('href')?.match(/[?&]from=([^&]+)/);
    routeRelationshipFinder(match?decodeURIComponent(match[1]):'','');
  },true);
  window.addEventListener('family-view-rendered',()=>requestAnimationFrame(enhancePlatformRoute));
  window.addEventListener('popstate',()=>requestAnimationFrame(enhancePlatformRoute));
  setTimeout(enhancePlatformRoute,0);
}
