import{displayPeople,personById,esc}from'./core.js';

const RECENT_KEY='rahe.family.recentPeople.v1';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const routeId=()=>location.hash.slice(1).split('/')[1]||'';
const isFamilyMode=()=>document.body.dataset.experience!=='research';
const initials=name=>String(name||'?').replace(/\/.*/,'').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();

function readRecent(){try{const v=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,6):[];}catch{return[];}}
function writeRecent(ids){try{localStorage.setItem(RECENT_KEY,JSON.stringify(ids.slice(0,6)));}catch{}}
function recordCurrentPerson(){if(!isFamilyMode()||routeKey()!=='person')return;const id=routeId(),p=personById(id);if(!p)return;writeRecent([id,...readRecent().filter(x=>x!==id)]);}

function ensureMobileDock(){
  let dock=document.querySelector('.family-mobile-dock');
  if(!isFamilyMode()){dock?.remove();return;}
  if(!dock){
    dock=document.createElement('nav');dock.className='family-mobile-dock';dock.setAttribute('aria-label','Quick family navigation');
    dock.innerHTML='<a href="#dashboard" data-dock-route="dashboard">Home</a><a href="#tree" data-dock-route="tree">Tree</a><button type="button" data-dock-search>Search</button><a href="#people" data-dock-route="people">People</a><a href="#media" data-dock-route="media">Media</a>';
    document.body.appendChild(dock);
    dock.querySelector('[data-dock-search]')?.addEventListener('click',()=>{const filters=document.querySelector('#filters'),input=document.querySelector('#search');filters?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});setTimeout(()=>input?.focus({preventScroll:true}),160);});
  }
  const key=routeKey();dock.querySelectorAll('[data-dock-route]').forEach(a=>{const active=a.dataset.dockRoute===key;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
}

let mediaSummary=null,mediaPromise=null;
async function getMediaSummary(){
  if(mediaSummary)return mediaSummary;
  if(!mediaPromise)mediaPromise=fetch('/api/media',{credentials:'same-origin',cache:'no-store'}).then(async r=>{const x=await r.json().catch(()=>null);if(!r.ok||!x?.ok)return null;const rows=Array.isArray(x.media)?x.media:[];return{count:rows.length,photos:rows.filter(m=>String(m.mime||'').startsWith('image/')).length,documents:rows.filter(m=>!String(m.mime||'').startsWith('image/')).length,authenticated:Boolean(x.authenticated)};}).catch(()=>null);
  mediaSummary=await mediaPromise;return mediaSummary;
}

function recentCard(p){return`<article class="dashboard-person recent-person"><a href="#person/${esc(p.id)}" class="dashboard-person-open"><span class="dashboard-avatar" aria-hidden="true">${esc(initials(p.name))}</span><span><b>${esc(p.name)}</b><small>${esc(cleanBranch(p.branch))}${p.dates?` · ${esc(p.dates)}`:''}</small></span></a></article>`;}
function enhanceRecentPeople(){
  if(!isFamilyMode()||routeKey()!=='dashboard')return;
  const content=document.querySelector('#content');if(!content||content.querySelector('.dashboard-recent'))return;
  const recent=readRecent().map(personById).filter(Boolean).slice(0,4);if(!recent.length)return;
  const featured=[...content.querySelectorAll('.dashboard-section')].find(s=>/FEATURED PEOPLE/i.test(s.querySelector('.eyebrow')?.textContent||''));if(!featured)return;
  featured.insertAdjacentHTML('afterend',`<section class="dashboard-section dashboard-recent" aria-labelledby="dashboard-recent-title"><div class="section-title"><div><p class="eyebrow">CONTINUE EXPLORING</p><h2 id="dashboard-recent-title">Recently viewed people</h2></div><a href="#people">Browse all people ↗</a></div><div class="dashboard-people-strip dashboard-recent-strip">${recent.map(recentCard).join('')}</div></section>`);
}
async function enhanceMediaMetric(){
  if(!isFamilyMode()||routeKey()!=='dashboard')return;const metrics=document.querySelector('.dashboard-family-metrics');if(!metrics)return;
  const data=await getMediaSummary();if(!data||!isFamilyMode()||routeKey()!=='dashboard'||!document.body.contains(metrics))return;
  let metric=metrics.querySelector('[data-live-media-metric]');if(!metric){metric=document.createElement('span');metric.dataset.liveMediaMetric='';metrics.appendChild(metric);}metric.innerHTML=`<b>${data.count}</b><small>${data.authenticated?'visible media items':'public media items'}</small>`;
  const mediaAction=[...document.querySelectorAll('.dashboard-hero-actions .action')].find(a=>/photos|documents|media/i.test(a.textContent||''));if(mediaAction){mediaAction.href='#media';mediaAction.textContent=data.count?`Browse ${data.count} media item${data.count===1?'':'s'}`:'Browse photos & documents';}
}
function addDashboardPaths(){
  if(!isFamilyMode()||routeKey()!=='dashboard')return;const hero=document.querySelector('.dashboard-hero');if(!hero||document.querySelector('.dashboard-paths'))return;
  hero.insertAdjacentHTML('afterend','<nav class="dashboard-paths" aria-label="Explore family history"><a href="#timeline"><b>Timeline</b><span>Follow the family through time</span></a><a href="#media"><b>Media</b><span>Browse photographs and documents</span></a><a href="#research"><b>Open research</b><span>See the records still being sought</span></a><a href="#archive"><b>Archive</b><span>Open the complete source-controlled dossier</span></a></nav>');
}
function updateVersion(){
  const badge=document.querySelector('.version');if(!badge||routeKey().startsWith('intake'))return;
  badge.textContent=isFamilyMode()?'FAMILY VIEW · v14.0':'RESEARCH MODE · v14.0';
}
function apply(){recordCurrentPerson();ensureMobileDock();updateVersion();enhanceRecentPeople();addDashboardPaths();enhanceMediaMetric();}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduled=false;apply();}));}
window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);window.addEventListener('family-edits-changed',schedule);window.addEventListener('family-media-changed',()=>{mediaSummary=null;mediaPromise=null;schedule();});window.addEventListener('family-auth-changed',()=>{mediaSummary=null;mediaPromise=null;schedule();});window.addEventListener('family-auth-ui-refresh',schedule);
const content=document.querySelector('#content');if(content)new MutationObserver(schedule).observe(content,{childList:true,subtree:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
