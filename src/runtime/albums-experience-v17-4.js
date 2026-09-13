import{esc,personById}from'../../core.js';

const RELEASE='17.4.0';
const api='/api/media';
let cache=null,authenticated=false,loading=null;
const route=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const familyMode=()=>document.body.dataset.experience!=='research';
const mediaUrl=id=>`${api}?file=${encodeURIComponent(id)}`;
const isImage=item=>String(item?.mime||'').startsWith('image/');
const mediaType=item=>isImage(item)?'photo':'document';
const eventYear=value=>Number(String(value||'').match(/(?:18|19|20)\d{2}/)?.[0]||0);
const decadeOf=item=>{const year=eventYear(item?.eventDate);return year?Math.floor(year/10)*10:null;};
const linkedPeople=item=>(item?.personIds||[]).map(personById).filter(Boolean);
const branchNames=item=>[...new Set(linkedPeople(item).map(person=>String(person.branch||'').trim()).filter(Boolean))];
const unsafePublicPerson=person=>Boolean(person?.living)||/UNRESOLVED|REJECTED/i.test(String(person?.state||''));
const publicSafe=item=>{if(item?.visibility!=='public')return false;const ids=Array.isArray(item?.personIds)?item.personIds:[],people=ids.map(personById);return people.every(Boolean)&&!people.some(unsafePublicPerson);};
const visibleAlbumItems=()=>authenticated?(cache||[]):(cache||[]).filter(publicSafe);

async function fetchAlbums(force=false){
  if(cache&&!force)return cache;
  if(loading)return loading;
  loading=(async()=>{const response=await fetch(api,{credentials:'same-origin',cache:'no-store'}),data=await response.json().catch(()=>({ok:false,error:'Invalid media response'}));if(!response.ok||!data.ok)throw Error(data.error||`Media request failed (${response.status})`);cache=Array.isArray(data.media)?data.media:[];authenticated=Boolean(data.authenticated);return cache;})();
  try{return await loading;}finally{loading=null;}
}

function coverFor(items){return items.find(isImage)||null;}
function coverMarkup(items,label){const cover=coverFor(items);return cover?`<span class="v174-album-cover"><img src="${mediaUrl(cover.id)}" alt="" loading="lazy" decoding="async"></span>`:`<span class="v174-album-cover v174-album-cover-empty" aria-hidden="true">${esc(label.slice(0,1).toUpperCase())}</span>`;}
function albumButton({kind,value,label,items,detail}){return`<button type="button" class="v174-album-card" data-v174-album-${kind}="${esc(value)}">${coverMarkup(items,label)}<span class="v174-album-copy"><b>${esc(label)}</b><small>${esc(detail||`${items.length} item${items.length===1?'':'s'}`)}</small></span></button>`;}
function branchAlbums(items){const groups=new Map();for(const item of items)for(const branch of branchNames(item)){if(!groups.has(branch))groups.set(branch,[]);groups.get(branch).push(item);}return[...groups].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0]));}
function decadeAlbums(items){const groups=new Map();for(const item of items){const decade=decadeOf(item);if(!decade)continue;if(!groups.has(decade))groups.set(decade,[]);groups.get(decade).push(item);}return[...groups].sort((a,b)=>b[0]-a[0]);}
function typeAlbums(items){return[['photo',items.filter(item=>mediaType(item)==='photo')],['document',items.filter(item=>mediaType(item)==='document')]];}

function currentAlbumLabel(){const branch=document.querySelector('#branch')?.value||'',decade=document.querySelector('#media-decade')?.value||'all',type=document.querySelector('#media-type')?.value||'all';if(branch)return `${branch} family`;if(decade!=='all')return `${decade}s`;if(type==='photo')return'Photographs';if(type==='document')return'Documents';return'All family media';}
function albumsMarkup(items){
  const branches=branchAlbums(items),decades=decadeAlbums(items),types=typeAlbums(items);
  return`<section class="v174-albums" aria-labelledby="v174-albums-title"><div class="v174-albums-head"><div><p class="eyebrow">FAMILY ALBUMS</p><h2 id="v174-albums-title">Browse the archive like a collection of family albums.</h2><p>Open a branch, decade, or collection. Every album is assembled only from media already visible to this session; it does not create or promote genealogy evidence.</p></div><div class="v174-current-album"><span>Viewing</span><b data-v174-current>${esc(currentAlbumLabel())}</b><button type="button" class="text-link" data-v174-album-clear>Show all</button></div></div><section class="v174-album-section"><div class="v174-section-title"><p class="eyebrow">FAMILY LINES</p><h3>Branch albums</h3></div><div class="v174-branch-albums">${branches.length?branches.map(([branch,rows])=>albumButton({kind:'branch',value:branch,label:branch,items:rows})).join(''):'<p class="muted">No branch-linked albums are available in this view.</p>'}</div></section><section class="v174-album-section v174-decade-section"><div class="v174-section-title"><p class="eyebrow">THROUGH THE YEARS</p><h3>Decade albums</h3></div><div class="v174-decade-albums">${decades.length?decades.map(([decade,rows])=>albumButton({kind:'decade',value:String(decade),label:`${decade}s`,items:rows})).join(''):'<p class="muted">Dated family media will appear here as decade albums.</p>'}</div></section><section class="v174-album-section"><div class="v174-section-title"><p class="eyebrow">COLLECTIONS</p><h3>Browse by format</h3></div><div class="v174-type-albums">${types.map(([type,rows])=>albumButton({kind:'type',value:type,label:type==='photo'?'Photographs':'Documents',items:rows,detail:`${rows.length} visible ${type}${rows.length===1?'':'s'}`})).join('')}</div></section></section>`;
}

function syncChrome(){
  const crumb=document.querySelector('#crumb'),title=document.querySelector('#title'),description=document.querySelector('#description');
  if(crumb)crumb.textContent='Albums';if(title)title.textContent='Family Albums';if(description)description.textContent='Browse photographs and documents as branch, decade, and family collections.';
  const hero=document.querySelector('.media-page-hero');if(hero){const eyebrow=hero.querySelector('.eyebrow'),heading=hero.querySelector('h2'),copy=hero.querySelector('p:not(.eyebrow)');if(eyebrow)eyebrow.textContent='FAMILY ALBUMS';if(heading)heading.textContent='Photographs and documents, gathered into the family stories they belong to.';if(copy)copy.textContent='Browse by family line, decade, or format. Public visitors see only public-safe media; private family media remains server-protected.';}
}
function mount(){
  if(route()!=='media'||!familyMode())return;
  const page=document.querySelector('[data-media-page]');if(!page||!cache)return;
  syncChrome();document.body.dataset.albumsRelease=RELEASE;
  const items=visibleAlbumItems();let hub=page.querySelector('.v174-albums');const html=albumsMarkup(items);
  if(hub){hub.outerHTML=html;}else{const hero=page.querySelector('.media-page-hero');hero?.insertAdjacentHTML('afterend',html);}
}
function applyFilters({branch='',decade='all',type='all'}={}){
  const search=document.querySelector('#search'),branchSelect=document.querySelector('#branch'),decadeSelect=document.querySelector('#media-decade'),typeSelect=document.querySelector('#media-type');
  if(search)search.value='';if(branchSelect)branchSelect.value=branch;if(decadeSelect)decadeSelect.value=decade;if(typeSelect)typeSelect.value=type;
  const url=new URL(location.href);url.searchParams.delete('q');branch?url.searchParams.set('branch',branch):url.searchParams.delete('branch');history.replaceState(null,'',url);
  (typeSelect||decadeSelect)?.dispatchEvent(new Event('change',{bubbles:true}));
  requestAnimationFrame(()=>{const label=document.querySelector('[data-v174-current]');if(label)label.textContent=currentAlbumLabel();document.querySelector('.media-library-title')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
}

let scheduled=false;function schedule(force=false){if(scheduled&&!force)return;scheduled=true;requestAnimationFrame(()=>requestAnimationFrame(async()=>{scheduled=false;if(route()!=='media'||!familyMode())return;try{await fetchAlbums(force);mount();}catch{document.body.dataset.albumsRelease=RELEASE;}}));}
document.addEventListener('click',event=>{const branch=event.target.closest?.('[data-v174-album-branch]');if(branch){applyFilters({branch:branch.dataset.v174AlbumBranch});return;}const decade=event.target.closest?.('[data-v174-album-decade]');if(decade){applyFilters({decade:decade.dataset.v174AlbumDecade});return;}const type=event.target.closest?.('[data-v174-album-type]');if(type){applyFilters({type:type.dataset.v174AlbumType});return;}if(event.target.closest?.('[data-v174-album-clear]'))applyFilters();});
window.addEventListener('family-view-rendered',()=>schedule());window.addEventListener('hashchange',()=>schedule());window.addEventListener('family-auth-ui-refresh',()=>schedule(true));window.addEventListener('family-auth-changed',()=>schedule(true));window.addEventListener('family-media-changed',()=>{cache=null;schedule(true);});document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>schedule()):schedule();
