(()=>{
  const CMS_KEY='untozCommandCMS',SESSION_KEY='untozCommandSession';
  const API=()=>window.UNTOZ_COMMAND_API_BASE||'https://untoz-command-api.lovable.app';
  let open=false,period=30,data=null,loading=false,error='';
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=v=>new Intl.NumberFormat().format(Number(v)||0);
  const session=()=>read(SESSION_KEY,null);
  const profile=()=>window.UntozCommandRole||(()=>{const s=session();return s?.role?{role:s.role,permissions:s.permissions||{}}:null})();
  const allowed=()=>['owner','admin','editor'].includes(String(profile()?.role||''));
  const cms=()=>read(CMS_KEY,{})||{};
  function config(){const c=cms();return c.siteConfig?.analytics||{enabled:false,endpoint:'',respect_dnt:true}}
  function toast(msg){let t=document.getElementById('analytics-toast');if(!t){t=document.createElement('div');t.id='analytics-toast';t.className='team-toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
  function nav(){const root=document.querySelector('.nav');if(!root)return;let b=root.querySelector('[data-command-analytics]');if(allowed()){if(!b){b=document.createElement('button');b.className='command-analytics-nav';b.dataset.commandAnalytics='1';b.textContent='Analytics';b.onclick=openView;root.appendChild(b)}b.classList.toggle('active',open)}else if(b)b.remove()}
  function leave(){open=false;document.querySelector('[data-command-analytics]')?.classList.remove('active')}
  function metric(label,value){return `<div class="analytics-metric"><span>${esc(label)}</span><b>${esc(num(value))}</b></div>`}
  function list(items,labelKey='path',subKey='title'){
    if(!Array.isArray(items)||!items.length)return '<div class="analytics-empty">No data yet.</div>';
    return `<div class="analytics-list">${items.map(x=>`<div class="analytics-row"><div><b>${esc(x[labelKey]||'Unknown')}</b>${subKey&&x[subKey]?`<small>${esc(x[subKey])}</small>`:''}</div><strong>${esc(num(x.views))}</strong></div>`).join('')}</div>`
  }
  function chart(items){
    if(!Array.isArray(items)||!items.length)return '<div class="analytics-empty">Traffic will appear here after tracking starts.</div>';
    const max=Math.max(1,...items.map(x=>Number(x.views)||0));
    return `<div class="analytics-chart">${items.map(x=>{const h=Math.max(3,Math.round((Number(x.views)||0)/max*100));return `<div class="analytics-bar" style="height:${h}%"><span>${esc(x.day)} · ${esc(num(x.views))}</span></div>`}).join('')}</div>`
  }
  function viewHtml(){
    const cfg=config(),endpoint=cfg.endpoint||'';
    const avg=data?.period_days?Math.round((Number(data.pageviews)||0)/data.period_days):0;
    return `<section class="analytics-manager" data-analytics-manager>
      <div class="analytics-hero"><div><span class="analytics-kicker">UNTOZ COMMAND</span><h2>Analytics</h2><p>Privacy-friendly traffic analytics for the Untoz network. No raw IPs or persistent user IDs.</p></div><div class="analytics-period"><span class="analytics-status ${cfg.enabled?'':'off'}">${cfg.enabled?'Tracking enabled':'Tracking off'}</span><select data-analytics-period><option value="7" ${period===7?'selected':''}>7 days</option><option value="30" ${period===30?'selected':''}>30 days</option><option value="90" ${period===90?'selected':''}>90 days</option></select><button class="analytics-btn" data-analytics-refresh>${loading?'Loading…':'Refresh'}</button></div></div>
      <div class="analytics-grid">${metric('Pageviews',data?.pageviews)}${metric('Sessions',data?.sessions)}${metric('Today',data?.today)}${metric('Avg / day',avg)}</div>
      <div class="analytics-panels"><div class="analytics-card"><span class="analytics-kicker">TRAFFIC</span><h3>Daily views</h3>${error?`<div class="analytics-empty">${esc(error)}</div>`:chart(data?.daily)}</div><div class="analytics-card"><span class="analytics-kicker">TOP CONTENT</span><h3>Most viewed</h3>${list(data?.top_pages,'path','title')}</div></div>
      <div class="analytics-split"><div class="analytics-card"><span class="analytics-kicker">NETWORK</span><h3>Brands</h3>${list(data?.brands,'brand','')}</div><div class="analytics-card"><span class="analytics-kicker">EDITORIAL</span><h3>Categories</h3>${list(data?.categories,'category','')}</div></div>
      <div class="analytics-split"><div class="analytics-card"><span class="analytics-kicker">DISCOVERY</span><h3>Referrers</h3>${list(data?.referrers,'referrer_host','')}</div><div class="analytics-card"><span class="analytics-kicker">DEVICES</span><h3>Device mix</h3>${list(data?.devices,'device','')}</div></div>
      <div class="analytics-card analytics-setup"><div><span class="analytics-kicker">TRACKING SETUP</span><h3>Public analytics runtime</h3><p>Tracking starts only after this configuration is published to <code>site.json</code>.</p></div><label class="analytics-toggle"><input type="checkbox" data-analytics-enabled ${cfg.enabled?'checked':''}> Enable privacy-friendly pageview tracking</label><div class="analytics-field"><label>Analytics API endpoint</label><input data-analytics-endpoint type="url" value="${esc(endpoint)}" placeholder="https://your-command-api.vercel.app"></div><div class="analytics-actions"><button class="analytics-btn" data-analytics-current>Use current Command API</button><button class="analytics-btn primary" data-analytics-save>Save settings</button></div><p>Do Not Track is respected automatically. Admin pages are never tracked.</p></div>
    </section>`
  }
  function render(){if(!open)return;const view=document.querySelector('.view.active'),title=document.querySelector('.topbar h1');if(!view||!title)return;title.textContent='Analytics';view.innerHTML=viewHtml();bind(view);nav()}
  function bind(root){
    root.querySelector('[data-analytics-period]')?.addEventListener('change',e=>{period=Number(e.target.value)||30;loadData()});
    root.querySelector('[data-analytics-refresh]')?.addEventListener('click',loadData);
    root.querySelector('[data-analytics-current]')?.addEventListener('click',()=>{const i=root.querySelector('[data-analytics-endpoint]');if(i)i.value=API()});
    root.querySelector('[data-analytics-save]')?.addEventListener('click',saveSettings);
  }
  function saveSettings(){const c=cms();if(!c.siteConfig||typeof c.siteConfig!=='object')c.siteConfig={};const endpoint=String(document.querySelector('[data-analytics-endpoint]')?.value||'').trim().replace(/\/$/,'');const enabled=!!document.querySelector('[data-analytics-enabled]')?.checked;if(enabled&&!/^https:\/\//i.test(endpoint))return toast('Add a valid HTTPS analytics endpoint first.');c.siteConfig.analytics={enabled,endpoint,respect_dnt:true};write(CMS_KEY,c);window.dispatchEvent(new CustomEvent('untoz:analytics-settings',{detail:{enabled,endpoint}}));toast('Analytics settings saved locally. Publish to apply them.');render()}
  async function loadData(){if(!allowed())return;const s=session();if(!s?.access_token){error='Sign in to load analytics.';data=null;render();return}loading=true;error='';render();try{const r=await fetch(API()+`/api/public/analytics?days=${period}`,{cache:'no-store',headers:{Authorization:'Bearer '+s.access_token}});const d=await r.json().catch(()=>({}));if(r.status===404)throw new Error('Analytics backend is not deployed on the current API yet.');if(!r.ok)throw new Error(d.error||`Analytics request failed (${r.status}).`);data=d}catch(e){data=null;error=e.message||'Could not load analytics.'}finally{loading=false;render()}}
  function openView(){if(!allowed())return;open=true;document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));document.querySelector('[data-command-analytics]')?.classList.add('active');render();loadData()}
  function watch(){document.addEventListener('click',e=>{if(e.target.closest('.nav [data-view]')||e.target.closest('[data-command-publishing]')||e.target.closest('[data-command-team]'))leave()},true);window.addEventListener('untoz:auth-change',()=>setTimeout(()=>{nav();if(open&&!allowed())leave()},100));window.addEventListener('untoz:team-change',()=>setTimeout(nav,100));const obs=new MutationObserver(()=>requestAnimationFrame(()=>{nav();if(open)render()}));obs.observe(document.documentElement,{childList:true,subtree:true})}
  function install(){watch();nav()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
