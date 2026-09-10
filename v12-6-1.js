import{personById}from'./core.js';

const mediaApi='/api/media';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const personIdFromRoute=()=>location.hash.startsWith('#person/')?location.hash.split('/')[1]:'';

function installMobileNav(){
  let nav=document.querySelector('.mobile-family-nav');
  if(!nav){
    nav=document.createElement('nav');
    nav.className='mobile-family-nav';
    nav.setAttribute('aria-label','Family navigation');
    nav.innerHTML='<a href="#dashboard" data-mobile-route="dashboard"><span>⌂</span><b>Home</b></a><a href="#tree" data-mobile-route="tree"><span>⌘</span><b>Tree</b></a><a href="#people" data-mobile-route="people"><span>◎</span><b>People</b></a><a href="#families" data-mobile-route="families"><span>◇</span><b>Families</b></a><button type="button" data-experience-mode="research"><span>☷</span><b>Research</b></button>';
    document.body.append(nav);
  }
  const key=routeKey();
  nav.querySelectorAll('[data-mobile-route]').forEach(a=>a.classList.toggle('active',a.dataset.mobileRoute===key));
}

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
    if(url){
      setPortrait(document.querySelector('.profile-avatar.xl'),url);
      setPortrait(document.querySelector('.person-portrait'),url);
    }
  }
  if(routeKey()==='dashboard'){
    const anchor=document.querySelector('.family-home-anchor button[data-person]');
    const homeId=anchor?.dataset.person||'';
    if(homeId){
      const url=await firstPublicPortrait(homeId);
      if(url)setPortrait(document.querySelector('.home-avatar'),url);
    }
  }
}

function simplifyFamilyProfile(){
  if(document.body.dataset.experience!=='family'||routeKey()!=='person')return;
  const content=document.querySelector('#content');
  if(!content)return;
  const familyCard=content.querySelector('.family-overview-card');
  if(familyCard&&!familyCard.querySelector('.family-profile-kicker')){
    const id=personIdFromRoute(),p=personById(id);
    const kicker=document.createElement('div');
    kicker.className='family-profile-kicker';
    kicker.innerHTML=`<span>Family profile</span>${p?.living?'<b>Living details protected</b>':'<b>Historical family record</b>'}`;
    familyCard.prepend(kicker);
  }
  if(!content.querySelector('.family-research-teaser')){
    const timeline=content.querySelector('[id$="-timeline"]');
    const teaser=document.createElement('aside');
    teaser.className='family-research-teaser';
    teaser.innerHTML='<div><span>Research details</span><b>Claims, source citations, provenance, and open research remain available in Research Mode.</b></div><button type="button" data-experience-mode="research">Open Research Mode</button>';
    (timeline||familyCard)?.insertAdjacentElement('afterend',teaser);
  }
}

function polishTreeLabels(){
  document.querySelectorAll('[data-tree-depth="6"]').forEach(b=>{if(/all connected/i.test(b.textContent||''))b.textContent='6 hops';});
}

function apply(){
  installMobileNav();
  simplifyFamilyProfile();
  polishTreeLabels();
  hydrateCurrentPortraits();
}

const observer=new MutationObserver(()=>queueMicrotask(apply));
const start=()=>{const content=document.querySelector('#content');if(content)observer.observe(content,{childList:true,subtree:false});apply();};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
window.addEventListener('hashchange',()=>setTimeout(apply));
window.addEventListener('family-auth-ui-refresh',()=>setTimeout(apply));
