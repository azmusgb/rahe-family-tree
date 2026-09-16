const MOBILE_QUERY='(max-width: 720px)';
const STORAGE_KEY='family.mobile.v20.state';
const MAX_RECENT_PEOPLE=10;
const MAX_RECENT_FAMILIES=8;
let lastTrigger=null;
let observerQueued=false;
let applyQueued=false;

const isMobile=()=>window.matchMedia(MOBILE_QUERY).matches;
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const routeDetail=()=>location.hash.slice(1).split('/').slice(1).join('/');
const qs=()=>new URL(location.href).searchParams;
const safeText=value=>String(value||'').replace(/\s+/g,' ').trim();
const escapeHtml=value=>safeText(value).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

function readState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return{
      recentPeople:Array.isArray(parsed.recentPeople)?parsed.recentPeople.slice(0,MAX_RECENT_PEOPLE):[],
      recentFamilies:Array.isArray(parsed.recentFamilies)?parsed.recentFamilies.slice(0,MAX_RECENT_FAMILIES):[],
      lastTree:parsed.lastTree&&typeof parsed.lastTree==='object'?parsed.lastTree:null,
      lastRoute:typeof parsed.lastRoute==='string'?parsed.lastRoute:'dashboard'
    };
  }catch{return{recentPeople:[],recentFamilies:[],lastTree:null,lastRoute:'dashboard'};}
}
function writeState(next){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{/* storage may be unavailable */}}
function updateState(mutator){const current=readState(),next=mutator(current)||current;writeState(next);return next;}
function rememberById(list,item,max){return[item,...list.filter(existing=>existing?.id!==item.id)].slice(0,max);}

function moreMenu(){return document.querySelector('#family-mobile-dock .mobile-more');}
function morePanel(details){return details?.querySelector(':scope > div')||null;}

function ensureBackdrop(){
  let backdrop=document.querySelector('.mobile-more-backdrop');
  if(backdrop)return backdrop;
  backdrop=document.createElement('button');
  backdrop.type='button';
  backdrop.className='mobile-more-backdrop';
  backdrop.hidden=true;
  backdrop.setAttribute('aria-label','Close navigation menu');
  document.body.append(backdrop);
  return backdrop;
}

function closeMore({restoreFocus=true}={}){
  const details=moreMenu();
  if(details){
    details.removeAttribute('open');
    details.querySelector('summary')?.setAttribute('aria-expanded','false');
  }
  const backdrop=document.querySelector('.mobile-more-backdrop');
  if(backdrop)backdrop.hidden=true;
  document.body.classList.remove('mobile-sheet-open');
  if(restoreFocus&&lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});
}

function openMore(details){
  if(!isMobile())return;
  lastTrigger=details.querySelector('summary');
  lastTrigger?.setAttribute('aria-expanded','true');
  const backdrop=ensureBackdrop();
  backdrop.hidden=false;
  document.body.classList.add('mobile-sheet-open');
  requestAnimationFrame(()=>details.querySelector('[data-mobile-more-close],a,button')?.focus({preventScroll:true}));
}

function enhanceMoreMenu(){
  const details=moreMenu();
  if(!details)return;
  const summary=details.querySelector('summary');
  const panel=morePanel(details);
  if(!summary||!panel)return;

  details.dataset.keepOpen='true';
  summary.setAttribute('aria-haspopup','dialog');
  summary.setAttribute('aria-expanded',String(details.open));
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','More family navigation');
  if(!panel.querySelector('.mobile-more-head'))panel.insertAdjacentHTML('afterbegin','<div class="mobile-more-head"><strong>Explore</strong><button type="button" data-mobile-more-close aria-label="Close menu">Close</button></div>');
  enhanceMoreRecents(panel);

  if(details.dataset.mobileSheet==='true')return;
  details.dataset.mobileSheet='true';
  details.addEventListener('toggle',()=>details.open?openMore(details):closeMore({restoreFocus:false}));
}

function enhanceMoreRecents(panel){
  const recent=readState().recentPeople.slice(0,4);
  const existing=panel.querySelector('.v20-more-recent');
  const signature=recent.map(person=>`${person.id}:${person.name}:${person.branch||''}`).join('|');
  if(!recent.length){
    existing?.remove();
    delete panel.dataset.v20RecentSignature;
    return;
  }
  if(existing&&panel.dataset.v20RecentSignature===signature)return;
  const block=document.createElement('section');block.className='v20-more-recent';block.setAttribute('aria-label','Recently viewed people');
  block.innerHTML=`<span>Recently viewed</span><div>${recent.map(person=>`<a href="#person/${encodeURIComponent(person.id)}"><b>${escapeHtml(person.name)}</b><small>${escapeHtml(person.branch||'Family')}</small></a>`).join('')}</div>`;
  if(existing)existing.replaceWith(block);else panel.append(block);
  panel.dataset.v20RecentSignature=signature;
}

function focusableIn(element){
  return[...element.querySelectorAll('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.getAttribute('aria-hidden')!=='true');
}

function trapSheetFocus(event){
  if(event.key==='Escape'&&document.body.classList.contains('mobile-sheet-open')){event.preventDefault();closeMore();return;}
  if(event.key!=='Tab')return;
  const details=moreMenu();
  if(!details?.open)return;
  const panel=morePanel(details);if(!panel)return;
  const focusable=focusableIn(panel);if(!focusable.length)return;
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}

function routeTitle(){
  const route=routeKey();
  if(route==='person')return safeText(document.querySelector('.person-header h2')?.textContent)||'Person';
  if(route==='branch')return safeText(document.querySelector('.v175-branch-hero h1')?.textContent)||decodeURIComponent(routeDetail()||'Family');
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
  if(!bar){bar=document.createElement('nav');bar.className='v20-context-bar';bar.setAttribute('aria-label','Current family location');document.querySelector('.site-header')?.insertAdjacentElement('afterend',bar);}
  if(!isMobile()||routeKey()==='dashboard'){bar.hidden=true;return;}
  const back=backTarget();bar.hidden=false;
  bar.innerHTML=`<a href="${back.href}" class="v20-context-back" aria-label="Back to ${escapeHtml(back.label)}"><span aria-hidden="true">‹</span>${escapeHtml(back.label)}</a><strong>${escapeHtml(routeTitle())}</strong><button type="button" data-global-search aria-label="Search family archive">Search</button>`;
}

function rememberCurrentContext(){
  const route=routeKey();
  updateState(state=>{state.lastRoute=route;return state;});
  if(route==='tree'){
    const params=qs(),focus=params.get('focus')||'',scope=params.get('scope')||'connected',depth=params.get('depth')||'';
    updateState(state=>{state.lastTree={focus,scope,depth,href:`${location.pathname}${location.search}#tree`,savedAt:Date.now()};return state;});
  }
  const person=document.querySelector('.v17-person[data-person-id]');
  if(route==='person'&&person){
    const item={id:person.dataset.personId,name:safeText(person.querySelector('.person-header h2')?.textContent)||'Family member',branch:safeText(person.querySelector('.person-header .eyebrow')?.textContent).replace(/\s+FAMILY$/i,''),dates:safeText(person.querySelector('.v17-person-dates')?.textContent),savedAt:Date.now()};
    updateState(state=>{state.recentPeople=rememberById(state.recentPeople,item,MAX_RECENT_PEOPLE);return state;});
  }
  const branch=document.querySelector('.v175-branch[data-v17-native^="branch:"]');
  if(route==='branch'&&branch){
    const name=safeText(branch.querySelector('.v175-branch-hero h1')?.textContent).replace(/\s+family$/i,'')||decodeURIComponent(routeDetail()||'Family');
    const item={id:name,name,savedAt:Date.now()};updateState(state=>{state.recentFamilies=rememberById(state.recentFamilies,item,MAX_RECENT_FAMILIES);return state;});
  }
}

function recentPersonCard(person){return`<a href="#person/${encodeURIComponent(person.id)}" class="v20-recent-person"><span aria-hidden="true">${escapeHtml(person.name.split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase())}</span><b>${escapeHtml(person.name)}</b><small>${escapeHtml([person.branch,person.dates].filter(Boolean).join(' · '))}</small></a>`;}
function injectRecentRail(root,where='afterbegin'){
  if(!root||root.querySelector('.v20-recent-rail'))return;
  const recent=readState().recentPeople;if(!recent.length)return;
  const section=document.createElement('section');section.className='v20-recent-rail';section.setAttribute('aria-label','Recently viewed family members');
  section.innerHTML=`<div class="v20-section-title"><div><span>Continue exploring</span><h2>Recently viewed</h2></div><a href="#people">All people</a></div><div class="v20-recent-scroller">${recent.slice(0,6).map(recentPersonCard).join('')}</div>`;
  if(where==='afterhero'){
    const anchor=root.querySelector('.v20-continue-card')||root.querySelector('.v17-home-hero');
    anchor?.insertAdjacentElement('afterend',section);
  }else root.insertAdjacentElement(where,section);
}
function injectContinueCard(){
  const home=document.querySelector('[data-v17-native="home"]');if(!home)return;
  home.querySelector('.v20-continue-card')?.remove();
  const state=readState(),person=state.recentPeople[0],tree=state.lastTree;if(!person&&!tree)return;
  const personTime=Number(person?.savedAt||0),treeTime=Number(tree?.savedAt||0),useTree=Boolean(tree&&(!person||treeTime>personTime));
  const href=useTree?tree.href:`#person/${encodeURIComponent(person.id)}`;
  const title=useTree?'Your family tree':person.name;
  const detail=useTree?'Return to your previous tree view':[person.branch,person.dates].filter(Boolean).join(' · ');
  const card=document.createElement('section');card.className='v20-continue-card';card.setAttribute('aria-label','Continue family exploration');
  card.innerHTML=`<div><span>CONTINUE EXPLORING</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p></div><a href="${href}">Resume <span aria-hidden="true">→</span></a>`;
  home.querySelector('.v17-home-hero')?.insertAdjacentElement('afterend',card);
}
function enhanceHome(){
  const home=document.querySelector('[data-v17-native="home"]');if(!home||!isMobile())return;
  injectContinueCard();injectRecentRail(home,'afterhero');
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
  root.querySelector('.v17-person-nav')?.removeAttribute('aria-hidden');
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
  const root=document.querySelector('[data-v17-native="person"]');if(!root)return;
  root.querySelectorAll('[data-v20-person-panel]').forEach(panel=>{panel.hidden=false;});
  if(!isMobile()){cleanupPersonMobile(root);return;}
  const header=root.querySelector('.person-header'),family=root.querySelector('#v17-family'),life=root.querySelector('#v17-life'),photos=root.querySelector('#v17-photos'),research=root.querySelector('#v17-research');
  if(!header||!family||!life||!photos||!research)return;
  let story=root.querySelector('.v20-person-story');
  if(!story){
    story=document.createElement('section');story.className='v20-person-story';story.dataset.v20PersonPanel='story';story.setAttribute('aria-label','Profile story');
    const name=safeText(header.querySelector('h2')?.textContent),dates=safeText(header.querySelector('.v17-person-dates')?.textContent),context=safeText(header.querySelector('.v17-person-context')?.textContent);
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
    tabs=document.createElement('nav');tabs.className='v20-person-tabs';tabs.setAttribute('aria-label','Person profile sections');
    tabs.innerHTML=['story:Story','family:Family','timeline:Timeline','photos:Photos','evidence:Evidence'].map((entry,index)=>{const[target,label]=entry.split(':');return`<button type="button" data-person-tab="${target}" aria-pressed="${index===0?'true':'false'}" tabindex="${index===0?'0':'-1'}">${label}</button>`;}).join('');
    story.insertAdjacentElement('beforebegin',tabs);
  }
  if(!root.dataset.v20Tabs){
    root.dataset.v20Tabs='true';
    tabs.addEventListener('click',event=>{const button=event.target.closest('[data-person-tab]');if(button)activatePersonSection(root,button.dataset.personTab,{scroll:true});});
    tabs.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const buttons=[...tabs.querySelectorAll('button')];let next=buttons.indexOf(document.activeElement);
      if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else next=(next+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      event.preventDefault();buttons[next].focus();activatePersonSection(root,buttons[next].dataset.personTab,{scroll:true});
    });
  }
  root.querySelector('.v17-person-nav')?.setAttribute('aria-hidden','true');
  activatePersonSection(root,root.dataset.v20ActiveTab||'story',{scroll:false});
}

function enhancePeople(){
  const root=document.querySelector('[data-v17-native="people"]');if(!root||!isMobile())return;
  injectRecentRail(root,'afterbegin');
  root.querySelector('.v17-people-grid')?.setAttribute('role','list');
  root.querySelectorAll('.person-card').forEach(card=>card.setAttribute('role','listitem'));
}
function enhanceFamilies(){
  const root=document.querySelector('[data-v17-native="families"]');if(!root||!isMobile())return;
  root.querySelector('.v175-family-grid')?.setAttribute('data-mobile-family-browser','true');
}
function enhanceBranch(){
  const root=document.querySelector('[data-v17-native^="branch:"]');if(!root||!isMobile())return;
  root.querySelector('.v175-branch-people')?.setAttribute('data-mobile-rail','people');
  root.querySelector('.v175-branch-timeline')?.setAttribute('data-mobile-timeline','true');
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
  enhanceMoreMenu();
  compactTreeSurface();
  rememberCurrentContext();
  contextualHeader();
  enhanceHome();
  enhancePerson();
  enhancePeople();
  enhanceFamilies();
  enhanceBranch();
  if(!isMobile())closeMore({restoreFocus:false});
}

function schedule(){if(applyQueued)return;applyQueued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{applyQueued=false;apply();}));}
function observeNavigationShell(){
  const observer=new MutationObserver(()=>{
    if(observerQueued)return;
    observerQueued=true;
    requestAnimationFrame(()=>{observerQueued=false;enhanceMoreMenu();});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

document.addEventListener('click',event=>{
  if(event.target.closest('.mobile-more-backdrop,[data-mobile-more-close]')){event.preventDefault();closeMore();return;}
  if(event.target.closest('#family-mobile-dock .mobile-more a'))closeMore({restoreFocus:false});
});
document.addEventListener('keydown',trapSheetFocus);
window.addEventListener('hashchange',()=>{closeMore({restoreFocus:false});schedule();});
window.addEventListener('popstate',schedule);
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
window.addEventListener('family-media-changed',schedule);
observeNavigationShell();
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',apply):apply();