import type { VercelRequest,VercelResponse } from '@vercel/node';
import { cors,preflight,repoConfig } from '../../src/core.js';
export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS') return preflight(req,res);
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!cors(req,res)) return res.status(403).json({error:'Origin not allowed'});
  let repo='unconfigured',branch='unconfigured';try{const c=repoConfig();repo=c.repo;branch=c.branch}catch{}
  return res.status(200).json({status:'ok',service:'untoz-command-api',time:new Date().toISOString(),repo,branch,github_credentials:(process.env.GITHUB_TOKEN||process.env.GITHUB_APP_ID)?'configured':'missing',database:process.env.SUPABASE_URL?'configured':'missing'});
}
