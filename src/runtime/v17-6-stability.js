// v17.6 final v17 stabilization layer.
// State/auth stabilization only: Tree DOM presentation is owned by the
// consolidated advanced tree controller. This module never mutates canonical
// people, relationships, claims, evidence states, source records, or genealogy
// authority.
import{refreshAuth}from'../../auth.js';

const TREE_KEY='family.archive.treeState.v17.6';
const validScopes=new Set(['family','ancestors','descendants','direct','connected','all']);
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const safeJson=(raw,fallback={})=>{try{return JSON.parse(raw)||fallback;}catch{return fallback;}};
const readTreeState=()=>safeJson(localStorage.getItem(TREE_KEY)||'{}');
const writeTreeState=value=>{try{localStorage.setItem(TREE_KEY,JSON.stringify(value));}catch{}};

function treeStateFromUrl(){const u=new URL(location.href),focus=u.searchParams.get('focus')||'',scope=u.searchParams.get('scope')||'',depth=Number(u.searchParams.get('depth')||0);return{focus,scope:validScopes.has(scope)?scope:'',depth:[1,2,3].includes(depth)?depth:0};}
function persistTreeState(){if(route()!=='tree')return;const next=treeStateFromUrl(),prior=readTreeState();writeTreeState({focus:next.focus||prior.focus||'',scope:next.scope||prior.scope||'connected',depth:next.depth||prior.depth||2,updatedAt:Date.now()});}
function restoreTreeState(){if(route()!=='tree')return false;const current=treeStateFromUrl();if(current.focus||current.scope||current.depth)return false;const saved=readTreeState();if(!saved.focus&&!saved.scope&&!saved.depth)return false;const u=new URL(location.href);if(saved.focus)u.searchParams.set('focus',saved.focus);if(validScopes.has(saved.scope))u.searchParams.set('scope',saved.scope);if([1,2,3].includes(Number(saved.depth)))u.searchParams.set('depth',String(saved.depth));history.replaceState(history.state,'',u.toString());window.dispatchEvent(new HashChangeEvent('hashchange'));return true;}
function closeStaleMedia(){if(route()==='media')return;const dialog=document.querySelector('#media-viewer');if(dialog?.open&&typeof dialog.close==='function')dialog.close();else dialog?.removeAttribute('open');}
function clearMediaViewer(){const dialog=document.querySelector('#media-viewer');if(!dialog)return;if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');for(const id of['media-viewer-stage','media-viewer-title','media-viewer-caption','media-viewer-badges','media-viewer-facts','media-viewer-people']){const node=document.getElementById(id);if(node)node.replaceChildren();}const original=document.getElementById('media-viewer-original');if(original){original.removeAttribute('href');original.removeAttribute('download');}dialog.removeAttribute('data-media-id');}
function scrubPrivateMediaOnAuthLoss(event){if(event?.detail?.user)return;document.querySelectorAll('.media-library-card.is-private').forEach(node=>node.remove());clearMediaViewer();document.body.dataset.authState='anonymous';}
function markAuthState(event){document.body.dataset.authState=event?.detail?.user?'authenticated':'anonymous';}
function cleanupRouteState(){const r=route();document.body.dataset.v176Route=r;closeStaleMedia();}

let scheduled=false;function reconcile(){if(scheduled)return;scheduled=true;queueMicrotask(()=>requestAnimationFrame(()=>{scheduled=false;cleanupRouteState();if(restoreTreeState())return;persistTreeState();}));}

document.addEventListener('click',event=>{const treeControl=event.target.closest?.('[data-tree-scope],[data-tree-depth],[data-tree-person],[data-v172-tree-branch],[data-tree-component],[data-tree-recent-focus]');if(treeControl)setTimeout(()=>{persistTreeState();reconcile();},0);},true);
window.addEventListener('family-auth-changed',event=>{markAuthState(event);scrubPrivateMediaOnAuthLoss(event);reconcile();});
window.addEventListener('family-view-rendered',reconcile);
window.addEventListener('family-native-rendered',reconcile);
window.addEventListener('hashchange',reconcile);
window.addEventListener('popstate',reconcile);
window.addEventListener('pagehide',persistTreeState);
window.addEventListener('pageshow',event=>{if(event.persisted)refreshAuth().catch(()=>{});reconcile();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshAuth().catch(()=>{});});
const start=()=>{document.documentElement.dataset.v176='ready';if(!restoreTreeState())reconcile();};
if(document.readyState==='loading'){restoreTreeState();document.addEventListener('DOMContentLoaded',start);}else start();
