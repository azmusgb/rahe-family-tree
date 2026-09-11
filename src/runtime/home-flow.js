import{model,displayPeople,allPedigreeRelationships,personById,esc}from'../../core.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamilyHome=()=>document.body.dataset.experience!=='research'&&routeKey()==='dashboard';
const initials=name=>String(name||'?').replace(/\/.*/,'').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();
const publicDate=p=>p?.living?'Living':String(p?.dates||'Dates not recorded');
const normalizedEvents=()=>Array.isArray(model.normalizedEvents)?model.normalizedEvents:[];

function directFamily(person){
  if(!person)return{parents:[],spouses:[],children:[]};
  const rels=allPedigreeRelationships().filter(r=>r.active!==false&&!/REJECTED/i.test(String(r.state||'')));
  const ids=new Set(displayPeople().map(p=>p.id));
  const unique=rows=>[...new Map(rows.filter(Boolean).map(p=>[p.id,p])).values()];
  return{
    parents:unique(rels.filter(r=>r.type==='parent-child'&&r.to===person.id&&ids.has(r.from)).map(r=>personById(r.from))),
    children:unique(rels.filter(r=>r.type==='parent-child'&&r.from===person.id&&ids.has(r.to)).map(r=>personById(r.to))),
    spouses:unique(rels.filter(r=>/spouse|marriage|partner/i.test(String(r.type||''))&&(r.from===person.id||r.to===person.id)).map(r=>personById(r.from===person.id?r.to:r.from)))
  };
}

function anchorPerson(){
  const people=displayPeople();
  return people.find(p=>/William John Rahe Sr\.?/i.test(p.name))||people.find(p=>cleanBranch(p.branch)==='Rahe'&&!p.living)||people[0]||null;
}

function miniPerson(person,label){
  if(!person)return'';
  return`<button type="button" class="v157-tree-person" data-person="${esc(person.id)}"><span aria-hidden="true">${esc(initials(person.name))}</span><small>${esc(label)}</small><b>${esc(person.name.replace(/\s*\/.*$/,''))}</b></button>`;
}

function buildTreePreview(){
  const person=anchorPerson();if(!person)return'';
  const family=directFamily(person),parent=family.parents[0],spouse=family.spouses[0],children=family.children.slice(0,3);
  return`<section class="v157-tree-preview" aria-labelledby="v157-tree-title"><div class="v157-tree-heading"><div><p class="eyebrow">YOUR FAMILY TREE</p><h2 id="v157-tree-title">See how the family connects</h2></div><a href="#tree">Explore the full tree ↗</a></div><div class="v157-tree-canvas"><div class="v157-tree-row parents">${miniPerson(parent,'Parent')}</div><div class="v157-tree-line" aria-hidden="true"></div><div class="v157-tree-row couple">${miniPerson(person,'Focus')}${miniPerson(spouse,'Spouse')}</div>${children.length?`<div class="v157-tree-line children" aria-hidden="true"></div><div class="v157-tree-row children">${children.map(child=>miniPerson(child,'Child')).join('')}</div>`:''}</div></section>`;
}

function eventPlaces(event){return Array.isArray(event?.place)?event.place.map(value=>String(value||'').trim()).filter(Boolean):[];}
function personContext(person){
  const place=normalizedEvents().filter(e=>(e.personIds||[]).includes(person.id)).flatMap(eventPlaces)[0]||'';
  const role=String(person.role||'Family member').replace(/\s+/g,' ').trim();
  return [role,place].filter(Boolean).slice(0,2).join(' · ');
}

function enrichPeople(content){
  content.querySelectorAll('.dashboard-person-open[data-person]').forEach(button=>{
    const person=personById(button.dataset.person);if(!person)return;
    button.closest('.dashboard-person')?.classList.add('v157-person-card');
    let copy=button.querySelector('.v157-person-copy');
    if(!copy){copy=document.createElement('span');copy.className='v157-person-copy';button.appendChild(copy);}
    copy.innerHTML=`<span>${esc(personContext(person)||cleanBranch(person.branch))}</span><span>${esc(publicDate(person))}</span>`;
  });
}

function branchYears(members){
  const years=members.flatMap(p=>String(p.dates||'').match(/\b(?:1[6-9]\d{2}|20\d{2})\b/g)||[]).map(Number).filter(Number.isFinite);
  return years.length?`${Math.min(...years)}–${Math.max(...years)}`:'';
}
function branchPlaces(members){
  const ids=new Set(members.map(p=>p.id)),counts=new Map();
  for(const event of normalizedEvents()){
    if(!(event.personIds||[]).some(id=>ids.has(id)))continue;
    for(const place of eventPlaces(event))counts.set(place,(counts.get(place)||0)+1);
  }
  return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([place])=>place);
}
function enrichBranches(content){
  const people=displayPeople();
  content.querySelectorAll('.family-branch-card[data-branch]').forEach(card=>{
    const branch=card.dataset.branch,members=people.filter(p=>cleanBranch(p.branch)===branch),places=branchPlaces(members),years=branchYears(members);
    card.classList.add('v157-branch-card');
    const count=card.querySelector('.family-branch-count');if(count)count.textContent=`${members.length} people`;
    const paragraph=card.querySelector('p');
    if(paragraph){const memberNames=members.slice(0,3).map(p=>p.name.replace(/\s*\/.*$/,'')).join(' · ');paragraph.innerHTML=`<span>${esc([places.join(' → '),years].filter(Boolean).join(' · ')||'Family history')}</span><small>${esc(memberNames)}</small>`;}
  });
}

function compactHero(content){
  const hero=content.querySelector('.dashboard-hero');if(!hero)return;
  hero.classList.add('v157-hero');
  const title=hero.querySelector('h2');if(title)title.textContent='The Rahe family, connected.';
  const intro=hero.querySelector('.dashboard-hero-copy>p:not(.eyebrow)');if(intro)intro.textContent='Explore the tree, meet the people, and follow the places and stories that shaped the family.';
  const mediaAction=[...hero.querySelectorAll('.dashboard-hero-actions .action')].find(a=>/photo|document|media/i.test(a.textContent||''));if(mediaAction)mediaAction.textContent='Browse family media';
  const snapshot=hero.querySelector('.dashboard-hero-card');if(snapshot)snapshot.hidden=true;
}

function moveSections(content){
  const hero=content.querySelector('.dashboard-hero');if(!hero)return;
  content.querySelector('.dashboard-paths')?.remove();
  let tree=content.querySelector('.v157-tree-preview');if(!tree){hero.insertAdjacentHTML('afterend',buildTreePreview());tree=content.querySelector('.v157-tree-preview');}
  const layout=content.querySelector('.dashboard-family-layout');
  const featured=[...content.querySelectorAll('.dashboard-section')].find(s=>/FEATURED PEOPLE/i.test(s.querySelector('.eyebrow')?.textContent||''));
  const branches=[...content.querySelectorAll('.dashboard-section')].find(s=>/FAMILY BRANCHES/i.test(s.querySelector('.eyebrow')?.textContent||''));
  const recent=content.querySelector('.dashboard-recent');
  const history=content.querySelector('[aria-labelledby="dashboard-history-title"]');
  let cursor=tree||hero;
  for(const section of [featured,branches,history,recent]){if(section){cursor.insertAdjacentElement('afterend',section);cursor=section;}}
  if(layout&&!layout.contains(featured)&&!layout.contains(branches))layout.remove();
}

function installResearchCenter(content){
  content.querySelector('.dashboard-research-split')?.remove();
  content.querySelector('[aria-labelledby="dashboard-records-title"]')?.remove();
  content.querySelector('.dashboard-research-details')?.remove();
  let center=content.querySelector('.v157-research-center');if(center)return;
  center=document.createElement('section');center.className='v157-research-center';
  const critical=(model.researchTasks||[]).filter(t=>/CRITICAL/i.test(String(t.priority||''))).length;
  center.innerHTML=`<div><p class="eyebrow">RESEARCH CENTER</p><h2>Sources, open questions & research work</h2><p>Keep the family experience focused on people and stories. Evidence states, unresolved questions, source analysis, and the research queue live in one dedicated workspace.</p></div><div class="v157-research-meta"><span><b>${model.sources?.length||0}</b><small>registered sources</small></span><span><b>${model.claims?.length||0}</b><small>documented claims</small></span><span><b>${critical}</b><small>critical targets</small></span></div><a class="action primary" href="#research">Open Research Center</a>`;
  content.appendChild(center);
}

function installMediaPreview(content,media){
  const images=media.filter(m=>m.visibility==='public'&&String(m.mime||'').startsWith('image/')).sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured))).slice(0,4);
  const existing=content.querySelector('.v157-media-preview');
  if(!images.length){existing?.remove();return;}
  const peopleSection=[...content.querySelectorAll('.dashboard-section')].find(s=>/FEATURED PEOPLE/i.test(s.querySelector('.eyebrow')?.textContent||''));
  let section=existing;
  if(!section){section=document.createElement('section');section.className='v157-media-preview dashboard-section';peopleSection?.insertAdjacentElement('afterend',section);}
  section.innerHTML=`<div class="section-title"><div><p class="eyebrow">FAMILY PHOTOS</p><h2>Faces from the archive</h2></div><a href="#media">Browse all media ↗</a></div><div class="v157-media-grid">${images.map(m=>`<a href="#media" class="v157-media-card"><img src="/api/media?file=${encodeURIComponent(m.id)}" alt="${esc(m.caption||m.title||'Family photograph')}" loading="lazy" decoding="async"><span><b>${esc(m.title||'Family photograph')}</b><small>${esc([m.eventDate,typeof m.location==='string'?m.location:''].filter(Boolean).join(' · ')||'Family archive')}</small></span></a>`).join('')}</div>`;
}

async function hydrateDashboardMedia(content){
  try{
    const response=await fetch('/api/media',{credentials:'same-origin',cache:'no-store'});if(!response.ok)return;
    const data=await response.json();const media=Array.isArray(data.media)?data.media:[];
    for(const button of content.querySelectorAll('.dashboard-person-open[data-person]')){
      const id=button.dataset.person;if(button.querySelector('.v157-portrait'))continue;
      const image=media.filter(m=>m.visibility==='public'&&String(m.mime||'').startsWith('image/')&&(m.personIds||[]).includes(id)).sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)))[0];
      if(!image)continue;const portrait=document.createElement('img');portrait.className='v157-portrait';portrait.src=`/api/media?file=${encodeURIComponent(image.id)}`;portrait.alt='';portrait.loading='lazy';portrait.decoding='async';button.prepend(portrait);button.querySelector('.dashboard-avatar')?.setAttribute('hidden','');
    }
    installMediaPreview(content,media);
  }catch{}
}

let scheduled=false;
function apply(){scheduled=false;if(!isFamilyHome())return;const content=document.querySelector('#content');if(!content)return;content.classList.add('v157-home');compactHero(content);moveSections(content);enrichPeople(content);enrichBranches(content);installResearchCenter(content);hydrateDashboardMedia(content);}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>requestAnimationFrame(apply));}
window.addEventListener('family-view-rendered',schedule);window.addEventListener('hashchange',schedule);window.addEventListener('family-media-changed',schedule);window.addEventListener('family-auth-changed',schedule);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
