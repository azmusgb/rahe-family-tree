import{model,personById,esc}from'../../core.js';

const events=()=>Array.isArray(model?.normalizedEvents)?model.normalizedEvents:[];
const dateYears=e=>Array.isArray(e?.date?.years)?e.date.years.map(Number).filter(Number.isFinite):[];
const yearOf=e=>dateYears(e)[0]||Number(e?.year)||Number(String(e?.date?.display||'').match(/\b(1[6-9]\d{2}|20\d{2})\b/)?.[1])||0;
const displayDate=e=>String(e?.date?.display||yearOf(e)||'Date not recorded').trim();
const eventTypeOf=e=>String(e?.eventType||e?.category||e?.type||'Family record').replace(/[_-]+/g,' ').trim();
const recordTextOf=e=>String(e?.recordText||e?.sourceSectionTitle||e?.title||e?.event||'').replace(/\s+/g,' ').trim();
const titleOf=e=>recordTextOf(e)||eventTypeOf(e)||'Family record';
const placesOf=e=>Array.isArray(e?.place)?e.place.map(v=>String(v||'').trim()).filter(Boolean):[];
const peopleOf=e=>(e?.personIds||[]).map(personById).filter(Boolean);
const decadeOf=year=>year?`${Math.floor(year/10)*10}s`:'Undated';
const evidenceStateOf=e=>String(e?.evidenceState||e?.state||'UNRESOLVED').trim().toUpperCase();
const stateClass=state=>`state-${String(state||'unresolved').toLowerCase().replace(/[^a-z]+/g,'-')}`;

function sourceRefs(event){
  const explicit=[event?.sourceId,...(Array.isArray(event?.sourceIds)?event.sourceIds:[])].filter(Boolean).map(String);
  const embedded=String(JSON.stringify(event)).match(/\b[CWV]\d{3}\b/g)||[];
  return[...new Set([...explicit,...embedded])];
}

function card(event){
  const year=yearOf(event),people=peopleOf(event),places=placesOf(event),state=evidenceStateOf(event),sourceIds=sourceRefs(event);
  const names=people.slice(0,3).map(p=>p.name.replace(/\s*\/.*$/,'')).join(' · ');
  return`<article class="v16-story-card ${stateClass(state)}"><div class="v16-story-year">${esc(year||'—')}</div><div><div class="v16-story-kicker"><p class="eyebrow">${esc(eventTypeOf(event).toUpperCase())}</p><span class="v16-story-state ${stateClass(state)}">${esc(state)}</span></div><h3>${esc(titleOf(event))}</h3><p class="v16-story-date">${esc(displayDate(event))}</p>${names?`<p class="v16-story-people">${esc(names)}</p>`:''}${places.length?`<p class="v16-story-place">${esc(places.slice(0,2).join(' → '))}</p>`:''}${sourceIds.length?`<small>Source reference ${esc(sourceIds.join(' · '))}</small>`:'<small>Source-controlled event from the canonical research model</small>'}</div></article>`;
}

export function renderStories(){
  const rows=events().filter(e=>evidenceStateOf(e)!=='REJECTED').filter(e=>yearOf(e)||recordTextOf(e)||peopleOf(e).length||placesOf(e).length).sort((a,b)=>yearOf(a)-yearOf(b));
  const groups=new Map();
  for(const event of rows){const decade=decadeOf(yearOf(event));if(!groups.has(decade))groups.set(decade,[]);groups.get(decade).push(event);}
  const chapters=[...groups.entries()].filter(([,items])=>items.length).slice(-8).reverse();
  return`<section class="v16-stories" aria-labelledby="stories-title"><header class="v16-stories-hero"><p class="eyebrow">FAMILY STORIES</p><h2 id="stories-title">Stories from the family record</h2><p>Source-controlled highlights grouped by era. Provisional and unresolved events keep their evidence qualification visible, while rejected research stays in the Research Center rather than the family story.</p></header>${chapters.length?chapters.map(([decade,items])=>`<section class="v16-story-chapter"><div class="v16-story-chapter-heading"><span>${esc(decade)}</span><h3>${items.length} recorded ${items.length===1?'event':'events'}</h3></div><div class="v16-story-list">${items.slice(0,8).map(card).join('')}</div></section>`).join(''):'<div class="empty">No source-controlled story events are available yet.</div>'}</section>`;
}
