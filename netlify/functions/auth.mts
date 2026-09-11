import type { Config, Context } from '@netlify/functions';
import { getStore, getDeployStore } from '@netlify/blobs';
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt=promisify(scryptCb);
const apiHeaders={'x-content-type-options':'nosniff','x-robots-tag':'noindex, noarchive','referrer-policy':'no-referrer'};
const json=(body:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...apiHeaders,...headers}});
const cookieName='rahe_family_session';
const roles=['viewer','contributor','researcher','editor','admin'];
const roleRank=(role:string)=>roles.indexOf(role);
const hashToken=(x:string)=>createHash('sha256').update(x).digest('hex');
const emailKey=(email:string)=>`user/${hashToken(email.trim().toLowerCase())}.json`;
const sessionKey=(token:string)=>`session/${hashToken(token)}.json`;
const attemptKey=(email:string)=>`auth-attempt/${hashToken(email.trim().toLowerCase())}.json`;
const parseCookies=(req:Request)=>Object.fromEntries((req.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return i>0?[decodeURIComponent(x.slice(0,i)),decodeURIComponent(x.slice(i+1))]:['','']}));
const bootstrapKey=()=>Netlify.env.get('FAMILY_EDITOR_WRITE_KEY')||'';
const legacyAuthorized=(req:Request)=>{const expected=bootstrapKey(),supplied=req.headers.get('x-family-editor-key')||'';return !!expected&&supplied.length===expected.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));};
const storeFor=(context:Context)=>context.deploy?.context==='production'?getStore('rahe-family-collaboration',{consistency:'strong'}):getDeployStore('rahe-family-collaboration');
const LOGIN_WINDOW_MS=15*60*1000,LOGIN_LOCK_MS=15*60*1000,MAX_LOGIN_FAILURES=6;
async function passwordHash(password:string,salt:string){return Buffer.from(await scrypt(password,salt,64) as Buffer).toString('hex');}
async function currentUser(req:Request,store:any){const token=parseCookies(req)[cookieName];if(!token)return null;const session:any=await store.get(sessionKey(token),{type:'json'});if(!session||new Date(session.expiresAt).getTime()<=Date.now())return null;const user:any=await store.get(emailKey(session.email),{type:'json'});return user?.active===false?null:user||null;}
const publicUser=(u:any)=>u?{id:u.id,email:u.email,displayName:u.displayName,role:u.role}:null;
async function listUsers(store:any){const result:any=await store.list({prefix:'user/'}),users=[];for(const item of result.blobs||[]){const u:any=await store.get(item.key,{type:'json'});if(u)users.push(u);}return users.sort((a:any,b:any)=>String(a.displayName).localeCompare(String(b.displayName)));}
async function loginGate(store:any,email:string){const record:any=await store.get(attemptKey(email),{type:'json'});if(!record)return{locked:false,retryAfter:0};const lockedUntil=Date.parse(record.lockedUntil||'');if(Number.isFinite(lockedUntil)&&lockedUntil>Date.now())return{locked:true,retryAfter:Math.max(1,Math.ceil((lockedUntil-Date.now())/1000))};return{locked:false,retryAfter:0};}
async function recordLoginFailure(store:any,email:string){const key=attemptKey(email),now=Date.now(),prior:any=await store.get(key,{type:'json'}),windowStarted=Date.parse(prior?.windowStarted||'');const sameWindow=Number.isFinite(windowStarted)&&now-windowStarted<LOGIN_WINDOW_MS,count=(sameWindow?Number(prior?.count||0):0)+1,lockedUntil=count>=MAX_LOGIN_FAILURES?new Date(now+LOGIN_LOCK_MS).toISOString():null;await store.setJSON(key,{count,windowStarted:new Date(sameWindow?windowStarted:now).toISOString(),lastFailedAt:new Date(now).toISOString(),lockedUntil});return{count,lockedUntil};}

export default async(req:Request,context:Context)=>{
  const store=storeFor(context);
  if(req.method==='GET'){
    const me=await currentUser(req,store),users=await listUsers(store);
    return json({ok:true,user:publicUser(me),bootstrapAvailable:users.length===0,storage:'Netlify Blobs'});
  }
  if(req.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  let body:any;try{body=await req.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
  if(body.action==='bootstrap'){
    const users=await listUsers(store);if(users.length!==0)return json({ok:false,error:'Family account bootstrap is already complete.'},409);
    if(!legacyAuthorized(req))return json({ok:false,error:'Bootstrap key required.'},401);
    const email=String(body.email||'').trim().toLowerCase(),name=String(body.displayName||'').trim(),password=String(body.password||'');
    if(!email||!name||password.length<10)return json({ok:false,error:'Name, email, and a password of at least 10 characters are required.'},400);
    const salt=randomBytes(16).toString('hex'),passwordHashHex=await passwordHash(password,salt),id=`USR-${crypto.randomUUID()}`;
    const user={id,email,displayName:name,role:'admin',passwordHash:passwordHashHex,passwordSalt:salt,active:true,version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    await store.setJSON(emailKey(email),user);return json({ok:true,user:publicUser(user)});
  }
  if(body.action==='login'){
    const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||''),gate=await loginGate(store,email);
    if(gate.locked)return json({ok:false,error:'Too many sign-in attempts. Try again later.'},429,{'retry-after':String(gate.retryAfter)});
    const u:any=await store.get(emailKey(email),{type:'json'});
    if(!u||u.active===false){await recordLoginFailure(store,email);return json({ok:false,error:'Invalid email or password.'},401);}
    const actual=await passwordHash(password,u.passwordSalt);if(actual.length!==u.passwordHash.length||!timingSafeEqual(Buffer.from(actual),Buffer.from(u.passwordHash))){await recordLoginFailure(store,email);return json({ok:false,error:'Invalid email or password.'},401);}
    await store.delete(attemptKey(email));
    const token=randomBytes(32).toString('base64url'),expires=new Date(Date.now()+14*864e5);
    await store.setJSON(sessionKey(token),{email:u.email,userId:u.id,expiresAt:expires.toISOString(),createdAt:new Date().toISOString(),version:1});
    return json({ok:true,user:publicUser(u)},200,{'set-cookie':`${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${14*86400}`});
  }
  if(body.action==='logout'){
    const token=parseCookies(req)[cookieName];if(token)await store.delete(sessionKey(token));
    return json({ok:true},200,{'set-cookie':`${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`});
  }
  const me=await currentUser(req,store);if(!me||roleRank(me.role)<roleRank('admin'))return json({ok:false,error:'Admin account required.'},403);
  if(body.action==='create-user'){
    const email=String(body.email||'').trim().toLowerCase(),name=String(body.displayName||'').trim(),password=String(body.password||''),role=roles.includes(body.role)?body.role:'viewer';
    if(!email||!name||password.length<10)return json({ok:false,error:'Name, email, and a password of at least 10 characters are required.'},400);
    if(await store.get(emailKey(email),{type:'json'}))return json({ok:false,error:'That email already has an account.'},409);
    const salt=randomBytes(16).toString('hex'),passwordHashHex=await passwordHash(password,salt),id=`USR-${crypto.randomUUID()}`;
    const user={id,email,displayName:name,role,passwordHash:passwordHashHex,passwordSalt:salt,active:true,version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    await store.setJSON(emailKey(email),user);return json({ok:true,user:publicUser(user)});
  }
  if(body.action==='list-users'){const users=await listUsers(store);return json({ok:true,users:users.map(publicUser)});}
  return json({ok:false,error:'Unknown action.'},400);
};

export const config:Config={path:'/api/auth'};
