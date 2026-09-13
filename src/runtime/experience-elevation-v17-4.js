// v17.4 Elevated Family Experience — premium, family-first presentation helpers.
// This module reads the canonical model but never mutates genealogy, evidence,
// source IDs, relationship states, or privacy semantics.
import{model,displayPeople,allPedigreeRelationships,personById,branchMembership,esc}from'../../core.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const routePersonId=()=>location.hash.startsWith('#person/')?location.hash.split('/')[1]||'':'';
const isFamily=()=>document.body.dataset.experience!=='research';
const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const cleanBranch=person=>branchMembership(person)[0]||String(person?.branch||'Family').split('/')[0].trim()||'Family';
const initials=value=>cleanName(value).split(/\s+/).filter(Boolean).map(token=>token[0]).slice(0,2).join('').toUpperCase()||'?';
const normalizedEvents=()=>Array.isArray(model?.normalizedEvents)?model.normalizedEvents:[];
const publicIds=()=>new Set(displayPeople().map(person=>person.id));
const unique=rows=>[...new Map(rows.filter(Boolean).map(person=>[person.id,person])).values()];

function activeRelationships(){
  const ids=publicIds();
  return allPedigreeRelationships().filter(rel=>rel.active!==false&&!/REJECTED/i.test(String(rel.state||''))&&ids.has(rel.from)&&ids.has(rel.to));
}
function closeFamily(person){
  if(!person)return[];
  const rels=activeRelationships();
  const parents=rels.filter(rel=>rel.type==='parent-child'&&rel.to===person.id).map(rel=>personById(rel.from));
  const children=rels.filter(rel=>rel.type==='parent-child'&&rel.from===person.id).map(rel=>personById(rel.to));
  const spouses=rels.filter(rel=>/spouse|marriage|partner/i.test(String(rel.type||''))&&(rel.from===person.id||rel.to===person.id)).map(rel=>personById(rel.from===person.id?rel.to:rel.from));
  return unique([...parents,...spouses,...children]);
}
function personEvents(person){
  if(!person||person.living)return[];
  return normalizedEvents().filter(event=>(event.personIds||[]).includes(person.id)&&!/REJECTED/i.test(String(event.evidenceState||event.state||'')));
}
function personPlaces(person){
  if(!person||person.living)return[];
  const places=[];
  for(const event of personEvents(person))for(const place of Array.isArray(event.place)?event.place:[event.place])if(place)places.push(String(place).trim());
  return [...new Set(places.filter(Boolean))];
}

function recentPeople(limit=4){
  const ids=publicIds(),found=[];
  try{
    for(const key of['family.archive.recentPeople.v2','rahe.family.recentPeople.v1','rahe.family.recent-people.v1']){
      const raw=localStorage.getItem(key);if(!raw)continue;
      for(const id of JSON.parse(raw)||[])if(ids.has(id)&&!found.includes(id))found.push(id);
    }
  }catch{}
  const rows=found.map(personById).filter(Boolean);
  const fallback=displayPeople().filter(person=>!person.living&&!found.includes(person.id));
  return unique([...rows,...fallback]).slice(0,limit);
}
function installHomeDiscovery(root){
  if(routeKey()!=='dashboard'||root.querySelector('.v174-discovery'))return;
  const hero=root.querySelector('.v17-home-hero');if(!hero)return;
  const people=recentPeople(4);if(!people.length)return;
  const section=document.createElement('section');section.className='v174-discovery';
  section.innerHTML=`<div class="v174-discovery-head"><div><p class="eyebrow">KEEP EXPLORING</p><h2>Follow another path through the family</h2><p>Open a person, then move through their relatives, life story, places, and records.</p></div><a href="#people">Browse everyone ↗</a></div><div class="v174-discovery-grid">${people.map(person=>`<button type="button" data-person="${esc(person.id)}"><span class="v174-discovery-avatar" data-v17-person-photo="${esc(person.id)}">${esc(initials(person.name))}</span><span><small>${esc(cleanBranch(person))}</small><b>${esc(cleanName(person.name))}</b><em>${person.living?'Living — details protected':esc(person.dates||'Historical family record')}</em></span><i aria-hidden="true">→</i></button>`).join('')}</div>`;
  const branches=root.querySelector('.v172-home-branches');(branches||hero).insertAdjacentElement('afterend',section);
}

function installPersonSnapshot(root,person){
  if(!person||root.querySelector('.v174-profile-snapshot'))return;
  const nav=root.querySelector('.v17-person-nav'),header=root.querySelector('.v17-person-header');if(!header)return;
  const family=closeFamily(person),events=personEvents(person),places=personPlaces(person);
  const section=document.createElement('section');section.className='v174-profile-snapshot';section.setAttribute('aria-label','Profile summary');
  section.innerHTML=`<div class="v174-snapshot-intro"><span class="eyebrow">AT A GLANCE</span><b>${esc(cleanBranch(person))} family</b></div><div class="v174-snapshot-stat"><b>${family.length}</b><span>close family connection${family.length===1?'':'s'}</span></div><div class="v174-snapshot-stat"><b>${person.living?'Protected':events.length}</b><span>${person.living?'private chronology':'linked life record'+(events.length===1?'':'s')}</span></div><div class="v174-snapshot-stat"><b>${person.living?'Protected':places.length}</b><span>${person.living?'private places':'recorded place'+(places.length===1?'':'s')}</span></div>`;
  (nav||header).insertAdjacentElement(nav?'beforebegin':'afterend',section);
}
function installActivePersonNav(root){
  const nav=root.querySelector('.v17-person-nav');if(!nav||nav.dataset.v174ActiveNav==='ready')return;
  nav.dataset.v174ActiveNav='ready';
  const sections=[...nav.querySelectorAll('a[href^="#v17-"]')].map(link=>({link,target:root.querySelector(link.getAttribute('href'))})).filter(row=>row.target);
  if(!sections.length)return;
  const setActive=target=>sections.forEach(row=>{const active=row.target===target;row.link.classList.toggle('is-active',active);if(active)row.link.setAttribute('aria-current','location');else row.link.removeAttribute('aria-current');});
  setActive(sections[0].target);
  if(!('IntersectionObserver'in window))return;
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top)-Math.abs(b.boundingClientRect.top))[0];
    if(visible)setActive(visible.target);
  },{rootMargin:'-28% 0px -58% 0px',threshold:[0,.1,.5]});
  sections.forEach(row=>observer.observe(row.target));
}
function elevatePerson(){
  if(routeKey()!=='person')return;
  const id=routePersonId(),person=personById(id),root=document.querySelector(`.v17-person[data-person-id="${globalThis.CSS?.escape?CSS.escape(id):id}"]`);if(!root||!person)return;
  installPersonSnapshot(root,person);installActivePersonNav(root);
}

function treeScope(){return new URL(location.href).searchParams.get('scope')||'family';}
function treeFocusPerson(){
  const url=new URL(location.href),id=url.searchParams.get('focus')||document.querySelector('[data-tree-person]')?.value||'';
  return personById(id)||null;
}
function scopeCopy(scope){
  return({family:['Close family','Parents, spouses, children, and nearby generations around the focal person.'],ancestors:['Ancestors','Follow the focal person backward through documented parent lines.'],descendants:['Descendants','Follow the focal person forward through documented child lines.'],connected:['Connected family','Explore the broader connected family network across branches.'],all:['Full graph','Show every active public-safe relationship in the current graph.']})[scope]||['Family view','Explore documented family relationships.'];
}
function installTreeContext(root){
  if(routeKey()!=='tree')return;
  const graph=root.querySelector('.graph-shell');if(!graph)return;
  let panel=root.querySelector('.v174-tree-context');if(!panel){panel=document.createElement('section');panel.className='v174-tree-context';graph.insertAdjacentElement('beforebegin',panel);}
  const scope=treeScope(),person=treeFocusPerson(),copy=scopeCopy(scope);
  panel.innerHTML=`<div class="v174-tree-context-copy"><span class="eyebrow">TREE VIEW</span><b>${esc(copy[0])}${person?` · ${esc(cleanName(person.name))}`:''}</b><p>${esc(copy[1])}</p></div><div class="v174-tree-scope" role="group" aria-label="Tree view"><button type="button" data-tree-scope="family" class="${scope==='family'?'active':''}" aria-pressed="${scope==='family'}">Family</button><button type="button" data-tree-scope="ancestors" class="${scope==='ancestors'?'active':''}" aria-pressed="${scope==='ancestors'}">Ancestors</button><button type="button" data-tree-scope="descendants" class="${scope==='descendants'?'active':''}" aria-pressed="${scope==='descendants'}">Descendants</button><button type="button" data-tree-scope="connected" class="${scope==='connected'?'active':''}" aria-pressed="${scope==='connected'}">Connected</button></div>`;
}

function apply(){
  if(!isFamily())return;
  const root=document.querySelector('#content [data-v17-native]');if(!root)return;
  if(routeKey()==='dashboard')installHomeDiscovery(root);
  if(routeKey()==='person')elevatePerson();
  if(routeKey()==='tree')installTreeContext(root);
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}
window.addEventListener('family-native-rendered',schedule);
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-person-v17-3-ready',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-media-changed',schedule);
window.addEventListener('family-experience-changed',schedule);
document.addEventListener('change',event=>{if(event.target.matches?.('[data-tree-person]'))schedule();});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
