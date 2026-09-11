import{model,esc,norm,personById}from'./core.js';

const api='/api/media';
const state={media:[],authenticated:false,canUpload:false,canEdit:false,user:null,loaded:false,loading:false,error:'',dirty:true};
const isMediaRoute=()=>location.hash.slice(1).split('/')[0]==='media';
const mediaUrl=id=>`${api}?file=${encodeURIComponent(id)}`;
const eventYear=value=>{const m=String(value||'').match(/(?:18|19|20)\d{2}/);return m?Number(m[0]):null;};
const mediaType=m=>String(m?.mime||'').startsWith('image/')?'photo':'document';
const linkedPeople=m=>(m.personIds||[]).map(personById).filter(Boolean);
const branchOf=p=>String(p?.branch||'Family').split('/')[0].trim();
const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};

function ensureMediaNav(){
  const nav=document.querySelector('#nav');
  if(!nav)return;
  let link=nav.querySelector('a[href="#media"]');
  if(!link){
    link=document.createElement('a');
    link.href='#media';
    link.innerHTML='<span>00</span>Media';
    const people=nav.querySelector('a[href="#people"]');
    people?.insertAdjacentElement('afterend',link);
    if(!people)nav.appendChild(link);
  }
  [...nav.querySelectorAll('a')].forEach((a,i)=>{const n=a.querySelector('span');if(n)n.textContent=String(i+1).padStart(2,'0');});
  if(isMediaRoute()){
    nav.querySelectorAll('a.active').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');});
    link.classList.add('active');link.setAttribute('aria-current','page');
  }
}

function setRouteChrome(){
  document.body.classList.add('media-route');
  ensureMediaNav();
  setText(document.querySelector('#crumb'),'Media');
  setText(document.querySelector('#title'),'Photos & Documents');
  setText(document.querySelector('#description'),'Browse family photographs and documents by person, branch, date, location, and source context.');
  setText(document.querySelector('.version'),'FAMILY VIEW · v13.4');
  const stateSelect=document.querySelector('#state');
  if(stateSelect){stateSelect.disabled=true;const label=stateSelect.closest('label');if(label)label.hidden=true;}
  const search=document.querySelector('#search');
  if(search&&search.placeholder!=='Search photos, documents, people, places, or sources…')search.placeholder='Search photos, documents, people, places, or sources…';
  document.querySelector('#search-v13-1-results')?.remove();
}

function restoreChrome(){
  document.body.classList.remove('media-route');
  const stateSelect=document.querySelector('#state');
  if(stateSelect){stateSelect.disabled=false;const label=stateSelect.closest('label');if(label)label.hidden=false;}
  const search=document.querySelector('#search');
  if(search&&search.placeholder!=='Search a person, branch, source, or record…')search.placeholder='Search a person, branch, source, or record…';
}

function dashboardMediaLink(){
  if(isMediaRoute())return;
  const hero=document.querySelector('.dashboard-hero-actions');
  if(!hero)return;
  const action=[...hero.querySelectorAll('a.action')].find(a=>/media|photos|documents/i.test(a.textContent||''));
  if(action){action.href='#media';if(action.textContent!=='Browse photos & documents')action.textContent='Browse photos & documents';}
}

function shell(){return `
  <section class="media-page" data-media-page>
    <header class="media-page-hero">
      <div>
        <p class="eyebrow">FAMILY MEDIA</p>
        <h2>Photographs and documents, connected to the people they belong to.</h2>
        <p>Media adds family context without changing genealogy evidence. Public visitors see only public-safe items; private media is returned only to an authenticated family account.</p>
      </div>
      <div class="media-page-hero-actions">
        <a class="action primary" href="#people">Find a person</a>
        <a class="action" href="#tree">Open family tree</a>
      </div>
    </header>
    <div id="media-library-metrics" class="media-library-metrics" aria-live="polite"></div>
    <section class="media-library-controls" aria-label="Media filters">
      <label>Type<select id="media-type"><option value="all">All media</option><option value="photo">Photos</option><option value="document">Documents</option></select></label>
      <label>Decade<select id="media-decade"><option value="all">All decades</option></select></label>
      <label id="media-visibility-label">Visibility<select id="media-visibility"><option value="all">All visible</option><option value="public">Public</option><option value="private">Private family</option></select></label>
      <label>Sort<select id="media-sort"><option value="featured">Featured & recent</option><option value="event-new">Newest event first</option><option value="event-old">Oldest event first</option><option value="added-new">Recently added</option></select></label>
      <button class="action" type="button" data-media-clear>Clear media filters</button>
    </section>
    <div class="media-library-note" id="media-library-note"></div>
    <div class="section-title media-library-title"><div><p class="eyebrow">MEDIA LIBRARY</p><h2>Family collection</h2></div><span id="media-library-count">Loading…</span></div>
    <div id="media-library" class="media-library-grid"><div class="empty compact">Loading family media…</div></div>
  </section>`;}

function mediaCard(m){
  const people=linkedPeople(m),type=mediaType(m),privateItem=m.visibility!=='public';
  const preview=type==='photo'
    ?`<a class="media-library-preview" href="${mediaUrl(m.id)}" target="_blank" rel="noopener"><img src="${mediaUrl(m.id)}" alt="${esc(m.caption||m.title||'Family photograph')}" loading="lazy"></a>`
    :`<a class="media-library-preview document" href="${mediaUrl(m.id)}" target="_blank" rel="noopener"><span aria-hidden="true">DOC</span><b>Open document</b><small>${esc(String(m.mime||'application/pdf').replace('application/','').toUpperCase())}</small></a>`;
  const facts=[m.eventDate?`<span>${esc(m.eventDate)}</span>`:'',m.location?`<span>${esc(m.location)}</span>`:'',m.sourceId?`<span>Source ${esc(m.sourceId)}</span>`:''].filter(Boolean).join('');
  const peopleButtons=people.length?people.map(p=>`<button type="button" class="media-person-chip" data-person="${esc(p.id)}">${esc(p.name)}</button>`).join(''):'<span class="muted">No linked person displayed</span>';
  return `<article class="media-library-card ${privateItem?'is-private':''}">
    ${preview}
    <div class="media-library-body">
      <div class="media-library-badges">${m.featured?'<span class="featured">Featured</span>':''}<span>${type==='photo'?'Photo':'Document'}</span><span>${privateItem?'Private family':'Public'}</span></div>
      <h3>${esc(m.title||'Untitled media')}</h3>
      ${m.caption?`<p>${esc(m.caption)}</p>`:''}
      ${facts?`<div class="media-library-facts">${facts}</div>`:''}
      <div class="media-linked-people">${peopleButtons}</div>
      <small class="media-authority">${esc(m.evidenceAuthority||'MEDIA ATTACHMENT — DOES NOT PROMOTE GENEALOGY EVIDENCE')}</small>
    </div>
  </article>`;}

function currentFilters(){return{
  q:document.querySelector('#search')?.value.trim()||'',
  branch:document.querySelector('#branch')?.value||'',
  type:document.querySelector('#media-type')?.value||'all',
  decade:document.querySelector('#media-decade')?.value||'all',
  visibility:document.querySelector('#media-visibility')?.value||'all',
  sort:document.querySelector('#media-sort')?.value||'featured'
};}

function searchable(m){const people=linkedPeople(m);return norm([m.title,m.caption,m.eventDate,m.location,m.sourceId,m.contributor,...people.flatMap(p=>[p.name,p.branch,p.role])].filter(Boolean).join(' '));}
function branchMatch(m,branch){if(!branch)return true;const target=norm(branch);return linkedPeople(m).some(p=>{const b=norm(p.branch);return b.includes(target)||target.includes(b)||norm(branchOf(p))===target;});}
function filteredMedia(){
  const f=currentFilters(),q=norm(f.q);
  let rows=state.media.filter(m=>!q||q.split(/\s+/).filter(Boolean).every(t=>searchable(m).includes(t)))
    .filter(m=>branchMatch(m,f.branch))
    .filter(m=>f.type==='all'||mediaType(m)===f.type)
    .filter(m=>f.visibility==='all'||m.visibility===f.visibility)
    .filter(m=>f.decade==='all'||Math.floor((eventYear(m.eventDate)||0)/10)*10===Number(f.decade));
  const dateValue=m=>eventYear(m.eventDate)||0,created=m=>Date.parse(m.createdAt||'')||0;
  rows=[...rows].sort((a,b)=>{
    if(f.sort==='event-new')return dateValue(b)-dateValue(a)||created(b)-created(a);
    if(f.sort==='event-old')return (dateValue(a)||9999)-(dateValue(b)||9999)||created(a)-created(b);
    if(f.sort==='added-new')return created(b)-created(a);
    return Number(Boolean(b.featured))-Number(Boolean(a.featured))||created(b)-created(a);
  });
  return rows;
}

function renderDecades(){
  const select=document.querySelector('#media-decade');if(!select)return;
  const prior=select.value||'all';
  const decades=[...new Set(state.media.map(m=>eventYear(m.eventDate)).filter(Boolean).map(y=>Math.floor(y/10)*10))].sort((a,b)=>b-a);
  const html='<option value="all">All decades</option>'+decades.map(d=>`<option value="${d}">${d}s</option>`).join('');
  if(select.innerHTML!==html)select.innerHTML=html;
  select.value=decades.includes(Number(prior))?prior:'all';
}

function renderLibrary(){
  if(!isMediaRoute())return;
  const root=document.querySelector('[data-media-page]');if(!root)return;
  renderDecades();
  const rows=filteredMedia(),photos=state.media.filter(m=>mediaType(m)==='photo').length,docs=state.media.filter(m=>mediaType(m)==='document').length,featured=state.media.filter(m=>m.featured).length,priv=state.media.filter(m=>m.visibility!=='public').length;
  const metrics=document.querySelector('#media-library-metrics');
  if(metrics)metrics.innerHTML=`<span><b>${state.media.length}</b><small>visible items</small></span><span><b>${photos}</b><small>photos</small></span><span><b>${docs}</b><small>documents</small></span><span><b>${featured}</b><small>featured</small></span>${state.authenticated?`<span><b>${priv}</b><small>private family</small></span>`:''}`;
  const visibilityLabel=document.querySelector('#media-visibility-label');if(visibilityLabel)visibilityLabel.hidden=!state.authenticated;
  const count=document.querySelector('#media-library-count');if(count)count.textContent=`${rows.length} of ${state.media.length} visible item(s)`;
  const note=document.querySelector('#media-library-note');
  if(note)note.innerHTML=state.authenticated
    ?`<strong>Family account active.</strong> Private items you are authorized to view are included. ${state.canUpload?'To add media, open the person profile it belongs to.':'Your account is read-only for media.'}`
    :'<strong>Public-safe view.</strong> Private media, media linked to living people, and media linked to unresolved identities are excluded server-side.';
  const gallery=document.querySelector('#media-library');
  if(gallery){
    if(state.error)gallery.innerHTML=`<div class="empty compact"><div><b>Media unavailable</b><p>${esc(state.error)}</p></div></div>`;
    else if(state.loading&&!state.loaded)gallery.innerHTML='<div class="empty compact">Loading family media…</div>';
    else gallery.innerHTML=rows.length?rows.map(mediaCard).join(''):'<div class="empty compact"><div><b>No media matches these filters</b><p>Clear the search, branch, type, decade, or visibility filter and try again.</p></div></div>';
  }
  const status=document.querySelector('#status');if(status)status.textContent=`Media · ${rows.length} shown · ${state.media.length} visible to this session · privacy enforced server-side`;
}

async function loadMedia(){
  if(state.loading)return;
  state.loading=true;state.error='';renderLibrary();
  try{
    const res=await fetch(api,{credentials:'same-origin',cache:'no-store'}),data=await res.json().catch(()=>({ok:false,error:'Invalid media response.'}));
    if(!res.ok||!data.ok)throw Error(data.error||`Media request failed (${res.status})`);
    state.media=Array.isArray(data.media)?data.media:[];state.authenticated=Boolean(data.authenticated);state.canUpload=Boolean(data.canUpload);state.canEdit=Boolean(data.canEdit);state.user=data.user||null;state.loaded=true;state.dirty=false;
  }catch(error){state.error=error?.message||String(error);state.loaded=true;}
  finally{state.loading=false;renderLibrary();}
}

function mountMediaRoute(){
  ensureMediaNav();dashboardMediaLink();
  if(!isMediaRoute()){restoreChrome();return;}
  setRouteChrome();
  const content=document.querySelector('#content');if(!content)return;
  if(!content.querySelector('[data-media-page]')){content.innerHTML=shell();renderLibrary();}
  content.querySelector('#search-v13-1-results')?.remove();
  if(state.dirty||!state.loaded)loadMedia();else renderLibrary();
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduled=false;mountMediaRoute();}));}

function clearMediaFilters(){
  const search=document.querySelector('#search'),branch=document.querySelector('#branch');if(search)search.value='';if(branch)branch.value='';
  for(const [id,value] of [['media-type','all'],['media-decade','all'],['media-visibility','all'],['media-sort','featured']]){const el=document.querySelector(`#${id}`);if(el)el.value=value;}
  renderLibrary();
}

function exportVisible(){const rows=filteredMedia(),payload={view:'media',generatedAt:new Date().toISOString(),authenticated:state.authenticated,count:rows.length,media:rows};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rahe-media-visible.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

window.addEventListener('hashchange',schedule);
window.addEventListener('popstate',schedule);
window.addEventListener('family-media-changed',()=>{state.dirty=true;schedule();});
window.addEventListener('family-auth-changed',()=>{state.dirty=true;schedule();});
document.querySelector('#filters')?.addEventListener('input',()=>{if(isMediaRoute())setTimeout(renderLibrary,0);});
document.querySelector('#filters')?.addEventListener('change',()=>{if(isMediaRoute())setTimeout(renderLibrary,0);});
document.querySelector('#filters')?.addEventListener('reset',()=>{if(isMediaRoute())setTimeout(renderLibrary,0);});
document.addEventListener('input',e=>{if(isMediaRoute()&&e.target?.matches?.('#media-type,#media-decade,#media-visibility,#media-sort'))renderLibrary();});
document.addEventListener('change',e=>{if(isMediaRoute()&&e.target?.matches?.('#media-type,#media-decade,#media-visibility,#media-sort'))renderLibrary();});
document.addEventListener('click',e=>{if(!isMediaRoute())return;const clear=e.target.closest?.('[data-media-clear]');if(clear){e.preventDefault();clearMediaFilters();}});
document.addEventListener('click',e=>{if(!isMediaRoute()||!e.target.closest?.('#export'))return;e.preventDefault();e.stopImmediatePropagation();exportVisible();},true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
