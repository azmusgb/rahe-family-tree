// v17.6 final v17 stabilization layer.
// Presentation/runtime only: never mutates canonical people, relationships,
// claims, evidence states, source records, or genealogy authority.
import{refreshAuth}from'../../auth.js';

const TREE_KEY='family.archive.treeState.v17.6';
const validScopes=new Set(['family','ancestors','descendants','direct','connected','all']);
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const reducedMotion=()=>matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
const safeJson=(raw,fallback={})=>{try{return JSON.parse(raw)||fallback;}catch{return fallback;}};
const readTreeState=()=>safeJson(localStorage.getItem(TREE_KEY)||'{}');
const writeTreeState=value=>{try{localStorage.setItem(TREE_KEY,JSON.stringify(value));}catch{}}

function treeStateFromUrl(){const u=new URL(location.href),focus=u.searchParams.get('focus')||'',scope=u.searchParams.get('scope')||'',depth=Number(u.searchParams.get('depth')||0);return{focus,scope:validScopes.has(scope)?scope:'',depth:[1,2,3].includes(depth)?depth:0};}
function persistTreeState(){if(route()!=='tree')return;const next=treeStateFromUrl(),prior=readTreeState();writeTreeState({focus:next.focus||prior.focus||'',scope:next.scope||prior.scope||'connected',depth:next.depth||prior.depth||2,updatedAt:Date.now()});}
function restoreTreeState(){if(route()!=='tree')return;const current=treeStateFromUrl();if(current.focus||current.scope||current.depth)return;const saved=readTreeState();if(!saved.focus&&!saved.scope&&!saved.depth)return;const u=new URL(location.href);if(saved.focus)u.searchParams.set('focus',saved.focus);if(validScopes.has(saved.scope))u.searchParams.set('scope',saved.scope);if([1,2,3].includes(Number(saved.depth)))u.searchParams.set('depth',String(saved.depth));history.replaceState(history.state,'',u);}
function closeStaleMedia(){if(route()==='media')return;const dialog=document.querySelector('#media-viewer');if(dialog?.open&&typeof dialog.close==='function')dialog.close();else dialog?.removeAttribute('open');}
function scrubPrivateMediaOnAuthLoss(event){if(event?.detail?.user)return;document.querySelectorAll('.media-library-card.is-private').forEach(node=>node.remove());const viewer=document.querySelector('#media-viewer');if(viewer?.open&&typeof viewer.close==='function')viewer.close();else viewer?.removeAttribute('open');document.body.dataset.authState='anonymous';}
function markAuthState(event){document.body.dataset.authState=event?.detail?.user?'authenticated':'anonymous';}
function download(name,type,text){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function treeExport(){const svg=document.querySelector('#family-graph');if(!svg)return;const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');download('rahe-family-tree.svg','image/svg+xml;charset=utf-8',new XMLSerializer().serializeToString(clone));}
async function copyTreeLink(button){try{await navigator.clipboard.writeText(location.href);const prior=button.textContent;button.textContent='Link copied';setTimeout(()=>{button.textContent=prior;},1200);}catch{const input=document.createElement('textarea');input.value=location.href;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();document.execCommand('copy');input.remove();}}
function enhanceTreeToolbar(){if(route()!=='tree')return;const toolbar=document.querySelector('.graph-toolbar');if(!toolbar||toolbar.querySelector('[data-v176-tools]'))return;const tools=document.createElement('span');tools.dataset.v176Tools='true';tools.className='v176-tree-tools';tools.innerHTML='<button type="button" data-v176-copy-link>Copy tree link</button><button type="button" data-v176-export-svg>Export SVG</button><button type="button" data-v176-print-tree>Print tree</button>';toolbar.append(tools);}
function focusSelectedPerson(){if(route()!=='tree')return;const id=new URL(location.href).searchParams.get('focus');if(!id)return;const node=document.querySelector(`.graph-node[data-person="${CSS.escape(id)}"]`);if(!node)return;node.setAttribute('aria-current','true');if(document.body.dataset.v176Centered===id)return;document.body.dataset.v176Centered=id;requestAnimationFrame(()=>node.scrollIntoView({block:'center',inline:'center',behavior:reducedMotion()?'auto':'smooth'}));}
function cleanupRouteState(){const r=route();document.body.dataset.v176Route=r;if(r!=='tree'){delete document.body.dataset.v176Centered;}closeStaleMedia();}
let scheduled=false;function reconcile(){if(scheduled)return;scheduled=true;queueMicrotask(()=>requestAnimationFrame(()=>{scheduled=false;cleanupRouteState();restoreTreeState();persistTreeState();enhanceTreeToolbar();focusSelectedPerson();}));}

document.addEventListener('click',event=>{const exportButton=event.target.closest?.('[data-v176-export-svg]');if(exportButton){event.preventDefault();treeExport();return;}const printButton=event.target.closest?.('[data-v176-print-tree]');if(printButton){event.preventDefault();window.print();return;}const copyButton=event.target.closest?.('[data-v176-copy-link]');if(copyButton){event.preventDefault();copyTreeLink(copyButton);return;}const treeControl=event.target.closest?.('[data-tree-scope],[data-tree-depth],[data-tree-person],[data-v172-tree-branch]');if(treeControl)setTimeout(()=>{persistTreeState();reconcile();},0);},true);
window.addEventListener('family-auth-changed',event=>{markAuthState(event);scrubPrivateMediaOnAuthLoss(event);reconcile();});
window.addEventListener('family-view-rendered',reconcile);
window.addEventListener('family-native-rendered',reconcile);
window.addEventListener('hashchange',reconcile);
window.addEventListener('popstate',reconcile);
window.addEventListener('pageshow',event=>{if(event.persisted)refreshAuth().catch(()=>{});reconcile();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshAuth().catch(()=>{});});
const start=()=>{document.documentElement.dataset.v176='ready';reconcile();};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
