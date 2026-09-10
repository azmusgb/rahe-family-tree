import type { Config, Context } from '@netlify/functions';
import { getStore, getDeployStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const allowed=new Set(['image/jpeg','image/png','image/webp','application/pdf']);
const roles=['viewer','contributor','researcher','editor','admin'];
const roleRank=(role:string)=>roles.indexOf(role);
const cookieName='rahe_family_session';
const hashToken=(x:string)=>createHash('sha256').update(x).digest('hex');
const sessionKey=(token:string)=>`session/${hashToken(token)}.json`;
const emailKey=(email:string)=>`user/${hashToken(email.trim().toLowerCase())}.json`;
const parseCookies=(req:Request)=>Object.fromEntries((req.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return[decodeURIComponent(x.slice(0,i)),decodeURIComponent(x.slice(i+1))]}));
const bootstrapKey=()=>Netlify.env.get('FAMILY_EDITOR_WRITE_KEY')||'';
const legacyAuthorized=(req:Request)=>{const expected=bootstrapKey(),supplied=req.headers.get('x-family-editor-key')||'';return !!expected&&supplied.length===expected.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));};
const mediaStoreFor=(context:Context)=>context.deploy?.context==='production'?getStore('rahe-family-media',{consistency:'strong'}):getDeployStore('rahe-family-media');
const collaborationStoreFor=(context:Context)=>context.deploy?.context==='production'?getStore('rahe-family-collaboration',{consistency:'strong'}):getDeployStore('rahe-family-collaboration');
const safeId=(value:string)=>/^MED-[A-Z0-9-]+$/.test(value);
const cleanIds=(values:unknown[])=>[...new Set(values.map(v=>String(v||'').trim()).filter(v=>/^[-A-Z0-9]+$/i.test(v)).slice(0,25))];

async function currentUser(req:Request,store:any){
  const token=parseCookies(req)[cookieName];
  if(!token)return null;
  const session:any=await store.get(sessionKey(token),{type:'json'});
  if(!session||new Date(session.expiresAt).getTime()<=Date.now())return null;
  const user:any=await store.get(emailKey(session.email),{type:'json'});
  return user?.active===false?null:user||null;
}

type PrivacyState={living:boolean;unresolved:boolean};
async function privacyIndex(req:Request){
  try{
    const res=await fetch(`${new URL(req.url).origin}/research-model.json`,{headers:{'cache-control':'no-cache'}});
    if(!res.ok)return new Map<string,PrivacyState>();
    const m:any=await res.json(),all=[...(m.people||[]),...(m.familySupplement?.people||[])];
    return new Map<string,PrivacyState>(all.map((p:any)=>{
      const state=String(p.state||'').toUpperCase();
      return[String(p.id),{living:Boolean(p.living),unresolved:state.includes('UNRESOLVED')}];
    }));
  }catch{return new Map<string,PrivacyState>();}
}
const privateRequired=(ids:string[],index:Map<string,PrivacyState>)=>ids.some(id=>{const p=index.get(id);return !p||p.living||p.unresolved;});
const forcePrivate=(meta:any,index:Map<string,PrivacyState>)=>{
  const ids=cleanIds(Array.isArray(meta?.personIds)?meta.personIds:[]);
  const mustPrivate=privateRequired(ids,index);
  return mustPrivate?{...meta,personIds:ids,visibility:'private',livingPersonLinked:true,privacyAuthority:'PRIVATE — LIVING OR UNRESOLVED PERSON LINK'}:{...meta,personIds:ids};
};
const privacyChanged=(a:any,b:any)=>a.visibility!==b.visibility||Boolean(a.livingPersonLinked)!==Boolean(b.livingPersonLinked)||String(a.privacyAuthority||'')!==String(b.privacyAuthority||'');

export default async (req:Request,context:Context)=>{
  const store=mediaStoreFor(context),collaboration=collaborationStoreFor(context),url=new URL(req.url),user=await currentUser(req,collaboration),legacy=legacyAuthorized(req);
  const authenticated=!!user||legacy,canUpload=legacy||!!user&&roleRank(user.role)>=roleRank('contributor'),canEdit=legacy||!!user&&roleRank(user.role)>=roleRank('editor');

  if(req.method==='GET'){
    const privacy=await privacyIndex(req);
    const fileId=url.searchParams.get('file');
    if(fileId){
      if(!safeId(fileId))return json({ok:false,error:'Invalid media ID.'},400);
      const stored:any=await store.get(`meta/${fileId}.json`,{type:'json'});
      if(!stored||stored.deletedAt)return json({ok:false,error:'Media not found.'},404);
      const meta=forcePrivate(stored,privacy);
      if(privacyChanged(stored,meta))await store.setJSON(`meta/${fileId}.json`,{...meta,updatedAt:new Date().toISOString(),updatedBy:'privacy-enforcement'});
      if(meta.visibility!=='public'&&!authenticated)return json({ok:false,error:'Family account sign-in required for private media.'},401);
      const data=await store.get(`file/${fileId}`,{type:'arrayBuffer'});
      if(!data)return json({ok:false,error:'Media file missing.'},404);
      return new Response(data,{headers:{'content-type':meta.mime||'application/octet-stream','content-disposition':`inline; filename="${String(meta.fileName||fileId).replace(/["\r\n]/g,'')}"`,'cache-control':'no-store','x-content-type-options':'nosniff'}});
    }

    const person=url.searchParams.get('person')||'',listed:any[]=[];
    const result:any=await store.list({prefix:'meta/'});
    for(const item of result.blobs||[]){
      const stored:any=await store.get(item.key,{type:'json'});
      if(!stored||stored.deletedAt)continue;
      const meta=forcePrivate(stored,privacy);
      if(privacyChanged(stored,meta))await store.setJSON(item.key,{...meta,updatedAt:new Date().toISOString(),updatedBy:'privacy-enforcement'});
      if(person&&(!Array.isArray(meta.personIds)||!meta.personIds.includes(person)))continue;
      if(meta.visibility!=='public'&&!authenticated)continue;
      listed.push(meta);
    }
    listed.sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured))||String(b.eventDate||b.createdAt||'').localeCompare(String(a.eventDate||a.createdAt||'')));
    return json({ok:true,media:listed,authenticated,canUpload,canDelete:canEdit,canEdit,user:user?{displayName:user.displayName,role:user.role}:null});
  }

  if(req.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  const type=req.headers.get('content-type')||'';
  if(type.includes('application/json')){
    let body:any;try{body=await req.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
    const id=String(body.id||'');if(!safeId(id))return json({ok:false,error:'Invalid media ID.'},400);
    const meta:any=await store.get(`meta/${id}.json`,{type:'json'});if(!meta)return json({ok:false,error:'Media not found.'},404);
    if(body.action==='delete'){
      if(!canEdit)return json({ok:false,error:'Editor or administrator account required to remove media.'},403);
      await store.setJSON(`meta/${id}.json`,{...meta,deletedAt:new Date().toISOString(),deletedBy:user?.displayName||'Legacy family editor'});
      return json({ok:true,id,deleted:true});
    }
    if(body.action==='update'){
      if(!canEdit)return json({ok:false,error:'Editor or administrator account required to update media metadata.'},403);
      const ids=cleanIds(Array.isArray(body.personIds)?body.personIds:meta.personIds||[]);if(!ids.length)return json({ok:false,error:'At least one linked person is required.'},400);
      const privacy=await privacyIndex(req),mustPrivate=privateRequired(ids,privacy),requested=body.visibility==='public'?'public':'private';
      const updated={...meta,title:String(body.title??meta.title).slice(0,180),caption:String(body.caption??meta.caption??'').slice(0,2000),eventDate:String(body.eventDate??meta.eventDate??'').slice(0,32),location:String(body.location??meta.location??'').slice(0,240),personIds:ids,sourceId:String(body.sourceId??meta.sourceId??'').trim().toUpperCase().slice(0,40),visibility:mustPrivate?'private':requested,featured:Boolean(body.featured)&&String(meta.mime||'').startsWith('image/'),livingPersonLinked:mustPrivate,privacyAuthority:mustPrivate?'PRIVATE — LIVING OR UNRESOLVED PERSON LINK':'EXPLICIT VISIBILITY CHOICE',updatedAt:new Date().toISOString(),updatedBy:user?.displayName||'Legacy family editor'};
      if(updated.featured){const result:any=await store.list({prefix:'meta/'});for(const item of result.blobs||[]){const other:any=await store.get(item.key,{type:'json'});if(!other||other.id===id||other.deletedAt||!other.featured)continue;if((other.personIds||[]).some((x:string)=>ids.includes(x)))await store.setJSON(item.key,{...other,featured:false,updatedAt:new Date().toISOString()});}}
      await store.setJSON(`meta/${id}.json`,updated);return json({ok:true,media:updated});
    }
    return json({ok:false,error:'Unsupported media action.'},400);
  }

  if(!canUpload)return json({ok:false,error:'Contributor account or higher required to add media.'},403);
  if(!type.includes('multipart/form-data'))return json({ok:false,error:'Upload must use multipart/form-data.'},400);
  const form=await req.formData(),file=form.get('file');
  if(!(file instanceof File))return json({ok:false,error:'File is required.'},400);
  if(!allowed.has(file.type))return json({ok:false,error:'Supported files: JPEG, PNG, WebP, PDF.'},400);
  if(file.size>15*1024*1024)return json({ok:false,error:'File exceeds the 15 MB limit.'},413);
  const ids=cleanIds([form.get('personId'),...form.getAll('personIds')]);if(!ids.length)return json({ok:false,error:'Linked person is required.'},400);
  const privacy=await privacyIndex(req),mustPrivate=privateRequired(ids,privacy),requested=String(form.get('visibility')||'private');
  const visibility=mustPrivate?'private':requested==='public'?'public':'private';
  const id=`MED-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const meta={id,title:String(form.get('title')||file.name).slice(0,180),caption:String(form.get('caption')||'').slice(0,2000),eventDate:String(form.get('eventDate')||'').slice(0,32),location:String(form.get('location')||'').slice(0,240),fileName:file.name.slice(0,240),mime:file.type,size:file.size,personIds:ids,sourceId:String(form.get('sourceId')||'').trim().toUpperCase().slice(0,40),contributor:user?.displayName||'Legacy family editor',contributorUserId:user?.id||null,livingPersonLinked:mustPrivate,visibility,featured:Boolean(form.get('featured'))&&file.type.startsWith('image/'),createdAt:new Date().toISOString(),deletedAt:null,evidenceAuthority:'MEDIA ATTACHMENT — DOES NOT PROMOTE GENEALOGY EVIDENCE',privacyAuthority:mustPrivate?'PRIVATE — LIVING OR UNRESOLVED PERSON LINK':'EXPLICIT VISIBILITY CHOICE'};
  await store.set(`file/${id}`,await file.arrayBuffer());
  await store.setJSON(`meta/${id}.json`,meta);
  return json({ok:true,media:meta},201);
};

export const config:Config={path:'/api/media'};
