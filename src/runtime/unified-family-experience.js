import{displayPeople,allPedigreeRelationships,branchMembership,personById,esc}from'../../core.js';
import{hydrateNativeFamily}from'./native-family-v17.js';

const routeKey=()=>location.hash.slice(1).split('/')[0]||'dashboard';
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();
const personBranches=person=>{const values=branchMembership(person);return(values.length?values:[cleanBranch(person?.branch)]).map(value=>String(value||'').trim()).filter(Boolean);};
const activeRelationships=()=>allPedigreeRelationships().filter(rel=>rel.active!==false&&!/REJECTED/i.test(String(rel.state||''))&&['parent-child','direct-line-succession','spouse'].includes(String(rel.type||'')));
const memberIdsForBranch=branch=>new Set(displayPeople().filter(person=>personBranches(person).includes(branch)).map(person=>person.id));

function incidentRelationships(person,rels=activeRelationships()){return rels.filter(rel=>rel.from===person.id||rel.to===person.id);}
function representativeScore(person,rels=activeRelationships()){
  const incident=incidentRelationships(person,rels),neighbors=incident.map(rel=>personById(rel.from===person.id?rel.to:rel.from)).filter(Boolean),neighborBranches=new Set(neighbors.flatMap(personBranches));
  const supported=incident.filter(rel=>/SUPPORTED/i.test(String(rel.state||''))).length;
  const structural=incident.filter(rel=>rel.type==='parent-child'||rel.type==='direct-line-succession').length;
  return incident.length*100+neighborBranches.size*12+supported*4+structural*2;
}
function chooseRepresentative(people=displayPeople(),rels=activeRelationships()){
  const available=people.filter(Boolean),historical=available.filter(person=>!person.living),pool=historical.length?historical:available;
  return pool.slice().sort((a,b)=>representativeScore(b,rels)-representativeScore(a,rels)||String(a.name).localeCompare(String(b.name))||String(a.id).localeCompare(String(b.id)))[0]||null;
}
function branchNames(){return[...new Set(displayPeople().flatMap(personBranches))].filter(Boolean).sort((a,b)=>a.localeCompare(b));}
function branchRepresentative(branch,rels=activeRelationships()){
  const ids=memberIdsForBranch(branch),members=displayPeople().filter(person=>ids.has(person.id));
  return chooseRepresentative(members,rels);
}
function balancedFeatured(limit=6){
  const rels=activeRelationships(),rows=[],used=new Set();
  for(const branch of branchNames()){
    const person=branchRepresentative(branch,rels);if(!person||used.has(person.id))continue;
    rows.push({branch,person});used.add(person.id);if(rows.length>=limit)break;
  }
  if(rows.length<limit){
    for(const person of displayPeople().filter(person=>!person.living).sort((a,b)=>representativeScore(b,rels)-representativeScore(a,rels)||String(a.name).localeCompare(String(b.name)))){
      if(used.has(person.id))continue;rows.push({branch:personBranches(person)[0]||'Family',person});used.add(person.id);if(rows.length>=limit)break;
    }
  }
  return rows;
}
function treeHref(id,scope='family',depth=3){const url=new URL(location.href);for(const key of['q','branch','state','from','to'])url.searchParams.delete(key);if(id)url.searchParams.set('focus',id);else url.searchParams.delete('focus');url.searchParams.set('scope',scope);if(scope==='family')url.searchParams.set('depth',String(depth));else url.searchParams.delete('depth');url.hash='tree';return`${url.pathname}${url.search}${url.hash}`;}
function peopleHref(branch){const url=new URL(location.href);for(const key of['q','state','focus','scope','depth','from','to'])url.searchParams.delete(key);url.searchParams.set('branch',branch);url.hash='people';return`${url.pathname}${url.search}${url.hash}`;}
function initials(name){return String(name||'?').replace(/\/.*/,'').trim().split(/\s+/).filter(Boolean).map(token=>token[0]).slice(0,2).join('').toUpperCase()||'?';}
function personCard(person,branch){return`<article class="v17-home-person v172-home-person"><button type="button" data-person="${esc(person.id)}"><span class="v17-avatar" data-v17-person-photo="${esc(person.id)}">${esc(initials(person.name))}</span><span><small>${esc(branch||personBranches(person)[0]||'Family')}</small><b>${esc(String(person.name||'').replace(/\s*\/.*$/,'').trim())}</b><em>${person.living?'Living — details protected':esc(person.dates||'Dates not recorded')}</em><p>Open this person and follow their connected family.</p></span><i aria-hidden="true">→</i></button></article>`;}

function installHomeBranchIndex(root){
  if(root.querySelector('.v172-home-branches'))return;
  const hero=root.querySelector('.v17-home-hero'),branches=branchNames(),rels=activeRelationships();if(!hero||!branches.length)return;
  const cards=branches.map(branch=>{const members=displayPeople().filter(person=>personBranches(person).includes(branch)),rep=branchRepresentative(branch,rels);return`<a class="v172-branch-card" href="${esc(peopleHref(branch))}"><span>${esc(branch)}</span><b>${members.length} ${members.length===1?'person':'people'}</b>${rep?`<small>Start with ${esc(String(rep.name||'').replace(/\s*\/.*$/,'').trim())}</small>`:''}</a>`;}).join('');
  const section=document.createElement('section');section.className='v172-home-branches';section.innerHTML=`<div class="v17-section-head"><div><p class="eyebrow">FAMILY BRANCHES</p><h2>One archive, many connected lines</h2><p>Every documented branch is a peer part of the family history. Open a branch for its people, places, stories, and records.</p></div><a href="#people">Browse all people ↗</a></div><div class="v172-branch-grid">${cards}</div>`;hero.insertAdjacentElement('afterend',section);
}
function installBalancedHomeTree(root){
  const section=root.querySelector('.v17-home-tree');if(!section||section.dataset.v172Unified==='true')return;
  const rels=activeRelationships(),focus=chooseRepresentative(displayPeople(),rels);if(!focus)return;
  const parents=rels.filter(rel=>(rel.type==='parent-child'||rel.type==='direct-line-succession')&&rel.to===focus.id).map(rel=>personById(rel.from)).filter(Boolean).slice(0,2);
  const spouse=rels.filter(rel=>rel.type==='spouse'&&(rel.from===focus.id||rel.to===focus.id)).map(rel=>personById(rel.from===focus.id?rel.to:rel.from)).find(Boolean)||null;
  const children=rels.filter(rel=>(rel.type==='parent-child'||rel.type==='direct-line-succession')&&rel.from===focus.id).map(rel=>personById(rel.to)).filter(Boolean).slice(0,3);
  const button=(person,label)=>`<button type="button" class="v17-relative" data-person="${esc(person.id)}"><span class="v17-avatar small" data-v17-person-photo="${esc(person.id)}">${esc(initials(person.name))}</span><span><small>${esc(label)}</small><b>${esc(String(person.name||'').replace(/\s*\/.*$/,'').trim())}</b><em>${person.living?'Living — details protected':esc(person.dates||'Dates not recorded')}</em></span></button>`;
  section.dataset.v172Unified='true';
  section.innerHTML=`<div class="v17-section-head"><div><p class="eyebrow">FAMILY CONNECTIONS</p><h2>Navigate the connected family network</h2><p>Start from a well-connected person, then move freely across branches, generations, spouses, parents, and descendants.</p></div><a href="${esc(treeHref(focus.id,'connected'))}">Explore the connected tree ↗</a></div><div class="v17-home-tree-canvas v172-home-tree-canvas">${parents.length?`<div class="v17-home-tree-row parents">${parents.map(person=>button(person,'Parent')).join('')}</div><i aria-hidden="true"></i>`:''}<div class="v17-home-tree-row focus">${button(focus,'Network starting point')}${spouse?button(spouse,'Spouse / partner'):''}</div>${children.length?`<i aria-hidden="true"></i><div class="v17-home-tree-row children">${children.map(person=>button(person,'Child')).join('')}</div>`:''}</div>`;
}
function installBalancedFeatured(root){
  const section=root.querySelector('.v17-featured-people'),grid=section?.querySelector('.v17-home-people-grid');if(!section||!grid||grid.dataset.v172Balanced==='true')return;
  const featured=balancedFeatured(6);if(!featured.length)return;
  const heading=section.querySelector('.v17-section-head h2');if(heading)heading.textContent='Meet people across the branches';
  const eyebrow=section.querySelector('.v17-section-head .eyebrow');if(eyebrow)eyebrow.textContent='ACROSS THE FAMILY';
  grid.dataset.v172Balanced='true';grid.innerHTML=featured.map(({branch,person})=>personCard(person,branch)).join('');
}
function installTreeBranchNavigator(root){
  if(root.querySelector('.v172-tree-branches'))return;
  const focusbar=root.querySelector('.tree-focusbar');if(!focusbar)return;
  const rels=activeRelationships(),branches=branchNames();
  const buttons=branches.map(branch=>{const rep=branchRepresentative(branch,rels);return rep?`<button type="button" data-v172-tree-branch="${esc(branch)}" data-focus="${esc(rep.id)}">${esc(branch)}</button>`:'';}).join('');
  const neutral=chooseRepresentative(displayPeople(),rels);
  const nav=document.createElement('section');nav.className='v172-tree-branches';nav.innerHTML=`<div><span class="eyebrow">EXPLORE THE FAMILY</span><b>Jump to a branch or return to the connected network</b></div><div class="v172-tree-branch-actions">${neutral?`<button type="button" class="v172-whole-family" data-v172-tree-connected data-focus="${esc(neutral.id)}">Connected family</button>`:''}${buttons}</div>`;focusbar.insertAdjacentElement('beforebegin',nav);
}

let mediaPromise=null;
async function publicMedia(){if(!mediaPromise)mediaPromise=fetch('/api/media',{credentials:'same-origin',cache:'no-store'}).then(response=>response.ok?response.json():{media:[]}).then(data=>(data.media||[]).filter(item=>item.visibility==='public')).catch(()=>[]);return mediaPromise;}
function imageForPerson(media,id){return media.filter(item=>String(item.mime||'').startsWith('image/')&&(item.personIds||[]).includes(id)).sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)))[0]||null;}
async function hydrateTreePortraits(root){
  const svg=root.querySelector('#family-graph');if(!svg)return;
  const media=await publicMedia();if(!svg.isConnected)return;
  let defs=svg.querySelector('defs[data-v172-tree-portraits]');if(!defs){defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.dataset.v172TreePortraits='true';svg.prepend(defs);}
  root.querySelectorAll('.graph-node[data-person]').forEach(node=>{
    const id=node.dataset.person,person=personById(id);if(!id||person?.living||node.querySelector('.v172-node-photo'))return;
    const item=imageForPerson(media,id);if(!item)return;
    const clipId=`v172-photo-${String(id).replace(/[^a-zA-Z0-9_-]/g,'-')}`;
    if(!defs.querySelector(`#${CSS.escape(clipId)}`)){const clip=document.createElementNS('http://www.w3.org/2000/svg','clipPath');clip.id=clipId;const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx','36');circle.setAttribute('cy','39');circle.setAttribute('r','21');clip.append(circle);defs.append(clip);}
    const image=document.createElementNS('http://www.w3.org/2000/svg','image');image.classList.add('v172-node-photo');image.setAttribute('x','15');image.setAttribute('y','18');image.setAttribute('width','42');image.setAttribute('height','42');image.setAttribute('preserveAspectRatio','xMidYMid slice');image.setAttribute('clip-path',`url(#${clipId})`);image.setAttribute('href',`/api/media?file=${encodeURIComponent(item.id)}`);image.setAttribute('aria-hidden','true');
    const initialsNode=node.querySelector('.node-initials');(initialsNode||node.firstChild)?.before?.(image);if(initialsNode)initialsNode.classList.add('v172-has-photo');
  });
}
function clearLiveTreeFilters(){for(const id of['search','branch','state']){const control=document.getElementById(id);if(control)control.value='';}}
function replaceUrlForTree(focus,scope,depth){const url=new URL(location.href);for(const key of['q','branch','state','from','to'])url.searchParams.delete(key);if(focus&&scope!=='all')url.searchParams.set('focus',focus);else url.searchParams.delete('focus');url.searchParams.set('scope',scope);if(scope==='family')url.searchParams.set('depth',String(depth||3));else url.searchParams.delete('depth');url.hash='tree';clearLiveTreeFilters();history.replaceState(null,'',url);window.dispatchEvent(new HashChangeEvent('hashchange'));}

function apply(){
  const root=document.querySelector('#content [data-v17-native]');if(!root)return;
  if(routeKey()==='dashboard'){installHomeBranchIndex(root);installBalancedHomeTree(root);installBalancedFeatured(root);hydrateNativeFamily();}
  if(routeKey()==='tree'){installTreeBranchNavigator(root);hydrateTreePortraits(root);}
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;apply();}));}

// Own Tree scope changes in capture phase so no historical compatibility fallback
// can re-introduce a surname-specific focal person when a selector is unavailable.
document.addEventListener('click',event=>{
  if(routeKey()!=='tree')return;
  const mode=event.target.closest?.('[data-tree-scope]');if(!mode)return;
  event.preventDefault();event.stopImmediatePropagation();
  const scope=mode.dataset.treeScope,selected=document.querySelector('[data-tree-person]')?.value||'',neutral=chooseRepresentative(displayPeople(),activeRelationships())?.id||'';
  const depth=Math.max(1,Math.min(3,Number(new URL(location.href).searchParams.get('depth')||2)));
  replaceUrlForTree(scope==='all'?'':selected||neutral,scope,depth);
},true);

document.addEventListener('click',event=>{
  const branch=event.target.closest?.('[data-v172-tree-branch]');if(branch){event.preventDefault();replaceUrlForTree(branch.dataset.focus,'family',3);return;}
  const connected=event.target.closest?.('[data-v172-tree-connected]');if(connected){event.preventDefault();replaceUrlForTree(connected.dataset.focus,'connected');}
});
window.addEventListener('family-view-rendered',schedule);window.addEventListener('hashchange',schedule);window.addEventListener('family-media-changed',()=>{mediaPromise=null;schedule();});window.addEventListener('family-auth-changed',()=>{mediaPromise=null;schedule();});window.addEventListener('family-experience-changed',schedule);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
