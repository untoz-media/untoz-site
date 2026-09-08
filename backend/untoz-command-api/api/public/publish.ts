import type { VercelRequest,VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { audit,clientIp,cors,isAuthFailure,preflight,publishTextFiles,repoConfig,requireAdmin } from '../../src/core.js';

const MAX_FILES=120;
const MAX_TOTAL_BYTES=6*1024*1024;
const pathSchema=z.string().min(1).max(400).regex(/^[A-Za-z0-9._\-/]+$/).refine(v=>!v.startsWith('/')&&!v.split('/').includes('..')&&!v.startsWith('.github/'));
const bodySchema=z.object({message:z.string().trim().min(3).max(200).optional(),files:z.array(z.object({path:pathSchema,content:z.string().max(MAX_TOTAL_BYTES)})).min(1).max(MAX_FILES)});

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS') return preflight(req,res);
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!cors(req,res)) return res.status(403).json({error:'Origin not allowed'});
  const auth=await requireAdmin(req);if(isAuthFailure(auth))return res.status(auth.status).json({error:auth.error});
  const parsed=bodySchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Validation failed',issues:parsed.error.issues.map(i=>`${i.path.join('.')||'body'}: ${i.message}`)});
  const duplicates=parsed.data.files.map(f=>f.path).filter((p,i,a)=>a.indexOf(p)!==i);if(duplicates.length)return res.status(400).json({error:'Duplicate file paths',issues:[...new Set(duplicates)]});
  const bytes=parsed.data.files.reduce((n,f)=>n+Buffer.byteLength(f.content,'utf8'),0);if(bytes>MAX_TOTAL_BYTES)return res.status(413).json({error:'Payload too large'});
  const cfg=repoConfig();const message=parsed.data.message?.trim()||`CMS publish: ${parsed.data.files.length} file(s) via Untoz Command`;
  try{
    const result=await publishTextFiles(parsed.data.files,`${message}\n\nPublished by ${auth.email||auth.userId} via Untoz Command.`);
    await audit(auth,{action:'publish',repo:cfg.repo,branch:cfg.branch,message,status:result.status,commit_sha:result.commitSha,files_changed:result.changed,files_skipped:result.skipped,request_ip:clientIp(req)});
    return res.status(200).json({status:result.status,commit_sha:result.commitSha,commit_url:result.commitUrl,repo:cfg.repo,branch:cfg.branch,files_changed:result.changed,files_skipped:result.skipped});
  }catch(error){const detail=error instanceof Error?error.message:'Unknown publish error';await audit(auth,{action:'publish',repo:cfg.repo,branch:cfg.branch,message,status:'failed',error:detail.slice(0,2000),request_ip:clientIp(req)}).catch(()=>{});return res.status(502).json({status:'failed',error:detail});}
}
