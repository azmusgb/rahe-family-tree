import{researchRoutes}from'../navigation/model.js';

// UI-only naming layer. Genealogy records retain their historical/family names.
const SITE_TITLE='Family History Archive';
const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isResearchContext=()=>document.body.dataset.experience==='research'||researchRoutes.has(routeKey());
const isFamilyHome=()=>routeKey()==='dashboard'&&!isResearchContext();
const setText=(element,value)=>{if(element&&element.textContent!==value)element.textContent=value;};
const setHtml=(element,value)=>{if(element&&element.innerHTML!==value)element.innerHTML=value;};

function syncMetadata(){
  if(document.title!==SITE_TITLE)document.title=SITE_TITLE;
}

function syncHeader(){
  const research=isResearchContext();
  const brandLink=document.querySelector('.brand');
  if(brandLink&&brandLink.getAttribute('aria-label')!=='Family History Archive home')brandLink.setAttribute('aria-label','Family History Archive home');
  setText(document.querySelector('.brand .monogram'),'F');
  setHtml(document.querySelector('.brand span:last-child'),research?'FAMILY HISTORY<small>RESEARCH CENTER</small>':'FAMILY HISTORY<small>ARCHIVE</small>');
  setText(document.querySelector('.site-breadcrumb a[href="#dashboard"]'),'Family History');
  setText(document.querySelector('.page-heading .eyebrow'),research?'FAMILY HISTORY RESEARCH ARCHIVE':'FAMILY HISTORY ARCHIVE');
}

function syncHome(){
  const home=isFamilyHome();
  const routeShell=document.querySelector('.route-shell');
  if(routeShell&&routeShell.hidden!==home)routeShell.hidden=home;
  if(!home)return;
  document.querySelectorAll('.v17-home-hero .eyebrow').forEach(element=>setText(element,'FAMILY HISTORY'));
  document.querySelectorAll('.v17-home-hero h1,.v17-home-hero h2').forEach(element=>setText(element,'Our family, connected.'));
  const heroCopy=document.querySelector('.v17-home-hero p:not(.eyebrow)');
  setText(heroCopy,'Explore every documented family branch together—people, relationships, photographs, places, stories, and the evidence behind them.');
  const legacyTitle=document.querySelector('.dashboard-hero h2');
  if(legacyTitle)setText(legacyTitle,'Discover the people, places, and stories that connect our family history.');
}

function syncFooter(){
  setText(document.querySelector('.site-footer-brand .monogram'),'F');
  setHtml(document.querySelector('.site-footer-brand a span:last-child'),'<b>FAMILY HISTORY</b><small>ARCHIVE</small>');
}

function sync(){syncMetadata();syncHeader();syncHome();syncFooter();}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;sync();}));}

// Follow the application's authoritative render lifecycle rather than observing
// broad DOM mutations. This keeps shell naming presentation-only and avoids
// interfering with high-frequency Tree rerenders and click interactions.
for(const eventName of['family-view-rendered','family-native-rendered','hashchange','popstate','family-experience-changed','family-auth-ui-refresh'])window.addEventListener(eventName,schedule);

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
