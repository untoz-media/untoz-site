(()=>{
  const KEY='untozHomepageExperience';
  const nativeFetch=window.fetch.bind(window);
  const scriptBase=new URL('.',document.currentScript?.src||location.href);
  const homepageUrl=new URL('../../content/homepage.json',scriptBase);
  const siteHome=new URL('../../',scriptBase);
  const defaults={
    manifesto:{eyebrow:'THIS IS UNTOZ',title:'Everything we do.',accent:'For everyone.',body:'We create stories, products, broadcasts and experiences across entertainment, news, sport and technology — connected by one idea: make media feel exciting again.'},
    brandRail:['Untoz+','Untoz News','Untoz Sports','Untoz Gaming','Untoz Pop','Untoz Kids','Untoz Space','Untoz Archives','Task Movies','Oiko'],
    productions:[
      {brand:'worldunited',eyebrow:'LIVE EVENT · AMSTERDAM',title:'WorldUnited 2026',tagline:'A WORLD OF SOUND',url:'https://worldunited.untoz.site/'},
      {brand:'awards',eyebrow:'AWARDS · SYDNEY',title:'Untoz Awards 2027',tagline:'CATCH THE LIGHT',url:'https://awards.untoz.site/'},
      {brand:'kids',eyebrow:'UNTOZ KIDS',title:'Lila & Bobo',tagline:'Small adventures. Big imagination.',url:'./kids/'}
    ],
    products:[
      {brand:'aura',eyebrow:'LOCAL AI ASSISTANT',title:'AURA-1',body:'Your computer, finally working with you.',url:'https://aura.untoz.site/'},
      {brand:'clip',eyebrow:'CREATOR SOFTWARE',title:'Untoz Clip',body:'Capture, clip and turn moments into content.',url:'https://github.com/untoz-media/untoz-clip'},
      {brand:'plus',eyebrow:'STREAMING PLATFORM',title:'Untoz+',body:'Entertainment, channels and events in one place.',url:'https://untozplus.com/'}
    ],
    stats:[{value:'10+',label:'brands & projects'},{value:'24/7',label:'digital media'},{value:'∞',label:'possibilities'}],
    finalCta:{eyebrow:'UNTOZ',title:'Media should feel',accent:'alive.',body:'Watch it. Read it. Build it. Experience it.',button:'Explore Untoz →',url:'#explore'}
  };

  const clone=value=>JSON.parse(JSON.stringify(value));
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')||clone(defaults)}catch{return clone(defaults)}};
  const save=value=>{localStorage.setItem(KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent('untoz:homepage-experience-change',{detail:{experience:value}}));};
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  async function fetchLiveExperience(force=false){
    if(!force&&localStorage.getItem(KEY))return read();
    try{
      const response=await nativeFetch(homepageUrl,{cache:'no-store'});
      if(!response.ok)throw new Error('Could not load homepage experience.');
      const json=await response.json();
      if(json?.experience&&typeof json.experience==='object'){save({...clone(defaults),...json.experience});return read();}
    }catch{}
    if(!localStorage.getItem(KEY))save(clone(defaults));
    return read();
  }

  function preserveExperienceInPublish(input,init){
    const url=typeof input==='string'?input:input?.url||'';
    if(!String(url).includes('/api/public/publish')||!init?.body)return init;
    try{
      const payload=JSON.parse(init.body);
      if(!Array.isArray(payload.files))return init;
      const file=payload.files.find(item=>item?.path==='content/homepage.json');
      if(!file||typeof file.content!=='string')return init;
      const homepage=JSON.parse(file.content);
      homepage.version=2;
      homepage.experience=read();
      file.content=JSON.stringify(homepage,null,2)+'\n';
      return {...init,body:JSON.stringify(payload)};
    }catch{return init;}
  }

  window.fetch=(input,init)=>nativeFetch(input,preserveExperienceInPublish(input,init));

  function setPath(root,path,value){
    const parts=path.split('.');let cursor=root;
    for(let i=0;i<parts.length-1;i++){
      const part=parts[i];
      const key=/^\d+$/.test(part)?Number(part):part;
      if(cursor[key]==null)cursor[key]={};
      cursor=cursor[key];
    }
    const last=parts.at(-1);cursor[/^\d+$/.test(last)?Number(last):last]=value;
  }

  const field=(label,path,value,type='input')=>`<label class="hx-field"><span>${esc(label)}</span>${type==='textarea'?`<textarea data-hx-path="${esc(path)}">${esc(value)}</textarea>`:`<input data-hx-path="${esc(path)}" value="${esc(value)}">`}</label>`;

  function renderEditor(){
    const builder=document.querySelector('.builder');
    if(!builder||document.querySelector('.hx-panel'))return;
    const x=read();
    const panel=document.createElement('section');
    panel.className='hx-panel';
    panel.innerHTML=`
      <div class="hx-head"><div><div class="eyebrow">Homepage V2</div><h2>Experience Layer</h2><p>Brand identity, featured productions, products and the final homepage statement.</p></div><div class="hx-head-actions"><span class="hx-safe">PUBLISH-SAFE</span><button class="btn" data-hx-live>Reload live</button><button class="btn primary" data-hx-preview>Preview site ↗</button></div></div>
      <div class="hx-grid">
        <details open><summary>Manifesto</summary><div class="hx-fields">${field('Eyebrow','manifesto.eyebrow',x.manifesto.eyebrow)}${field('Title','manifesto.title',x.manifesto.title)}${field('Accent line','manifesto.accent',x.manifesto.accent)}${field('Body','manifesto.body',x.manifesto.body,'textarea')}</div></details>
        <details><summary>Brand rail</summary><div class="hx-fields">${field('Brands — separate with commas','brandRail',x.brandRail.join(', '),'textarea')}</div></details>
        <details open><summary>Featured Productions</summary><div class="hx-card-grid">${x.productions.slice(0,3).map((item,i)=>`<div class="hx-card"><b>0${i+1} · ${esc(item.brand)}</b>${field('Eyebrow',`productions.${i}.eyebrow`,item.eyebrow)}${field('Title',`productions.${i}.title`,item.title)}${field('Tagline',`productions.${i}.tagline`,item.tagline)}${field('URL',`productions.${i}.url`,item.url)}</div>`).join('')}</div></details>
        <details open><summary>Untoz Products</summary><div class="hx-card-grid">${x.products.slice(0,3).map((item,i)=>`<div class="hx-card"><b>0${i+1} · ${esc(item.brand)}</b>${field('Eyebrow',`products.${i}.eyebrow`,item.eyebrow)}${field('Title',`products.${i}.title`,item.title)}${field('Description',`products.${i}.body`,item.body,'textarea')}${field('URL',`products.${i}.url`,item.url)}</div>`).join('')}</div></details>
        <details><summary>By the Numbers</summary><div class="hx-card-grid">${x.stats.slice(0,3).map((item,i)=>`<div class="hx-card"><b>STAT 0${i+1}</b>${field('Value',`stats.${i}.value`,item.value)}${field('Label',`stats.${i}.label`,item.label)}</div>`).join('')}</div></details>
        <details><summary>Final CTA</summary><div class="hx-fields">${field('Eyebrow','finalCta.eyebrow',x.finalCta.eyebrow)}${field('Title','finalCta.title',x.finalCta.title)}${field('Accent','finalCta.accent',x.finalCta.accent)}${field('Body','finalCta.body',x.finalCta.body)}${field('Button','finalCta.button',x.finalCta.button)}${field('URL','finalCta.url',x.finalCta.url)}</div></details>
      </div>
      <div class="hx-foot"><span>Changes are saved locally as you type and merged into <code>content/homepage.json</code> when Untoz Command publishes.</span><strong data-hx-status>Saved locally</strong></div>`;
    builder.insertAdjacentElement('afterend',panel);

    panel.querySelectorAll('[data-hx-path]').forEach(input=>input.addEventListener('input',()=>{
      const next=read();
      if(input.dataset.hxPath==='brandRail')next.brandRail=input.value.split(',').map(v=>v.trim()).filter(Boolean);
      else setPath(next,input.dataset.hxPath,input.value);
      save(next);
      const status=panel.querySelector('[data-hx-status]');if(status){status.textContent='Saved · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}
    }));
    panel.querySelector('[data-hx-preview]')?.addEventListener('click',()=>window.open(siteHome.href,'_blank'));
    panel.querySelector('[data-hx-live]')?.addEventListener('click',async()=>{if(!confirm('Reload the Homepage Experience from the live site? Local experience edits will be replaced.'))return;await fetchLiveExperience(true);panel.remove();renderEditor();});
  }

  function watchBuilder(){
    renderEditor();
    new MutationObserver(()=>renderEditor()).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  }

  window.addEventListener('untoz:sync-success',()=>fetchLiveExperience(true));
  window.UntozHomepageExperience={read,save,defaults:clone(defaults),reload:()=>fetchLiveExperience(true)};
  fetchLiveExperience(false);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchBuilder,{once:true});else watchBuilder();
})();
