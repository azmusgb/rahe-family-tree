import{allPeople,allPedigreeRelationships,norm,personById}from'./core.js';
import{loadFamilyEdits,saveFamilyEdits,findDuplicatePerson}from'./family-editor.js';

const now=()=>new Date().toISOString();
const slug=s=>String(s||'person').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toUpperCase();
const stateTokens=s=>['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED','DERIVATIVE'].filter(x=>String(s).toUpperCase().includes(x));
const relationKey=(from,to,type)=>type==='spouse'?[from,to].sort().join('|')+`|${type}`:`${from}|${to}|${type}`;

function activeRelations(){return allPedigreeRelationships().filter(r=>r.active!==false&&!/REJECTED/i.test(r.state||''));}
function parentsOf(id,rels){return rels.filter(r=>r.type==='parent-child'&&r.to===id).map(r=>r.from);}
function spousesOf(id,rels){return rels.filter(r=>r.type==='spouse'&&(r.from===id||r.to===id)).map(r=>r.from===id?r.to:r.from);}

export function createRelative({anchorId,kind,person,parentIds=[]}){
  const anchor=personById(anchorId);if(!anchor)throw Error('The anchor person could not be found.');
  const name=String(person?.name||'').trim();if(!name)throw Error('Name is required.');
  const duplicate=findDuplicatePerson(name);if(duplicate)throw Error(`Possible duplicate: ${duplicate.name} already exists.`);
  if(!['child','parent','spouse','sibling'].includes(kind))throw Error('Unsupported relative type.');

  const rels=activeRelations(),people=new Set(allPeople().map(p=>p.id));
  const id=`LOCAL-P-${slug(name)}-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,5).toUpperCase()}`;
  const state=String(person.state||'SUPPORTED / family-established').trim();
  const p={id,name,aliases:String(person.aliases||'').split(',').map(x=>x.trim()).filter(Boolean),branch:String(person.branch||anchor.branch||'Family').trim(),dates:person.living!==false?'Living / birth details withheld':String(person.dates||'Dates not established').trim(),role:String(person.role||`${kind} of ${anchor.name}`).trim(),state,stateTokens:stateTokens(state),living:person.living!==false,references:[],sourceLocation:null,provenance:'LOCAL FAMILY EDIT — NON-CANONICAL',createdAt:now()};

  const specs=[];
  if(kind==='child'){
    const explicit=(parentIds||[]).filter(Boolean);
    const auto=spousesOf(anchorId,rels);
    const second=explicit.length?explicit:auto.length===1?[auto[0]]:[];
    specs.push({from:anchorId,to:id,type:'parent-child',role:'parent → child'});
    for(const pid of second){if(pid!==anchorId)specs.push({from:pid,to:id,type:'parent-child',role:'parent → child'});}
  }else if(kind==='parent')specs.push({from:id,to:anchorId,type:'parent-child',role:'parent → child'});
  else if(kind==='spouse')specs.push({from:anchorId,to:id,type:'spouse',role:'spouse'});
  else{
    const explicit=(parentIds||[]).filter(Boolean),existing=parentsOf(anchorId,rels);
    const chosen=explicit.length?explicit:(existing.length===1?[existing[0]]:[]);
    if(!chosen.length)throw Error(existing.length>1?'Choose which existing parent should connect this sibling.':'Add a parent first so the sibling can be attached without inventing parentage.');
    for(const pid of chosen)specs.push({from:pid,to:id,type:'parent-child',role:'parent → child'});
  }

  for(const s of specs){if(s.from===s.to)throw Error('A relationship must connect two different people.');if(s.from!==id&&!people.has(s.from))throw Error('A selected related person is no longer available.');}
  const existing=new Set(rels.map(r=>relationKey(r.from,r.to,r.type))),pending=new Set();
  for(const s of specs){const k=relationKey(s.from,s.to,s.type);if(existing.has(k)||pending.has(k))throw Error(`That ${s.type} relationship already exists.`);pending.add(k);}

  const st=loadFamilyEdits();st.peopleAdded.unshift(p);
  specs.forEach((s,i)=>st.relationshipsAdded.unshift({id:`LOCAL-REL-${Date.now().toString(36).toUpperCase()}-${i}-${crypto.randomUUID().slice(0,5).toUpperCase()}`,type:s.type,from:s.from,to:s.to,role:s.role,state,active:true,stateTokens:stateTokens(state),claimIds:[],sourceIds:[],source:null,provenance:'LOCAL FAMILY EDIT — NON-CANONICAL',createdAt:now()}));
  saveFamilyEdits(st);
  return{person:p,relationships:specs.length};
}
