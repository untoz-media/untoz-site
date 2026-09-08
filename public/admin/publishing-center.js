(()=>{
  const CMS_KEY='untozCommandCMS';
  const SESSION_KEY='untozCommandSession';
  const SYNC_KEY='untozCommandLastSync';
  const LAST_PUBLISH_KEY='untozCommandLastPublish';
  const LAST_PUBLISHED_CMS='untozCommandLastPublishedCMS';
  const ACTIVITY_KEY='untozCommandActivity';
  const MAX_ACTIVITY=80;
  let publishingOpen=false;

  function readJSON(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
  function cms(){return readJSON(CMS_KEY,{})||{}}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]||m))}
  function fmt(v){if(!v)return 'Never';const d=new Date(v);return Number.isNaN(d.getTime())?'Never':d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}
  function rel(v){if(!v)return '';const d=new Date(v);const sec=Math.round((Date.now()-d.getTime())/1000);if(Math.abs(sec)<60)return 'just now';const min=Math.round(sec/60);if(Math.abs(min)<60)return `${Math.abs(min)}m ${min>=0?'ago':'from now'}`;const h=Math.round(min/60);if(Math.abs(h)<24)return `${Math.abs(h)}h ${h>=0?'ago':'from now'}`;const day=Math.round(h/24);return `${Math.abs(day)}d ${day>=0?'ago':'from now'}`}
  function activity(){return readJSON(ACTIVITY_KEY,[])||[]}
  function log(action,detail='',icon='•'){
    const list=activity();list.unshift({id:`act-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,at:new Date().toISOString(),action,detail,icon});localStorage.setItem(ACTIVITY_KEY,JSON.stringify(list.slice(0,MAX_ACTIVITY)));renderDrawer();if(publishingOpen)renderPublishing();
  }
  function signature(v){try{return JSON.stringify(v??null)}catch{return ''}}
  function changedSections(current,baseline){
    const keys=[['posts','Posts'],['pages','Pages'],['homepage','Homepage'],['media','Media'],['categories','Categories'],['genres','Genres'],['brands','Brands']];
    if(!baseline)return keys.filter(([k])=>Array.isArray(current[k])&&current[k].length).map(([k,label])=>({key:k,label,changed:true}));
    return keys.filter(([k])=>signature(current[k]||[])!==signature(baseline[k]||[])).map(([key,label])=>({key,label,changed:true}));
  }
  function countStatuses(posts){const p=Array.isArray(posts)?posts:[];return {published:p.filter(x=>x.status==='Published').length,drafts:p.filter(x=>x.status==='Draft').length,scheduled:p.filter(x=>x.status==='Scheduled').length}}
  function scheduledPosts(state){return (state.posts||[]).filter(p=>p.status==='Scheduled'&&p.scheduled_at).sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at))}
  function session(){return readJSON(SESSION_KEY,null)}
  function lastPublish(){return readJSON(LAST_PUBLISH_KEY,null)}

  function installNav(){
    const nav=document.querySelector('.nav');if(!nav)return;
    let btn=nav.querySelector('[data-command-publishing]');if(!btn){btn=document.createElement('button');btn.dataset.commandPublishing='1';btn.className='command-publishing-nav';btn.textContent='Publishing';btn.onclick=()=>openPublishing();nav.appendChild(btn)}
    btn.classList.toggle('active',publishingOpen);
  }
  function installActivityButton(){
    const actions=document.querySelector('.topbar .top-actions');if(!actions||actions.querySelector('[data-command-activity]'))return;
    const b=document.createElement('button');b.className='command-activity-trigger';b.dataset.commandActivity='1';b.textContent='Activity';b.onclick=openDrawer;actions.prepend(b);
  }
  function openPublishing(){publishingOpen=true;document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));document.querySelector('[data-command-publishing]')?.classList.add('active');renderPublishing()}
  function leavePublishing(){publishingOpen=false;document.querySelector('[data-command-publishing]')?.classList.remove('active')}

  function publishingMarkup(){
    const state=cms();const counts=countStatuses(state.posts);const baseline=readJSON(LAST_PUBLISHED_CMS,null);const changes=changedSections(state,baseline);const queue=scheduledPosts(state);const due=queue.filter(x=>new Date(x.scheduled_at).getTime()<=Date.now());const sess=session();const pub=lastPublish();const acts=activity().slice(0,8);
    const pending=changes.length>0;
    return `<section class="command-publishing" data-publishing-center>
      <div class="command-publishing-hero"><div><span class="command-pub-kicker">UNTOZ COMMAND</span><h2>Publishing Center</h2><p>Review local CMS changes, scheduled content and production status before going live.</p></div><div class="command-publishing-actions"><button data-pub-preview>↗ Preview site</button><button data-pub-sync>↻ Sync live</button><button class="primary" data-pub-publish>${sess?'Publish changes':'Sign in to publish'}</button></div></div>
      <div class="command-publishing-grid">
        <div class="command-pub-stat"><span>Publish status</span><strong>${pending?'Pending':'Clean'}</strong><small>${baseline?`${changes.length} area${changes.length===1?'':'s'} changed`:'No publish baseline yet'}</small></div>
        <div class="command-pub-stat"><span>Draft posts</span><strong>${counts.drafts}</strong><small>${counts.drafts?'Editorial work in progress':'No drafts'}</small></div>
        <div class="command-pub-stat"><span>Scheduled</span><strong>${counts.scheduled}</strong><small>${due.length?`${due.length} due now`:'Queue on track'}</small></div>
        <div class="command-pub-stat"><span>Published posts</span><strong>${counts.published}</strong><small>${(state.pages||[]).filter(x=>x.status==='Published').length} published pages</small></div>
      </div>
      <div class="command-pub-two">
        <div class="command-pub-card"><div class="command-pub-head"><div><span class="command-pub-kicker">CHANGES</span><h3>Ready to publish</h3></div><span class="command-pub-pill ${pending?'warn':'good'}">${pending?'Changes pending':'Up to date'}</span></div>
          <div class="command-pub-status-list">${baseline?(changes.length?changes.map(x=>`<div class="command-pub-change"><div><b>${esc(x.label)}</b><small>Local data differs from last published snapshot</small></div><span class="command-pub-pill warn">Changed</span></div>`).join(''):'<div class="command-pub-empty">No local CMS changes detected since the last successful publish.</div>'):'<div class="command-pub-empty">Publish once from this browser to establish a comparison baseline.</div>'}</div>
        </div>
        <div class="command-pub-card"><div class="command-pub-head"><div><span class="command-pub-kicker">PRODUCTION</span><h3>System status</h3></div><span class="command-pub-pill good">Operational</span></div><div class="command-pub-status-list">
          <div class="command-pub-status-row"><span>Authentication</span><b>${sess?esc(sess.email||'Signed in'):'Sign-in required'}</b></div>
          <div class="command-pub-status-row"><span>Last live sync</span><b>${esc(fmt(localStorage.getItem(SYNC_KEY)))}</b></div>
          <div class="command-pub-status-row"><span>Last publish</span><b>${esc(fmt(pub?.at))}</b></div>
          <div class="command-pub-status-row"><span>Last commit</span><b>${pub?.commit_sha?esc(pub.commit_sha.slice(0,7)):'—'}</b></div>
        </div></div>
      </div>
      <div class="command-pub-two">
        <div class="command-pub-card"><div class="command-pub-head"><div><span class="command-pub-kicker">SCHEDULE</span><h3>Scheduled queue</h3></div>${due.length?`<span class="command-pub-pill danger">${due.length} due</span>`:`<span class="command-pub-pill good">On track</span>`}</div><div class="command-pub-queue">${queue.length?queue.slice(0,8).map(p=>`<div class="command-pub-queue-item"><div><b>${esc(p.title||'Untitled')}</b><small>${esc(fmt(p.scheduled_at))}${new Date(p.scheduled_at).getTime()<=Date.now()?' · due now':''}</small></div><button data-pub-edit-post="${esc(p.id)}">Edit</button></div>`).join(''):'<div class="command-pub-empty">No scheduled posts.</div>'}</div></div>
        <div class="command-pub-card"><div class="command-pub-head"><div><span class="command-pub-kicker">ACTIVITY</span><h3>Recent activity</h3></div><div class="command-activity-tools"><button data-open-activity>View all</button></div></div><div class="command-activity-list">${activityMarkup(acts)}</div></div>
      </div>
    </section>`;
  }
  function activityMarkup(list){return list.length?list.map(a=>`<div class="command-activity-item"><span class="command-activity-icon">${esc(a.icon||'•')}</span><span class="command-activity-copy"><b>${esc(a.action)}</b><small>${esc(a.detail||'Untoz Command')}</small></span><span class="command-activity-time">${esc(rel(a.at))}</span></div>`).join(''):'<div class="command-pub-empty">No activity recorded yet.</div>'}
  function renderPublishing(){
    if(!publishingOpen)return;const view=document.querySelector('.view.active');const title=document.querySelector('.topbar h1');if(!view||!title)return;title.textContent='Publishing';view.innerHTML=publishingMarkup();
    view.querySelector('[data-pub-preview]')?.addEventListener('click',()=>window.open('../','_blank'));
    view.querySelector('[data-pub-sync]')?.addEventListener('click',()=>document.getElementById('command-sync')?.click());
    view.querySelector('[data-pub-publish]')?.addEventListener('click',()=>{const b=document.querySelector('[data-action="publish"],#command-publish');if(b)b.click()});
    view.querySelector('[data-open-activity]')?.addEventListener('click',openDrawer);
    view.querySelectorAll('[data-pub-edit-post]').forEach(b=>b.onclick=()=>{publishingOpen=false;document.querySelector('.nav [data-view="posts"]')?.click();setTimeout(()=>document.querySelector(`[data-edit-post="${CSS.escape(String(b.dataset.pubEditPost))}"]`)?.click(),80)});
  }

  function installDrawer(){if(document.getElementById('command-activity-drawer'))return;const d=document.createElement('div');d.id='command-activity-drawer';d.className='command-activity-drawer';d.hidden=true;d.innerHTML=`<div class="command-activity-backdrop"></div><aside class="command-activity-panel"><div class="command-activity-panel-head"><div><span class="command-pub-kicker">UNTOZ COMMAND</span><h3>Activity Log</h3></div><button class="command-activity-close">×</button></div><div class="command-activity-tools" style="margin-bottom:14px"><button data-activity-clear>Clear activity</button></div><div id="command-activity-drawer-list" class="command-activity-list"></div></aside>`;document.body.appendChild(d);d.querySelector('.command-activity-backdrop').onclick=closeDrawer;d.querySelector('.command-activity-close').onclick=closeDrawer;d.querySelector('[data-activity-clear]').onclick=()=>{if(confirm('Clear the local Untoz Command activity log?')){localStorage.removeItem(ACTIVITY_KEY);log('Activity log cleared','A new log has started','↺');renderDrawer()}}}
  function openDrawer(){installDrawer();renderDrawer();document.getElementById('command-activity-drawer').hidden=false}
  function closeDrawer(){const d=document.getElementById('command-activity-drawer');if(d)d.hidden=true}
  function renderDrawer(){const out=document.getElementById('command-activity-drawer-list');if(out)out.innerHTML=activityMarkup(activity())}

  function bindActivityCapture(){
    document.addEventListener('click',e=>{
      const b=e.target.closest('button,[data-action]');if(!b)return;
      if(b.matches('[data-action="new-post"]'))log('New post started','Created a new draft','＋');
      else if(b.matches('[data-action="new-page"]'))log('New page started','Created a new page draft','Pg');
      else if(b.matches('[data-action="save-post"]'))log('Post saved',document.getElementById('post-title')?.value||'Post editor','P');
      else if(b.matches('[data-action="save-page"]'))log('Page saved',document.getElementById('page-title')?.value||'Page editor','Pg');
      else if(b.matches('[data-action="save-homepage"]'))log('Homepage saved','Homepage Builder changes saved','◇');
      else if(b.matches('[data-media-add]'))log('Media editor opened','Adding a new media asset','▧');
    },true);
    window.addEventListener('untoz:publish-success',e=>log('Site published',e.detail?.commit_sha?`Commit ${String(e.detail.commit_sha).slice(0,7)}`:'CMS published','↑'));
    window.addEventListener('untoz:publish-failure',e=>log('Publish failed',e.detail?.message||'Publishing error','!'));
    window.addEventListener('untoz:sync-success',()=>log('Live CMS synced','Local CMS refreshed from GitHub','↻'));
    window.addEventListener('untoz:auth-change',e=>log(e.detail?.signedIn?'Admin signed in':'Admin signed out',e.detail?.email||'Publishing session','●'));
    window.addEventListener('untoz:brand-saved',e=>log(e.detail?.deleted?'Brand removed':e.detail?.created?'Brand created':'Brand saved',e.detail?.name||e.detail?.id||'Untoz brand network','◆'));
  }
  function watchNavigation(){document.addEventListener('click',e=>{const core=e.target.closest('.nav [data-view]');if(core)leavePublishing()},true)}
  function enhance(){installNav();installActivityButton();if(publishingOpen)renderPublishing()}
  function install(){installDrawer();installNav();installActivityButton();bindActivityCapture();watchNavigation();if(!localStorage.getItem(ACTIVITY_KEY))log('Untoz Command ready','Activity tracking started','U');const obs=new MutationObserver(()=>requestAnimationFrame(enhance));obs.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});enhance()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
