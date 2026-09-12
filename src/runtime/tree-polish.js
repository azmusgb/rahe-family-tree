import{personById,esc}from'../../core.js';
const HOME_KEY='family.archive.homePerson.v2',RECENT_KEY='family.archive.recentPeople.v2';
const LEGACY_HOME_KEY='rahe.family.home-person.v1',LEGACY_RECENT_KEYS=['rahe.family.recentPeople.v1','rahe.family.recent-people.v1'];
const focusId=()=>new URL(location.href).searchParams.get('focus')||'';
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
function homeId(){try{let value=localStorage.getItem(HOME_KEY);if(value==null){value=localStorage.getItem(LEGACY_HOME_KEY);if(value!=null)localStorage.setItem(HOME_KEY,value);}return value||'';}catch{return'';}}
function recentIds(){try{let raw=localStorage.getItem(RECENT_KEY);if(raw==null){const merged=[];for(const key of LEGACY_RECENT_KEYS){const value=localStorage.getItem(key);if(!value)continue;for(const id of JSON.parse(value)||[])if(!merged.includes(id))merged.push(id);}raw=JSON.stringify(merged);if(merged.length)localStorage.setItem(RECENT_KEY,raw);}return(JSON.parse(raw||'[]')||[]).filter(id=>personById(id)).slice(0,5);}catch{return[]}}
function center(id,instant=false){const node=document.querySelector(`.graph-node[data-person="${CSS.escape(id)}"]`),scroll=document.querySelector('.graph-scroll');if(!node||!scroll)return;const nr=node.getBoundingClientRect(),sr=scroll.getBoundingClientRect();scroll.scrollBy({left:nr.left-sr.left+nr.width/2-sr.width/2,top:nr.top-sr.top+nr.height/2-sr.height/2,behavior:instant?'auto':'smooth'});}
function breadcrumb(){
  const existing=document.querySelector('.v1291-breadcrumb');
  if(route()!=='tree'){existing?.remove();return;}
  const shell=document.querySelector('.graph-shell');if(!shell)return;
  const focus=focusId(),home=homeId(),recent=recentIds().filter(id=>id!==focus);
  const markup=`<span>Tree trail</span>${home&&personById(home)?`<button type="button" data-v1291-go="${esc(home)}">Home · ${esc(personById(home).name)}</button>`:''}${recent.map(id=>`<button type="button" data-v1291-go="${esc(id)}">${esc(personById(id).name)}</button>`).join('')}${focus&&personById(focus)?`<b aria-current="page">${esc(personById(focus).name)}</b>`:''}`;
  let nav=existing;
  if(!nav){nav=document.createElement('nav');nav.className='v1291-breadcrumb';nav.setAttribute('aria-label','Tree history');shell.insertAdjacentElement('beforebegin',nav);}
  if(nav.dataset.signature!==markup){nav.innerHTML=markup;nav.dataset.signature=markup;}
}
function annotateCouples(){document.querySelectorAll('.edge.couple-child').forEach(edge=>edge.classList.add('v1291-couple-child'));document.querySelectorAll('.edge.spouse,.edge.spouse-lead').forEach(edge=>edge.classList.add('v1291-spouse'));}
function improveCollapse(){document.querySelectorAll('.node-collapse[data-collapse-person]').forEach(control=>{const id=control.dataset.collapsePerson,p=personById(id);control.setAttribute('aria-describedby',`collapse-help-${id}`);if(!control.querySelector('title')){const t=document.createElementNS('http://www.w3.org/2000/svg','title');t.textContent=`Show or hide descendants of ${p?.name||id}`;control.prepend(t);}});}
function installMobileHint(){if(route()!=='tree')return;const scroll=document.querySelector('.graph-scroll');if(!scroll||document.querySelector('.v1291-mobile-hint'))return;const hint=document.createElement('div');hint.className='v1291-mobile-hint';hint.textContent='Tap a person to open their profile. Use branch shortcuts or tree controls to change focus, depth, and family scope.';scroll.insertAdjacentElement('beforebegin',hint);}
function syncRelease(){document.body.dataset.treePolishRelease='17.2';}
function apply(){syncRelease();if(route()!=='tree'){document.querySelector('.v1291-breadcrumb')?.remove();return;}breadcrumb();annotateCouples();improveCollapse();installMobileHint();const focus=focusId();if(focus&&matchMedia('(max-width:760px)').matches&&document.body.dataset.lastCentered!==focus){document.body.dataset.lastCentered=focus;requestAnimationFrame(()=>center(focus,true));}}
document.addEventListener('click',e=>{const jump=e.target.closest?.('[data-v1291-go]');if(!jump)return;const u=new URL(location.href);u.searchParams.set('focus',jump.dataset.v1291Go);if(u.searchParams.get('scope')==='all')u.searchParams.set('scope','family');history.replaceState(null,'',u);window.dispatchEvent(new HashChangeEvent('hashchange'));},true);
window.addEventListener('hashchange',()=>setTimeout(apply));window.addEventListener('family-media-changed',()=>setTimeout(apply));const observer=new MutationObserver(()=>queueMicrotask(apply));const start=()=>{const c=document.querySelector('#content');if(c)observer.observe(c,{childList:true,subtree:false});apply();};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
