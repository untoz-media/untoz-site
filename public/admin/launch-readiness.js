(()=>{
  const SESSION_KEY='untozCommandSession';
  const CMS_KEY='untozCommandCMS';
  const FINAL_DOMAIN='untoz.site';
  const LIVE_SITE_CONFIG='https://raw.githubusercontent.com/untoz-media/untoz-site/main/content/site.json';
  let currentCard=null;
  let runToken=0;

  const API=()=>String(window.UNTOZ_COMMAND_API_BASE||'https://untoz-command-api.lovable.app').replace(/\/$/,'');
  function readJSON(key,fallback=null){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function stateClass(state){return state==='good'?'good':state==='danger'?'danger':'warn'}
  function label(state){return state==='good'?'Ready':state==='danger'?'Blocked':'Pending'}
  function statusRow(id,title,detail,state='warn'){
    return `<div class="command-pub-status-row" data-readiness-row="${esc(id)}"><span><b>${esc(title)}</b><small style="display:block;margin-top:3px">${esc(detail)}</small></span><span class="command-pub-pill ${stateClass(state)}" data-readiness-pill>${label(state)}</span></div>`;
  }
  function setRow(card,id,detail,state){
    const row=card.querySelector(`[data-readiness-row="${CSS.escape(id)}"]`);if(!row)return;
    const small=row.querySelector('small'),pill=row.querySelector('[data-readiness-pill]');
    if(small)small.textContent=detail;
    if(pill){pill.className=`command-pub-pill ${stateClass(state)}`;pill.textContent=label(state)}
  }
  function localAnalyticsConfig(){const cms=readJSON(CMS_KEY,{})||{};return cms.siteConfig?.analytics||{enabled:false,endpoint:''}}
  function session(){return readJSON(SESSION_KEY,null)}
  async function getJSON(url,options={}){
    const response=await fetch(url,{cache:'no-store',...options});
    const data=await response.json().catch(()=>({}));
    return {response,data};
  }

  function markup(){
    return `<div class="command-pub-card" data-launch-readiness style="margin-top:18px">
      <div class="command-pub-head"><div><span class="command-pub-kicker">LAUNCH READINESS</span><h3>Production cutover</h3><p style="margin:5px 0 0;color:var(--muted,#737987);font-size:12px">Live checks for the final Untoz Command launch path.</p></div><div style="display:flex;gap:8px;align-items:center"><span class="command-pub-pill warn" data-readiness-overall>Checking…</span><button data-readiness-refresh>Refresh</button></div></div>
      <div class="command-pub-status-list">
        ${statusRow('api','Command API','Checking the configured API endpoint…')}
        ${statusRow('github','GitHub publishing','Checking repository credentials…')}
        ${statusRow('database','Supabase database','Checking service configuration…')}
        ${statusRow('auth','Authentication','Checking public auth configuration…')}
        ${statusRow('owner','First Owner setup','Checking bootstrap state…')}
        ${statusRow('session','Current session','Checking account role…')}
        ${statusRow('analytics','Analytics','Checking published tracking configuration…')}
        ${statusRow('cutover','Backend cutover','Checking whether the legacy API is still active…')}
        ${statusRow('domain','Final domain',`Target: ${FINAL_DOMAIN}`)}
      </div>
      <div class="command-pub-empty" data-readiness-note style="margin-top:12px">Running production checks…</div>
    </div>`;
  }

  async function run(card){
    if(!card||!card.isConnected)return;
    const token=++runToken;
    const api=API();
    const sess=session();
    const overall=card.querySelector('[data-readiness-overall]');
    const note=card.querySelector('[data-readiness-note]');
    const result={api:false,github:false,database:false,auth:false,owner:false,session:false,analytics:false,cutover:false,domain:false};
    if(overall){overall.className='command-pub-pill warn';overall.textContent='Checking…'}
    if(note)note.textContent=`Checking ${api}…`;

    try{
      const {response,data}=await getJSON(api+'/api/public/health');
      if(token!==runToken)return;
      result.api=response.ok&&data.status==='ok';
      result.github=data.github_credentials==='configured';
      result.database=data.database==='configured';
      setRow(card,'api',result.api?`${data.service||'untoz-command-api'} · ${data.repo||'repo'} · ${data.branch||'branch'}`:`Health check failed (${response.status})`,result.api?'good':'danger');
      setRow(card,'github',result.github?'GitHub credentials are configured.':'GitHub credentials are missing from the API environment.',result.github?'good':'danger');
      setRow(card,'database',result.database?'Supabase service is configured.':'SUPABASE_URL/service credentials are missing.',result.database?'good':'danger');
    }catch(error){
      if(token!==runToken)return;
      setRow(card,'api',error?.message||'Could not reach the configured API.','danger');
      setRow(card,'github','Cannot verify until the API responds.','danger');
      setRow(card,'database','Cannot verify until the API responds.','danger');
    }

    try{
      const {response,data}=await getJSON(api+'/api/public/config');
      if(token!==runToken)return;
      result.auth=response.ok&&data.configured===true;
      result.owner=response.ok&&data.bootstrap_required===false;
      setRow(card,'auth',result.auth?'Supabase email/password auth is configured.':'Authentication configuration is incomplete.',result.auth?'good':'danger');
      setRow(card,'owner',result.owner?'Bootstrap is closed: at least one staff role exists.':'First Owner setup is still required.',result.owner?'good':'danger');
    }catch(error){
      setRow(card,'auth','Could not read auth configuration.','danger');
      setRow(card,'owner','Could not verify Owner bootstrap state.','danger');
    }

    if(sess?.access_token){
      try{
        const {response,data}=await getJSON(api+'/api/public/me',{headers:{Authorization:'Bearer '+sess.access_token}});
        if(token!==runToken)return;
        result.session=response.ok&&['owner','admin','editor','writer','viewer'].includes(String(data.role||''));
        setRow(card,'session',result.session?`${sess.email||'Signed in'} · ${data.role}`:(data.error||'Session is not authorised.'),result.session?'good':'danger');
      }catch(error){setRow(card,'session','Could not verify the current session.','danger')}
    }else setRow(card,'session','Sign in to verify the production role.','warn');

    try{
      const {response,data}=await getJSON(LIVE_SITE_CONFIG+'?t='+Date.now());
      const published=response.ok&&data&&typeof data==='object'?data.analytics||{}:{};
      const publishedEndpoint=String(published.endpoint||'').replace(/\/$/,'');
      const local=localAnalyticsConfig();
      const localEndpoint=String(local.endpoint||'').replace(/\/$/,'');
      result.analytics=response.ok&&published.enabled===true&&publishedEndpoint===api;
      if(result.analytics)setRow(card,'analytics','Published tracking is enabled and points at the current Command API.','good');
      else if(local.enabled===true&&localEndpoint===api)setRow(card,'analytics','Analytics is configured locally but has not been published to site.json yet.','warn');
      else if(published.enabled===true)setRow(card,'analytics','Published tracking points at a different API endpoint.','warn');
      else setRow(card,'analytics','Analytics tracking is not enabled in the published site.json.','warn');
    }catch(error){setRow(card,'analytics','Could not verify the published site.json analytics configuration.','warn')}

    try{
      result.cutover=!/\.lovable\.app$/i.test(new URL(api).hostname);
      setRow(card,'cutover',result.cutover?`Current API: ${api}`:'Legacy Lovable API is still the active Command endpoint.',result.cutover?'good':'warn');
    }catch{
      setRow(card,'cutover','The configured Command API URL is invalid.','danger');
    }

    result.domain=location.hostname===FINAL_DOMAIN||location.hostname.endsWith('.'+FINAL_DOMAIN);
    setRow(card,'domain',result.domain?`Running on ${location.hostname}.`:`Preview host: ${location.hostname}. Final target remains ${FINAL_DOMAIN}.`,result.domain?'good':'warn');

    if(token!==runToken)return;
    const critical=['api','github','database','auth','owner','session','analytics','cutover'];
    const passed=critical.filter(key=>result[key]).length;
    const ready=passed===critical.length;
    if(overall){overall.className=`command-pub-pill ${ready?'good':'warn'}`;overall.textContent=ready?'READY':`${passed}/${critical.length} ready`}
    if(note)note.textContent=ready?(result.domain?'Production stack is ready and the final domain is active.':'Backend stack is ready. Final step: switch the public/admin host to untoz.site.'):`${critical.length-passed} critical check${critical.length-passed===1?'':'s'} still need attention before cutover.`;
  }

  function enhance(){
    const center=document.querySelector('[data-publishing-center]');if(!center){currentCard=null;return}
    let card=center.querySelector('[data-launch-readiness]');
    if(!card){center.insertAdjacentHTML('beforeend',markup());card=center.querySelector('[data-launch-readiness]');card?.querySelector('[data-readiness-refresh]')?.addEventListener('click',()=>run(card))}
    if(card&&card!==currentCard){currentCard=card;run(card)}
  }
  function install(){
    const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('untoz:auth-change',()=>setTimeout(()=>currentCard&&run(currentCard),100));
    window.addEventListener('untoz:analytics-settings',()=>setTimeout(()=>currentCard&&run(currentCard),100));
    window.addEventListener('untoz:publish-success',()=>setTimeout(()=>currentCard&&run(currentCard),700));
    enhance();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
