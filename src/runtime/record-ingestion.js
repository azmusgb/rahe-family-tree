import{model}from'../../core.js';
import{analyzeRecord,createReviewDecision}from'../ingestion/record-ingestion-core.js';

const STORAGE_KEY='rahe-record-ingestion-reviews-v1';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const supportedExtensions=new Set(['txt','md','csv','json']);
let lastPacket=null;

async function sha256(value){
  const bytes=new TextEncoder().encode(String(value));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function stable(value){
  if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
function readReviews(){
  try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(parsed)?parsed:[];}catch{return[];}
}
function saveReviews(items){localStorage.setItem(STORAGE_KEY,JSON.stringify(items.slice(-100)));}
function downloadJson(name,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
}
function resultHtml(packet){
  const x=packet.extracted,c=packet.claimReviewCandidates,conflicts=packet.contradictionSignals;
  return `<section class="ingest-results" aria-live="polite">
    <div class="ingest-result-head"><div><p class="eyebrow">EVIDENCE PACKET</p><h3>${esc(packet.input.title)}</h3></div><code>${esc(packet.digest.slice(0,16))}…</code></div>
    <div class="ingest-metrics"><span><b>${x.people.length}</b> people</span><span><b>${x.years.length}</b> years</span><span><b>${x.places.length}</b> places</span><span><b>${c.length}</b> claim candidates</span><span><b>${conflicts.length}</b> review flags</span></div>
    <div class="ingest-columns">
      <article><h4>Exact person/alias matches</h4>${x.people.length?x.people.map(p=>`<p><b>${esc(p.name)}</b><br><small>${esc(p.state)} · matched ${esc(p.matchedAliases.join(', '))}</small></p>`).join(''):'<p class="muted">No exact canonical name/alias match.</p>'}</article>
      <article><h4>Extracted record tokens</h4><p><b>Years:</b> ${esc(x.years.join(', ')||'none')}</p><p><b>Places:</b> ${esc(x.places.map(p=>p.label).join(' · ')||'none')}</p><p><b>Source IDs:</b> ${esc(x.sourceIds.join(', ')||'none')}</p></article>
    </div>
    <div class="ingest-review-block"><h4>Claim review candidates</h4>${c.length?c.map(item=>`<article class="ingest-candidate"><div><code>${esc(item.id)}</code><span>${esc(item.currentState)}</span></div><b>${esc(item.claim)}</b><p>${esc(item.reasons.join('; '))}</p><small>${esc(item.reviewRecommendation)} · no target state is assigned automatically</small></article>`).join(''):'<p class="muted">No claim was linked deterministically from explicit claim IDs or matched people.</p>'}</div>
    <div class="ingest-review-block"><h4>Potential contradictions</h4>${conflicts.length?conflicts.map(item=>`<article class="ingest-flag"><b>${esc(item.personName)} · ${esc(item.eventType)}</b><p>Observed ${esc(item.observedYear)}; current display includes ${esc(item.displayedCanonicalYear)}.</p><small>${esc(item.rule)}</small></article>`).join(''):'<p class="muted">No deterministic date-difference review signal detected.</p>'}</div>
    <label class="ingest-note">Reviewer note<textarea id="record-review-note" rows="3" placeholder="Why this packet should be accepted, rejected, or researched further"></textarea></label>
    <div class="ingest-actions"><button type="button" data-ingest-decision="approve-workbench">Approve for workbench</button><button type="button" class="secondary" data-ingest-decision="needs-more-research">Needs more research</button><button type="button" class="secondary" data-ingest-decision="reject">Reject packet</button><button type="button" class="text-link" data-ingest-download>Download evidence packet</button></div>
    <aside class="notice warning"><strong>No canonical mutation occurred.</strong><p>This packet is advisory. Approval records a browser-local review decision only; it cannot merge people, create pedigree edges, or change evidence state.</p></aside>
  </section>`;
}
function workbenchHtml(){
  const reviews=readReviews();
  return `<section class="panel record-ingestion" data-record-ingestion>
    <div class="section-title"><div><p class="eyebrow">v16.1 RECORD INGESTION</p><h2>Evidence intake workbench</h2></div><span>${reviews.length} local review decision(s)</span></div>
    <aside class="notice control"><strong>Controlled intake</strong><p>Paste a transcript or load a text-based research record. The analyzer preserves the original text, matches only explicit canonical names/aliases and place labels, identifies claim candidates, and produces review signals. It never changes the canonical tree automatically.</p></aside>
    <form id="record-ingestion-form" class="ingest-form">
      <div class="ingest-grid"><label>Record title<input name="title" required maxlength="160" placeholder="1918 Cook County birth record"></label><label>Record type<select name="recordType"><option>vital</option><option>church</option><option>census</option><option>marriage</option><option>military</option><option>newspaper</option><option>directory</option><option>probate</option><option>correspondence</option><option selected>other</option></select></label><label>Repository / database<input name="repository" maxlength="200" placeholder="Cook County Clerk"></label><label>Citation / locator<input name="citation" maxlength="500" placeholder="certificate, volume/page, URL, archive call number"></label></div>
      <label>Optional text file<input id="record-file" type="file" accept=".txt,.md,.csv,.json,text/plain,application/json,text/csv"></label>
      <label>Record transcription / extracted text<textarea name="rawText" rows="10" required maxlength="250000" placeholder="Paste the record transcription exactly as read. Preserve spelling and uncertainty markers."></textarea></label>
      <div class="ingest-form-actions"><button type="submit">Analyze record</button><span id="record-ingestion-status" class="muted" role="status"></span></div>
    </form>
    <div id="record-ingestion-result"></div>
    <details class="ingest-history"><summary>Local review history (${reviews.length})</summary><div>${reviews.length?reviews.slice().reverse().map(r=>`<article><code>${esc(String(r.packetDigest||'').slice(0,16))}…</code><b>${esc(r.decision)}</b><span>${esc(r.reviewedAt)}</span>${r.note?`<p>${esc(r.note)}</p>`:''}</article>`).join(''):'<p class="muted">No review decisions recorded in this browser.</p>'}</div></details>
  </section>`;
}
function mount(){
  const route=location.hash.slice(1).split('/')[0];
  if(route!=='research')return;
  const content=document.querySelector('#content');
  if(!content||content.querySelector('[data-record-ingestion]'))return;
  content.insertAdjacentHTML('afterbegin',workbenchHtml());
}

async function analyze(form){
  const status=document.querySelector('#record-ingestion-status'),result=document.querySelector('#record-ingestion-result');
  try{
    status.textContent='Analyzing…';
    const data=new FormData(form);
    const packet=analyzeRecord(model,{title:data.get('title'),recordType:data.get('recordType'),repository:data.get('repository'),citation:data.get('citation'),fileName:document.querySelector('#record-file')?.files?.[0]?.name||'',rawText:data.get('rawText')});
    packet.digest=await sha256(stable(packet));
    packet.createdAt=new Date().toISOString();
    lastPacket=packet;
    result.innerHTML=resultHtml(packet);
    status.textContent='Analysis complete. Human review required.';
  }catch(error){lastPacket=null;result.innerHTML='';status.textContent=error instanceof Error?error.message:'Record analysis failed.';}
}
async function review(decision){
  if(!lastPacket)return;
  const reviews=readReviews(),previous=reviews.at(-1)?.decisionDigest||null,note=document.querySelector('#record-review-note')?.value||'';
  const entry=createReviewDecision(lastPacket,{decision,note,previousDigest:previous});
  entry.decisionDigest=await sha256(stable(entry));
  reviews.push(entry);saveReviews(reviews);
  const status=document.querySelector('#record-ingestion-status');if(status)status.textContent=`Review saved locally: ${decision}. Canonical genealogy unchanged.`;
  window.dispatchEvent(new CustomEvent('family-view-rendered'));
}

document.addEventListener('submit',event=>{if(event.target?.id!=='record-ingestion-form')return;event.preventDefault();analyze(event.target);});
document.addEventListener('change',async event=>{
  if(event.target?.id!=='record-file')return;
  const file=event.target.files?.[0];if(!file)return;
  const ext=file.name.split('.').pop()?.toLowerCase()||'';
  const status=document.querySelector('#record-ingestion-status');
  if(!supportedExtensions.has(ext)){event.target.value='';if(status)status.textContent='Only TXT, Markdown, CSV, and JSON text files are supported. For images/PDF/DOCX, paste a verified transcription.';return;}
  if(file.size>2_000_000){event.target.value='';if(status)status.textContent='File exceeds the 2 MB browser intake limit.';return;}
  try{const text=await file.text(),area=document.querySelector('#record-ingestion-form textarea[name="rawText"]');if(area)area.value=text;if(status)status.textContent=`Loaded ${file.name}. Review the transcription before analysis.`;}catch{if(status)status.textContent='Could not read the selected file.';}
});
document.addEventListener('click',event=>{
  const decision=event.target.closest?.('[data-ingest-decision]')?.dataset.ingestDecision;
  if(decision){review(decision);return;}
  if(event.target.closest?.('[data-ingest-download]')&&lastPacket)downloadJson(`evidence-packet-${lastPacket.digest.slice(0,12)}.json`,lastPacket);
});
window.addEventListener('family-view-rendered',()=>requestAnimationFrame(mount));
window.addEventListener('hashchange',()=>requestAnimationFrame(mount));
setTimeout(mount,0);
