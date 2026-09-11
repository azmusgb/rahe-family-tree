import{model,displayPeople,allPedigreeRelationships,personById,esc}from'../../core.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamily=()=>document.body.dataset.experience!=='research';
const initials=name=>String(name||'?').replace(/\/.*/,'').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();
const publicDates=p=>p?.living?'Living — details protected':String(p?.dates||'Dates not recorded');
const normalizedEvents=()=>Array.isArray(model?.normalizedEvents)?model.normalizedEvents:[];
const activeRelationships=()=>allPedigreeRelationships().filter(r=>r.active!==false&&!/REJECTED/i.test(String(r.state||'')));

function eventPlaces(event){return Array.isArray(event?.place)?event.place.map(v=>String(v||'').trim()).filter(Boolean):[];}
function personPlaces(person,limit=2){
  if(!person||person.living)return[];
  const counts=new Map();
  for(const event of normalizedEvents()){
    if(!(event.personIds||[]).includes(person.id))continue;
    for(const place of eventPlaces(event))counts.set(place,(counts.get(place)||0)+1);
  }
  return[...counts].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([place])=>place);
}
function directFamily(person){
  if(!person)return{parents:[],spouses:[],children:[],siblings:[]};
  const rels=activeRelationships();
  const unique=rows=>[...new Map(rows.filter(Boolean).map(p=>[p.id,p])).values()];
  const parents=unique(rels.filter(r=>r.type==='parent-child'&&r.to===person.id).map(r=>personById(r.from)));
  const children=unique(rels.filter(r=>r.type==='parent-child'&&r.from===person.id).map(r=>personById(r.to)));
  const spouses=unique(rels.filter(r=>/spouse|marriage|partner/i.test(String(r.type||''))&&(r.from===person.id||r.to===person.id)).map(r=>personById(r.from===person.id?r.to:r.from)));
  const parentIds=new Set(parents.map(p=>p.id));
  const siblings=unique(rels.filter(r=>r.type==='parent-child'&&parentIds.has(r.from)&&r.to!==person.id).map(r=>personById(r.to)));
  return{parents,spouses,children,siblings};
}
function personContext(person){
  const role=String(person?.role||'Family member').replace(/\s+/g,' ').trim();
  const place=personPlaces(person,1)[0]||'';
  return[role,place].filter(Boolean).join(' · ');
}
function lifeYears(person){return person?.living?'Living family member':String(person?.dates||'Historical family record');}

function branchCounts(){
  const counts=new Map();
  for(const p of displayPeople()){
    const branch=cleanBranch(p.branch);if(!branch)continue;
    counts.set(branch,(counts.get(branch)||0)+1);
  }
  return[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}

function peopleHeader(content){
  if(content.querySelector('.v159-people-header'))return;
  const grid=content.querySelector('.people-grid');if(!grid)return;
  const people=displayPeople(),historical=people.filter(p=>!p.living).length,living=people.length-historical,branches=branchCounts();
  const header=document.createElement('section');header.className='v159-people-header';
  header.innerHTML=`<div class="v159-people-heading"><div><p class="eyebrow">FAMILY DIRECTORY</p><h2>Meet the people in the family</h2><p>Browse relatives as people first — with family context, places, relationships, and photographs where available.</p></div><div class="v159-people-totals" aria-label="People directory summary"><span><b>${people.length}</b><small>people</small></span><span><b>${branches.length}</b><small>branches</small></span><span><b>${historical}</b><small>historical</small></span>${living?`<span><b>${living}</b><small>living protected</small></span>`:''}</div></div><div class="v159-branch-browser" aria-label="Browse people by branch"><span>Browse by branch</span><button type="button" data-v159-branch="">All</button>${branches.slice(0,8).map(([branch,count])=>`<button type="button" data-v159-branch="${esc(branch)}">${esc(branch)} <small>${count}</small></button>`).join('')}</div>`;
  const inventory=content.querySelector('.notice');
  (inventory||grid).insertAdjacentElement(inventory?'afterend':'beforebegin',header);
}

function enrichPersonCards(content){
  content.querySelectorAll('.person-card .person-open[data-person]').forEach(button=>{
    const person=personById(button.dataset.person);if(!person)return;
    const article=button.closest('.person-card');article?.classList.add('v159-person-card');
    const family=directFamily(person),places=personPlaces(person,1),branch=cleanBranch(person.branch);
    button.innerHTML=`<span class="v159-card-media" aria-hidden="true"><span>${esc(initials(person.name))}</span></span><span class="v159-card-copy"><span class="v159-card-branch">${esc(branch)}</span><strong>${esc(person.name.replace(/\s*\/.*$/,''))}</strong><span class="v159-card-dates">${esc(publicDates(person))}</span><span class="v159-card-context">${esc(personContext(person)||branch)}</span><span class="v159-card-relations">${family.parents.length?`<small>${family.parents.length} parent${family.parents.length===1?'':'s'}</small>`:''}${family.spouses.length?`<small>${family.spouses.length} spouse${family.spouses.length===1?'':'s'}</small>`:''}${family.children.length?`<small>${family.children.length} child${family.children.length===1?'':'ren'}</small>`:''}${!family.parents.length&&!family.spouses.length&&!family.children.length?'<small>Family connections being documented</small>':''}</span></span><span class="v159-card-arrow" aria-hidden="true">→</span>`;
    if(places.length)article?.setAttribute('data-place',places[0]);
  });
}

function installLifeSummary(content,person){
  const overview=content.querySelector('.family-overview-card');if(!overview||overview.querySelector('.v159-life-summary'))return;
  overview.classList.add('v159-person-overview');
  const family=directFamily(person),places=personPlaces(person,3),events=normalizedEvents().filter(e=>(e.personIds||[]).includes(person.id));
  const years=events.map(e=>Number(e.year)).filter(Number.isFinite).sort((a,b)=>a-b);
  const firstYear=years[0],lastYear=years.at(-1);
  const summary=document.createElement('section');summary.className='v159-life-summary';
  summary.innerHTML=`<div class="v159-life-copy"><p class="eyebrow">LIFE AT A GLANCE</p><h3>${esc(person.name.replace(/\s*\/.*$/,''))}</h3><p>${esc(personContext(person)||`${cleanBranch(person.branch)} family member`)}. ${person.living?'Public family view protects living-person birth and location details.':'Explore the relationships, places, chronology, photographs, and records connected to this person.'}</p></div><div class="v159-life-facts"><span><b>${esc(lifeYears(person))}</b><small>life record</small></span><span><b>${family.parents.length+family.spouses.length+family.children.length}</b><small>immediate family links</small></span><span><b>${events.length}</b><small>timeline records</small></span>${!person.living&&places.length?`<span><b>${esc(places[0])}</b><small>key place</small></span>`:''}</div>${!person.living&&places.length>1?`<div class="v159-place-trail"><span>Places in the record</span>${places.map(place=>`<b>${esc(place)}</b>`).join('<i aria-hidden="true">→</i>')}</div>`:''}`;
  const familyGrid=overview.querySelector('.profile-family-grid');
  (familyGrid||overview.querySelector('.profile-media'))?.insertAdjacentElement('beforebegin',summary);
}

function polishProfile(content,person){
  if(!person)return;
  content.classList.add('v159-profile');
  const overview=content.querySelector('.family-overview-card');if(!overview)return;
  overview.classList.add('v159-person-overview');
  const headline=overview.querySelector('.profile-headline');
  if(headline&&!headline.querySelector('.v159-profile-context')){
    const context=document.createElement('p');context.className='v159-profile-context';context.textContent=personContext(person)||`${cleanBranch(person.branch)} family member`;headline.appendChild(context);
  }
  const actions=overview.querySelector('.profile-actions');
  if(actions&&!actions.querySelector('[data-v159-photos]')){
    const photos=document.createElement('a');photos.className='action';photos.href='#media';photos.dataset.v159Photos='';photos.textContent='Browse family photos';actions.appendChild(photos);
  }
  overview.querySelectorAll('.profile-family-block').forEach(block=>block.classList.add('v159-family-block'));
  installLifeSummary(content,person);
}

let mediaPromise=null;
function publicMedia(){
  if(!mediaPromise)mediaPromise=fetch('/api/media',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():{media:[]}).then(data=>(data.media||[]).filter(m=>m.visibility==='public'&&String(m.mime||'').startsWith('image/'))).catch(()=>[]);
  return mediaPromise;
}
function portraitMap(media){
  const map=new Map();
  for(const item of [...media].sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured))))for(const id of item.personIds||[])if(!map.has(id))map.set(id,item);
  return map;
}
async function hydratePortraits(content){
  const map=portraitMap(await publicMedia());
  content.querySelectorAll('.v159-person-card .person-open[data-person]').forEach(button=>{
    const item=map.get(button.dataset.person),media=button.querySelector('.v159-card-media');if(!item||!media||media.querySelector('img'))return;
    const img=document.createElement('img');img.src=`/api/media?file=${encodeURIComponent(item.id)}`;img.alt='';img.loading='lazy';img.decoding='async';media.prepend(img);media.querySelector('span')?.setAttribute('hidden','');
  });
  content.querySelectorAll('.v153-relation-person[data-person]').forEach(button=>{
    const item=map.get(button.dataset.person),avatar=button.querySelector('.v153-mini-avatar');if(!item||!avatar||avatar.dataset.photoLoaded)return;
    avatar.textContent='';avatar.style.backgroundImage=`url("/api/media?file=${encodeURIComponent(item.id)}")`;avatar.style.backgroundSize='cover';avatar.style.backgroundPosition='center';avatar.dataset.photoLoaded='true';
  });
}

function applyPeople(content){content.classList.add('v159-people');peopleHeader(content);enrichPersonCards(content);hydratePortraits(content);}
function applyProfile(content){const id=location.hash.split('/')[1],person=personById(id);polishProfile(content,person);hydratePortraits(content);}
function apply(){
  if(!isFamily())return;const content=document.querySelector('#content');if(!content)return;
  const route=routeKey();if(route==='people')applyPeople(content);else if(route==='person')applyProfile(content);
}
function selectBranch(event){
  const button=event.target.closest?.('[data-v159-branch]');if(!button)return false;
  const select=document.getElementById('branch');if(!select)return true;
  select.value=button.dataset.v159Branch||'';select.dispatchEvent(new Event('change',{bubbles:true}));return true;
}

document.addEventListener('click',event=>{if(selectBranch(event))event.preventDefault();});
window.addEventListener('family-view-rendered',()=>requestAnimationFrame(()=>requestAnimationFrame(apply)));
window.addEventListener('family-media-changed',()=>{mediaPromise=null;apply();});
window.addEventListener('family-auth-changed',()=>{mediaPromise=null;apply();});
window.addEventListener('hashchange',()=>setTimeout(apply));
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',apply):apply();
