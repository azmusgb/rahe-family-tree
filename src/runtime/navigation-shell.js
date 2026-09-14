import{familyPrimary,familyExplore,researchPrimary,familyLabels,researchRoutes,owningSection,linksHtml}from'./navigation-model.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const routeDetail=()=>location.hash.slice(1).split('/').slice(1).join('/');
function isResearchContext(){return document.body.dataset.experience==='research'||researchRoutes.has(routeKey());}
function branchCrumb(){if(routeKey()!=='branch')return'';try{return decodeURIComponent(routeDetail())||'Family';}catch{return routeDetail()||'Family';}}

function familyPrimaryHtml(){return linksHtml(familyPrimary);}
function familyMenus(){return `<details class="nav-menu explore-menu v151-nav-menu v158-explore"><summary>Explore</summary><div class="nav-popover v151-nav-popover">${linksHtml(familyExplore)}</div></details><a class="research-entry v158-research-entry" href="#research">Research</a>`;}
function researchPrimaryHtml(){return linksHtml(researchPrimary);}
function researchMenus(){return `<a class="family-return v158-family-return" href="#dashboard" data-family-return data-v158-family-return>← Back to Family</a>`;}

function preserveActions(menus){return menus?.querySelector('.page-actions--desktop,.v155-desktop-actions')||null;}
function markCurrent(container,selector,key){container?.querySelectorAll(selector).forEach(link=>{const active=link.dataset.navKey===key||link.dataset.dockRoute===key;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});}
function rebuildDesktopNav(){
  const primary=document.querySelector('.primary-nav,.v151-primary-nav'),menus=document.querySelector('.nav-menus,.v151-nav-menus');
  primary?.classList.add('primary-nav');menus?.classList.add('nav-menus');
  if(!primary||!menus)return;
  const research=isResearchContext(),context=research?'research':'family';
  if(primary.dataset.navContext!==context||menus.dataset.navContext!==context){
    const actions=preserveActions(menus);
    primary.innerHTML=research?researchPrimaryHtml():familyPrimaryHtml();
    menus.innerHTML=research?researchMenus():familyMenus();
    if(actions)menus.append(actions);
    primary.dataset.navContext=context;menus.dataset.navContext=context;
  }
  document.body.dataset.navContext=context;document.body.dataset.v158Context=context;
  const current=owningSection(routeKey());markCurrent(primary,'[data-nav-key]',current);markCurrent(menus,'[data-nav-key]',current);
}
function syncBrand(){
  const research=isResearchContext(),context=research?'research':'family',brand=document.querySelector('.brand span:last-child');
  if(brand&&brand.dataset.navContext!==context){brand.innerHTML=research?'RAHE FAMILY<small>RESEARCH CENTER</small>':'RAHE FAMILY<small>HISTORY ARCHIVE</small>';brand.dataset.navContext=context;}
  const monogram=document.querySelector('.brand .monogram');if(monogram)monogram.textContent='R';
  const edition=document.querySelector('.edition');if(edition)edition.innerHTML=research?'<b>RESEARCH WORKSPACE</b>Evidence · sources · conflicts · acquisition':'<b>SOURCE-BACKED ARCHIVE</b>Family history · privacy protected';
}
function contextualSearch(){
  const route=routeKey(),label=document.querySelector('#filters .search'),input=document.getElementById('search'),filters=document.getElementById('filters'),family=!isResearchContext();
  if(!label||!input||!filters)return;
  const hideFamilyFilters=family&&['dashboard','families','branch'].includes(route);filters.hidden=hideFamilyFilters;
  if(hideFamilyFilters&&input.value){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}
  const routeShell=document.querySelector('.route-shell');routeShell?.classList.toggle('v175-no-inline-search',hideFamilyFilters);
  const text={tree:'Jump to a person',people:'Search people and branches',person:'Find another relative',media:'Search photos, people or places',stories:'Search family stories',timeline:'Search the family timeline',migration:'Search places and branches'}[route]||(isResearchContext()?'Search the research archive':'Search the family');
  const placeholder={tree:'Enter a family member…',people:'Name, branch, or place…',person:'Search for another relative…',media:'Person, place, date, or caption…',stories:'Person, place, event, or year…',timeline:'Person, event, place, or year…',migration:'Place, branch, or person…'}[route]||(isResearchContext()?'Claim, source, person, or record…':'Name, branch, or place…');
  label.childNodes[0].nodeValue=text;input.placeholder=placeholder;routeShell?.classList.toggle('v158-context-search',family&&!hideFamilyFilters);
}
function rebuildMobileDock(){
  const dock=document.getElementById('family-mobile-dock');if(!dock)return;
  const research=isResearchContext(),context=research?'research':'family';dock.hidden=false;
  if(dock.dataset.navContext!==context){
    dock.innerHTML=research?`<a href="#intelligence" data-dock-route="intelligence"><span>Overview</span></a><a href="#evidence" data-dock-route="evidence"><span>Evidence</span></a><a href="#sources" data-dock-route="sources"><span>Sources</span></a><a href="#dashboard" data-v158-family-mobile><span>Family</span></a>`:`<a href="#dashboard" data-dock-route="dashboard"><span>Home</span></a><a href="#tree" data-dock-route="tree"><span>Tree</span></a><a href="#families" data-dock-route="families"><span>Families</span></a><a href="#people" data-dock-route="people"><span>People</span></a><details class="mobile-more v158-mobile-more"><summary>More</summary><div><button type="button" data-dock-search>Search</button><a href="#media">Photos</a>${familyExplore.map(item=>`<a href="${item.href}">${item.label.replace(' & Migration','')}</a>`).join('')}<a href="#research">Research</a></div></details>`;
    dock.dataset.navContext=context;
  }
  markCurrent(dock,'[data-dock-route]',owningSection(routeKey()));
}
function syncCrumb(){const crumb=document.getElementById('crumb');if(crumb)crumb.textContent=branchCrumb()||familyLabels[routeKey()]||crumb.textContent;}
function returnToFamily(event){const trigger=event.target.closest?.('[data-family-return],[data-v158-family-return],[data-v158-family-mobile]');if(!trigger)return false;if(document.body.dataset.experience==='research')document.querySelector('.experience-toggle')?.click();location.hash='dashboard';return true;}
function focusSearchInput(){const input=document.getElementById('search'),filters=document.getElementById('filters');if(!input||!filters)return false;if(filters.hidden)return false;filters.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});requestAnimationFrame(()=>input.focus({preventScroll:true}));return true;}
function openGlobalSearch(){document.querySelector('.mobile-more,.v158-mobile-more')?.removeAttribute('open');if(focusSearchInput())return;if(isResearchContext()){location.hash='research';setTimeout(focusSearchInput,180);return;}location.hash='people';let tries=0;const focus=()=>{if(focusSearchInput()||tries++>8)return;requestAnimationFrame(focus);};requestAnimationFrame(focus);}
function syncHeaderContext(){const header=document.querySelector('.site-header');if(header)header.dataset.context=isResearchContext()?'research':'family';document.querySelectorAll('.v151-nav-menu').forEach(el=>el.classList.add('nav-menu'));document.querySelectorAll('.v151-nav-popover').forEach(el=>el.classList.add('nav-popover'));document.querySelectorAll('.v158-research-entry').forEach(el=>el.classList.add('research-entry'));document.querySelectorAll('.v158-family-return').forEach(el=>el.classList.add('family-return'));document.querySelectorAll('.v158-mobile-more').forEach(el=>el.classList.add('mobile-more'));document.querySelector('.v153-profile-nav')?.classList.add('profile-nav');document.querySelectorAll('.nav-menu[open],.mobile-more[open]').forEach(details=>{if(details.dataset.keepOpen!=='true')details.removeAttribute('open');});}
function apply(){rebuildDesktopNav();syncBrand();contextualSearch();rebuildMobileDock();syncCrumb();syncHeaderContext();}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

document.addEventListener('click',event=>{if(returnToFamily(event)){event.preventDefault();schedule();return;}if(event.target.closest?.('[data-dock-search],[data-global-search]')){event.preventDefault();openGlobalSearch();}});
window.addEventListener('family-view-rendered',schedule);window.addEventListener('family-native-rendered',schedule);window.addEventListener('hashchange',schedule);window.addEventListener('family-auth-ui-refresh',schedule);window.addEventListener('family-experience-changed',schedule);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
