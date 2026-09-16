import{canRunUiCommand,commandLabel,runUiCommand}from'./ui-commands.js';

const RELEASE='15.5';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const familyMinimal=new Set(['dashboard','person','tree']);
const familyBrowse=new Set(['people','media','stories','timeline','migration']);
const researchRoutes=new Set(['evidence','sources','research','archive','intelligence','conflicts','intake','identity']);

function classifyRoute(route){
  if(familyMinimal.has(route))return'minimal';
  if(familyBrowse.has(route))return route==='media'?'media-browse':'browse';
  if(researchRoutes.has(route))return'research';
  return document.body.dataset.experience==='research'?'research':'browse';
}

function commandButton(command,label){
  return`<button type="button" data-ui-command="${command}" data-v155-forward="${command}" ${canRunUiCommand(command)?'':'disabled'}>${label}</button>`;
}
function modeButton(){return`<button type="button" data-ui-command="toggle-experience" data-v155-mode>${commandLabel('toggle-experience')}</button>`;}

function installActionMenus(){
  const original=document.querySelector('.topbar-actions');
  if(!original)return;
  original.classList.add('page-actions-source','v155-original-actions');

  const menus=document.querySelector('.v151-nav-menus');
  if(menus&&!menus.querySelector('.page-actions--desktop')){
    const details=document.createElement('details');
    details.className='nav-menu page-actions page-actions--desktop v155-desktop-actions';
    details.innerHTML=`<summary>Actions</summary><div class="v151-nav-popover page-actions-menu v155-actions-popover">${modeButton()}${commandButton('share','Share view')}${commandButton('export','Export view')}${commandButton('print','Print')}</div>`;
    menus.append(details);
  }

  const topbar=document.querySelector('.topbar');
  if(topbar&&!topbar.querySelector('.page-actions--mobile')){
    const details=document.createElement('details');
    details.className='page-actions page-actions--mobile v155-mobile-actions';
    details.innerHTML=`<summary aria-label="Page actions">•••</summary><div class="page-actions-menu v155-mobile-actions-menu">${modeButton()}${commandButton('share','Share')}${commandButton('export','Export')}${commandButton('print','Print')}</div>`;
    topbar.append(details);
  }
}

function syncCommandActions(){
  document.querySelectorAll('[data-ui-command]').forEach(button=>{
    const command=button.dataset.uiCommand;
    if(command==='toggle-experience')button.textContent=commandLabel(command);
    button.disabled=!canRunUiCommand(command);
  });
}

function syncLayout(){
  const route=routeKey();
  document.body.dataset.pageArchitecture=RELEASE;
  document.body.dataset.pageLayout=classifyRoute(route);
  const routeShell=document.querySelector('.route-shell');
  if(routeShell)routeShell.dataset.pageLayout=document.body.dataset.pageLayout;
  installActionMenus();
  syncCommandActions();
}

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;syncLayout();}));
}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-ui-command]');
  if(!button)return;
  const command=button.dataset.uiCommand;
  if(!runUiCommand(command,{source:button}))return;
  button.closest('details')?.removeAttribute('open');
  schedule();
});

window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-auth-ui-refresh',schedule);
window.addEventListener('family-experience-changed',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
