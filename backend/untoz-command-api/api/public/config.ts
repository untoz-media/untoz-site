import type { VercelRequest,VercelResponse } from '@vercel/node';
import { cors,preflight } from '../../src/core.js';
export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS') return preflight(req,res);
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!cors(req,res)) return res.status(403).json({error:'Origin not allowed'});
  const url=process.env.SUPABASE_URL||'';const anon=process.env.SUPABASE_ANON_KEY||'';
  return res.status(200).json({configured:!!(url&&anon),supabase_url:url,supabase_anon_key:anon});
}
