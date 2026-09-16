import'./route-capabilities.js';

const INTERNAL_LINK_SELECTOR='a[href^="#"]';
const APP_ROUTES=new Set(['dashboard','tree','people','person','families','branch','media','stories','timeline','migration','research','evidence','sources','intelligence','archive','claim','source','task','intake','identity','conflicts']);
const TOP_LEVEL_ROUTES=new Set(['dashboard','tree','people','families','media','stories','timeline','migration','research','evidence','sources','intelligence']);

let sequence=0;
let currentHref=location.href;
let currentRoute=location.hash.slice(1).split('/')[0]||'dashboard';
let popTraversal=false;
let renderedBeforeCommitRoute='';
let pendingHashNavigation='';

export function routeKeyFromLocation(){return location.hash.slice(1).split('/')[0]||'dashboard';}
export function routeDetailFromLocation(){return location.hash.slice(1).split('/').slice(1).join('/');}
export function navigationSnapshot(){return{sequence,href:currentHref,route:currentRoute,state:document.body.dataset.navigationState||'idle'};}

function dispatch(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}
function routeFromHref(href){try{const url=new URL(href,location.href);return url.hash.slice(1).split('/')[0]||'dashboard';}catch{return'';}}
function sameDocumentHashLink(link){if(!link)return false;try{const url=new URL(link.href,location.href);return url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search&&url.hash.startsWith('#');}catch{return false;}}

function markIntent(link){
  if(!sameDocumentHashLink(link))return;
  const route=routeFromHref(link.href);if(!APP_ROUTES.has(route))return;
  document.body.dataset.navigationState='navigating';
  document.body.dataset.navigationTarget=route;
  dispatch('family-route-intent',{route,href:link.href,sequence:sequence+1});
}

function deferHashNavigation(link,event){
  if(!sameDocumentHashLink(link)||event.defaultPrevented)return false;
  const route=routeFromHref(link.href);if(!APP_ROUTES.has(route))return false;
  const url=new URL(link.href,location.href),targetHash=url.hash;
  if(!targetHash||targetHash===location.hash)return false;
  // A native same-document hash navigation can run hashchange listeners before
  // the initiating click task yields. Tree rendering is intentionally rich and
  // can make that physical click appear stuck for seconds. Preserve the normal
  // history/hash semantics, but commit the hash in the next task so pointer
  // activation and pressed-state feedback finish immediately.
  event.preventDefault();
  pendingHashNavigation=targetHash;
  setTimeout(()=>{
    if(pendingHashNavigation!==targetHash)return;
    pendingHashNavigation='';
    if(location.hash!==targetHash)location.hash=targetHash;
  },0);
  return true;
}

function commit(source,{historyTraversal=false}={}){
  const href=location.href,route=routeKeyFromLocation();
  if(href===currentHref&&route===currentRoute&&source!=='initial')return;
  const previousHref=currentHref,previousRoute=currentRoute;
  currentHref=href;currentRoute=route;sequence+=1;
  document.body.dataset.navigationState='committed';
  document.body.dataset.navigationRoute=route;
  document.body.dataset.navigationSequence=String(sequence);
  delete document.body.dataset.navigationTarget;
  dispatch('family-route-committed',{route,previousRoute,href,previousHref,sequence,source,historyTraversal});
  if(!historyTraversal&&previousRoute!==route&&TOP_LEVEL_ROUTES.has(route))window.scrollTo({top:0,left:0,behavior:'auto'});
  // Legacy renderers can emit family-view-rendered before this module's
  // hashchange listener runs. Carry that readiness across the commit instead
  // of leaving the lifecycle parked at "committed" indefinitely.
  if(renderedBeforeCommitRoute===route){renderedBeforeCommitRoute='';queueMicrotask(()=>markRouteContentReady(route));}
}

export function markRouteContentReady(route=routeKeyFromLocation()){
  if(route!==currentRoute){renderedBeforeCommitRoute=route;return;}
  renderedBeforeCommitRoute='';
  document.body.dataset.navigationState='idle';
  dispatch('family-route-content-ready',{route,sequence,href:currentHref});
}

document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.(INTERNAL_LINK_SELECTOR);
  markIntent(link);
  deferHashNavigation(link,event);
},true);

window.addEventListener('popstate',()=>{popTraversal=true;pendingHashNavigation='';commit('popstate',{historyTraversal:true});queueMicrotask(()=>{popTraversal=false;});});
window.addEventListener('hashchange',()=>{pendingHashNavigation='';commit('hashchange',{historyTraversal:popTraversal});});
window.addEventListener('family-view-rendered',()=>markRouteContentReady(routeKeyFromLocation()));
window.addEventListener('family-native-rendered',event=>markRouteContentReady(event.detail?.route||routeKeyFromLocation()));

const start=()=>commit('initial');
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();

globalThis.__familyNavigationRuntime={snapshot:navigationSnapshot,commit:()=>commit('manual')};
