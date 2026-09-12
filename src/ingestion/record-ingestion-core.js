const norm=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^\x00-\x7F]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const uniq=values=>[...new Set(values.filter(Boolean))];
const yearTokens=value=>uniq([...String(value??'').matchAll(/\b(1[5-9]\d{2}|20\d{2})\b/g)].map(m=>Number(m[1])));
const controllingState=value=>{
  const text=String(value?.controllingState||value?.evidenceState||value?.state||'').toUpperCase();
  return ['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED'].find(x=>text.includes(x))||'UNRESOLVED';
};
const aliasesOf=person=>{
  const raw=Array.isArray(person?.aliases)?person.aliases:String(person?.aliases||'').split(/[;,]/);
  return uniq([person?.name,...raw].map(x=>String(x||'').trim()).filter(x=>x.length>=3));
};
const phrasePresent=(text,phrase)=>{
  const a=` ${norm(text)} `,b=norm(phrase);
  return b.length>=3&&a.includes(` ${b} `);
};
const knownYears=person=>yearTokens(person?.dates||'');
const explicitEventYears=text=>{
  const patterns=[
    ['birth',/(?:\bborn\b|\bbirth\b|\bb\.)[^\d]{0,24}(1[5-9]\d{2}|20\d{2})/ig],
    ['death',/(?:\bdied\b|\bdeath\b|\bd\.)[^\d]{0,24}(1[5-9]\d{2}|20\d{2})/ig],
    ['marriage',/(?:\bmarried\b|\bmarriage\b|\bm\.)[^\d]{0,24}(1[5-9]\d{2}|20\d{2})/ig]
  ];
  const out=[];
  for(const[type,re]of patterns)for(const m of String(text||'').matchAll(re))out.push({type,year:Number(m[1]),text:m[0].trim()});
  return out;
};

function matchPeople(model,text){
  const out=[];
  for(const person of [...(model?.people||[]),...(model?.familySupplement?.people||[])]){
    const matchedAliases=aliasesOf(person).filter(alias=>phrasePresent(text,alias));
    if(!matchedAliases.length)continue;
    out.push({id:person.id,name:person.name,living:Boolean(person.living),state:controllingState(person),matchedAliases});
  }
  return out;
}

function matchPlaces(model,text){
  const places=model?.geography?.places||[];
  return places.filter(place=>String(place?.label||'').trim().length>=4&&phrasePresent(text,place.label)).map(place=>({id:place.id,label:place.label}));
}

function matchClaims(model,text,people){
  const explicitIds=new Set([...String(text||'').matchAll(/\bCL-[A-Z0-9-]+\b/gi)].map(m=>m[0].toUpperCase()));
  const peopleIds=new Set(people.map(p=>p.id));
  const candidates=[];
  for(const claim of model?.claims||[]){
    const reasons=[];
    if(explicitIds.has(String(claim.id||'').toUpperCase()))reasons.push('claim ID appears explicitly in record text');
    const linked=(claim.peopleIds||[]).filter(id=>peopleIds.has(id));
    if(linked.length)reasons.push(`record text names ${linked.length} person(s) linked to this claim`);
    if(!reasons.length)continue;
    candidates.push({
      id:claim.id,
      claim:claim.claim,
      currentState:controllingState(claim),
      reasons,
      nextAction:claim.nextAction||null,
      reviewRecommendation:controllingState(claim)==='SUPPORTED'?'CORROBORATION_REVIEW':'REVIEW_FOR_POSSIBLE_PROMOTION',
      proposedState:null
    });
  }
  return candidates;
}

function contradictionSignals(model,text,people){
  const signals=[],events=explicitEventYears(text);
  for(const personMatch of people){
    const person=[...(model?.people||[]),...(model?.familySupplement?.people||[])].find(p=>p.id===personMatch.id);
    if(!person||person.living)continue;
    const known=knownYears(person);
    if(!known.length)continue;
    for(const event of events){
      let expected=null;
      if(event.type==='birth')expected=known[0]??null;
      if(event.type==='death'&&known.length>1)expected=known.at(-1);
      if(expected&&event.year!==expected){
        signals.push({
          personId:person.id,
          personName:person.name,
          eventType:event.type,
          observedYear:event.year,
          displayedCanonicalYear:expected,
          sourceText:event.text,
          severity:'review',
          rule:'DATE DIFFERENCE ONLY — this is a review signal, not a correction or evidence-state change'
        });
      }
    }
  }
  return signals;
}

export function analyzeRecord(model,input={}){
  const rawText=String(input.rawText||'').trim();
  if(!rawText)throw new Error('Record transcription/text is required.');
  if(rawText.length>250000)throw new Error('Record text exceeds the 250,000 character analysis limit.');
  const people=matchPeople(model,rawText);
  const places=matchPlaces(model,rawText);
  const years=yearTokens(rawText);
  const sourceIds=uniq([...rawText.matchAll(/\b[CWV]\d{3}\b/g)].map(m=>m[0]));
  const claims=matchClaims(model,rawText,people);
  const contradictions=contradictionSignals(model,rawText,people);
  return {
    schemaVersion:'16.1-ingestion-1',
    authority:'RESEARCH WORKBENCH PROPOSAL ONLY — NEVER MUTATES CANONICAL GENEALOGY OR EVIDENCE STATE',
    input:{
      title:String(input.title||'Untitled record').trim(),
      recordType:String(input.recordType||'other').trim(),
      repository:String(input.repository||'').trim(),
      citation:String(input.citation||'').trim(),
      fileName:String(input.fileName||'').trim(),
      rawText
    },
    extracted:{people,years,places,sourceIds},
    claimReviewCandidates:claims,
    contradictionSignals:contradictions,
    controls:{
      automaticPromotion:false,
      automaticPersonMerge:false,
      automaticRelationshipCreation:false,
      humanReviewRequired:true,
      rawSpellingPreserved:true,
      livingPersonDateInference:false
    }
  };
}

export function createReviewDecision(packet,{decision,note='',reviewedAt=new Date().toISOString(),previousDigest=null}={}){
  if(!['approve-workbench','reject','needs-more-research'].includes(decision))throw new Error('Invalid review decision.');
  return {
    schemaVersion:'16.1-review-1',
    packetDigest:packet?.digest||null,
    decision,
    note:String(note||'').trim(),
    reviewedAt,
    previousDigest:previousDigest||null,
    canonicalMutation:false,
    evidenceStateMutation:false,
    authority:'LOCAL REVIEW LOG ONLY — approval does not promote evidence or alter the canonical model'
  };
}
