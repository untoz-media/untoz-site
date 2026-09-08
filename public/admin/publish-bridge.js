(()=>{
  const API_BASE='https://untoz-command-api.lovable.app';
  const SITE_BASE='https://untoz-media.github.io/untoz-site';
  const STORAGE_KEY='untozCommandSession';
  const CMS_KEY='untozCommandCMS';
  const LAST_PUBLISH_KEY='untozCommandLastPublish';
  const LAST_PUBLISHED_CMS='untozCommandLastPublishedCMS';
  const LIVE_POSTS='https://raw.githubusercontent.com/untoz-media/untoz-site/main/content/posts.json';
  let configPromise=null;

  function session(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}}
  function currentCMS(){try{return JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{return {}}}
  function saveCMS(v){localStorage.setItem(CMS_KEY,JSON.stringify(v||{}))}
  function saveSession(v){if(v)localStorage.setItem(STORAGE_KEY,JSON.stringify(v));else localStorage.removeItem(STORAGE_KEY)}
  function emit(name,detail={}){window.dispatchEvent(new CustomEvent(name,{detail}))}
  async function config(){if(!configPromise)configPromise=fetch(API_BASE+'/api/public/config',{cache:'no-store'}).then(r=>r.json());return configPromise}
  function toast(msg){let el=document.getElementById('command-toast');if(!el){el=document.createElement('div');el.id='command-toast';el.className='command-toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3500)}

  function authButton(){let b=document.getElementById('command-auth');if(!b){b=document.createElement('button');b.id='command-auth';b.className='command-auth';document.body.appendChild(b);b.onclick=()=>session()?logout():login()}b.textContent=session()?'Sign out':'Admin sign in';return b}
  async function login(){const email=prompt('Untoz Command admin email:');if(!email)return;const password=prompt('Password:');if(!password)return;try{const c=await config();if(!c.configured)throw Error('Authentication is not configured yet.');const r=await fetch(c.supabase_url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':c.supabase_anon_key},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw Error(d.error_description||d.msg||'Sign in failed');const sessionValue={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Date.now()+((d.expires_in||3600)*1000),email:d.user?.email||email};saveSession(sessionValue);authButton();syncPublishButton();emit('untoz:auth-change',{signedIn:true,email:sessionValue.email});toast('Signed in to Untoz Command.')}catch(e){toast(e.message||'Sign in failed.')}}
  function logout(){const email=session()?.email||'';saveSession(null);authButton();syncPublishButton();emit('untoz:auth-change',{signedIn:false,email});toast('Signed out.')}

  function pageSlug(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')}
  function htmlEscape(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function xmlEscape(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[m]))}
  function isoDay(v){const d=new Date(v||Date.now());return Number.isNaN(d.getTime())?new Date().toISOString().slice(0,10):d.toISOString().slice(0,10)}
  function rfcDate(v){const d=new Date(v||Date.now());return Number.isNaN(d.getTime())?new Date().toUTCString():d.toUTCString()}
  function pageRouteHtml(slug){return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <meta name="robots" content="index,follow">\n  <title>Untoz</title>\n  <link rel="stylesheet" href="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.css">\n  <link rel="stylesheet" href="../page-renderer.css">\n</head>\n<body data-untoz-page="${htmlEscape(slug)}">\n  <div id="page-root"></div>\n  <script src="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.js"></script>\n  <script src="../page-renderer.js"></script>\n</body>\n</html>\n`}
  function articleRouteHtml(post){
    const slug=pageSlug(post.slug||post.title||'story');
    const category=pageSlug(post.category||'news')||'news';
    const published=post.status==='Published';
    const title=htmlEscape(post.seo_title||post.title||'Untoz');
    const desc=htmlEscape(post.seo||post.excerpt||'Untoz story.');
    const image=htmlEscape(post.image||'');
    return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <meta name="robots" content="${published?'index,follow':'noindex,nofollow'}">\n  <meta name="description" content="${desc}">\n  <meta property="og:type" content="article">\n  <meta property="og:site_name" content="Untoz">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${desc}">\n  ${image?`<meta property="og:image" content="${image}">\n  <meta name="twitter:image" content="${image}">\n  `:''}<meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${title}">\n  <meta name="twitter:description" content="${desc}">\n  <title>${title} — Untoz</title>\n  <link rel="stylesheet" href="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.css">\n  <link rel="stylesheet" href="../../article-renderer.css">\n</head>\n<body data-article-category="${htmlEscape(category)}" data-article-slug="${htmlEscape(slug)}">\n  <div id="article-root"></div>\n  <script src="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.js"></script>\n  <script src="../../article-renderer.js"></script>\n</body>\n</html>\n`;
  }
  function subsidiaryRouteHtml(brand){const id=pageSlug(brand.id||brand.short||brand.name);const title=htmlEscape(brand.name||'Untoz');const desc=htmlEscape(brand.description||'Part of the Untoz network.');const accent=htmlEscape(brand.accent||'#1f6ffa');return `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="theme-color" content="${accent}"><meta name="description" content="${desc}"><title>${title} — Untoz</title><link rel="stylesheet" href="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.css"><link rel="stylesheet" href="../subsidiary-renderer.css"></head><body data-subsidiary="${htmlEscape(id)}"><div id="subsidiary-root"></div><script src="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.js"></script><script src="../subsidiary-renderer.js"></script></body></html>\n`}
  function sitemapXml(posts,pages,brands){const urls=[{path:'',priority:'1.0',last:new Date()},{path:'search/',priority:'0.7',last:new Date()},{path:'entertainment/',priority:'0.7',last:new Date()},{path:'music/',priority:'0.7',last:new Date()},{path:'movies-series/',priority:'0.7',last:new Date()}];pages.filter(p=>p.status==='Published'&&pageSlug(p.slug)).forEach(p=>urls.push({path:`${pageSlug(p.slug)}/`,priority:'0.6',last:p.updated_at||new Date()}));brands.filter(b=>b.enabled&&b.id).forEach(b=>urls.push({path:`${b.id}/`,priority:'0.9',last:new Date()}));posts.filter(p=>p.status==='Published'&&pageSlug(p.slug)).forEach(p=>urls.push({path:`${pageSlug(p.category||'news')||'news'}/${pageSlug(p.slug)}/`,priority:'0.8',last:p.published_at||p.date||p.updated_at||new Date()}));const seen=new Set();const body=urls.filter(u=>{const full=SITE_BASE+'/'+u.path;if(seen.has(full))return false;seen.add(full);return true}).map(u=>`  <url><loc>${xmlEscape(SITE_BASE+'/'+u.path)}</loc><lastmod>${isoDay(u.last)}</lastmod><priority>${u.priority}</priority></url>`).join('\n');return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`}
  function rssXml(posts){const published=posts.filter(p=>p.status==='Published'&&pageSlug(p.slug)).sort((a,b)=>new Date(b.published_at||b.date||0)-new Date(a.published_at||a.date||0)).slice(0,20);const items=published.map(p=>{const url=`${SITE_BASE}/${pageSlug(p.category||'news')||'news'}/${pageSlug(p.slug)}/`;return `    <item>\n      <title>${xmlEscape(p.title||'Untitled story')}</title>\n      <link>${xmlEscape(url)}</link>\n      <guid>${xmlEscape(url)}</guid>\n      <pubDate>${xmlEscape(rfcDate(p.published_at||p.date))}</pubDate>\n      <description>${xmlEscape(p.excerpt||p.seo||'')}</description>\n    </item>`}).join('\n');return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Untoz</title>\n    <link>${SITE_BASE}/</link>\n    <description>Latest stories from the Untoz universe.</description>\n    <language>en</language>\n    <lastBuildDate>${rfcDate()}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`}
  function robotsTxt(){return `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_BASE}/sitemap.xml\n`}

  async function reconcileScheduledPosts(){
    try{
      const r=await fetch(LIVE_POSTS+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)return 0;
      const live=await r.json();if(!Array.isArray(live))return 0;
      const state=currentCMS();const bySlug=new Map(live.filter(x=>x&&x.slug).map(x=>[String(x.slug),x]));let changed=0;
      (state.posts||[]).forEach(post=>{const remote=bySlug.get(String(post.slug||''));if(post.status==='Scheduled'&&remote?.status==='Published'){post.status='Published';post.published_at=remote.published_at||post.scheduled_at||'';post.updated_at=remote.updated_at||post.updated_at||'';changed++}});
      if(changed){saveCMS(state);emit('untoz:scheduler-reconciled',{count:changed});toast(`${changed} scheduled post${changed===1?'':'s'} already published by the scheduler — local CMS updated.`)}
      return changed;
    }catch{return 0}
  }

  function cmsFiles(){
    const s=currentCMS();
    const posts=(s.posts||[]).map(p=>({
      title:p.title||'',slug:p.slug||'',status:p.status||'Draft',category:p.category||'',genre:p.genre||'',author:p.author||'Untoz',date:p.date||'',image:p.image||'',excerpt:p.excerpt||'',content:p.content||'',seo:p.seo||'',
      seo_title:p.seo_title||'',social_title:p.social_title||'',social_description:p.social_description||'',scheduled_at:p.scheduled_at||'',published_at:p.published_at||'',featured:!!p.featured,breaking:!!p.breaking,pinned:!!p.pinned,top_story:!!p.top_story,related:Array.isArray(p.related)?p.related:[],updated_at:p.updated_at||''
    }));
    const pages=(s.pages||[]).map(p=>({title:p.title||'',slug:p.slug||'',status:p.status||'Draft',content:p.content||'',seo:p.seo||'',styles:p.styles&&typeof p.styles==='object'?p.styles:{},blocks:Array.isArray(p.blocks)?p.blocks:[],updated_at:p.updated_at||''}));
    const media=(s.media||[]).map(a=>({id:a.id||'',title:a.title||'',url:a.url||'',type:a.type||'Image',alt:a.alt||'',tags:Array.isArray(a.tags)?a.tags:[],updated_at:a.updated_at||''}));
    const brands=(s.brands||[]).map(b=>({id:pageSlug(b.id||b.short||b.name),name:b.name||'',short:b.short||'',accent:b.accent||'#1f6ffa',tagline:b.tagline||'',description:b.description||'',categories:Array.isArray(b.categories)?b.categories:[],hero:b.hero||'',navigation:Array.isArray(b.navigation)?b.navigation:[],enabled:b.enabled!==false})).filter(b=>b.id);
    const routedPages=pages.filter(p=>pageSlug(p.slug));
    const pageFiles=routedPages.map(p=>({path:`content/pages/${pageSlug(p.slug)}.json`,content:JSON.stringify(p,null,2)+'\n'}));
    const routeFiles=routedPages.flatMap(p=>{const slug=pageSlug(p.slug),html=pageRouteHtml(slug);return[{path:`${slug}/index.html`,content:html},{path:`public/${slug}/index.html`,content:html}]});
    const articleFiles=posts.filter(p=>['Published','Scheduled'].includes(p.status)&&pageSlug(p.slug)).flatMap(p=>{const category=pageSlug(p.category||'news')||'news';const slug=pageSlug(p.slug);const html=articleRouteHtml(p);return[{path:`${category}/${slug}/index.html`,content:html},{path:`public/${category}/${slug}/index.html`,content:html}]});
    const brandFiles=brands.filter(b=>b.enabled).flatMap(b=>{const html=subsidiaryRouteHtml(b);return[{path:`${b.id}/index.html`,content:html},{path:`public/${b.id}/index.html`,content:html}]});
    const sitemap=sitemapXml(posts,pages,brands),rss=rssXml(posts),robots=robotsTxt();
    return[
      {path:'content/posts.json',content:JSON.stringify(posts,null,2)+'\n'},
      {path:'content/pages/index.json',content:JSON.stringify(pages,null,2)+'\n'},
      ...pageFiles,...routeFiles,...articleFiles,...brandFiles,
      {path:'content/categories.json',content:JSON.stringify(s.categories||[],null,2)+'\n'},
      {path:'content/genres.json',content:JSON.stringify(s.genres||[],null,2)+'\n'},
      {path:'content/homepage.json',content:JSON.stringify({version:1,blocks:(s.homepage||[]).map(b=>({id:b.id,type:String(b.type||'').toLowerCase().replace(/ /g,'-'),props:b.props||{}}))},null,2)+'\n'},
      {path:'content/media.json',content:JSON.stringify(media,null,2)+'\n'},
      {path:'content/brands.json',content:JSON.stringify({version:1,brands},null,2)+'\n'},
      {path:'robots.txt',content:robots},{path:'public/robots.txt',content:robots},
      {path:'sitemap.xml',content:sitemap},{path:'public/sitemap.xml',content:sitemap},
      {path:'feed.xml',content:rss},{path:'public/feed.xml',content:rss}
    ]
  }

  function recordSuccessfulPublish(d){const at=new Date().toISOString();const snapshot=currentCMS();localStorage.setItem(LAST_PUBLISHED_CMS,JSON.stringify(snapshot));localStorage.setItem(LAST_PUBLISH_KEY,JSON.stringify({at,status:d.status||'published',commit_sha:d.commit_sha||'',commit_url:d.commit_url||'',files_changed:Array.isArray(d.files_changed)?d.files_changed:[]}));emit('untoz:publish-success',{at,commit_sha:d.commit_sha||'',commit_url:d.commit_url||'',files_changed:d.files_changed||[],status:d.status||'published'})}
  async function publish(){
    let s=session();if(!s){await login();s=session();if(!s)return}
    if(s.expires_at&&Date.now()>s.expires_at){saveSession(null);authButton();emit('untoz:auth-change',{signedIn:false,email:s.email||''});throw Error('Session expired. Please sign in again.')}
    await reconcileScheduledPosts();
    if(!confirm('Publish all saved Untoz Command changes to the live site?'))return;
    const btn=document.getElementById('command-publish');if(btn){btn.disabled=true;btn.textContent='Publishing…'}
    try{
      const r=await fetch(API_BASE+'/api/public/publish',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.access_token},body:JSON.stringify({message:'CMS publish via Untoz Command',files:cmsFiles()})});const d=await r.json();
      if(r.status===401){saveSession(null);authButton();emit('untoz:auth-change',{signedIn:false,email:s.email||''});throw Error('Session expired. Please sign in again.')}
      if(!r.ok)throw Error(d.error||'Publish failed');recordSuccessfulPublish(d);
      if(d.status==='no_changes')toast('Everything is already published. No changes needed.');else toast(`Published ${d.files_changed.length} file(s). GitHub commit ${d.commit_sha.slice(0,7)}.`);
      if(d.commit_url)window.__untozLastCommit=d.commit_url;
    }catch(e){const message=e.message||'Publish failed.';emit('untoz:publish-failure',{message});toast(message)}finally{syncPublishButton()}
  }

  function syncPublishButton(){const b=document.getElementById('command-publish');if(b){b.disabled=false;b.textContent=session()?'Publish changes':'Sign in to publish'}}
  function install(){const style=document.createElement('style');style.textContent='.command-auth{position:fixed;right:22px;bottom:22px;z-index:9999;border:0;border-radius:999px;padding:10px 16px;background:#171a22;color:#fff;font:600 13px/1 system-ui;box-shadow:0 8px 30px #0003;cursor:pointer}.command-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);opacity:0;z-index:10000;background:#171a22;color:#fff;padding:12px 18px;border-radius:10px;font:600 13px system-ui;transition:.2s;pointer-events:none}.command-toast.show{opacity:1;transform:translate(-50%,0)}';document.head.appendChild(style);authButton();document.addEventListener('click',e=>{const b=e.target.closest('[data-action="publish"],#command-publish');if(!b)return;e.preventDefault();e.stopImmediatePropagation();publish()},true);document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();publish()}});const observer=new MutationObserver(syncPublishButton);observer.observe(document.body,{childList:true,subtree:true});syncPublishButton()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
