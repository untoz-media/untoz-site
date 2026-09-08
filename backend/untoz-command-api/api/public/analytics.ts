import { createHash } from 'node:crypto';
import type { VercelRequest,VercelResponse } from '@vercel/node';
import { AUDIT_ROLES,cors,preflight,requireRole,isAuthFailure,serviceClient } from '../../src/core.js';

const TYPES=new Set(['home','article','page','category','brand','search','other']);
const DEVICES=new Set(['desktop','mobile','tablet','other']);
const text=(value:unknown,max:number)=>String(value??'').trim().slice(0,max);

function safeHost(value:unknown){
  const raw=text(value,500);
  if(!raw)return'';
  try{return new URL(raw).hostname.slice(0,200)}catch{return raw.replace(/^https?:\/\//i,'').split('/')[0].slice(0,200)}
}

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method==='OPTIONS')return preflight(req,res);
  if(!cors(req,res))return res.status(403).json({error:'Origin not allowed'});

  if(req.method==='POST'){
    const body=(req.body||{}) as Record<string,unknown>;
    const path=text(body.path,500);
    if(!path||!path.startsWith('/')||path.startsWith('/admin'))return res.status(204).end();

    const contentType=TYPES.has(String(body.content_type))?String(body.content_type):'other';
    const device=DEVICES.has(String(body.device))?String(body.device):'other';
    const sessionId=text(body.session_id,128);
    const sessionHash=sessionId?createHash('sha256').update(sessionId).digest('hex'):null;
    const row={
      path,
      title:text(body.title,220)||null,
      content_type:contentType,
      content_slug:text(body.content_slug,160)||null,
      category:text(body.category,120)||null,
      brand:text(body.brand,120)||null,
      referrer_host:safeHost(body.referrer)||null,
      device,
      session_hash:sessionHash,
    };

    try{
      const {error}=await serviceClient().from('analytics_events').insert(row);
      if(error){console.error('Analytics insert failed:',error.message);return res.status(500).json({error:'Could not record analytics event'})}
      return res.status(202).json({status:'accepted'});
    }catch(error){
      console.error('Analytics unavailable:',error);
      return res.status(500).json({error:'Analytics unavailable'});
    }
  }

  if(req.method==='GET'){
    const auth=await requireRole(req,AUDIT_ROLES);
    if(isAuthFailure(auth))return res.status(auth.status).json({error:auth.error});
    const raw=Number(Array.isArray(req.query.days)?req.query.days[0]:req.query.days||30);
    const days=Number.isFinite(raw)?Math.max(1,Math.min(Math.round(raw),90)):30;
    const {data,error}=await auth.admin.rpc('analytics_summary',{_days:days});
    if(error){console.error('Analytics summary failed:',error.message);return res.status(500).json({error:'Could not load analytics summary'})}
    return res.status(200).json(data||{period_days:days,pageviews:0,sessions:0,today:0,daily:[],top_pages:[],categories:[],brands:[],referrers:[],devices:[]});
  }

  return res.status(405).json({error:'Method not allowed'});
}
