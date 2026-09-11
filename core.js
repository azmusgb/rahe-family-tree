import{buildBranchIndex,recordMatchesBranch}from'./branch-index.js';
export const $=(s,root=document)=>root.querySelector(s);
export const $$=(s,root=document)=>[...root.querySelectorAll(s)];
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const norm=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^\x00-\x7F]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

export const routes={
  dashboard:['Home','Explore the family, branches, people, photographs, timeline, and open questions.'],
  tree:['Tree','Explore connected family relationships while preserving the evidence state of every asserted connection.'],
  people:['People','Browse the canonical, family-supplied, and locally edited people in the family archive.'],
  media:['Photos & Documents','Browse family photographs and documents by person, branch, date, location, and source context.'],
  families:['Family Groups','Live spouse-centered family units recalculated from effective parentage and local edits.'],
  editor:['Family Editor','Add, update, hide, restore, review, undo, export, and import family-tree changes without rewriting canonical evidence.'],
  identity:['Identity Lab','Dedicated DeVine/DeVeine → William John Rahe Sr. identity-transition investigation.'],
  branches:['Branches','Branch-oriented navigation across people, claims, tasks, and canonical dossier sections.'],
  timeline:['Timeline','Normalized source-dated genealogy events with exact dossier-row traceability.'],
  evidence:['Evidence','Claim register, relationship assertions, promotion gate, and source traceability.'],
  sources:['Sources','Canonical source IDs, source-use cautions, crosswalks, and claim/relationship usage.'],
  research:['Research Queue','Operational research workflow layered on the source-controlled acquisition queue.'],
  intelligence:['Research Intelligence','Advisory duplicate, chronology, structural-integrity, privacy, and evidence-gap signals for human review.'],
  conflicts:['Conflicts','Unresolved, rejected, conflicted, and quarantined material retained without promotion.'],
  migration:['Migration','Source-controlled migration and geographic reconstruction from the canonical dossier.'],
  archive:['Archive','Complete public-safe canonical corpus, Appendices A–G, Part II legacy annexes, and final certification.']
};

export let model=null,corpus=null,route='dashboard';
let branchMemo={key:'',value:null};
export function setData(m,c){model=m;corpus=c;branchMemo={key:'',value:null};}
export function setRoute(r){route=r;}
const familyEditState=()=>{try{const x=JSON.parse(localStorage.getItem('rahe.family.editor.v1')||'null');return x?.version===1?x:null;}catch{return null;}};
export function supplementalPeople(){return model?.familySupplement?.people||[];}
export function basePeople(){return[...(model?.people||[]),...supplementalPeople()];}
export function allPeople(){const st=familyEditState(),hidden=new Set(st?.peopleHidden||[]),patches=st?.personPatches||{},added=st?.peopleAdded||[];return[...basePeople().filter(p=>!hidden.has(p.id)).map(p=>patches[p.id]?{...p,...patches[p.id]}:p),...added.filter(p=>!hidden.has(p.id))];}
export function displayPeople(){const superseded=model?.familySupplement?.aggregateReplacement?.canonicalPersonId;return allPeople().filter(p=>!superseded||p.id!==superseded);}
export function basePedigreeRelationships(){return[...(model?.relationships||[]),...(model?.familySupplement?.relationships||[])];}
export function allPedigreeRelationships(){const st=familyEditState(),hiddenPeople=new Set(st?.peopleHidden||[]),hidden=new Set(st?.relationshipsHidden||[]),patches=st?.relationshipPatches||{},added=st?.relationshipsAdded||[];return[...basePedigreeRelationships().filter(r=>!hidden.has(r.id)&&!hiddenPeople.has(r.from)&&!hiddenPeople.has(r.to)).map(r=>patches[r.id]?{...r,...patches[r.id]}:r),...added.filter(r=>!hidden.has(r.id)&&!hiddenPeople.has(r.from)&&!hiddenPeople.has(r.to))];}
export function allFamilyGroups(){
  const rels=allPedigreeRelationships().filter(r=>r.active!==false&&!/REJECTED/i.test(r.state||'')),parents=rels.filter(r=>r.type==='parent-child'),spouses=rels.filter(r=>r.type==='spouse'),people=new Set(displayPeople().map(p=>p.id));
  const seeds=[...(model?.familyGroups||[]),...(model?.familySupplement?.familyGroups||[])].map(g=>({id:g.id,label:g.label||'',branch:g.branch||'',spouseIds:[...(g.spouseIds||[])],state:g.state||'SUPPORTED',supplemental:Boolean(g.supplemental),sourceLocation:g.sourceLocation||null,contextRelationshipIds:g.contextRelationshipIds||[]}));
  const pairKey=(a,b)=>[a,b].sort().join('|'),seen=new Set(seeds.map(g=>pairKey(...g.spouseIds)));
  for(const r of spouses){const key=pairKey(r.from,r.to);if(seen.has(key))continue;seen.add(key);seeds.push({id:r.id.startsWith('LOCAL-')?`FG-${r.id}`:`DERIVED-${r.id}`,label:`${personById(r.from)?.name||r.from} × ${personById(r.to)?.name||r.to}`,branch:personById(r.from)?.branch||personById(r.to)?.branch||'Family',spouseIds:[r.from,r.to],state:r.state||'SUPPORTED',supplemental:Boolean(r.provenance),sourceLocation:r.source||null,contextRelationshipIds:[]});}
  return seeds.filter(g=>g.spouseIds.length===2&&g.spouseIds.every(id=>people.has(id))).map(g=>{const[a,b]=g.spouseIds,achild=new Set(parents.filter(r=>r.from===a).map(r=>r.to)),childIds=[...new Set(parents.filter(r=>r.from===b&&achild.has(r.to)).map(r=>r.to))].filter(id=>people.has(id));return{...g,label:g.label||`${personById(a)?.name||a} × ${personById(b)?.name||b}`,childIds,memberCount:2+childIds.length,hasChildren:childIds.length>0,derivedLive:true};});
}
function branchIndex(){const st=familyEditState(),key=`${model?.meta?.release||''}|${JSON.stringify(st||{})}`;if(branchMemo.key!==key||!branchMemo.value)branchMemo={key,value:buildBranchIndex({model,corpus,people:displayPeople(),relationships:allPedigreeRelationships(),familyGroups:allFamilyGroups()})};return branchMemo.value;}
export function matchesBranch(value,branch){return recordMatchesBranch(branchIndex(),value,branch);}
export function branchMembership(value){const index=branchIndex(),out=[];for(const b of index.branches)if(recordMatchesBranch(index,value,b))out.push(b);return out;}
export function localEditSummary(){const st=familyEditState();return{peopleAdded:st?.peopleAdded?.length||0,peopleEdited:Object.keys(st?.personPatches||{}).length,peopleHidden:st?.peopleHidden?.length||0,relationshipsAdded:st?.relationshipsAdded?.length||0,relationshipsEdited:Object.keys(st?.relationshipPatches||{}).length,relationshipsHidden:st?.relationshipsHidden?.length||0};}
export function stateClass(value=''){const u=String(value).toUpperCase();return['REJECTED','UNRESOLVED','PROVISIONAL','DERIVATIVE','SUPPORTED'].find(s=>u.includes(s))?.toLowerCase()||'neutral';}
export function stateBadges(value=''){const u=String(value).toUpperCase();const t=['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED','DERIVATIVE'].filter(x=>u.includes(x));return(t.length?t:['QUALIFIED']).map(x=>`<span class="badge ${x.toLowerCase()}">${x}</span>`).join('');}
export function sourceIds(value=''){return[...new Set(String(value).match(/\b[CWV]\d{3}\b/g)||[])];}
export function sectionById(id){return corpus.sections.find(s=>s.id===id);}
export function personById(id){return allPeople().find(p=>p.id===id);}
export function claimById(id){return model.claims.find(c=>c.id===id);}
export function sourceById(id){return model.sources.find(s=>s.id===id);}
export function taskById(id){return model.researchTasks.find(t=>t.id===id);}
export function currentFilters(){return{q:$('#search').value.trim(),branch:$('#branch').value,state:$('#state').value};}
export function matches(value){const{q,branch,state}=currentFilters();const raw=JSON.stringify(value),n=norm(raw);return(!q||n.includes(norm(q)))&&matchesBranch(value,branch)&&(!state||raw.toUpperCase().includes(state));}
export function syncUrl(){const u=new URL(location.href);for(const[k,v]of Object.entries(currentFilters()))v?u.searchParams.set(k,v):u.searchParams.delete(k);history.replaceState(null,'',u);}
export function hydrateUrl(){const u=new URL(location.href);$('#search').value=u.searchParams.get('q')||'';$('#branch').value=u.searchParams.get('branch')||'';$('#state').value=u.searchParams.get('state')||'';}
export function sourceButtons(text=''){let safe=esc(text);for(const id of sourceIds(text))safe=safe.replaceAll(id,`<button class="text-link" data-source="${id}">${id}</button>`);return safe;}
export function deepLink(loc,label='Open source location ↗'){return loc?.section?`<a class="deep-link" href="#archive/${esc(loc.section)}">${esc(label)}</a>`:'';}
export const metric=(value,label,detail='')=>`<article class="metric"><strong>${esc(value)}</strong><span>${esc(label)}</span>${detail?`<small>${esc(detail)}</small>`:''}</article>`;
export const notice=(title,body,kind='info')=>`<aside class="notice ${kind}"><strong>${esc(title)}</strong><p>${body}</p></aside>`;
export const miniPerson=p=>`<button class="mini-person state-${stateClass(p.state)}" data-person="${p.id}"><span>${esc(p.branch)}</span><b>${esc(p.name)}</b><small>${esc(p.state)}</small></button>`;
export const personCard=p=>`<article class="person-card state-${stateClass(p.state)}"><button data-person="${p.id}" class="person-open"><span class="eyebrow">${esc(p.branch)} · ${esc(p.id)}</span><h3>${esc(p.name)}</h3><p>${esc(p.dates)}</p><div>${stateBadges(p.state)}</div><small>${esc(p.role)}</small>${p.provenance?`<em class="supplement-tag">${/LOCAL FAMILY EDIT/i.test(p.provenance)?'Local edit overlay':'Family-supplied supplement'}</em>`:''}</button></article>`;
export const claimCard=c=>`<article class="claim-card state-${stateClass(c.state)}"><div class="claim-top"><code>${esc(c.id)}</code><div>${stateBadges(c.state)}</div></div><h3>${esc(c.claim)}</h3><p><b>Current basis:</b> ${sourceButtons(c.basis)}</p><p><b>Next action:</b> ${esc(c.nextAction)}</p><div class="link-row"><button class="text-link" data-claim="${c.id}">Open claim dossier</button>${deepLink(c.location)}</div></article>`;
export const sourceCard=s=>`<article class="source-card"><div class="source-top"><code>${esc(s.id)}</code><span>${esc(s.class)}</span></div><h3>${esc(s.name)}</h3><p>${esc(s.use)}</p><small>${esc(s.weight)}</small><div class="source-usage"><span>${s.claimIds.length} claims</span><span>${s.relationshipIds.length} relationships</span></div><button class="action" data-source="${s.id}">Open source dossier</button></article>`;
export const taskCard=t=>`<article class="task-card priority-${t.state.toLowerCase()}"><div class="task-top"><code>${esc(t.id)}</code><span>${esc(t.priority)}</span></div><h3>${esc(t.record)}</h3><p class="task-branch">${esc(t.branch)}</p><p>${esc(t.payoff)}</p>${t.operationalStatus?`<p><span class="workflow-status">${esc(t.operationalStatus)}</span> <small>${esc(t.operationalStatusAuthority)}</small></p>`:''}<div class="link-row"><button class="text-link" data-task="${t.id}">Open task</button>${deepLink(t.sourceLocation,'Queue row ↗')}</div></article>`;
export function relationshipRow(r){const a=personById(r.from),b=personById(r.to);return`<article class="relationship-row state-${stateClass(r.state)}"><span>${esc(r.type)}</span><button data-person="${a?.id||''}">${esc(a?.name||r.from)}</button><b>→</b><button data-person="${b?.id||''}">${esc(b?.name||r.to)}</button><small>${stateBadges(r.state)} ${esc(r.state)}${r.provenance?` · ${/LOCAL FAMILY EDIT/i.test(r.provenance)?'LOCAL EDIT':'FAMILY-SUPPLIED SUPPLEMENT'}`:''}</small>${deepLink(r.source)}</article>`;}
export function sectionBlock(block,section,bi){if(block.type==='p')return`<p id="${section.id}-b${bi}">${sourceButtons(block.text)}</p>`;const rows=block.rows||[];if(!rows.length)return'';return`<div class="table-wrap" tabindex="0" aria-label="Scrollable table from ${esc(section.title)}"><table><thead><tr>${rows[0].map(c=>`<th scope="col">${sourceButtons(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((r,i)=>`<tr id="${section.id}-r${i+1}">${r.map(c=>`<td>${sourceButtons(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
export function sectionCard(s,open=false){const layer=s.legacy?`LEGACY ANNEX · ${s.annex||'Historical layer'}`:s.title.startsWith('25.')?'v10 FINAL CERTIFICATION':'PART I · CANONICAL / CONTROL';return`<details class="dossier-section" id="${s.id}" ${open?'open':''}><summary><span>${esc(s.title)}</span><small>${esc(layer)} · ${s.id}</small></summary><div class="document">${s.legacy?'<aside class="legacy-note"><b>Historical source layer.</b> Retained losslessly apart from public privacy redactions; it cannot promote evidence over Part I controls.</aside>':''}${s.blocks.map((b,i)=>sectionBlock(b,s,i)).join('')}</div></details>`;}
export function sectionList(sections,open=false,openId=''){return`<div class="section-list">${sections.filter(matches).map(s=>sectionCard(s,open||s.id===openId)).join('')}</div>`;}
export function renderNav(){const nav=$('#nav');nav.innerHTML=Object.entries(routes).map(([key,[title]],i)=>`<a href="#${key}" class="${route===key?'active':''}" ${route===key?'aria-current="page"':''}><span>${String(i+1).padStart(2,'0')}</span>${esc(title)}</a>`).join('');}
export function globalSearchResults(){const{q,branch,state}=currentFilters();if(!q)return'';const groups=[['person',displayPeople(),p=>p.name,p=>`${p.branch} · ${p.state}`],['claim',model.claims,c=>c.claim,c=>`${c.id} · ${c.state}`],['source',model.sources,s=>s.name,s=>`${s.id} · ${s.weight}`],['task',model.researchTasks,t=>t.record,t=>`${t.priority} · ${t.branch}`]];let total=0,html='';for(const[k,arr,title,meta]of groups){const hits=arr.filter(matches).slice(0,8);total+=hits.length;html+=hits.map(x=>`<button class="search-hit" data-${k}="${esc(x.id)}"><span>${k.toUpperCase()}</span><b>${esc(title(x))}</b><small>${esc(meta(x))}</small></button>`).join('');}const sections=corpus.sections.filter(matches).slice(0,10);total+=sections.length;html+=sections.map(s=>`<a class="search-hit" href="#archive/${s.id}"><span>SECTION</span><b>${esc(s.title)}</b><small>${s.legacy?'Legacy annex':'Canonical/control'} · ${s.id}</small></a>`).join('');const active=[branch?`branch: ${branch}`:'',state?`state: ${state}`:''].filter(Boolean).join(' · ');return`<section class="search-results" aria-label="Global search results"><div class="section-title"><div><p class="eyebrow">GLOBAL SEARCH</p><h2>Matches for “${esc(q)}”</h2>${active?`<small>Filtered by ${esc(active)}</small>`:''}</div><span>${total} top matches</span></div><div class="search-grid">${html||'<div class="empty compact">No results match the current search and filters.</div>'}</div></section>`;}
