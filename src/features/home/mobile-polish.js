// Mobile Home presentation polish. This module only edits rendered copy and
// presentation metadata; it never writes genealogy, claims, relationships, or
// evidence state back to the canonical model.
const MOBILE_QUERY='(max-width: 720px)';
const routeKey=()=>document.body.dataset.route||location.hash.slice(1).split('/')[0]||'dashboard';
const isMobileHome=()=>window.matchMedia(MOBILE_QUERY).matches&&routeKey()==='dashboard'&&document.body.dataset.experience!=='research';

function editorialMoment(raw){
  const text=String(raw||'').replace(/\s+/g,' ').trim();
  if(!text)return'';
  const candidates=text.split('|').map(part=>part.trim()).filter(Boolean).filter(part=>{
    if(/^\[[^\]]*(?:withheld|protected|private)[^\]]*\]$/i.test(part))return false;
    if(/^(?:SUPPORTED|PROVISIONAL|UNRESOLVED|REJECTED)\b/i.test(part))return false;
    if(/^(?:evidence|state|status)\s*:/i.test(part))return false;
    return true;
  });
  if(candidates.length<=1)return candidates[0]||text;
  const narrative=candidates.filter(part=>/[.;:]/.test(part)||part.split(/\s+/).length>=5).sort((a,b)=>b.length-a.length)[0];
  return narrative||candidates.sort((a,b)=>b.length-a.length)[0]||text;
}

function polishHome(){
  if(!isMobileHome())return;
  const root=document.querySelector('[data-v17-native="home"]');
  if(!root)return;

  const launcher=root.querySelector('.v21-launcher-heading p');
  if(launcher)launcher.textContent='Choose a path into the archive and start exploring.';

  const storyHead=root.querySelector('.v17-home-story .v17-section-head h2');
  if(storyHead)storyHead.textContent='One moment from the family story.';
  const storyIntro=root.querySelector('.v17-home-story .v17-section-head div>p:not(.eyebrow)');
  if(storyIntro)storyIntro.textContent='A source-backed glimpse from the family archive.';

  root.querySelectorAll('.v17-story-moment h3').forEach(heading=>{
    const next=editorialMoment(heading.textContent);
    if(next&&heading.textContent!==next)heading.textContent=next;
  });
  root.querySelectorAll('.v17-story-moment').forEach(card=>{
    card.querySelectorAll('h3,p,small').forEach(node=>{
      if(/\b(?:SUPPORTED|PROVISIONAL|UNRESOLVED|REJECTED)\b/i.test(node.textContent||'')){
        node.textContent=(node.textContent||'').replace(/\s*[|·/]?\s*\b(?:SUPPORTED|PROVISIONAL|UNRESOLVED|REJECTED)\b.*$/i,'').trim();
      }
    });
  });
}

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;polishHome();}));
}

for(const eventName of['family-native-rendered','family-view-rendered','hashchange','popstate','family-experience-changed'])window.addEventListener(eventName,schedule);
window.addEventListener('resize',schedule,{passive:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
