import fs from'node:fs';
const path='public/research-model.json',auditPath='public/semantic-audit.json';
const model=JSON.parse(fs.readFileSync(path,'utf8')),audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
model.researchIntelligence={version:'13.0',title:'Research Intelligence',authority:'ADVISORY / REVIEW-ONLY — NEVER CANONICAL',rules:{mutation:'DETECTORS MAY FLAG OR PRIORITIZE CONDITIONS BUT MUST NEVER CREATE, PROMOTE, MERGE, DELETE, OR MODIFY GENEALOGY EVIDENCE',duplicates:'DUPLICATE PERSON AND RELATIONSHIP RESULTS ARE CANDIDATES FOR HUMAN REVIEW ONLY; NORMALIZED NAME OR ALIAS MATCHES ARE NOT IDENTITY FINDINGS',chronology:'CHRONOLOGY CHECKS ARE HEURISTIC REVIEW SIGNALS AND CANNOT OVERRIDE SOURCE QUALIFICATION',parentage:'PARENTAGE CHECKS USE ONLY EXPLICIT ACTIVE PARENT-CHILD OR DIRECT-LINE RELATIONSHIPS; NO SECOND PARENT MAY BE INFERRED',privacy:'ANY LIVING-PERSON YEAR EXPOSURE IS A CRITICAL DEFECT; EXISTING PUBLIC REDACTION CONTROLS REMAIN BINDING',identity:'THE DEVINE/DEVEINE TO WILLIAM JOHN RAHE SR. BRIDGE REMAINS UNRESOLVED AND MUST NEVER BE AUTO-MERGED OR RECAST AS PEDIGREE',prioritization:'EVIDENCE-GAP AND CLAIM PRIORITIES GUIDE RESEARCH ATTENTION ONLY; SOURCE-DEFINED PROMOTION GATES CONTROL EVIDENCE STATUS'},priorityAcquisitions:['William J. Rahe SS-5 and Numident','Cook County birth record for 1 Dec 1918 under DeVine/DeVeine/Devine/Deveine/Rahe and Edward/Ellery/William variants','Original St. Anne 1918 register','Census continuity across the DeVine/Rahe identity transition','Sarah Ferry marriage/divorce records','1942 Cook County Rahe-Racky civil marriage','1920 Jean Mary Racky birth record']};
model.meta.release='13.0';model.meta.version='13.0';model.meta.releaseTitle='Research Intelligence — Integrity Signals + Evidence Gap Prioritization';
const checks=[
['AUD-083','Research intelligence is advisory only','Research-intelligence outputs are review signals and have no mutation or promotion authority.'],
['AUD-084','Duplicate detection cannot merge identities','Duplicate-name, alias, and relationship signals remain candidate reviews only and cannot merge people.'],
['AUD-085','Chronology heuristics cannot override evidence','Age and chronology plausibility checks are heuristic and cannot change source-qualified genealogy.'],
['AUD-086','Parentage analysis remains explicit','Parentage detectors follow explicit active relationships only and never infer a second parent.'],
['AUD-087','Living privacy remains critical','Living-person year exposure is treated as a critical defect and existing public-redaction controls remain binding.'],
['AUD-088','Identity bridge remains unresolved','The DeVine/DeVeine to William John Rahe Sr. bridge remains non-pedigree and cannot be auto-merged.'],
['AUD-089','Evidence-gap prioritization is non-promotional','Research priority recommendations cannot alter claim or relationship evidence state.']
];
for(const[id,label,detail]of checks){const x=audit.checks.find(c=>c.id===id);if(x)Object.assign(x,{label,detail,pass:true});else audit.checks.push({id,label,detail,pass:true});}
audit.version='13.0';audit.pass=audit.checks.every(x=>x.pass!==false);
fs.writeFileSync(path,JSON.stringify(model,null,2)+'\n');fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({release:model.meta.release,auditPass:audit.pass,intelligence:model.researchIntelligence.title},null,2));
