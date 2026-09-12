// Site-level naming is intentionally branch-neutral. Individual surnames remain
// visible where they are genealogically meaningful (people, branches, claims,
// sources, and relationships), but no single surname owns the application shell.
const SITE_TITLE='Family History Archive';
const SITE_DESCRIPTION='A source-backed family history archive spanning interconnected family branches, people, generations, photographs, stories, and research evidence.';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isResearchContext=()=>document.body.dataset.experience==='research'||new Set(['evidence','sources','research','archive','intelligence','conflicts','intake','identity']).has(routeKey());
const setText=(element,value)=>{if(element&&element.textContent!==value)element.textContent=value;};

function syncDocumentMetadata(){
  if(document.title!==SITE_TITLE)document.title=SITE_TITLE;
  const description=document.querySelector('meta[name="description"]');
  if(description&&description.content!==SITE_DESCRIPTION)description.content=SITE_DESCRIPTION;
}

function syncShellBrand(){
  const monogram=document.querySelector('.brand .monogram');setText(monogram,'F');
  const brand=document.querySelector('.brand span:last-child');
  if(brand){
    const html=isResearchContext()?'FAMILY<small>RESEARCH CENTER</small>':'FAMILY<small>HISTORY ARCHIVE</small>';
    if(brand.innerHTML!==html)brand.innerHTML=html;
  }
  const edition=document.querySelector('.edition');
  if(edition){
    const html=isResearchContext()?'<b>RESEARCH WORKSPACE</b>Evidence, sources, conflicts, and acquisition work':'<b>SOURCE-BACKED FAMILY HISTORY</b>Connected family archive · living-person privacy protected';
    if(edition.innerHTML!==html)edition.innerHTML=html;
  }
  const topbar=document.querySelector('.topbar>span');
  if(topbar?.firstChild?.nodeType===Node.TEXT_NODE&&topbar.firstChild.nodeValue!=='Family archive / ')topbar.firstChild.nodeValue='Family archive / ';
}

function syncPageBrand(){
  const pageEyebrow=document.querySelector('.page-heading .eyebrow');
  if(pageEyebrow)setText(pageEyebrow,isResearchContext()?'FAMILY RESEARCH ARCHIVE':'FAMILY HISTORY ARCHIVE');
  if(routeKey()!=='dashboard'||isResearchContext())return;
  document.querySelectorAll('.v17-home-hero .eyebrow').forEach(element=>setText(element,'OUR FAMILY HISTORY'));
  document.querySelectorAll('.v17-home-hero h2').forEach(element=>setText(element,'Our family, connected.'));
  const heroCopy=document.querySelector('.v17-home-hero p:not(.eyebrow)');
  setText(heroCopy,'Explore every documented family branch together—people, relationships, photographs, places, stories, and the evidence behind them.');
  const legacyTitle=document.querySelector('.dashboard-hero h2');
  if(legacyTitle&&/Rahe family/i.test(legacyTitle.textContent||''))setText(legacyTitle,'Discover the people, places, and stories that connect our family history.');
}

function sync(){syncDocumentMetadata();syncShellBrand();syncPageBrand();}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;sync();}));}

window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-experience-changed',schedule);
window.addEventListener('family-auth-ui-refresh',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
