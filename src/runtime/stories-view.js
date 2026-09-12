import{model,personById,esc}from'../../core.js';

const events=()=>Array.isArray(model?.normalizedEvents)?model.normalizedEvents:[];
const yearOf=e=>Number(e?.year)||Number(String(e?.date||'').match(/\b(1[6-9]\d{2}|20\d{2})\b/)?.[1])||0;
const titleOf=e=>String(e?.title||e?.event||e?.type||'Family record').trim();
const placesOf=e=>Array.isArray(e?.place)?e.place.map(v=>String(v||'').trim()).filter(Boolean):[];
const peopleOf=e=>(e?.personIds||[]).map(personById).filter(Boolean);
const decadeOf=year=>year?`${Math.floor(year/10)*10}s`:'Undated';

function card(event){
  const year=yearOf(event),people=peopleOf(event),places=placesOf(event);
  const names=people.slice(0,3).map(p=>p.name.replace(/\s*\/.*$/,'')).join(' · ');
  const sourceIds=[...new Set(String(JSON.stringify(event)).match(/\b[CWV]\d{3}\b/g)||[])];
  return`<article class="v16-story-card"><div class="v16-story-year">${year||'—'}</div><div><p class="eyebrow">${esc(event?.category||event?.type||'FAMILY RECORD')}</p><h3>${esc(titleOf(event))}</h3>${names?`<p class="v16-story-people">${esc(names)}</p>`:''}${places.length?`<p class="v16-story-place">${esc(places.slice(0,2).join(' → '))}</p>`:''}${sourceIds.length?`<small>Source reference ${esc(sourceIds.join(' · '))}</small>`:'<small>Source-controlled event from the canonical research model</small>'}</div></article>`;
}

export function renderStories(){
  const rows=events().filter(e=>yearOf(e)||peopleOf(e).length||placesOf(e).length).sort((a,b)=>yearOf(a)-yearOf(b));
  const groups=new Map();
  for(const event of rows){const decade=decadeOf(yearOf(event));if(!groups.has(decade))groups.set(decade,[]);groups.get(decade).push(event);}
  const chapters=[...groups.entries()].filter(([,items])=>items.length).slice(-8).reverse();
  return`<section class="v16-stories" aria-labelledby="stories-title"><header class="v16-stories-hero"><p class="eyebrow">FAMILY STORIES</p><h2 id="stories-title">Stories from the family record</h2><p>Source-controlled highlights grouped by era. These summaries stay close to recorded events and do not turn provisional or unresolved research into established family history.</p></header>${chapters.length?chapters.map(([decade,items])=>`<section class="v16-story-chapter"><div class="v16-story-chapter-heading"><span>${esc(decade)}</span><h3>${items.length} recorded ${items.length===1?'event':'events'}</h3></div><div class="v16-story-list">${items.slice(0,8).map(card).join('')}</div></section>`).join(''):'<div class="empty">No source-controlled story events are available yet.</div>'}</section>`;
}
