import type { Config, Context } from '@netlify/functions';
import { getStore, getDeployStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const roles=['viewer','contributor','researcher','editor','admin'];
const rank=(role:string)=>roles.indexOf(role);
const key=()=>Netlify.env.get('FAMILY_EDITOR_WRITE_KEY')||'';
const legacyAuthorized=(req:Request)=>{const expected=key(),supplied=req.headers.get('x-family-editor-key')||'';return !!expected&&supplied.length===expected.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));};
const hashToken=(x:string)=>createHash('sha256').update(x).digest('hex');
const emailKey=(email:string)=>`user/${hashToken(email.trim().toLowerCase())}.json`;
const sessionKey=(token:string)=>`session/${hashToken(token)}.json`;
const revisionKey=(id:string)=>`revision/${id}.json`;
const cookies=(req:Request)=>Object.fromEntries((req.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return[decodeURIComponent(x.slice(0,i)),decodeURIComponent(x.slice(i+1))]}));
const safePayload=(x:any)=>x&&x.version===1&&Array.isArray(x.peopleAdded)&&typeof x.personPatches==='object'&&Array.isArray(x.peopleHidden)&&Array.isArray(x.relationshipsAdded)&&typeof x.relationshipPatches==='object'&&Array.isArray(x.relationshipsHidden);
const storeFor=(context:Context)=>context.deploy?.context==='production'?getStore('rahe-family-collaboration',{consistency:'strong'}):getDeployStore('rahe-family-collaboration');
async function actor(req:Request,store:any){const token=cookies(req).rahe_family_session;if(token){const session:any=await store.get(sessionKey(token),{type:'json'});if(session&&new Date(session.expiresAt).getTime()>Date.now()){const u:any=await store.get(emailKey(session.email),{type:'json'});if(u&&u.active!==false)return{id:u.id,display_name:u.displayName,role:u.role};}}if(legacyAuthorized(req))return{id:'LEGACY-KEY',display_name:'Legacy editor key',role:'admin'};return null;}
async function revisions(store:any){const result:any=await store.list({prefix:'revision/'}),rows=[];for(const item of result.blobs||[]){const r:any=await store.get(item.key,{type:'json'});if(r)rows.push(r);}return rows.sort((a:any,b:any)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));}

export default async (req:Request,context:Context) => {
  const store=storeFor(context),me=await actor(req,store);
  if(req.method==='GET'){
    const url=new URL(req.url),scope=url.searchParams.get('scope')||'approved',rows=await revisions(store);
    if(scope==='all'&&(!me||rank(me.role)<rank('editor')))return json({ok:false,error:'Editor account required.'},403);
    if(scope==='all')return json({ok:true,revisions:rows,actor:{displayName:me.display_name,role:me.role},storage:'Netlify Blobs'});
    const approved=rows.filter((r:any)=>r.status==='approved').sort((a:any,b:any)=>String(b.reviewed_at||b.created_at||'').localeCompare(String(a.reviewed_at||a.created_at||'')));
    return json({ok:true,revision:approved[0]||null,storage:'Netlify Blobs'});
  }
  if(req.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  let body:any;try{body=await req.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
  if(body.action==='submit'){
    if(!me||rank(me.role)<rank('contributor'))return json({ok:false,error:'Contributor account required.'},403);
    if(!safePayload(body.payload))return json({ok:false,error:'Unsupported family edit payload.'},400);
    const id=`REV-${Date.now()}-${crypto.randomUUID().slice(0,8)}`,createdAt=new Date().toISOString();
    const revision={id,status:'pending',contributor:String(me.display_name||'Family contributor').slice(0,120),payload:body.payload,created_at:createdAt,reviewed_at:null,reviewer:null,review_note:'',version:1,storageAuthority:'APPEND-ONLY FAMILY REVISION — NON-CANONICAL'};
    await store.setJSON(revisionKey(id),revision);return json({ok:true,id,status:'pending',contributor:revision.contributor,version:1});
  }
  if(body.action==='review'){
    if(!me||rank(me.role)<rank('editor'))return json({ok:false,error:'Editor account required.'},403);
    const status=body.status==='approved'?'approved':body.status==='rejected'?'rejected':null;if(!status)return json({ok:false,error:'Review status must be approved or rejected.'},400);
    const id=String(body.id||''),existing:any=await store.get(revisionKey(id),{type:'json'});if(!existing||existing.status!=='pending')return json({ok:false,error:'Pending revision not found.'},404);
    const expectedVersion=Number(body.expectedVersion||existing.version||1);if(Number(existing.version||1)!==expectedVersion)return json({ok:false,error:'Revision changed since it was loaded. Refresh and review again.',currentVersion:existing.version},409);
    const next={...existing,status,reviewed_at:new Date().toISOString(),reviewer:String(me.display_name).slice(0,120),review_note:String(body.note||'').slice(0,1000),version:expectedVersion+1};
    await store.setJSON(revisionKey(id),next);
    const verify:any=await store.get(revisionKey(id),{type:'json'});if(!verify||verify.version!==next.version||verify.status!==status)return json({ok:false,error:'Concurrent revision update detected. Refresh and review again.'},409);
    return json({ok:true,revision:{id:verify.id,status:verify.status,version:verify.version}});
  }
  return json({ok:false,error:'Unknown action.'},400);
};

export const config:Config={path:'/api/family-sync'};
