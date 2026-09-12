// Primary experience behavior: family/research mode, responsive shell,
// navigation state, recent-person memory, and production freshness guards.
// Family route content is rendered by the native v17 archive controller.
import{personById}from'../../core.js';

const UI_RELEASE='17.0.0';
const RECENT_KEY='rahe.family.recentPeople.v1';
const STALE_RELOAD_KEY='rahe.family.uiReload.v17.0';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const routeId=()=>location.hash.slice(1).split('/')[1]||'';
const isFamilyMode=()=>document.body.dataset.experience!=='research';
const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};

function readRecent(){try{const value=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(value)?value.filter(id=>typeof id==='string').slice(0,6):[];}catch{return[];}}
function writeRecent(ids){try{localStorage.setItem(RECENT_KEY,JSON.stringify(ids.slice(0,6)));}catch{}}
function recordCurrentPerson(){if(!isFamilyMode()||routeKey()!=='person')return;const id=routeId(),person=personById(id);if(!person)return;const before=readRecent(),after=[id,...before.filter(value=>value!==id)].slice(0,6);if(JSON.stringify(before)!==JSON.stringify(after))writeRecent(after);}

function syncDock(){
  const dock=document.querySelector('#family-mobile-dock');
  if(!dock)return;
  const family=isFamilyMode();dock.hidden=!family;
  if(!family)return;
  const key=routeKey();
  dock.querySelectorAll('[data-dock-route]').forEach(link=>{const active=link.dataset.dockRoute===key;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
}
function navigate(href){
  if(!href?.startsWith('#'))return;
  if(location.hash===href)window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash=href;
  requestAnimationFrame(()=>document.querySelector('#main')?.focus({preventScroll:true}));
}
function focusSearch(){
  const filters=document.querySelector('#filters'),input=document.querySelector('#search');
  if(!input)return;
  filters?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  setTimeout(()=>input.focus({preventScroll:true}),120);
}
function installDockControls(){
  document.addEventListener('click',event=>{
    const search=event.target.closest?.('#family-mobile-dock [data-dock-search]');
    if(search){event.preventDefault();focusSearch();return;}
    const link=event.target.closest?.('#family-mobile-dock a[href^="#"]');
    if(link){event.preventDefault();navigate(link.getAttribute('href'));}
  });
}
function installTreeNodeControls(){
  document.addEventListener('click',event=>{
    if(routeKey()!=='tree')return;
    if(event.target.closest?.('[data-collapse-person]'))return;
    const node=event.target.closest?.('.graph-node[data-person]');
    if(!node)return;
    event.preventDefault();
    navigate(`#person/${node.dataset.person}`);
  },true);
}
function updateVersion(){const badge=document.querySelector('.version');if(!badge||routeKey().startsWith('intake'))return;setText(badge,isFamilyMode()?`FAMILY VIEW · v${UI_RELEASE}`:`RESEARCH MODE · v${UI_RELEASE}`);}
function syncRouteState(){document.body.dataset.route=routeKey();document.documentElement.dataset.uiRelease=UI_RELEASE;syncDock();recordCurrentPerson();updateVersion();}

let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduled=false;syncRouteState();}));}

async function checkCurrentBuild(){
  try{
    const response=await fetch(`/build-info.json?ui-check=${Date.now()}`,{cache:'no-store'});if(!response.ok)return;
    const info=await response.json();const deployed=String(info.experience||'');
    if(deployed&&deployed!==UI_RELEASE&&sessionStorage.getItem(STALE_RELOAD_KEY)!==deployed){sessionStorage.setItem(STALE_RELOAD_KEY,deployed);const url=new URL(location.href);url.searchParams.set('ui',deployed);location.replace(url.href);}
  }catch{}
}
function installFreshnessGuard(){
  window.addEventListener('pageshow',event=>{if(event.persisted){location.reload();return;}checkCurrentBuild();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkCurrentBuild();});
}

installDockControls();installTreeNodeControls();installFreshnessGuard();
window.addEventListener('hashchange',schedule);
window.addEventListener('popstate',schedule);
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-edits-changed',schedule);
window.addEventListener('family-media-changed',schedule);
window.addEventListener('family-auth-changed',schedule);
window.addEventListener('family-auth-ui-refresh',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();