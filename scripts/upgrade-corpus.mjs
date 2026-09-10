import fs from "node:fs";

const corpusPath="public/corpus.json";
const coveragePath="public/coverage.json";
const redactionsPath="public/redactions.json";
const data=JSON.parse(fs.readFileSync(corpusPath,"utf8"));

const slug=s=>String(s??"").normalize("NFKD").replace(/[^\x00-\x7F]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"item";
const norm=s=>String(s??"").toLowerCase().replace(/dennewitz rahe/g,"dennewitz").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const findSection=prefix=>data.sections.find(s=>!s.legacy&&s.title.startsWith(prefix)) || data.sections.find(s=>s.title.startsWith(prefix));

// Correct the old extraction boundary: section 25 is v10 control/certification, not Part II legacy.
const finalCert=data.sections.find(s=>s.title.startsWith("25. v10 Final Single-Source Certification"));
if(finalCert){ finalCert.legacy=false; finalCert.annex=""; }

// Living-person privacy rules include shortened legacy variants and separated name/date columns.
const privacyRules=[
  {person:"Linda Kay Dennewitz",aliases:[/\bLinda(?:\s+K(?:ay)?\.?)?\s+Dennewitz\b/i,/\bLinda K\.\b/i],patterns:[/\b27\s+Oct(?:ober)?\s+1942\b/gi,/\b1942\s*[–-]\s*(?=$|[;,\s])/g]},
  {person:"Jean C./Carol Dennewitz",aliases:[/\bJean\s+C(?:\.\/Carol)?\s+Dennewitz\b/i,/\bCarol\s+Dennewitz\b/i,/\bJean C\.\b/i],patterns:[/\b17\s+Jun(?:e)?\s+1947\b/gi,/\bc\.?\s*1947\s*[–-]\s*48\b/gi,/\b1947\s*[–-]\s*(?=$|[;,\s])/g]},
  {person:"Kathleen Ann Dennewitz Rahe",aliases:[/\bKathleen(?:\s+A(?:nn)?\.?)?\s+Dennewitz(?:\s+Rahe|\/Rahe)?\b/i,/\bKathleen A\. Rahe\b/i],patterns:[/\b17\s+Nov(?:ember)?\s+1952\b/gi,/\b1952\s*[–-]\s*(?=$|[;/,\s])/g]},
  {person:"William John Rahe Jr.",aliases:[/\bWilliam(?:\s+John)?\s+Rahe\s+Jr\.?\b/i],patterns:[/\b1946\s*[–-]\s*(?=$|[;/,\s])/g]},
  {person:"William John Rahe III",aliases:[/\bWilliam(?:\s+John)?\s+Rahe\s+III\b/i],patterns:[/\b1977\s*[–-]\s*(?=$|[;/,\s])/g]},
  {person:"Melissa Rahe",aliases:[/\bMelissa\s+Rahe\b/i],patterns:[/\b1983\s*[–-]\s*(?=$|[;/,\s])/g]},
  {person:"Current Rahe children",aliases:[/\bCurrent Rahe children\b/i],patterns:[/\b2002\s*[–-]\s*2014\b/gi]}
];
const redactions=[];

function scrubWithRules(text,rules,location){
  let out=String(text??"");
  for(const rule of rules){
    for(const pattern of rule.patterns){
      pattern.lastIndex=0;
      let count=0;
      out=out.replace(pattern,()=>{count++;return "[birth detail withheld]";});
      if(count) redactions.push({id:`R${String(redactions.length+1).padStart(4,"0")}`,location,person:rule.person,reason:"Living-person birth detail withheld in public/shareable edition",occurrences:count});
    }
  }
  return out;
}

for(const s of data.sections){
  for(let bi=0;bi<s.blocks.length;bi++){
    const b=s.blocks[bi];
    if(b.type==="p"){
      const rules=privacyRules.filter(r=>r.aliases.some(a=>a.test(b.text)));
      if(rules.length) b.text=scrubWithRules(b.text,rules,{section:s.id,block:bi,type:"paragraph"});
    }else if(b.type==="table"){
      for(let ri=0;ri<b.rows.length;ri++){
        const row=b.rows[ri];
        const joined=row.join(" | ");
        const rules=privacyRules.filter(r=>r.aliases.some(a=>a.test(joined)));
        if(!rules.length) continue;
        for(let ci=0;ci<row.length;ci++) row[ci]=scrubWithRules(row[ci],rules,{section:s.id,block:bi,type:"table",row:ri,column:ci});
      }
    }
  }
}

// Rebuild a complete location-only ledger from the final public text, including
// redactions already present in the prior public corpus.
redactions.length=0;
const markerRx=/\[(?:birth detail|birth year) withheld\]/g;
for(const s of data.sections){
  for(let bi=0;bi<s.blocks.length;bi++){
    const b=s.blocks[bi];
    if(b.type==="p"){
      const count=[...String(b.text||"").matchAll(markerRx)].length;
      if(count) redactions.push({id:`R${String(redactions.length+1).padStart(4,"0")}`,location:{section:s.id,block:bi,type:"paragraph"},person:"Living-person context",reason:"Living-person birth detail withheld in public/shareable edition",occurrences:count});
    }else if(b.type==="table"){
      for(let ri=0;ri<b.rows.length;ri++) for(let ci=0;ci<b.rows[ri].length;ci++){
        const count=[...String(b.rows[ri][ci]||"").matchAll(markerRx)].length;
        if(count) redactions.push({id:`R${String(redactions.length+1).padStart(4,"0")}`,location:{section:s.id,block:bi,type:"table",row:ri,column:ci},person:"Living-person context",reason:"Living-person birth detail withheld in public/shareable edition",occurrences:count});
      }
    }
  }
}

// Rebuild stable Appendix-F people IDs.
const used=new Set();
const oldPeople=data.people || [];
for(const p of oldPeople){
  let base=`P-${slug(p.name).toUpperCase().slice(0,48)}`,id=base,n=2;
  while(used.has(id)){ id=`${base}-${n++}`; }
  used.add(id); p.id=id;
  p.living=privacyRules.some(r=>r.aliases.some(a=>a.test(p.name)));
  if(p.living) p.dates="Living / birth details withheld";
}
const people=oldPeople;
const nameMap=new Map(people.map(p=>[norm(p.name),p.id]));

function resolve(label){
  const n=norm(String(label??"").replace(/\?$/,"") );
  if(nameMap.has(n)) return nameMap.get(n);
  const matches=people.filter(p=>n && (norm(p.name).includes(n)||n.includes(norm(p.name))));
  return matches.length===1?matches[0].id:null;
}

// Use the source's relationship table first.
const relationships=[];
function addRel(type,a,b,state,sectionPrefix,role=type,basis="Explicit relationship statement in controlling source"){
  const from=resolve(a),to=resolve(b);
  if(!from||!to||from===to) return;
  if(type==="spouse"){
    const key=[from,to].sort().join("|");
    if(relationships.some(r=>r.type==="spouse"&&[r.from,r.to].sort().join("|")===key)) return;
  }
  if(type==="parent-child"&&relationships.some(r=>r.type===type&&r.from===from&&r.to===to)) return;
  const sec=findSection(sectionPrefix);
  relationships.push({id:`REL-${String(relationships.length+1).padStart(4,"0")}`,type,from,to,role,state,source:{section:sec?.id||"",basis}});
}

const relsec=findSection("21.");
const reltable=relsec?.blocks.find(b=>b.type==="table");
if(reltable){
  for(let ri=1;ri<reltable.rows.length;ri++){
    const r=reltable.rows[ri]; if(r.length<7) continue;
    const [sourcePid,name,,father,mother,spouses,state]=r;
    for(const [role,label] of [["father",father],["mother",mother]]){
      if(label&&!['UNKNOWN','UNRESOLVED','—','-'].includes(label.toUpperCase())){
        const f=resolve(label),t=resolve(name);
        if(f&&t) relationships.push({id:`REL-${String(relationships.length+1).padStart(4,"0")}`,type:"parent-child",from:f,to:t,role,state,source:{section:relsec.id,row:ri,canonicalPersonId:sourcePid}});
      }
    }
    if(spouses&&!['UNKNOWN','UNRESOLVED','—','-'].includes(spouses.toUpperCase())){
      for(const label of spouses.split(';').map(x=>x.trim()).filter(Boolean)) addRel('spouse',name,label,state,'21.','spouse','Canonical relationship dataset');
    }
  }
}

[
["Johann Ernst Dennewitz","Eva Maria","PROVISIONAL","3."],
["Johann Gottlieb Dennewitz","Johanna D. Rungert","PROVISIONAL","3."],
["John C. Dennewitz","Dorothee R. Huebler","PROVISIONAL-HIGH","3."],
["Otto Christian Dennewitz","Sarah Alice Hyde","PROVISIONAL-HIGH","3."],
["George Otto Dennewitz Sr.","Kate Alice Holman","PROVISIONAL-HIGH exact dates","3."],
["George Otto Dennewitz Jr.","Hazel Emma Berg Dennewitz","SUPPORTED / VERY HIGH","4."],
["William Holman Dennewitz","Dorothy Cecelia Kinsman","PROVISIONAL-HIGH collateral","4.2"],
["Arnold “Carl” Eric Berg","Katherine May Kinsman","PROVISIONAL-STRONG","5."],
["Walter / George Walter Kinsman","Mary Jane Hickey / McLaughlin","PROVISIONAL-STRONG","Appendix D."],
["Carl Otto Holman Sr.","Annette Olsdtr. Hafnor","PROVISIONAL-HIGH","6."],
["Owen Ferry","Isabella / Margaret Isabella McFadden","SUPPORTED relationship / birth detail conflict unresolved","7."],
["William John Rahe Sr.","Jean Mary Racky","PROVISIONAL-STRONG exact details / spouse event mixed","10."],
["Johann Anthony Racky","Amelia “Emily” Kopczynski","PROVISIONAL-STRONG / source-rich","10."],
["John Francis Racky","Anna Rose Hoffman","PROVISIONAL-STRONG","10."],
["William John Rahe Jr.","Kathleen Ann Dennewitz Rahe","SUPPORTED / family-established","3."],
["William John Rahe III","Melissa Rahe","SUPPORTED / family-established","3."]
].forEach(x=>addRel("spouse",...x,"spouse"));

[
["George Otto Dennewitz Sr.","George Otto Dennewitz Jr.","PROVISIONAL-HIGH exact dates","Appendix F."],
["Kate Alice Holman","George Otto Dennewitz Jr.","SUPPORTED spouse relationship / exact dates derivative","Appendix F."],
["George Otto Dennewitz Sr.","William Holman Dennewitz","PROVISIONAL-HIGH collateral","4.2"],
["Kate Alice Holman","William Holman Dennewitz","PROVISIONAL-HIGH collateral","4.2"],
["George Otto Dennewitz Jr.","Linda Kay Dennewitz","SUPPORTED relationship; date family-derived","4."],
["Hazel Emma Berg Dennewitz","Linda Kay Dennewitz","SUPPORTED relationship; date family-derived","4."],
["George Otto Dennewitz Jr.","Jean C./Carol Dennewitz","SUPPORTED relationship; date family-derived","4."],
["Hazel Emma Berg Dennewitz","Jean C./Carol Dennewitz","SUPPORTED relationship; date family-derived","4."],
["George Otto Dennewitz Jr.","Kathleen Ann Dennewitz Rahe","SUPPORTED / family-established","4."],
["Hazel Emma Berg Dennewitz","Kathleen Ann Dennewitz Rahe","SUPPORTED / family-established","4."],
["Oscar Ferdinand Berg","Arnold “Carl” Eric Berg","PROVISIONAL / probable","5."],
["Emma Matilda [maiden unknown]","Arnold “Carl” Eric Berg","PROVISIONAL identity / surname UNKNOWN","5."],
["Arnold “Carl” Eric Berg","Hazel Emma Berg Dennewitz","PROVISIONAL-STRONG","Appendix D."],
["Katherine May Kinsman","Hazel Emma Berg Dennewitz","PROVISIONAL-STRONG","Appendix D."],
["George E. / George Kinsman","Walter / George Walter Kinsman","UNRESOLVED","Appendix D."],
["Sarah Ann Moore","Walter / George Walter Kinsman","UNRESOLVED","Appendix D."],
["Walter / George Walter Kinsman","Katherine May Kinsman","PROVISIONAL-STRONG","Appendix D."],
["Mary Jane Hickey / McLaughlin","Katherine May Kinsman","PROVISIONAL-STRONG","Appendix D."],
["Carl Otto Holman Sr.","Kate Alice Holman","PROVISIONAL-HIGH","6."],
["Annette Olsdtr. Hafnor","Kate Alice Holman","PROVISIONAL-HIGH","6."],
["Peter / Patrick Ferry","Owen Ferry","SUPPORTED parent name / variant","7."],
["Cecily / Cecelia / Sheelah O’Donnell","Owen Ferry","SUPPORTED parent name / variant","7."],
["Owen Ferry","Edward Ferry","PROVISIONAL-HIGH","7.1"],
["Isabella / Margaret Isabella McFadden","Edward Ferry","PROVISIONAL-HIGH","7.1"],
["Owen Ferry","Cicily / Cecelia Frances Ferry Fleming","PROVISIONAL-STRONG / near-supported","7.1"],
["Isabella / Margaret Isabella McFadden","Cicily / Cecelia Frances Ferry Fleming","PROVISIONAL-STRONG / near-supported","7.1"],
["Owen Ferry","Patrick Ferry","PROVISIONAL","7.1"],
["Isabella / Margaret Isabella McFadden","Patrick Ferry","PROVISIONAL","7.1"],
["Owen Ferry","John Thomas Ferry","PROVISIONAL-HIGH","7.1"],
["Isabella / Margaret Isabella McFadden","John Thomas Ferry","PROVISIONAL-HIGH","7.1"],
["Owen Ferry","Sarah Ferry","SUPPORTED family framework / exact details mixed","7."],
["Isabella / Margaret Isabella McFadden","Sarah Ferry","SUPPORTED family framework / exact details mixed","7."],
["Owen Ferry","Mary Isabelle / Marie Ferry","PROVISIONAL-HIGH","7.1"],
["Isabella / Margaret Isabella McFadden","Mary Isabelle / Marie Ferry","PROVISIONAL-HIGH","7.1"],
["Ellery / Elley DeVine / DeVeine","Edward Ellery DeVine / DeVeine","SUPPORTED / VERY HIGH","8."],
["Sarah Ferry","Edward Ellery DeVine / DeVeine","SUPPORTED / VERY HIGH","8."],
["Johann Kaspar Rackey","Johann Anthony Racky","PROVISIONAL","10."],
["Margaretha Goetz","Johann Anthony Racky","PROVISIONAL","10."],
["Johann Anthony Racky","John Francis Racky","PROVISIONAL-STRONG / source-rich","10."],
["Amelia “Emily” Kopczynski","John Francis Racky","PROVISIONAL-STRONG / source-rich","10."],
["John Francis Racky","Jean Mary Racky","PROVISIONAL-STRONG","10."],
["Anna Rose Hoffman","Jean Mary Racky","PROVISIONAL-STRONG","10."]
].forEach(x=>addRel("parent-child",...x,"parent-child"));

for(const child of ["Irene M. Holman","Jennie Ellen Holman","Mabel Olga Holman","Amy Agatha Holman","Norman Holman","Charles Holman","Carl Otto Holman Jr."]){
  addRel("parent-child","Carl Otto Holman Sr.",child,"PROVISIONAL collateral","6.","parent-child");
  addRel("parent-child","Annette Olsdtr. Hafnor",child,"PROVISIONAL collateral","6.","parent-child");
}
for(const child of ["John Paul Racky","Marion Frances Racky","George Robert Racky","Donald Joseph Racky","Arthur Vincent Racky","Jean Mary Racky"]){
  addRel("parent-child","John Francis Racky",child,"PROVISIONAL / derivative sibling","10.1","parent-child");
  addRel("parent-child","Anna Rose Hoffman",child,"PROVISIONAL / derivative sibling","10.1","parent-child");
}
addRel("parent-child","William John Rahe Jr.","William John Rahe III","SUPPORTED / family-established","3.","parent-child");
addRel("parent-child","Kathleen Ann Dennewitz Rahe","William John Rahe III","SUPPORTED / family-established","3.","parent-child");
addRel("parent-child","William John Rahe III","Current Rahe children","SUPPORTED / family-established","3.","aggregate descendant relationship");
addRel("parent-child","Melissa Rahe","Current Rahe children","SUPPORTED / family-established","3.","aggregate descendant relationship");

const jg=people.filter(p=>p.name==="Johann Gottlieb Dennewitz");
if(jg.length>=2){
  relationships.push({id:`REL-${String(relationships.length+1).padStart(4,"0")}`,type:"direct-line-succession",from:jg[0].id,to:jg[1].id,role:"direct-line succession; exact parental role not stated in register",state:"PROVISIONAL",source:{section:findSection("3.")?.id||"",basis:"Direct-line relationship register"}});
}
addRel("direct-line-succession","John C. Dennewitz","Otto Christian Dennewitz","PROVISIONAL-HIGH","3.","direct-line succession; exact parental role not stated in register");
addRel("direct-line-succession","Otto Christian Dennewitz","George Otto Dennewitz Sr.","PROVISIONAL-HIGH","3.","direct-line succession; exact parental role not stated in register");

const ed=resolve("Edward Ellery DeVine / DeVeine"),wr=resolve("William John Rahe Sr.");
if(ed&&wr) relationships.push({id:"REL-IDENTITY-BRIDGE",type:"identity-bridge",from:ed,to:wr,role:"probable same person; transition mechanism unresolved",state:"UNRESOLVED / strongly corroborated hypothesis",source:{section:findSection("8.")?.id||"",claimId:"CL-DV-002"}});

const claims=[];
const claimsec=findSection("16.");
const claimtable=claimsec?.blocks.find(b=>b.type==="table");
if(claimtable){
  for(let i=1;i<claimtable.rows.length;i++){
    const r=claimtable.rows[i];if(r.length<5)continue;
    const [id,claim,state,basis,nextAction]=r;
    claims.push({id,claim,state,basis,nextAction,location:{section:claimsec.id,row:i}});
  }
}

const sources=[];
const srcsec=findSection("14.");
const srctable=srcsec?.blocks.find(b=>b.type==="table");
if(srctable){
  for(let i=1;i<srctable.rows.length;i++){
    const r=srctable.rows[i];if(r.length<6||!/^[CW]\d{3}$/.test(r[0].trim()))continue;
    const [id,name,klass,use,weight,legacyIds]=r;
    sources.push({id:id.trim(),name,class:klass,use,weight,legacyIds,location:{section:srcsec.id,row:i}});
  }
}
const esec=findSection("Appendix E.");
if(esec){
  for(const b of esec.blocks){
    if(b.type!=="table"||!b.rows.length||b.rows[0][0]!=="ID")continue;
    for(let i=1;i<b.rows.length;i++){
      const r=b.rows[i];if(r.length>=3&&/^V\d{3}$/.test(r[0].trim())) sources.push({id:r[0].trim(),name:r[1],class:"Verified web/repository source",use:r[2],weight:"Procedure/source verification only",legacyIds:"",location:{section:esec.id,row:i}});
    }
    break;
  }
}

const events=[]; const dateRx=/(?<!\d)(1[6-9]\d{2}|20\d{2})(?!\d)/g;
for(const s of data.sections){
  if(s.legacy)continue;
  for(let bi=0;bi<s.blocks.length;bi++){
    const b=s.blocks[bi];if(b.type!=="table")continue;
    for(let ri=1;ri<b.rows.length;ri++){
      const text=b.rows[ri].filter(Boolean).join(" | ");
      const years=[...new Set([...text.matchAll(dateRx)].map(m=>Number(m[1])))].sort((a,b)=>a-b);
      if(!years.length||years[0]<1600||years[0]>2026)continue;
      const state=["SUPPORTED","PROVISIONAL","UNRESOLVED","REJECTED","DERIVATIVE"].filter(x=>text.toUpperCase().includes(x)).join(" / ");
      events.push({id:`EV-${String(events.length+1).padStart(5,"0")}`,year:years[0],years,title:s.title,excerpt:text.slice(0,700),state,location:{section:s.id,block:bi,row:ri}});
    }
  }
}

for(const p of people){
  const token=p.name.split(" / ")[0].split("/")[0];
  p.references=data.sections.filter(s=>!s.legacy&&token&&JSON.stringify(s).includes(token)).map(s=>s.id);
}

data.people=people;
data.relationships=relationships;
data.claims=claims;
data.sources=sources;
data.events=events;
data.redactions=redactions;
data.meta={
  ...data.meta,
  relationships:relationships.length,
  claims:claims.length,
  sources:sources.length,
  events:events.length,
  privacyRedactions:redactions.reduce((n,r)=>n+r.occurrences,0),
  redactionEntries:redactions.length,
  canonicalFinalCertificationSection:finalCert?.id||null
};

fs.writeFileSync(corpusPath,JSON.stringify(data));
fs.writeFileSync(coveragePath,JSON.stringify(data.meta,null,2));
fs.writeFileSync(redactionsPath,JSON.stringify({
  policy:"Living-person birth details are withheld in the public/shareable edition. Locations are recorded without publishing removed values.",
  sourceSha256:data.meta.sha256,
  entries:redactions
},null,2));

console.log(JSON.stringify(data.meta,null,2));
