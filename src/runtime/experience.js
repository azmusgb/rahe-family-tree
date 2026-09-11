// Current experience boundary: family/research mode, responsive shell,
// person/tree presentation, and canonical graph platform integration.
import{personById,esc}from'../../core.js';
import '../../v15-1-runtime.js';
import '../../v15-family-focus.js';
import '../../platform-v13-runtime.js';

const UI_RELEASE='15.4.0';
const RECENT_KEY='rahe.family.recentPeople.v1';
const STALE_RELOAD_KEY='rahe.family.uiReload.v15';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const routeId=()=>location.hash.slice(1).split('/')[1]||'';
const isFamilyMode=()=>document.body.dataset.experience!=='research';
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();
const initials=name=>String(name||'?').replace(/\/.*/,'').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
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

let mediaSummary=null,mediaPromise=null;
async function getMediaSummary(){
  if(mediaSummary)return mediaSummary;
  if(!mediaPromise)mediaPromise=fetch('/api/media',{credentials:'same-origin',cache:'no-store'}).then(async response=>{const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)return null;const rows=Array.isArray(data.media)?data.media:[];return{count:rows.length,photos:rows.filter(m=>String(m.mime||'').startsWith('image/')).length,documents:rows.filter(m=>!String(m.mime||'').startsWith('image/')).length,authenticated:Boolean(data.authenticated)};}).catch(()=>null);
  mediaSummary=await mediaPromise;return mediaSummary;
}
function recentCard(person){return`<article class="dashboard-person recent-person"><a href="#person/${esc(person.id)}" class="dashboard-person-open"><span class="dashboard-avatar" aria-hidden="true">${esc(initials(person.name))}</span><span><b>${esc(person.name)}</b><small>${esc(cleanBranch(person.branch))}${person.dates?` · ${esc(person.dates)}`:''}</small></span></a></article>`;}
function enhanceRecentPeople(){
  if(!isFamilyMode()||routeKey()!=='dashboard')return;
  const content=document.querySelector('#content');if(!content||content.querySelector('.dashboard-recent'))return;
  const recent=readRecent().map(personById).filter(Boolean).slice(0,4);if(!recent.length)return;
  const featured=[...content.querySelectorAll('.dashboard-section')].find(section=>/FEATURED PEOPLE/i.test(section.querySelector('.eyebrow')?.textContent||''));if(!featured)return;
  featured.insertAdjacentHTML('afterend',`<section class="dashboard-section dashboard-recent" aria-labelledby="dashboard-recent-title"><div class="section-title"><div><p class="eyebrow">CONTINUE EXPLORING</p><h2 id="dashboard-recent-title">Recently viewed people</h2></div><a href="#people">Browse all people ↗</a></div><div class="dashboard-people-strip dashboard-recent-strip">${recent.map(recentCard).join('')}</div></section>`);
}
async function enhanceMediaMetric(){
  if(!isFamilyMode()||routeKey()!=='dashboard')return;
  const metrics=document.querySelector('.dashboard-family-metrics');if(!metrics)return;
  const data=await getMediaSummary();if(!data||!isFamilyMode()||routeKey()!=='dashboard'||!document.body.contains(metrics))return;
  let metric=metrics.querySelector('[data-live-media-metric]');if(!metric){metric=document.createElement('span');metric.dataset.liveMediaMetric='';metrics.appendChild(metric);}
  const html=`<b>${data.count}</b><small>${data.authenticated?'visible media items':'public media items'}</small>`;if(metric.innerHTML!==html)metric.innerHTML=html;
  const action=[...document.querySelectorAll('.dashboard-hero-actions .action')].find(link=>/photos|documents|media/i.test(link.textContent||''));
  if(action){if(action.getAttribute('href')!=='#media')action.setAttribute('href','#media');setText(action,data.count?`Browse ${data.count} media item${data.count===1?'':'s'}`:'Browse photos & documents');}
}
function addDashboardPaths(){
  if(!isFamilyMode()||routeKey()!=='dashboard')return;
  const hero=document.querySelector('.dashboard-hero');if(!hero||document.querySelector('.dashboard-paths'))return;
  hero.insertAdjacentHTML('afterend','<nav class="dashboard-paths" aria-label="Explore family history"><a href="#tree"><b>Tree</b><span>Explore family connections</span></a><a href="#media"><b>Media</b><span>Browse photographs and documents</span></a><a href="#timeline"><b>Timeline</b><span>Follow the family through time</span></a><a href="#people"><b>People</b><span>Browse the family archive</span></a></nav>');
}
function updateVersion(){const badge=document.querySelector('.version');if(!badge||routeKey().startsWith('intake'))return;setText(badge,isFamilyMode()?`FAMILY VIEW · v${UI_RELEASE}`:`RESEARCH MODE · v${UI_RELEASE}`);}
function syncRouteState(){document.body.dataset.route=routeKey();document.documentElement.dataset.uiRelease=UI_RELEASE;syncDock();recordCurrentPerson();updateVersion();enhanceRecentPeople();addDashboardPaths();enhanceMediaMetric();}

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
window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);window.addEventListener('family-view-rendered',schedule);window.addEventListener('family-edits-changed',schedule);window.addEventListener('family-media-changed',()=>{mediaSummary=null;mediaPromise=null;schedule();});window.addEventListener('family-auth-changed',()=>{mediaSummary=null;mediaPromise=null;schedule();});window.addEventListener('family-auth-ui-refresh',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
