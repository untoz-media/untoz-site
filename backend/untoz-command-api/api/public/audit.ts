import type { VercelRequest,VercelResponse } from '@vercel/node';
import { AUDIT_ROLES,cors,isAuthFailure,preflight,requireRole } from '../../src/core.js';

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS')return preflight(req,res);
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!cors(req,res))return res.status(403).json({error:'Origin not allowed'});
  const auth=await requireRole(req,AUDIT_ROLES);if(isAuthFailure(auth))return res.status(auth.status).json({error:auth.error});
  const limit=Math.min(Math.max(Number(req.query.limit||50)||50,1),200);const offset=Math.max(Number(req.query.offset||0)||0,0);
  const {data,error}=await auth.admin.from('publish_audit_log').select('id, user_email, action, repo, branch, message, commit_sha, files_changed, files_skipped, status, error, created_at').order('created_at',{ascending:false}).range(offset,offset+limit-1);
  if(error)return res.status(500).json({error:'Could not load audit history'});
  return res.status(200).json({limit,offset,entries:data||[]});
}
