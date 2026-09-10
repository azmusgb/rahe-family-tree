import type { Config, Context } from '@netlify/functions';
import { getStore, getDeployStore } from '@netlify/blobs';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const editorKey=()=>Netlify.env.get('FAMILY_EDITOR_WRITE_KEY')||'';
const authorized=(req:Request)=>{const expected=editorKey();if(!expected)return false;const supplied=req.headers.get('x-family-editor-key')||'';return supplied.length===expected.length&&supplied===expected;};
const allowed=new Set(['image/jpeg','image/png','image/webp','application/pdf']);
const storeFor=(context:Context)=>context.deploy?.context==='production'?getStore('rahe-family-media',{consistency:'strong'}):getDeployStore('rahe-family-media');
const safeId=(value:string)=>/^MED-[A-Z0-9-]+$/.test(value);

export default async (req:Request,context:Context)=>{
  const store=storeFor(context),url=new URL(req.url),isEditor=authorized(req);

  if(req.method==='GET'){
    const fileId=url.searchParams.get('file');
    if(fileId){
      if(!safeId(fileId))return json({ok:false,error:'Invalid media ID.'},400);
      const meta:any=await store.get(`meta/${fileId}.json`,{type:'json'});
      if(!meta||meta.deletedAt)return json({ok:false,error:'Media not found.'},404);
      if(meta.visibility!=='public'&&!isEditor)return json({ok:false,error:'Editor key required for private media.'},401);
      const data=await store.get(`file/${fileId}`,{type:'arrayBuffer'});
      if(!data)return json({ok:false,error:'Media file missing.'},404);
      return new Response(data,{headers:{'content-type':meta.mime||'application/octet-stream','content-disposition':`inline; filename="${String(meta.fileName||fileId).replace(/["\r\n]/g,'')}"`,'cache-control':meta.visibility==='public'?'public, max-age=3600':'no-store'}});
    }

    const person=url.searchParams.get('person')||'',listed:any[]=[];
    const result:any=await store.list({prefix:'meta/'});
    for(const item of result.blobs||[]){
      const meta:any=await store.get(item.key,{type:'json'});
      if(!meta||meta.deletedAt)continue;
      if(person&&!Array.isArray(meta.personIds)||person&&!meta.personIds.includes(person))continue;
      if(meta.visibility!=='public'&&!isEditor)continue;
      listed.push(meta);
    }
    listed.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    return json({ok:true,media:listed,editor:isEditor});
  }

  if(req.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  if(!isEditor)return json({ok:false,error:'Editor key required.'},401);

  const type=req.headers.get('content-type')||'';
  if(type.includes('application/json')){
    let body:any;try{body=await req.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
    if(body.action!=='delete')return json({ok:false,error:'Unsupported media action.'},400);
    const id=String(body.id||'');if(!safeId(id))return json({ok:false,error:'Invalid media ID.'},400);
    const meta:any=await store.get(`meta/${id}.json`,{type:'json'});if(!meta)return json({ok:false,error:'Media not found.'},404);
    await store.setJSON(`meta/${id}.json`,{...meta,deletedAt:new Date().toISOString(),deletedBy:String(body.contributor||'Family editor').slice(0,120)});
    return json({ok:true,id,deleted:true});
  }

  if(!type.includes('multipart/form-data'))return json({ok:false,error:'Upload must use multipart/form-data.'},400);
  const form=await req.formData(),file=form.get('file');
  if(!(file instanceof File))return json({ok:false,error:'File is required.'},400);
  if(!allowed.has(file.type))return json({ok:false,error:'Supported files: JPEG, PNG, WebP, PDF.'},400);
  if(file.size>15*1024*1024)return json({ok:false,error:'File exceeds the 15 MB limit.'},413);
  const personId=String(form.get('personId')||'').trim();if(!personId)return json({ok:false,error:'Linked person is required.'},400);
  const living=String(form.get('living')||'true')==='true',requested=String(form.get('visibility')||'private');
  const visibility=living?'private':requested==='public'?'public':'private';
  const id=`MED-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const meta={id,title:String(form.get('title')||file.name).slice(0,180),caption:String(form.get('caption')||'').slice(0,2000),fileName:file.name.slice(0,240),mime:file.type,size:file.size,personIds:[personId],sourceId:String(form.get('sourceId')||'').trim().toUpperCase().slice(0,40),contributor:String(form.get('contributor')||'Family editor').slice(0,120),livingPersonLinked:living,visibility,createdAt:new Date().toISOString(),deletedAt:null,evidenceAuthority:'MEDIA ATTACHMENT — DOES NOT PROMOTE GENEALOGY EVIDENCE',privacyAuthority:living?'PRIVATE — LIVING PERSON MEDIA':'EXPLICIT VISIBILITY CHOICE'};
  await store.set(`file/${id}`,await file.arrayBuffer());
  await store.setJSON(`meta/${id}.json`,meta);
  return json({ok:true,media:meta},201);
};

export const config:Config={path:'/api/media'};
