import{model,esc,personById,claimById}from'./core.js';

const KEY='rahe.family.research-state.v1';
const now=()=>new Date().toISOString();
const empty=()=>({version:1,tasks:{},intake:[]});

export function loadResearchState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(KEY)||'null');
    if(!parsed||parsed.version!==1)return empty();
    return{version:1,tasks:parsed.tasks||{},intake:Array.isArray(parsed.intake)?parsed.intake:[]};
  }catch{return empty();}
}
export function saveResearchState(state){localStorage.setItem(KEY,JSON.stringify(state));return state;}
export function taskOverlay(taskId){return loadResearchState().tasks?.[taskId]||null;}
export function updateTaskOverlay(taskId,patch){
  const state=loadResearchState(),prior=state.tasks[taskId]||{};
  state.tasks[taskId]={...prior,...patch,updatedAt:now()};
  saveResearchState(state);return state.tasks[taskId];
}
export function clearTaskOverlay(taskId){const state=loadResearchState();delete state.tasks[taskId];saveResearchState(state);}
export function stageIntake(draft){
  const state=loadResearchState();
  const record={id:draft.id||`INTAKE-${Date.now()}`,title:String(draft.title||'Untitled evidence draft').trim(),recordType:String(draft.recordType||'Record').trim(),personIds:[...new Set(draft.personIds||[])],claimIds:[...new Set(draft.claimIds||[])],sourceId:String(draft.sourceId||'').trim(),repository:String(draft.repository||'').trim(),recordDate:String(draft.recordDate||'').trim(),place:String(draft.place||'').trim(),transcription:String(draft.transcription||'').trim(),analysisNote:String(draft.analysisNote||'').trim(),fileName:String(draft.fileName||'').trim(),createdAt:draft.createdAt||now(),updatedAt:now(),status:draft.status||'STAGED'};
  state.intake.unshift(record);saveResearchState(state);return record;
}
export function updateIntake(id,patch){const state=loadResearchState(),i=state.intake.findIndex(x=>x.id===id);if(i<0)return null;state.intake[i]={...state.intake[i],...patch,updatedAt:now()};saveResearchState(state);return state.intake[i];}
export function deleteIntake(id){const state=loadResearchState();state.intake=state.intake.filter(x=>x.id!==id);saveResearchState(state);}
export function exportPrivateState(){const blob=new Blob([JSON.stringify(loadResearchState(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rahe-private-research-state.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function importPrivateState(text){const parsed=JSON.parse(text);if(parsed?.version!==1||typeof parsed.tasks!=='object'||!Array.isArray(parsed.intake))throw Error('Unsupported research-state file');saveResearchState(parsed);return parsed;}

const options=(items,selected='')=>items.map(x=>`<option value="${esc(x)}" ${x===selected?'selected':''}>${esc(x)}</option>`).join('');
const personOptions=()=>model.people.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.branch)}</option>`).join('');
const claimOptions=()=>model.claims.map(c=>`<option value="${c.id}">${esc(c.id)} · ${esc(c.claim.slice(0,90))}</option>`).join('');

export function renderPrivateResearchControls(){
  const state=loadResearchState(),overlays=Object.keys(state.tasks).length;
  return `<section class="panel private-state-panel"><div class="section-title"><div><p class="eyebrow">PRIVATE WORKBENCH OVERLAY</p><h2>Research progress</h2></div><span>${overlays} task override(s) · ${state.intake.length} staged record(s)</span></div><aside class="notice control"><strong>Non-canonical by design</strong><p>${esc(model.researchStateSchema?.safetyRule||'Private progress does not modify canonical evidence.')}</p></aside><div class="private-actions"><button class="action" data-private-export>Export private state</button><label class="action file-action">Import private state<input type="file" accept="application/json" data-private-import hidden></label><button class="action" data-route-intake>Open Evidence Intake</button></div></section>`;
}

export function renderTaskWorkflowEditor(task){
  const saved=taskOverlay(task.id),status=saved?.status||task.operationalStatus||'NOT STARTED',note=saved?.note||'';
  return `<section class="panel task-workflow"><div class="section-title"><div><p class="eyebrow">PRIVATE WORKFLOW STATE</p><h2>Research progress</h2></div><span>${saved?'Saved in this browser':'Using canonical default'}</span></div><label>Status<select data-task-status="${esc(task.id)}">${options(model.researchWorkflow?.statuses||[],status)}</select></label><label>Research note<textarea rows="5" data-task-note="${esc(task.id)}" placeholder="Private working note; not evidence and not published.">${esc(note)}</textarea></label><div class="private-actions"><button class="action" data-task-save="${esc(task.id)}">Save private progress</button><button class="action" data-task-clear="${esc(task.id)}">Reset to canonical default</button></div><p class="muted">Changing this status never changes claim, person, relationship, source, or canonical dossier evidence state.</p></section>`;
}

export function renderEvidenceIntake(){
  const state=loadResearchState(),statuses=model.evidenceIntake?.acceptedDraftStatuses||['STAGED','REVIEWED','REJECTED','READY FOR CANONICAL REVIEW'];
  return `<aside class="notice warning"><strong>NON-CANONICAL STAGING AREA</strong><p>${esc(model.evidenceIntake?.promotionRule||'Staged evidence cannot promote claims.')}</p></aside><section class="panel intake-form"><div class="section-title"><div><p class="eyebrow">EVIDENCE INTAKE</p><h2>Stage a newly acquired record</h2></div><span>Local browser storage</span></div><form id="intake-form"><div class="form-grid"><label>Record title<input name="title" required placeholder="e.g. Cook County birth certificate image"></label><label>Record type<input name="recordType" placeholder="Birth, census, marriage, SSA, parish…"></label><label>Repository / database<input name="repository" placeholder="Only enter what the record/source actually identifies"></label><label>Record date<input name="recordDate" placeholder="As written on record"></label><label>Place<input name="place" placeholder="As written or transcribed"></label><label>Existing source ID, if already registered<input name="sourceId" placeholder="C001 / W006 / V…"></label><label class="wide">People<select name="personIds" multiple size="6">${personOptions()}</select></label><label class="wide">Claims potentially affected<select name="claimIds" multiple size="6">${claimOptions()}</select></label><label class="wide">Transcription / evidence text<textarea name="transcription" rows="6" placeholder="Transcribe only what the record supports."></textarea></label><label class="wide">Analysis note<textarea name="analysisNote" rows="4" placeholder="Separate analysis from transcription. State uncertainty explicitly."></textarea></label><label class="wide">Local file reference<input name="fileName" type="file"><small>Only the filename is stored here; the file itself is not uploaded by this static site.</small></label></div><button class="action" type="submit">Stage record for review</button></form></section><section><div class="section-title"><div><p class="eyebrow">STAGED RECORDS</p><h2>Private intake queue</h2></div><span>${state.intake.length}</span></div><div class="intake-list">${state.intake.length?state.intake.map(x=>`<article class="intake-card"><div class="claim-top"><code>${esc(x.id)}</code><span>${esc(x.createdAt.slice(0,10))}</span></div><h3>${esc(x.title)}</h3><p><b>${esc(x.recordType)}</b>${x.repository?` · ${esc(x.repository)}`:''}${x.recordDate?` · ${esc(x.recordDate)}`:''}</p><p>${esc(x.transcription||'No transcription entered.')}</p><div class="source-usage"><span>${x.personIds.length} people</span><span>${x.claimIds.length} claims</span></div><label>Status<select data-intake-status="${esc(x.id)}">${options(statuses,x.status)}</select></label><details><summary>Review links and notes</summary><div class="intake-links">${x.personIds.map(id=>`<button class="text-link" data-person="${id}">${esc(personById(id)?.name||id)}</button>`).join(' · ')||'No people linked'}<br>${x.claimIds.map(id=>`<button class="text-link" data-claim="${id}">${esc(claimById(id)?.id||id)}</button>`).join(' · ')||'No claims linked'}${x.analysisNote?`<p><b>Analysis note:</b> ${esc(x.analysisNote)}</p>`:''}${x.fileName?`<p><b>Local filename:</b> ${esc(x.fileName)}</p>`:''}</div></details><div class="private-actions"><button class="action" data-intake-delete="${esc(x.id)}">Delete draft</button></div></article>`).join(''):'<div class="empty compact">No evidence drafts staged in this browser.</div>'}</div></section>`;
}
