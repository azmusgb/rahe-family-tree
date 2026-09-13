// v17.3 Person Experience — biography-first progressive enhancement for the
// native Family person route. This layer is presentation-only: it reads the
// canonical model and never mutates people, relationships, claims, or states.
import{model,personById,esc}from'../../core.js';

const routePersonId=()=>location.hash.startsWith('#person/')?location.hash.split('/')[1]||'':'';
const isFamily=()=>document.body.dataset.experience!=='research';
const eventState=event=>String(event?.evidenceState||event?.state||'UNRESOLVED').toUpperCase();
const eventYear=event=>Number(event?.date?.years?.[0])||Number(String(event?.date?.display||'').match(/\b(1[6-9]\d{2}|20\d{2})\b/)?.[1])||0;
const eventDate=event=>String(event?.date?.display||eventYear(event)||'Date not recorded');
const eventType=event=>String(event?.eventType||event?.category||event?.type||'Family event').replace(/[_-]+/g,' ').trim();
const eventText=event=>String(event?.recordText||event?.sourceSectionTitle||event?.title||event?.event||eventType(event)).replace(/\s+/g,' ').trim();
const eventPlace=event=>Array.isArray(event?.place)?String(event.place.find(Boolean)||'').trim():String(event?.place||'').trim();
const linksLivingPerson=event=>(event?.personIds||[]).some(id=>personById(id)?.living);
const cssEscape=value=>globalThis.CSS?.escape?CSS.escape(value):String(value).replace(/[^a-zA-Z0-9_-]/g,char=>`\\${char}`);

function supportedMoments(person,limit=4){
  if(!person||person.living)return[];
  return(Array.isArray(model?.normalizedEvents)?model.normalizedEvents:[])
    .filter(event=>(event.personIds||[]).includes(person.id)&&!linksLivingPerson(event)&&eventState(event)==='SUPPORTED'&&eventText(event))
    .sort((a,b)=>(eventYear(a)||9999)-(eventYear(b)||9999))
    .slice(0,limit);
}
function momentCard(event){
  const place=eventPlace(event);
  return`<article class="v173-story-moment"><time>${esc(eventDate(event))}</time><div><span>${esc(eventType(event))}</span><h3>${esc(eventText(event))}</h3>${place?`<p>${esc(place)}</p>`:''}</div></article>`;
}
function storyMarkup(person){
  const moments=supportedMoments(person);
  if(person.living)return`<section id="v17-story" class="v173-person-story living" aria-labelledby="v173-story-title"><div class="v173-story-copy"><p class="eyebrow">LIFE STORY</p><h2 id="v173-story-title">Part of the living family</h2><p>This public profile keeps private chronology and location details protected while preserving documented family connections.</p></div></section>`;
  if(!moments.length)return`<section id="v17-story" class="v173-person-story quiet" aria-labelledby="v173-story-title"><div class="v173-story-copy"><p class="eyebrow">LIFE STORY</p><h2 id="v173-story-title">A place in the family story</h2><p>No supported public-safe life moments are currently linked closely enough to feature here. Family connections and qualified chronology remain available below.</p></div></section>`;
  return`<section id="v17-story" class="v173-person-story" aria-labelledby="v173-story-title"><div class="v173-story-copy"><p class="eyebrow">LIFE STORY</p><h2 id="v173-story-title">A life in the family record</h2><p>Selected supported moments from the source-controlled archive introduce this person before the full chronology and research detail.</p></div><div class="v173-story-moments">${moments.map(momentCard).join('')}</div></section>`;
}
function makeResearchProgressive(root){
  const research=root.querySelector('#v17-research');
  if(!research||research.querySelector('.v173-research-details'))return;
  const original=[...research.children];
  const details=document.createElement('details');
  details.className='v173-research-details';
  const summary=document.createElement('summary');
  summary.innerHTML='<span><small>RESEARCH & EVIDENCE</small><b>See the records behind this person</b></span><em>Open details</em>';
  const body=document.createElement('div');body.className='v173-research-body';
  original.forEach(node=>body.append(node));details.append(summary,body);research.append(details);
}
function tuneLifeSection(root,person){
  const life=root.querySelector('#v17-life');if(!life)return;
  const title=life.querySelector('.v17-section-head h2');
  const intro=life.querySelector('.v17-section-head p:not(.eyebrow)');
  if(title)title.textContent=person.living?'Living family member':'Life through the years';
  if(intro&&!person.living)intro.textContent='A chronological view of documented moments and places. Qualified events remain visibly qualified.';
}
function addStoryNav(root){
  const nav=root.querySelector('.v17-person-nav');if(!nav||nav.querySelector('[href="#v17-story"]'))return nav;
  const link=document.createElement('a');link.href='#v17-story';link.textContent='Story';nav.prepend(link);return nav;
}
function enhance(){
  if(!isFamily())return;
  const id=routePersonId();if(!id)return;
  const root=document.querySelector(`.v17-person[data-person-id="${cssEscape(id)}"]`),person=personById(id);
  if(!root||!person||root.dataset.v173Person==='ready')return;
  root.dataset.v173Person='ready';
  const nav=addStoryNav(root),story=document.createElement('div');story.innerHTML=storyMarkup(person);const section=story.firstElementChild;
  if(nav&&section)nav.insertAdjacentElement('afterend',section);else root.querySelector('.v17-person-header')?.insertAdjacentElement('afterend',section);
  tuneLifeSection(root,person);
  makeResearchProgressive(root);
  window.dispatchEvent(new CustomEvent('family-person-v17-3-ready',{detail:{personId:id}}));
}

let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduled=false;enhance();}));}
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-experience-changed',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
