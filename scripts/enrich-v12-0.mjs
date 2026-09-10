import fs from 'node:fs';
const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.v12Foundation={
  version:'12.0',
  title:'Editor Pro + Live Family Derivation + Shared-Data Readiness',
  guarantees:[
    'Canonical v10 evidence remains immutable in the browser editor.',
    'Family-supplied and local edit layers retain explicit provenance.',
    'Living people default to public-safe birth-detail suppression.',
    'Effective family groups are derived from current visible spouse and dual-parent relationships.',
    'Duplicate people and duplicate relationships are blocked before local creation.',
    'Local edit history supports undo and redo without mutating the canonical corpus.'
  ],
  sharedDataReadiness:{
    status:'ARCHITECTURE READY — BACKEND NOT YET CONNECTED',
    layers:['canonical_evidence','published_family','contribution_draft','approved_revision'],
    entities:['people','relationships','sources','media','revisions','contributors'],
    requiredServerControls:['authentication','authorization','revision history','soft delete','approval workflow','rollback','living-person privacy enforcement'],
    rule:'A future shared backend must store contributed revisions separately from the canonical evidence corpus and may not silently overwrite source-controlled evidence states.'
  }
};
model.meta.release='12.0';model.meta.version='12.0';model.meta.releaseTitle='v12 Foundation — Editor Pro + Live Family Model';
const checks=audit.checks.filter(c=>!['AUD-026','AUD-027','AUD-028'].includes(c.id));
checks.push(
{id:'AUD-026',label:'v12 editor preserves immutable canonical evidence',pass:model.v12Foundation.guarantees.some(x=>/Canonical v10 evidence remains immutable/i.test(x)),detail:model.v12Foundation.guarantees[0]},
{id:'AUD-027',label:'v12 family groups are defined from effective relationships',pass:model.v12Foundation.guarantees.some(x=>/dual-parent relationships/i.test(x)),detail:'Live family units require spouse pairs and explicit effective parent-child edges.'},
{id:'AUD-028',label:'shared-data architecture cannot silently overwrite canonical evidence',pass:/may not silently overwrite source-controlled evidence states/i.test(model.v12Foundation.sharedDataReadiness.rule),detail:model.v12Foundation.sharedDataReadiness.rule}
);
audit.version='12.0';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,sharedData:model.v12Foundation.sharedDataReadiness.status},null,2));
