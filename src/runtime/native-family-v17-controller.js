import{model,personById}from'../../core.js';
import{renderTree}from'../../graph.js';
import{renderNativeHome,renderNativePeople,renderNativePerson,hydrateNativeFamily}from'./native-family-v17.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamily=()=>document.body.dataset.experience!=='research';
const nativeRoutes=new Set(['dashboard','tree','people','person']);
const nativeMarker=route=>route==='dashboard'?'home':route;
const livingChronologyPrivacy='Detailed chronology and location records are protected for living family members.';
const livingMediaPrivacy='Living-person media remains private in the public family archive.';

function publicSafeLivingPersonMarkup(markup){
  const life=`<section id="v17-life" class="v17-person-section"><div class="v17-section-head"><div><p class="eyebrow">LIFE</p><h2>Living family member</h2><p>Details protected in the public family archive.</p></div></div><p class="muted v17-living-privacy v17-living-chronology">${livingChronologyPrivacy}</p></section>`;
  const photos=`<section id="v17-photos" class="v17-person-section"><div class="v17-section-head"><div><p class="eyebrow">PHOTOS & DOCUMENTS</p><h2>Family archive</h2></div></div><p class="muted v17-living-privacy v17-living-media">${livingMediaPrivacy}</p></section>`;
  return String(markup||'')
    .replace(/\sdata-v17-person-photo="[^"]*"/g,'')
    .replace(/<section id="v17-life"[\s\S]*?<\/section>/,life)
    .replace(/<section id="v17-photos"[\s\S]*?<\/section>/,photos);
}

function nativeMarkup(route){
  if(route==='dashboard')return renderNativeHome();
  if(route==='tree')return`<div class="v17-native v17-tree" data-v17-native="tree">${renderTree()}</div>`;
  if(route==='people')return renderNativePeople();
  if(route==='person'){
    const id=location.hash.split('/')[1]||'',person=personById(id),markup=renderNativePerson(id);
    return person?.living?publicSafeLivingPersonMarkup(markup):markup;
  }
  return'';
}

function enforcePublicPrivacy(route,content){
  if(route==='people'){
    // Keep Family-mode branch chronology but suppress place detail. This is a
    // defense-in-depth public surface: mixed historical/living events must not
    // be able to expose a living person's location through branch aggregation.
    const summary=content.querySelector('.v17-branch-summary>div:first-child>p:not(.eyebrow)');
    if(summary&&summary.textContent.includes(' · '))summary.textContent=summary.textContent.split(' · ')[0];
    return;
  }
  if(route!=='person')return;
  const root=content.querySelector('.v17-person[data-person-id]'),person=personById(root?.dataset.personId||'');
  if(!person?.living)return;
  content.querySelector('.v17-person-places')?.remove();
  const life=content.querySelector('#v17-life'),timeline=life?.querySelector('.v17-life-timeline');
  if(timeline)timeline.outerHTML=`<p class="muted v17-living-privacy v17-living-chronology">${livingChronologyPrivacy}</p>`;
  if(life&&!life.querySelector('.v17-living-chronology'))life.insertAdjacentHTML('beforeend',`<p class="muted v17-living-privacy v17-living-chronology">${livingChronologyPrivacy}</p>`);
  content.querySelectorAll('[data-v17-person-photo]').forEach(host=>host.removeAttribute('data-v17-person-photo'));
  const photos=content.querySelector('#v17-photos'),gallery=photos?.querySelector('[data-v17-person-gallery]');
  if(gallery){gallery.removeAttribute('data-v17-person-gallery');gallery.innerHTML=`<p class="muted v17-living-privacy v17-living-media">${livingMediaPrivacy}</p>`;}
  if(photos&&!photos.querySelector('.v17-living-media'))photos.insertAdjacentHTML('beforeend',`<p class="muted v17-living-privacy v17-living-media">${livingMediaPrivacy}</p>`);
}

function apply(){
  if(!isFamily()){delete document.body.dataset.familyNative;return;}
  const route=routeKey();
  document.body.dataset.familyNative='v17';
  if(!nativeRoutes.has(route))return;
  // The browser bootstrap can reach DOMContentLoaded before the asynchronous
  // canonical model fetch completes. Native renderers, especially Tree, rely
  // on the populated model. Wait for the authoritative family-view-rendered
  // lifecycle instead of attempting a partial pre-data render that can throw.
  if(!model)return;
  const content=document.getElementById('content');if(!content)return;
  const current=content.querySelector('[data-v17-native]');
  if(current?.dataset.v17Native===nativeMarker(route)){enforcePublicPrivacy(route,content);hydrateNativeFamily();return;}
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
