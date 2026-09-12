const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamilyHome=()=>document.body.dataset.experience!=='research'&&routeKey()==='dashboard';
const isFamilyContext=()=>document.body.dataset.v158Context==='family';
let familySearchTab='all',lastFamilyQuery='';

function mergeHomeLead(content){
  const hero=content.querySelector('.v157-hero'),tree=content.querySelector('.v157-tree-preview');
  if(!hero||!tree||content.querySelector('.v1511-home-lead'))return;
  const lead=document.createElement('section');lead.className='v1511-home-lead';
  hero.insertAdjacentElement('beforebegin',lead);lead.append(hero,tree);
}
function simplifyHero(content){
  const hero=content.querySelector('.v157-hero');if(!hero)return;
  const intro=hero.querySelector('.dashboard-hero-copy>p:not(.eyebrow)');if(intro)intro.textContent='Meet the people, follow the branches, and see how the Rahe family connects.';
  const actions=[...hero.querySelectorAll('.dashboard-hero-actions .action')];if(actions[0])actions[0].textContent='Explore tree';if(actions[1])actions[1].textContent='Find a person';if(actions[2])actions[2].hidden=true;
  const snapshot=hero.querySelector('.dashboard-hero-card');if(snapshot)snapshot.hidden=true;
}
function simplifyTree(content){
  const tree=content.querySelector('.v157-tree-preview');if(!tree)return;tree.classList.add('v1511-tree-preview');
  const heading=tree.querySelector('.v157-tree-heading h2');if(heading)heading.textContent='Your connected family';
  const eyebrow=tree.querySelector('.v157-tree-heading .eyebrow');if(eyebrow)eyebrow.textContent='FAMILY TREE';
}
function simplifyFeatured(content){
  const section=[...content.querySelectorAll('.dashboard-section')].find(s=>/FEATURED PEOPLE/i.test(s.querySelector('.eyebrow')?.textContent||''));if(!section)return;section.classList.add('v1511-featured');
  const heading=section.querySelector('h2');if(heading)heading.textContent='People to start with';
}
function simplifyResearch(content){
  const center=content.querySelector('.v157-research-center');if(!center)return;center.classList.add('v1511-research-center');
  const heading=center.querySelector('h2');if(heading)heading.textContent='Research Center';
  const paragraph=center.querySelector('p:not(.eyebrow)');if(paragraph)paragraph.textContent='Sources, unresolved questions, and evidence work stay in one dedicated workspace.';
  const action=center.querySelector('.action');if(action)action.textContent='Open Research Center';
}
function groupKind(group,index){
  const label=group.querySelector('h3')?.childNodes?.[0]?.textContent?.trim().toLowerCase()||'';
  if(label.startsWith('people'))return'people';
  if(label.startsWith('family'))return'families';
  return index===0?'people':index===1?'families':'other';
}
function initials(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return'?';
  return `${parts[0][0]||''}${parts.length>1?parts.at(-1)[0]||'':''}`.toUpperCase();
}
function polishSearchHit(hit,kind){
  if(hit.dataset.v1511Polished==='true')return;
  const title=hit.querySelector('b'),meta=hit.querySelector('small');if(!title)return;
  const marker=document.createElement('span');marker.className=`family-search-marker ${kind}`;marker.setAttribute('aria-hidden','true');marker.textContent=kind==='people'?initials(title.textContent):'FG';
  const copy=document.createElement('span');copy.className='family-search-hit-copy';copy.append(title);if(meta)copy.append(meta);
  const arrow=document.createElement('span');arrow.className='family-search-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='›';
  hit.replaceChildren(marker,copy,arrow);hit.dataset.v1511Polished='true';
}
function applySearchTab(overlay){
  const available=new Map([...overlay.querySelectorAll('.search-group')].map(group=>[group.dataset.v1511SearchKind,group]));
  if(familySearchTab!=='all'&&!available.has(familySearchTab))familySearchTab='all';
  overlay.dataset.v1511SearchTab=familySearchTab;
  available.forEach((group,kind)=>{group.hidden=familySearchTab!=='all'&&familySearchTab!==kind;});
  overlay.querySelectorAll('[data-v1511-search-tab]').forEach(button=>{
    const active=button.dataset.v1511SearchTab===familySearchTab;
    button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));
  });
}
function removeSearchScrim(){document.querySelector('[data-family-search-scrim]')?.remove();}
function ensureSearchPortal(overlay){
  if(overlay.parentElement!==document.body)document.body.append(overlay);
  let scrim=document.querySelector('[data-family-search-scrim]');
  if(!scrim){scrim=document.createElement('button');scrim.type='button';scrim.className='family-search-scrim';scrim.dataset.familySearchScrim='';scrim.setAttribute('aria-label','Close family search');document.body.insertBefore(scrim,overlay);}
}
function closeFamilySearch({clearQuery=false,restoreFocus=true}={}){
  document.querySelector('#search-v13-2-results')?.remove();removeSearchScrim();
  const input=document.getElementById('search');
  if(input){if(clearQuery)input.value='';input.blur();}
  if(clearQuery){familySearchTab='all';lastFamilyQuery='';}
  if(restoreFocus)document.getElementById('main')?.focus({preventScroll:true});
}
function ensureCloseButton(overlay){
  const nested=[...overlay.querySelectorAll('[data-family-search-close]')].filter(node=>node.parentElement!==overlay);nested.forEach(node=>node.remove());
  let close=[...overlay.children].find(node=>node.matches?.('[data-family-search-close]'));
  if(close)return close;
  close=document.createElement('button');close.className='family-search-close';close.type='button';close.dataset.familySearchClose='';close.setAttribute('aria-label','Close search results');close.textContent='×';overlay.append(close);return close;
}
function ensureSearchTabs(overlay,counts){
  let tabs=overlay.querySelector('.family-search-tabs');
  if(!tabs){tabs=document.createElement('div');tabs.className='family-search-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Filter family search results');overlay.querySelector('.search-summary')?.insertAdjacentElement('afterend',tabs);}
  const definitions=[['all','All',counts.total],['people','People',counts.people],['families','Families',counts.families]];
  for(const [key,label,count] of definitions){
    let button=tabs.querySelector(`[data-v1511-search-tab="${key}"]`);
    if(!button){button=document.createElement('button');button.type='button';button.dataset.v1511SearchTab=key;button.setAttribute('role','tab');button.innerHTML=`<span>${label}</span><b></b>`;tabs.append(button);}
    const badge=button.querySelector('b');if(badge)badge.textContent=String(count);button.disabled=key!=='all'&&count===0;
  }
  return tabs;
}
function ensureSearchFooter(overlay){
  if(overlay.querySelector('.family-search-footer'))return;
  const footer=document.createElement('div');footer.className='family-search-footer';
  const copy=document.createElement('span');copy.textContent='Looking for documents, sources, or evidence?';
  const link=document.createElement('a');link.href='#research';link.textContent='Search Research Center';footer.append(copy,link);overlay.append(footer);
}
function labelSearchOverlay(){
  const overlay=document.getElementById('search-v13-2-results');
  if(!overlay){removeSearchScrim();return;}
  overlay.classList.add('v1511-search-sheet','family-search-command');if(!isFamilyContext()){removeSearchScrim();return;}
  ensureSearchPortal(overlay);overlay.setAttribute('aria-label','Family search results');
  const allGroups=[...overlay.querySelectorAll('.search-group')];
  allGroups.forEach((group,index)=>group.dataset.v1511SearchKind=groupKind(group,index));
  allGroups.filter(group=>!['people','families'].includes(group.dataset.v1511SearchKind)).forEach(group=>group.remove());
  const groups=[...overlay.querySelectorAll('.search-group')];
  groups.forEach(group=>group.querySelectorAll('.search-hit').forEach(hit=>polishSearchHit(hit,group.dataset.v1511SearchKind)));
  const countFor=kind=>Number(groups.find(group=>group.dataset.v1511SearchKind===kind)?.querySelector('h3 span')?.textContent)||0;
  const counts={people:countFor('people'),families:countFor('families')};counts.total=counts.people+counts.families;
  const query=document.getElementById('search')?.value.trim()||'';
  if(query!==lastFamilyQuery){familySearchTab='all';lastFamilyQuery=query;}
  const summary=overlay.querySelector('.search-summary');
  if(summary){
    summary.classList.add('family-search-summary');
    const eyebrow=summary.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='FAMILY SEARCH';
    const heading=summary.querySelector('h2');if(heading)heading.textContent=`${counts.total} ${counts.total===1?'match':'matches'} for “${query}”`;
    const detail=summary.querySelector('small');if(detail)detail.textContent='People and family groups, ranked by the closest family match.';
    const side=summary.querySelector('.search-summary-count');if(side){side.replaceChildren();side.hidden=true;}
  }
  overlay.querySelector('.search-keyboard-hint')?.remove();
  ensureSearchTabs(overlay,counts);ensureSearchFooter(overlay);ensureCloseButton(overlay);applySearchTab(overlay);overlay.dataset.familySearchDecorated='true';
}
function apply(){
  labelSearchOverlay();if(!isFamilyHome())return;
  const content=document.querySelector('#content');if(!content)return;content.classList.add('v1511-home');
  simplifyHero(content);simplifyTree(content);mergeHomeLead(content);simplifyFeatured(content);simplifyResearch(content);
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}
function scheduleSearchPolish(){schedule();setTimeout(schedule,60);setTimeout(schedule,400);}
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',()=>{if(document.getElementById('search-v13-2-results'))closeFamilySearch({clearQuery:true,restoreFocus:false});schedule();});
window.addEventListener('family-experience-changed',()=>{if(document.getElementById('search-v13-2-results'))closeFamilySearch({clearQuery:true,restoreFocus:false});schedule();});
document.addEventListener('input',event=>{if(event.target?.closest?.('#filters'))scheduleSearchPolish();});document.addEventListener('change',event=>{if(event.target?.closest?.('#filters'))scheduleSearchPolish();});document.getElementById('filters')?.addEventListener('reset',()=>setTimeout(scheduleSearchPolish,0));
document.addEventListener('click',event=>{
  const tab=event.target.closest?.('[data-v1511-search-tab]');if(tab){familySearchTab=tab.dataset.v1511SearchTab||'all';const overlay=tab.closest('#search-v13-2-results');if(overlay)applySearchTab(overlay);return;}
  if(event.target.closest?.('[data-family-search-close],[data-family-search-scrim]')){event.preventDefault();closeFamilySearch();return;}
  const result=event.target.closest?.('#search-v13-2-results .search-hit,#search-v13-2-results .family-search-footer a');if(result){closeFamilySearch({clearQuery:true,restoreFocus:false});return;}
});
document.addEventListener('focusin',event=>{const input=event.target;if(input?.id==='search'&&isFamilyContext()&&input.value.trim()&&!document.getElementById('search-v13-2-results'))input.dispatchEvent(new Event('input',{bubbles:true}));});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&isFamilyContext()&&document.getElementById('search-v13-2-results')){event.preventDefault();event.stopImmediatePropagation();closeFamilySearch();}},true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
