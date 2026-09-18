import{personById,model,esc,allPedigreeRelationships}from'../../../core.js';
import{relationSets}from'../../../family-experience.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const routeId=()=>location.hash.slice(1).split('/')[1]||'';
const isFamilyMode=()=>document.body.dataset.experience!=='research';
const initials=name=>String(name||'?').replace(/\/.*/,'').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();
const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
const uniqueById=items=>[...new Map(items.filter(Boolean).map(item=>[item.id,item])).values()];

function countPersonEvents(id){return(model.events||[]).filter(event=>(event.peopleIds||[]).includes(id)).length;}
function countPersonSources(id){
  const claims=(model.claims||[]).filter(claim=>(claim.peopleIds||[]).includes(id));
  const rels=allPedigreeRelationships().filter(rel=>rel.from===id||rel.to===id);
  const ids=new Set([...claims.flatMap(claim=>claim.sourceIds||[]),...rels.flatMap(rel=>rel.sourceIds||[])]);
  return ids.size;
}
function profileRelationCard(label,items){
  return`<section class="ui-relation-group"><div class="ui-relation-title"><span>${esc(label)}</span><b>${items.length}</b></div><div class="ui-relation-people">${items.length?items.slice(0,5).map(person=>`<button type="button" data-person="${esc(person.id)}" class="ui-relation-person"><span class="ui-mini-avatar" aria-hidden="true">${esc(initials(person.name))}</span><span><b>${esc(person.name)}</b><small>${esc(person.dates||cleanBranch(person.branch))}</small></span></button>`).join(''):'<span class="ui-none">No structured relationship in the current model</span>'}</div></section>`;
}
function installProfileStory(content,person,relations){
  if(content.querySelector('.ui-life-story'))return;
  const timeline=content.querySelector('[id$="-timeline"]');
  const overview=content.querySelector('.family-overview-card');
  if(!overview)return;
  const eventCount=countPersonEvents(person.id),sourceCount=countPersonSources(person.id);
  const familyCount=uniqueById([...relations.parents,...relations.spouses,...relations.children,...relations.siblings]).length;
  const story=document.createElement('section');
  story.className='ui-life-story';
  story.innerHTML=`<div class="ui-profile-section-heading"><div><p class="eyebrow">LIFE & FAMILY</p><h2>Family record at a glance</h2></div><button type="button" class="text-link" data-focus-tree="${esc(person.id)}" data-scope="family">View in tree ↗</button></div><div class="ui-story-grid"><article class="ui-story-lead"><span class="ui-story-avatar" aria-hidden="true">${esc(initials(person.name))}</span><div><h3>${esc(person.name)}</h3><p>${esc(person.role||'Family member')}</p><small>${esc(person.dates||'Dates protected or not recorded in the public family view')}</small></div></article><article><b>${familyCount}</b><span>structured close-family connections</span></article><article><b>${eventCount}</b><span>timeline records linked to this person</span></article><article><b>${sourceCount}</b><span>registered sources linked through this person’s claims and relationships</span></article></div></section>`;
  if(timeline)timeline.insertAdjacentElement('beforebegin',story);else overview.insertAdjacentElement('afterend',story);
}
function installProfileFamilyNetwork(content,person,relations){
  let network=content.querySelector('.ui-family-network');
  if(network)return;
  network=document.createElement('section');network.className='ui-family-network';
  network.innerHTML=`<div class="ui-profile-section-heading"><div><p class="eyebrow">IMMEDIATE FAMILY</p><h2>Family connections</h2></div><button type="button" class="text-link" data-focus-tree="${esc(person.id)}" data-scope="family">Open family view in tree ↗</button></div><div class="ui-relation-grid">${profileRelationCard('Parents',relations.parents)}${profileRelationCard('Spouse',relations.spouses)}${profileRelationCard('Children',relations.children)}${profileRelationCard('Siblings',relations.siblings)}</div>`;
  const overview=content.querySelector('.family-overview-card');
  overview?.insertAdjacentElement('afterend',network);
}
function installProfileNavigation(content,person){
  let nav=content.querySelector('.ui-profile-nav');if(nav)return;
  nav=document.createElement('nav');nav.className='ui-profile-nav';nav.setAttribute('aria-label','Profile sections');
  const id=person.id;
  nav.innerHTML=`<button type="button" data-scroll="person-${esc(id)}-relationships">Family</button><button type="button" data-scroll="person-${esc(id)}-timeline">Timeline</button><a href="#media">Media</a><button type="button" data-scroll="person-${esc(id)}-facts">Record</button><button type="button" data-scroll="person-${esc(id)}-sources">Sources</button><button type="button" data-scroll="person-${esc(id)}-research">Research</button>`;
  const old=content.querySelector('.local-nav');
  if(old){old.hidden=true;old.insertAdjacentElement('afterend',nav);}else content.querySelector('.family-overview-card')?.insertAdjacentElement('afterend',nav);
}
function polishProfile(){
  if(!isFamilyMode()||routeKey()!=='person')return;
  const content=document.querySelector('#content'),person=personById(routeId());if(!content||!person)return;
  content.classList.add('ui-profile');
  const overview=content.querySelector('.family-overview-card');
  if(overview){
    overview.classList.add('ui-profile-overview');
    const headline=overview.querySelector('.profile-headline');
    if(headline&&!headline.querySelector('.ui-profile-identity')){
      const identity=document.createElement('div');identity.className='ui-profile-identity';identity.innerHTML=`<span>${esc(cleanBranch(person.branch))}</span><span>${person.living?'Living details protected':'Historical family record'}</span>`;headline.append(identity);
    }
    const actions=overview.querySelector('.profile-actions');
    if(actions&&!actions.querySelector('.v153-media-action')){const link=document.createElement('a');link.href='#media';link.className='action v153-media-action';link.textContent='Browse media';actions.append(link);}
    const legacyGrid=overview.querySelector('.profile-family-grid');if(legacyGrid)legacyGrid.hidden=true;
  }
  const relations=relationSets(person.id);
  installProfileNavigation(content,person);
  installProfileFamilyNetwork(content,person,relations);
  installProfileStory(content,person,relations);
  content.querySelectorAll('.research-detail-section').forEach(section=>section.classList.add('ui-research-detail'));
  const hero=content.querySelector('.person-source-summary');if(hero)hero.classList.add('ui-source-record');
}

function focalPerson(){const select=document.querySelector('[data-tree-person]');return personById(select?.value||'')||null;}
function treeRelationSummary(relations){return[['Parents',relations.parents],['Spouse',relations.spouses],['Children',relations.children]].map(([label,items])=>`<span><b>${items.length}</b><small>${label}</small></span>`).join('');}
function installTreeOverview(){
  if(!isFamilyMode()||routeKey()!=='tree')return;
  const content=document.querySelector('#content'),focusbar=content?.querySelector('.tree-focusbar'),person=focalPerson();if(!content||!focusbar||!person)return;
  content.classList.add('ui-tree-primary');
  let panel=content.querySelector('.ui-tree-person-node');
  if(!panel){panel=document.createElement('section');panel.className='tree-person-summary ui-tree-person-node';focusbar.insertAdjacentElement('beforebegin',panel);}
  const rel=relationSets(person.id);
  panel.innerHTML=`<div class="tree-person-summary-main ui-tree-person-node-main"><span class="tree-person-avatar ui-tree-primary-avatar" aria-hidden="true">${esc(initials(person.name))}</span><div><p class="eyebrow">FOCAL PERSON</p><h2>${esc(person.name)}</h2><p>${esc(person.dates||cleanBranch(person.branch))}</p></div></div><div class="tree-person-relations ui-tree-primary-relations">${treeRelationSummary(rel)}</div><div class="tree-person-actions ui-tree-actions"><a class="action primary" href="#person/${esc(person.id)}">Open profile</a><button type="button" class="action" data-tree-scope="ancestors">Ancestors</button><button type="button" class="action" data-tree-scope="descendants">Descendants</button></div>`;
  focusbar.classList.add('tree-controls','ui-tree-controls');
  const shell=content.querySelector('.graph-shell');if(shell)shell.classList.add('tree-graph-shell','ui-graph-shell');
  const scroll=content.querySelector('.graph-scroll');if(scroll){scroll.setAttribute('aria-label','Interactive family tree. Select a person to open their profile.');if(!content.querySelector('.ui-tree-help')){const help=document.createElement('p');help.className='tree-help ui-tree-help';help.textContent='Drag or scroll across generations. Tap a person to open their profile. Use the controls above to switch between family, ancestor, descendant, direct-line, and full-tree views.';scroll.insertAdjacentElement('beforebegin',help);}}
}

function polishHome(){
  if(!isFamilyMode()||routeKey()!=='dashboard')return;
  const content=document.querySelector('#content');if(!content)return;
  content.classList.add('ui-home-shell');
  const hero=content.querySelector('.dashboard-hero');
  if(hero){
    const title=hero.querySelector('h2');setText(title,'Discover the people, places, and stories that connect the Rahe family.');
    const intro=hero.querySelector('.dashboard-hero-copy>p:not(.eyebrow)');setText(intro,'Start with the family tree, meet the people in the archive, or explore photographs and records. Research details remain available when you want to go deeper.');
    hero.classList.add('ui-home-editorial-hero');
  }
  const paths=content.querySelector('.dashboard-paths');if(paths)paths.classList.add('ui-start-here');
  const layout=content.querySelector('.dashboard-family-layout');
  const recent=content.querySelector('.dashboard-recent');
  const history=content.querySelector('[aria-labelledby="dashboard-history-title"]');
  if(layout&&paths)paths.insertAdjacentElement('afterend',layout);
  if(recent&&layout)layout.insertAdjacentElement('afterend',recent);
  if(history&&(recent||layout))(recent||layout).insertAdjacentElement('afterend',history);
  const featured=content.querySelector('#dashboard-featured-title');setText(featured,'Meet the family');
  const branches=content.querySelector('#dashboard-branches-title');setText(branches,'Explore by family branch');
  const historyTitle=content.querySelector('#dashboard-history-title');setText(historyTitle,'Stories, places & milestones');
  const research=content.querySelector('.dashboard-research-split');if(research)research.classList.add('ui-research-secondary');
  const tasks=content.querySelector('[aria-labelledby="dashboard-records-title"]');if(tasks)tasks.classList.add('ui-research-secondary');
}

function syncRelease(){
  const release=document.documentElement.dataset.uiRelease||'20.0.0';
  const version=document.querySelector('.version');if(version)setText(version,`${isFamilyMode()?'FAMILY VIEW':'RESEARCH MODE'} · v${release}`);
}
let queued=false;
function apply(){queued=false;syncRelease();polishHome();polishProfile();installTreeOverview();}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply));}

window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-edits-changed',schedule);
window.addEventListener('family-media-changed',schedule);
window.addEventListener('family-auth-ui-refresh',schedule);
document.addEventListener('change',event=>{if(event.target.matches?.('[data-tree-person]'))schedule();});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
