(()=>{
  if(location.pathname.includes('/admin/'))return;
  const script=document.currentScript;
  const siteBase=script?.src?new URL('./',script.src):new URL('./',location.href);
  const siteConfigUrl=new URL('content/site.json',siteBase).href;
  const clip=(v,n)=>String(v??'').trim().slice(0,n);

  function sessionId(){
    const key='untozAnalyticsSession';
    let id=sessionStorage.getItem(key);
    if(!id){id=crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem(key,id)}
    return id;
  }
  function device(){
    if(navigator.userAgentData?.mobile)return'mobile';
    const touch=navigator.maxTouchPoints>1;
    if(touch&&Math.min(screen.width,screen.height)>=600)return'tablet';
    if(Math.min(screen.width,screen.height)<600)return'mobile';
    return'desktop';
  }
  function context(){
    const body=document.body;
    const article=clip(body.dataset.articleSlug,160);
    const articleCategory=clip(body.dataset.articleCategory,120);
    const page=clip(body.dataset.untozPage,160);
    const category=clip(body.dataset.category,120);
    const brand=clip(body.dataset.subsidiary,120);
    const pathname=location.pathname;
    if(article)return{content_type:'article',content_slug:article,category:articleCategory,brand:articleCategory};
    if(page)return{content_type:'page',content_slug:page};
    if(brand)return{content_type:'brand',brand};
    if(category)return{content_type:'category',category};
    if(/\/search\/?$/i.test(pathname))return{content_type:'search'};
    if(pathname===siteBase.pathname||pathname===siteBase.pathname.replace(/\/$/,'')+'/')return{content_type:'home'};
    return{content_type:'other'};
  }
  function recentlySent(path){
    const key='untozAnalyticsLast';const now=Date.now();
    try{const last=JSON.parse(sessionStorage.getItem(key)||'null');if(last?.path===path&&now-last.at<10000)return true}catch{}
    sessionStorage.setItem(key,JSON.stringify({path,at:now}));return false;
  }
  async function run(){
    if(navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
    let site={};
    try{const r=await fetch(siteConfigUrl,{cache:'no-store'});if(!r.ok)return;site=await r.json()}catch{return}
    const config=site?.analytics||{};
    if(config.enabled!==true)return;
    const endpoint=clip(config.endpoint,500).replace(/\/$/,'');
    if(!/^https:\/\//i.test(endpoint))return;
    const path=location.pathname+location.search;
    if(recentlySent(path))return;
    const payload={
      path:clip(path,500),
      title:clip(document.title.replace(/\s+[—|-]\s+Untoz.*$/i,''),220),
      referrer:clip(document.referrer,500),
      device:device(),
      session_id:sessionId(),
      ...context(),
    };
    try{await fetch(endpoint+'/api/public/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,credentials:'omit'})}catch{}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
