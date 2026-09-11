import{personById}from'../../core.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamily=()=>document.body.dataset.experience!=='research';
const compactLimit=()=>matchMedia('(max-width:720px)').matches?6:12;

function installPeopleDisclosure(content){
  const grid=content.querySelector('.people-grid');if(!grid)return;
  const cards=[...grid.querySelectorAll('.v159-person-card')];
  const limit=compactLimit();
  cards.forEach((card,index)=>card.hidden=index>=limit);
  content.querySelector('.v1510-people-more')?.remove();
  if(cards.length<=limit)return;
  const footer=document.createElement('div');footer.className='v1510-people-more';
  footer.innerHTML=`<span>Showing <b>${limit}</b> of <b>${cards.length}</b> people</span><button type="button" class="action" data-v1510-people-more>Show more people</button>`;
  grid.insertAdjacentElement('afterend',footer);
}

function expandPeople(event){
  const trigger=event.target.closest?.('[data-v1510-people-more]');if(!trigger)return false;
  const content=document.querySelector('#content'),grid=content?.querySelector('.people-grid');if(!grid)return true;
  const cards=[...grid.querySelectorAll('.v159-person-card')],hidden=cards.filter(card=>card.hidden),step=compactLimit();
  hidden.slice(0,step).forEach(card=>card.hidden=false);
  const left=cards.filter(card=>card.hidden).length,footer=content.querySelector('.v1510-people-more');
  if(!left)footer?.remove();else if(footer)footer.querySelector('span').innerHTML=`Showing <b>${cards.length-left}</b> of <b>${cards.length}</b> people`;
  return true;
}

function profileTabs(content){
  const overview=content.querySelector('.v159-person-overview');if(!overview||content.querySelector('.v1510-profile-tabs'))return;
  const person=personById(location.hash.split('/')[1]);
  const family=overview.querySelector('.profile-family-grid');
  const media=overview.querySelector('.profile-media');
  const technical=overview.querySelector('.technical-details');
  const life=overview.querySelector('.v159-life-summary');
  const dossierPanels=[...content.querySelectorAll(':scope > .panel')];
  const timeline=dossierPanels.find(panel=>/-timeline$/.test(panel.id||''));
  const tabs=document.createElement('nav');tabs.className='v1510-profile-tabs';tabs.setAttribute('aria-label','Person profile sections');
  tabs.innerHTML='<button type="button" data-v1510-profile-tab="overview" aria-current="page">Overview</button><button type="button" data-v1510-profile-tab="family">Family</button><button type="button" data-v1510-profile-tab="timeline">Timeline</button><button type="button" data-v1510-profile-tab="photos">Photos</button><a href="#research">Research Center</a>';
  overview.insertAdjacentElement('afterend',tabs);
  if(life)life.dataset.v1510Panel='overview';
  if(family)family.dataset.v1510Panel='family';
  if(media)media.dataset.v1510Panel='photos';
  if(timeline)timeline.dataset.v1510Panel='timeline';
  if(technical)technical.dataset.v1510Panel='research';
  dossierPanels.forEach(panel=>{if(panel!==timeline)panel.dataset.v1510Panel='research';});
  content.querySelector('.local-nav')?.setAttribute('hidden','');
  content.querySelector('.family-research-teaser')?.setAttribute('hidden','');
  content.dataset.v1510ProfileTab='overview';
  const title=content.querySelector('.profile-headline h2');if(title&&person)title.setAttribute('title',person.name);
}

function selectProfileTab(event){
  const button=event.target.closest?.('[data-v1510-profile-tab]');if(!button)return false;
  const content=document.querySelector('#content');if(!content)return true;
  content.dataset.v1510ProfileTab=button.dataset.v1510ProfileTab;
  content.querySelectorAll('[data-v1510-profile-tab]').forEach(tab=>tab.toggleAttribute('aria-current',tab===button));
  return true;
}

function compactHome(content){
  if(routeKey()!=='dashboard')return;
  const history=content.querySelector('[aria-labelledby="dashboard-history-title"]');
  const recent=content.querySelector('.dashboard-recent');
  const branches=[...content.querySelectorAll('.dashboard-section')].find(section=>/FAMILY BRANCHES/i.test(section.querySelector('.eyebrow')?.textContent||''));
  const secondary=[branches,history,recent].filter(Boolean);if(!secondary.length||content.querySelector('.v1510-home-more'))return;
  const more=document.createElement('details');more.className='v1510-home-more';
  more.innerHTML='<summary>Explore more family history <span>Branches · stories · recently viewed</span></summary><div class="v1510-home-more-slot"></div>';
  const research=content.querySelector('.v157-research-center');
  (research||content.lastElementChild)?.insertAdjacentElement(research?'beforebegin':'afterend',more);
  const slot=more.querySelector('.v1510-home-more-slot');secondary.forEach(section=>slot.appendChild(section));
}

function apply(){
  if(!isFamily())return;const content=document.querySelector('#content');if(!content)return;
  const route=routeKey();
  if(route==='people')installPeopleDisclosure(content);
  else if(route==='person')profileTabs(content);
  else if(route==='dashboard')compactHome(content);
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

document.addEventListener('click',event=>{if(expandPeople(event)||selectProfileTab(event))event.preventDefault();});
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('resize',()=>{if(routeKey()==='people')schedule();});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
