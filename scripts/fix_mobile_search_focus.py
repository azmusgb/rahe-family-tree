from pathlib import Path

path = Path('src/runtime/mobile-ui-shell.js')
text = path.read_text(encoding='utf-8')
old = """function shouldFocusPending(){
  try{
    const value=sessionStorage.getItem(PENDING_FOCUS_KEY)==='1';
    if(value)sessionStorage.removeItem(PENDING_FOCUS_KEY);
    return value;
  }catch{return false;}
}
"""
new = """function hasPendingFocus(){
  try{return sessionStorage.getItem(PENDING_FOCUS_KEY)==='1';}catch{return false;}
}
function clearPendingFocus(){try{sessionStorage.removeItem(PENDING_FOCUS_KEY);}catch{}}
function focusPendingPeopleSearch(){
  if(!hasPendingFocus())return;
  const selector='[data-v17-native=\"people\"] .v21-mobile-search[data-v21-mobile-search=\"people\"] input';
  const tryFocus=(attempt=0)=>{
    if(!hasPendingFocus())return;
    const input=document.querySelector(selector);
    if(routeKey()!=='people'||!isMobile()||!input?.isConnected){
      if(attempt<20)setTimeout(()=>tryFocus(attempt+1),60);
      return;
    }
    input.focus({preventScroll:false});
    setTimeout(()=>{
      if(!hasPendingFocus())return;
      const live=document.querySelector(selector);
      if(live===input&&document.activeElement===input){
        clearPendingFocus();
        return;
      }
      if(attempt<20)tryFocus(attempt+1);
    },80);
  };
  requestAnimationFrame(()=>requestAnimationFrame(()=>tryFocus()));
}
"""
if old not in text:
    raise SystemExit('Expected pending-focus implementation not found')
text = text.replace(old, new)
old_call = "  if(shouldFocusPending())requestAnimationFrame(()=>search.querySelector('input')?.focus({preventScroll:false}));"
if old_call not in text:
    raise SystemExit('Expected pending-focus call not found')
text = text.replace(old_call, '  focusPendingPeopleSearch();')
path.write_text(text, encoding='utf-8')
