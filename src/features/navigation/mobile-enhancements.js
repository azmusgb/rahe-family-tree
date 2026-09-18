import {contextualDestinations} from'./model.js';

const MOBILE_QUERY='(max-width: 720px)';
let scheduled=false;

const isMobile=()=>window.matchMedia(MOBILE_QUERY).matches;
const routeKey=()=>location.hash.slice(1).split('/')[0]||document.body.dataset.route||'dashboard';

function syncContextualMore(){
  const panel=document.querySelector('#family-mobile-dock details.mobile-more > div');
  if(!panel)return;
  const existing=panel.querySelector('[data-v22-context-actions]');
  if(!isMobile()){
    existing?.remove();
    return;
  }
  const route=routeKey();
  const configured=contextualDestinations(route);
  const baseHrefs=new Set(
    [...panel.querySelectorAll('a[href^="#"]')]
      .filter(link=>!link.hasAttribute('data-v22-context-destination'))
      .map(link=>link.getAttribute('href'))
      .filter(Boolean)
  );
  const items=configured.filter(([,href])=>!baseHrefs.has(href));
  if(!items.length){
    existing?.remove();
    return;
  }
  let section=existing;
  if(!section){
    section=document.createElement('section');
    section.className='v21-more-research v22-context-actions';
    section.dataset.v22ContextActions='true';
    section.innerHTML='<span>CURRENT CONTEXT</span><div></div>';
  }
  if(panel.lastElementChild!==section)panel.append(section);
  const list=section.querySelector('div');
  const signature=`${route}:${items.map(([label,href])=>`${label}:${href}`).join('|')}`;
  if(section.dataset.v22Signature===signature)return;
  list.replaceChildren(...items.map(([label,href])=>{
    const link=document.createElement('a');
    link.href=href;
    link.textContent=label;
    link.dataset.v22ContextDestination='true';
    return link;
  }));
  section.dataset.v22Signature=signature;
}

function syncPersonNavigation(){
  const root=document.querySelector('[data-v17-native="person"]');
  if(!root)return;
  const legacy=root.querySelector('.v17-person-nav');
  const tabs=root.querySelector('.v20-person-tabs');
  if(!isMobile()||routeKey()!=='person'){
    if(legacy?.dataset.v22Suppressed==='true'){
      legacy.hidden=false;
      if(legacy.dataset.v22PriorAriaHidden)legacy.setAttribute('aria-hidden',legacy.dataset.v22PriorAriaHidden);
      else legacy.removeAttribute('aria-hidden');
      delete legacy.dataset.v22PriorAriaHidden;
      delete legacy.dataset.v22Suppressed;
    }
    if(tabs)delete tabs.dataset.v22PrimaryPersonNav;
    return;
  }
  if(!tabs||!legacy)return;
  if(legacy.dataset.v22Suppressed!=='true'){
    const prior=legacy.getAttribute('aria-hidden');
    if(prior!==null)legacy.dataset.v22PriorAriaHidden=prior;
    legacy.removeAttribute('aria-hidden');
    legacy.hidden=true;
    legacy.dataset.v22Suppressed='true';
  }
  tabs.dataset.v22PrimaryPersonNav='true';
  tabs.setAttribute('aria-label','Person sections');
}

function setTreeFocus(enabled,{moveFocus=true}={}){
  const content=document.getElementById('content');
  if(!content)return;
  const bar=content.querySelector('.v21-tree-mode-bar');
  const button=bar?.querySelector('[data-v22-tree-focus]');
  const graph=content.querySelector('.graph-shell,.tree-graph-shell');
  const focusables=['.family-graph-summary','.tree-context','.family-graph-tools','.v161-tree-toolbar'];

  if(enabled&&isMobile()&&routeKey()==='tree'){
    content.dataset.v22TreeFocus='true';
    document.body.dataset.v22TreeFocus='true';
    for(const selector of focusables){
      content.querySelectorAll(selector).forEach(node=>{
        if(node===bar||node.contains(bar))return;
        if(!node.hidden){node.hidden=true;node.dataset.v22FocusHidden='true';}
      });
    }
    if(button){button.setAttribute('aria-pressed','true');button.textContent='Exit focus';}
    if(moveFocus)requestAnimationFrame(()=>graph?.focus({preventScroll:true}));
    return;
  }

  delete content.dataset.v22TreeFocus;
  delete document.body.dataset.v22TreeFocus;
  content.querySelectorAll('[data-v22-focus-hidden="true"]').forEach(node=>{node.hidden=false;delete node.dataset.v22FocusHidden;});
  if(button){button.setAttribute('aria-pressed','false');button.textContent='Focus';}
}

function syncTreeFocusControl(){
  const content=document.getElementById('content');
  if(!content)return;
  if(!isMobile()||routeKey()!=='tree'){
    setTreeFocus(false,{moveFocus:false});
    return;
  }
  const bar=content.querySelector('.v21-tree-mode-bar');
  const actions=bar?.querySelector(':scope > div:last-child');
  if(!bar||!actions)return;
  let button=actions.querySelector('[data-v22-tree-focus]');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.dataset.v22TreeFocus='true';
    button.textContent='Focus';
    button.setAttribute('aria-label','Toggle focused family tree canvas');
    button.setAttribute('aria-pressed','false');
    actions.prepend(button);
  }
  const active=content.dataset.v22TreeFocus==='true';
  button.setAttribute('aria-pressed',String(active));
  button.textContent=active?'Exit focus':'Focus';
}

function bind(){
  if(document.documentElement.dataset.v22Phase7Bindings==='true')return;
  document.documentElement.dataset.v22Phase7Bindings='true';
  document.addEventListener('click',event=>{
    const focus=event.target.closest('[data-v22-tree-focus]');
    if(focus&&isMobile()&&routeKey()==='tree'){
      event.preventDefault();
      const content=document.getElementById('content');
      setTreeFocus(content?.dataset.v22TreeFocus!=='true');
    }
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||document.body.dataset.v22TreeFocus!=='true')return;
    event.preventDefault();
    setTreeFocus(false);
    document.querySelector('button[data-v22-tree-focus]')?.focus({preventScroll:true});
  },true);
}

function apply(){
  const route=routeKey();
  syncContextualMore();
  if(route==='person')syncPersonNavigation();
  if(route==='tree')syncTreeFocusControl();
  else if(document.body.dataset.v22TreeFocus==='true')setTreeFocus(false,{moveFocus:false});
  bind();
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;apply();});
}

window.addEventListener('hashchange',schedule);
window.addEventListener('popstate',schedule);
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('family-route-committed',schedule);
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',apply,{once:true}):apply();