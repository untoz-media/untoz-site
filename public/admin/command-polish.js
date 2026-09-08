(()=>{
  const CMS_KEY='untozCommandCMS';
  let lastMediaEditAt=0;
  const read=()=>{try{return JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{return {}}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));

  function navTo(view){document.querySelector(`.nav [data-view="${view}"]`)?.click()}
  function installCreateProxies(){
    if(!document.getElementById('command-create-proxies')){
      const wrap=document.createElement('div');wrap.id='command-create-proxies';wrap.hidden=true;
      wrap.innerHTML='<button data-action="new-post" data-command-proxy="post"></button><button data-action="new-page" data-command-proxy="page"></button>';
      document.body.appendChild(wrap);
      wrap.querySelector('[data-command-proxy="post"]').onclick=()=>{navTo('posts');setTimeout(()=>document.querySelector('.view.active [data-action="new-post"]:not([data-command-proxy])')?.click(),80)};
      wrap.querySelector('[data-command-proxy="page"]').onclick=()=>{navTo('pages');setTimeout(()=>document.querySelector('.view.active [data-action="new-page"]:not([data-command-proxy])')?.click(),80)};
    }
  }

  function enhancePalette(){
    const input=document.getElementById('command-palette-input'),out=document.getElementById('command-results');if(!input||!out)return;
    input.placeholder='Search posts, pages, media or commands…';
    out.querySelectorAll('[data-polish-media]').forEach(x=>x.remove());
    const q=input.value.trim().toLowerCase();if(!q)return;
    const media=(read().media||[]).filter(a=>`${a.title||''} ${a.alt||''} ${(a.tags||[]).join(' ')} ${a.url||''}`.toLowerCase().includes(q)).slice(0,4);
    media.forEach(asset=>{const b=document.createElement('button');b.className='command-result';b.dataset.polishMedia=String(asset.id||'');b.innerHTML=`<span class="command-result-icon">▧</span><span class="command-result-copy"><b>${esc(asset.title||'Untitled media')}</b><small>Media · ${esc(asset.type||'Image')}</small></span><span class="command-result-arrow">›</span>`;b.onclick=()=>{document.getElementById('command-modal').hidden=true;navTo('media');setTimeout(()=>{const search=document.querySelector('[data-media-search]');if(search){search.value=asset.title||asset.url||'';search.dispatchEvent(new Event('input',{bubbles:true}))}},100)};out.appendChild(b)})
  }

  function fixMediaToast(){
    const toast=document.getElementById('command-media-toast');if(!toast)return;
    if(Date.now()-lastMediaEditAt<2500&&toast.textContent==='Media added.')toast.textContent='Media updated.';
  }

  function shortcuts(e){
    if(!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='s')return;
    if(e.shiftKey){e.preventDefault();e.stopImmediatePropagation();document.getElementById('command-publish')?.click();return}
    const active=document.querySelector('.view.active');const save=active?.querySelector('[data-action="save-post"],[data-action="save-page"],[data-action="save-homepage"]');
    if(save){e.preventDefault();e.stopImmediatePropagation();save.click()}
  }

  function install(){
    installCreateProxies();
    document.addEventListener('keydown',shortcuts,true);
    document.addEventListener('click',e=>{if(e.target.closest('[data-media-save]')&&document.getElementById('command-media-dialog-title')?.textContent?.trim()==='Edit media')lastMediaEditAt=Date.now()},true);
    const obs=new MutationObserver(()=>requestAnimationFrame(()=>{installCreateProxies();enhancePalette();fixMediaToast()}));obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.addEventListener('input',e=>{if(e.target?.id==='command-palette-input')setTimeout(enhancePalette,0)},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
