import{renderStories}from'./stories-view.js';

const isStories=()=>location.hash.slice(1).split('/')[0]==='stories'&&document.body.dataset.experience!=='research';
let applying=false;
function apply(){
  if(applying||!isStories())return;
  const content=document.getElementById('content');if(!content)return;
  applying=true;
  document.body.dataset.route='stories';
  const crumb=document.getElementById('crumb'),title=document.getElementById('title'),description=document.getElementById('description'),status=document.getElementById('status');
  if(crumb)crumb.textContent='Stories';
  if(title)title.textContent='Stories';
  if(description)description.textContent='Source-controlled family highlights grouped by era, people, and place.';
  if(status)status.textContent='Family stories are derived from the source-controlled event record; unresolved research remains unresolved.';
  content.innerHTML=renderStories();
  window.dispatchEvent(new CustomEvent('family-stories-rendered'));
  applying=false;
}
function schedule(){requestAnimationFrame(()=>requestAnimationFrame(apply));}
window.addEventListener('family-view-rendered',schedule);
window.addEventListener('hashchange',schedule);
window.addEventListener('family-experience-changed',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
