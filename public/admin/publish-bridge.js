(()=>{
  const API_BASE='https://untoz-command-api.lovable.app';
  const STORAGE_KEY='untozCommandSession';
  const CMS_KEY='untozCommandCMS';
  let configPromise=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function session(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}}
  function saveSession(v){if(v)localStorage.setItem(STORAGE_KEY,JSON.stringify(v));else localStorage.removeItem(STORAGE_KEY)}
  async function config(){if(!configPromise)configPromise=fetch(API_BASE+'/api/public/config',{cache:'no-store'}).then(r=>r.json());return configPromise}
  function toast(msg){let el=document.getElementById('command-toast');if(!el){el=document.createElement('div');el.id='command-toast';el.className='command-toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3500)}
  function authButton(){let b=document.getElementById('command-auth');if(!b){b=document.createElement('button');b.id='command-auth';b.className='command-auth';document.body.appendChild(b);b.onclick=()=>session()?logout():login()}b.textContent=session()?'Sign out':'Admin sign in';return b}
  async function login(){
    const email=prompt('Untoz Command admin email:'); if(!email)return;
    const password=prompt('Password:'); if(!password)return;
    try{const c=await config();if(!c.configured)throw Error('Authentication is not configured yet.');
      const r=await fetch(c.supabase_url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':c.supabase_anon_key},body:JSON.stringify({email,password})});
      const d=await r.json();if(!r.ok)throw Error(d.error_description||d.msg||'Sign in failed');
      saveSession({access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Date.now()+((d.expires_in||3600)*1000),email:d.user?.email||email});
      authButton();toast('Signed in to Untoz Command.');
    }catch(e){toast(e.message||'Sign in failed.');}
  }
  function logout(){saveSession(null);authButton();toast('Signed out.');}
  function cmsFiles(){
    let s={};try{s=JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{}
    const cleanPosts=(s.posts||[]).map(p=>({title:p.title||'',slug:p.slug||'',status:p.status||'Draft',category:p.category||'',genre:p.genre||'',author:p.author||'Untoz',date:p.date||'',image:p.image||'',excerpt:p.excerpt||'',content:p.content||'',seo:p.seo||''}));
    const cleanPages=(s.pages||[]).map(p=>({title:p.title||'',slug:p.slug||'',status:p.status||'Draft',content:p.content||'',seo:p.seo||''}));
    const files=[
      {path:'content/posts.json',content:JSON.stringify(cleanPosts,null,2)+'\n'},
      {path:'content/pages/index.json',content:JSON.stringify(cleanPages,null,2)+'\n'},
      {path:'content/categories.json',content:JSON.stringify(s.categories||[],null,2)+'\n'},
      {path:'content/genres.json',content:JSON.stringify(s.genres||[],null,2)+'\n'},
      {path:'content/homepage.json',content:JSON.stringify({version:1,blocks:(s.homepage||[]).map(b=>({id:b.id,type:String(b.type||'').toLowerCase().replace(/ /g,'-'),props:b.props||{}}))},null,2)+'\n'}
    ];
    return files;
  }
  async function publish(){
    const s=session();if(!s){await login();if(!session())return;}
    const now=session();
    if(now.expires_at&&Date.now()>now.expires_at){saveSession(null);toast('Session expired. Please sign in again.');return;}
    if(!confirm('Publish all saved Untoz Command changes to the live site?'))return;
    const btn=document.getElementById('command-publish');if(btn){btn.disabled=true;btn.textContent='Publishing…'}
    try{
      const r=await fetch(API_BASE+'/api/public/publish',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+now.access_token},body:JSON.stringify({message:'CMS publish via Untoz Command',files:cmsFiles()})});
      const d=await r.json();if(r.status===401){saveSession(null);authButton();throw Error('Session expired. Please sign in again.')}
      if(!r.ok)throw Error(d.error||'Publish failed');
      if(d.status==='no_changes')toast('Everything is already published. No changes needed.');
      else toast(`Published ${d.files_changed.length} file(s). GitHub commit ${d.commit_sha.slice(0,7)}.`);
      if(btn){btn.disabled=false;btn.textContent='Publish changes'}
      if(d.commit_url)window.__untozLastCommit=d.commit_url;
    }catch(e){toast(e.message||'Publish failed.');if(btn){btn.disabled=false;btn.textContent='Publish changes'}}
  }
  function install(){
    const style=document.createElement('style');style.textContent='.command-auth{position:fixed;right:22px;bottom:22px;z-index:9999;border:0;border-radius:999px;padding:10px 16px;background:#171a22;color:#fff;font:600 13px/1 system-ui;box-shadow:0 8px 30px #0003;cursor:pointer}.command-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);opacity:0;z-index:10000;background:#171a22;color:#fff;padding:12px 18px;border-radius:10px;font:600 13px system-ui;transition:.2s;pointer-events:none}.command-toast.show{opacity:1;transform:translate(-50%,0)}';document.head.appendChild(style);authButton();
    document.addEventListener('click',e=>{const b=e.target.closest('[data-action="publish"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();publish()},true);
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();publish()}});
    const observer=new MutationObserver(()=>{const candidates=[...document.querySelectorAll('[data-action="publish"],button')];const b=candidates.find(x=>/publish changes/i.test(x.textContent||''));if(b){b.id='command-publish';b.textContent=session()?'Publish changes':'Sign in to publish'}});observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
