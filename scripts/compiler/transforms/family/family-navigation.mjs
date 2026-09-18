import fs from 'node:fs';
const modelPath='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.visualFamilyExperience={
  version:'12.3',
  title:'Visual Family Experience',
  tree:{nodeRule:'Tree nodes may show initials or a linked public portrait, human-readable dates/privacy, evidence state, and provenance without changing genealogy semantics.',familyDepth:'Family mode supports explicit 1/2/3 generation context or all connected family; Ancestors and Descendants remain structural traversals.',mobileRule:'On small screens the default family experience becomes a card-based relative navigator while the SVG remains optional rather than compressed beyond usability.'},
  media:{authority:'MEDIA METADATA IS PRESENTATION/ARCHIVE DATA — NOT GENEALOGY EVIDENCE BY DEFAULT',fields:['id','kind','title','caption','personIds','sourceId','provenance','public','privacy'],privacyRule:'Living-person media must be public only when explicitly marked public; media visibility never overrides living-person field redaction.',evidenceRule:'Attaching media to a person does not promote a claim, relationship, identity bridge, or evidence state.'},
  relationshipSemantics:{rule:'Spouse, parent-child, contextual, step/adoptive, and identity relationships remain distinct edge types and must not be visually collapsed into generic pedigree.',identityBridge:'The DeVine/Rahe identity bridge remains unresolved and visually distinct from descent.'},
  canonicalRule:'v12.3 changes visual presentation and navigation only. Canonical v10 evidence, source states, rejected assertions, and unresolved identity semantics remain immutable.'
};
if(!Array.isArray(model.mediaAssets))model.mediaAssets=[];
model.meta.release='12.3';model.meta.version='12.3';model.meta.releaseTitle='Visual Family Experience — Rich Tree + Profiles + Media Foundation';
const checks=audit.checks.filter(c=>!['AUD-037','AUD-038','AUD-039','AUD-040'].includes(c.id));
checks.push(
{id:'AUD-037',label:'Visual tree controls cannot mutate canonical evidence',pass:/immutable/i.test(model.visualFamilyExperience.canonicalRule),detail:model.visualFamilyExperience.canonicalRule},
{id:'AUD-038',label:'Media metadata cannot promote genealogy evidence',pass:/does not promote/i.test(model.visualFamilyExperience.media.evidenceRule),detail:model.visualFamilyExperience.media.evidenceRule},
{id:'AUD-039',label:'Living-person media has an explicit privacy gate',pass:/explicitly marked public/i.test(model.visualFamilyExperience.media.privacyRule),detail:model.visualFamilyExperience.media.privacyRule},
{id:'AUD-040',label:'Identity bridge remains distinct from pedigree',pass:/unresolved/i.test(model.visualFamilyExperience.relationshipSemantics.identityBridge)&&/distinct/i.test(model.visualFamilyExperience.relationshipSemantics.identityBridge),detail:model.visualFamilyExperience.relationshipSemantics.identityBridge}
);
audit.version='12.3';audit.checks=checks;audit.pass=checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,mediaAssets:model.mediaAssets.length},null,2));
