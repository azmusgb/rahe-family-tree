const MOBILE_QUERY='(max-width: 720px)';
const desiredDockOrder=['dashboard','families','tree','people','more'];
const PENDING_SEARCH_KEY='family.mobile.v21.pendingSearch';
const PENDING_FOCUS_KEY='family.mobile.v21.pendingFocus';
let scheduled=false;
let observing=false;

const isMobile=()=>window.matchMedia(MOBILE_QUERY).matches;
const routeKey=()=>document.body.dataset.route||location.hash.slice(1).split('/')[0]||'dashboard';
const titleMap={dashboard:'Home',tree:'Family Tree',people:'People',families:'Families',media:'Photos & Documents',stories:'Stories',timeline:'Timeline',migration:'Places',research:'Research Center',evidence:'Evidence',sources:'Sources',intelligence:'Research'};
const safeText=value=>String(value||'').replace(/\s+/g,' ').trim();

function routeTitle(){
  const route=routeKey();
  if(route==='person')return safeText(document.querySelector('.v17-person-header h2')?.textContent)||'Person';
  if(route==='branch')return safeText(document.querySelector('.v175-branch-hero h1')?.textContent)||'Family';
  return titleMap[route]||'Family History';
}

function backTarget(){
  const route=routeKey();
  if(route==='person')return'#people';
  if(route==='branch')return'#families';
  return'#dashboard';
}

function syncDedicatedHeader(){
  const header=document.getElementById('mobile-app-header');
  if(!header)return;
  if(!isMobile()){
    header.hidden=true;
    document.body.classList.remove('v21-actual-mobile-ui');
    return;
  }
  header.hidden=false;
  document.body.classList.add('v21-actual-mobile-ui');
  const nextTitle=routeTitle();
  const title=header.querySelector('[data-mobile-app-title]');
  if(title&&title.textContent!==nextTitle)title.textContent=nextTitle;
  const back=header.querySelector('[data-mobile-app-back]');
  if(back){
    const home=routeKey()==='dashboard';
    back.hidden=home;
    back.href=backTarget();
    back.setAttribute('aria-label',home?'Home':`Back from ${nextTitle}`);
  }
}

function dockKey(node){
  if(node.matches?.('a[data-dock-route]'))return node.dataset.dockRoute;
  if(node.matches?.('details'))return'more';
  return'';
}
function reorderDock(){
  if(!isMobile())return;
  const dock=document.getElementById('family-mobile-dock');
  if(!dock)return;
  const current=[...dock.children].map(dockKey).filter(Boolean);
  if(current.join('|')!==desiredDockOrder.join('|')){
    const nodes=new Map([...dock.children].map(node=>[dockKey(node),node]));
    desiredDockOrder.forEach(key=>{const node=nodes.get(key);if(node)dock.append(node);});
  }
  dock.dataset.actualMobileOrder='home-families-tree-people-more';
}

function originalSearch(){return document.getElementById('search');}
function setOriginalSearch(value){
  const input=originalSearch();
  if(!input)return false;
  if(input.value!==value)input.value=value;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  return true;
}
function pendingSearch(){try{return sessionStorage.getItem(PENDING_SEARCH_KEY)||'';}catch{return'';}}
function consumePendingSearch(){
  const value=pendingSearch();
  try{sessionStorage.removeItem(PENDING_SEARCH_KEY);}catch{}
  return value;
}
function queuePeopleSearch(value,{focus=false}={}){
  try{
    if(value)sessionStorage.setItem(PENDING_SEARCH_KEY,value);
    if(focus)sessionStorage.setItem(PENDING_FOCUS_KEY,'1');
  }catch{}
  if(routeKey()!=='people')location.hash='people';else schedule();
}
function shouldFocusPending(){
  try{
    const value=sessionStorage.getItem(PENDING_FOCUS_KEY)==='1';
    if(value)sessionStorage.removeItem(PENDING_FOCUS_KEY);
    return value;
  }catch{return false;}
}

function makeSearch(kind,{label,placeholder}){
  const form=document.createElement('form');
  form.className='v21-mobile-search';
  form.dataset.v21MobileSearch=kind;
  form.setAttribute('role','search');
  form.innerHTML=`<label><span>${label}</span><div><input type="search" autocomplete="off" enterkeyhint="search" placeholder="${placeholder}" aria-label="${label}"><button type="submit">Search</button></div></label>`;
  const input=form.querySelector('input');
  if(kind==='people')input.value=originalSearch()?.value||'';
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const value=input.value.trim();
    if(kind==='home')queuePeopleSearch(value,{focus:!value});
    else setOriginalSearch(value);
  });
  if(kind==='people')input.addEventListener('input',()=>setOriginalSearch(input.value));
  return form;
}

function composeHomeSearch(home,hero){
  let search=home.querySelector('.v21-mobile-search[data-v21-mobile-search="home"]');
  if(!search)search=makeSearch('home',{label:'Find someone in the family',placeholder:'Name, family, or place…'});
  if(hero.nextElementSibling!==search)hero.insertAdjacentElement('afterend',search);
  return search;
}
function composePeopleSearch(root,intro){
  let search=root.querySelector('.v21-mobile-search[data-v21-mobile-search="people"]');
  if(!search)search=makeSearch('people',{label:'Search people',placeholder:'Name, branch, or place…'});
  if(intro.nextElementSibling!==search)intro.insertAdjacentElement('afterend',search);
  const pending=consumePendingSearch();
  if(pending){
    search.querySelector('input').value=pending;
    setOriginalSearch(pending);
  }
  if(shouldFocusPending())requestAnimationFrame(()=>search.querySelector('input')?.focus({preventScroll:false}));
  return search;
}

function ensureReturnMarker(node,key){
  if(!node?.parentNode)return null;
  let marker=node.parentNode.querySelector(`:scope > [data-v21-return="${key}"]`);
  if(marker)return marker;
  marker=document.createElement('span');
  marker.hidden=true;
  marker.dataset.v21Return=key;
  node.parentNode.insertBefore(marker,node);
  return marker;
}
function restoreMovedNode(key,node){
  const marker=document.querySelector(`[data-v21-return="${key}"]`);
  if(marker?.parentNode&&node){marker.parentNode.insertBefore(node,marker.nextSibling);marker.remove();}
}

function composeHome(){
  const home=document.querySelector('[data-v17-native="home"]');
  if(!home)return;
  const actions=home.querySelector('.v17-primary-actions');
  if(!isMobile()){
    const launcher=home.querySelector('.v21-mobile-launcher');
    if(launcher){restoreMovedNode('home-actions',actions);launcher.remove();}
    home.querySelector('.v21-mobile-search')?.remove();
    return;
  }
  const hero=home.querySelector('.v17-home-hero');
  if(!hero||!actions)return;
  const search=composeHomeSearch(home,hero);
  ensureReturnMarker(actions,'home-actions');
  let launcher=home.querySelector('.v21-mobile-launcher');
  if(!launcher){
    launcher=document.createElement('section');
    launcher.className='v21-mobile-launcher';
    launcher.setAttribute('aria-labelledby','v21-start-title');
    launcher.innerHTML='<div class="v21-launcher-heading"><span>START HERE</span><h2 id="v21-start-title">Explore your family</h2><p>Move through the archive the way you would in an app—not a stacked website.</p></div>';
  }
  if(actions.parentNode!==launcher)launcher.append(actions);
  if(search.nextElementSibling!==launcher)search.insertAdjacentElement('afterend',launcher);

  const surfaceMap=[['.v17-home-tree','connections'],['.v17-home-story','stories'],['.v17-featured-people','people'],['.v17-home-media','media'],['.v17-research-door','research']];
  surfaceMap.forEach(([selector,value])=>{const node=home.querySelector(selector);if(node)node.dataset.v21Surface=value;});
}

function composePeople(){
  const root=document.querySelector('[data-v17-native="people"]');
  if(!root)return;
  if(!isMobile()){root.querySelector('.v21-mobile-search')?.remove();return;}
  const intro=root.querySelector('.v17-page-intro');
  if(intro)composePeopleSearch(root,intro);
  const branches=root.querySelector('.v17-branch-browser');
  if(branches)branches.dataset.v21PeopleBranches='true';
}

function composePerson(){
  const root=document.querySelector('[data-v17-native="person"]');
  if(!root)return;
  const actions=root.querySelector('.v17-person-actions');
  if(!isMobile()){
    const quick=root.querySelector('.v21-person-quick-actions');
    if(quick){restoreMovedNode('person-actions',actions);quick.remove();}
    return;
  }
  const header=root.querySelector('.v17-person-header');
  if(!header||!actions)return;
  ensureReturnMarker(actions,'person-actions');
  let quick=root.querySelector('.v21-person-quick-actions');
  if(!quick){
    quick=document.createElement('nav');
    quick.className='v21-person-quick-actions';
    quick.setAttribute('aria-label','Person quick actions');
    quick.innerHTML='<span>EXPLORE THIS PERSON</span>';
  }
  if(actions.parentNode!==quick)quick.append(actions);
  if(header.nextElementSibling!==quick)header.insertAdjacentElement('afterend',quick);
  root.dataset.v21PersonApp='true';
}

function composeTree(){
  const content=document.getElementById('content');
  if(!content)return;
  if(!isMobile()||routeKey()!=='tree'){
    content.querySelector('.v21-tree-mode-bar')?.remove();
    delete content.dataset.v21TreeApp;
    return;
  }
  const graph=content.querySelector('.graph-shell,.tree-graph-shell');
  if(!graph)return;
  let bar=content.querySelector('.v21-tree-mode-bar');
  if(!bar){
    bar=document.createElement('div');
    bar.className='v21-tree-mode-bar';
    bar.innerHTML='<div><span>EXPLORE</span><strong>Family Tree</strong></div><div><button type="button" data-v21-tree-center>Center</button><button type="button" data-v21-tree-tools>Tools</button></div>';
  }
  if(graph.previousElementSibling!==bar)graph.insertAdjacentElement('beforebegin',bar);
  content.dataset.v21TreeApp='true';
}

function composeMore(){
  if(!isMobile())return;
  const panel=document.querySelector('#family-mobile-dock details > div');
  if(!panel||panel.querySelector('.v21-more-discover'))return;
  const photos=panel.querySelector('a[href="#media"]');
  const stories=panel.querySelector('a[href="#stories"]');
  const timeline=panel.querySelector('a[href="#timeline"]');
  const places=panel.querySelector('a[href="#migration"]');
  const research=panel.querySelector('a[href="#research"]');
  const search=panel.querySelector('[data-dock-search]');
  if(search){search.removeAttribute('data-dock-search');search.dataset.mobileUiSearch='true';}
  const discover=document.createElement('section');
  discover.className='v21-more-discover';
  discover.innerHTML='<span>DISCOVER</span><div></div>';
  [photos,stories,timeline,places].filter(Boolean).forEach(node=>discover.querySelector('div').append(node));
  const researchGroup=document.createElement('section');
  researchGroup.className='v21-more-research';
  researchGroup.innerHTML='<span>RESEARCH</span><div></div>';
  if(research)researchGroup.querySelector('div').append(research);
  const head=panel.querySelector('.mobile-more-head');
  if(search&&head)head.insertAdjacentElement('afterend',search);
  panel.append(discover,researchGroup);
}

function bindControls(){
  if(document.documentElement.dataset.v21Bindings==='true')return;
  document.documentElement.dataset.v21Bindings='true';
  document.addEventListener('click',event=>{
    const mobileSearchTrigger=event.target.closest('[data-mobile-ui-search],#mobile-app-header [data-global-search]');
    if(mobileSearchTrigger&&isMobile()){
      event.preventDefault();event.stopImmediatePropagation();
      document.querySelector('#family-mobile-dock details[open]')?.removeAttribute('open');
      queuePeopleSearch('',{focus:true});
      return;
    }
    const tools=event.target.closest('[data-v21-tree-tools]');
    if(tools){
      const details=document.querySelector('.family-graph-tools details,.family-graph-tools');
      if(details?.tagName==='DETAILS')details.open=true;
      details?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
      return;
    }
    const center=event.target.closest('[data-v21-tree-center]');
    if(center){
      const target=document.querySelector('[data-graph="fit"],[data-tree-fit],button[aria-label*="Fit" i],button[title*="Fit" i]');
      target?.click();
    }
  },true);
}

function apply(){
  syncDedicatedHeader();
  reorderDock();
  composeHome();
  composePeople();
  composePerson();
  composeTree();
  composeMore();
  bindControls();
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduled=false;apply();}));
}
function observe(){
  if(observing)return;
  observing=true;
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
}

window.addEventListener('hashchange',schedule);
window.addEventListener('popstate',schedule);
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
window.addEventListener('family-media-changed',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{apply();observe();}):(()=>{apply();observe();})();
