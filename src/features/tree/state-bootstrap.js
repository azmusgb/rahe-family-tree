// Tiny synchronous tree-state bootstrap.
// Restores a previously selected tree context before deferred presentation
// layers load. This changes browser navigation state only; canonical genealogy
// data, evidence states, relationships, claims, and sources are never mutated.
const TREE_KEY='family.archive.treeState.v17.6';
const validScopes=new Set(['family','ancestors','descendants','direct','connected','all']);
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const safeJson=(raw,fallback={})=>{try{return JSON.parse(raw)||fallback;}catch{return fallback;}};

function restoreSavedTreeState(){
  if(route()!=='tree')return false;
  const current=new URL(location.href);
  const hasExplicitState=current.searchParams.has('focus')||current.searchParams.has('scope')||current.searchParams.has('depth');
  if(hasExplicitState)return false;
  let saved={};
  try{saved=safeJson(localStorage.getItem(TREE_KEY)||'{}');}catch{return false;}
  const focus=String(saved.focus||'');
  const scope=validScopes.has(saved.scope)?saved.scope:'';
  const depth=[1,2,3].includes(Number(saved.depth))?Number(saved.depth):0;
  if(!focus&&!scope&&!depth)return false;
  if(focus)current.searchParams.set('focus',focus);
  if(scope)current.searchParams.set('scope',scope);
  if(depth)current.searchParams.set('depth',String(depth));
  history.replaceState(history.state,'',current.toString());
  return true;
}

restoreSavedTreeState();
