(()=>{
  const CMS_KEY='untozCommandCMS';
  let autosaveTimer=null;
  let paletteItems=[];
  let activeResult=0;

  function read(){try{return JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{return {}}}
  function write(state){localStorage.setItem(CMS_KEY,JSON.stringify(state))}
  function toast(message){let el=document.getElementById('command-tool-toast');if(!el){el=document.createElement('div');el.id='command-tool-toast';el.className='command-tool-toast';document.body.appendChild(el)}el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
  function currentView(){return document.querySelector('.topbar h1')?.textContent?.trim()||''}
  function navTo(view){document.querySelector(`.nav [data-view="${view}"]`)?.click()}
  function refresh(view){navTo(view);setTimeout(()=>enhance(),30)}
  function slugify(value){return String(value||'item').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

  function installTopbar(){
    const actions=document.querySelector('.topbar .top-actions');
    if(!actions||actions.querySelector('[data-command-search]'))return;
    const search=document.createElement('button');search.className='command-top-tool';search.dataset.commandSearch='1';search.innerHTML='⌕ Search <kbd>Ctrl K</kbd>';search.onclick=openPalette;
    const backup=document.createElement('button');backup.className='command-top-tool';backup.dataset.commandBackup='1';backup.textContent='Backup ▾';backup.onclick=e=>{e.stopPropagation();document.getElementById('command-backup-pop').hidden=!document.getElementById('command-backup-pop').hidden};
    actions.prepend(backup);actions.prepend(search);
  }

  function installBackupMenu(){
    if(document.getElementById('command-backup-pop'))return;
    const pop=document.createElement('div');pop.id='command-backup-pop';pop.className='command-backup-pop';pop.hidden=true;pop.innerHTML=`<button data-backup-export>Export CMS backup<small>Download all local Untoz Command data</small></button><button data-backup-import>Restore backup<small>Import a previous JSON backup</small></button>`;document.body.appendChild(pop);
    const file=document.createElement('input');file.type='file';file.accept='application/json,.json';file.hidden=true;document.body.appendChild(file);
    pop.querySelector('[data-backup-export]').onclick=()=>{exportBackup();pop.hidden=true};
    pop.querySelector('[data-backup-import]').onclick=()=>{file.click();pop.hidden=true};
    file.onchange=async()=>{const f=file.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());const cms=data.cms||data;if(!cms||!Array.isArray(cms.posts)||!Array.isArray(cms.pages))throw Error('Invalid Untoz Command backup.');if(!confirm('Restore this CMS backup? Current local CMS data will be replaced.'))return;write(cms);toast('Backup restored. Reloading…');setTimeout(()=>location.reload(),500)}catch(e){toast(e.message||'Could not restore backup.')}finally{file.value=''}};
    document.addEventListener('click',e=>{if(!pop.contains(e.target)&&!e.target.closest('[data-command-backup]'))pop.hidden=true});
  }

  function exportBackup(){
    const payload={product:'Untoz Command',version:1,exported_at:new Date().toISOString(),cms:read()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`untoz-command-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('CMS backup exported.');
  }

  function installPalette(){
    if(document.getElementById('command-modal'))return;
    const modal=document.createElement('div');modal.id='command-modal';modal.className='command-modal';modal.hidden=true;modal.innerHTML=`<div class="command-modal-backdrop"></div><div class="command-palette"><div class="command-palette-search"><span>⌕</span><input id="command-palette-input" placeholder="Search posts, pages or commands…" autocomplete="off"><kbd>ESC</kbd></div><div id="command-results" class="command-results"></div></div>`;document.body.appendChild(modal);
    modal.querySelector('.command-modal-backdrop').onclick=closePalette;
    const input=modal.querySelector('#command-palette-input');input.oninput=()=>renderPalette(input.value);input.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();activeResult=Math.min(activeResult+1,paletteItems.length-1);renderPalette(input.value)}else if(e.key==='ArrowUp'){e.preventDefault();activeResult=Math.max(activeResult-1,0);renderPalette(input.value)}else if(e.key==='Enter'){e.preventDefault();paletteItems[activeResult]?.run?.()}else if(e.key==='Escape')closePalette()};
  }

  function openPalette(){const modal=document.getElementById('command-modal');if(!modal)return;modal.hidden=false;activeResult=0;renderPalette('');setTimeout(()=>document.getElementById('command-palette-input')?.focus(),20)}
  function closePalette(){const modal=document.getElementById('command-modal');if(modal)modal.hidden=true}
  function openEditor(kind,id){closePalette();navTo(kind==='Post'?'posts':'pages');setTimeout(()=>document.querySelector(`[data-edit-${kind.toLowerCase()}="${CSS.escape(String(id))}"]`)?.click(),70)}

  function renderPalette(query=''){
    const state=read();const q=query.trim().toLowerCase();
    const commands=[
      {title:'Create new post',meta:'Command · Posts',icon:'＋',run:()=>{closePalette();document.querySelector('[data-action="new-post"]')?.click()}},
      {title:'Create new page',meta:'Command · Pages',icon:'▤',run:()=>{closePalette();document.querySelector('[data-action="new-page"]')?.click()}},
      {title:'Open Homepage Builder',meta:'Command · Design',icon:'◇',run:()=>{closePalette();navTo('homepage')}},
      {title:'Open Media Library',meta:'Command · Media',icon:'▧',run:()=>{closePalette();navTo('media')}},
      {title:'Sync live CMS',meta:'Command · System',icon:'↻',run:()=>{closePalette();document.getElementById('command-sync')?.click()}},
      {title:'Preview live site',meta:'Command · Site',icon:'↗',run:()=>{closePalette();window.open('../','_blank')}},
      {title:'Export CMS backup',meta:'Command · Backup',icon:'⇩',run:()=>{closePalette();exportBackup()}}
    ];
    const posts=(state.posts||[]).map(p=>({title:p.title||'Untitled post',meta:`Post · ${p.category||p.type||'Uncategorised'} · ${p.status||'Draft'}`,icon:'P',run:()=>openEditor('Post',p.id)}));
    const pages=(state.pages||[]).map(p=>({title:p.title||'Untitled page',meta:`Page · /${p.slug||''}`,icon:'Pg',run:()=>openEditor('Page',p.id)}));
    paletteItems=[...commands,...posts,...pages].filter(x=>!q||`${x.title} ${x.meta}`.toLowerCase().includes(q)).slice(0,14);
    activeResult=Math.min(activeResult,Math.max(0,paletteItems.length-1));
    const out=document.getElementById('command-results');if(!out)return;out.innerHTML=paletteItems.length?paletteItems.map((item,i)=>`<button class="command-result ${i===activeResult?'active':''}" data-result="${i}"><span class="command-result-icon">${item.icon}</span><span class="command-result-copy"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.meta)}</small></span><span class="command-result-arrow">›</span></button>`).join(''):'<div class="command-palette-empty">No results found.</div>';
    out.querySelectorAll('[data-result]').forEach(btn=>btn.onclick=()=>paletteItems[Number(btn.dataset.result)]?.run?.());
    out.querySelector('.active')?.scrollIntoView({block:'nearest'});
  }

  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  function enhanceManager(kind){
    const active=document.querySelector('.view.active');const panel=active?.querySelector('.panel');const table=panel?.querySelector('.table');if(!panel||!table)return;
    const state=read();const items=kind==='Posts'?(state.posts||[]):(state.pages||[]);
    if(!panel.querySelector('[data-command-list-tools]')){
      const toolbar=document.createElement('div');toolbar.className='command-list-tools';toolbar.dataset.commandListTools='1';toolbar.innerHTML=`<input type="search" data-list-search placeholder="Search ${kind.toLowerCase()}…"><select data-list-status><option value="">All statuses</option><option>Published</option><option>Draft</option></select>${kind==='Posts'?`<select data-list-category><option value="">All categories</option>${[...new Set((state.categories||[]).concat(items.map(x=>x.category).filter(Boolean)))].map(x=>`<option>${escapeHtml(x)}</option>`).join('')}</select>`:''}`;
      panel.querySelector('.panel-head')?.after(toolbar);toolbar.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>filterManager(kind,panel)));
    }
    table.querySelectorAll('tbody tr').forEach(row=>{
      const edit=row.querySelector(kind==='Posts'?'[data-edit-post]':'[data-edit-page]');if(!edit||row.querySelector('[data-command-row-tools]'))return;
      const id=kind==='Posts'?edit.dataset.editPost:edit.dataset.editPage;const tools=document.createElement('span');tools.className='command-row-tools';tools.dataset.commandRowTools='1';
      const item=items.find(x=>String(x.id)===String(id));const isHome=kind==='Pages'&&(!item?.slug||String(item.title).toLowerCase()==='home');
      tools.innerHTML=`<button class="command-mini-btn" data-duplicate-${kind==='Posts'?'post':'page'}="${escapeHtml(id)}">Duplicate</button>${isHome?'':`<button class="command-mini-btn danger" data-delete-${kind==='Posts'?'post':'page'}="${escapeHtml(id)}">Delete</button>`}`;edit.after(tools);
    });
    filterManager(kind,panel);
  }

  function filterManager(kind,panel){
    const state=read();const items=kind==='Posts'?(state.posts||[]):(state.pages||[]);const q=(panel.querySelector('[data-list-search]')?.value||'').trim().toLowerCase();const status=panel.querySelector('[data-list-status]')?.value||'';const category=panel.querySelector('[data-list-category]')?.value||'';
    panel.querySelectorAll('.table tbody tr').forEach(row=>{const edit=row.querySelector(kind==='Posts'?'[data-edit-post]':'[data-edit-page]');if(!edit)return;const id=kind==='Posts'?edit.dataset.editPost:edit.dataset.editPage;const item=items.find(x=>String(x.id)===String(id));const hay=`${item?.title||''} ${item?.slug||''} ${item?.category||''} ${item?.author||''}`.toLowerCase();const okQ=!q||hay.includes(q);const okStatus=!status||String(item?.status||'Draft')===status;const okCat=!category||String(item?.category||'')===category;row.style.display=okQ&&okStatus&&okCat?'':'none'});
  }

  function duplicate(kind,id){const state=read();const key=kind==='post'?'posts':'pages';const item=(state[key]||[]).find(x=>String(x.id)===String(id));if(!item)return;const copy=JSON.parse(JSON.stringify(item));copy.id=Date.now();copy.title=`Copy of ${item.title||'Untitled'}`;copy.slug=`${slugify(item.slug||item.title)}-copy`;copy.status='Draft';state[key]=[copy,...(state[key]||[])];write(state);toast(`${kind==='post'?'Post':'Page'} duplicated as draft.`);refresh(kind==='post'?'posts':'pages')}
  function remove(kind,id){const state=read();const key=kind==='post'?'posts':'pages';const item=(state[key]||[]).find(x=>String(x.id)===String(id));if(!item)return;if(!confirm(`Delete “${item.title||'Untitled'}”? This removes it from local CMS data.`))return;state[key]=(state[key]||[]).filter(x=>String(x.id)!==String(id));write(state);toast(`${kind==='post'?'Post':'Page'} deleted locally.`);refresh(kind==='post'?'posts':'pages')}

  function installActions(){
    document.addEventListener('click',e=>{const dPost=e.target.closest('[data-duplicate-post]');const dPage=e.target.closest('[data-duplicate-page]');const xPost=e.target.closest('[data-delete-post]');const xPage=e.target.closest('[data-delete-page]');if(dPost){e.preventDefault();duplicate('post',dPost.dataset.duplicatePost)}else if(dPage){e.preventDefault();duplicate('page',dPage.dataset.duplicatePage)}else if(xPost){e.preventDefault();remove('post',xPost.dataset.deletePost)}else if(xPage){e.preventDefault();remove('page',xPage.dataset.deletePage)}},true);
  }

  function enhanceAutosave(){
    const editor=document.querySelector('.view.active .editor-panel');if(!editor||editor.dataset.commandAutosave)return;const save=editor.querySelector('[data-action="save-post"],[data-action="save-page"]');if(!save)return;editor.dataset.commandAutosave='1';
    const badge=document.createElement('span');badge.className='command-autosave';badge.textContent='Autosaved';editor.querySelector('.top-actions')?.prepend(badge);
    editor.querySelectorAll('input,textarea,select').forEach(el=>el.addEventListener('input',()=>{badge.classList.add('saving');badge.textContent='Saving…';clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>{autosaveEditor(editor,save);badge.classList.remove('saving');badge.textContent='Autosaved'},650)}));
  }

  function autosaveEditor(editor,save){const state=read();const isPost=!!editor.querySelector('#post-title');const id=Number(save.dataset.id);if(isPost){const p=(state.posts||[]).find(x=>Number(x.id)===id);if(!p)return;const map={title:'post-title',slug:'post-slug',status:'post-status',category:'post-category',genre:'post-genre',author:'post-author',date:'post-date',image:'post-image',excerpt:'post-excerpt',content:'post-content',seo:'post-seo'};Object.entries(map).forEach(([k,field])=>{const el=document.getElementById(field);if(el)p[k]=el.value});p.type=p.category}else{const p=(state.pages||[]).find(x=>Number(x.id)===id);if(!p)return;const map={title:'page-title',slug:'page-slug',status:'page-status',content:'page-content',seo:'page-seo'};Object.entries(map).forEach(([k,field])=>{const el=document.getElementById(field);if(el)p[k]=el.value})}write(state)}

  function enhance(){installTopbar();const view=currentView();if(view==='Posts')enhanceManager('Posts');if(view==='Pages')enhanceManager('Pages');enhanceAutosave()}

  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}else if(e.key==='Escape'&&!document.getElementById('command-modal')?.hidden){closePalette()}else if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='b'){e.preventDefault();exportBackup()}});
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});
  function install(){installPalette();installBackupMenu();installActions();enhance()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
