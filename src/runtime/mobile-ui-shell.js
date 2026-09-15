const MOBILE_QUERY='(max-width: 720px)';
const desiredDockOrder=['dashboard','families','tree','people'];
let routeShellAnchor=null;
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
  if(route==='tree')return'#dashboard';
  if(['media','stories','timeline','migration'].includes(route))return'#dashboard';
  if(['research','evidence','sources','intelligence'].includes(route))return'#dashboard';
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
  const title=header.querySelector('[data-mobile-app-title]');
  if(title)title.textContent=routeTitle();
  const back=header.querySelector('[data-mobile-app-back]');
  if(back){
    const home=routeKey()==='dashboard';
    back.hidden=home;
    back.href=backTarget();
    back.setAttribute('aria-label',home?'Home':`Back from ${routeTitle()}`);
  }
}

function reorderDock(){
  if(!isMobile())return;
  const dock=document.getElementById('family-mobile-dock');
  if(!dock)return;
  for(const key of desiredDockOrder){
    const item=dock.querySelector(`:scope > a[data-dock-route="${key}"]`);
    if(item)dock.append(item);
  }
  const more=dock.querySelector(':scope > details');
  if(more)dock.append(more);
  dock.dataset.actualMobileOrder='home-families-tree-people-more';
}

function ensureRouteShellAnchor(shell){
  if(routeShellAnchor?.isConnected)return routeShellAnchor;
  routeShellAnchor=document.createComment('mobile-route-shell-origin');
  shell.parentNode?.insertBefore(routeShellAnchor,shell);
  return routeShellAnchor;
}

function restoreRouteShell(){
  const shell=document.querySelector('.route-shell');
  if(!shell||!routeShellAnchor?.isConnected)return;
  if(shell.parentNode!==routeShellAnchor.parentNode||shell.previousSibling!==routeShellAnchor){
    routeShellAnchor.parentNode.insertBefore(shell,routeShellAnchor.nextSibling);
  }
  delete shell.dataset.mobileIntegratedSearch;
}

function integrateRouteSearch(){
  const shell=document.querySelector('.route-shell');
  if(!shell)return;
  ensureRouteShellAnchor(shell);
  if(!isMobile()){restoreRouteShell();return;}
  const route=routeKey();
  if(route==='dashboard'){
    const home=document.querySelector('[data-v17-native="home"]');
    const hero=home?.querySelector('.v17-home-hero');
    if(home&&hero){hero.insertAdjacentElement('afterend',shell);shell.dataset.mobileIntegratedSearch='home';}
    return;
  }
  if(route==='people'){
    const people=document.querySelector('[data-v17-native="people"]');
    const intro=people?.querySelector('.v17-page-intro');
    if(people&&intro){intro.insertAdjacentElement('afterend',shell);shell.dataset.mobileIntegratedSearch='people';}
    return;
  }
  restoreRouteShell();
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
    home.querySelector('.v21-mobile-launcher')?.remove();
    restoreMovedNode('home-actions',actions);
    return;
  }
  const hero=home.querySelector('.v17-home-hero');
  if(!hero||!actions)return;
  ensureReturnMarker(actions,'home-actions');
  let launcher=home.querySelector('.v21-mobile-launcher');
  if(!launcher){
    launcher=document.createElement('section');
    launcher.className='v21-mobile-launcher';
    launcher.setAttribute('aria-labelledby','v21-start-title');
    launcher.innerHTML='<div class="v21-launcher-heading"><span>START HERE</span><h2 id="v21-start-title">Explore your family</h2><p>Move through the archive the way you would in an app—not a stacked website.</p></div>';
  }
  launcher.append(actions);
  const shell=home.querySelector('.route-shell[data-mobile-integrated-search="home"]');
  (shell||hero).insertAdjacentElement('afterend',launcher);

  const tree=home.querySelector('.v17-home-tree');
  const story=home.querySelector('.v17-home-story');
  const people=home.querySelector('.v17-featured-people');
  const media=home.querySelector('.v17-home-media');
  const research=home.querySelector('.v17-research-door');
  if(tree)tree.dataset.v21Surface='connections';
  if(story)story.dataset.v21Surface='stories';
  if(people)people.dataset.v21Surface='people';
  if(media)media.dataset.v21Surface='media';
  if(research)research.dataset.v21Surface='research';
}

function composePeople(){
  const root=document.querySelector('[data-v17-native="people"]');
  if(!root||!isMobile())return;
  const search=root.querySelector('.route-shell[data-mobile-integrated-search="people"]');
  const branches=root.querySelector('.v17-branch-browser');
  if(search)search.setAttribute('aria-label','Find a family member');
  if(branches){
    branches.dataset.v21PeopleBranches='true';
    const summary=root.querySelector('.v17-branch-summary');
    const grid=root.querySelector('.v17-people-grid');
    if(summary&&grid&&summary.nextElementSibling!==grid)grid.before(summary);
  }
}

function composePerson(){
  const root=document.querySelector('[data-v17-native="person"]');
  if(!root)return;
  const actions=root.querySelector('.v17-person-actions');
  if(!isMobile()){
    root.querySelector('.v21-person-quick-actions')?.remove();
    restoreMovedNode('person-actions',actions);
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
  quick.append(actions);
  header.insertAdjacentElement('afterend',quick);
  root.dataset.v21PersonApp='true';
}

function composeTree(){
  const content=document.getElementById('content');
  if(!content)return;
  content.querySelector('.v21-tree-mode-bar')?.remove();
  if(!isMobile()||routeKey()!=='tree')return;
  const graph=content.querySelector('.graph-shell,.tree-graph-shell');
  if(!graph)return;
  const bar=document.createElement('div');
  bar.className='v21-tree-mode-bar';
  bar.innerHTML='<div><span>EXPLORE</span><strong>Family Tree</strong></div><div><button type="button" data-v21-tree-center>Center</button><button type="button" data-v21-tree-tools>Tools</button></div>';
  graph.insertAdjacentElement('beforebegin',bar);
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
  const discover=document.createElement('section');
  discover.className='v21-more-discover';
  discover.innerHTML='<span>DISCOVER</span><div></div>';
  [photos,stories,timeline,places].filter(Boolean).forEach(node=>discover.querySelector('div').append(node));
  const researchGroup=document.createElement('section');
  researchGroup.className='v21-more-research';
  researchGroup.innerHTML='<span>RESEARCH</span><div></div>';
  if(research)researchGroup.querySelector('div').append(research);
  if(search)panel.querySelector('.mobile-more-head')?.insertAdjacentElement('afterend',search);
  panel.append(discover,researchGroup);
}

function bindTreeButtons(){
  if(document.documentElement.dataset.v21TreeBindings==='true')return;
  document.documentElement.dataset.v21TreeBindings='true';
  document.addEventListener('click',event=>{
    const tools=event.target.closest('[data-v21-tree-tools]');
    if(tools){
      const details=document.querySelector('.family-graph-tools details,.family-graph-tools');
      if(details?.tagName==='DETAILS')details.open=true;
      details?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    const center=event.target.closest('[data-v21-tree-center]');
    if(center){
      const target=document.querySelector('[data-tree-fit],button[aria-label*="Fit" i],button[title*="Fit" i]');
      target?.click();
    }
  });
}

function apply(){
  syncDedicatedHeader();
  reorderDock();
  integrateRouteSearch();
  composeHome();
  composePeople();
  composePerson();
  composeTree();
  composeMore();
  bindTreeButtons();
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
