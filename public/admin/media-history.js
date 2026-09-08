(()=>{
  const CMS_KEY='untozCommandCMS';
  const HISTORY_KEY='untozCommandHistory';
  const HISTORY_SIG_KEY='untozCommandHistorySignature';
  const MAX_HISTORY=20;
  let mediaQuery='';
  let mediaType='';
  let editingMediaId=null;

  function readCMS(){try{return JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{return {}}}
  function writeCMS(state){localStorage.setItem(CMS_KEY,JSON.stringify(state))}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function safeUrl(value){const v=String(value||'').trim();return /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(v)?v:''}
  function toast(message){let el=document.getElementById('command-media-toast');if(!el){el=document.createElement('div');el.id='command-media-toast';el.className='command-media-toast';document.body.appendChild(el)}el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2300)}
  function currentView(){return document.querySelector('.topbar h1')?.textContent?.trim()||''}
  function stateMedia(state){if(!Array.isArray(state.media))state.media=[];return state.media}
  function usageCount(url,state){if(!url)return 0;let count=0;(state.posts||[]).forEach(p=>{if(p.image===url)count++});(state.homepage||[]).forEach(b=>{try{if(JSON.stringify(b.props||{}).includes(url))count++}catch{}});return count}
  function typeLabel(type){return ['Image','Video','Document'].includes(type)?type:'Image'}

  function mediaMarkup(){
    const state=readCMS();const media=stateMedia(state);
    const q=mediaQuery.toLowerCase();
    const filtered=media.filter(a=>{const hay=`${a.title||''} ${a.alt||''} ${(a.tags||[]).join(' ')} ${a.url||''}`.toLowerCase();return(!q||hay.includes(q))&&(!mediaType||typeLabel(a.type)===mediaType)});
    const refs=new Set((state.posts||[]).map(p=>p.image).filter(Boolean));
    return `<section class="command-media" data-media-workspace>
      <div class="command-media-head">
        <div><span class="eyebrow">ASSET MANAGEMENT</span><h2>Media Library</h2><p>Manage images, videos and external assets used across the Untoz portal.</p></div>
        <div class="command-media-actions"><button class="btn" data-media-import>Import referenced images</button><button class="btn primary" data-media-add>+ Add media</button></div>
      </div>
      <div class="command-media-stats">
        <div class="command-media-stat"><small>Total assets</small><strong>${media.length}</strong></div>
        <div class="command-media-stat"><small>Images</small><strong>${media.filter(x=>typeLabel(x.type)==='Image').length}</strong></div>
        <div class="command-media-stat"><small>Referenced URLs</small><strong>${refs.size}</strong></div>
      </div>
      <div class="command-media-toolbar"><input type="search" data-media-search value="${esc(mediaQuery)}" placeholder="Search media, tags or URLs…"><select data-media-type><option value="">All types</option>${['Image','Video','Document'].map(t=>`<option ${mediaType===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="command-media-grid">
        ${filtered.length?filtered.map(asset=>mediaCard(asset,state)).join(''):`<div class="command-media-empty"><b>${media.length?'No media matches your filters.':'Your Media Library is empty.'}</b><br><span>${media.length?'Try a different search.':'Add an asset or import images already referenced by posts.'}</span></div>`}
      </div>
    </section>`;
  }

  function mediaCard(asset,state){
    const url=safeUrl(asset.url);const type=typeLabel(asset.type);const uses=usageCount(asset.url,state);
    let preview='<span class="command-media-placeholder">▧</span>';
    if(type==='Image'&&url)preview=`<img src="${esc(url)}" alt="${esc(asset.alt||asset.title||'')}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="command-media-placeholder" style="display:none">▧</span>`;
    if(type==='Video'&&url)preview=`<video src="${esc(url)}" muted preload="metadata"></video>`;
    return `<article class="command-media-card" data-media-id="${esc(asset.id)}"><div class="command-media-preview"><span class="command-media-type">${esc(type)}</span>${preview}</div><div class="command-media-body"><h3 title="${esc(asset.title||'Untitled asset')}">${esc(asset.title||'Untitled asset')}</h3><p>${esc(asset.alt||asset.url||'No description')}</p><div class="command-media-tags">${(asset.tags||[]).slice(0,4).map(t=>`<span class="command-media-tag">${esc(t)}</span>`).join('')}${uses?`<span class="command-media-tag">Used ${uses}×</span>`:''}</div><div class="command-media-card-actions"><button data-media-copy="${esc(asset.id)}">Copy URL</button><button data-media-open="${esc(asset.id)}">Open</button><button data-media-edit="${esc(asset.id)}">Edit</button><button class="danger" data-media-delete="${esc(asset.id)}">Delete</button></div></div></article>`;
  }

  function renderMedia(){
    if(currentView()!=='Media')return;const active=document.querySelector('.view.active');if(!active)return;active.innerHTML=mediaMarkup();bindMedia(active);
  }

  function bindMedia(root){
    root.querySelector('[data-media-add]')?.addEventListener('click',()=>openMediaDialog());
    root.querySelector('[data-media-import]')?.addEventListener('click',importReferenced);
    const search=root.querySelector('[data-media-search]');if(search)search.addEventListener('input',()=>{mediaQuery=search.value;renderMedia();document.querySelector('[data-media-search]')?.focus()});
    const type=root.querySelector('[data-media-type]');if(type)type.addEventListener('change',()=>{mediaType=type.value;renderMedia()});
    root.querySelectorAll('[data-media-edit]').forEach(b=>b.onclick=()=>openMediaDialog(b.dataset.mediaEdit));
    root.querySelectorAll('[data-media-delete]').forEach(b=>b.onclick=()=>deleteMedia(b.dataset.mediaDelete));
    root.querySelectorAll('[data-media-copy]').forEach(b=>b.onclick=()=>copyMedia(b.dataset.mediaCopy));
    root.querySelectorAll('[data-media-open]').forEach(b=>b.onclick=()=>openMedia(b.dataset.mediaOpen));
  }

  function installMediaDialog(){
    if(document.getElementById('command-media-dialog'))return;const modal=document.createElement('div');modal.id='command-media-dialog';modal.className='command-dialog';modal.hidden=true;modal.innerHTML=`<div class="command-dialog-backdrop"></div><div class="command-dialog-card"><div class="command-dialog-head"><div><span class="eyebrow">MEDIA ASSET</span><h3 id="command-media-dialog-title">Add media</h3></div><button class="command-dialog-close" type="button">×</button></div><div class="command-dialog-grid"><label class="full">Title<input id="media-title" placeholder="Asset title"></label><label>Type<select id="media-type"><option>Image</option><option>Video</option><option>Document</option></select></label><label>Tags<input id="media-tags" placeholder="news, awards, space"></label><label class="full">Asset URL<input id="media-url" placeholder="https://… or /media/…"></label><label class="full">Alt text / description<textarea id="media-alt" placeholder="Describe this asset"></textarea></label></div><div class="command-dialog-actions"><button class="btn" data-media-cancel>Cancel</button><button class="btn primary" data-media-save>Save asset</button></div></div>`;document.body.appendChild(modal);modal.querySelector('.command-dialog-backdrop').onclick=closeMediaDialog;modal.querySelector('.command-dialog-close').onclick=closeMediaDialog;modal.querySelector('[data-media-cancel]').onclick=closeMediaDialog;modal.querySelector('[data-media-save]').onclick=saveMedia;
  }

  function openMediaDialog(id=null){
    installMediaDialog();editingMediaId=id;const state=readCMS();const asset=id?stateMedia(state).find(x=>String(x.id)===String(id)):null;
    document.getElementById('command-media-dialog-title').textContent=asset?'Edit media':'Add media';document.getElementById('media-title').value=asset?.title||'';document.getElementById('media-type').value=typeLabel(asset?.type);document.getElementById('media-tags').value=(asset?.tags||[]).join(', ');document.getElementById('media-url').value=asset?.url||'';document.getElementById('media-alt').value=asset?.alt||'';document.getElementById('command-media-dialog').hidden=false;setTimeout(()=>document.getElementById('media-title')?.focus(),20);
  }
  function closeMediaDialog(){const m=document.getElementById('command-media-dialog');if(m)m.hidden=true;editingMediaId=null}
  function saveMedia(){
    const title=document.getElementById('media-title').value.trim();const url=document.getElementById('media-url').value.trim();if(!title){toast('Add a title for this asset.');return}if(!safeUrl(url)){toast('Add a valid http(s) or site-relative URL.');return}
    const state=readCMS();const media=stateMedia(state);const value={id:editingMediaId||`media-${Date.now()}`,title,url,type:document.getElementById('media-type').value,alt:document.getElementById('media-alt').value.trim(),tags:document.getElementById('media-tags').value.split(',').map(x=>x.trim()).filter(Boolean),updated_at:new Date().toISOString()};
    const index=media.findIndex(x=>String(x.id)===String(editingMediaId));if(index>=0)media[index]={...media[index],...value};else media.unshift(value);writeCMS(state);createSnapshot(editingMediaId?'Media asset edited':'Media asset added',true);closeMediaDialog();toast(editingMediaId?'Media updated.':'Media added.');renderMedia();
  }
  function deleteMedia(id){const state=readCMS();const media=stateMedia(state);const asset=media.find(x=>String(x.id)===String(id));if(!asset)return;const uses=usageCount(asset.url,state);if(!confirm(`Delete “${asset.title}” from the Media Library?${uses?` It is referenced ${uses} time(s); existing URLs will not be removed from content.`:''}`))return;state.media=media.filter(x=>String(x.id)!==String(id));writeCMS(state);createSnapshot('Media asset deleted',true);toast('Media removed from library.');renderMedia()}
  async function copyMedia(id){const asset=stateMedia(readCMS()).find(x=>String(x.id)===String(id));if(!asset)return;try{await navigator.clipboard.writeText(asset.url);toast('Media URL copied.')}catch{toast(asset.url)}}
  function openMedia(id){const asset=stateMedia(readCMS()).find(x=>String(x.id)===String(id));const url=safeUrl(asset?.url);if(url)window.open(url,'_blank','noopener')}
  function importReferenced(){
    const state=readCMS();const media=stateMedia(state);const known=new Set(media.map(x=>x.url));const urls=[...new Set((state.posts||[]).map(p=>p.image).filter(Boolean))].filter(x=>!known.has(x));if(!urls.length){toast('No new referenced images to import.');return}urls.forEach((url,i)=>media.push({id:`media-${Date.now()+i}`,title:`Imported image ${media.length+i+1}`,url,type:'Image',alt:'',tags:['imported'],updated_at:new Date().toISOString()}));writeCMS(state);createSnapshot('Referenced media imported',true);toast(`Imported ${urls.length} image${urls.length===1?'':'s'}.`);renderMedia()}

  function history(){try{const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(h)?h:[]}catch{return []}}
  function cmsSignature(cms){try{return JSON.stringify(cms)}catch{return ''}}
  function createSnapshot(reason='Automatic snapshot',force=false){
    const cms=readCMS();const sig=cmsSignature(cms);const previous=localStorage.getItem(HISTORY_SIG_KEY)||'';if(!force&&(!sig||sig===previous))return false;const list=history();list.unshift({id:`rev-${Date.now()}`,created_at:new Date().toISOString(),reason,cms});localStorage.setItem(HISTORY_KEY,JSON.stringify(list.slice(0,MAX_HISTORY)));localStorage.setItem(HISTORY_SIG_KEY,sig);return true;
  }
  function installHistory(){
    const actions=document.querySelector('.topbar .top-actions');if(actions&&!actions.querySelector('[data-command-history]')){const b=document.createElement('button');b.className='command-history-trigger';b.dataset.commandHistory='1';b.textContent='History';b.onclick=openHistory;actions.prepend(b)}
    if(!document.getElementById('command-history-modal')){const modal=document.createElement('div');modal.id='command-history-modal';modal.className='command-history-modal';modal.hidden=true;modal.innerHTML=`<div class="command-history-backdrop"></div><div class="command-history-card"><div class="command-history-head"><div class="command-history-head-copy"><h3>Revision History</h3><small>Local CMS snapshots · newest first</small></div><div class="command-history-tools"><button class="btn" data-history-snapshot>Create snapshot</button><button class="command-history-close">×</button></div></div><div class="command-history-list" id="command-history-list"></div></div>`;document.body.appendChild(modal);modal.querySelector('.command-history-backdrop').onclick=closeHistory;modal.querySelector('.command-history-close').onclick=closeHistory;modal.querySelector('[data-history-snapshot]').onclick=()=>{createSnapshot('Manual snapshot',true);renderHistory();toast('Snapshot created.')}}
  }
  function openHistory(){installHistory();renderHistory();document.getElementById('command-history-modal').hidden=false}
  function closeHistory(){const m=document.getElementById('command-history-modal');if(m)m.hidden=true}
  function renderHistory(){const out=document.getElementById('command-history-list');if(!out)return;const list=history();out.innerHTML=list.length?list.map((rev,i)=>{const c=rev.cms||{};return `<div class="command-history-item"><div><b>${esc(rev.reason||'Snapshot')}</b><small>${esc(new Date(rev.created_at).toLocaleString())} · ${(c.posts||[]).length} posts · ${(c.pages||[]).length} pages · ${(c.media||[]).length} media</small></div><div class="command-history-item-actions"><button data-history-restore="${esc(rev.id)}">Restore</button>${i?`<button data-history-delete="${esc(rev.id)}">Delete</button>`:''}</div></div>`}).join(''):'<div class="command-history-empty">No snapshots yet. Create one before making a major change.</div>';out.querySelectorAll('[data-history-restore]').forEach(b=>b.onclick=()=>restoreSnapshot(b.dataset.historyRestore));out.querySelectorAll('[data-history-delete]').forEach(b=>b.onclick=()=>deleteSnapshot(b.dataset.historyDelete))}
  function restoreSnapshot(id){const rev=history().find(x=>x.id===id);if(!rev)return;if(!confirm(`Restore snapshot from ${new Date(rev.created_at).toLocaleString()}? Current local CMS data will be replaced.`))return;createSnapshot('Before revision restore',true);writeCMS(rev.cms);localStorage.setItem(HISTORY_SIG_KEY,cmsSignature(rev.cms));toast('Revision restored. Reloading…');setTimeout(()=>location.reload(),500)}
  function deleteSnapshot(id){localStorage.setItem(HISTORY_KEY,JSON.stringify(history().filter(x=>x.id!==id)));renderHistory()}

  function enhance(){installHistory();if(currentView()==='Media'){const active=document.querySelector('.view.active');if(active&&!active.querySelector('[data-media-workspace]'))renderMedia()}}
  function install(){installMediaDialog();installHistory();if(!history().length)createSnapshot('Initial CMS snapshot',true);else localStorage.setItem(HISTORY_SIG_KEY,cmsSignature(readCMS()));enhance();setInterval(()=>createSnapshot('Automatic snapshot'),15000)}
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!document.getElementById('command-media-dialog')?.hidden)closeMediaDialog();if(!document.getElementById('command-history-modal')?.hidden)closeHistory()}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
