import{familyPrimary,familyExplore,researchPrimary,familyLabels,researchRoutes,owningSection,linksHtml}from'./navigation-model.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
function isResearchContext(){return document.body.dataset.experience==='research'||researchRoutes.has(routeKey());}

function familyPrimaryHtml(){return linksHtml(familyPrimary);}
function familyMenus(){return `<details class="v151-nav-menu v158-explore"><summary>Explore</summary><div class="v151-nav-popover">${linksHtml(familyExplore)}</div></details><a class="v158-research-entry" href="#research">Research Center</a>`;}
function researchPrimaryHtml(){return linksHtml(researchPrimary);}
function researchMenus(){return `<a class="v158-family-return" href="#dashboard" data-v158-family-return>← Back to Family</a>`;}

function preserveActions(menus){return menus?.querySelector('.v155-desktop-actions')||null;}
function markCurrent(container,selector,key){
  container?.querySelectorAll(selector).forEach(link=>{
    const active=link.dataset.navKey===key||link.dataset.dockRoute===key;
    link.classList.toggle('active',active);
    if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
}
function rebuildDesktopNav(){
  const primary=document.querySelector('.v151-primary-nav');
  const menus=document.querySelector('.v151-nav-menus');
  if(!primary||!menus)return;
  const actions=preserveActions(menus),research=isResearchContext();
  primary.innerHTML=research?researchPrimaryHtml():familyPrimaryHtml();
  menus.innerHTML=research?researchMenus():familyMenus();
  if(actions)menus.append(actions);
  document.body.dataset.v158Context=research?'research':'family';
  markCurrent(primary,'[data-nav-key]',owningSection(routeKey()));
}

function syncBrand(){
  const brand=document.querySelector('.brand span:last-child');
  if(!brand)return;
  brand.innerHTML=isResearchContext()?'FAMILY<small>RESEARCH CENTER</small>':'FAMILY<small>HISTORY ARCHIVE</small>';
  const monogram=document.querySelector('.brand .monogram');if(monogram)monogram.textContent='F';
  const edition=document.querySelector('.edition');
  if(edition)edition.innerHTML=isResearchContext()?'<b>RESEARCH WORKSPACE</b>Evidence, sources, conflicts, and acquisition work':'<b>SOURCE-BACKED FAMILY HISTORY</b>Connected family archive · living-person privacy protected';
}

function contextualSearch(){
  const route=routeKey(),label=document.querySelector('#filters .search'),input=document.getElementById('search');
  if(!label||!input)return;
  const text={dashboard:'Find someone in the family',tree:'Jump to a person',people:'Search people and branches',person:'Find another relative',media:'Search albums, people or places',stories:'Search family stories',timeline:'Search the family timeline',migration:'Search places and branches'}[route]||(isResearchContext()?'Search the research archive':'Search the family');
  const placeholder={dashboard:'Name, branch, or place…',tree:'Enter a family member…',people:'Name, branch, or place…',person:'Search for another relative…',media:'Person, place, date, or caption…',stories:'Person, place, event, or year…',timeline:'Person, event, place, or year…',migration:'Place, branch, or person…'}[route]||(isResearchContext()?'Claim, source, person, or record…':'Name, branch, or place…');
  label.childNodes[0].nodeValue=text;input.placeholder=placeholder;
  document.querySelector('.route-shell')?.classList.toggle('v158-context-search',!isResearchContext());
}

function rebuildMobileDock(){
  const dock=document.getElementById('family-mobile-dock');if(!dock)return;
  const research=isResearchContext();dock.hidden=false;
  if(research){
    dock.innerHTML=`<a href="#intelligence" data-dock-route="intelligence"><span>Overview</span></a><a href="#evidence" data-dock-route="evidence"><span>Evidence</span></a><a href="#sources" data-dock-route="sources"><span>Sources</span></a><a href="#dashboard" data-v158-family-mobile><span>Family</span></a>`;
    markCurrent(dock,'[data-dock-route]',owningSection(routeKey()));return;
  }
  dock.innerHTML=`<a href="#dashboard" data-dock-route="dashboard"><span>Home</span></a><a href="#tree" data-dock-route="tree"><span>Tree</span></a><a href="#people" data-dock-route="people"><span>People</span></a><a href="#media" data-dock-route="media"><span>Albums</span></a><details class="v158-mobile-more"><summary>More</summary><div><button type="button" data-dock-search>Search</button>${familyExplore.map(item=>`<a href="${item.href}">${item.label.replace(' & Migration','')}</a>`).join('')}<a href="#research">Research Center</a></div></details>`;
  markCurrent(dock,'[data-dock-route]',owningSection(routeKey()));
}

function syncCrumb(){const crumb=document.getElementById('crumb');if(crumb)crumb.textContent=familyLabels[routeKey()]||crumb.textContent;}
function returnToFamily(event){const trigger=event.target.closest?.('[data-v158-family-return],[data-v158-family-mobile]');if(!trigger)return false;if(document.body.dataset.experience==='research')document.querySelector('.experience-toggle')?.click();location.hash='dashboard';return true;}
function focusContextSearch(event){const trigger=event.target.closest?.('[data-dock-search]');if(!trigger)return false;document.querySelector('.v158-mobile-more')?.removeAttribute('open');const input=document.getElementById('search');if(!input)return true;input.scrollIntoView({behavior:'smooth',block:'center'});requestAnimationFrame(()=>input.focus({preventScroll:true}));return true;}
function apply(){rebuildDesktopNav();syncBrand();contextualSearch();rebuildMobileDock();syncCrumb();}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

document.addEventListener('click',event=>{if(returnToFamily(event)){event.preventDefault();schedule();return;}if(focusContextSearch(event)){event.preventDefault();return;}});
window.addEventListener('family-view-rendered',schedule);window.addEventListener('hashchange',schedule);window.addEventListener('family-auth-ui-refresh',schedule);window.addEventListener('family-experience-changed',schedule);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
