import{displayPeople,allPedigreeRelationships}from'./core.js';

function generationCount(){
  const people=displayPeople();
  const ids=new Set(people.map(p=>p.id));
  const rels=allPedigreeRelationships().filter(r=>r.type==='parent-child'&&r.active!==false&&!/REJECTED/i.test(r.state||'')&&ids.has(r.from)&&ids.has(r.to));
  if(!rels.length)return people.length?1:0;
  const children=new Map(),incoming=new Map(people.map(p=>[p.id,0]));
  for(const r of rels){
    if(!children.has(r.from))children.set(r.from,[]);
    children.get(r.from).push(r.to);
    incoming.set(r.to,(incoming.get(r.to)||0)+1);
  }
  const roots=people.map(p=>p.id).filter(id=>(incoming.get(id)||0)===0);
  const queue=roots.map(id=>[id,1]),best=new Map(),seenEdges=new Set();
  let max=1;
  while(queue.length){
    const [id,depth]=queue.shift();
    if(depth<=(best.get(id)||0))continue;
    best.set(id,depth);max=Math.max(max,depth);
    for(const child of children.get(id)||[]){
      const edge=`${id}>${child}`;
      if(seenEdges.has(`${edge}@${depth}`))continue;
      seenEdges.add(`${edge}@${depth}`);
      if(depth<people.length)queue.push([child,depth+1]);
    }
  }
  return Math.min(max,people.length);
}

function isDashboard(){
  const key=location.hash.slice(1).split('/')[0];
  return !key||key==='dashboard';
}

const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};

function polishDashboard(){
  if(!isDashboard())return;
  const content=document.querySelector('#content');
  if(!content||!content.querySelector('.dashboard-hero'))return;

  setText(document.querySelector('#description'),'Explore the family, major branches, people, history, media, and open research questions from one family-first home page.');

  for(const section of [...content.querySelectorAll(':scope > section')]){
    const eyebrow=section.querySelector('.eyebrow')?.textContent?.trim();
    if(eyebrow==='EVIDENCE GAP DASHBOARD')section.remove();
  }
  content.querySelectorAll(':scope > .private-state-panel').forEach(el=>el.remove());

  const generationMetric=[...content.querySelectorAll('.dashboard-family-metrics span')].find(el=>/generational eras|documented generations?/i.test(el.querySelector('small')?.textContent||''));
  if(generationMetric){
    const count=generationCount();
    setText(generationMetric.querySelector('b'),count?`${count}`:'—');
    setText(generationMetric.querySelector('small'),count===1?'documented generation':'documented generations');
  }

  const mediaAction=[...content.querySelectorAll('.dashboard-hero-actions .action')].find(a=>/photos|documents|media/i.test(a.textContent||''));
  if(mediaAction){
    if(mediaAction.getAttribute('href')!=='#media')mediaAction.setAttribute('href','#media');
    setText(mediaAction,'Browse photos & documents');
  }

  const advanced=content.querySelector('.dashboard-research-details-body');
  if(advanced&&!advanced.querySelector('.dashboard-research-links')){
    advanced.insertAdjacentHTML('afterbegin','<nav class="dashboard-research-links" aria-label="Research tools"><a href="#research">Research queue</a><a href="#intelligence">Research intelligence</a><a href="#conflicts">Conflicts</a><a href="#archive">Canonical archive</a></nav>');
  }
}

let scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;polishDashboard();});
}

window.addEventListener('hashchange',schedule);
window.addEventListener('family-edits-changed',schedule);
document.addEventListener('DOMContentLoaded',schedule);
const content=document.querySelector('#content');
if(content)new MutationObserver(schedule).observe(content,{childList:true,subtree:false});
schedule();
