// Family branch destinations for the v17.5 family-facing archive.
// Read-only presentation: canonical people, relationships, evidence states,
// source IDs, rejected claims, and living-person privacy semantics are untouched.
import{model,displayPeople,allPedigreeRelationships,personById,branchMembership,esc,stateBadges,stateClass}from'../../../core.js';

const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const cleanBranch=value=>String(value||'Family').trim()||'Family';
const initials=value=>cleanName(value).split(/\s+/).filter(Boolean).map(token=>token[0]).slice(0,2).join('').toUpperCase()||'?';
const eventState=event=>String(event?.evidenceState||event?.state||'UNRESOLVED').toUpperCase();
const eventYear=event=>Number(event?.date?.years?.[0])||Number(String(event?.date?.display||'').match(/\b(1[6-9]\d{2}|20\d{2})\b/)?.[1])||0;
const eventDate=event=>String(event?.date?.display||eventYear(event)||'Date not recorded');
const eventType=event=>String(event?.eventType||event?.category||event?.type||'Family event').replace(/[_-]+/g,' ').trim();
const eventText=event=>String(event?.recordText||event?.sourceSectionTitle||event?.title||event?.event||eventType(event)).replace(/\s+/g,' ').trim();
const eventPlaces=event=>Array.isArray(event?.place)?event.place.map(value=>String(value||'').trim()).filter(Boolean):[];
const normalizedEvents=()=>Array.isArray(model?.normalizedEvents)?model.normalizedEvents:[];
const personBranches=person=>{const values=branchMembership(person);return(values.length?values:[String(person?.branch||'Family').split('/')[0].trim()]).map(cleanBranch).filter(Boolean);};
const publicPeople=()=>displayPeople();
const publicIds=()=>new Set(publicPeople().map(person=>person.id));
const activeRelationships=()=>{const ids=publicIds();return allPedigreeRelationships().filter(rel=>rel.active!==false&&!/REJECTED/i.test(String(rel.state||''))&&ids.has(rel.from)&&ids.has(rel.to));};

export function branchNames(){return[...new Set(publicPeople().flatMap(personBranches))].filter(Boolean).sort((a,b)=>a.localeCompare(b));}
export function branchHref(branch){return`#branch/${encodeURIComponent(branch)}`;}
export function routeBranchName(){
  const raw=location.hash.startsWith('#branch/')?location.hash.slice('#branch/'.length):'';
  let requested='';try{requested=decodeURIComponent(raw);}catch{requested=raw;}
  const match=branchNames().find(branch=>branch.toLocaleLowerCase()===requested.toLocaleLowerCase());
  return match||requested;
}
export const branchMarker=branch=>`branch:${encodeURIComponent(branch||'')}`;

function branchPeople(branch){return publicPeople().filter(person=>personBranches(person).includes(branch));}
function publicDates(person){return person?.living?'Living — details protected':String(person?.dates||'Dates not recorded');}
function safeBranchEvents(branch){
  const members=branchPeople(branch),historicalIds=new Set(members.filter(person=>!person.living).map(person=>person.id));
  return normalizedEvents().filter(event=>{
    if(eventState(event)==='REJECTED'||!event.personIds?.some(id=>historicalIds.has(id)))return false;
    const linked=(event.personIds||[]).map(personById).filter(Boolean);
    return linked.every(person=>!person.living);
  }).sort((a,b)=>(eventYear(a)||9999)-(eventYear(b)||9999));
}
function branchPlaces(branch,limit=6){
  const counts=new Map();for(const event of safeBranchEvents(branch))for(const place of eventPlaces(event))counts.set(place,(counts.get(place)||0)+1);
  return[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([place,count])=>({place,count}));
}
function branchYears(branch){
  const years=[];for(const person of branchPeople(branch).filter(person=>!person.living))for(const year of String(person.dates||'').match(/\b(?:1[6-9]\d{2}|20\d{2})\b/g)||[])years.push(Number(year));
  for(const event of safeBranchEvents(branch)){const year=eventYear(event);if(year)years.push(year);}
  return years.filter(Number.isFinite);
}
function representative(branch){
  const members=branchPeople(branch),ids=new Set(members.map(person=>person.id)),rels=activeRelationships();
  const score=person=>rels.reduce((n,rel)=>n+(rel.from===person.id||rel.to===person.id?1:0)+(ids.has(rel.from)&&ids.has(rel.to)&&(rel.from===person.id||rel.to===person.id)?2:0),0)+(person.living?0:2);
  return members.slice().sort((a,b)=>score(b)-score(a)||String(a.name).localeCompare(String(b.name)))[0]||null;
}
function treeHref(person,scope='family'){
  if(!person)return'#tree';const url=new URL(location.href);for(const key of['q','branch','state','from','to'])url.searchParams.delete(key);url.searchParams.set('focus',person.id);url.searchParams.set('scope',scope);if(scope==='family')url.searchParams.set('depth','3');else url.searchParams.delete('depth');url.hash='tree';return`${url.pathname}${url.search}${url.hash}`;
}
function personCard(person){const photo=person.living?'':` data-ui-person-photo="${esc(person.id)}"`;return`<article class="ui-branch-person"><button type="button" data-person="${esc(person.id)}"><span class="ui-avatar"${photo}>${esc(initials(person.name))}</span><span><small>${esc(personBranches(person).join(' · '))}</small><b>${esc(cleanName(person.name))}</b><em>${esc(publicDates(person))}</em><p>${esc(String(person.role||'Family member'))}</p></span><i aria-hidden="true">→</i></button></article>`;}
function eventCard(event){
  const people=(event.personIds||[]).map(personById).filter(person=>person&&!person.living).slice(0,3).map(person=>cleanName(person.name)).join(' · '),place=eventPlaces(event)[0]||'',state=eventState(event);
  return`<article class="ui-branch-event state-${stateClass(state)}"><time>${esc(eventDate(event))}</time><div><span>${esc(eventType(event))}${state!=='SUPPORTED'?` · ${stateBadges(state)}`:''}</span><h3>${esc(eventText(event))}</h3>${people?`<p>${esc(people)}</p>`:''}${place?`<small>${esc(place)}</small>`:''}</div></article>`;
}
function connectedBranches(branch){
  const ids=new Set(branchPeople(branch).map(person=>person.id)),counts=new Map();
  for(const rel of activeRelationships().filter(rel=>['parent-child','direct-line-succession','spouse'].includes(String(rel.type||'')))){
    const a=ids.has(rel.from),b=ids.has(rel.to);if(a===b)continue;
    const other=personById(a?rel.to:rel.from);for(const name of personBranches(other).filter(name=>name!==branch))counts.set(name,(counts.get(name)||0)+1);
  }
  return[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([name,count])=>({name,count}));
}
function openQuestions(branch){
  const ids=new Set(branchPeople(branch).map(person=>person.id));
  return activeRelationships().filter(rel=>(ids.has(rel.from)||ids.has(rel.to))&&/(PROVISIONAL|UNRESOLVED)/i.test(String(rel.state||''))).slice(0,5);
}
function questionCard(rel){const a=personById(rel.from),b=personById(rel.to);return`<article class="ui-question state-${stateClass(rel.state)}"><span>${esc(String(rel.state||'UNRESOLVED'))}</span><b>${esc(cleanName(a?.name||rel.from))} ↔ ${esc(cleanName(b?.name||rel.to))}</b><p>${esc(String(rel.type||'relationship').replace(/[-_]+/g,' '))}</p></article>`;}
function branchSummary(branch){
  const people=branchPeople(branch),years=branchYears(branch),places=branchPlaces(branch,3),anchor=representative(branch);
  return{people,years,places,anchor,events:safeBranchEvents(branch),connected:connectedBranches(branch),questions:openQuestions(branch)};
}

export function renderFamiliesIndex(){
  const branches=branchNames();
  const cards=branches.map(branch=>{const summary=branchSummary(branch),range=summary.years.length?`${Math.min(...summary.years)}–${Math.max(...summary.years)}`:'Dates vary by person';return`<a class="ui-family-card" href="${branchHref(branch)}"><span class="eyebrow">FAMILY BRANCH</span><h2>${esc(branch)}</h2><p>${summary.people.length} ${summary.people.length===1?'person':'people'} · ${esc(range)}</p>${summary.places[0]?`<small>${esc(summary.places[0].place)}</small>`:''}<b>Explore branch →</b></a>`;}).join('');
  return`<div class="ui-native ui-families" data-ui-native="families"><header class="ui-families-hero"><div><p class="eyebrow">CONNECTED FAMILY LINES</p><h1>Explore the family by branch.</h1><p>Each branch brings together its people, family connections, supported chronology, places, and unresolved questions without flattening the evidence behind them.</p></div><a class="action primary" href="#tree">View connected tree</a></header><section class="ui-family-grid" aria-label="Family branches">${cards}</section><section class="ui-research-door"><div><p class="eyebrow">EVIDENCE & RESEARCH</p><h2>Branch stories stay tied to the record.</h2><p>Provisional and unresolved relationships remain visibly qualified. Rejected relationships never become active family connections.</p></div><a class="action" href="#research">Open Research Center ↗</a></section></div>`;
}

export function renderFamilyBranch(branch=routeBranchName()){
  const valid=branchNames().includes(branch);if(!valid)return`<div class="ui-native ui-branch" data-ui-native="${branchMarker(branch)}"><section class="empty"><h1>Family branch not found</h1><p>This branch is not present in the public-safe family directory.</p><a class="action" href="#families">Browse family branches</a></section></div>`;
  const summary=branchSummary(branch),range=summary.years.length?`${Math.min(...summary.years)}–${Math.max(...summary.years)}`:'Dates vary by person',anchor=summary.anchor;
  const historical=summary.people.filter(person=>!person.living),featured=[...(anchor?[anchor]:[]),...historical.filter(person=>person.id!==anchor?.id),...summary.people.filter(person=>person.id!==anchor?.id&&!historical.includes(person))].slice(0,6);
  const timeline=summary.events.filter(event=>eventState(event)==='SUPPORTED').slice(0,8);
  return`<div class="ui-native ui-branch" data-ui-native="${branchMarker(branch)}"><nav class="ui-branch-back" aria-label="Family branch breadcrumb"><a href="#families">All families</a><span aria-hidden="true">/</span><b>${esc(branch)}</b></nav><header class="ui-branch-hero"><div><p class="eyebrow">${esc(branch.toUpperCase())} FAMILY</p><h1>${esc(branch)} family</h1><p>${summary.people.length} ${summary.people.length===1?'person':'people'} in the public-safe archive · ${esc(range)}.</p><div class="ui-branch-card-actions">${anchor?`<a class="action primary" href="${esc(treeHref(anchor,'family'))}">View ${esc(branch)} family in tree</a>`:''}<a class="action" href="#media">Browse photos & documents</a></div></div><div class="ui-branch-metrics"><span><b>${summary.people.length}</b><small>people</small></span><span><b>${summary.events.length}</b><small>linked records</small></span><span><b>${summary.connected.length}</b><small>connected branches</small></span></div></header>${featured.length?`<section class="ui-branch-section"><div class="ui-section-head"><div><p class="eyebrow">PEOPLE</p><h2>People in the ${esc(branch)} family</h2><p>Open a person to follow their immediate family, chronology, places, photographs, and source-backed record.</p></div><a href="#" data-v175-people-link="${esc(branch)}">Browse directory ↗</a></div><div class="ui-branch-people">${featured.map(personCard).join('')}</div></section>`:''}${timeline.length?`<section class="ui-branch-section"><div class="ui-section-head"><div><p class="eyebrow">FAMILY STORY</p><h2>Supported moments in this branch</h2><p>Only public-safe, non-rejected records are surfaced here; qualified evidence remains qualified elsewhere in the archive.</p></div><a href="#timeline">Full timeline ↗</a></div><div class="ui-branch-timeline">${timeline.map(eventCard).join('')}</div></section>`:''}${summary.places.length?`<section class="ui-branch-section"><div class="ui-section-head"><div><p class="eyebrow">PLACES</p><h2>Places in the ${esc(branch)} family story</h2></div><a href="#migration">Explore places ↗</a></div><div class="ui-place-grid">${summary.places.map(({place,count})=>`<a href="#migration"><b>${esc(place)}</b><small>${count} linked public-safe record${count===1?'':'s'}</small></a>`).join('')}</div></section>`:''}${summary.connected.length?`<section class="ui-branch-section"><div class="ui-section-head"><div><p class="eyebrow">CONNECTED FAMILIES</p><h2>Where this branch connects</h2></div><a href="#families">All families ↗</a></div><div class="ui-connected-grid">${summary.connected.slice(0,8).map(({name,count})=>`<a href="${branchHref(name)}"><b>${esc(name)}</b><small>${count} active family connection${count===1?'':'s'}</small></a>`).join('')}</div></section>`:''}${summary.questions.length?`<section class="ui-branch-section ui-open-questions"><div class="ui-section-head"><div><p class="eyebrow">OPEN QUESTIONS</p><h2>Still being resolved</h2><p>These relationships remain provisional or unresolved. This page does not promote them.</p></div><a href="#research">Research Center ↗</a></div><div class="ui-question-grid">${summary.questions.map(questionCard).join('')}</div></section>`:''}<section class="ui-research-door"><div><p class="eyebrow">RESEARCH CENTER</p><h2>See the evidence behind the ${esc(branch)} family.</h2><p>Sources, evidence states, conflicts, negative searches, and acquisition targets remain available in the research workspace.</p></div><a class="action" href="#research">Open Research Center ↗</a></section></div>`;
}

function updatePeopleDirectoryLink(){
  const link=document.querySelector('[data-v175-people-link]');if(!link)return;const branch=link.dataset.v175PeopleLink,url=new URL(location.href);for(const key of['q','state','focus','scope','depth','from','to'])url.searchParams.delete(key);url.searchParams.set('branch',branch);url.hash='people';link.setAttribute('href',`${url.pathname}${url.search}${url.hash}`);
}
function promoteHomeBranchLinks(){document.querySelectorAll('.ui-branch-card').forEach(link=>{const branch=link.querySelector('span')?.textContent?.trim();if(branch&&branchNames().includes(branch))link.setAttribute('href',branchHref(branch));});}
function promoteHomeHeading(){const heading=document.querySelector('.ui-family-home-hero h2');if(heading){heading.setAttribute('role','heading');heading.setAttribute('aria-level','1');}}
function apply(){promoteHomeBranchLinks();updatePeopleDirectoryLink();promoteHomeHeading();}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}
window.addEventListener('family-native-rendered',schedule);window.addEventListener('family-view-rendered',schedule);window.addEventListener('hashchange',schedule);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
