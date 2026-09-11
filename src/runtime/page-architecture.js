const RELEASE='15.5';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const familyMinimal=new Set(['dashboard','person','tree']);
const familyBrowse=new Set(['people','media','timeline']);
const researchRoutes=new Set(['evidence','sources','research','archive']);

function classifyRoute(route){
  if(familyMinimal.has(route))return'minimal';
  if(familyBrowse.has(route))return route==='media'?'media-browse':'browse';
  if(researchRoutes.has(route))return'research';
  return document.body.dataset.experience==='research'?'research':'browse';
}

function forwardButton(id,label){
  return`<button type="button" data-v155-forward="${id}">${label}</button>`;
}

function installActionMenus(){
  const original=document.querySelector('.topbar-actions');
  if(!original)return;
  original.classList.add('v155-original-actions');

  const menus=document.querySelector('.v151-nav-menus');
  if(menus&&!menus.querySelector('.v155-desktop-actions')){
    const details=document.createElement('details');
    details.className='v151-nav-menu v155-desktop-actions';
    details.innerHTML=`<summary>Actions</summary><div class="v151-nav-popover v155-actions-popover">${forwardButton('share','Share view')}${forwardButton('export','Export view')}${forwardButton('print','Print')}</div>`;
    menus.append(details);
  }

  const topbar=document.querySelector('.topbar');
  if(topbar&&!topbar.querySelector('.v155-mobile-actions')){
    const details=document.createElement('details');
    details.className='v155-mobile-actions';
    details.innerHTML=`<summary aria-label="Page actions">•••</summary><div class="v155-mobile-actions-menu">${forwardButton('share','Share')}${forwardButton('export','Export')}${forwardButton('print','Print')}</div>`;
    topbar.append(details);
  }
}

function syncLayout(){
  const route=routeKey();
  document.body.dataset.pageArchitecture=RELEASE;
  document.body.dataset.pageLayout=classifyRoute(route);
  const routeShell=document.querySelector('.route-shell');
  if(routeShell)routeShell.dataset.pageLayout=document.body.dataset.pageLayout;
  installActionMenus();
}

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;syncLayout();}));
}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-v155-forward]');
  if(!button)return;
  const target=document.getElementById(button.dataset.v155Forward);
  target?.click();
  button.closest('details')?.removeAttribute('open');
});

window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-auth-ui-refresh',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
