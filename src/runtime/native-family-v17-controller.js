import{personById}from'../../core.js';
import{renderTree}from'../../graph.js';
import{renderNativeHome,renderNativePeople,renderNativePerson,hydrateNativeFamily}from'./native-family-v17.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamily=()=>document.body.dataset.experience!=='research';
const nativeRoutes=new Set(['dashboard','tree','people','person']);

function nativeMarkup(route){
  if(route==='dashboard')return renderNativeHome();
  if(route==='tree')return`<div class="v17-native v17-tree" data-v17-native="tree">${renderTree()}</div>`;
  if(route==='people')return renderNativePeople();
  if(route==='person')return renderNativePerson(location.hash.split('/')[1]||'');
  return'';
}

function enforcePublicPrivacy(route,content){
  if(route==='people'){
    const summary=content.querySelector('.v17-branch-summary p');
    if(summary&&summary.textContent.includes(' · '))summary.textContent=summary.textContent.split(' · ')[0];
    return;
  }
  if(route!=='person')return;
  const root=content.querySelector('.v17-person[data-person-id]'),person=personById(root?.dataset.personId||'');
  if(!person?.living)return;
  content.querySelector('.v17-person-places')?.remove();
  const timeline=content.querySelector('.v17-life-timeline');
  if(timeline)timeline.outerHTML='<p class="muted v17-living-privacy">Detailed chronology and location records are protected for living family members.</p>';
  content.querySelectorAll('[data-v17-person-photo]').forEach(host=>host.removeAttribute('data-v17-person-photo'));
  const gallery=content.querySelector('[data-v17-person-gallery]');
  if(gallery){gallery.removeAttribute('data-v17-person-gallery');gallery.innerHTML='<p class="muted v17-living-privacy">Living-person media remains private in the public family archive.</p>';}
}

function apply(){
  if(!isFamily()){delete document.body.dataset.familyNative;return;}
  const route=routeKey();
  document.body.dataset.familyNative='v17';
  if(!nativeRoutes.has(route))return;
  const content=document.getElementById('content');if(!content)return;
  const current=content.querySelector('[data-v17-native]');
  if(current?.dataset.v17Native===route){enforcePublicPrivacy(route,content);hydrateNativeFamily();return;}
  content.classList.remove('v157-home','v159-people','v159-profile','v161-home','v161-people');
  content.classList.add('v17-content');
  content.innerHTML=nativeMarkup(route);
  enforcePublicPrivacy(route,content);
  hydrateNativeFamily();
}

let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

document.addEventListener('click',event=>{
  const local=event.target.closest?.('.v17-person-nav a[href^="#v17-"]');
  if(local){event.preventDefault();document.querySelector(local.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'});}
});
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-experience-changed',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
