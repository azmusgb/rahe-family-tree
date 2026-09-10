import{model,corpus,esc,stateClass,stateBadges,sourceButtons,deepLink,metric,notice,miniPerson,personCard,claimCard,sourceCard,taskCard,relationshipRow,personById,claimById,sourceById,taskById,matches,sectionById,displayPeople,allPedigreeRelationships}from'./core.js';

const initials=name=>String(name||'?').replace(/\/.*/,'').trim().split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const cleanBranch=value=>String(value||'Family').split('/')[0].trim();
const pct=(part,total)=>total?Math.round((part/total)*100):0;
const dashboardPerson=p=>`<article class="dashboard-person"><button type="button" data-person="${esc(p.id)}" class="dashboard-person-open"><span class="dashboard-avatar" aria-hidden="true">${esc(initials(p.name))}</span><span><b>${esc(p.name)}</b><small>${esc(cleanBranch(p.branch))}${p.dates?` · ${esc(p.dates)}`:''}</small></span></button></article>`;

export function renderDashboard(){
  const c=model.meta.counts;
  const people=displayPeople();
  const relationships=allPedigreeRelationships().filter(r=>r.active!==false&&!/REJECTED/i.test(r.state||''));
  const branches=[...new Set(people.map(p=>cleanBranch(p.branch)).filter(Boolean))].sort();
  const historical=people.filter(p=>!p.living);
  const featured=[
    ...historical.filter(p=>/William John Rahe Sr\.?/i.test(p.name)),
    ...historical.filter(p=>/Hazel Emma Berg/i.test(p.name)),
    ...historical.filter(p=>/Sarah.*Ferry/i.test(p.name)),
    ...historical.filter(p=>/Clifford.*Rahe/i.test(p.name)),
    ...historical
  ].filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i).slice(0,6);
  const branchCards=branches.slice(0,6).map(branch=>{
    const members=people.filter(p=>cleanBranch(p.branch)===branch);
    const sample=members.slice(0,3).map(p=>p.name.replace(/\s*\/.*$/,'')).join(', ');
    return `<button type="button" class="family-branch-card" data-branch="${esc(branch)}"><span class="family-branch-count">${members.length}</span><h3>${esc(branch)}</h3><p>${esc(sample||'Family branch')}</p><small>Explore branch →</small></button>`;
  }).join('');
  const critical=model.researchTasks.filter(t=>t.state==='CRITICAL').slice(0,3);
  const evidence=Object.fromEntries(['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED'].map(s=>[s,model.claims.filter(x=>String(x.state||'').toUpperCase().includes(s)).length]));
  const evidenceTotal=Object.values(evidence).reduce((sum,n)=>sum+n,0);
  const bridge=model.relationships.find(r=>r.type==='identity-bridge');
  const a=bridge&&personById(bridge.from),b=bridge&&personById(bridge.to);
  const generationCount=Math.max(1,Math.min(12,new Set((model.events||[]).map(e=>String(e.year||'').slice(0,2)).filter(Boolean)).size));
  const publicMedia=(model.mediaAssets||[]).filter(m=>m.public!==false).length;
  const topHighlights=[
    ['Chicago family roots','Multiple branches converge in Chicago-area records, vital registrations, directories, military records, and family households.'],
    ['Migration & origins','The archive preserves origin and migration research for the Ferry, Kinsman, Rahe, Racky/Hoffman, Berg, and related branches.'],
    ['Military & identity records','Draft, enlistment, and identity records are central to several high-value family-history questions.']
  ];
  return `
    <section class="dashboard-hero" aria-labelledby="family-dashboard-title">
      <div class="dashboard-hero-copy">
        <p class="eyebrow">THE RAHE FAMILY</p>
        <h2 id="family-dashboard-title">Explore the family, then go as deep as the evidence allows.</h2>
        <p>This family-history workspace brings together people, branches, photographs, relationships, timelines, and source-controlled research without hiding uncertainty.</p>
        <div class="dashboard-hero-actions">
          <a class="action primary" href="#tree">Explore family tree</a>
          <a class="action" href="#people">Browse people</a>
          <a class="action" href="#people">View photos & documents</a>
        </div>
        <div class="dashboard-family-metrics" aria-label="Family overview">
          <span><b>${people.length}</b><small>people / identities</small></span>
          <span><b>${branches.length}</b><small>major branches</small></span>
          <span><b>${generationCount}+</b><small>generational eras</small></span>
          ${publicMedia?`<span><b>${publicMedia}</b><small>public media items</small></span>`:''}
        </div>
      </div>
      <aside class="dashboard-hero-card" aria-label="Family snapshot">
        <div class="hero-tree-mark" aria-hidden="true">R</div>
        <div><small>Family snapshot</small><strong>${relationships.length}</strong><span>active family relationships</span></div>
        <a href="#tree">Open the connected tree →</a>
      </aside>
    </section>

    <section class="dashboard-section" aria-labelledby="dashboard-branches-title">
      <div class="section-title"><div><p class="eyebrow">FAMILY BRANCHES</p><h2 id="dashboard-branches-title">Start with a branch</h2></div><a href="#branches">View all branches ↗</a></div>
      <div class="family-branch-grid">${branchCards}</div>
    </section>

    <section class="dashboard-section" aria-labelledby="dashboard-featured-title">
      <div class="section-title"><div><p class="eyebrow">FEATURED PEOPLE</p><h2 id="dashboard-featured-title">People at the center of the story</h2></div><a href="#people">Browse everyone ↗</a></div>
      <div class="dashboard-people-strip">${featured.map(dashboardPerson).join('')}</div>
    </section>

    <section class="dashboard-section" aria-labelledby="dashboard-history-title">
      <div class="section-title"><div><p class="eyebrow">FAMILY HISTORY</p><h2 id="dashboard-history-title">History highlights</h2></div><a href="#timeline">Open timeline ↗</a></div>
      <div class="history-highlight-grid">${topHighlights.map(([title,body])=>`<article><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('')}</div>
    </section>

    <div class="dashboard-grid dashboard-research-split">
      <section class="panel mystery-panel" aria-labelledby="dashboard-mystery-title">
        <p class="eyebrow">OPEN FAMILY MYSTERY</p>
        <h2 id="dashboard-mystery-title">DeVine / DeVeine → Rahe identity bridge</h2>
        <p>The two identities remain separate in the canonical graph. The connection is preserved as unresolved rather than silently promoted.</p>
        <div class="bridge-pair">${a?miniPerson(a):''}<div class="bridge-state">${bridge?stateBadges(bridge.state):''}<b>${esc(bridge?.state||'UNRESOLVED')}</b></div>${b?miniPerson(b):''}</div>
        <a class="action" href="#identity">Open Identity Lab</a>
      </section>
      <section class="panel evidence-health" aria-labelledby="dashboard-health-title">
        <p class="eyebrow">RESEARCH HEALTH</p>
        <h2 id="dashboard-health-title">Evidence confidence</h2>
        <div class="evidence-health-bar" aria-label="Evidence confidence distribution">
          <span style="--value:${pct(evidence.SUPPORTED,evidenceTotal)}%"><b>${pct(evidence.SUPPORTED,evidenceTotal)}%</b><small>Supported</small></span>
          <span style="--value:${pct(evidence.PROVISIONAL,evidenceTotal)}%"><b>${pct(evidence.PROVISIONAL,evidenceTotal)}%</b><small>Provisional</small></span>
          <span style="--value:${pct(evidence.UNRESOLVED,evidenceTotal)}%"><b>${pct(evidence.UNRESOLVED,evidenceTotal)}%</b><small>Unresolved</small></span>
          <span style="--value:${pct(evidence.REJECTED,evidenceTotal)}%"><b>${pct(evidence.REJECTED,evidenceTotal)}%</b><small>Rejected</small></span>
        </div>
        <p class="muted">${model.claims.length} claim-register items · ${model.sources.length} registered sources · audit ${model.audit.pass?'passing':'requires review'}.</p>
        <a class="action" href="#evidence">View evidence details</a>
      </section>
    </div>

    <section class="dashboard-section" aria-labelledby="dashboard-records-title">
      <div class="section-title"><div><p class="eyebrow">RECORDS WE'RE LOOKING FOR</p><h2 id="dashboard-records-title">Top research targets</h2></div><a href="#research">Open full queue ↗</a></div>
      <div class="task-grid dashboard-task-grid">${critical.map(taskCard).join('')}</div>
    </section>

    <details class="dashboard-research-details">
      <summary><span>Research integrity & completeness</span><small>Advanced controls</small></summary>
      <div class="dashboard-research-details-body">
        ${notice('Research integrity','Evidence states remain source-controlled. Display classifications, search ranking, media, and graph layout never promote claims.','control')}
        <div class="metrics compact">${metric(c.claims,'claim-register items','source states preserved')}${metric(c.sources,'registered sources','canonical + verified')}${metric(c.events,'timeline rows','source-dated')}</div>
        <div class="section-title"><div><p class="eyebrow">COMPLETENESS CONTROLS</p><h2>Defined gates</h2></div><span>Not auto-scored</span></div>
        <div class="gate-grid">${model.completenessGates.map(g=>`<article class="gate"><b>${esc(g.gate)}</b><p>${esc(g.passCondition)}</p><small>${esc(g.status)}</small></article>`).join('')}</div>
        <div class="section-title"><div><p class="eyebrow">SEMANTIC AUDIT</p><h2>Model integrity</h2></div><span class="audit ${model.audit.pass?'pass':'warn'}">${model.audit.pass?'PASS':'REVIEW EXCEPTIONS'}</span></div>
        <div class="audit-grid">${model.audit.checks.map(x=>`<article><b>${x.pass?'✓':'!'} ${esc(x.label)}</b><p>${esc(x.detail)}</p></article>`).join('')}</div>
      </div>
    </details>`;
}

export function renderPeople(){const all=displayPeople(),people=all.filter(matches);return`${model.familySupplement?notice('Inventory scope',`${all.length} named people / identities are displayed. The original v10 “Current Rahe children” aggregate row remains retained for source traceability but is replaced here by the four named family-supplied children. Aimee’s Hardesty name is included; no spouse identity is asserted because none has been supplied.`,'control'):''}<div class="section-title"><div><p class="eyebrow">CANONICAL + FAMILY-SUPPLIED INVENTORY</p><h2>Person / identity inventory</h2></div><span>${people.length} of ${all.length}</span></div><div class="people-grid">${people.map(personCard).join('')}</div>`;}
function timelineList(events){return`<div class="timeline-list">${events.map(e=>`<article class="timeline-item state-${stateClass(e.state)}"><time>${esc(e.year)}</time><div><div class="timeline-top"><span>${esc(e.displayType)}</span>${stateBadges(e.state)}</div><h3>${esc(e.title)}</h3><p>${esc(e.excerpt)}</p><small>Display type is derived for navigation only. ${esc(e.state||'Source row has no evidence-state token.')}</small>${deepLink(e.location,'Open exact row ↗')}</div></article>`).join('')}</div>`;}
export function renderTimeline(){const events=model.events.filter(matches).sort((a,b)=>a.year-b.year);return`${notice('Timeline rule','Year and row text come from canonical tables. Event-type labels are navigation classifications and are not evidence promotions.','control')}<div class="section-title"><div><p class="eyebrow">SOURCE-DATED CHRONOLOGY</p><h2>Timeline evidence</h2></div><span>${events.length} rows</span></div>${timelineList(events.slice(0,400))}${events.length>400?'<p class="muted">Showing first 400 matching rows; narrow the filters for a smaller set.</p>':''}`;}
export function renderPerson(id){const p=personById(id);if(!p)return'<div class="empty">Person not found.</div>';const rels=allPedigreeRelationships().filter(r=>r.from===id||r.to===id),claims=model.claims.filter(c=>c.peopleIds.includes(id)),events=model.events.filter(e=>e.peopleIds.includes(id)).sort((a,b)=>a.year-b.year).slice(0,40),sourceSet=new Set([...claims.flatMap(c=>c.sourceIds),...rels.flatMap(r=>r.sourceIds||[])]),sources=[...sourceSet].map(sourceById).filter(Boolean),tasks=model.researchTasks.filter(t=>t.peopleIds.includes(id)||(`${t.branch} ${t.record}`).toLowerCase().includes(p.branch.split('/')[0].toLowerCase())).slice(0,12),legacy=corpus.sections.filter(s=>s.legacy&&JSON.stringify(s).toLowerCase().includes(p.name.split(' / ')[0].toLowerCase())).slice(0,12),supp=Boolean(p.provenance);return`<a class="back" href="#people">← People</a><header class="person-hero state-${stateClass(p.state)}"><div><p class="eyebrow">${esc(p.branch)} · ${esc(p.id)}</p><h1>${esc(p.name)}</h1><div>${stateBadges(p.state)}</div><p>${esc(p.state)}</p></div><div class="person-summary"><b>${esc(p.dates)}</b><span>${esc(p.role)}</span><small>${p.living?'Living-person birth details withheld in public edition.':'Historical research record; qualifications preserved.'}</small>${supp?'<em class="supplement-tag">Family-supplied supplement · outside v10 controlling corpus</em>':''}</div></header><nav class="local-nav" aria-label="Person dossier sections"><button type="button" data-scroll="person-${p.id}-facts">Facts</button><button type="button" data-scroll="person-${p.id}-relationships">Relationships</button><button type="button" data-scroll="person-${p.id}-claims">Claims</button><button type="button" data-scroll="person-${p.id}-timeline">Timeline</button><button type="button" data-scroll="person-${p.id}-sources">Sources</button><button type="button" data-scroll="person-${p.id}-research">Research</button></nav><section id="person-${p.id}-facts" class="panel"><div class="section-title"><h2>Research identity</h2><span>${supp?'Family-supplied supplement':`Appendix F row ${esc(p.sourceLocation?.row)}`}</span></div><dl class="facts"><dt>Display name</dt><dd>${esc(p.name)}</dd><dt>Name / variant tokens</dt><dd>${p.aliases.map(esc).join(' · ')}</dd><dt>Branch</dt><dd>${esc(p.branch)}</dd><dt>Dates / privacy</dt><dd>${esc(p.dates)}</dd><dt>Role</dt><dd>${esc(p.role)}</dd><dt>Evidence state</dt><dd>${esc(p.state)}</dd><dt>Provenance</dt><dd>${esc(p.provenance||`${p.sourceLocation?.section||'canonical model'}${p.sourceLocation?.row?` · row ${p.sourceLocation.row}`:''}`)}</dd></dl></section><section id="person-${p.id}-relationships"><div class="section-title"><h2>Relationships</h2><span>${rels.length}</span></div><div class="relationship-table">${rels.map(relationshipRow).join('')||'<div class="empty compact">No structured relationship asserted.</div>'}</div></section><section id="person-${p.id}-claims"><div class="section-title"><h2>Canonical claims</h2><span>${claims.length}</span></div><div class="claim-grid">${claims.map(claimCard).join('')||'<div class="empty compact">No canonical claim-register row directly names this person.</div>'}</div></section><section id="person-${p.id}-timeline"><div class="section-title"><h2>Canonical timeline evidence</h2><span>${events.length} shown</span></div>${events.length?timelineList(events):'<div class="empty compact">No canonical source-dated event row directly names this supplemental person.</div>'}</section><section id="person-${p.id}-sources"><div class="section-title"><h2>Registered canonical sources</h2><span>${sources.length}</span></div><div class="source-grid">${sources.map(sourceCard).join('')||'<div class="empty compact">No explicit registered canonical source link.</div>'}</div></section><section id="person-${p.id}-research"><div class="section-title"><h2>Research queue</h2><span>${tasks.length} relevant</span></div><div class="task-grid">${tasks.map(taskCard).join('')||'<div class="empty compact">No direct queue match.</div>'}</div></section>${!supp?`<section><div class="section-title"><h2>Canonical dossier references</h2><span>${p.references.length}</span></div><div class="reference-list">${p.references.map(x=>{const s=sectionById(x);return s?`<a href="#archive/${x}">${esc(s.title)} <small>${x}</small></a>`:''}).join('')}</div></section>`:''}${legacy.length?`<section><div class="section-title"><h2>Legacy annex mentions</h2><span>${legacy.length} sections</span></div><div class="reference-list">${legacy.map(s=>`<a href="#archive/${s.id}">${esc(s.title)} <small>${s.id}</small></a>`).join('')}</div></section>`:''}`;}
export function renderClaim(id){const c=claimById(id);if(!c)return'<div class="empty">Claim not found.</div>';const people=c.peopleIds.map(personById).filter(Boolean),sources=c.sourceIds.map(sourceById).filter(Boolean),rels=model.relationships.filter(r=>r.claimIds.includes(c.id));return`<a class="back" href="#evidence">← Evidence</a><header class="detail-hero state-${stateClass(c.state)}"><p class="eyebrow">CLAIM · ${esc(c.id)}</p><h1>${esc(c.claim)}</h1><div>${stateBadges(c.state)}</div><p>${esc(c.state)}</p></header><div class="detail-columns"><section class="panel"><h2>Current basis</h2><p>${sourceButtons(c.basis)}</p><h2>Next action</h2><p>${esc(c.nextAction)}</p>${deepLink(c.location)}</section><section class="panel"><h2>Linked people</h2><div class="stack">${people.map(miniPerson).join('')||'<p class="muted">No deterministic person-name match.</p>'}</div></section></div><section><div class="section-title"><h2>Registered sources</h2><span>${sources.length}</span></div><div class="source-grid">${sources.map(sourceCard).join('')||'<div class="empty compact">No explicit registered source ID.</div>'}</div></section><section><div class="section-title"><h2>Relationships explicitly linked to this claim</h2><span>${rels.length}</span></div><div class="relationship-table">${rels.map(relationshipRow).join('')||'<div class="empty compact">No relationship carries this claim ID directly.</div>'}</div></section>`;}
export function renderSource(id){const s=sourceById(id);if(!s)return'<div class="empty">Source not found.</div>';const claims=s.claimIds.map(claimById).filter(Boolean),rels=s.relationshipIds.map(id=>model.relationships.find(r=>r.id===id)).filter(Boolean);return`<a class="back" href="#sources">← Sources</a><header class="detail-hero"><p class="eyebrow">SOURCE · ${esc(s.id)}</p><h1>${esc(s.name)}</h1><p>${esc(s.weight)}</p></header><section class="panel"><dl class="facts"><dt>Class / type</dt><dd>${esc(s.class)}</dd><dt>Key use / caution</dt><dd>${esc(s.use)}</dd><dt>Weight / control</dt><dd>${esc(s.weight)}</dd><dt>Legacy ID(s)</dt><dd>${esc(s.legacyIds||'—')}</dd><dt>Register location</dt><dd>${esc(s.location.section)} · row ${esc(s.location.row)}</dd></dl>${deepLink(s.location,'Open source register row ↗')}</section><section><div class="section-title"><h2>Claims using this source</h2><span>${claims.length}</span></div><div class="claim-grid">${claims.map(claimCard).join('')||'<div class="empty compact">No explicit claim-register use.</div>'}</div></section><section><div class="section-title"><h2>Relationships linked through claim/source basis</h2><span>${rels.length}</span></div><div class="relationship-table">${rels.map(relationshipRow).join('')||'<div class="empty compact">No structured relationship link.</div>'}</div></section>`;}
export function renderTask(id){const t=taskById(id);if(!t)return'<div class="empty">Research task not found.</div>';const people=t.peopleIds.map(personById).filter(Boolean);return`<a class="back" href="#research">← Research Queue</a><header class="detail-hero priority-${t.state.toLowerCase()}"><p class="eyebrow">RESEARCH TASK · ${esc(t.id)} · ${esc(t.priority)}</p><h1>${esc(t.record)}</h1><p>${esc(t.branch)}</p></header><section class="panel"><h2>Controlled question / payoff</h2><p>${esc(t.payoff)}</p>${deepLink(t.sourceLocation,'Open canonical queue row ↗')}</section><section><div class="section-title"><h2>Named people</h2><span>${people.length}</span></div><div class="people-grid">${people.map(personCard).join('')||'<div class="empty compact">No deterministic person-name match.</div>'}</div></section>`;}
