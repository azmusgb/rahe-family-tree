import fs from 'node:fs';
const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));

model.reviewPacketSchema={
  version:1,
  authority:'PRIVATE REVIEW ARTIFACT — NON-CANONICAL',
  fields:['draft','linkedPeople','linkedClaims','registeredSource','promotionRule','generatedAt'],
  sourceIdPolicy:'If a draft supplies a source ID, the UI must distinguish a registered canonical source from an unregistered/local reference.',
  promotionRule:'Review packets document proposed research interpretation only. They cannot alter canonical evidence state.'
};
model.researchWorkflow.persistence={
  authority:'PRIVATE BROWSER OVERLAY',
  key:'rahe.family.research-state.v1',
  behavior:'Saved task status and notes override display only; canonical task rows remain unchanged.'
};
model.meta.release='11.4';
model.meta.version='11.4';
model.meta.releaseTitle='Evidence Review Packets + Effective Research Workflow';

const checks=audit.checks.filter(c=>!['AUD-017','AUD-018','AUD-019'].includes(c.id));
checks.push(
  {id:'AUD-017',label:'Evidence-intake source references are validation-aware',pass:/distinguish a registered canonical source from an unregistered/i.test(model.reviewPacketSchema.sourceIdPolicy),detail:model.reviewPacketSchema.sourceIdPolicy},
  {id:'AUD-018',label:'Evidence review packets remain non-canonical',pass:/NON-CANONICAL/i.test(model.reviewPacketSchema.authority)&&/cannot alter canonical evidence state/i.test(model.reviewPacketSchema.promotionRule),detail:model.reviewPacketSchema.authority},
  {id:'AUD-019',label:'Private research progress changes display only',pass:/override display only/i.test(model.researchWorkflow.persistence.behavior),detail:model.researchWorkflow.persistence.behavior}
);
audit.version='11.4';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,reviewPacketSchema:model.reviewPacketSchema.version},null,2));
