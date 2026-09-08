(()=>{
  const CMS_KEY='untozCommandCMS',BASELINE_KEY='untozCommandLastPublishedCMS',ACTIVITY_KEY='untozCommandActivity';
  const read=(k,f={})=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}};
  const sig=v=>{try{return JSON.stringify(v??{})}catch{return''}};
  function changed(){const current=read(CMS_KEY,{}),baseline=read(BASELINE_KEY,null);if(!baseline)return !!current.siteConfig&&Object.keys(current.siteConfig).length>0;return sig(current.siteConfig)!==sig(baseline.siteConfig)}
  function log(reason){const list=read(ACTIVITY_KEY,[]);list.unshift({id:`act-${Date.now()}-shell`,at:new Date().toISOString(),action:'Site shell saved',detail:reason||'Menus, header, footer or site settings updated',icon:'⌘'});localStorage.setItem(ACTIVITY_KEY,JSON.stringify(list.slice(0,80)))}
  function enhance(){const center=document.querySelector('[data-publishing-center]');if(!center)return;const card=[...center.querySelectorAll('.command-pub-card')].find(x=>x.querySelector('h3')?.textContent.trim()==='Ready to publish');if(!card)return;const list=card.querySelector('.command-pub-status-list');if(!list)return;let row=list.querySelector('[data-shell-publish-change]');const dirty=changed();if(dirty&&!row){row=document.createElement('div');row.className='command-pub-change';row.dataset.shellPublishChange='1';row.innerHTML='<div><b>Site shell</b><small>Menus, header, footer, design or settings changed locally</small></div><span class="command-pub-pill warn">Changed</span>';list.appendChild(row)}else if(!dirty&&row)row.remove();if(dirty){const status=center.querySelector('.command-pub-stat strong');if(status)status.textContent='Pending';const pill=card.querySelector('.command-pub-pill');if(pill){pill.textContent='Changes pending';pill.classList.remove('good');pill.classList.add('warn')}}}
  window.addEventListener('untoz:site-config-saved',e=>{log(e.detail?.reason);setTimeout(enhance,40)});
  window.addEventListener('untoz:publish-success',()=>setTimeout(enhance,80));
  const obs=new MutationObserver(()=>requestAnimationFrame(enhance));obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
