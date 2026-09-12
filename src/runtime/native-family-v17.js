import{model,displayPeople,allPedigreeRelationships,personById,matches,matchesBranch,branchMembership,currentFilters,esc,stateClass,stateBadges}from'../../core.js';

const cleanName=value=>String(value||'').replace(/\s*\/.*$/,'').trim();
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();
const initials=value=>cleanName(value).split(/\s+/).filter(Boolean).map(token=>token[0]).slice(0,2).join('').toUpperCase()||'?';
const normalizedEvents=()=>Array.isArray(model?.normalizedEvents)?model.normalizedEvents:[];
const eventState=event=>String(event?.evidenceState||event?.state||'UNRESOLVED').toUpperCase();
const eventYear=event=>Number(event?.date?.years?.[0])||Number(String(event?.date?.display||'').match(/\b(1[6-9]\d{2}|20\d{2})\b/)?.[1])||0;
const eventDate=event=>String(event?.date?.display||eventYear(event)||'Date not recorded');
const eventType=event=>String(event?.eventType||event?.category||event?.type||'Family event').replace(/[_-]+/g,' ').trim();
const eventText=event=>String(event?.recordText||event?.sourceSectionTitle||event?.title||event?.event||eventType(event)).replace(/\s+/g,' ').trim();
const eventPlaces=event=>Array.isArray(event?.place)?event.place.map(value=>String(value||'').trim()).filter(Boolean):[];
const publicDates=person=>person?.living?'Living — details protected':String(person?.dates||'Dates not recorded');
const displayedIds=()=>new Set(displayPeople().map(person=>person.id));
const activeRelationships=()=>{const ids=displayedIds();return allPedigreeRelationships().filter(rel=>rel.active!==false&&!/REJECTED/i.test(String(rel.state||''))&&ids.has(rel.from)&&ids.has(rel.to));};
const uniquePeople=rows=>[...new Map(rows.filter(Boolean).map(person=>[person.id,person])).values()];

function directFamily(person){
  if(!person)return{parents:[],spouses:[],children:[],siblings:[]};
  const rels=activeRelationships();
  const parents=uniquePeople(rels.filter(rel=>rel.type==='parent-child'&&rel.to===person.id).map(rel=>personById(rel.from)));
  const children=uniquePeople(rels.filter(rel=>rel.type==='parent-child'&&rel.from===person.id).map(rel=>personById(rel.to)));
  const spouses=uniquePeople(rels.filter(rel=>/spouse|marriage|partner/i.test(String(rel.type||''))&&(rel.from===person.id||rel.to===person.id)).map(rel=>personById(rel.from===person.id?rel.to:rel.from)));
  const parentIds=new Set(parents.map(parent=>parent.id));
  const siblings=uniquePeople(rels.filter(rel=>rel.type==='parent-child'&&parentIds.has(rel.from)&&rel.to!==person.id).map(rel=>personById(rel.to)));
  return{parents,spouses,children,siblings};
}

function personBranch(person){return branchMembership(person)[0]||cleanBranch(person?.branch);}
function personEvents(person,{limit=Infinity,supportedOnly=false}={}){
  if(!person)return[];
  return normalizedEvents().filter(event=>(event.personIds||[]).includes(person.id)&&!/REJECTED/i.test(eventState(event))&&(!supportedOnly||eventState(event)==='SUPPORTED')).sort((a,b)=>(eventYear(a)||9999)-(eventYear(b)||9999)).slice(0,limit);
}
function personPlaces(person,limit=3){
  if(!person||person.living)return[];
  const counts=new Map();
  for(const event of personEvents(person))for(const place of eventPlaces(event))counts.set(place,(counts.get(place)||0)+1);
  return[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([place])=>place);
}
function relationshipLine(person){
  const family=directFamily(person);
  if(family.parents.length)return`Child of ${family.parents.slice(0,2).map(parent=>cleanName(parent.name)).join(' & ')}`;
  if(family.spouses.length)return`Spouse / partner of ${cleanName(family.spouses[0].name)}`;
  if(family.children.length)return`Parent of ${family.children.slice(0,2).map(child=>cleanName(child.name)).join(' & ')}${family.children.length>2?'…':''}`;
  return String(person?.role||'Family member');
}
function treeHref(id,scope='family'){
  const url=new URL(location.href);
  for(const key of['q','branch','state','from','to'])url.searchParams.delete(key);
  url.searchParams.set('focus',id);url.searchParams.set('scope',scope);url.hash='tree';
  return`${url.pathname}${url.search}${url.hash}`;
}
function personButton(person,label=''){
  if(!person)return'';
  return`<button type="button" class="v17-relative" data-person="${esc(person.id)}"><span class="v17-avatar small" data-v17-person-photo="${esc(person.id)}">${esc(initials(person.name))}</span><span>${label?`<small>${esc(label)}</small>`:''}<b>${esc(cleanName(person.name))}</b><em>${esc(publicDates(person))}</em></span></button>`;
}
function familyGroup(label,people){return people.length?`<section class="v17-family-group"><h3>${esc(label)}</h3><div class="v17-family-group-grid">${people.map(person=>personButton(person)).join('')}</div></section>`:'';}

function branchNames(){
  const branches=new Set();
  for(const person of displayPeople()){
    const membership=branchMembership(person);
    if(membership.length)membership.forEach(branch=>branches.add(branch));else branches.add(cleanBranch(person.branch));
  }
  return[...branches].filter(Boolean).sort();
}
function branchSummary(branch){
  const people=displayPeople().filter(person=>matchesBranch(person,branch));
  const historical=people.filter(person=>!person.living),ids=new Set(historical.map(person=>person.id)),years=[],places=new Map();
  for(const person of historical)for(const year of String(person.dates||'').match(/\b(?:1[6-9]\d{2}|20\d{2})\b/g)||[])years.push(Number(year));
  for(const event of normalizedEvents()){
    if(!event.personIds?.some(id=>ids.has(id)))continue;
    if(eventState(event)==='REJECTED')continue;
    for(const place of eventPlaces(event))places.set(place,(places.get(place)||0)+1);
  }
  return{people,historical,years:years.filter(Number.isFinite),places:[...places].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([place])=>place)};
}

function meaningfulMoments(limit=3){
  const rows=[],seen=new Set();
  for(const event of normalizedEvents().filter(event=>eventState(event)==='SUPPORTED'&&eventYear(event)&&eventText(event)&&((event.personIds||[]).map(personById).filter(Boolean).every(person=>!person.living))).sort((a,b)=>eventYear(b)-eventYear(a))){
    const key=`${eventYear(event)}|${eventType(event)}|${(event.personIds||[]).join(',')}`;
    if(seen.has(key))continue;seen.add(key);rows.push(event);if(rows.length>=limit)break;
  }
  return rows;
}
function topFamilyPlaces(limit=5){
  const counts=new Map();
  for(const event of normalizedEvents()){
    if(eventState(event)!=='SUPPORTED')continue;
    const people=(event.personIds||[]).map(personById).filter(Boolean);if(people.some(person=>person.living))continue;
    for(const place of eventPlaces(event))counts.set(place,(counts.get(place)||0)+1);
  }
  return[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([place])=>place);
}
function anchorPerson(){const people=displayPeople();return people.find(person=>/William John Rahe Sr\.?/i.test(person.name))||people.find(person=>personBranch(person)==='Rahe'&&!person.living)||people[0]||null;}
function homeTreePreview(){
  const focus=anchorPerson();if(!focus)return'';
  const family=directFamily(focus),parents=family.parents.slice(0,2),spouse=family.spouses[0],children=family.children.slice(0,3);
  return`<section class="v17-home-tree" aria-labelledby="v17-tree-preview-title"><div class="v17-section-head"><div><p class="eyebrow">FAMILY CONNECTIONS</p><h2 id="v17-tree-preview-title">See how the family connects</h2></div><a href="#tree">Explore the full tree ↗</a></div><div class="v17-home-tree-canvas">${parents.length?`<div class="v17-home-tree-row parents">${parents.map(parent=>personButton(parent,'Parent')).join('')}</div><i aria-hidden="true"></i>`:''}<div class="v17-home-tree-row focus">${personButton(focus,'Focus')}${spouse?personButton(spouse,'Spouse / partner'):''}</div>${children.length?`<i aria-hidden="true"></i><div class="v17-home-tree-row children">${children.map(child=>personButton(child,'Child')).join('')}</div>`:''}</div></section>`;
}
function homeMomentCard(event,index){
  const people=(event.personIds||[]).map(personById).filter(Boolean).slice(0,2).map(person=>cleanName(person.name)).join(' · '),place=eventPlaces(event)[0]||'';
  return`<article class="v17-story-moment ${index===0?'featured':''}"><time>${esc(eventYear(event))}</time><div><span>${esc(eventType(event))}</span><h3>${esc(eventText(event))}</h3>${people?`<p>${esc(people)}</p>`:''}${place?`<small>${esc(place)}</small>`:''}</div></article>`;
}
function homePersonCard(person){return`<article class="v17-home-person"><button type="button" data-person="${esc(person.id)}"><span class="v17-avatar" data-v17-person-photo="${esc(person.id)}">${esc(initials(person.name))}</span><span><small>${esc(personBranch(person))}</small><b>${esc(cleanName(person.name))}</b><em>${esc(publicDates(person))}</em><p>${esc(relationshipLine(person))}</p></span><i aria-hidden="true">→</i></button></article>`;}

export function renderNativeHome(){
  const people=displayPeople(),branches=branchNames(),rels=activeRelationships(),moments=meaningfulMoments(3),places=topFamilyPlaces();
  const historical=people.filter(person=>!person.living),featured=[...historical.filter(person=>/William John Rahe Sr\.?/i.test(person.name)),...historical.filter(person=>/Hazel Emma Berg/i.test(person.name)),...historical.filter(person=>/Sarah.*Ferry/i.test(person.name)),...historical].filter((person,index,rows)=>rows.findIndex(row=>row.id===person.id)===index).slice(0,6);
  return`<div class="v17-native v17-home" data-v17-native="home"><section class="v17-home-hero"><div><p class="eyebrow">THE RAHE FAMILY</p><h2>The Rahe family, connected.</h2><p>Explore the people, relationships, photographs, places, and stories preserved in the family archive.</p><div class="v17-primary-actions"><a class="action primary" href="#tree">Explore family tree</a><a class="action" href="#people">Browse people</a><a class="action" href="#media">Photos & documents</a></div><div class="v17-home-metrics"><span><b>${people.length}</b><small>people</small></span><span><b>${branches.length}</b><small>branches</small></span><span><b>${rels.length}</b><small>family connections</small></span></div></div></section>${homeTreePreview()}${moments.length?`<section class="v17-home-story"><div class="v17-section-head"><div><p class="eyebrow">FROM THE FAMILY STORY</p><h2>Across generations and places</h2><p>Supported moments drawn from the source-controlled family record.</p></div><a href="#stories">Explore all stories ↗</a></div><div class="v17-story-moments">${moments.map(homeMomentCard).join('')}</div>${places.length?`<div class="v17-place-strip"><span>Places in the family story</span>${places.map(place=>`<a href="#migration">${esc(place)}</a>`).join('')}</div>`:''}</section>`:''}<section class="v17-featured-people"><div class="v17-section-head"><div><p class="eyebrow">PEOPLE</p><h2>Meet the family</h2></div><a href="#people">Browse everyone ↗</a></div><div class="v17-home-people-grid">${featured.map(homePersonCard).join('')}</div></section><section class="v17-home-media" data-v17-home-gallery hidden></section><section class="v17-research-door"><div><p class="eyebrow">RESEARCH CENTER</p><h2>How do we know?</h2><p>Sources, evidence states, unresolved identities, conflicts, and research targets live in the dedicated research workspace.</p></div><a class="action" href="#research">Open Research Center ↗</a></section></div>`;
}

function branchChip(branch,selected){return`<button type="button" class="v17-branch-chip ${selected===branch?'active':''}" data-branch="${esc(branch)}" aria-pressed="${selected===branch?'true':'false'}">${esc(branch)}</button>`;}
function peopleCard(person){return`<article class="v17-person-card"><button type="button" data-person="${esc(person.id)}"><span class="v17-avatar" data-v17-person-photo="${esc(person.id)}">${esc(initials(person.name))}</span><span class="v17-person-card-copy"><small>${esc(personBranch(person))}</small><b>${esc(cleanName(person.name))}</b><em>${esc(publicDates(person))}</em><p>${esc(relationshipLine(person))}</p></span><i aria-hidden="true">→</i></button></article>`;}
export function renderNativePeople(){
  const all=displayPeople(),people=all.filter(matches),branches=branchNames(),selected=currentFilters().branch,summary=selected?branchSummary(selected):null;
  return`<div class="v17-native v17-people" data-v17-native="people"><header class="v17-page-intro"><div><p class="eyebrow">FAMILY DIRECTORY</p><h2>Meet the people in the family</h2><p>Browse relatives by name or branch, then open a person to follow their family, places, life events, and photographs.</p></div><span><b>${people.length}</b><small>${selected?'in this branch':'people shown'}</small></span></header><nav class="v17-branch-browser" aria-label="Browse people by family branch"><button type="button" class="v17-branch-chip ${selected?'':'active'}" data-branch="" aria-pressed="${selected?'false':'true'}">All</button>${branches.map(branch=>branchChip(branch,selected)).join('')}</nav>${summary?`<section class="v17-branch-summary"><div><p class="eyebrow">${esc(selected.toUpperCase())} FAMILY</p><h3>${summary.people.length} ${summary.people.length===1?'person':'people'} in this branch</h3><p>${summary.years.length?`${Math.min(...summary.years)}–${Math.max(...summary.years)}`:'Dates vary by person'}${summary.places.length?` · ${esc(summary.places.join(' · '))}`:''}</p></div><div><a href="#stories">Stories</a><a href="#migration">Places</a></div></section>`:''}<div class="v17-people-grid">${people.map(peopleCard).join('')}</div>${people.length?`<p class="v17-directory-foot">Showing ${people.length} of ${all.length} people in the public-safe family directory.</p>`:'<div class="empty">No people match the current filters.</div>'}</div>`;
}

function timelineCard(event){
  const state=eventState(event),place=eventPlaces(event)[0]||'',qualified=state!=='SUPPORTED';
  return`<article class="v17-life-event state-${stateClass(state)}"><time>${esc(eventDate(event))}</time><div><span>${esc(eventType(event))}${qualified?` · ${stateBadges(state)}`:''}</span><h3>${esc(eventText(event))}</h3>${place?`<p>${esc(place)}</p>`:''}</div></article>`;
}
function researchCounts(person){
  const rels=activeRelationships().filter(rel=>rel.from===person.id||rel.to===person.id),claims=(model.claims||[]).filter(claim=>(claim.peopleIds||[]).includes(person.id)),sourceIds=new Set([...rels.flatMap(rel=>rel.sourceIds||[]),...claims.flatMap(claim=>claim.sourceIds||[])]);return{relationships:rels.length,claims:claims.length,sources:sourceIds.size};
}
export function renderNativePerson(id){
  const person=personById(id);if(!person)return'<div class="empty">Person not found.</div>';
  const family=directFamily(person),events=personEvents(person,{limit:10}),places=personPlaces(person,4),counts=researchCounts(person),branch=personBranch(person),state=String(person.state||'').toUpperCase(),qualified=!state.includes('SUPPORTED');
  return`<div class="v17-native v17-person" data-v17-native="person" data-person-id="${esc(person.id)}"><a class="v17-back" href="#people">← People</a><header class="v17-person-header"><span class="v17-avatar hero" data-v17-person-photo="${esc(person.id)}">${esc(initials(person.name))}</span><div><p class="eyebrow">${esc(branch)} FAMILY</p><h2>${esc(cleanName(person.name))}</h2><p class="v17-person-dates">${esc(publicDates(person))}</p><p class="v17-person-context">${esc([person.role,...places.slice(0,1)].filter(Boolean).join(' · ')||'Family member')}</p>${qualified?`<div class="v17-qualified-state">Research status ${stateBadges(person.state)} ${esc(person.state)}</div>`:''}<div class="v17-person-actions"><a class="action primary" href="${esc(treeHref(person.id))}">View in family tree</a><a class="action" href="#media">Browse family photos</a></div></div></header><nav class="v17-person-nav" aria-label="Person page sections"><a href="#v17-family">Family</a><a href="#v17-life">Life</a><a href="#v17-photos">Photos</a><a href="#v17-research">Research</a></nav><section id="v17-family" class="v17-person-section"><div class="v17-section-head"><div><p class="eyebrow">FAMILY</p><h2>Immediate family</h2></div><a href="${esc(treeHref(person.id))}">View in tree ↗</a></div><div class="v17-family-groups">${familyGroup('Parents',family.parents)}${familyGroup('Spouse / partner',family.spouses)}${familyGroup('Children',family.children)}${familyGroup('Siblings',family.siblings.slice(0,6))}</div></section><section id="v17-life" class="v17-person-section"><div class="v17-section-head"><div><p class="eyebrow">LIFE</p><h2>Life and places</h2><p>${person.living?'Public view protects birth and location details for living family members.':'Chronology shown from source-controlled family records; qualified events remain visibly qualified.'}</p></div></div>${!person.living&&places.length?`<div class="v17-person-places">${places.map(place=>`<a href="#migration">${esc(place)}</a>`).join('')}</div>`:''}${events.length?`<div class="v17-life-timeline">${events.map(timelineCard).join('')}</div>`:'<p class="muted">No public-safe timeline events are currently linked to this person.</p>'}</section><section id="v17-photos" class="v17-person-section"><div class="v17-section-head"><div><p class="eyebrow">PHOTOS & DOCUMENTS</p><h2>Family archive</h2></div><a href="#media">Browse all media ↗</a></div><div class="v17-person-gallery" data-v17-person-gallery="${esc(person.id)}"><p class="muted">Loading public-safe family media…</p></div></section><section id="v17-research" class="v17-person-research"><div><p class="eyebrow">RESEARCH CENTER</p><h2>The records behind this person</h2><p>${counts.claims} linked claim${counts.claims===1?'':'s'} · ${counts.sources} source${counts.sources===1?'':'s'} · ${counts.relationships} family relationship${counts.relationships===1?'':'s'}. Evidence states remain source-controlled.</p></div><a class="action" href="#research">Open Research Center ↗</a></section></div>`;
}

export function wrapNativeTree(html){return`<div class="v17-native v17-tree" data-v17-native="tree">${html}</div>`;}

let mediaPromise=null;
function publicMedia(){
  if(!mediaPromise)mediaPromise=fetch('/api/media',{credentials:'same-origin',cache:'no-store'}).then(response=>response.ok?response.json():{media:[]}).then(data=>(data.media||[]).filter(item=>item.visibility==='public')).catch(()=>[]);
  return mediaPromise;
}
function imageForPerson(media,id){return media.filter(item=>String(item.mime||'').startsWith('image/')&&(item.personIds||[]).includes(id)).sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)))[0]||null;}
export async function hydrateNativeFamily(){
  const root=document.querySelector('#content [data-v17-native]');if(!root)return;
  const media=await publicMedia();
  root.querySelectorAll('[data-v17-person-photo]').forEach(host=>{const item=imageForPerson(media,host.dataset.v17PersonPhoto);if(!item||host.querySelector('img'))return;host.textContent='';const image=document.createElement('img');image.src=`/api/media?file=${encodeURIComponent(item.id)}`;image.alt='';image.loading='lazy';image.decoding='async';host.append(image);});
  const homeGallery=root.querySelector('[data-v17-home-gallery]');
  if(homeGallery){const images=media.filter(item=>String(item.mime||'').startsWith('image/')).sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured))).slice(0,4);if(images.length){homeGallery.hidden=false;homeGallery.innerHTML=`<div class="v17-section-head"><div><p class="eyebrow">FAMILY PHOTOS</p><h2>Faces and moments from the archive</h2></div><a href="#media">Browse all media ↗</a></div><div class="v17-home-gallery-grid">${images.map(item=>`<a href="#media"><img src="/api/media?file=${encodeURIComponent(item.id)}" alt="${esc(item.caption||item.title||'Family photograph')}" loading="lazy" decoding="async"><span><b>${esc(item.title||'Family photograph')}</b><small>${esc([item.eventDate,typeof item.location==='string'?item.location:''].filter(Boolean).join(' · ')||'Family archive')}</small></span></a>`).join('')}</div>`;}}
  const personGallery=root.querySelector('[data-v17-person-gallery]');
  if(personGallery){const id=personGallery.dataset.v17PersonGallery,items=media.filter(item=>(item.personIds||[]).includes(id)).slice(0,8);personGallery.innerHTML=items.length?items.map(item=>{const image=String(item.mime||'').startsWith('image/');return`<a class="v17-gallery-item" href="#media">${image?`<img src="/api/media?file=${encodeURIComponent(item.id)}" alt="${esc(item.caption||item.title||'Family photograph')}" loading="lazy" decoding="async">`:'<span class="v17-document-mark" aria-hidden="true">DOC</span>'}<span><b>${esc(item.title||'Family record')}</b><small>${esc([item.eventDate,typeof item.location==='string'?item.location:''].filter(Boolean).join(' · ')||'Family archive')}</small></span></a>`;}).join(''):'<p class="muted">No public media is currently linked to this person.</p>';}
}

window.addEventListener('family-media-changed',()=>{mediaPromise=null;hydrateNativeFamily();});
window.addEventListener('family-auth-changed',()=>{mediaPromise=null;hydrateNativeFamily();});
