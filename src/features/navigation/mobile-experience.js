const MOBILE_QUERY='(max-width: 720px)';
const STORAGE_KEY='family.mobile.v20.state';
const MAX_RECENT_PEOPLE=10;
const MAX_RECENT_FAMILIES=8;
let applyQueued=false;

const isMobile=()=>window.matchMedia(MOBILE_QUERY).matches;
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const routeDetail=()=>location.hash.slice(1).split('/').slice(1).join('/');
const qs=()=>new URL(location.href).searchParams;
const safeText=value=>String(value||'').replace(/\s+/g,' ').trim();
const escapeHtml=value=>safeText(value).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

// Phase 8 narrows this module to durable continuity and route presentation.
// Search handoff, More-sheet state, route trails, and other transient UI state
// are owned by the v22 shell modules declared before this legacy enhancer.
function readState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return{
      recentPeople:Array.isArray(parsed.recentPeople)?parsed.recentPeople.slice(0,MAX_RECENT_PEOPLE):[],
      recentFamilies:Array.isArray(parsed.recentFamilies)?parsed.recentFamilies.slice(0,MAX_RECENT_FAMILIES):[],
      lastTree:parsed.lastTree&&typeof parsed.lastTree==='object'?parsed.lastTree:null
    };
  }catch{return{recentPeople:[],recentFamilies:[],lastTree:null};}
}
function writeState(next){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{/* storage may be unavailable */}}
function updateState(mutator){const current=readState(),next=mutator(current)||current;writeState(next);return next;}
function rememberById(list,item,max){return[item,...list.filter(existing=>existing?.id!==item.id)].slice(0,max);}

function routeTitle(){
  const route=routeKey();
  if(route==='person')return safeText(document.querySelector('.person-header h2')?.textContent)||'Person';
  if(route==='branch')return safeText(document.querySelector('.branch-hero h1')?.textContent)||decodeURIComponent(routeDetail()||'Family');
  const titles={tree:'Family Tree',people:'People',families:'Families',media:'Photos & Documents',stories:'Stories',timeline:'Timeline',migration:'Places',research:'Research Center',evidence:'Evidence',sources:'Sources',intelligence:'Research'};
  return titles[route]||safeText(document.getElementById('title')?.textContent)||'Family History';
}
function backTarget(){
  const route=routeKey();
  if(route==='person')return{href:'#people',label:'People'};
  if(route==='branch')return{href:'#families',label:'Families'};
  if(['research','evidence','sources','intelligence'].includes(route))return{href:'#dashboard',label:'Family'};
  return{href:'#dashboard',label:'Home'};
}
function contextualHeader(){
  let bar=document.querySelector('.v20-context-bar');
  if(!bar){
    bar=document.createElement('nav');
    bar.className='v20-context-bar';
    bar.setAttribute('aria-label','Current family location');
    document.querySelector('.site-header')?.insertAdjacentElement('afterend',bar);
  }
  if(!isMobile()||routeKey()==='dashboard'){bar.hidden=true;return;}
  const back=backTarget();
  bar.hidden=false;
  bar.innerHTML=`<a href="${back.href}" class="v20-context-back" aria-label="Back to ${escapeHtml(back.label)}"><span aria-hidden="true">‹</span>${escapeHtml(back.label)}</a><strong>${escapeHtml(routeTitle())}</strong><button type="button" data-global-search aria-label="Search family archive">Search</button>`;
}

function rememberCurrentContext(){
  const route=routeKey();
  if(route==='tree'){
    const params=qs(),focus=params.get('focus')||'',scope=params.get('scope')||'connected',depth=params.get('depth')||'';
    const href=`${location.pathname}${location.search}#tree`;
    updateState(state=>{
      const previous=state.lastTree||{};
      if(previous.focus===focus&&previous.scope===scope&&previous.depth===depth&&previous.href===href)return state;
      state.lastTree={focus,scope,depth,href,savedAt:Date.now()};
      return state;
    });
  }
  const person=document.querySelector('.person-profile[data-person-id]');
  if(route==='person'&&person){
    const item={id:person.dataset.personId,name:safeText(person.querySelector('.person-header h2')?.textContent)||'Family member',branch:safeText(person.querySelector('.person-header .eyebrow')?.textContent).replace(/\s+FAMILY$/i,''),dates:safeText(person.querySelector('.person-dates')?.textContent),savedAt:Date.now()};
    updateState(state=>{state.recentPeople=rememberById(state.recentPeople,item,MAX_RECENT_PEOPLE);return state;});
  }
  const branch=document.querySelector('.branch-view[data-v17-native^="branch:"]');
  if(route==='branch'&&branch){
    const name=safeText(branch.querySelector('.branch-hero h1')?.textContent).replace(/\s+family$/i,'')||decodeURIComponent(routeDetail()||'Family');
    const item={id:name,name,savedAt:Date.now()};
    updateState(state=>{state.recentFamilies=rememberById(state.recentFamilies,item,MAX_RECENT_FAMILIES);return state;});
  }
}

function recentPersonCard(person){
  return`<a href="#person/${encodeURIComponent(person.id)}" class="v20-recent-person"><span aria-hidden="true">${escapeHtml(person.name.split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase())}</span><b>${escapeHtml(person.name)}</b><small>${escapeHtml([person.branch,person.dates].filter(Boolean).join(' · '))}</small></a>`;
}
function injectRecentRail(root,where='afterbegin'){
  if(!root||root.querySelector('.v20-recent-rail'))return;
  const recent=readState().recentPeople;
  if(!recent.length)return;
  const section=document.createElement('section');
  section.className='v20-recent-rail';
  section.setAttribute('aria-label','Recently viewed family members');
  section.innerHTML=`<div class="v20-section-title"><div><span>Continue exploring</span><h2>Recently viewed</h2></div><a href="#people">All people</a></div><div class="v20-recent-scroller">${recent.slice(0,6).map(recentPersonCard).join('')}</div>`;
  if(where==='afterhero'){
    const anchor=root.querySelector('.v20-continue-card')||root.querySelector('.family-home-hero');
    anchor?.insertAdjacentElement('afterend',section);
  }else root.insertAdjacentElement(where,section);
}
function injectContinueCard(){
  const home=document.querySelector('[data-v17-native="home"]');
  if(!home)return;
  home.querySelector('.v20-continue-card')?.remove();
  const state=readState(),person=state.recentPeople[0],tree=state.lastTree;
  if(!person&&!tree)return;
  const personTime=Number(person?.savedAt||0),treeTime=Number(tree?.savedAt||0),useTree=Boolean(tree&&(!person||treeTime>personTime));
  const href=useTree?tree.href:`#person/${encodeURIComponent(person.id)}`;
  const title=useTree?'Your family tree':person.name;
  const detail=useTree?'Return to your previous tree view':[person.branch,person.dates].filter(Boolean).join(' · ');
  const card=document.createElement('section');
  card.className='v20-continue-card';
  card.setAttribute('aria-label','Continue family exploration');
  card.innerHTML=`<div><span>CONTINUE EXPLORING</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p></div><a href="${href}">Resume <span aria-hidden="true">→</span></a>`;
  home.querySelector('.family-home-hero')?.insertAdjacentElement('afterend',card);
}
function enhanceHome(){
  const home=document.querySelector('[data-v17-native="home"]');
  if(!home||!isMobile())return;
  injectContinueCard();
  injectRecentRail(home,'afterhero');
  home.querySelector('.v17-home-tree')?.setAttribute('data-mobile-chapter','tree');
  home.querySelector('.v17-home-story')?.setAttribute('data-mobile-chapter','story');
  home.querySelector('.v17-featured-people')?.setAttribute('data-mobile-chapter','people');
  home.querySelector('.v17-home-media')?.setAttribute('data-mobile-chapter','media');
  home.querySelector('.v17-research-door')?.setAttribute('data-mobile-chapter','research');
}

function activatePersonSection(root,target,{scroll=false}={}){
  root.dataset.v20ActiveTab=target;
  root.querySelectorAll('[data-v20-person-panel]').forEach(panel=>{panel.hidden=false;});
  root.querySelectorAll('.v20-person-tabs button').forEach(button=>{
    const active=button.dataset.personTab===target;
    button.setAttribute('aria-pressed',String(active));
    button.tabIndex=active?0:-1;
  });
  if(!scroll)return;
  const panel=root.querySelector(`[data-v20-person-panel="${target}"]`);
  if(panel)panel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
function cleanupPersonMobile(root){
  root.querySelector('.person-nav')?.removeAttribute('aria-hidden');
  root.querySelector('.v20-person-tabs')?.remove();
  root.querySelector('.v20-person-story')?.remove();
  root.querySelectorAll('[data-v20-person-panel]').forEach(panel=>{
    panel.hidden=false;
    delete panel.dataset.v20PersonPanel;
  });
  delete root.dataset.v20Tabs;
  delete root.dataset.v20ActiveTab;
}
function enhancePerson(){
  const root=document.querySelector('[data-v17-native="person"]');
  if(!root)return;
  root.querySelectorAll('[data-v20-person-panel]').forEach(panel=>{panel.hidden=false;});
  if(!isMobile()){cleanupPersonMobile(root);return;}
  const header=root.querySelector('.person-header'),family=root.querySelector('#v17-family'),life=root.querySelector('#v17-life'),photos=root.querySelector('#v17-photos'),research=root.querySelector('#v17-research');
  if(!header||!family||!life||!photos||!research)return;
  let story=root.querySelector('.v20-person-story');
  if(!story){
    story=document.createElement('section');
    story.className='v20-person-story';
    story.dataset.v20PersonPanel='story';
    story.setAttribute('aria-label','Profile story');
    const name=safeText(header.querySelector('h2')?.textContent),dates=safeText(header.querySelector('.person-dates')?.textContent),context=safeText(header.querySelector('.person-context')?.textContent);
    story.innerHTML=`<span>PROFILE</span><h2>${escapeHtml(name)}</h2>${dates?`<p class="v20-story-dates">${escapeHtml(dates)}</p>`:''}${context?`<p>${escapeHtml(context)}</p>`:''}<p>This profile brings together family relationships, chronology, photographs, and source-controlled evidence from the archive.</p>`;
    header.insertAdjacentElement('afterend',story);
  }
  family.dataset.v20PersonPanel='family';family.setAttribute('aria-label','Family');
  life.dataset.v20PersonPanel='timeline';life.setAttribute('aria-label','Timeline');
  photos.dataset.v20PersonPanel='photos';photos.setAttribute('aria-label','Photos');
  research.dataset.v20PersonPanel='evidence';research.setAttribute('aria-label','Evidence');
  [story,family,life,photos,research].forEach(panel=>{panel.hidden=false;});
  let tabs=root.querySelector('.v20-person-tabs');
  if(!tabs){
    tabs=document.createElement('nav');
    tabs.className='v20-person-tabs';
    tabs.setAttribute('aria-label','Person profile sections');
    tabs.innerHTML=['story:Story','family:Family','timeline:Timeline','photos:Photos','evidence:Evidence'].map((entry,index)=>{const[target,label]=entry.split(':');return`<button type="button" data-person-tab="${target}" aria-pressed="${index===0?'true':'false'}" tabindex="${index===0?'0':'-1'}">${label}</button>`;}).join('');
    story.insertAdjacentElement('beforebegin',tabs);
  }
  if(!root.dataset.v20Tabs){
    root.dataset.v20Tabs='true';
    tabs.addEventListener('click',event=>{const button=event.target.closest('[data-person-tab]');if(button)activatePersonSection(root,button.dataset.personTab,{scroll:true});});
    tabs.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const buttons=[...tabs.querySelectorAll('button')];
      let next=buttons.indexOf(document.activeElement);
      if(event.key==='Home')next=0;
      else if(event.key==='End')next=buttons.length-1;
      else next=(next+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      event.preventDefault();
      buttons[next].focus();
      activatePersonSection(root,buttons[next].dataset.personTab,{scroll:true});
    });
  }
  root.querySelector('.person-nav')?.setAttribute('aria-hidden','true');
  activatePersonSection(root,root.dataset.v20ActiveTab||'story',{scroll:false});
}

function enhancePeople(){
  const root=document.querySelector('[data-v17-native="people"]');
  if(!root||!isMobile())return;
  injectRecentRail(root,'afterbegin');
  root.querySelector('.people-grid')?.setAttribute('role','list');
  root.querySelectorAll('.directory-person-card').forEach(card=>card.setAttribute('role','listitem'));
}
function enhanceFamilies(){
  const root=document.querySelector('[data-v17-native="families"]');
  if(!root||!isMobile())return;
  root.querySelector('.family-grid')?.setAttribute('data-mobile-family-browser','true');
}
function enhanceBranch(){
  const root=document.querySelector('[data-v17-native^="branch:"]');
  if(!root||!isMobile())return;
  root.querySelector('.branch-people')?.setAttribute('data-mobile-rail','people');
  root.querySelector('.branch-timeline')?.setAttribute('data-mobile-timeline','true');
}

function compactTreeSurface(){
  const content=document.getElementById('content');
  if(!content)return;
  content.classList.toggle('mobile-tree-surface',routeKey()==='tree'&&isMobile());
  if(routeKey()!=='tree'||!isMobile())return;
  const graph=content.querySelector('.graph-shell,.tree-graph-shell');
  graph?.setAttribute('aria-label','Interactive family tree');
}
function classifyRoute(){
  document.body.dataset.mobileRoute=routeKey();
  document.body.classList.toggle('v20-mobile-app',isMobile());
}
function apply(){
  classifyRoute();
  compactTreeSurface();
  rememberCurrentContext();
  contextualHeader();
  enhanceHome();
  enhancePerson();
  enhancePeople();
  enhanceFamilies();
  enhanceBranch();
}
function schedule(){
  if(applyQueued)return;
  applyQueued=true;
  requestAnimationFrame(()=>{applyQueued=false;apply();});
}

window.addEventListener('hashchange',schedule);
window.addEventListener('popstate',schedule);
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
window.addEventListener('family-media-changed',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',apply,{once:true}):apply();
