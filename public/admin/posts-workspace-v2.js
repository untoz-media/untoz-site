(()=>{
  const CMS_KEY='untozCommandCMS';
  let scheduled=false;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{return {}}};
  const isPosts=()=>document.querySelector('.topbar h1')?.textContent?.trim()==='Posts';
  const activeView=()=>document.querySelector('.view.active');
  const isEditor=()=>!!activeView()?.querySelector('.editor-panel');
  const normalize=value=>String(value||'').trim().toLowerCase();

  function posts(){return Array.isArray(read().posts)?read().posts:[]}
  function counts(){
    const list=posts();
    return {
      total:list.length,
      published:list.filter(p=>normalize(p.status)==='published').length,
      draft:list.filter(p=>normalize(p.status)==='draft').length,
      scheduled:list.filter(p=>normalize(p.status)==='scheduled').length,
      priority:list.filter(p=>p.breaking||p.top_story||p.pinned).length
    };
  }

  function editorialHero(){
    const c=counts();
    return `<section class="pw-hero" data-posts-workspace-hero>
      <div class="pw-hero-copy">
        <div class="pw-kicker">Untoz Command · Editorial</div>
        <h2>Newsroom</h2>
        <p>Plan, write and publish stories across the Untoz network from one editorial desk.</p>
      </div>
      <button class="pw-new-story" type="button" data-pw-new>＋ New story</button>
      <div class="pw-metrics">
        <div><span>All stories</span><strong>${c.total}</strong><small>In local CMS</small></div>
        <div><span>Published</span><strong>${c.published}</strong><small>Live or ready</small></div>
        <div><span>Drafts</span><strong>${c.draft}</strong><small>Work in progress</small></div>
        <div><span>Scheduled</span><strong>${c.scheduled}</strong><small>Queued stories</small></div>
        <div><span>Priority</span><strong>${c.priority}</strong><small>Breaking / lead</small></div>
      </div>
    </section>`;
  }

  function statusTabs(){
    const c=counts();
    return `<div class="pw-filterbar" data-pw-filterbar>
      <div class="pw-status-tabs" role="group" aria-label="Post status filter">
        <button class="active" data-pw-status="">All <span>${c.total}</span></button>
        <button data-pw-status="Draft">Draft <span>${c.draft}</span></button>
        <button data-pw-status="Scheduled">Scheduled <span>${c.scheduled}</span></button>
        <button data-pw-status="Published">Published <span>${c.published}</span></button>
      </div>
      <div class="pw-view-note"><i></i><span>Editorial workspace</span></div>
    </div>`;
  }

  function postForRow(row){
    const edit=row.querySelector('[data-edit-post]');
    if(!edit)return null;
    return posts().find(p=>String(p.id)===String(edit.dataset.editPost))||null;
  }

  function flags(p){
    const out=[];
    if(p.breaking)out.push('<span class="pw-flag breaking">Breaking</span>');
    if(p.top_story)out.push('<span class="pw-flag top">Top story</span>');
    if(p.pinned)out.push('<span class="pw-flag pinned">Pinned</span>');
    if(p.featured)out.push('<span class="pw-flag featured">Featured</span>');
    return out.join('');
  }

  function annotateRows(panel){
    panel.querySelectorAll('.table tbody tr').forEach(row=>{
      const p=postForRow(row);if(!p)return;
      row.dataset.pwRow='1';
      row.dataset.pwStatus=p.status||'Draft';
      const cells=row.querySelectorAll('td');
      if(cells[0]&&!cells[0].querySelector('.pw-story-copy')){
        const title=cells[0].textContent?.trim()||p.title||'Untitled story';
        cells[0].innerHTML=`<div class="pw-story-copy"><div class="pw-story-flags">${flags(p)}</div><strong>${esc(title)}</strong><div class="pw-story-meta"><span>${esc(p.category||p.type||'Uncategorised')}</span><span>${esc(p.author||'Untoz')}</span><span>${esc(p.date||'No date')}</span></div></div>`;
      }
      if(cells[1]){
        cells[1].dataset.pwLabel='Desk';
        cells[1].innerHTML=`<span class="pw-desk">${esc(p.category||p.type||'News')}</span>`;
      }
      if(cells[2]){
        cells[2].dataset.pwLabel='Status';
        cells[2].innerHTML=`<span class="pw-status ${normalize(p.status)}"><i></i>${esc(p.status||'Draft')}</span>`;
      }
      if(cells[3])cells[3].dataset.pwLabel='Actions';
    });
  }

  function syncStatusTabs(panel){
    const select=panel.querySelector('[data-list-status]');
    const current=select?.value||'';
    panel.querySelectorAll('[data-pw-status]').forEach(btn=>btn.classList.toggle('active',(btn.dataset.pwStatus||'')===current));
  }

  function bindWorkspace(view,panel){
    view.querySelector('[data-pw-new]')?.addEventListener('click',()=>panel.querySelector('[data-action="new-post"]')?.click());
    view.querySelectorAll('[data-pw-status]').forEach(btn=>btn.addEventListener('click',()=>{
      const select=panel.querySelector('[data-list-status]');if(!select)return;
      select.value=btn.dataset.pwStatus||'';
      select.dispatchEvent(new Event('input',{bubbles:true}));
      syncStatusTabs(panel);
    }));
    panel.querySelector('[data-list-status]')?.addEventListener('input',()=>syncStatusTabs(panel));
  }

  function enhanceList(){
    const view=activeView();if(!view)return;
    const panel=view.querySelector(':scope > .panel');
    if(!panel||!panel.querySelector('.table'))return;
    view.classList.add('posts-workspace-v2');
    panel.classList.add('pw-list-panel');
    const create=panel.querySelector('[data-action="new-post"]');if(create)create.textContent='＋ Create story';
    if(!view.querySelector('[data-posts-workspace-hero]')){
      const wrap=document.createElement('div');wrap.innerHTML=editorialHero();panel.before(wrap.firstElementChild);
    }
    if(!panel.querySelector('[data-pw-filterbar]')){
      const wrap=document.createElement('div');wrap.innerHTML=statusTabs();
      const head=panel.querySelector('.panel-head');head?.insertAdjacentElement('afterend',wrap.firstElementChild);
    }
    annotateRows(panel);syncStatusTabs(panel);bindWorkspace(view,panel);
  }

  function editorContext(panel){
    const save=panel.querySelector('[data-action="save-post"]');
    const post=posts().find(p=>String(p.id)===String(save?.dataset.id))||{};
    return `<div class="pw-editor-context" data-pw-editor-context>
      <div><div class="pw-kicker">Editorial workspace</div><strong>${esc(post.category||post.type||'Story')}</strong><span>${esc(post.author||'Untoz')}</span></div>
      <div class="pw-editor-context-meta"><span class="pw-status ${normalize(post.status)}"><i></i>${esc(post.status||'Draft')}</span>${post.breaking?'<span class="pw-flag breaking">Breaking</span>':''}${post.top_story?'<span class="pw-flag top">Top story</span>':''}</div>
    </div>`;
  }

  function enhanceEditor(){
    const view=activeView(),panel=view?.querySelector('.editor-panel');if(!panel)return;
    panel.classList.add('pw-editor-panel');
    const editor=panel.querySelector('[data-post-editor2]');
    if(editor)editor.classList.add('pw-editor-v2');
    if(!panel.querySelector('[data-pw-editor-context]')){
      const wrap=document.createElement('div');wrap.innerHTML=editorContext(panel);
      panel.querySelector('.panel-head')?.insertAdjacentElement('afterend',wrap.firstElementChild);
    }
  }

  function enhance(){
    scheduled=false;
    if(!isPosts())return;
    isEditor()?enhanceEditor():enhanceList();
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target.closest('[data-view="posts"],[data-edit-post],[data-action="new-post"],[data-action="close-editor"]'))setTimeout(schedule,30)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
})();
