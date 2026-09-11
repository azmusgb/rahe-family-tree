import{routes}from'./core.js';

const LAYOUT_RELEASE='15.1';
const STALE_RELOAD_KEY='rahe.family.uiReload.v15';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamilyMode=()=>document.body.dataset.experience!=='research';
const routeForNav=()=>({person:'people',claim:'evidence',source:'sources',task:'research'}[routeKey()]||routeKey());
const routeDescription=key=>routes[key]?.[1]||'';
const linkMarkup=(key,label=routes[key]?.[0]||key)=>`<a href="#${key}" data-nav-key="${key}" class="${routeForNav()===key?'active':''}" ${routeForNav()===key?'aria-current="page"':''}>${label}</a>`;

const primary=[['dashboard','Home'],['tree','Tree'],['people','People'],['media','Media'],['timeline','Timeline']];
const menus=[
  ['Family',[['families','Family Groups'],['branches','Branches'],['migration','Migration']]],
  ['Research',[['identity','Identity Lab'],['evidence','Evidence'],['sources','Sources'],['research','Research Queue'],['intelligence','Research Intelligence'],['conflicts','Conflicts']]],
  ['Contribute',[['editor','Family Editor'],['intake','Evidence Intake']]],
  ['Archive',[['archive','Full Archive']]]
];

function relayoutNavigation(){
  const nav=document.querySelector('#nav');if(!nav)return;
  const active=routeForNav();
  nav.dataset.layout='15.1';
  nav.innerHTML=`<div class="v151-primary-nav">${primary.map(([key,label])=>linkMarkup(key,label)).join('')}</div><div class="v151-nav-menus">${menus.map(([label,items])=>{const menuActive=items.some(([key])=>key===active);return`<details class="v151-nav-menu ${menuActive?'active':''}"><summary>${label}</summary><div class="v151-nav-popover">${items.map(([key,itemLabel])=>`<a href="#${key}" class="${active===key?'active':''}" ${active===key?'aria-current="page"':''}><b>${itemLabel}</b><small>${routeDescription(key)}</small></a>`).join('')}</div></details>`;}).join('')}</div>`;
}

function closeMenusAfterNavigation(){
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('.v151-nav-popover a');
    if(link)link.closest('details')?.removeAttribute('open');
    const opened=event.target.closest?.('.v151-nav-menu[open]');
    if(opened)return;
    document.querySelectorAll('.v151-nav-menu[open]').forEach(menu=>menu.removeAttribute('open'));
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.v151-nav-menu[open]').forEach(menu=>menu.removeAttribute('open'));});
}

function relayoutDashboard(){
  if(!isFamilyMode()||routeKey()!=='dashboard')return;
  const content=document.querySelector('#content');if(!content)return;
  const featured=content.querySelector('[aria-labelledby="dashboard-featured-title"]');
  const branches=content.querySelector('[aria-labelledby="dashboard-branches-title"]');
  if(featured&&branches&&!content.querySelector('.dashboard-family-layout')){
    const wrap=document.createElement('div');wrap.className='dashboard-family-layout';
    featured.parentNode.insertBefore(wrap,featured);
    wrap.append(featured,branches);
    const recent=content.querySelector('.dashboard-recent');
    if(recent)wrap.parentNode.insertBefore(recent,wrap);
  }
}

function relayoutPerson(){
  if(!isFamilyMode()||routeKey()!=='person')return;
  const content=document.querySelector('#content'),overview=content?.querySelector('.family-overview-card'),hero=content?.querySelector('.person-hero'),actions=content?.querySelector('.focus-actions'),back=content?.querySelector('.back');
  if(!content||!overview||!hero)return;
  if(back)back.insertAdjacentElement('afterend',overview);else content.prepend(overview);
  if(actions)overview.insertAdjacentElement('afterend',actions);
  hero.classList.add('person-source-summary');
}

function syncRelease(){
  document.documentElement.dataset.uiRelease=LAYOUT_RELEASE;
  const version=document.querySelector('.version');
  if(version)version.textContent=`${isFamilyMode()?'FAMILY VIEW':'RESEARCH MODE'} · v${LAYOUT_RELEASE}`;
}

let queued=false;
function apply(){queued=false;syncRelease();relayoutNavigation();relayoutDashboard();relayoutPerson();}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply));}

try{sessionStorage.setItem(STALE_RELOAD_KEY,LAYOUT_RELEASE);}catch{}
closeMenusAfterNavigation();
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-edits-changed',schedule);
window.addEventListener('family-media-changed',schedule);
window.addEventListener('family-auth-ui-refresh',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
