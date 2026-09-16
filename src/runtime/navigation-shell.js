import{familyPrimary,familyExplore,researchPrimary,familyLabels,researchRoutes,owningSection,linksHtml}from'./navigation-model.js';
import{routeKeyFromLocation,routeDetailFromLocation}from'./navigation-runtime.js';

const routeKey=routeKeyFromLocation;
const routeDetail=routeDetailFromLocation;
const familyRoutes=new Set(['dashboard','tree','people','person','families','branch','media','stories','timeline','migration']);
const transientSelector='.mobile-more[open],.v158-mobile-more[open],.nav-menu[open],.nav-menu[open],.site-tools[open],.tools-menu[open]';
const persistedLinkData=new Map();
let navObserver=null;
function isResearchContext(route=routeKey()){if(researchRoutes.has(route))return true;if(familyRoutes.has(route))return false;return document.body.dataset.experience==='research';}
function branchCrumb(){if(routeKey()!=='branch')return'';try{return decodeURIComponent(routeDetail())||'Family';}catch{return routeDetail()||'Family';}}

function familyPrimaryHtml(){return linksHtml(familyPrimary);}
function familyMenus(){return `<details class="nav-menu explore-menu nav-menu v158-explore"><summary aria-expanded="false">Explore</summary><div class="nav-popover v151-nav-popover">${linksHtml(familyExplore)}</div></details><a class="research-entry v158-research-entry" href="#research">Research</a>`;}
function researchPrimaryHtml(){return linksHtml(researchPrimary);}
function researchMenus(){return `<a class="family-return v158-family-return" href="#dashboard" data-family-return data-v158-family-return>← Back to Family</a>`;}

function preserveActions(menus){return menus?.querySelector('.page-actions--desktop,.v155-desktop-actions')||null;}
function routeFromLink(link){const href=link.getAttribute('href')||'';return href.startsWith('#')?href.slice(1).split('/')[0]:'';}
function markCurrent(container,selector,key){container?.querySelectorAll(selector).forEach(link=>{const active=link.dataset.navKey===key||link.dataset.dockRoute===key||routeFromLink(link)===key;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});}
function closeTransientNavigation(except=null){document.querySelectorAll(transientSelector).forEach(details=>{if(details===except)return;details.removeAttribute('open');details.querySelector(':scope > summary')?.setAttribute('aria-expanded','false');});}
function rememberPersistentLinks(root){
  if(!root)return;
  const anchors=[];
  if(root.nodeType===Node.ELEMENT_NODE&&root.matches?.('a[data-persistence-probe]'))anchors.push(root);
  root.querySelectorAll?.('a[data-persistence-probe]').forEach(anchor=>anchors.push(anchor));
  for(const anchor of anchors){const href=anchor.getAttribute('href'),probe=anchor.dataset.persistenceProbe;if(href&&probe)persistedLinkData.set(href,probe);}
}
function restorePersistentLinks(root){for(const[href,probe]of persistedLinkData){const anchor=root?.querySelector?.(`a[href="${CSS.escape(href)}"]`);if(anchor)anchor.dataset.persistenceProbe=probe;}}
function ensureDesktopContainers(){
  const nav=document.getElementById('nav');if(!nav)return{nav:null,primary:null,menus:null};
  let primary=nav.querySelector('.primary-nav,.v151-primary-nav'),menus=nav.querySelector('.nav-menus,.v151-nav-menus');
  if(!primary||!menus){
    rememberPersistentLinks(nav);
    const actions=preserveActions(nav);
    primary=document.createElement('div');primary.className='primary-nav v151-primary-nav';
    menus=document.createElement('div');menus.className='nav-menus v151-nav-menus';
    nav.replaceChildren(primary,menus);
    if(actions)menus.append(actions);
  }
  primary.classList.add('primary-nav','v151-primary-nav');menus.classList.add('nav-menus','v151-nav-menus');
  nav.dataset.navigationOwner='shell';
  return{nav,primary,menus};
}
function rebuildDesktopNav(route=routeKey()){
  const{nav,primary,menus}=ensureDesktopContainers();if(!nav||!primary||!menus)return;
  const research=isResearchContext(route),context=research?'research':'family';
  // The containers themselves are persistent. Only a real Family ↔ Research
  // boundary replaces their contents; legacy runtimes may no longer own #nav.
  if(primary.dataset.navContext!==context||menus.dataset.navContext!==context){
    const actions=preserveActions(menus);
    primary.innerHTML=research?researchPrimaryHtml():familyPrimaryHtml();
    menus.innerHTML=research?researchMenus():familyMenus();
    if(actions)menus.append(actions);
    primary.dataset.navContext=context;menus.dataset.navContext=context;
  }
  document.body.dataset.navContext=context;document.body.dataset.v158Context=context;
  const current=owningSection(route);markCurrent(primary,'[data-nav-key],a[href^="#"]',current);markCurrent(menus,'[data-nav-key],a[href^="#"]',current);restorePersistentLinks(nav);
}
function syncBrand(route=routeKey()){
  const research=isResearchContext(route),context=research?'research':'family',brand=document.querySelector('.brand span:last-child');
  if(brand&&brand.dataset.navContext!==context){brand.innerHTML=research?'RAHE FAMILY<small>RESEARCH CENTER</small>':'RAHE FAMILY<small>HISTORY ARCHIVE</small>';brand.dataset.navContext=context;}
  const monogram=document.querySelector('.brand .monogram');if(monogram)monogram.textContent='R';
  const edition=document.querySelector('.edition');if(edition)edition.innerHTML=research?'<b>RESEARCH WORKSPACE</b>Evidence · sources · conflicts · acquisition':'<b>SOURCE-BACKED ARCHIVE</b>Family history · privacy protected';
}
function contextualSearch(route=routeKey()){
  const label=document.querySelector('#filters .search'),input=document.getElementById('search'),filters=document.getElementById('filters'),family=!isResearchContext(route);
  if(!label||!input||!filters)return;
  const hideFamilyFilters=family&&['dashboard','families','branch'].includes(route);filters.hidden=hideFamilyFilters;
  if(hideFamilyFilters&&input.value){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}
  const routeShell=document.querySelector('.route-shell');routeShell?.classList.toggle('v175-no-inline-search',hideFamilyFilters);
  const text={tree:'Jump to a person',people:'Search people and branches',person:'Find another relative',media:'Search photos, people or places',stories:'Search family stories',timeline:'Search the family timeline',migration:'Search places and branches'}[route]||(isResearchContext(route)?'Search the research archive':'Search the family');
  const placeholder={tree:'Enter a family member…',people:'Name, branch, or place…',person:'Search for another relative…',media:'Person, place, date, or caption…',stories:'Person, place, event, or year…',timeline:'Person, event, place, or year…',migration:'Place, branch, or person…'}[route]||(isResearchContext(route)?'Claim, source, person, or record…':'Name, branch, or place…');
  label.childNodes[0].nodeValue=text;input.placeholder=placeholder;routeShell?.classList.toggle('v158-context-search',family&&!hideFamilyFilters);
}
function rebuildMobileDock(route=routeKey()){
  const dock=document.getElementById('family-mobile-dock');if(!dock)return;
  const research=isResearchContext(route),context=research?'research':'family';dock.hidden=false;
  if(dock.dataset.navContext!==context){
    dock.innerHTML=research?`<a href="#intelligence" data-dock-route="intelligence"><span>Overview</span></a><a href="#evidence" data-dock-route="evidence"><span>Evidence</span></a><a href="#sources" data-dock-route="sources"><span>Sources</span></a><a href="#dashboard" data-v158-family-mobile><span>Family</span></a>`:`<a href="#dashboard" data-dock-route="dashboard"><span>Home</span></a><a href="#tree" data-dock-route="tree"><span>Tree</span></a><a href="#families" data-dock-route="families"><span>Families</span></a><a href="#people" data-dock-route="people"><span>People</span></a><details class="mobile-more v158-mobile-more" data-keep-open="true"><summary aria-haspopup="dialog" aria-expanded="false">More</summary><div role="dialog" aria-modal="true" aria-label="More family navigation"><div class="mobile-more-head"><strong>More</strong><button type="button" data-mobile-more-close aria-label="Close menu">Close</button></div><button type="button" data-dock-search>Search</button><a href="#media">Photos</a>${familyExplore.map(item=>`<a href="${item.href}">${item.label.replace(' & Migration','')}</a>`).join('')}<a href="#research">Research</a></div></details>`;
    dock.dataset.navContext=context;
  }
  markCurrent(dock,'[data-dock-route],a[href^="#"]',owningSection(route));
}
function syncCrumb(){const crumb=document.getElementById('crumb');if(crumb){crumb.textContent=branchCrumb()||familyLabels[routeKey()]||crumb.textContent;crumb.setAttribute('aria-current','page');}}
function returnToFamily(event){const trigger=event.target.closest?.('[data-family-return],[data-v158-family-return],[data-v158-family-mobile]');if(!trigger)return false;if(document.body.dataset.experience==='research')document.querySelector('.experience-toggle')?.click();location.hash='dashboard';return true;}
function focusSearchInput(){const input=document.getElementById('search'),filters=document.getElementById('filters');if(!input||!filters)return false;if(filters.hidden)return false;filters.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});requestAnimationFrame(()=>input.focus({preventScroll:true}));return true;}
function openGlobalSearch(){closeTransientNavigation();if(focusSearchInput())return;if(isResearchContext()){location.hash='research';setTimeout(focusSearchInput,180);return;}location.hash='people';let tries=0;const focus=()=>{if(focusSearchInput()||tries++>8)return;requestAnimationFrame(focus);};requestAnimationFrame(focus);}
function syncHeaderContext(route=routeKey()){const header=document.querySelector('.site-header');if(header)header.dataset.context=isResearchContext(route)?'research':'family';document.querySelectorAll('.v151-primary-nav').forEach(el=>el.classList.add('primary-nav'));document.querySelectorAll('.v151-nav-menus').forEach(el=>el.classList.add('nav-menus'));document.querySelectorAll('.nav-menu').forEach(el=>el.classList.add('nav-menu'));document.querySelectorAll('.v151-nav-popover').forEach(el=>el.classList.add('nav-popover'));document.querySelectorAll('.v158-research-entry').forEach(el=>el.classList.add('research-entry'));document.querySelectorAll('.v158-family-return').forEach(el=>el.classList.add('family-return'));document.querySelectorAll('.v158-mobile-more').forEach(el=>el.classList.add('mobile-more'));document.querySelector('.v153-profile-nav')?.classList.add('profile-nav');document.querySelectorAll('.nav-menu[open],.mobile-more[open]').forEach(details=>{if(details.dataset.keepOpen!=='true')details.removeAttribute('open');});document.querySelectorAll('.nav-menu,.mobile-more,.site-tools,.tools-menu').forEach(details=>details.querySelector(':scope > summary')?.setAttribute('aria-expanded',String(details.open)));}
function apply(route=routeKey()){rebuildDesktopNav(route);syncBrand(route);contextualSearch(route);rebuildMobileDock(route);syncCrumb();syncHeaderContext(route);document.body.dataset.navigationShellRoute=route;}
function previewRoute(route){if(!route||isResearchContext(route)!==isResearchContext())return;const current=owningSection(route);markCurrent(document.querySelector('.primary-nav,.v151-primary-nav'),'[data-nav-key],a[href^="#"]',current);markCurrent(document.getElementById('family-mobile-dock'),'[data-dock-route],a[href^="#"]',current);document.body.dataset.navigationShellRoute=route;}
function observeNavigationOwnership(){
  const nav=document.getElementById('nav');if(!nav||navObserver)return;
  navObserver=new MutationObserver(mutations=>{
    let structural=false;
    for(const mutation of mutations){
      if(mutation.type==='childList'){structural=true;mutation.removedNodes.forEach(rememberPersistentLinks);}
      else if(mutation.type==='attributes')rememberPersistentLinks(mutation.target);
    }
    if(structural&&(!nav.querySelector('.primary-nav')||!nav.querySelector('.nav-menus')))apply(routeKey());
  });
  navObserver.observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['data-persistence-probe']});
}

document.addEventListener('click',event=>{
  const openOwner=event.target.closest?.('.mobile-more,.v158-mobile-more,.nav-menu,.nav-menu,.site-tools,.tools-menu');
  if(openOwner)closeTransientNavigation(openOwner);else closeTransientNavigation();
  const navLink=event.target.closest?.('#family-mobile-dock a[href^="#"],#nav a[href^="#"],.site-header .brand[href^="#"]');
  if(navLink)closeTransientNavigation();
  if(returnToFamily(event)){event.preventDefault();apply('dashboard');return;}
  if(event.target.closest?.('[data-mobile-more-close]')){event.preventDefault();closeTransientNavigation();return;}
  if(event.target.closest?.('[data-dock-search],[data-global-search]')){event.preventDefault();openGlobalSearch();}
},true);
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const open=document.querySelector(transientSelector);if(!open)return;
  event.preventDefault();const summary=open.querySelector(':scope > summary');closeTransientNavigation();summary?.focus();
},true);
document.addEventListener('toggle',event=>{const details=event.target;if(!(details instanceof HTMLDetailsElement)||!details.matches('.mobile-more,.v158-mobile-more,.nav-menu,.nav-menu,.site-tools,.tools-menu'))return;details.querySelector(':scope > summary')?.setAttribute('aria-expanded',String(details.open));if(details.open)closeTransientNavigation(details);},true);

// Intent gives immediate feedback. Route commit and hashchange synchronize the
// shell synchronously. The nav-root observer is a compatibility firewall: if a
// legacy renderer still writes #nav, the semantic shell is restored in the same
// microtask and the root remains shell-owned for all delayed legacy relayouts.
window.addEventListener('family-route-intent',event=>{closeTransientNavigation();previewRoute(event.detail?.route);});
window.addEventListener('family-route-committed',event=>{closeTransientNavigation();apply(event.detail?.route||routeKey());});
window.addEventListener('hashchange',()=>{closeTransientNavigation();apply(routeKey());});
window.addEventListener('family-view-rendered',()=>apply(routeKey()));
window.addEventListener('family-native-rendered',()=>apply(routeKey()));
window.addEventListener('popstate',closeTransientNavigation);
window.addEventListener('family-auth-ui-refresh',()=>apply());
window.addEventListener('family-experience-changed',()=>apply());
const start=()=>{apply();observeNavigationOwnership();};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
