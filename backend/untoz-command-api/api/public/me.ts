import type { VercelRequest,VercelResponse } from '@vercel/node';
import { cors,preflight,requireStaff,isAuthFailure,permissionsFor } from '../../src/core.js';
export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS') return preflight(req,res);
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!cors(req,res)) return res.status(403).json({error:'Origin not allowed'});
  const auth=await requireStaff(req);if(isAuthFailure(auth)) return res.status(auth.status).json({error:auth.error});
  return res.status(200).json({user_id:auth.userId,email:auth.email,role:auth.role,permissions:permissionsFor(auth.role)});
}
