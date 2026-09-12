import{renderNativeHome,renderNativePeople,renderNativePerson,hydrateNativeFamily}from'./native-family-v17.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamily=()=>document.body.dataset.experience!=='research';
const nativeRoutes=new Set(['dashboard','people','person']);

function nativeMarkup(route){
  if(route==='dashboard')return renderNativeHome();
  if(route==='people')return renderNativePeople();
  if(route==='person')return renderNativePerson(location.hash.split('/')[1]||'');
  return'';
}

function apply(){
  if(!isFamily()){delete document.body.dataset.familyNative;return;}
  const route=routeKey();
  if(!nativeRoutes.has(route)){document.body.dataset.familyNative='v17';return;}
  document.body.dataset.familyNative='v17';
  const content=document.getElementById('content');if(!content)return;
  const current=content.querySelector('[data-v17-native]');
  if(current?.dataset.v17Native===route){hydrateNativeFamily();return;}
  content.classList.remove('v157-home','v159-people','v159-profile','v161-home','v161-people');
  content.classList.add('v17-content');
  content.innerHTML=nativeMarkup(route);
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
