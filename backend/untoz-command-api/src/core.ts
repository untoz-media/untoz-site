import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { importPKCS8, SignJWT } from 'jose';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const ROLES = ['owner','admin','editor','writer','viewer'] as const;
export type AppRole = (typeof ROLES)[number];
const ROLE_PRIORITY: AppRole[] = ['owner','admin','editor','writer','viewer'];
export const STAFF_ROLES: AppRole[] = ['owner','admin','editor','writer'];
export const ADMIN_ROLES: AppRole[] = ['owner','admin'];
export const AUDIT_ROLES: AppRole[] = ['owner','admin','editor'];

export type AuthContext = { userId:string; email:string|null; role:AppRole; admin:SupabaseClient };
export type AuthFailure = { status:number; error:string };

export function permissionsFor(role: AppRole) {
  return {
    can_publish: ADMIN_ROLES.includes(role),
    can_upload: STAFF_ROLES.includes(role),
    can_view_audit: AUDIT_ROLES.includes(role),
    can_manage_team: ADMIN_ROLES.includes(role),
  };
}

export function cors(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || '');
  const defaults = ['https://untoz-media.github.io','https://untoz.site'];
  const extra = String(process.env.ALLOWED_ORIGINS || '').split(',').map(x=>x.trim()).filter(Boolean);
  const allowed = [...defaults, ...extra];
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');
  return !origin || allowed.includes(origin);
}

export function preflight(req:VercelRequest,res:VercelResponse){
  if(!cors(req,res)) return res.status(403).json({error:'Origin not allowed'});
  return res.status(204).end();
}

function adminClient(){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error('Missing Supabase service credentials');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

function effectiveRole(rows:any[]):AppRole|null{
  const values=rows.map(r=>String(r.role));
  for(const role of ROLE_PRIORITY) if(values.includes(role)) return role;
  return null;
}

export async function requireRole(req:VercelRequest, allowed:AppRole[]):Promise<AuthContext|AuthFailure>{
  const header=String(req.headers.authorization||'');
  const token=header.toLowerCase().startsWith('bearer ')?header.slice(7).trim():'';
  if(!token) return {status:401,error:'Missing bearer token'};
  let admin:SupabaseClient;
  try{admin=adminClient()}catch{return {status:500,error:'Server misconfigured'}}
  const {data,error}=await admin.auth.getUser(token);
  if(error||!data.user) return {status:401,error:'Invalid or expired session'};
  const {data:roles,error:roleError}=await admin.from('user_roles').select('role').eq('user_id',data.user.id);
  if(roleError) return {status:500,error:'Could not verify permissions'};
  const role=effectiveRole(roles||[]);
  if(!role) return {status:403,error:'No role assigned'};
  if(!allowed.includes(role)) return {status:403,error:`Requires one of: ${allowed.join(', ')}`};
  return {userId:data.user.id,email:data.user.email??null,role,admin};
}

export const requireAdmin=(req:VercelRequest)=>requireRole(req,ADMIN_ROLES);
export const requireStaff=(req:VercelRequest)=>requireRole(req,STAFF_ROLES);
export const isAuthFailure=(v:AuthContext|AuthFailure):v is AuthFailure=>'error' in v;
export const clientIp=(req:VercelRequest)=>String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim()||null;

export function repoConfig(){
  const repo=process.env.GITHUB_REPO||'untoz-media/untoz-site';
  const branch=process.env.GITHUB_BRANCH||'main';
  const [owner,name]=repo.split('/');
  if(!owner||!name) throw new Error("GITHUB_REPO must look like 'owner/repo'");
  return {owner,name,repo,branch};
}

async function appToken(){
  const appId=process.env.GITHUB_APP_ID;
  const keyPem=process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g,'\n');
  const installation=process.env.GITHUB_APP_INSTALLATION_ID;
  if(appId&&keyPem&&installation){
    const key=await importPKCS8(keyPem,'RS256');
    const now=Math.floor(Date.now()/1000);
    const jwt=await new SignJWT({}).setProtectedHeader({alg:'RS256'}).setIssuedAt(now-60).setExpirationTime(now+540).setIssuer(appId).sign(key);
    const r=await fetch(`https://api.github.com/app/installations/${installation}/access_tokens`,{method:'POST',headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${jwt}`,'User-Agent':'untoz-command-api'}});
    if(!r.ok) throw new Error(`GitHub App token exchange failed: ${r.status}`);
    const d:any=await r.json();return String(d.token);
  }
  if(process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  throw new Error('GitHub credentials are not configured');
}

async function gh<T>(path:string, init:RequestInit={}):Promise<T>{
  const token=await appToken();
  const r=await fetch(`https://api.github.com${path}`,{...init,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'User-Agent':'untoz-command-api','Content-Type':'application/json',...(init.headers||{})}});
  if(!r.ok) throw new Error(`GitHub ${init.method||'GET'} ${path} failed [${r.status}]: ${await r.text()}`);
  return await r.json() as T;
}

export type TextFile={path:string;content:string};
export type PublishResult={status:'committed'|'no_changes';commitSha:string;commitUrl:string;changed:string[];skipped:string[]};

async function headInfo(){
  const {owner,name,branch}=repoConfig();const base=`/repos/${owner}/${name}`;
  const ref=await gh<any>(`${base}/git/ref/heads/${branch}`);
  const headSha=ref.object.sha as string;
  const commit=await gh<any>(`${base}/git/commits/${headSha}`);
  return {base,headSha,treeSha:commit.tree.sha as string};
}

async function blobSha(content:string){
  const body=Buffer.from(content,'utf8');
  const header=Buffer.from(`blob ${body.length}\0`,'utf8');
  const crypto=await import('node:crypto');
  return crypto.createHash('sha1').update(Buffer.concat([header,body])).digest('hex');
}

export async function publishTextFiles(files:TextFile[],message:string):Promise<PublishResult>{
  const {owner,name,branch}=repoConfig();const {base,headSha,treeSha}=await headInfo();
  const tree=await gh<any>(`${base}/git/trees/${treeSha}?recursive=1`);
  const existing=new Map((tree.tree||[]).filter((x:any)=>x.type==='blob').map((x:any)=>[x.path,x.sha]));
  const entries:any[]=[];const changed:string[]=[];const skipped:string[]=[];
  for(const file of files){const sha=await blobSha(file.content);if(existing.get(file.path)===sha){skipped.push(file.path);continue}changed.push(file.path);entries.push({path:file.path,mode:'100644',type:'blob',content:file.content})}
  if(!changed.length) return {status:'no_changes',commitSha:headSha,commitUrl:`https://github.com/${owner}/${name}/commit/${headSha}`,changed,skipped};
  const newTree=await gh<any>(`${base}/git/trees`,{method:'POST',body:JSON.stringify({base_tree:treeSha,tree:entries})});
  const commit=await gh<any>(`${base}/git/commits`,{method:'POST',body:JSON.stringify({message,tree:newTree.sha,parents:[headSha]})});
  await gh(`${base}/git/refs/heads/${branch}`,{method:'PATCH',body:JSON.stringify({sha:commit.sha,force:false})});
  return {status:'committed',commitSha:commit.sha,commitUrl:commit.html_url||`https://github.com/${owner}/${name}/commit/${commit.sha}`,changed,skipped};
}

export async function publishBinaryFile(path:string,base64:string,message:string):Promise<PublishResult>{
  const {owner,name,branch}=repoConfig();const {base,headSha,treeSha}=await headInfo();
  const blob=await gh<any>(`${base}/git/blobs`,{method:'POST',body:JSON.stringify({content:base64,encoding:'base64'})});
  const newTree=await gh<any>(`${base}/git/trees`,{method:'POST',body:JSON.stringify({base_tree:treeSha,tree:[{path,mode:'100644',type:'blob',sha:blob.sha}]})});
  const commit=await gh<any>(`${base}/git/commits`,{method:'POST',body:JSON.stringify({message,tree:newTree.sha,parents:[headSha]})});
  await gh(`${base}/git/refs/heads/${branch}`,{method:'PATCH',body:JSON.stringify({sha:commit.sha,force:false})});
  return {status:'committed',commitSha:commit.sha,commitUrl:commit.html_url||`https://github.com/${owner}/${name}/commit/${commit.sha}`,changed:[path],skipped:[]};
}

export async function audit(auth:AuthContext,row:Record<string,unknown>){
  await auth.admin.from('publish_audit_log').insert({user_id:auth.userId,user_email:auth.email,request_ip:row.request_ip??null,files_changed:[],files_skipped:[],...row});
}
