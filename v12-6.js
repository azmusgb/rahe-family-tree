import{personById,esc}from'./core.js';

const MODE_KEY='rahe.family.experience-mode.v1';
const familyRoutes=new Set(['dashboard','tree','people','families','person']);
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const initials=name=>String(name||'?').replace(/\/.*/,'').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const friendlyState=value=>{const u=String(value||'').toUpperCase();if(u.includes('SUPPORTED'))return'Confirmed by evidence';if(u.includes('PROVISIONAL'))return'Likely · needs confirmation';if(u.includes('UNRESOLVED'))return'Still being researched';if(u.includes('DERIVATIVE'))return'Secondary evidence';if(u.includes('REJECTED'))return'Ruled out';return'Research-qualified';};

function mode(){try{return localStorage.getItem(MODE_KEY)||'family';}catch{return'family';}}
function setMode(next){try{localStorage.setItem(MODE_KEY,next);}catch{}apply();window.dispatchEvent(new HashChangeEvent('hashchange'));}

function markNav(){document.querySelectorAll('.nav-group').forEach(g=>{const label=g.querySelector('.nav-group-label')?.textContent?.trim().toLowerCase()||'';g.dataset.navGroup=label;});}

function installTopbar(){
  const actions=document.querySelector('.topbar-actions');
  if(!actions)return;
  if(!actions.querySelector('.experience-toggle')){
    const b=document.createElement('button');
    b.type='button';b.className='experience-toggle';b.dataset.experienceMode=mode()==='family'?'research':'family';b.textContent=mode()==='family'?'Research mode':'Family view';actions.prepend(b);
  }
  if(!actions.querySelector('.topbar-more')){
    const more=document.createElement('details');more.className='topbar-more';more.innerHTML='<summary aria-label="More actions">More</summary><div class="topbar-menu"></div>';
    const menu=more.querySelector('.topbar-menu');
    for(const id of['share','export','print']){const el=document.getElementById(id);if(el)menu.append(el);}
    actions.append(more);
  }
}

function enhancePeopleCards(){
  document.querySelectorAll('.person-card .person-open').forEach(btn=>{
    if(btn.querySelector('.family-card-avatar'))return;
    const name=btn.querySelector('h3')?.textContent||'',state=[...btn.querySelectorAll('.badge')].map(x=>x.textContent).join(' ');
    btn.insertAdjacentHTML('afterbegin',`<span class="family-card-avatar" aria-hidden="true">${esc(initials(name))}</span>`);
    const badge=btn.querySelector('.badge');if(badge)badge.textContent=friendlyState(state);
  });
}

function enhancePerson(){
  if(!location.hash.startsWith('#person/'))return;
  const hero=document.querySelector('.person-hero');
  if(hero&&!hero.querySelector('.person-portrait')){const name=hero.querySelector('h1')?.textContent||'';hero.insertAdjacentHTML('afterbegin',`<div class="person-portrait" aria-hidden="true">${esc(initials(name))}</div>`);}
  const card=document.querySelector('.family-overview-card');
  if(card&&!card.querySelector('.family-profile-intro')){const p=personById(location.hash.split('/')[1]);if(p){const intro=document.createElement('div');intro.className='family-profile-intro';intro.innerHTML=`<p>${esc(p.role||'Family member')}</p><span>${esc(friendlyState(p.state))}</span>`;card.querySelector('.profile-headline')?.append(intro);}}
  document.querySelectorAll('#content>section[id*="-claims"],#content>section[id*="-sources"],#content>section[id*="-research"]').forEach(s=>s.classList.add('research-detail-section'));
}

function apply(){
  const currentMode=mode(),key=routeKey();
  document.body.dataset.experience=currentMode;
  document.body.dataset.route=key;
  markNav();installTopbar();
  const toggle=document.querySelector('.experience-toggle');
  if(toggle){toggle.dataset.experienceMode=currentMode==='family'?'research':'family';toggle.textContent=currentMode==='family'?'Research mode':'Family view';}
  const filters=document.getElementById('filters');if(filters)filters.classList.toggle('family-compact',currentMode==='family'&&familyRoutes.has(key));
  const version=document.querySelector('.version');if(version)version.textContent=currentMode==='family'?'FAMILY VIEW · v14.0':'RESEARCH MODE · v14.0';
  enhancePeopleCards();enhancePerson();
}

document.addEventListener('click',e=>{const modeBtn=e.target.closest('[data-experience-mode]');if(modeBtn){setMode(modeBtn.dataset.experienceMode);return;}const branch=e.target.closest('[data-family-branch]');if(branch){const select=document.getElementById('branch');if(select)select.value=branch.dataset.familyBranch;location.hash='people';}});
const observer=new MutationObserver(()=>queueMicrotask(apply));
const start=()=>{const content=document.getElementById('content');if(content)observer.observe(content,{childList:true,subtree:false});apply();};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
window.addEventListener('hashchange',()=>setTimeout(apply));
window.addEventListener('family-auth-ui-refresh',()=>setTimeout(apply));
