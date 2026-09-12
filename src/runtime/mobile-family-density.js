import{personById,esc}from'../../core.js';
import{renderRelationshipFinder}from'../../platform-v13-ui.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const isFamily=()=>document.body.dataset.experience!=='research';
const focusPerson=()=>{const id=new URL(location.href).searchParams.get('focus')||document.querySelector('[data-tree-person]')?.value||'';return personById(id)||null;};

function stripFamilyDiagnostics(){
  if(!isFamily())return;
  document.querySelector('[data-platform-v13="tree-engine-2"]')?.remove();
  document.querySelectorAll('.footer').forEach(footer=>{
    footer.innerHTML='<span>Family history backed by source-controlled research. Living-person details are protected.</span><a href="#research">Research Center ↗</a>';
  });
}

function installTreeRelationshipDialog(content){
  if(content.querySelector('#v161-relationship-dialog'))return;
  const dialog=document.createElement('dialog');
  dialog.id='v161-relationship-dialog';dialog.className='v161-relationship-dialog';
  dialog.innerHTML=`<div class="v161-dialog-head"><div><p class="eyebrow">RELATIONSHIP FINDER</p><h2>How are two people related?</h2></div><button type="button" data-v161-close aria-label="Close relationship finder">Close</button></div><div class="v161-dialog-body">${renderRelationshipFinder()}</div>`;
  content.append(dialog);
}

function installTreeToolbar(content){
  if(content.querySelector('.v161-tree-toolbar'))return;
  const shell=content.querySelector('.graph-shell');if(!shell)return;
  const person=focusPerson();
  const toolbar=document.createElement('div');toolbar.className='v161-tree-toolbar';
  toolbar.innerHTML=`<div class="v161-tree-focus"><span class="eyebrow">FAMILY TREE</span><b>${esc(person?.name||'Family view')}</b></div><div class="v161-tree-tool-actions"><button type="button" data-graph="fit">Fit</button><button type="button" data-v161-relationship>Relationship</button><button type="button" data-v161-tree-more aria-expanded="false">More</button></div>`;
  shell.insertAdjacentElement('beforebegin',toolbar);
  installTreeRelationshipDialog(content);
}

function reopenRelationshipResult(){
  if(document.body.dataset.v161ReopenRelationship!=='true')return;
  delete document.body.dataset.v161ReopenRelationship;
  const dialog=document.getElementById('v161-relationship-dialog');
  if(dialog?.showModal)dialog.showModal();else dialog?.setAttribute('open','');
}

function compactTree(){
  if(!isFamily()||routeKey()!=='tree')return;
  const content=document.getElementById('content');if(!content)return;
  content.classList.add('v161-tree');
  const url=new URL(location.href);if((url.searchParams.get('scope')||'family')==='family'&&!url.searchParams.has('depth')){url.searchParams.set('depth','2');history.replaceState(null,'',url);}
  stripFamilyDiagnostics();installTreeToolbar(content);reopenRelationshipResult();
  const memory=content.querySelector('.v129-tree-memory');if(memory)memory.dataset.v161Secondary='';
  const help=content.querySelector('.v154-tree-help');if(help)help.dataset.v161Secondary='';
  const focusbar=content.querySelector('.tree-focusbar');if(focusbar)focusbar.dataset.v161TreeControls='';
  content.querySelectorAll('.tree-trail,.legend').forEach(el=>el.dataset.v161Secondary='');
}

function compactPeople(){
  if(!isFamily()||routeKey()!=='people')return;
  const content=document.getElementById('content');if(!content)return;
  content.classList.add('v161-people');
  [...content.querySelectorAll('.notice')].forEach(n=>{if(/Inventory scope/i.test(n.textContent||''))n.remove();});
  [...content.querySelectorAll('.section-title')].forEach(s=>{if(/Person\s*\/\s*identity inventory|CANONICAL \+ FAMILY-SUPPLIED INVENTORY/i.test(s.textContent||''))s.remove();});
  const heading=content.querySelector('.v159-people-heading>div>p:last-child');if(heading)heading.textContent='Browse relatives by name or family branch.';
}

function compactHome(){
  if(!isFamily()||routeKey()!=='dashboard')return;
  const content=document.getElementById('content');if(!content)return;
  content.classList.add('v161-home');
  content.querySelector('.dashboard-hero-card')?.remove();
  const research=content.querySelector('.v157-research-center');
  if(research){research.classList.add('v161-research-band');research.querySelector('.v157-research-meta')?.remove();const copy=research.querySelector('p:not(.eyebrow)');if(copy)copy.textContent='Sources, evidence, unresolved identities, and open research questions live in a dedicated workspace.';const title=research.querySelector('h2');if(title)title.textContent='Research the records behind the family';}
}

function compactMedia(){
  if(!isFamily()||routeKey()!=='media')return;
  const content=document.getElementById('content');if(!content)return;content.classList.add('v161-media');
  content.querySelector('.media-page-hero')?.remove();
  const controls=content.querySelector('.media-library-controls');
  if(controls&&!controls.closest('.v161-media-filters')){
    const details=document.createElement('details');details.className='v161-media-filters';details.innerHTML='<summary><span>Filters</span><small>Type · decade · visibility · sort</small></summary>';controls.insertAdjacentElement('beforebegin',details);details.appendChild(controls);
  }
  const note=content.querySelector('#media-library-note');if(note&&!note.dataset.v161){note.dataset.v161='';note.innerHTML='<strong>Privacy protected.</strong> Only media safe for this family view is shown.';}
  const title=content.querySelector('.media-library-title h2');if(title)title.textContent='Photos & documents';
  const eyebrow=content.querySelector('.media-library-title .eyebrow');if(eyebrow)eyebrow.textContent='FAMILY COLLECTION';
}

function apply(){stripFamilyDiagnostics();compactHome();compactTree();compactPeople();compactMedia();}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

document.addEventListener('click',event=>{
  const open=event.target.closest?.('[data-v161-relationship]');if(open){const dialog=document.getElementById('v161-relationship-dialog');if(dialog?.showModal)dialog.showModal();else dialog?.setAttribute('open','');return;}
  const close=event.target.closest?.('[data-v161-close]');if(close){const dialog=close.closest('dialog');if(dialog?.close)dialog.close();else dialog?.removeAttribute('open');return;}
  const more=event.target.closest?.('[data-v161-tree-more]');if(more){const content=document.getElementById('content');const expanded=content?.classList.toggle('v161-show-tree-secondary');more.setAttribute('aria-expanded',String(Boolean(expanded)));}
});

window.addEventListener('family-view-rendered',schedule);window.addEventListener('hashchange',schedule);window.addEventListener('family-experience-changed',schedule);window.addEventListener('family-media-changed',schedule);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
