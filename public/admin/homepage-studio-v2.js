(()=>{
  const CMS_KEY='untozCommandCMS';
  const scriptBase=new URL('.',document.currentScript?.src||location.href);
  const siteHome=new URL('../../',scriptBase);
  const SECTION_META={
    manifesto:{label:'Manifesto',icon:'M',hint:'Core statement',number:'01'},
    brandRail:{label:'Brand rail',icon:'B',hint:'Network identity',number:'02'},
    productions:{label:'Productions',icon:'P',hint:'Featured work',number:'03'},
    products:{label:'Products',icon:'U',hint:'Untoz software',number:'04'},
    stats:{label:'By the Numbers',icon:'#',hint:'Proof points',number:'05'},
    finalCta:{label:'Final CTA',icon:'→',hint:'Closing statement',number:'06'}
  };
  let activeTab='experience';
  let activeSection='manifesto';
  let previewDevice='desktop';
  let scheduled=false;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const readCMS=()=>{try{return JSON.parse(localStorage.getItem(CMS_KEY)||'{}')}catch{return {}}};
  const api=()=>window.UntozHomepageExperience;
  const readExperience=()=>api()?.read?.()||{};
  const saveExperience=value=>api()?.save?.(value);

  function setPath(root,path,value){
    const parts=path.split('.');let cursor=root;
    for(let i=0;i<parts.length-1;i++){
      const raw=parts[i],key=/^\d+$/.test(raw)?Number(raw):raw;
      if(cursor[key]==null)cursor[key]={};
      cursor=cursor[key];
    }
    const raw=parts.at(-1),key=/^\d+$/.test(raw)?Number(raw):raw;
    cursor[key]=value;
  }

  const field=(label,path,value,{textarea=false,full=false,placeholder=''}={})=>`<label class="hs-field ${full?'full':''}"><span>${esc(label)}</span>${textarea?`<textarea data-hs-path="${esc(path)}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:`<input data-hs-path="${esc(path)}" value="${esc(value)}" placeholder="${esc(placeholder)}">`}</label>`;

  function isHomepageActive(){
    const title=document.querySelector('.topbar h1')?.textContent?.trim();
    return title==='Homepage Builder'&&!!document.querySelector('.builder');
  }

  function sourceBuilder(){return document.querySelector('.builder')}
  function legacyExperience(){return document.querySelector('.hx-panel')}

  function statusTime(){return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}

  function heroTitle(){
    const cms=readCMS();
    const hero=(cms.homepage||[]).find(block=>String(block.type||'').toLowerCase()==='hero')||(cms.homepage||[])[0];
    return {title:hero?.props?.title||'Untoz',subtitle:hero?.props?.subtitle||'Media, entertainment and technology.'};
  }

  function sectionRail(){
    return `<aside class="hs-section-rail"><div class="hs-rail-label">Homepage sections</div>${Object.entries(SECTION_META).map(([id,m])=>`<button class="hs-section-btn ${activeSection===id?'active':''}" data-hs-section="${id}"><i>${esc(m.icon)}</i><span><b>${esc(m.label)}</b><small>${esc(m.hint)}</small></span></button>`).join('')}</aside>`;
  }

  function manifestoEditor(x){return `<div class="hs-form">${field('Eyebrow','manifesto.eyebrow',x.manifesto?.eyebrow||'')}${field('Title','manifesto.title',x.manifesto?.title||'')}${field('Accent line','manifesto.accent',x.manifesto?.accent||'')}${field('Body copy','manifesto.body',x.manifesto?.body||'',{textarea:true,full:true})}</div>`}

  function brandRailEditor(x){
    const value=(x.brandRail||[]).join(', ');
    return `<div class="hs-form"><div class="hs-rail-editor">${field('Brands — separate with commas','brandRail',value,{textarea:true,full:true})}<div class="hs-brand-chips">${(x.brandRail||[]).map(name=>`<span class="hs-brand-chip">${esc(name)}</span>`).join('')}</div></div></div>`;
  }

  function collectionEditor(items,prefix,kind){
    const rows=(items||[]).slice(0,3);
    return `<div class="hs-form"><div class="hs-array-grid">${rows.map((item,i)=>`<article class="hs-array-card"><div class="hs-array-card-head"><b>${String(i+1).padStart(2,'0')} · ${esc(item.title||kind)}</b><span>${esc(item.brand||kind)}</span></div><div class="hs-form">${field('Eyebrow',`${prefix}.${i}.eyebrow`,item.eyebrow||'')}${field('Title',`${prefix}.${i}.title`,item.title||'')}${prefix==='productions'?field('Tagline',`${prefix}.${i}.tagline`,item.tagline||'',{full:true}):field('Description',`${prefix}.${i}.body`,item.body||'',{textarea:true,full:true})}${field('URL',`${prefix}.${i}.url`,item.url||'',{full:true})}</div></article>`).join('')}</div></div>`;
  }

  function statsEditor(x){
    return `<div class="hs-form"><div class="hs-array-grid">${(x.stats||[]).slice(0,3).map((item,i)=>`<article class="hs-array-card"><div class="hs-array-card-head"><b>STAT ${String(i+1).padStart(2,'0')}</b><span>Metric</span></div><div class="hs-form">${field('Value',`stats.${i}.value`,item.value||'')}${field('Label',`stats.${i}.label`,item.label||'')}</div></article>`).join('')}</div></div>`;
  }

  function finalCtaEditor(x){return `<div class="hs-form">${field('Eyebrow','finalCta.eyebrow',x.finalCta?.eyebrow||'')}${field('Title','finalCta.title',x.finalCta?.title||'')}${field('Accent','finalCta.accent',x.finalCta?.accent||'')}${field('Body','finalCta.body',x.finalCta?.body||'',{full:true})}${field('Button label','finalCta.button',x.finalCta?.button||'')}${field('URL','finalCta.url',x.finalCta?.url||'')}</div>`}

  function editorFor(section,x){
    if(section==='manifesto')return manifestoEditor(x);
    if(section==='brandRail')return brandRailEditor(x);
    if(section==='productions')return collectionEditor(x.productions,'productions','Production');
    if(section==='products')return collectionEditor(x.products,'products','Product');
    if(section==='stats')return statsEditor(x);
    return finalCtaEditor(x);
  }

  function targetPreview(section,x){
    if(section==='manifesto')return `<div class="hs-mini-stage"><div class="hs-mini-eyebrow">${esc(x.manifesto?.eyebrow||'THIS IS UNTOZ')}</div><h4>${esc(x.manifesto?.title||'Everything we do.')} <em>${esc(x.manifesto?.accent||'For everyone.')}</em></h4><p>${esc(x.manifesto?.body||'')}</p></div>`;
    if(section==='brandRail')return `<div class="hs-mini-stage dark"><div class="hs-mini-eyebrow">UNTOZ NETWORK</div><h4>One company. <em>Many worlds.</em></h4><div class="hs-brand-chips">${(x.brandRail||[]).map(name=>`<span class="hs-brand-chip">${esc(name)}</span>`).join('')}</div></div>`;
    if(section==='productions')return `<div class="hs-mini-stage"><div class="hs-mini-eyebrow">FEATURED PRODUCTIONS</div><h4>Made by <em>Untoz.</em></h4><div class="hs-mini-grid">${(x.productions||[]).slice(0,3).map(item=>`<div class="hs-mini-tile"><small>${esc(item.eyebrow||'')}</small><b>${esc(item.title||'')}</b></div>`).join('')}</div></div>`;
    if(section==='products')return `<div class="hs-mini-stage"><div class="hs-mini-eyebrow">UNTOZ PRODUCTS</div><h4>Tools that <em>move.</em></h4><div class="hs-mini-grid">${(x.products||[]).slice(0,3).map(item=>`<div class="hs-mini-tile"><small>${esc(item.eyebrow||'')}</small><b>${esc(item.title||'')}</b></div>`).join('')}</div></div>`;
    if(section==='stats')return `<div class="hs-mini-stage"><div class="hs-mini-eyebrow">BY THE NUMBERS</div><h4>Built to <em>grow.</em></h4><div class="hs-mini-stats">${(x.stats||[]).slice(0,3).map(item=>`<div class="hs-mini-stat"><strong>${esc(item.value||'')}</strong><span>${esc(item.label||'')}</span></div>`).join('')}</div></div>`;
    return `<div class="hs-mini-stage dark"><div class="hs-mini-eyebrow">${esc(x.finalCta?.eyebrow||'UNTOZ')}</div><h4>${esc(x.finalCta?.title||'Media should feel')} <em>${esc(x.finalCta?.accent||'alive.')}</em></h4><p>${esc(x.finalCta?.body||'')}</p></div>`;
  }

  function experienceView(){
    const x=readExperience();const meta=SECTION_META[activeSection];
    return `<div class="hs-experience-layout">${sectionRail()}<main class="hs-editor"><div class="hs-editor-head"><div><div class="hs-kicker">Experience layer</div><h3>${esc(meta.label)}</h3><p>${esc(meta.hint)} · changes save locally as you type.</p></div><div class="hs-editor-number">${esc(meta.number)}</div></div>${editorFor(activeSection,x)}</main><aside class="hs-target-preview"><div class="hs-preview-label"><span>Section preview</span><span>LOCAL</span></div><div class="hs-preview-card"><div class="hs-mini-browser"><i></i><i></i><i></i></div><div data-hs-target-preview>${targetPreview(activeSection,x)}</div></div></aside></div>`;
  }

  function fullPreview(x){
    const hero=heroTitle();
    return `<div class="hs-full-preview"><div class="hs-preview-toolbar"><div><div class="hs-kicker">Local composition</div><strong>Unsaved homepage preview</strong></div><div class="hs-device-switch"><button class="${previewDevice==='desktop'?'active':''}" data-hs-device="desktop">Desktop</button><button class="${previewDevice==='mobile'?'active':''}" data-hs-device="mobile">Mobile</button></div></div><div class="hs-page-frame ${previewDevice==='mobile'?'mobile':''}" data-hs-page-frame><div class="hs-page-top"><span class="hs-page-logo">untoz</span><span>MEDIA · TECHNOLOGY · ENTERTAINMENT</span></div><section class="hs-page-hero"><small>UNTOZ / HOMEPAGE</small><h3>${esc(hero.title)}</h3><p>${esc(hero.subtitle)}</p></section><section class="hs-page-section"><small>${esc(x.manifesto?.eyebrow||'THIS IS UNTOZ')}</small><h3>${esc(x.manifesto?.title||'Everything we do.')} <em>${esc(x.manifesto?.accent||'For everyone.')}</em></h3><p>${esc(x.manifesto?.body||'')}</p></section><section class="hs-page-section"><small>FEATURED PRODUCTIONS</small><h3>Stories. Events. <em>Experiences.</em></h3><div class="hs-page-cards">${(x.productions||[]).slice(0,3).map(item=>`<div class="hs-page-card"><small>${esc(item.eyebrow||'')}</small><b>${esc(item.title||'')}</b><span>${esc(item.tagline||'')}</span></div>`).join('')}</div></section><section class="hs-page-section hs-page-products"><small>UNTOZ PRODUCTS</small><h3>Built by <em>Untoz.</em></h3><div class="hs-page-cards">${(x.products||[]).slice(0,3).map(item=>`<div class="hs-page-card"><small>${esc(item.eyebrow||'')}</small><b>${esc(item.title||'')}</b><span>${esc(item.body||'')}</span></div>`).join('')}</div></section><section class="hs-page-section"><small>BY THE NUMBERS</small><div class="hs-page-numbers">${(x.stats||[]).slice(0,3).map(item=>`<div class="hs-page-number"><strong>${esc(item.value||'')}</strong><span>${esc(item.label||'')}</span></div>`).join('')}</div></section><section class="hs-page-final"><small>${esc(x.finalCta?.eyebrow||'UNTOZ')}</small><h3>${esc(x.finalCta?.title||'Media should feel')} <em>${esc(x.finalCta?.accent||'alive.')}</em></h3><p>${esc(x.finalCta?.body||'')}</p><b>${esc(x.finalCta?.button||'Explore Untoz →')}</b></section></div></div>`;
  }

  function workspace(){
    if(activeTab==='structure'){
      const count=(readCMS().homepage||[]).length;
      return `<div class="hs-structure-intro"><div><div class="hs-kicker">Structure</div><h3>Build the page with real Untoz blocks.</h3><p>The production builder remains underneath this Studio tab, so every existing drag, edit, duplicate and delete action keeps working.</p></div><div class="hs-structure-count"><strong>${count}</strong><span>blocks</span></div></div>`;
    }
    if(activeTab==='preview')return fullPreview(readExperience());
    return experienceView();
  }

  function studioTemplate(){
    const lastSync=localStorage.getItem('untozCommandLastSync');
    return `<section class="hs-studio" data-homepage-studio><header class="hs-hero"><div class="hs-hero-copy"><div class="hs-kicker">Untoz Command · Homepage</div><h2>Homepage Studio</h2><p>Shape the structure, identity and final composition of untoz.site from one focused workspace.</p></div><div class="hs-hero-actions"><button class="hs-btn dark" data-hs-sync>↻ Sync live</button><button class="hs-btn dark" data-hs-open-live>Open live ↗</button><button class="hs-btn primary" data-hs-publish>Publish homepage ↑</button></div></header><nav class="hs-tabs" aria-label="Homepage Studio modes"><button class="hs-tab ${activeTab==='structure'?'active':''}" data-hs-tab="structure">Structure <span>BLOCKS</span></button><button class="hs-tab ${activeTab==='experience'?'active':''}" data-hs-tab="experience">Experience <span>V2</span></button><button class="hs-tab ${activeTab==='preview'?'active':''}" data-hs-tab="preview">Preview <span>LOCAL</span></button></nav><div class="hs-statusbar"><div class="hs-statusbar-left"><span class="hs-pill">Local draft</span><span class="hs-pill safe">Publish safe</span><span>Experience is preserved inside <code>content/homepage.json</code>.</span></div><div class="hs-statusbar-right"><span>${lastSync?`Last sync · ${esc(new Date(lastSync).toLocaleString())}`:'Not synced this session'}</span><strong data-hs-save-status>Ready</strong></div></div><div class="hs-workspace" data-hs-workspace>${workspace()}</div></section>`;
  }

  function syncSourceVisibility(){
    const builder=sourceBuilder();const legacy=legacyExperience();
    if(builder)builder.classList.add('hs-source-builder');
    if(legacy)legacy.classList.add('hs-legacy-experience');
    document.body.classList.toggle('hs-tab-structure',activeTab==='structure');
    document.body.classList.toggle('hs-tab-experience',activeTab==='experience');
    document.body.classList.toggle('hs-tab-preview',activeTab==='preview');
  }

  function bindStudio(studio){
    studio.addEventListener('click',event=>{
      const tab=event.target.closest('[data-hs-tab]');
      if(tab){activeTab=tab.dataset.hsTab;renderStudio();return;}
      const section=event.target.closest('[data-hs-section]');
      if(section){activeSection=section.dataset.hsSection;renderStudio();return;}
      const device=event.target.closest('[data-hs-device]');
      if(device){previewDevice=device.dataset.hsDevice;renderStudio();return;}
      if(event.target.closest('[data-hs-open-live]'))window.open(siteHome.href,'_blank','noopener');
      if(event.target.closest('[data-hs-sync]'))document.getElementById('command-sync')?.click();
      if(event.target.closest('[data-hs-publish]'))document.getElementById('command-publish')?.click();
    });
    studio.addEventListener('input',event=>{
      const input=event.target.closest('[data-hs-path]');if(!input)return;
      const next=readExperience();
      if(input.dataset.hsPath==='brandRail')next.brandRail=input.value.split(',').map(v=>v.trim()).filter(Boolean);
      else setPath(next,input.dataset.hsPath,input.value);
      saveExperience(next);
      const status=studio.querySelector('[data-hs-save-status]');if(status)status.textContent='Saved · '+statusTime();
      const preview=studio.querySelector('[data-hs-target-preview]');if(preview)preview.innerHTML=targetPreview(activeSection,next);
    });
  }

  function renderStudio(){
    const old=document.querySelector('[data-homepage-studio]');if(old)old.remove();
    if(!isHomepageActive())return;
    const builder=sourceBuilder();if(!builder)return;
    const wrap=document.createElement('div');wrap.innerHTML=studioTemplate();const studio=wrap.firstElementChild;
    builder.insertAdjacentElement('beforebegin',studio);bindStudio(studio);syncSourceVisibility();
  }

  function enhance(){
    scheduled=false;
    if(isHomepageActive()){
      const builder=sourceBuilder(),legacy=legacyExperience();
      if(builder)builder.classList.add('hs-source-builder');
      if(legacy)legacy.classList.add('hs-legacy-experience');
      if(!document.querySelector('[data-homepage-studio]'))renderStudio();
      else syncSourceVisibility();
    }else{
      document.querySelector('[data-homepage-studio]')?.remove();
      document.body.classList.remove('hs-tab-structure','hs-tab-experience','hs-tab-preview');
    }
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('untoz:homepage-experience-change',()=>{if(activeTab==='preview')renderStudio()});
  window.addEventListener('untoz:sync-success',()=>setTimeout(renderStudio,80));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
})();
