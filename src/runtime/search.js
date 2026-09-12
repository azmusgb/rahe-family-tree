const SEARCH_LIMITS=Object.freeze({people:10,families:8,claims:8,sources:8,tasks:8,sections:8});
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const normalize=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^\x00-\x7F]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const queryTokens=query=>[...new Set(normalize(query).split(/\s+/).filter(Boolean))];
const searchableText=value=>normalize(JSON.stringify(value??{}));
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isMediaRoute=()=>routeKey()==='media';

function editDistance(a,b,limit=2){
  if(a===b)return 0;
  if(Math.abs(a.length-b.length)>limit)return limit+1;
  const prev=Array.from({length:b.length+1},(_,i)=>i),next=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    next[0]=i;let rowMin=next[0];
    for(let j=1;j<=b.length;j++){
      const cost=a[i-1]===b[j-1]?0:1;
      next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+cost);
      rowMin=Math.min(rowMin,next[j]);
    }
    if(rowMin>limit)return limit+1;
    for(let j=0;j<=b.length;j++)prev[j]=next[j];
  }
  return prev[b.length];
}
function tokenMatches(token,textTokens){
  if(textTokens.some(part=>part===token||part.startsWith(token)||token.startsWith(part)&&part.length>=4))return true;
  if(token.length<5)return false;
  const limit=token.length>=9?2:1;
  return textTokens.some(part=>part.length>=4&&editDistance(token,part,limit)<=limit);
}
function matchesQuery(value,query){
  const q=normalize(query);if(!q)return true;
  const text=searchableText(value);if(text.includes(q))return true;
  const tokens=queryTokens(query),textTokens=text.split(/\s+/).filter(Boolean);
  return tokens.length>0&&tokens.every(token=>tokenMatches(token,textTokens));
}
function score(value,query,primary=''){
  const q=normalize(query);if(!q)return 0;
  const text=searchableText(value),main=normalize(primary),tokens=queryTokens(query),mainTokens=main.split(/\s+/).filter(Boolean),textTokens=text.split(/\s+/).filter(Boolean);
  let points=0;
  if(main===q)points+=1000;
  if(main.startsWith(q))points+=500;
  if(main.includes(q))points+=350;
  if(text.includes(q))points+=200;
  for(const token of tokens){
    if(mainTokens.some(part=>part===token))points+=90;
    else if(mainTokens.some(part=>part.startsWith(token)))points+=55;
    else if(main.includes(token))points+=35;
    else if(text.includes(token))points+=15;
    else if(tokenMatches(token,mainTokens))points+=12;
    else if(tokenMatches(token,textTokens))points+=5;
  }
  return points;
}
function stateMatches(value,state){if(!state)return true;return String(value?.state??value?.canonicalTreatment??'').toUpperCase().includes(String(state).toUpperCase());}
function branchMatches(value,branch){if(!branch)return true;const target=normalize(branch),direct=normalize(value?.branch??'');if(direct.includes(target)||target.includes(direct)&&direct.length>2)return true;return searchableText(value).includes(target);}
function ranked(items,query,branch,state,primary,limit,supports={branch:true,state:true}){return(items??[]).filter(item=>matchesQuery(item,query)).filter(item=>!supports.branch||branchMatches(item,branch)).filter(item=>!supports.state||stateMatches(item,state)).map(item=>({item,score:score(item,query,primary(item))})).sort((a,b)=>b.score-a.score||String(primary(a.item)).localeCompare(String(primary(b.item)))).slice(0,limit).map(entry=>entry.item);}
function familyGroups(model){return[...(model?.familyGroups??[]),...(model?.familySupplement?.familyGroups??[])];}
function publicPeople(model){const people=[...(model?.people??[]),...(model?.familySupplement?.people??[])],superseded=model?.familySupplement?.aggregateReplacement?.canonicalPersonId;return superseded?people.filter(person=>person.id!==superseded):people;}

let model=null,corpus=null,loadPromise=null,dismissedQuery='';
async function loadSearchData(){if(model&&corpus)return;if(!loadPromise){loadPromise=Promise.all([fetch('research-model.json',{cache:'no-store'}),fetch('corpus.json',{cache:'no-store'})]).then(async([modelResponse,corpusResponse])=>{if(!modelResponse.ok||!corpusResponse.ok)throw new Error(`Search data unavailable (${modelResponse.status}/${corpusResponse.status})`);[model,corpus]=await Promise.all([modelResponse.json(),corpusResponse.json()]);});}return loadPromise;}
function filters(){return{q:document.querySelector('#search')?.value.trim()??'',branch:document.querySelector('#branch')?.value??'',state:document.querySelector('#state')?.value??''};}
function resultButton(kind,id,title,meta){return`<button class="search-hit human" type="button" data-search-hit data-${kind}="${esc(id)}"><b>${esc(title)}</b><small>${esc(meta)}</small></button>`;}
function resultLink(href,title,meta){return`<a class="search-hit human" data-search-hit href="${esc(href)}"><b>${esc(title)}</b><small>${esc(meta)}</small></a>`;}
function group(label,count,rows){if(!rows.length)return'';return`<section class="search-group"><h3>${esc(label)} <span>${count}</span></h3>${rows.join('')}</section>`;}
function fullCount(items,q,branch,state,supports={branch:true,state:true}){return(items??[]).filter(item=>matchesQuery(item,q)).filter(item=>!supports.branch||branchMatches(item,branch)).filter(item=>!supports.state||stateMatches(item,state)).length;}
function removeOverlay(){document.querySelector('#search-v13-2-results')?.remove();document.querySelector('#search-v13-1-results')?.remove();}
function searchInput(){return document.querySelector('#search');}
function dismissKey(){return searchInput()?.dataset.familySearchDismissed||'';}
function clearDismissal(){const input=searchInput();if(input)delete input.dataset.familySearchDismissed;dismissedQuery='';}

function renderOverlay(){
  const content=document.querySelector('#content');if(!content)return;
  removeOverlay();
  if(isMediaRoute())return;
  if(!model||!corpus)return;
  content.querySelector('.family-search')?.remove();
  const{q,branch,state}=filters(),normalizedQuery=normalize(q);if(!q||normalizedQuery===dismissedQuery||normalizedQuery===dismissKey())return;
  const people=publicPeople(model),families=familyGroups(model),claims=model.claims??[],sources=model.sources??[],tasks=model.researchTasks??[],sections=corpus.sections??[];
  const peopleHits=ranked(people,q,branch,state,person=>person.name??person.id,SEARCH_LIMITS.people),familyHits=ranked(families,q,branch,state,family=>family.label??family.id,SEARCH_LIMITS.families),claimHits=ranked(claims,q,branch,state,claim=>claim.claim??claim.id,SEARCH_LIMITS.claims),sourceHits=ranked(sources,q,branch,state,source=>`${source.id??''} ${source.name??''}`,SEARCH_LIMITS.sources,{branch:true,state:false}),taskHits=ranked(tasks,q,branch,state,task=>task.record??task.id,SEARCH_LIMITS.tasks,{branch:true,state:false}),sectionHits=ranked(sections,q,branch,state,section=>section.title??section.id,SEARCH_LIMITS.sections,{branch:true,state:false});
  const counts={people:fullCount(people,q,branch,state),families:fullCount(families,q,branch,state),claims:fullCount(claims,q,branch,state),sources:fullCount(sources,q,branch,state,{branch:true,state:false}),tasks:fullCount(tasks,q,branch,state,{branch:true,state:false}),sections:fullCount(sections,q,branch,state,{branch:true,state:false})},total=Object.values(counts).reduce((sum,count)=>sum+count,0),activeFilters=[branch?`Branch: ${branch}`:'',state?`Evidence: ${state}`:''].filter(Boolean).join(' · ');
  const html=`<section id="search-v13-2-results" class="search-results family-search elevated-search" aria-label="Search results"><div class="section-title search-summary"><div><p class="eyebrow">SEARCH</p><h2>Results for “${esc(q)}”</h2><small>Word-order independent search with spelling tolerance across people, family groups, evidence, sources, research tasks, and archive text${activeFilters?` · ${esc(activeFilters)}`:''}</small></div><div class="search-summary-count"><b>${total}</b><span>matching records</span><button type="reset" form="filters" class="text-link">Clear all</button></div></div><div class="search-keyboard-hint" aria-hidden="true">↑ ↓ move · Enter open · Esc return to search</div><div class="search-groups">${group('People',counts.people,peopleHits.map(person=>resultButton('person',person.id,person.name??person.id,`${person.branch??'Family'} · ${person.state??''}`)))}${group('Family groups',counts.families,familyHits.map(family=>resultLink('#families',family.label??family.id,`${family.branch??'Family'} · ${(family.childIds??[]).length} child record(s)`)))}${group('Evidence',counts.claims,claimHits.map(claim=>resultButton('claim',claim.id,claim.claim??claim.id,`${claim.id??''} · ${claim.state??''}`)))}${group('Sources',counts.sources,sourceHits.map(source=>resultButton('source',source.id,`${source.id??''} · ${source.name??''}`,`${source.class??'Source'} · ${source.weight??''}`)))}${group('Research tasks',counts.tasks,taskHits.map(task=>resultButton('task',task.id,task.record??task.id,`${task.priority??''} · ${task.branch??''}`)))}${group('Archive',counts.sections,sectionHits.map(section=>resultLink(`#archive/${section.id}`,section.title??section.id,`${section.legacy?'Legacy annex':'Canonical/control'} · ${section.id}`)))}${total===0?'<div class="empty compact"><div class="empty-mark">0</div><div><b>No matching records</b><p>Try fewer words, a spelling variant, or clear the branch/evidence filters.</p></div></div>':''}</div></section>`;
  content.insertAdjacentHTML('afterbegin',html);
  window.dispatchEvent(new CustomEvent('family-search-rendered',{detail:{query:q,total}}));
}
let renderFrame=0;
function scheduleRender(){cancelAnimationFrame(renderFrame);renderFrame=requestAnimationFrame(()=>requestAnimationFrame(renderOverlay));}
function handleFilterEvent(event){
  const q=normalize(searchInput()?.value??'');
  if(event.target?.id==='search'){
    if(event.type==='input'){clearDismissal();}
    else if(q!==dismissedQuery&&q!==dismissKey())clearDismissal();
  }else clearDismissal();
  scheduleRender();
}
async function init(){try{await loadSearchData();scheduleRender();}catch(error){console.error('Enhanced search failed to initialize:',error);}}
const filtersForm=document.querySelector('#filters');
filtersForm?.addEventListener('input',handleFilterEvent);filtersForm?.addEventListener('change',handleFilterEvent);filtersForm?.addEventListener('reset',()=>{clearDismissal();setTimeout(scheduleRender,0);});window.addEventListener('hashchange',()=>{clearDismissal();scheduleRender();});window.addEventListener('popstate',()=>{clearDismissal();scheduleRender();});
window.addEventListener('family-search-dismissed',event=>{const key=normalize(event.detail?.query??searchInput()?.value??'');dismissedQuery=key;const input=searchInput();if(input)input.dataset.familySearchDismissed=key;removeOverlay();});
window.addEventListener('family-search-reopen',()=>{clearDismissal();scheduleRender();});
document.addEventListener('keydown',event=>{
  const target=event.target,typing=target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLSelectElement||target?.isContentEditable;
  if(event.key==='/'&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!typing){event.preventDefault();searchInput()?.focus();return;}
  const hits=[...document.querySelectorAll('#search-v13-2-results [data-search-hit]')],active=document.activeElement,index=hits.indexOf(active);
  if(active?.id==='search'&&event.key==='ArrowDown'&&hits.length){event.preventDefault();hits[0].focus();return;}
  if(index>=0&&(event.key==='ArrowDown'||event.key==='ArrowUp')){event.preventDefault();const delta=event.key==='ArrowDown'?1:-1;hits[(index+delta+hits.length)%hits.length].focus();return;}
  if(index>=0&&event.key==='Escape'){event.preventDefault();searchInput()?.focus();return;}
  if(event.key==='Escape'&&active?.id==='search'){if(active.value){active.value='';active.dispatchEvent(new Event('input',{bubbles:true}));}return;}
});
init();
