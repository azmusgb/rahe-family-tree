import{personById}from'../../core.js';

const mediaApi='/api/media';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const personIdFromRoute=()=>location.hash.startsWith('#person/')?location.hash.split('/')[1]:'';

function removeLegacyMobileNav(){document.querySelector('.mobile-family-nav')?.remove();}

async function firstPublicPortrait(personId){
  if(!personId)return'';
  try{
    const res=await fetch(`${mediaApi}?person=${encodeURIComponent(personId)}`,{cache:'no-store'});
    if(!res.ok)return'';
    const data=await res.json();
    const item=(data.media||[]).find(m=>m.visibility==='public'&&String(m.mime||'').startsWith('image/'));
    return item?`${mediaApi}?file=${encodeURIComponent(item.id)}`:'';
  }catch{return'';}
}

function setPortrait(el,url){
  if(!el||!url||el.dataset.photoLoaded)return;
  el.textContent='';
  el.style.backgroundImage=`url("${url.replace(/"/g,'%22')}")`;
  el.style.backgroundSize='cover';
  el.style.backgroundPosition='center';
  el.dataset.photoLoaded='true';
  el.classList.add('has-photo');
}

async function hydrateCurrentPortraits(){
  const id=personIdFromRoute();
  if(id){
    const url=await firstPublicPortrait(id);
    if(url){setPortrait(document.querySelector('.profile-avatar.xl'),url);setPortrait(document.querySelector('.person-portrait'),url);}
  }
}

function simplifyFamilyProfile(){
  if(document.body.dataset.experience!=='family'||routeKey()!=='person')return;
  const content=document.querySelector('#content');if(!content)return;
  const familyCard=content.querySelector('.family-overview-card');
  if(familyCard&&!familyCard.querySelector('.family-profile-kicker')){
    const id=personIdFromRoute(),p=personById(id),kicker=document.createElement('div');
    kicker.className='family-profile-kicker';
    kicker.innerHTML=`<span>Family profile</span>${p?.living?'<b>Living details protected</b>':'<b>Historical family record</b>'}`;
    familyCard.prepend(kicker);
  }
  if(!content.querySelector('.family-research-teaser')){
    const timeline=content.querySelector('[id$="-timeline"]'),teaser=document.createElement('aside');
    teaser.className='family-research-teaser';
    teaser.innerHTML='<div><span>Research details</span><b>Claims, source citations, provenance, and open research remain available in Research Mode.</b></div><button type="button" data-experience-mode="research">Open Research Mode</button>';
    (timeline||familyCard)?.insertAdjacentElement('afterend',teaser);
  }
}

function polishTreeLabels(){document.querySelectorAll('[data-tree-depth="6"]').forEach(b=>{if(/all connected/i.test(b.textContent||''))b.textContent='6 hops';});}

function apply(){removeLegacyMobileNav();simplifyFamilyProfile();polishTreeLabels();hydrateCurrentPortraits();}
const observer=new MutationObserver(()=>queueMicrotask(apply));
const start=()=>{const content=document.querySelector('#content');if(content)observer.observe(content,{childList:true,subtree:false});apply();};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
window.addEventListener('hashchange',()=>setTimeout(apply));
window.addEventListener('family-auth-ui-refresh',()=>setTimeout(apply));
