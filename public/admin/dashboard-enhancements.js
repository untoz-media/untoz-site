(()=>{
  const CMS_KEY='untozCommandCMS';
  const SYNC_KEY='untozCommandLastSync';
  const SESSION_KEY='untozCommandSession';
  let lastSignature='';

  function read(key,fallback=null){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function fmtDate(value){if(!value)return 'Never';const d=new Date(value);return Number.isNaN(d.getTime())?'Never':d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}
  function cms(){return read(CMS_KEY,{posts:[],pages:[],categories:[],genres:[],homepage:[]})||{posts:[],pages:[],categories:[],genres:[],homepage:[]}}
  function session(){return read(SESSION_KEY,null)}

  function build(){
    const state=cms();
    const posts=Array.isArray(state.posts)?state.posts:[];
    const pages=Array.isArray(state.pages)?state.pages:[];
    const blocks=Array.isArray(state.homepage)?state.homepage:[];
    const published=posts.filter(p=>String(p.status).toLowerCase()==='published').length;
    const drafts=posts.filter(p=>String(p.status).toLowerCase()!=='published').length;
    const lastSync=localStorage.getItem(SYNC_KEY);
    const signedIn=!!session();
    const recent=[...posts].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,5);
    return `<section class="command-overview" data-command-overview>
      <div class="command-welcome">
        <div>
          <span class="command-kicker">UNTOZ COMMAND</span>
          <h2>Welcome back.</h2>
          <p>Manage the Untoz portal, content and publishing workflow from one place.</p>
        </div>
        <div class="command-live-status"><span></span><div><b>Site online</b><small>GitHub Pages · Production</small></div></div>
      </div>

      <div class="command-metrics">
        <button data-view="posts" class="command-metric"><span>Published posts</span><strong>${published}</strong><small>Live content →</small></button>
        <button data-view="posts" class="command-metric"><span>Drafts</span><strong>${drafts}</strong><small>${drafts?'Needs attention':'All clear'} →</small></button>
        <button data-view="pages" class="command-metric"><span>Pages</span><strong>${pages.length}</strong><small>Manage pages →</small></button>
        <button data-view="homepage" class="command-metric"><span>Homepage blocks</span><strong>${blocks.length}</strong><small>Open builder →</small></button>
      </div>

      <div class="command-dashboard-grid">
        <div class="command-card command-status-card">
          <div class="command-card-head"><div><span class="command-kicker">SYSTEM</span><h3>Portal status</h3></div><span class="command-pill good">Operational</span></div>
          <div class="command-status-row"><span>Live CMS</span><b><i class="status-dot green"></i> Connected</b></div>
          <div class="command-status-row"><span>Last sync</span><b>${esc(fmtDate(lastSync))}</b></div>
          <div class="command-status-row"><span>Publishing</span><b><i class="status-dot ${signedIn?'green':'amber'}"></i> ${signedIn?'Signed in':'Sign-in required'}</b></div>
          <div class="command-status-row"><span>Environment</span><b>Production</b></div>
          <div class="command-card-actions"><button id="dashboard-sync">↻ Sync live CMS</button><button data-action="preview">↗ Open site</button></div>
        </div>

        <div class="command-card command-actions-card">
          <div class="command-card-head"><div><span class="command-kicker">CREATE</span><h3>Quick actions</h3></div></div>
          <div class="command-action-grid">
            <button data-action="new-post"><b>＋</b><span>New post</span><small>Create news or editorial content</small></button>
            <button data-action="new-page"><b>▤</b><span>New page</span><small>Add a new site page</small></button>
            <button data-view="homepage"><b>◇</b><span>Homepage Builder</span><small>Edit the public homepage</small></button>
            <button data-view="media"><b>▧</b><span>Media</span><small>Manage images and video</small></button>
          </div>
        </div>
      </div>

      <div class="command-card command-recent-card">
        <div class="command-card-head"><div><span class="command-kicker">CONTENT</span><h3>Recent content</h3></div><button class="command-text-btn" data-view="posts">View all →</button></div>
        <div class="command-recent-list">
          ${recent.length?recent.map(p=>`<button data-edit-post="${esc(p.id)}" class="command-recent-item"><span class="command-content-icon">${esc((p.category||p.type||'P').slice(0,1).toUpperCase())}</span><span class="command-content-copy"><b>${esc(p.title||'Untitled')}</b><small>${esc(p.category||p.type||'Post')} · ${esc(p.date||'No date')}</small></span><span class="command-pill ${String(p.status).toLowerCase()==='published'?'good':'draft'}">${esc(p.status||'Draft')}</span><span class="command-chevron">›</span></button>`).join(''):'<div class="command-empty">No content yet. Create your first post.</div>'}
        </div>
      </div>
    </section>`;
  }

  function bind(container){
    container.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{const target=document.querySelector(`.nav [data-view="${btn.dataset.view}"]`);if(target)target.click()}));
    container.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{const target=document.querySelector(`[data-action="${btn.dataset.action}"]`);if(target&&target!==btn)target.click()}));
    container.querySelectorAll('[data-edit-post]').forEach(btn=>btn.addEventListener('click',()=>{const target=document.querySelector(`[data-edit-post="${btn.dataset.editPost}"]`);if(target&&target!==btn)target.click()}));
    const sync=container.querySelector('#dashboard-sync');if(sync)sync.addEventListener('click',()=>document.getElementById('command-sync')?.click());
  }

  function enhance(){
    const title=document.querySelector('.topbar h1');
    const active=document.querySelector('.view.active');
    if(!title||!active||title.textContent.trim()!=='Dashboard')return;
    const state=cms();
    const signature=JSON.stringify([state.posts?.length,state.pages?.length,state.homepage?.length,localStorage.getItem(SYNC_KEY),!!session()]);
    if(active.querySelector('[data-command-overview]')&&signature===lastSignature)return;
    lastSignature=signature;
    active.querySelector('[data-command-overview]')?.remove();
    const wrap=document.createElement('div');wrap.innerHTML=build();const overview=wrap.firstElementChild;
    active.prepend(overview);bind(overview);
    active.querySelectorAll(':scope > .grid, :scope > .panel').forEach(el=>el.classList.add('legacy-dashboard-section'));
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('storage',enhance);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
