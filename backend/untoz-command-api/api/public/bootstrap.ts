import type { VercelRequest,VercelResponse } from '@vercel/node';
import { cors,preflight,serviceClient } from '../../src/core.js';

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS')return preflight(req,res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!cors(req,res))return res.status(403).json({error:'Origin not allowed'});
  const expected=String(process.env.BOOTSTRAP_SECRET||'');
  const provided=String(req.headers['x-bootstrap-secret']||'');
  if(!expected||provided!==expected)return res.status(403).json({error:'Invalid bootstrap secret'});
  const body=(req.body||{}) as any;const email=String(body.email||'').trim().toLowerCase();const password=String(body.password||'');
  if(!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'Valid email is required'});
  if(password.length<10)return res.status(400).json({error:'Password must be at least 10 characters'});
  const admin=serviceClient();
  const {count,error:countError}=await admin.from('user_roles').select('*',{count:'exact',head:true});
  if(countError)return res.status(500).json({error:'Could not check bootstrap state'});
  if((count||0)>0)return res.status(409).json({error:'Bootstrap is closed because staff roles already exist'});
  let userId='';
  try{const {data:list}=await admin.auth.admin.listUsers({page:1,perPage:200});const existing=(list.users||[]).find(u=>String(u.email||'').toLowerCase()===email);if(existing){userId=existing.id;const {error}=await admin.auth.admin.updateUserById(userId,{password,email_confirm:true});if(error)throw error}else{const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error||!data.user)throw error||new Error('Could not create Owner');userId=data.user.id}}catch(error){return res.status(400).json({error:error instanceof Error?error.message:'Could not create Owner account'})}
  await admin.from('user_roles').delete().eq('user_id',userId);
  const {error:roleError}=await admin.from('user_roles').insert({user_id:userId,role:'owner'});
  if(roleError)return res.status(500).json({error:'Owner account created but role assignment failed'});
  await admin.from('publish_audit_log').insert({user_id:userId,user_email:email,action:'owner_bootstrap',repo:'n/a',branch:'n/a',message:'Created first Untoz Command Owner',status:'success',files_changed:[],files_skipped:[]});
  return res.status(200).json({status:'created',email,role:'owner'});
}
