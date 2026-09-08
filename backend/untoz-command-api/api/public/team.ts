import type { VercelRequest,VercelResponse } from '@vercel/node';
import { cors,preflight,requireAdmin,isAuthFailure,ROLES,type AppRole,audit,clientIp } from '../../src/core.js';

const ADMIN_ASSIGNABLE:AppRole[]=['editor','writer','viewer'];
function isRole(v:unknown):v is AppRole{return ROLES.includes(v as AppRole)}

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS') return preflight(req,res);
  if(!cors(req,res)) return res.status(403).json({error:'Origin not allowed'});
  if(!['GET','PATCH'].includes(String(req.method))) return res.status(405).json({error:'Method not allowed'});
  const auth=await requireAdmin(req);if(isAuthFailure(auth)) return res.status(auth.status).json({error:auth.error});

  if(req.method==='GET'){
    const {data:rows,error}=await auth.admin.from('user_roles').select('user_id, role, created_at').order('created_at',{ascending:true});
    if(error) return res.status(500).json({error:'Could not load team'});
    const emails=new Map<string,string|null>();
    try{const {data}=await auth.admin.auth.admin.listUsers({page:1,perPage:200});for(const u of data.users||[])emails.set(u.id,u.email??null)}catch{}
    return res.status(200).json({members:(rows||[]).map((r:any)=>({user_id:r.user_id,email:emails.get(r.user_id)??null,role:r.role,created_at:r.created_at}))});
  }

  const body=(req.body||{}) as any;const targetId=String(body.user_id||'');const newRole=body.role;
  if(!/^[0-9a-f-]{36}$/i.test(targetId)||!isRole(newRole)) return res.status(400).json({error:'Invalid user_id or role'});
  const {data:target,error:userError}=await auth.admin.auth.admin.getUserById(targetId);
  if(userError||!target.user) return res.status(404).json({error:'Target user not found'});
  const {data:all,error:rolesError}=await auth.admin.from('user_roles').select('user_id, role');
  if(rolesError) return res.status(500).json({error:'Could not read current roles'});
  const rows=(all||[]) as {user_id:string;role:AppRole}[];const owners=rows.filter(r=>r.role==='owner');const targetIsOwner=owners.some(r=>r.user_id===targetId);

  if(auth.role==='admin'){
    const bootstrap=owners.length===0&&targetId===auth.userId&&newRole==='owner';
    if(!bootstrap){
      if(targetIsOwner) return res.status(403).json({error:'Only an owner can change an owner'});
      if(!ADMIN_ASSIGNABLE.includes(newRole)) return res.status(403).json({error:'Admins can only assign editor, writer or viewer'});
    }
  }
  if(targetIsOwner&&newRole!=='owner'&&owners.length<=1) return res.status(409).json({error:'Cannot change the last remaining owner'});

  const {error:del}=await auth.admin.from('user_roles').delete().eq('user_id',targetId);if(del)return res.status(500).json({error:'Could not update role'});
  const {error:ins}=await auth.admin.from('user_roles').insert({user_id:targetId,role:newRole});if(ins)return res.status(500).json({error:'Could not update role'});
  await audit(auth,{action:'team_role_change',repo:'n/a',branch:'n/a',message:`Role for ${targetId} set to ${newRole}`,status:'success',request_ip:clientIp(req)});
  return res.status(200).json({status:'ok',user_id:targetId,email:target.user.email??null,role:newRole});
}
