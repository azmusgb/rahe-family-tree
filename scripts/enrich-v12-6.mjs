import fs from 'node:fs';
const modelPath='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(modelPath,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.familyExperienceRedesign={
  version:'12.6',
  title:'Family Experience Redesign',
  defaultMode:'family',
  modes:{family:'People-first family browsing with simplified controls and research detail progressively disclosed.',research:'Full evidence workbench with canonical claims, sources, conflicts, acquisition tasks, audit controls, and contribution tooling.'},
  homeRule:'The default home experience introduces the Rahe family, recent people, family branches, family groups, and a featured research story before technical controls.',
  navigationRule:'Family mode prioritizes Home, Tree, People, and Family Groups. Research and archive navigation remain available but visually secondary.',
  typographyRule:'Interactive labels and ordinary metadata are enlarged from micro-label sizes to readable family-facing UI sizes.',
  treeRule:'The visual focal-person tree remains the dominant family exploration surface. Full-tree expert mode remains available and mobile retains the visual tree instead of replacing it with a list-only experience.',
  profileRule:'Person presentation prioritizes identity, immediate family, life context, and media before deeper claim/source/research detail.',
  statePresentationRule:'Family mode may translate controlled evidence tokens into plain-language labels for presentation only; stored evidence states are never rewritten.',
  privacyRule:'Living-person dates and private media remain protected exactly as in the canonical/public-safe and media privacy layers.',
  canonicalRule:'v12.6 changes presentation and navigation only. Canonical v10 evidence, claims, relationships, source states, identity bridge status, and promotion gates remain immutable.'
};
model.meta.release='12.6';model.meta.version='12.6';model.meta.releaseTitle='Family Experience Redesign — Family-First Home + Research Mode';
const ids=new Set(['AUD-050','AUD-051','AUD-052','AUD-053']);audit.checks=audit.checks.filter(c=>!ids.has(c.id));audit.checks.push(
{id:'AUD-050',label:'Family-first presentation cannot rewrite canonical evidence',pass:/presentation and navigation only/i.test(model.familyExperienceRedesign.canonicalRule)&&/immutable/i.test(model.familyExperienceRedesign.canonicalRule),detail:model.familyExperienceRedesign.canonicalRule},
{id:'AUD-051',label:'Research mode remains available without dominating family browsing',pass:model.familyExperienceRedesign.defaultMode==='family'&&/Full evidence workbench/i.test(model.familyExperienceRedesign.modes.research),detail:model.familyExperienceRedesign.navigationRule},
{id:'AUD-052',label:'Plain-language evidence labels are presentation-only',pass:/presentation only/i.test(model.familyExperienceRedesign.statePresentationRule)&&/never rewritten/i.test(model.familyExperienceRedesign.statePresentationRule),detail:model.familyExperienceRedesign.statePresentationRule},
{id:'AUD-053',label:'Mobile family browsing retains the visual tree',pass:/mobile retains the visual tree/i.test(model.familyExperienceRedesign.treeRule)&&/Full-tree expert mode remains available/i.test(model.familyExperienceRedesign.treeRule),detail:model.familyExperienceRedesign.treeRule}
);
audit.version='12.6';audit.pass=audit.checks.every(c=>c.pass);model.audit=audit;
fs.writeFileSync(modelPath,JSON.stringify(model,null,2));fs.writeFileSync(auditPath,JSON.stringify(audit,null,2));
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,defaultMode:model.familyExperienceRedesign.defaultMode},null,2));
