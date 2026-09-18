const MOBILE_QUERY='(max-width: 720px)';
const MOBILE_HOME_COLLAPSED_SURFACES=['.ui-home-story','.ui-featured-people','.ui-home-media','.ui-research-door'];
const MOBILE_ROUTE_TRAIL_LIMIT=12;
let pendingPeopleSearchValue='';
let pendingPeopleSearchFocus=false;
let scheduled=false;
let lastMobileRoute='';
let suppressNextTrailPush=false;
const mobileRouteTrail=[];

const isMobile=()=>window.matchMedia(MOBILE_QUERY).matches;
const routeKey=()=>document.body.dataset.route||location.hash.slice(1).split('/')[0]||'dashboard';
const titleMap={dashboard:'Home',tree:'Family Tree',people:'People',families:'Families',media:'Photos & Documents',stories:'Stories',timeline:'Timeline',migration:'Places',research:'Research Center',evidence:'Evidence',sources:'Sources',intelligence:'Research'};
const safeText=value=>String(value||'').replace(/\s+/g,' ').trim();

function routeTitle(){
  const route=routeKey();
  if(route==='person')return safeText(document.querySelector('.person-header h2')?.textContent)||'Person';
  if(route==='branch')return safeText(document.querySelector('.ui-branch-hero h1')?.textContent)||'Family';
  return titleMap[route]||'Family History';
}

function backTarget(){
  const route=routeKey();
  if(route==='person')return'#people';
  if(route==='branch')return'#families';
  return'#dashboard';
}

function recordMobileRoute(){
  if(!isMobile()){
    lastMobileRoute='';
    mobileRouteTrail.length=0;
    suppressNextTrailPush=false;
    return;
  }
  const current=routeKey();
  if(!lastMobileRoute){lastMobileRoute=current;return;}
  if(current===lastMobileRoute)return;
  if(!suppressNextTrailPush){
    mobileRouteTrail.push(lastMobileRoute);
    if(mobileRouteTrail.length>MOBILE_ROUTE_TRAIL_LIMIT)mobileRouteTrail.splice(0,mobileRouteTrail.length-MOBILE_ROUTE_TRAIL_LIMIT);
  }
  suppressNextTrailPush=false;
  lastMobileRoute=current;
}

function navigateMobileBack(){
  if(!isMobile())return false;
  const current=routeKey();
  let previous='';
  while(mobileRouteTrail.length&&!previous){
    const candidate=mobileRouteTrail.pop();
    if(candidate&&candidate!==current)previous=candidate;
  }
  suppressNextTrailPush=true;
  location.hash=previous||backTarget();
  return true;
}

function syncDedicatedHeader(){
  const header=document.getElementById('mobile-app-header');
  const siteHeader=document.querySelector('.site-header.sidebar');
  if(!header)return;
  const mobileViewport=isMobile();
  header.hidden=!mobileViewport;
  if(siteHeader){
    siteHeader.hidden=mobileViewport;
    siteHeader.setAttribute('aria-hidden',String(mobileViewport));
  }
  if(!mobileViewport){
    document.body.classList.remove('ui-actual-mobile-ui');
    delete document.body.dataset.mobileHeaderOwner;
    return;
  }
  document.body.dataset.mobileHeaderOwner='dedicated';
  document.body.classList.add('ui-actual-mobile-ui');
  const nextTitle=routeTitle();
  const title=header.querySelector('[data-mobile-app-title]');
  if(title&&title.textContent!==nextTitle)title.textContent=nextTitle;
  const back=header.querySelector('[data-mobile-app-back]');
  if(back){
    const home=routeKey()==='dashboard';
    back.hidden=home;
    back.href=backTarget();
    back.dataset.mobileSmartBack='true';
    back.setAttribute('aria-label',home?'Home':`Back from ${nextTitle}`);
  }
}

function originalSearch(){return document.getElementById('search');}
function setOriginalSearch(value){
  const input=originalSearch();
  if(!input)return false;
  if(input.value!==value)input.value=value;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  return true;
}
function queuePeopleSearch(value,{focus=false}={}){
  pendingPeopleSearchValue=value;
  pendingPeopleSearchFocus=focus;
  if(routeKey()!=='people')location.hash='people';else schedule();
}
function consumePeopleSearchRequest(){
  const request={value:pendingPeopleSearchValue,focus:pendingPeopleSearchFocus};
  pendingPeopleSearchValue='';
  if(!request.focus)pendingPeopleSearchFocus=false;
  return request;
}
function focusPeopleSearch(input){
  if(!input||routeKey()!=='people'||!isMobile())return;
  input.focus({preventScroll:false});
  requestAnimationFrame(()=>{
    if(!input.isConnected||routeKey()!=='people'||!isMobile())return;
    if(document.activeElement!==input)input.focus({preventScroll:false});
    if(document.activeElement===input)pendingPeopleSearchFocus=false;
  });
}

function makeSearch(kind,{label,placeholder}){
  const form=document.createElement('form');
  form.className='mobile-search';
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
  let search=home.querySelector('.mobile-search[data-v21-mobile-search="home"]');
  if(!search)search=makeSearch('home',{label:'Find someone in the family',placeholder:'Name, family, or place…'});
  if(hero.nextElementSibling!==search)hero.insertAdjacentElement('afterend',search);
  return search;
}
function composePeopleSearch(root,intro){
  let search=root.querySelector('.mobile-search[data-v21-mobile-search="people"]');
  if(!search)search=makeSearch('people',{label:'Search people',placeholder:'Name, branch, or place…'});
  if(intro.nextElementSibling!==search)intro.insertAdjacentElement('afterend',search);
  const request=consumePeopleSearchRequest();
  const input=search.querySelector('input');
  if(request.value){
    input.value=request.value;
    setOriginalSearch(request.value);
  }
  if(request.focus)focusPeopleSearch(input);
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

function setMobileHomePreviewState(home,collapsed){
  for(const selector of MOBILE_HOME_COLLAPSED_SURFACES){
    const node=home.querySelector(selector);
    if(!node)continue;
    if(collapsed){
      if(node.dataset.v22MobileCollapsed!=='true')node.dataset.v22MobileCollapsed='true';
      if(!node.hidden)node.hidden=true;
    }else if(node.dataset.v22MobileCollapsed==='true'){
      node.hidden=false;
      delete node.dataset.v22MobileCollapsed;
    }
  }
}

function composeHomeDiscover(home,anchor){
  let discover=home.querySelector('.v22-mobile-discover');
  if(!discover){
    discover=document.createElement('section');
    discover.className='ui-mobile-launcher v22-mobile-discover';
    discover.setAttribute('aria-labelledby','v22-discover-title');
    discover.innerHTML='<div class="ui-launcher-heading"><span>DISCOVER MORE</span><h2 id="v22-discover-title">Keep exploring</h2><p>Jump straight to the part of the archive you want instead of scrolling through every preview.</p></div><nav class="ui-primary-actions" aria-label="More family destinations"><a class="action" href="#stories">Stories</a><a class="action" href="#people">People</a><a class="action" href="#media">Photos</a><a class="action" href="#timeline">Timeline</a><a class="action" href="#migration">Places</a><a class="action" href="#research">Research</a></nav>';
  }
  if(anchor?.parentNode&&anchor.nextElementSibling!==discover)anchor.insertAdjacentElement('afterend',discover);
  return discover;
}

function restoreHomeComposition(home,actions){
  const launcher=home.querySelector('.ui-mobile-launcher:not(.v22-mobile-discover)');
  if(launcher){restoreMovedNode('home-actions',actions);launcher.remove();}
  home.querySelector('.v22-mobile-discover')?.remove();
  home.querySelector('.mobile-search[data-v21-mobile-search="home"]')?.remove();
  setMobileHomePreviewState(home,false);
}

function composeHome(){
  const home=document.querySelector('[data-ui-native="home"]');
  if(!home)return;
  const actions=home.querySelector('.ui-primary-actions');
  if(!isMobile()){
    restoreHomeComposition(home,actions);
    return;
  }
  const hero=home.querySelector('.ui-family-home-hero');
  if(!hero||!actions)return;
  const search=composeHomeSearch(home,hero);
  ensureReturnMarker(actions,'home-actions');
  let launcher=home.querySelector('.ui-mobile-launcher:not(.v22-mobile-discover)');
  if(!launcher){
    launcher=document.createElement('section');
    launcher.className='ui-mobile-launcher';
    launcher.setAttribute('aria-labelledby','v21-start-title');
    launcher.innerHTML='<div class="ui-launcher-heading"><span>START HERE</span><h2 id="v21-start-title">Explore your family</h2><p>Move through the archive the way you would in an app—not a stacked website.</p></div>';
  }
  if(actions.parentNode!==launcher)launcher.append(actions);
  if(search.nextElementSibling!==launcher)search.insertAdjacentElement('afterend',launcher);

  const surfaceMap=[['.ui-home-tree','connections'],['.ui-home-story','stories'],['.ui-featured-people','people'],['.ui-home-media','media'],['.ui-research-door','research']];
  surfaceMap.forEach(([selector,value])=>{const node=home.querySelector(selector);if(node&&node.dataset.v21Surface!==value)node.dataset.v21Surface=value;});

  const treePreview=home.querySelector('.ui-home-tree');
  setMobileHomePreviewState(home,true);
  composeHomeDiscover(home,treePreview||launcher);
}

function composePeople(){
  const root=document.querySelector('[data-ui-native="people"]');
  if(!root)return;
  if(!isMobile()){root.querySelector('.mobile-search')?.remove();return;}
  const intro=root.querySelector('.ui-page-intro');
  if(intro)composePeopleSearch(root,intro);
  const branches=root.querySelector('.ui-family-branch-browser');
  if(branches)branches.dataset.v21PeopleBranches='true';
}

function composePerson(){
  const root=document.querySelector('[data-ui-native="person"]');
  if(!root)return;
  const actions=root.querySelector('.ui-person-actions');
  if(!isMobile()){
    const quick=root.querySelector('.ui-person-quick-actions');
    if(quick){restoreMovedNode('person-actions',actions);quick.remove();}
    delete root.dataset.v22PersonFlow;
    return;
  }
  const header=root.querySelector('.person-header');
  if(!header||!actions)return;
  ensureReturnMarker(actions,'person-actions');
  let quick=root.querySelector('.ui-person-quick-actions');
  if(!quick){
    quick=document.createElement('nav');
    quick.className='ui-person-quick-actions';
    quick.setAttribute('aria-label','Person quick actions');
    quick.innerHTML='<span>EXPLORE THIS PERSON</span>';
  }
  if(actions.parentNode!==quick)quick.append(actions);
  if(header.nextElementSibling!==quick)header.insertAdjacentElement('afterend',quick);
  actions.querySelectorAll('a,button').forEach(control=>{
    control.dataset.mobilePersonAction='true';
    if(!control.getAttribute('aria-label')){
      const label=safeText(control.textContent);
      if(label)control.setAttribute('aria-label',`${label} for ${routeTitle()}`);
    }
  });
  root.dataset.v21PersonApp='true';
  root.dataset.v22PersonFlow='compact';
}

function composeTree(){
  const content=document.getElementById('content');
  if(!content)return;
  if(!isMobile()||routeKey()!=='tree'){
    content.querySelector('.ui-tree-mode-bar')?.remove();
    delete content.dataset.v21TreeApp;
    delete content.dataset.v22TreeCanvas;
    return;
  }
  const graph=content.querySelector('.graph-shell,.tree-graph-shell');
  if(!graph)return;
  let bar=content.querySelector('.ui-tree-mode-bar');
  if(!bar){
    bar=document.createElement('div');
    bar.className='ui-tree-mode-bar';
    bar.setAttribute('role','toolbar');
    bar.setAttribute('aria-label','Family tree controls');
    bar.innerHTML='<div><span>EXPLORE</span><strong>Family Tree</strong></div><div><button type="button" data-v21-tree-center aria-label="Center and fit family tree">Center</button><button type="button" data-v21-tree-tools aria-label="Open family tree tools">Tools</button></div>';
  }
  if(graph.previousElementSibling!==bar)graph.insertAdjacentElement('beforebegin',bar);
  if(!graph.hasAttribute('tabindex'))graph.tabIndex=0;
  if(!graph.hasAttribute('role'))graph.setAttribute('role','region');
  if(!graph.getAttribute('aria-label'))graph.setAttribute('aria-label','Interactive family tree canvas');
  content.dataset.v21TreeApp='true';
  content.dataset.v22TreeCanvas='focused';
}

function composeMore(){
  if(!isMobile())return;
  const details=document.querySelector('#family-mobile-dock details.mobile-more');
  const panel=details?.querySelector(':scope > div');
  if(!panel)return;
  const heading=panel.querySelector('.mobile-more-head strong');
  if(heading){
    if(!heading.id)heading.id='mobile-more-title';
    panel.setAttribute('aria-labelledby',heading.id);
  }
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  if(panel.querySelector('.ui-more-discover'))return;
  const photos=panel.querySelector('a[href="#media"]');
  const stories=panel.querySelector('a[href="#stories"]');
  const timeline=panel.querySelector('a[href="#timeline"]');
  const places=panel.querySelector('a[href="#migration"]');
  const research=panel.querySelector('a[href="#research"]');
  const search=panel.querySelector('[data-dock-search]');
  if(search){
    search.removeAttribute('data-dock-search');
    search.dataset.mobileUiSearch='true';
    search.setAttribute('aria-label','Search the family archive');
  }
  const discover=document.createElement('section');
  discover.className='ui-more-discover';
  discover.innerHTML='<span>DISCOVER</span><div></div>';
  [photos,stories,timeline,places].filter(Boolean).forEach(node=>discover.querySelector('div').append(node));
  const researchGroup=document.createElement('section');
  researchGroup.className='ui-more-research';
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
    const smartBack=event.target.closest('[data-mobile-smart-back]');
    if(smartBack&&isMobile()){
      event.preventDefault();
      navigateMobileBack();
      return;
    }
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

function composeActiveRoute(route){
  if(route==='dashboard')composeHome();
  else if(route==='people')composePeople();
  else if(route==='person')composePerson();
  else if(route==='tree')composeTree();
}

function apply(){
  const route=routeKey();
  recordMobileRoute();
  syncDedicatedHeader();
  composeActiveRoute(route);
  composeMore();
  bindControls();
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;apply();});
}

window.addEventListener('hashchange',schedule);
window.addEventListener('popstate',schedule);
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
window.addEventListener('family-media-changed',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',apply):apply();