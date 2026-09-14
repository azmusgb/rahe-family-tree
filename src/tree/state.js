import{VALID_SCOPES}from'./traversal.js';

export const TREE_STATE_KEY='family.archive.treeState.v19';
export const RECENT_KEY='family.archive.treeRecent.v19';
export const COLLAPSE_KEY='family.archive.treeCollapsed.v19';

const safeJson=(raw,fallback)=>{try{return JSON.parse(raw)||fallback;}catch{return fallback;}};

export function readTreeState(urlLike=globalThis.location?.href||'http://localhost/#tree'){
  const url=new URL(urlLike,'http://localhost/');
  const scope=VALID_SCOPES.has(url.searchParams.get('scope'))?url.searchParams.get('scope'):'connected';
  const depth=Math.max(1,Math.min(6,Number(url.searchParams.get('depth')||2)||2));
  return{focus:url.searchParams.get('focus')||'',scope,depth,pathTo:url.searchParams.get('pathTo')||'',compact:url.searchParams.get('compact')==='1'};
}

export function writeTreeState(state,urlLike=globalThis.location?.href||'http://localhost/#tree'){
  const url=new URL(urlLike,'http://localhost/');
  const scope=VALID_SCOPES.has(state.scope)?state.scope:'connected';
  if(state.focus&&scope!=='all')url.searchParams.set('focus',state.focus);else url.searchParams.delete('focus');
  url.searchParams.set('scope',scope);
  if(scope==='family')url.searchParams.set('depth',String(Math.max(1,Math.min(6,Number(state.depth)||2))));else url.searchParams.delete('depth');
  if(state.pathTo)url.searchParams.set('pathTo',state.pathTo);else url.searchParams.delete('pathTo');
  if(state.compact)url.searchParams.set('compact','1');else url.searchParams.delete('compact');
  url.hash='tree';return url;
}

export function storageState(storage=globalThis.localStorage){
  const get=(key,fallback)=>{try{return safeJson(storage?.getItem(key)||'',fallback);}catch{return fallback;}};
  const set=(key,value)=>{try{storage?.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  return{
    collapsed:()=>new Set(get(COLLAPSE_KEY,[])),
    setCollapsed:value=>set(COLLAPSE_KEY,[...value]),
    recent:()=>get(RECENT_KEY,[]),
    remember:id=>{const next=get(RECENT_KEY,[]).filter(value=>value!==id);if(id)next.unshift(id);set(RECENT_KEY,next.slice(0,12));return next.slice(0,12);},
    snapshot:()=>get(TREE_STATE_KEY,{}),
    save:value=>set(TREE_STATE_KEY,value),
  };
}
