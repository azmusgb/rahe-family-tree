const MOBILE_QUERY='(max-width: 720px)';
let returnFocus=null;
let focusFrame=0;

const isMobile=()=>window.matchMedia(MOBILE_QUERY).matches;
const moreMenu=()=>document.querySelector('#family-mobile-dock details.mobile-more');
const morePanel=details=>details?.querySelector(':scope > div')||null;

function ensureBackdrop(){
  let backdrop=document.querySelector('.mobile-more-backdrop');
  if(backdrop)return backdrop;
  backdrop=document.createElement('div');
  backdrop.className='mobile-more-backdrop';
  backdrop.hidden=true;
  backdrop.dataset.mobileMoreBackdrop='true';
  backdrop.setAttribute('aria-hidden','true');
  document.body.append(backdrop);
  return backdrop;
}

function isActuallyFocusable(node){
  if(!node?.isConnected||node.hidden||node.getAttribute('aria-hidden')==='true')return false;
  if(node.matches?.(':disabled,[disabled]'))return false;
  return node.getClientRects().length>0;
}

function focusableIn(element){
  return[...element.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')]
    .filter(isActuallyFocusable);
}

function cancelPendingFocus(){
  if(!focusFrame)return;
  cancelAnimationFrame(focusFrame);
  focusFrame=0;
}

function focusMorePanel(details){
  cancelPendingFocus();
  focusFrame=requestAnimationFrame(()=>{
    focusFrame=0;
    if(!details?.open||!isMobile())return;
    const panel=morePanel(details);
    const preferred=panel?.querySelector('[data-mobile-ui-search],[data-mobile-more-close]');
    const target=(isActuallyFocusable(preferred)?preferred:null)||focusableIn(panel||document.body)[0];
    target?.focus({preventScroll:true});
  });
}

function closeMore({restoreFocus=true}={}){
  cancelPendingFocus();
  const details=moreMenu();
  const summary=details?.querySelector(':scope > summary');
  if(details?.open)details.removeAttribute('open');
  summary?.setAttribute('aria-expanded','false');
  const backdrop=document.querySelector('.mobile-more-backdrop');
  if(backdrop)backdrop.hidden=true;
  document.body.classList.remove('mobile-sheet-open');
  delete document.body.dataset.mobileModalOpen;
  if(restoreFocus&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  returnFocus=null;
}

function openMore(details){
  if(!details||!isMobile())return;
  const summary=details.querySelector(':scope > summary');
  const panel=morePanel(details);
  if(!returnFocus)returnFocus=summary||document.activeElement;
  summary?.setAttribute('aria-expanded','true');
  panel?.setAttribute('role','dialog');
  panel?.setAttribute('aria-modal','true');
  document.body.dataset.mobileModalOpen='more';
  document.body.classList.add('mobile-sheet-open');
  ensureBackdrop().hidden=false;
  focusMorePanel(details);
}

function syncMoreState(details=moreMenu()){
  if(!details)return;
  if(!isMobile()){
    closeMore({restoreFocus:false});
    return;
  }
  details.open?openMore(details):closeMore({restoreFocus:false});
}

function trapFocus(event){
  const details=moreMenu();
  if(!details?.open||!isMobile())return;
  if(event.key==='Escape'){
    event.preventDefault();
    closeMore();
    return;
  }
  if(event.key!=='Tab')return;
  const panel=morePanel(details);
  if(!panel)return;
  const focusable=focusableIn(panel);
  if(!focusable.length){event.preventDefault();panel.focus?.();return;}
  const first=focusable[0],last=focusable.at(-1);
  if(!panel.contains(document.activeElement)){
    event.preventDefault();
    (event.shiftKey?last:first).focus();
    return;
  }
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}

function bind(){
  if(document.documentElement.dataset.mobileTransientBindings==='v22')return;
  document.documentElement.dataset.mobileTransientBindings='v22';
  document.addEventListener('toggle',event=>{
    const details=event.target;
    if(details instanceof HTMLDetailsElement&&details.matches('#family-mobile-dock details.mobile-more'))syncMoreState(details);
  },true);
  document.addEventListener('click',event=>{
    if(event.target.closest('.mobile-more-backdrop,[data-mobile-more-close]')){
      event.preventDefault();
      closeMore();
      return;
    }
    if(event.target.closest('#family-mobile-dock details.mobile-more a[href^="#"]'))closeMore({restoreFocus:false});
  },true);
  document.addEventListener('keydown',trapFocus,true);
  window.addEventListener('hashchange',()=>closeMore({restoreFocus:false}));
  window.addEventListener('resize',()=>{if(!isMobile())closeMore({restoreFocus:false});},{passive:true});
}

bind();
