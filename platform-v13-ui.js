import{model,esc,notice,metric,stateBadges,stateClass,displayPeople,allPedigreeRelationships,allFamilyGroups,personById,sourceById,claimById,taskCard,deepLink,sourceIds}from'./core.js';
import{effectiveTaskState}from'./research-state.js';
import{findRelationshipPath,pedigreeCycles,connectedComponent,collateral,directLine,controllingState}from'./canonical-graph-engine.js';

const relationships=()=>[...allPedigreeRelationships(),...(model?.contextRelationships||[])];
const personName=id=>personById(id)?.name||id;
const pct=(a,b)=>b?Math.round((a/b)*100):0;

export function renderTreeEngine2Header(){
  const graph=model?.canonicalGraph;
  const cycles=pedigreeCycles(relationships());
  return `<section class="platform-hero platform-tree2"><div><p class="eyebrow">TREE ENGINE 2.0</p><h2>Evidence-aware traversal across the canonical family graph</h2><p>Connected components, direct lines, collateral family, spouse/couple context, generation lanes, and relationship paths use explicit graph edges only. Rejected edges remain excluded and the DeVine/DeVeine identity bridge remains unresolved.</p></div><div class="platform-metrics">${metric(graph?.counts?.nodes||0,'graph nodes')}${metric(graph?.counts?.edges||0,'graph edges')}${metric(cycles.length,'pedigree cycles',cycles.length?'requires review':'none detected')}</div><div class="platform-actions"><a class="action primary" href="#relationships">Find a relationship</a><a class="action" href="#audit">Graph audit</a></div></section>`;
}

function selector(name,value){return `<select name="${name}" data-${name}>${displayPeople().slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<option value="${esc(p.id)}" ${p.id===value?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;}
function defaultRelationshipIds(){const people=displayPeople();const byName=rx=>people.find(p=>rx.test(p.name))?.id;return[byName(/William John Rahe III/i)||people[0]?.id||'',byName(/William John Rahe Sr/i)||people[1]?.id||people[0]?.id||''];}

export function renderRelationshipFinder(){
  const url=new URL(location.href),defaults=defaultRelationshipIds(),from=url.searchParams.get('from')||defaults[0],to=url.searchParams.get('to')||defaults[1];
  const path=findRelationshipPath(from,to,relationships(),{includeContext:true});
  const result=!path?`<div class="empty">No evidence-qualified path is currently structured between these people.</div>`:path.hops.length===0?`<aside class="notice control"><strong>Same person</strong><p>The selected endpoints are identical.</p></aside>`:`<section class="relationship-path-result state-${stateClass(path.evidenceState)}"><div class="section-title"><div><p class="eyebrow">RELATIONSHIP RESULT</p><h2>${esc(personName(from))} → ${esc(personName(to))}</h2></div><span>${esc(path.classification)}</span></div><div class="relationship-path-summary"><b>${path.hops.length} hop${path.hops.length===1?'':'s'}</b><span>${stateBadges(path.evidenceState)} ${esc(path.evidenceState)}</span></div><div class="relationship-path">${path.hops.map((hop,i)=>`<article class="path-hop state-${stateClass(hop.evidenceState)}"><button data-person="${esc(hop.from)}">${esc(personName(hop.from))}</button><div><span>${esc(hop.label)}</span>${stateBadges(hop.evidenceState)}<small>${esc(hop.type)} · ${esc(hop.evidenceState)}</small></div><button data-person="${esc(hop.to)}">${esc(personName(hop.to))}</button>${deepLink(hop.source,'Evidence ↗')}</article>`).join('')}</div></section>`;
  return `${notice('Relationship finder rule','Paths use explicit structured relationships only. Context and unresolved identity edges remain visibly qualified; a path never promotes an evidence state.','control')}<form class="relationship-finder" id="relationship-finder"><label>From${selector('relationship-from',from)}</label><span aria-hidden="true">→</span><label>To${selector('relationship-to',to)}</label><button class="action primary" type="submit">Find relationship</button></form>${result}`;
}

function diffBlock(label,value){const changed=(value?.missing?.length||0)+(value?.extra?.length||0)+(value?.stateChanged?.length||0);return `<article class="diff-card ${changed?'warn':'pass'}"><h3>${esc(label)}</h3><b>${changed}</b><span>differences</span><small>${value?.missing?.length||0} missing · ${value?.extra?.length||0} extra · ${value?.stateChanged?.length||0} state changes</small></article>`;}
export function renderCanonicalGraphAudit(){
  const g=model?.canonicalGraph,d=model?.canonicalDiff,p=model?.provenanceIndex,entries=Object.values(p?.entities||{}),withSource=entries.filter(x=>x.sourceLocation||x.sourceIds?.length).length;
  const checks=[['Duplicate graph nodes',g?.integrity?.duplicateNodeIds||[]],['Orphan graph edges',g?.integrity?.orphanEdges||[]],['Active rejected edges',g?.integrity?.activeRejectedEdges||[]],['Person self-edges',g?.integrity?.selfPersonEdges||[]]];
  return `${notice('Canonical graph authority',g?.authority||'Read-only graph layer.','control')}<section class="platform-hero"><div><p class="eyebrow">CANONICAL GRAPH SCHEMA</p><h2>One typed graph for people, family units, claims, sources, events, places, households, and research tasks</h2><p>The graph is a read model over the source-controlled dossier. Provenance, navigation, relationship finding, and research operations cannot silently mutate controlling evidence.</p></div><div class="platform-metrics">${metric(g?.counts?.nodes||0,'nodes')}${metric(g?.counts?.edges||0,'edges')}${metric(g?.counts?.familyUnits||0,'family units')}${metric(g?.counts?.places||0,'place labels')}${metric(g?.counts?.households||0,'household observations')}</div></section><section><div class="section-title"><div><p class="eyebrow">INTEGRITY</p><h2>Graph release gates</h2></div><span class="audit ${g?.integrity?.pass?'pass':'warn'}">${g?.integrity?.pass?'PASS':'REVIEW'}</span></div><div class="audit-grid">${checks.map(([label,items])=>`<article><b>${items.length?'!':'✓'} ${esc(label)}</b><p>${items.length?esc(items.slice(0,8).join(' · ')):'None detected'}</p></article>`).join('')}<article><b>${g?.integrity?.identityBridgeSafe?'✓':'!'} Identity bridge semantics</b><p>${g?.integrity?.identityBridgeSafe?'DeVine/DeVeine ↔ William John Rahe Sr. remains unresolved and non-pedigree.':'Requires immediate review.'}</p></article></div></section><section><div class="section-title"><div><p class="eyebrow">CANONICAL DIFF</p><h2>Controlling corpus → structured model</h2></div><span>${d?.hasCanonicalLoss||d?.hasEvidencePromotion?'BLOCKING':'CLEAN'}</span></div><div class="canonical-diff-grid">${diffBlock('People',d?.people)}${diffBlock('Relationships',d?.relationships)}${diffBlock('Claims',d?.claims)}${diffBlock('Sources',d?.sources)}</div></section><section class="panel"><div class="section-title"><div><p class="eyebrow">PROVENANCE COVERAGE</p><h2>Why each structured record exists</h2></div><span>${pct(withSource,entries.length)}% source-located</span></div><p>${withSource} of ${entries.length} provenance entries carry an explicit source location or registered source ID. Absence of a source location remains visible rather than being filled from inference.</p><div class="archive-actions"><a href="canonical-graph.json" download>Canonical graph JSON</a><a href="provenance-index.json" download>Provenance index</a><a href="canonical-diff.json" download>Canonical diff</a><a href="canonical-completeness.json" download>Completeness report</a></div></section>`;
}

const taskScore=t=>{
  const priority=String(t.priority||t.state||'').toUpperCase();
  let score=/CRITICAL|HIGHEST/.test(priority)?100:/HIGH/.test(priority)?75:/MEDIUM/.test(priority)?50:25;
  score+=Math.min(20,(t.potentialClaimIds?.length||0)*5);
  score+=Math.min(10,(t.peopleIds?.length||0)*2);
  if((t.negativeSearchIds?.length||0)>0)score+=5;
  return score;
};
export function renderResearchCommandCenterV2(){
  const tasks=(model?.researchTasks||[]).map(t=>({...t,operationalScore:taskScore(t),effective:effectiveTaskState(t)})).sort((a,b)=>b.operationalScore-a.operationalScore||String(a.id).localeCompare(String(b.id)));
  const status=tasks.reduce((m,t)=>(m[t.effective.status]=(m[t.effective.status]||0)+1,m),{}),open=tasks.filter(t=>!/DONE|COMPLETE/i.test(t.effective.status||''));
  const top=open.slice(0,8);
  return `${notice('Research Command Center 2.0','Operational ranking helps decide what to research next. Scores are advisory and cannot promote claims, create relationships, or merge identities. Canonical queue wording and evidence states remain controlling.','control')}<section class="platform-hero research-command"><div><p class="eyebrow">RESEARCH COMMAND CENTER 2.0</p><h2>Prioritize records by expected evidentiary payoff</h2><p>Priority, linked claims, people, negative-search history, and private workflow state are combined only for work planning.</p></div><div class="platform-metrics">${metric(tasks.length,'research targets')}${metric(open.length,'open targets')}${metric(model?.negativeSearches?.length||0,'negative searches')}${metric(model?.evidenceGaps?.length||0,'evidence gaps')}</div><div class="workflow-summary">${Object.entries(status).map(([k,v])=>`<span><b>${v}</b>${esc(k)}</span>`).join('')}</div></section><section><div class="section-title"><div><p class="eyebrow">NEXT BEST RECORDS</p><h2>Highest operational impact</h2></div><span>Advisory ranking</span></div><div class="command-priority-list">${top.map((t,i)=>`<article class="command-task"><span class="rank">${i+1}</span><div><code>${esc(t.id)}</code><h3>${esc(t.record)}</h3><p>${esc(t.payoff||t.searchParameters||'')}</p><small>Operational score ${t.operationalScore} · ${esc(t.priority||'')} · ${esc(t.effective.status)}</small><div class="command-links">${(t.potentialClaimIds||[]).map(id=>`<button class="text-link" data-claim="${esc(id)}">${esc(id)}</button>`).join(' ')}<button class="text-link" data-task="${esc(t.id)}">Open task</button></div></div></article>`).join('')}</div></section>`;
}

export function renderPersonPlatformPanel(id){
  const p=personById(id);if(!p)return'';
  const prov=model?.provenanceIndex?.entities?.[id];
  const groups=allFamilyGroups().filter(g=>(g.spouseIds||[]).includes(id)||(g.childIds||[]).includes(id));
  const rels=relationships().filter(r=>r.from===id||r.to===id),component=connectedComponent(id,relationships(),{includeContext:false}),coll=collateral(id,relationships()),direct=directLine(id,relationships());
  return `<section class="platform-person-panel panel"><div class="section-title"><div><p class="eyebrow">CANONICAL GRAPH CONTEXT</p><h2>Family, provenance, and traversal</h2></div><a href="#relationships?from=${encodeURIComponent(id)}">Find relationship ↗</a></div><div class="platform-metrics">${metric(rels.length,'direct edges')}${metric(groups.length,'family units')}${metric(component.size,'connected family')}${metric(direct.size,'direct-line people')}${metric(coll.size,'collateral context')}</div><dl class="facts"><dt>Controlling state</dt><dd>${esc(controllingState(p))}</dd><dt>Provenance layer</dt><dd>${esc(prov?.layer||'CANONICAL')}</dd><dt>Source IDs</dt><dd>${esc((prov?.sourceIds||[]).join(' · ')||'No registered source ID on this person row')}</dd><dt>Source location</dt><dd>${prov?.sourceLocation?.section?`<a href="#archive/${esc(prov.sourceLocation.section)}">${esc(prov.sourceLocation.section)}${prov.sourceLocation.row!=null?` row ${esc(prov.sourceLocation.row)}`:''}</a>`:'Not explicitly located in provenance index'}</dd></dl>${groups.length?`<div class="family-context-grid">${groups.map(g=>`<article><code>${esc(g.id)}</code><h3>${esc(g.label||g.id)}</h3><small>${esc(g.state||'')}</small></article>`).join('')}</div>`:''}</section>`;
}

export function renderSourceEvidenceMatrix(id){
  const source=sourceById(id);if(!source)return'';
  const claims=(model.claims||[]).filter(c=>(c.sourceIds||[]).includes(id)||source.claimIds?.includes(c.id));
  const rels=relationships().filter(r=>(r.sourceIds||sourceIds(JSON.stringify(r.source||''))).includes(id)||source.relationshipIds?.includes(r.id));
  return `<section class="source-evidence-matrix panel"><div class="section-title"><div><p class="eyebrow">SOURCE → ASSERTION MATRIX</p><h2>What this source is actually being used for</h2></div><span>${claims.length} claims · ${rels.length} relationships</span></div>${claims.length?`<div class="matrix-table"><div class="matrix-head"><b>Claim</b><b>State</b><b>Usage</b></div>${claims.map(c=>`<div><button data-claim="${esc(c.id)}">${esc(c.id)}</button><span>${stateBadges(c.state)} ${esc(controllingState(c))}</span><p>${esc(c.claim)}</p></div>`).join('')}</div>`:'<p class="muted">No structured claim currently cites this source ID.</p>'}${rels.length?`<h3>Structured relationships using this source</h3><div class="matrix-relations">${rels.map(r=>`<article><code>${esc(r.id)}</code><span>${esc(personName(r.from))} → ${esc(personName(r.to))}</span><small>${esc(r.type)} · ${esc(controllingState(r))}</small></article>`).join('')}</div>`:''}</section>`;
}

export function renderGeographyHouseholds(){
  const places=[...(model?.geography?.places||[])].sort((a,b)=>b.eventIds.length-a.eventIds.length||a.label.localeCompare(b.label));
  const households=[...(model?.households?.observations||[])].sort((a,b)=>(a.year||9999)-(b.year||9999));
  return `${notice('Geography + household rule','Place labels and household observations come only from source-linked normalized events. No coordinates, migration route, co-residence, or household membership is invented across records.','control')}<section><div class="section-title"><div><p class="eyebrow">GEOGRAPHY INDEX</p><h2>Source-linked places</h2></div><span>${places.length}</span></div><div class="place-grid">${places.slice(0,24).map(p=>`<article><h3>${esc(p.label)}</h3><p>${p.eventIds.length} event rows · ${p.personIds.length} linked people</p><small>${p.years.length?`${Math.min(...p.years)}–${Math.max(...p.years)}`:'Undated source rows'}</small></article>`).join('')}</div></section><section><div class="section-title"><div><p class="eyebrow">HOUSEHOLD / RESIDENCE OBSERVATIONS</p><h2>Row-bounded family context</h2></div><span>${households.length}</span></div><div class="household-list">${households.slice(0,120).map(h=>`<article class="household-card state-${stateClass(h.evidenceState)}"><div><time>${esc(h.year||'Undated')}</time><h3>${esc(h.placeLabels.join(' · ')||'Place not extracted')}</h3><p>${esc(h.recordText)}</p><small>${esc(h.rule)}</small></div><div class="household-members">${h.memberIds.map(id=>`<button data-person="${esc(id)}">${esc(personName(id))}</button>`).join('')}</div>${deepLink(h.sourceLocation,'Exact source row ↗')}</article>`).join('')}</div></section>`;
}

export function installPlatformHandlers(){
  document.addEventListener('submit',event=>{
    if(event.target?.id!=='relationship-finder')return;
    event.preventDefault();
    const data=new FormData(event.target),url=new URL(location.href);
    url.searchParams.set('from',String(data.get('relationship-from')||''));
    url.searchParams.set('to',String(data.get('relationship-to')||''));
    history.replaceState(null,'',url);
    location.hash='relationships';
    window.dispatchEvent(new Event('hashchange'));
  });
}
