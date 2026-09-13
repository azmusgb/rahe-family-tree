import{researchRoutes}from'./navigation-model.js';

// The application shell is explicitly branded as the Rahe Family History Archive.
// Individual branch names remain genealogical content, while the shell consistently
// identifies the archive the family is using to explore every connected branch.
const SITE_TITLE='Rahe Family History Archive';
const SITE_DESCRIPTION='A source-backed family history archive spanning interconnected family branches, people, generations, photographs, stories, and research evidence.';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isResearchContext=()=>document.body.dataset.experience==='research'||researchRoutes.has(routeKey());
const setText=(element,value)=>{if(element&&element.textContent!==value)element.textContent=value;};

function syncDocumentMetadata(){
  if(document.title!==SITE_TITLE)document.title=SITE_TITLE;
  const description=document.querySelector('meta[name="description"]');
  if(description&&description.content!==SITE_DESCRIPTION)description.content=SITE_DESCRIPTION;
}

function syncShellBrand(){
  const monogram=document.querySelector('.brand .monogram');setText(monogram,'R');
  const brand=document.querySelector('.brand span:last-child');
  if(brand){
    const html=isResearchContext()?'RAHE FAMILY<small>RESEARCH CENTER</small>':'RAHE FAMILY<small>HISTORY ARCHIVE</small>';
    if(brand.innerHTML!==html)brand.innerHTML=html;
  }
  const edition=document.querySelector('.edition');
  if(edition){
    const html=isResearchContext()?'<b>RESEARCH WORKSPACE</b>Evidence · sources · conflicts · acquisition':'<b>SOURCE-BACKED ARCHIVE</b>Family history · privacy protected';
    if(edition.innerHTML!==html)edition.innerHTML=html;
  }
}

function syncPageBrand(){
  const pageEyebrow=document.querySelector('.page-heading .eyebrow');
  if(pageEyebrow)setText(pageEyebrow,isResearchContext()?'RAHE FAMILY RESEARCH ARCHIVE':'RAHE FAMILY HISTORY ARCHIVE');
  if(routeKey()!=='dashboard'||isResearchContext())return;
  document.querySelectorAll('.v17-home-hero .eyebrow').forEach(element=>setText(element,'THE RAHE FAMILY'));
  document.querySelectorAll('.v17-home-hero h1,.v17-home-hero h2').forEach(element=>setText(element,'Our family, connected.'));
  const heroCopy=document.querySelector('.v17-home-hero p:not(.eyebrow)');
  setText(heroCopy,'Explore every documented family branch together—people, relationships, photographs, places, stories, and the evidence behind them.');
  const legacyTitle=document.querySelector('.dashboard-hero h2');
  if(legacyTitle&&/Rahe family/i.test(legacyTitle.textContent||''))setText(legacyTitle,'Discover the people, places, and stories that connect our family history.');
}

function sync(){syncDocumentMetadata();syncShellBrand();syncPageBrand();}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;sync();}));}

window.addEventListener('family-view-rendered',schedule);
window.addEventListener('family-native-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-experience-changed',schedule);
window.addEventListener('family-auth-ui-refresh',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
