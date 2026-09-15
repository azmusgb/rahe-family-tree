const MOBILE_QUERY='(max-width: 720px)';
let lastTrigger=null;
let observerQueued=false;

const isMobile=()=>window.matchMedia(MOBILE_QUERY).matches;
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';

function moreMenu(){return document.querySelector('#family-mobile-dock .mobile-more');}
function morePanel(details){return details?.querySelector(':scope > div')||null;}

function ensureBackdrop(){
  let backdrop=document.querySelector('.mobile-more-backdrop');
  if(backdrop)return backdrop;
  backdrop=document.createElement('button');
  backdrop.type='button';
  backdrop.className='mobile-more-backdrop';
  backdrop.hidden=true;
  backdrop.setAttribute('aria-label','Close navigation menu');
  document.body.append(backdrop);
  return backdrop;
}

function closeMore({restoreFocus=true}={}){
  const details=moreMenu();
  if(details){
    details.removeAttribute('open');
    details.querySelector('summary')?.setAttribute('aria-expanded','false');
  }
  const backdrop=document.querySelector('.mobile-more-backdrop');
  if(backdrop)backdrop.hidden=true;
  document.body.classList.remove('mobile-sheet-open');
  if(restoreFocus&&lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});
}

function openMore(details){
  if(!isMobile())return;
  lastTrigger=details.querySelector('summary');
  lastTrigger?.setAttribute('aria-expanded','true');
  const backdrop=ensureBackdrop();
  backdrop.hidden=false;
  document.body.classList.add('mobile-sheet-open');
  requestAnimationFrame(()=>details.querySelector('[data-mobile-more-close],a,button')?.focus({preventScroll:true}));
}

function enhanceMoreMenu(){
  const details=moreMenu();
  if(!details)return;
  const summary=details.querySelector('summary');
  const panel=morePanel(details);
  if(!summary||!panel)return;

  details.dataset.keepOpen='true';
  summary.setAttribute('aria-haspopup','dialog');
  summary.setAttribute('aria-expanded',String(details.open));
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','More family navigation');
  if(!panel.querySelector('.mobile-more-head'))panel.insertAdjacentHTML('afterbegin','<div class="mobile-more-head"><strong>More</strong><button type="button" data-mobile-more-close aria-label="Close menu">Close</button></div>');

  if(details.dataset.mobileSheet==='true')return;
  details.dataset.mobileSheet='true';
  details.addEventListener('toggle',()=>details.open?openMore(details):closeMore({restoreFocus:false}));
}

function focusableIn(element){
  return [...element.querySelectorAll('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.getAttribute('aria-hidden')!=='true');
}

function trapSheetFocus(event){
  if(event.key==='Escape'&&document.body.classList.contains('mobile-sheet-open')){event.preventDefault();closeMore();return;}
  if(event.key!=='Tab')return;
  const details=moreMenu();
  if(!details?.open)return;
  const panel=morePanel(details);if(!panel)return;
  const focusable=focusableIn(panel);if(!focusable.length)return;
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}

function compactTreeSurface(){
  const content=document.getElementById('content');
  if(!content||routeKey()!=='tree'||!isMobile())return;
  content.classList.add('mobile-tree-surface');
  const graph=content.querySelector('.graph-shell,.tree-graph-shell');
  graph?.setAttribute('aria-label','Interactive family tree');
}

function apply(){
  enhanceMoreMenu();
  compactTreeSurface();
  if(!isMobile())closeMore({restoreFocus:false});
}

function schedule(){requestAnimationFrame(()=>requestAnimationFrame(apply));}

function observeNavigationShell(){
  const observer=new MutationObserver(()=>{
    if(observerQueued)return;
    observerQueued=true;
    requestAnimationFrame(()=>{observerQueued=false;enhanceMoreMenu();});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

document.addEventListener('click',event=>{
  if(event.target.closest('.mobile-more-backdrop,[data-mobile-more-close]')){event.preventDefault();closeMore();return;}
  if(event.target.closest('#family-mobile-dock .mobile-more a'))closeMore({restoreFocus:false});
});
document.addEventListener('keydown',trapSheetFocus);
window.addEventListener('hashchange',()=>{closeMore({restoreFocus:false});schedule();});
window.addEventListener('resize',apply,{passive:true});
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
observeNavigationShell();
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',apply):apply();
