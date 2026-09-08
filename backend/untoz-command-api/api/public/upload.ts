import type { VercelRequest,VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { audit,clientIp,cors,isAuthFailure,preflight,publishBinaryFile,repoConfig,requireStaff } from '../../src/core.js';

const MAX_BYTES=8*1024*1024;
const DEFAULT_SITE_BASE='https://untoz-media.github.io/untoz-site';
const TYPES:Record<string,{ext:string;accepts:string[]}>= {
  'image/jpeg':{ext:'jpg',accepts:['jpg','jpeg']},
  'image/png':{ext:'png',accepts:['png']},
  'image/webp':{ext:'webp',accepts:['webp']},
  'image/gif':{ext:'gif',accepts:['gif']},
};
const schema=z.object({filename:z.string().trim().min(1).max(200).refine(v=>!/[\\/]/.test(v)&&!v.includes('..')),mime_type:z.string().trim().toLowerCase().refine(v=>v in TYPES),content_base64:z.string().min(1)});
const slug=(v:string)=>v.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
function magic(b:Buffer,m:string){if(m==='image/jpeg')return b[0]===0xff&&b[1]===0xd8&&b[2]===0xff;if(m==='image/png')return b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47;if(m==='image/gif')return b.slice(0,3).toString()==='GIF';if(m==='image/webp')return b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP';return false}

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS')return preflight(req,res);
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!cors(req,res))return res.status(403).json({error:'Origin not allowed'});
  const auth=await requireStaff(req);if(isAuthFailure(auth))return res.status(auth.status).json({error:auth.error});
  const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Validation failed',issues:parsed.error.issues.map(i=>i.message)});
  const spec=TYPES[parsed.data.mime_type]!;const dot=parsed.data.filename.lastIndexOf('.');const rawExt=dot>0?parsed.data.filename.slice(dot+1).toLowerCase():'';const rawBase=dot>0?parsed.data.filename.slice(0,dot):parsed.data.filename;
  if(rawExt&&!spec.accepts.includes(rawExt))return res.status(400).json({error:`File extension .${rawExt} does not match ${parsed.data.mime_type}`});
  const name=slug(rawBase);if(!name)return res.status(400).json({error:'Filename has no usable characters'});
  const clean=parsed.data.content_base64.replace(/^data:[^;]+;base64,/,'').replace(/\s+/g,'');let bytes:Buffer;try{bytes=Buffer.from(clean,'base64')}catch{return res.status(400).json({error:'Invalid base64 content'})}
  if(!bytes.length)return res.status(400).json({error:'File is empty'});if(bytes.length>MAX_BYTES)return res.status(413).json({error:'File exceeds the 8 MB limit'});if(!magic(bytes,parsed.data.mime_type))return res.status(400).json({error:`File contents are not a valid ${parsed.data.mime_type} image`});
  const now=new Date();const year=String(now.getUTCFullYear()),month=String(now.getUTCMonth()+1).padStart(2,'0'),suffix=Math.random().toString(16).slice(2,10);const path=`public/media/uploads/${year}/${month}/${name}-${suffix}.${spec.ext}`;
  const cfg=repoConfig(),siteBase=(process.env.PUBLIC_SITE_BASE||DEFAULT_SITE_BASE).replace(/\/$/,'');const publicUrl=`${siteBase}/${path.replace(/^public\//,'')}`;
  try{const result=await publishBinaryFile(path,clean,`Media upload: ${path}\n\nUploaded by ${auth.email||auth.userId} via Untoz Command.`);await audit(auth,{action:'media_upload',repo:cfg.repo,branch:cfg.branch,message:`Media upload: ${path}`,status:result.status,commit_sha:result.commitSha,files_changed:[path],request_ip:clientIp(req)});return res.status(200).json({status:result.status,path,public_url:publicUrl,commit_sha:result.commitSha,commit_url:result.commitUrl,size_bytes:bytes.length,mime_type:parsed.data.mime_type});}catch(error){const detail=error instanceof Error?error.message:'Unknown upload error';await audit(auth,{action:'media_upload',repo:cfg.repo,branch:cfg.branch,message:`Media upload: ${path}`,status:'failed',error:detail.slice(0,2000),request_ip:clientIp(req)}).catch(()=>{});return res.status(502).json({status:'failed',error:detail});}
}
