export function compactMode(state,{width=globalThis.innerWidth||1024,reducedMotion=false}={}){
  if(typeof state?.compact==='boolean')return state.compact;
  return Boolean(width<=760||reducedMotion&&width<=900);
}

export function compactLabel(enabled){return enabled?'Comfort view':'Compact view';}

export function applyCompactMode(enabled,root=globalThis.document?.body){
  root?.classList?.toggle('tree-compact',Boolean(enabled));
  if(root?.dataset)root.dataset.treeCompact=enabled?'true':'false';
  return Boolean(enabled);
}
