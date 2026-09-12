const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const mobileQuery=matchMedia('(max-width:720px)');
const isMobileTree=()=>mobileQuery.matches&&document.body.dataset.experience!=='research'&&routeKey()==='tree';

function setCompactText(element,value){
  if(!element)return;
  if(!element.dataset.v1511OriginalText)element.dataset.v1511OriginalText=element.textContent.trim();
  element.textContent=value;
}
function restoreText(element){
  if(element?.dataset.v1511OriginalText){element.textContent=element.dataset.v1511OriginalText;delete element.dataset.v1511OriginalText;}
}
function simplifyTrail(content){
  const trail=content.querySelector('.v1291-breadcrumb');if(!trail)return;
  trail.classList.add('v1511-tree-trail');
  const label=[...trail.children].find(node=>node.tagName==='SPAN');
  if(label)setCompactText(label,'Recent');
}
function simplifyToolbar(content){
  const toolbar=content.querySelector('.graph-toolbar');if(!toolbar)return;
  toolbar.classList.add('v1511-tree-toolbar');
  setCompactText(toolbar.querySelector('[data-center-person]'),'Center');
  setCompactText(toolbar.querySelector('[data-show-all-people]'),'Full tree');
  toolbar.querySelector('.focus-pill')?.classList.add('v1511-tree-focus-pill');
  const status=[...toolbar.children].find(node=>node.tagName==='SPAN'&&!node.classList.contains('focus-pill'));
  if(status){
    if(!status.dataset.v1511OriginalHtml)status.dataset.v1511OriginalHtml=status.innerHTML;
    const match=status.textContent.match(/(\d+)\s+visible/i);
    if(match)status.innerHTML=`<b>${match[1]}</b> people`;
    status.classList.add('v1511-tree-count');
  }
}
function simplifyControls(content){
  const focusbar=content.querySelector('.tree-focusbar');if(!focusbar)return;
  focusbar.classList.add('v1511-tree-controls');
  const label=focusbar.querySelector('label');
  if(label){
    const text=[...label.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
    if(text){if(!label.dataset.v1511OriginalLabel)label.dataset.v1511OriginalLabel=text.textContent;text.textContent='Focus person';}
  }
  focusbar.querySelectorAll('.tree-mode-buttons button').forEach(button=>{
    if(button.textContent.trim()==='All connected')setCompactText(button,'Connected');
    if(button.textContent.trim()==='Full tree')setCompactText(button,'All');
  });
}
function optionsSummaryMarkup(focusbar){
  const select=focusbar?.querySelector('[data-tree-person]');
  const person=select?.selectedOptions?.[0]?.textContent?.trim()||'Family member';
  const scope=focusbar?.querySelector('.tree-mode-buttons button.active')?.textContent?.trim()||'Family';
  const depth=focusbar?.querySelector('.tree-depth button.active')?.textContent?.trim()||'';
  return `<span><small>Tree focus</small><b>${person}</b></span><span class="v1511-tree-options-state">${scope}${depth?` · ${depth}`:''}</span><span aria-hidden="true" class="v1511-tree-options-chevron">⌄</span>`;
}
function composeMobileTree(content){
  const focusbar=content.querySelector('.tree-focusbar'),shell=content.querySelector('.graph-shell');
  if(!focusbar||!shell)return;
  let options=content.querySelector('.v1511-tree-options');
  if(!options){
    options=document.createElement('details');options.className='v1511-tree-options';
    const summary=document.createElement('summary');summary.className='v1511-tree-options-summary';summary.innerHTML=optionsSummaryMarkup(focusbar);options.append(summary);
    focusbar.insertAdjacentElement('beforebegin',options);options.append(focusbar);
  }else{
    const summary=options.querySelector('.v1511-tree-options-summary');if(summary)summary.innerHTML=optionsSummaryMarkup(focusbar);
    if(focusbar.parentElement!==options)options.append(focusbar);
  }
  /* The graph follows the one-line options drawer immediately. Advanced graph/research tools remain available after the canvas. */
  options.insertAdjacentElement('afterend',shell);
  const platform=content.querySelector('[data-platform-v13="tree-engine-2"]');
  if(platform&&platform.previousElementSibling!==shell)shell.insertAdjacentElement('afterend',platform);
  const trail=content.querySelector('.v1291-breadcrumb');if(trail&&trail.parentElement!==options)options.append(trail);
}
function markRedundantMobileBlocks(content){
  content.querySelectorAll(':scope > .notice').forEach(node=>node.classList.add('v1511-tree-intro-notice'));
  for(const selector of['.v154-tree-person','.v129-tree-memory','.v1291-mobile-hint','.v154-tree-help','.legend','.mobile-family-list','.relationship-index'])content.querySelector(selector)?.classList.add('v1511-tree-secondary');
}
function applyMobileTree(){
  const content=document.getElementById('content');
  if(!content)return;
  if(!isMobileTree()){content.classList.remove('v1511-mobile-tree');return;}
  content.classList.add('v1511-mobile-tree');
  markRedundantMobileBlocks(content);simplifyControls(content);simplifyTrail(content);simplifyToolbar(content);composeMobileTree(content);
  content.querySelector('.graph-scroll')?.setAttribute('aria-label','Interactive family tree. Pan across the canvas and tap a person to open their profile.');
}
function restoreDesktopTree(){
  if(mobileQuery.matches)return;
  const content=document.getElementById('content');if(!content)return;
  content.classList.remove('v1511-mobile-tree');
  const options=content.querySelector('.v1511-tree-options');
  if(options){
    const focusbar=options.querySelector('.tree-focusbar'),trail=options.querySelector('.v1291-breadcrumb'),shell=content.querySelector('.graph-shell');
    if(focusbar){options.insertAdjacentElement('beforebegin',focusbar);if(trail)focusbar.insertAdjacentElement('afterend',trail);if(shell)(trail||focusbar).insertAdjacentElement('afterend',shell);}
    options.remove();
  }
  content.querySelectorAll('[data-v1511-original-text]').forEach(restoreText);
  const label=content.querySelector('.tree-focusbar label');
  if(label?.dataset.v1511OriginalLabel){const text=[...label.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);if(text)text.textContent=label.dataset.v1511OriginalLabel;delete label.dataset.v1511OriginalLabel;}
  const status=content.querySelector('.v1511-tree-count');if(status?.dataset.v1511OriginalHtml){status.innerHTML=status.dataset.v1511OriginalHtml;delete status.dataset.v1511OriginalHtml;}
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;applyMobileTree();restoreDesktopTree();}));}
window.addEventListener('family-view-rendered',()=>{schedule();setTimeout(schedule,90);setTimeout(schedule,260);});
window.addEventListener('hashchange',schedule);
window.addEventListener('family-experience-changed',schedule);
mobileQuery.addEventListener?.('change',schedule);
document.addEventListener('change',event=>{if(event.target?.closest?.('.tree-focusbar'))setTimeout(schedule,0);});
document.addEventListener('click',event=>{if(event.target?.closest?.('.tree-mode-buttons,.tree-depth'))setTimeout(schedule,0);});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
