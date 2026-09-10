import type { Config } from '@netlify/functions';
import { getDatabase } from '@netlify/database';
import { createHash, timingSafeEqual } from 'node:crypto';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const roles=['viewer','contributor','researcher','editor','admin'];
const rank=(role:string)=>roles.indexOf(role);
const key=()=>Netlify.env.get('FAMILY_EDITOR_WRITE_KEY')||'';
const legacyAuthorized=(req:Request)=>{const expected=key(),supplied=req.headers.get('x-family-editor-key')||'';return !!expected&&supplied.length===expected.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));};
const hashToken=(x:string)=>createHash('sha256').update(x).digest('hex');
const cookies=(req:Request)=>Object.fromEntries((req.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return[decodeURIComponent(x.slice(0,i)),decodeURIComponent(x.slice(i+1))]}));
const safePayload=(x:any)=>x&&x.version===1&&Array.isArray(x.peopleAdded)&&typeof x.personPatches==='object'&&Array.isArray(x.peopleHidden)&&Array.isArray(x.relationshipsAdded)&&typeof x.relationshipPatches==='object'&&Array.isArray(x.relationshipsHidden);
async function ensure(db:any){await db.sql`CREATE TABLE IF NOT EXISTS family_users (id text primary key,email text unique not null,display_name text not null,role text not null,password_hash text not null,password_salt text not null,active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now())`;await db.sql`CREATE TABLE IF NOT EXISTS family_sessions (token_hash text primary key,user_id text not null references family_users(id),expires_at timestamptz not null,created_at timestamptz not null default now())`;await db.sql`ALTER TABLE family_revisions ADD COLUMN IF NOT EXISTS review_note text`;}
async function actor(req:Request,db:any){const token=cookies(req).rahe_family_session;if(token){const rows=await db.sql`SELECT u.id,u.display_name,u.role FROM family_sessions s JOIN family_users u ON u.id=s.user_id WHERE s.token_hash=${hashToken(token)} AND s.expires_at>NOW() AND u.active=true LIMIT 1`;if(rows[0])return rows[0];}if(legacyAuthorized(req))return{id:'LEGACY-KEY',display_name:'Legacy editor key',role:'admin'};return null;}

export default async (req:Request) => {
  const db=getDatabase();await ensure(db);const me=await actor(req,db);
  if(req.method==='GET'){
    const url=new URL(req.url),scope=url.searchParams.get('scope')||'approved';
    if(scope==='all'&&(!me||rank(me.role)<rank('editor')))return json({ok:false,error:'Editor account required.'},403);
    if(scope==='all'){
      const rows=await db.sql`SELECT id,status,contributor,payload,created_at,reviewed_at,reviewer,review_note FROM family_revisions ORDER BY created_at DESC LIMIT 100`;
      return json({ok:true,revisions:rows,actor:{displayName:me.display_name,role:me.role}});
    }
    const rows=await db.sql`SELECT id,status,contributor,payload,created_at,reviewed_at,reviewer,review_note FROM family_revisions WHERE status='approved' ORDER BY reviewed_at DESC NULLS LAST, created_at DESC LIMIT 1`;
    return json({ok:true,revision:rows[0]||null});
  }
  if(req.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  let body:any;try{body=await req.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
  if(body.action==='submit'){
    if(!me||rank(me.role)<rank('contributor'))return json({ok:false,error:'Contributor account required.'},403);
    if(!safePayload(body.payload))return json({ok:false,error:'Unsupported family edit payload.'},400);
    const id=`REV-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
    const contributor=String(me.display_name||body.contributor||'Family contributor').slice(0,120);
    await db.sql`INSERT INTO family_revisions (id,status,contributor,payload) VALUES (${id},'pending',${contributor},${JSON.stringify(body.payload)}::jsonb)`;
    return json({ok:true,id,status:'pending',contributor});
  }
  if(body.action==='review'){
    if(!me||rank(me.role)<rank('editor'))return json({ok:false,error:'Editor account required.'},403);
    const status=body.status==='approved'?'approved':body.status==='rejected'?'rejected':null;
    if(!status)return json({ok:false,error:'Review status must be approved or rejected.'},400);
    const id=String(body.id||''),reviewer=String(me.display_name).slice(0,120),note=String(body.note||'').slice(0,1000);
    const rows=await db.sql`UPDATE family_revisions SET status=${status}, reviewed_at=NOW(), reviewer=${reviewer},review_note=${note} WHERE id=${id} AND status='pending' RETURNING id,status`;
    return rows.length?json({ok:true,revision:rows[0]}):json({ok:false,error:'Pending revision not found.'},404);
  }
  return json({ok:false,error:'Unknown action.'},400);
};

export const config:Config={path:'/api/family-sync'};
