import{model,displayPeople,allPedigreeRelationships,personById,esc}from'../../core.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamily=()=>document.body.dataset.experience!=='research';
const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();
const events=()=>Array.isArray(model?.normalizedEvents)?model.normalizedEvents:[];
const stateOf=e=>String(e?.evidenceState||e?.state||'UNRESOLVED').toUpperCase();
const yearsOf=e=>Array.isArray(e?.date?.years)?e.date.years.map(Number).filter(Number.isFinite):[];
const yearOf=e=>yearsOf(e)[0]||Number(String(e?.date?.display||'').match(/\b(1[6-9]\d{2}|20\d{2})\b/)?.[1])||0;
const eventType=e=>String(e?.eventType||e?.category||e?.type||'Family event').replace(/[_-]+/g,' ').trim();
const eventText=e=>String(e?.recordText||e?.sourceSectionTitle||e?.title||e?.event||eventType(e)).replace(/\s+/g,' ').trim();
const eventPlaces=e=>Array.isArray(e?.place)?e.place.map(v=>String(v||'').trim()).filter(Boolean):[];
const peopleFor=e=>(e?.personIds||[]).map(personById).filter(Boolean);
const isHistoricalEvent=e=>peopleFor(e).every(person=>!person.living);
const activeRels=()=>allPedigreeRelationships().filter(r=>r.active!==false&&!/REJECTED/i.test(String(r.state||'')));
const treeHref=id=>{const u=new URL(location.href);u.searchParams.set('focus',id);u.searchParams.set('scope','family');u.hash='tree';return `${u.pathname}${u.search}${u.hash}`;};

function directFamily(person){
  if(!person)return{parents:[],spouses:[],children:[]};
  const rels=activeRels(),unique=rows=>[...new Map(rows.filter(Boolean).map(p=>[p.id,p])).values()];
  return{
    parents:unique(rels.filter(r=>r.type==='parent-child'&&r.to===person.id).map(r=>personById(r.from))),
    children:unique(rels.filter(r=>r.type==='parent-child'&&r.from===person.id).map(r=>personById(r.to))),
    spouses:unique(rels.filter(r=>/spouse|marriage|partner/i.test(String(r.type||''))&&(r.from===person.id||r.to===person.id)).map(r=>personById(r.from===person.id?r.to:r.from)))
  };
}

function familyMoments(){return events().filter(e=>stateOf(e)==='SUPPORTED'&&isHistoricalEvent(e)&&yearOf(e)&&eventText(e)).sort((a,b)=>yearOf(b)-yearOf(a));}
function meaningfulMoments(limit=4){const seen=new Set(),rows=[];for(const event of familyMoments()){const key=`${yearOf(event)}|${eventType(event)}|${(event.personIds||[]).join(',')}`;if(seen.has(key))continue;seen.add(key);rows.push(event);if(rows.length>=limit)break;}return rows;}
function topPlaces(limit=5){const counts=new Map();for(const event of events().filter(e=>stateOf(e)==='SUPPORTED'&&isHistoricalEvent(e)))for(const place of eventPlaces(event))counts.set(place,(counts.get(place)||0)+1);return[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([place])=>place);}
function momentCard(event){const people=peopleFor(event).slice(0,2).map(p=>cleanName(p.name)).join(' · '),place=eventPlaces(event)[0]||'';return`<article class="v162-moment"><time>${esc(yearOf(event))}</time><div><span>${esc(eventType(event))}</span><h3>${esc(eventText(event))}</h3>${people?`<p>${esc(people)}</p>`:''}${place?`<small>${esc(place)}</small>`:''}</div></article>`;}
function installHomeJourney(content){if(content.querySelector('.v162-family-journey'))return;const tree=content.querySelector('.v157-tree-preview'),moments=meaningfulMoments(),places=topPlaces();if(!tree||(!moments.length&&!places.length))return;const section=document.createElement('section');section.className='v162-family-journey dashboard-section';section.innerHTML=`<div class="v162-journey-head"><div><p class="eyebrow">THE FAMILY STORY</p><h2>Across generations and places</h2><p>Selected supported moments from the source-controlled family record.</p></div><a href="#stories">Explore all stories ↗</a></div>${moments.length?`<div class="v162-moments">${moments.map(momentCard).join('')}</div>`:''}${places.length?`<div class="v162-places"><span>Places in the family story</span>${places.map(place=>`<a href="#migration">${esc(place)}</a>`).join('')}</div>`:''}`;tree.insertAdjacentElement('afterend',section);}

function branchProfile(branch){const people=displayPeople().filter(p=>cleanBranch(p.branch)===branch),historical=people.filter(p=>!p.living),ids=new Set(historical.map(p=>p.id)),places=new Map(),years=[];for(const p of historical)for(const y of String(p.dates||'').match(/\b(?:1[6-9]\d{2}|20\d{2})\b/g)||[])years.push(Number(y));for(const event of events()){if(!isHistoricalEvent(event)||!(event.personIds||[]).some(id=>ids.has(id)))continue;for(const place of eventPlaces(event))places.set(place,(places.get(place)||0)+1);}return{people,years:years.filter(Number.isFinite),places:[...places].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([place])=>place)};}
function installBranchContext(content){if(routeKey()!=='people')return;const selected=document.getElementById('branch')?.value||'',existing=content.querySelector('.v162-branch-context');if(!selected){existing?.remove();return;}const branch=cleanBranch(selected),profile=branchProfile(branch),grid=content.querySelector('.people-grid');if(!grid)return;const years=profile.years.length?`${Math.min(...profile.years)}–${Math.max(...profile.years)}`:'Dates vary by person';const html=`<div><p class="eyebrow">${esc(branch.toUpperCase())} FAMILY</p><h3>${profile.people.length} ${profile.people.length===1?'person':'people'} in this branch</h3><p>${esc(years)}${profile.places.length?` · ${esc(profile.places.join(' · '))}`:''}</p></div><div class="v162-branch-actions"><a href="#stories">Stories</a><a href="#migration">Places</a></div>`;if(existing){existing.innerHTML=html;return;}const section=document.createElement('section');section.className='v162-branch-context';section.innerHTML=html;grid.insertAdjacentElement('beforebegin',section);}

function relativeLinks(items,label){if(!items.length)return'';return`<div class="v162-family-path-group"><span>${label}</span><div>${items.slice(0,4).map(p=>`<a href="#person/${esc(p.id)}">${esc(cleanName(p.name))}</a>`).join('')}</div></div>`;}
function installPersonPath(content){if(routeKey()!=='person'||content.querySelector('.v162-family-path'))return;const id=location.hash.split('/')[1],person=personById(id);if(!person)return;const family=directFamily(person);if(!family.parents.length&&!family.spouses.length&&!family.children.length)return;const overview=content.querySelector('.v159-person-overview,.family-overview-card');if(!overview)return;const path=document.createElement('section');path.className='v162-family-path';path.innerHTML=`<div class="v162-family-path-head"><p class="eyebrow">IMMEDIATE FAMILY</p><a href="${esc(treeHref(person.id))}">View in tree ↗</a></div>${relativeLinks(family.parents,'Parents')}${relativeLinks(family.spouses,'Spouse / partner')}${relativeLinks(family.children,'Children')}`;const tabs=content.querySelector('.v1510-profile-tabs');(tabs||overview).insertAdjacentElement('afterend',path);}

function installMediaQuickFilters(content){if(routeKey()!=='media'||content.querySelector('.v162-media-quick'))return;const filters=content.querySelector('.v161-media-filters'),title=content.querySelector('.media-library-title');if(!filters&&!title)return;const bar=document.createElement('div');bar.className='v162-media-quick';bar.setAttribute('aria-label','Quick media filters');bar.innerHTML='<button type="button" data-v162-media-type="all" class="active">All</button><button type="button" data-v162-media-type="photo">Photos</button><button type="button" data-v162-media-type="document">Documents</button>';(filters||title).insertAdjacentElement('beforebegin',bar);syncMediaQuick();}
function syncMediaQuick(){const value=document.getElementById('media-type')?.value||'all';document.querySelectorAll('[data-v162-media-type]').forEach(button=>button.classList.toggle('active',button.dataset.v162MediaType===value));}
function mediaQuick(event){const button=event.target.closest?.('[data-v162-media-type]');if(!button)return false;const select=document.getElementById('media-type');if(!select)return true;select.value=button.dataset.v162MediaType||'all';select.dispatchEvent(new Event('change',{bubbles:true}));syncMediaQuick();return true;}

function apply(){if(!isFamily())return;const content=document.getElementById('content');if(!content)return;const route=routeKey();if(route==='dashboard')installHomeJourney(content);if(route==='people')installBranchContext(content);if(route==='person')installPersonPath(content);if(route==='media')installMediaQuickFilters(content);}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

document.addEventListener('click',event=>{if(mediaQuick(event))event.preventDefault();});
document.addEventListener('change',event=>{if(event.target?.id==='branch'||event.target?.id==='media-type')schedule();});
window.addEventListener('family-view-rendered',schedule);window.addEventListener('hashchange',schedule);window.addEventListener('family-media-changed',schedule);window.addEventListener('family-experience-changed',schedule);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
