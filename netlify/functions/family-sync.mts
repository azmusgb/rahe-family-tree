import type { Config } from '@netlify/functions';
import { getDatabase } from '@netlify/database';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const key=()=>Netlify.env.get('FAMILY_EDITOR_WRITE_KEY')||'';
const authorized=(req:Request)=>{const expected=key();if(!expected)return false;const supplied=req.headers.get('x-family-editor-key')||'';return supplied.length===expected.length&&supplied===expected;};
const safePayload=(x:any)=>x&&x.version===1&&Array.isArray(x.peopleAdded)&&typeof x.personPatches==='object'&&Array.isArray(x.peopleHidden)&&Array.isArray(x.relationshipsAdded)&&typeof x.relationshipPatches==='object'&&Array.isArray(x.relationshipsHidden);

export default async (req:Request) => {
  const db=getDatabase();
  if(req.method==='GET'){
    const url=new URL(req.url),scope=url.searchParams.get('scope')||'approved';
    if(scope==='all'&&!authorized(req))return json({ok:false,error:'Editor key required.'},401);
    if(scope==='all'){
      const rows=await db.sql`SELECT id,status,contributor,payload,created_at,reviewed_at,reviewer FROM family_revisions ORDER BY created_at DESC LIMIT 100`;
      return json({ok:true,revisions:rows});
    }
    const rows=await db.sql`SELECT id,status,contributor,payload,created_at,reviewed_at,reviewer FROM family_revisions WHERE status='approved' ORDER BY reviewed_at DESC NULLS LAST, created_at DESC LIMIT 1`;
    return json({ok:true,revision:rows[0]||null});
  }
  if(req.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  if(!authorized(req))return json({ok:false,error:'Editor key required.'},401);
  let body:any;try{body=await req.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
  if(body.action==='submit'){
    if(!safePayload(body.payload))return json({ok:false,error:'Unsupported family edit payload.'},400);
    const id=`REV-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
    const contributor=String(body.contributor||'Family editor').slice(0,120);
    await db.sql`INSERT INTO family_revisions (id,status,contributor,payload) VALUES (${id},'pending',${contributor},${JSON.stringify(body.payload)}::jsonb)`;
    return json({ok:true,id,status:'pending'});
  }
  if(body.action==='review'){
    const status=body.status==='approved'?'approved':body.status==='rejected'?'rejected':null;
    if(!status)return json({ok:false,error:'Review status must be approved or rejected.'},400);
    const id=String(body.id||'');const reviewer=String(body.reviewer||'Family editor').slice(0,120);
    const rows=await db.sql`UPDATE family_revisions SET status=${status}, reviewed_at=NOW(), reviewer=${reviewer} WHERE id=${id} RETURNING id,status`;
    return rows.length?json({ok:true,revision:rows[0]}):json({ok:false,error:'Revision not found.'},404);
  }
  return json({ok:false,error:'Unknown action.'},400);
};

export const config:Config={path:'/api/family-sync'};
