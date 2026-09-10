import{model,displayPeople,allPedigreeRelationships,personById,esc,stateBadges}from'./core.js';

const activeRels=()=>allPedigreeRelationships().filter(r=>r.active!==false&&!/REJECTED/i.test(r.state||''));
const pedigreeTypes=new Set(['parent-child','direct-line-succession']);
const normName=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const years=s=>[...String(s||'').matchAll(/\b(1[5-9]\d{2}|20\d{2})\b/g)].map(m=>Number(m[1]));
const priorityRank={critical:0,high:1,medium:2,low:3,info:4};
const make=(category,severity,title,detail,extra={})=>({category,severity,title,detail,...extra});

function duplicatePeople(people){
  const buckets=new Map();
  for(const p of people){const names=[p.name,...(Array.isArray(p.aliases)?p.aliases:String(p.aliases||'').split(/[;,]/))].map(normName).filter(Boolean);for(const n of names){if(!buckets.has(n))buckets.set(n,new Set());buckets.get(n).add(p.id);}}
  const seen=new Set(),out=[];
  for(const[n,ids]of buckets){const xs=[...ids];if(xs.length<2)continue;const key=xs.sort().join('|');if(seen.has(key))continue;seen.add(key);out.push(make('duplicate','medium','Possible duplicate identity',`${xs.map(id=>personById(id)?.name||id).join(' ↔ ')} share the normalized name/alias “${n}”. Review only; never auto-merge.`,{personIds:xs}));}
  return out;
}
function duplicateRelationships(rels){
  const map=new Map(),out=[];
  for(const r of rels){const pair=['spouse','spouse-lead'].includes(r.type)?[r.from,r.to].sort():[r.from,r.to];const key=`${r.type}|${pair.join('|')}`;if(!map.has(key))map.set(key,[]);map.get(key).push(r);}
  for(const rs of map.values())if(rs.length>1)out.push(make('relationship','medium','Duplicate relationship assertions',`${rs.length} active ${rs[0].type} assertions connect ${personById(rs[0].from)?.name||rs[0].from} and ${personById(rs[0].to)?.name||rs[0].to}.`,{relationshipIds:rs.map(r=>r.id)}));
  return out;
}
function structuralIntegrity(people,rels){
  const ids=new Set(people.map(p=>p.id)),out=[];
  for(const r of rels){if(r.from===r.to)out.push(make('relationship','critical','Self-referential relationship',`${r.id} points ${r.from} to itself.`,{relationshipIds:[r.id]}));if(!ids.has(r.from)||!ids.has(r.to))out.push(make('relationship','high','Relationship endpoint missing',`${r.id} references a person not present in the effective family model.`,{relationshipIds:[r.id]}));}
  const parents=rels.filter(r=>pedigreeTypes.has(r.type)),byChild=new Map();
  for(const r of parents){if(!byChild.has(r.to))byChild.set(r.to,[]);byChild.get(r.to).push(r.from);}
  for(const[child,ps]of byChild)if(new Set(ps).size>2)out.push(make('parentage','high','More than two explicit parents',`${personById(child)?.name||child} has ${new Set(ps).size} active explicit parent relationships. Review relationship semantics before any change.`,{personIds:[child,...new Set(ps)]}));
  const adj=new Map();for(const r of parents){if(!adj.has(r.from))adj.set(r.from,[]);adj.get(r.from).push(r.to);}const visiting=new Set(),done=new Set();let cycle=null;
  function dfs(id,path){if(cycle)return;if(visiting.has(id)){cycle=[...path,id];return;}if(done.has(id))return;visiting.add(id);for(const n of adj.get(id)||[])dfs(n,[...path,id]);visiting.delete(id);done.add(id);}
  for(const p of people)dfs(p.id,[]);if(cycle)out.push(make('chronology','critical','Pedigree cycle detected',`An active parent/child path loops back to an earlier person: ${cycle.map(id=>personById(id)?.name||id).join(' → ')}.`,{personIds:cycle}));
  return out;
}
function chronology(people,rels){
  const out=[],birth=new Map();
  for(const p of people){if(p.living)continue;const ys=years(p.dates);if(ys.length){birth.set(p.id,Math.min(...ys));if(ys.length>1&&Math.max(...ys)<Math.min(...ys))out.push(make('chronology','high','Impossible life chronology',`${p.name} appears to have a death year before birth year.`,{personIds:[p.id]}));}}
  for(const r of rels.filter(r=>pedigreeTypes.has(r.type))){const py=birth.get(r.from),cy=birth.get(r.to);if(!py||!cy)continue;const age=cy-py;if(age<12)out.push(make('chronology','high','Implausibly young parent',`${personById(r.from)?.name||r.from} would be about ${age} at the birth of ${personById(r.to)?.name||r.to}. Treat as a review flag, not a correction.`,{personIds:[r.from,r.to]}));else if(age>70)out.push(make('chronology','medium','Unusually old parent',`${personById(r.from)?.name||r.from} would be about ${age} at the birth of ${personById(r.to)?.name||r.to}. Verify dates and identity.`,{personIds:[r.from,r.to]}));}
  return out;
}
function privacy(people){const out=[];for(const p of people.filter(p=>p.living)){if(/\b(19|20)\d{2}\b/.test(String(p.dates||'')))out.push(make('privacy','critical','Living-person year exposed',`${p.name} contains a four-digit year in the effective public display dates. Public living-person birth details must remain withheld.`,{personIds:[p.id]}));}return out;}
function evidenceGaps(){
  const out=[],rank={CRITICAL:'critical',HIGHEST:'critical',HIGH:'high',MEDIUM:'medium',LOW:'low'};
  for(const g of model.evidenceGaps||[]){if(/SUPPORTED/i.test(g.state||'')&&!g.nextAction)continue;out.push(make('evidence',rank[String(g.priority||'').toUpperCase()]||'medium',`Evidence gap · ${g.claimId}`,`${g.claim} — ${g.nextAction||'Additional corroboration is required.'}`,{claimId:g.claimId,taskIds:g.taskIds||[]}));}
  const w=model.identityWorkspace;if(w?.missingRecords?.length)for(const r of w.missingRecords)out.push(make('identity',/HIGHEST|CRITICAL/i.test(r.priority||'')?'critical':'high',`Identity bridge acquisition · ${r.record}`,r.purpose,{personIds:w.personIds||[]}));
  return out;
}
function claimConflicts(){const out=[];for(const c of model.claims||[]){if(/CONFLICTED|UNRESOLVED|PROVISIONAL/i.test(c.state||''))out.push(make('evidence',/CONFLICTED|UNRESOLVED/i.test(c.state||'')?'high':'medium',`Qualified claim · ${c.id}`,`${c.claim} — ${c.nextAction||'Review supporting evidence.'}`,{claimId:c.id}));}return out;}

export function analyzeResearchIntelligence(){
  const people=displayPeople(),rels=activeRels();
  const findings=[...privacy(people),...structuralIntegrity(people,rels),...duplicateRelationships(rels),...duplicatePeople(people),...chronology(people,rels),...evidenceGaps(),...claimConflicts()];
  findings.sort((a,b)=>(priorityRank[a.severity]??9)-(priorityRank[b.severity]??9)||a.category.localeCompare(b.category)||a.title.localeCompare(b.title));
  return{generatedAt:new Date().toISOString(),peopleCount:people.length,relationshipCount:rels.length,findings};
}
const linkButtons=f=>`${(f.personIds||[]).slice(0,4).map(id=>`<button class="text-link" data-person="${esc(id)}">${esc(personById(id)?.name||id)}</button>`).join(' · ')}${f.claimId?`<button class="text-link" data-claim="${esc(f.claimId)}">Open ${esc(f.claimId)}</button>`:''}${(f.taskIds||[]).slice(0,3).map(id=>`<button class="text-link" data-task="${esc(id)}">${esc(id)}</button>`).join(' ')}`;
export function renderResearchIntelligence(){
  const a=analyzeResearchIntelligence(),counts=a.findings.reduce((m,f)=>(m[f.severity]=(m[f.severity]||0)+1,m),{}),cats=[...new Set(a.findings.map(f=>f.category))].sort();
  const top=a.findings.slice(0,8);
  return `<aside class="notice control"><strong>Research Intelligence — advisory only</strong><p>These findings are deterministic review signals derived from the effective family model. They never merge people, rewrite relationships, promote evidence, or change the controlling source. Heuristic chronology and duplicate signals require human review.</p></aside><section class="ri-hero"><div><p class="eyebrow">v13 RESEARCH INTELLIGENCE</p><h2>Where should research attention go next?</h2><p>Structural integrity, privacy, duplicate candidates, chronology plausibility, unresolved claims, and evidence gaps are evaluated without mutating genealogy.</p></div><div class="ri-metrics"><article><b>${a.findings.length}</b><span>review signals</span></article><article><b>${counts.critical||0}</b><span>critical</span></article><article><b>${counts.high||0}</b><span>high</span></article><article><b>${model.evidenceGaps?.length||0}</b><span>evidence gaps</span></article></div></section><section><div class="section-title"><div><p class="eyebrow">PRIORITY REVIEW</p><h2>Highest-value signals</h2></div><span>${top.length}</span></div><div class="ri-priority-grid">${top.map(f=>`<article class="ri-card severity-${esc(f.severity)}"><div class="ri-card-head"><span>${esc(f.severity.toUpperCase())}</span><small>${esc(f.category)}</small></div><h3>${esc(f.title)}</h3><p>${esc(f.detail)}</p><div class="link-row">${linkButtons(f)}</div></article>`).join('')||'<div class="empty compact">No priority signals detected.</div>'}</div></section><section><div class="section-title"><div><p class="eyebrow">ALL SIGNALS</p><h2>Research review register</h2></div><span>${a.findings.length}</span></div><div class="ri-filters"><label>Severity<select data-ri-filter="severity"><option value="">All severities</option>${['critical','high','medium','low','info'].map(x=>`<option value="${x}">${x}</option>`).join('')}</select></label><label>Category<select data-ri-filter="category"><option value="">All categories</option>${cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label></div><div class="ri-register">${a.findings.map((f,i)=>`<article class="ri-row" data-ri-severity="${esc(f.severity)}" data-ri-category="${esc(f.category)}"><div><code>RI-${String(i+1).padStart(3,'0')}</code><span class="ri-severity ${esc(f.severity)}">${esc(f.severity)}</span></div><div><b>${esc(f.title)}</b><p>${esc(f.detail)}</p><div class="link-row">${linkButtons(f)}</div></div></article>`).join('')||'<div class="empty">No research-intelligence findings.</div>'}</div></section><section class="ri-method"><h2>Interpretation rules</h2><div><article><b>Flag ≠ fact</b><p>A signal identifies a condition worth reviewing. It is not a genealogical conclusion.</p></article><article><b>No silent correction</b><p>The engine has no authority to promote, merge, delete, or alter canonical evidence.</p></article><article><b>Explicit parentage only</b><p>Parentage analysis follows explicit active relationship edges and never invents a second parent.</p></article><article><b>Privacy first</b><p>Living-person exposure is treated as a critical defect and remains subject to existing public-redaction controls.</p></article></div></section>`;
}

document.addEventListener('change',e=>{const filter=e.target.closest?.('[data-ri-filter]');if(!filter)return;const root=filter.closest('section'),severity=root?.querySelector('[data-ri-filter="severity"]')?.value||'',category=root?.querySelector('[data-ri-filter="category"]')?.value||'';root?.querySelectorAll('.ri-row').forEach(row=>row.hidden=!!((severity&&row.dataset.riSeverity!==severity)||(category&&row.dataset.riCategory!==category)));});
