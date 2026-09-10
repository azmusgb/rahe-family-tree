const norm=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^\x00-\x7F]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const add=(map,id,branches)=>{if(!id)return;const set=map.get(id)||new Set();for(const b of branches||[])if(b)set.add(b);map.set(id,set);};
const union=(...sets)=>new Set(sets.flatMap(s=>[...(s||[])]));
const sectionId=loc=>loc?.section||loc?.sectionId||null;

export function buildBranchIndex({model,corpus,people,relationships,familyGroups}){
  const branches=[...new Set((people||[]).map(p=>p.branch).filter(Boolean))];
  const canonical=new Map(branches.map(b=>[norm(b),b]));
  const maps={person:new Map(),relationship:new Map(),family:new Map(),claim:new Map(),source:new Map(),task:new Map(),section:new Map()};
  const normalizeBranch=b=>canonical.get(norm(b))||b;
  for(const p of people||[])if(p.branch)add(maps.person,p.id,[normalizeBranch(p.branch)]);
  for(const r of relationships||[])add(maps.relationship,r.id,union(maps.person.get(r.from),maps.person.get(r.to)));
  for(const g of familyGroups||[]){const sets=(g.spouseIds||[]).concat(g.childIds||[]).map(id=>maps.person.get(id));add(maps.family,g.id,union(...sets,g.branch?[normalizeBranch(g.branch)]:[]));}
  for(const t of model?.researchTasks||[])add(maps.task,t.id,t.branch?[normalizeBranch(t.branch)]:[]);
  const claims=model?.claims||[],sources=model?.sources||[];
  for(const c of claims){const sets=[];if(c.branch)sets.push(new Set([normalizeBranch(c.branch)]));for(const id of c.personIds||[])sets.push(maps.person.get(id));for(const id of c.relationshipIds||[])sets.push(maps.relationship.get(id));add(maps.claim,c.id,union(...sets));}
  for(const s of sources){const sets=[];if(s.branch)sets.push(new Set([normalizeBranch(s.branch)]));for(const id of s.personIds||[])sets.push(maps.person.get(id));for(const id of s.relationshipIds||[])sets.push(maps.relationship.get(id));for(const id of s.claimIds||[])sets.push(maps.claim.get(id));add(maps.source,s.id,union(...sets));}
  for(let pass=0;pass<3;pass++){
    for(const c of claims){const sets=[maps.claim.get(c.id)];for(const id of c.sourceIds||[])sets.push(maps.source.get(id));for(const id of String(c.basis||'').match(/\b[CWV]\d{3}\b/g)||[])sets.push(maps.source.get(id));add(maps.claim,c.id,union(...sets));}
    for(const s of sources){const sets=[maps.source.get(s.id)];for(const id of s.claimIds||[])sets.push(maps.claim.get(id));add(maps.source,s.id,union(...sets));}
  }
  const locEntities=[...(relationships||[]),...claims,...sources,...(model?.researchTasks||[])];
  for(const x of locEntities){const id=sectionId(x.sourceLocation)||sectionId(x.location)||sectionId(x.source);if(!id)continue;const sets=[maps.relationship.get(x.id),maps.claim.get(x.id),maps.source.get(x.id),maps.task.get(x.id)].filter(Boolean);add(maps.section,id,union(...sets));}
  for(const s of corpus?.sections||[])if(!maps.section.has(s.id))maps.section.set(s.id,new Set());
  return{branches,maps};
}

export function recordBranches(index,value){
  if(!value||typeof value!=='object')return new Set();
  const explicit=value.branch?new Set([index.branches.find(b=>norm(b)===norm(value.branch))||value.branch]):new Set();
  if(!value.id)return explicit;
  const sets=[explicit];for(const map of Object.values(index.maps))if(map.has(value.id))sets.push(map.get(value.id));
  return union(...sets);
}

export function recordMatchesBranch(index,value,branch){
  if(!branch)return true;
  const wanted=norm(branch),members=recordBranches(index,value);
  return[...members].some(b=>norm(b)===wanted);
}
