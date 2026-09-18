import fs from'node:fs';

const diffPath='public/canonical-diff.json';
const modelPath='public/research-model.json';
const auditPath='public/semantic-audit.json';
const graphPath='public/canonical-graph.json';
const diff=JSON.parse(fs.readFileSync(diffPath,'utf8'));
const model=JSON.parse(fs.readFileSync(modelPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
const graph=JSON.parse(fs.readFileSync(graphPath,'utf8'));

const lower=new Set(['PROVISIONAL','UNRESOLVED','REJECTED']);
const assertionPromotions=[...(diff.relationships?.stateChanged||[]),...(diff.claims?.stateChanged||[])].filter(x=>lower.has(x.from)&&x.to==='SUPPORTED');
const personStateReclassifications=diff.people?.stateChanged||[];

// Person-row state is not an assertion state: the canonical inventory can encode lineage/parentage
// confidence while the normalized person record can encode independently supported identity/existence.
// Preserve those differences visibly, but never treat them as permission to promote a relationship or claim.
diff.personStateReclassifications=personStateReclassifications;
diff.personStatePolicy='INFORMATIONAL ONLY — PERSON-ROW STATUS MAY SUMMARIZE IDENTITY/EXISTENCE WHILE RELATIONSHIP AND CLAIM STATES REMAIN THE ASSERTION-LEVEL RELEASE GATES';
diff.assertionEvidencePromotions=assertionPromotions;
diff.hasEvidencePromotion=assertionPromotions.length>0;
diff.releaseBlocking={canonicalLoss:Boolean(diff.hasCanonicalLoss),assertionEvidencePromotion:diff.hasEvidencePromotion,graphIntegrity:graph.integrity?.pass!==true};

model.canonicalDiff=diff;
const check=audit.checks?.find(x=>x.id==='AUD-099');
if(check){
  check.label='Canonical diff detects no silent relationship/claim evidence promotion';
  check.pass=!diff.hasEvidencePromotion;
  check.detail=diff.hasEvidencePromotion?JSON.stringify(assertionPromotions):`${personStateReclassifications.length} person-level status reclassifications retained as informational; 0 assertion promotions`;
}
// Preserve the established semantic-audit release contract; platform evolution is tracked separately.
audit.version='13.0';
audit.platformVersion='13.10';
audit.pass=(audit.checks||[]).every(x=>x.pass!==false);

fs.writeFileSync(diffPath,JSON.stringify(diff,null,2)+'\n');
fs.writeFileSync(modelPath,JSON.stringify(model,null,2)+'\n');
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');

const pass=graph.integrity?.pass===true&&!diff.hasCanonicalLoss&&!diff.hasEvidencePromotion&&audit.pass;
console.log(JSON.stringify({pass,personStateReclassifications:personStateReclassifications.length,assertionEvidencePromotions:assertionPromotions,canonicalLoss:diff.hasCanonicalLoss,graphPass:graph.integrity?.pass,auditPass:audit.pass,auditVersion:audit.version,platformVersion:audit.platformVersion},null,2));
if(!pass)process.exitCode=1;
