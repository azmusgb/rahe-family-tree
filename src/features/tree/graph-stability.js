// Stabilize the Family Graph command bar across presentation-only tree rerenders.
// This module never changes genealogy, evidence, relationship, source, or privacy data.
// It prevents freshly re-emitted advanced controls from forcing the navigation shell
// to replace an otherwise-current command bar while a user is trying to interact.

const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const stateSignature=()=>{
  const url=new URL(location.href);
  return[
    route(),
    url.searchParams.get('focus')||'',
    url.searchParams.get('scope')||'connected',
    url.searchParams.get('depth')||'',
    url.searchParams.get('pathTo')||''
  ].join('|');
};

let lastStateSignature=stateSignature();

function consolidateFreshTreeControls(){
  if(route()!=='tree')return false;
  const commandbar=document.querySelector('.family-graph-commandbar');
  const slot=commandbar?.querySelector('[data-family-graph-tools-slot]');
  const advanced=document.querySelector('.tree-advanced-nav');
  if(!commandbar||!slot)return false;

  let moved=false;
  const primary=advanced?.querySelector(':scope > .tree-advanced-primary');
  const recent=advanced?.querySelector(':scope > .tree-recent-trail');
  if(primary){slot.append(primary);moved=true;}
  if(recent){slot.append(recent);moved=true;}

  const exportTools=document.querySelector('.graph-toolbar [data-tree-advanced-export]');
  if(exportTools&&!slot.contains(exportTools)){slot.append(exportTools);moved=true;}
  return moved;
}

function prepareStateRefresh(){
  const next=stateSignature();
  if(next===lastStateSignature)return;
  lastStateSignature=next;
  // A genuine URL-backed tree-state change should get a freshly composed command bar.
  // Remove it synchronously so family-graph-navigation can rebuild once on its queued frame.
  document.querySelector('.family-graph-commandbar')?.remove();
}

function stabilizePresentationRefresh(){
  lastStateSignature=stateSignature();
  // family-graph-navigation schedules its reconcile two animation frames later.
  // Moving newly emitted source controls now makes that reconcile idempotent instead
  // of replacing the command bar (and its click target) on every presentation refresh.
  consolidateFreshTreeControls();
}

// tree-advanced can emit a fresh source control set from its own animation-frame
// reconciliation (including resize/media-driven refreshes) without first emitting a
// Family render event. Observe only DOM additions and immediately adopt those controls
// into the current command bar before family-graph-navigation's later two-frame pass.
// Moving a control into the slot creates one more mutation, but the next callback is a
// no-op because the source no longer contains direct primary/recent children.
const controlObserver=new MutationObserver(()=>{
  if(route()!=='tree')return;
  const advanced=document.querySelector('.tree-advanced-nav');
  if(!advanced)return;
  if(advanced.querySelector(':scope > .tree-advanced-primary,:scope > .tree-recent-trail'))consolidateFreshTreeControls();
});
function observeTreeControls(){
  const root=document.getElementById('content')||document.body;
  controlObserver.disconnect();
  controlObserver.observe(root,{childList:true,subtree:true});
  consolidateFreshTreeControls();
}

window.addEventListener('hashchange',prepareStateRefresh);
window.addEventListener('popstate',prepareStateRefresh);
window.addEventListener('family-view-rendered',stabilizePresentationRefresh);
window.addEventListener('family-native-rendered',stabilizePresentationRefresh);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',observeTreeControls):observeTreeControls();
