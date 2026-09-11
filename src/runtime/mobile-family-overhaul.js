const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamilyHome=()=>document.body.dataset.experience!=='research'&&routeKey()==='dashboard';

function mergeHomeLead(content){
  const hero=content.querySelector('.v157-hero'),tree=content.querySelector('.v157-tree-preview');
  if(!hero||!tree||content.querySelector('.v1511-home-lead'))return;
  const lead=document.createElement('section');lead.className='v1511-home-lead';
  hero.insertAdjacentElement('beforebegin',lead);lead.append(hero,tree);
}

function simplifyHero(content){
  const hero=content.querySelector('.v157-hero');if(!hero)return;
  const intro=hero.querySelector('.dashboard-hero-copy>p:not(.eyebrow)');
  if(intro)intro.textContent='Meet the people, follow the branches, and see how the Rahe family connects.';
  const actions=[...hero.querySelectorAll('.dashboard-hero-actions .action')];
  if(actions[0])actions[0].textContent='Explore tree';
  if(actions[1])actions[1].textContent='Find a person';
  if(actions[2])actions[2].hidden=true;
  const snapshot=hero.querySelector('.dashboard-hero-card');if(snapshot)snapshot.hidden=true;
}

function simplifyTree(content){
  const tree=content.querySelector('.v157-tree-preview');if(!tree)return;
  tree.classList.add('v1511-tree-preview');
  const heading=tree.querySelector('.v157-tree-heading h2');if(heading)heading.textContent='Your connected family';
  const eyebrow=tree.querySelector('.v157-tree-heading .eyebrow');if(eyebrow)eyebrow.textContent='FAMILY TREE';
}

function simplifyFeatured(content){
  const section=[...content.querySelectorAll('.dashboard-section')].find(s=>/FEATURED PEOPLE/i.test(s.querySelector('.eyebrow')?.textContent||''));if(!section)return;
  section.classList.add('v1511-featured');
  const heading=section.querySelector('h2');if(heading)heading.textContent='People to start with';
}

function simplifyResearch(content){
  const center=content.querySelector('.v157-research-center');if(!center)return;
  center.classList.add('v1511-research-center');
  const heading=center.querySelector('h2');if(heading)heading.textContent='Research Center';
  const paragraph=center.querySelector('p:not(.eyebrow)');if(paragraph)paragraph.textContent='Sources, unresolved questions, and evidence work stay in one dedicated workspace.';
  const action=center.querySelector('.action');if(action)action.textContent='Open Research Center';
}

function labelSearchOverlay(){
  const overlay=document.getElementById('search-v13-2-results');if(!overlay)return;
  overlay.classList.add('v1511-search-sheet');
  const summary=overlay.querySelector('.search-summary small');
  if(summary&&document.body.dataset.experience!=='research')summary.textContent='Search people and family groups. Research records remain available in Research Center.';
}

function apply(){
  labelSearchOverlay();
  if(!isFamilyHome())return;
  const content=document.querySelector('#content');if(!content)return;
  content.classList.add('v1511-home');
  simplifyHero(content);simplifyTree(content);mergeHomeLead(content);simplifyFeatured(content);simplifyResearch(content);
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}
window.addEventListener('family-view-rendered',schedule);window.addEventListener('hashchange',schedule);window.addEventListener('family-experience-changed',schedule);
document.addEventListener('input',event=>{if(event.target?.id==='search')schedule();});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
