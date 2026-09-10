(()=>{
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
    stats:[
      {value:'10+',label:'brands & projects'},
      {value:'24/7',label:'digital media'},
      {value:'∞',label:'possibilities'}
    ],
    finalCta:{eyebrow:'UNTOZ',title:'Media should feel',accent:'alive.',body:'Watch it. Read it. Build it. Experience it.',button:'Explore Untoz →',url:'#explore'}
  };

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeHref=value=>{
    const input=String(value||'').trim();
    if(!input)return '#';
    if(input.startsWith('#')||input.startsWith('./')||input.startsWith('../')||input.startsWith('/'))return input;
    try{const url=new URL(input,location.href);return ['http:','https:','mailto:'].includes(url.protocol)?url.href:'#';}catch{return '#';}
  };
  const merge=(base,custom)=>({...base,...(custom&&typeof custom==='object'?custom:{})});

  async function loadConfig(){
    try{
      const response=await fetch(new URL('content/homepage.json',location.href),{cache:'no-store'});
      if(!response.ok)return defaults;
      const json=await response.json();
      const custom=json?.experience||{};
      return {
        ...defaults,
        ...custom,
        manifesto:merge(defaults.manifesto,custom.manifesto),
        finalCta:merge(defaults.finalCta,custom.finalCta),
        brandRail:Array.isArray(custom.brandRail)&&custom.brandRail.length?custom.brandRail:defaults.brandRail,
        productions:Array.isArray(custom.productions)&&custom.productions.length?custom.productions:defaults.productions,
        products:Array.isArray(custom.products)&&custom.products.length?custom.products:defaults.products,
        stats:Array.isArray(custom.stats)&&custom.stats.length?custom.stats:defaults.stats
      };
    }catch{return defaults;}
  }

  function productionArt(brand){
    if(brand==='worldunited')return `<div class="v2p-art v2p-art-world" aria-hidden="true"><span class="v2p-world-word">WORLD<br>UNITED</span><span class="v2p-world-orbit a"></span><span class="v2p-world-orbit b"></span><span class="v2p-world-orbit c"></span><span class="v2p-world-dot d1"></span><span class="v2p-world-dot d2"></span><span class="v2p-world-dot d3"></span></div>`;
    if(brand==='awards')return `<div class="v2p-art v2p-art-awards" aria-hidden="true"><span class="v2p-prism p1"></span><span class="v2p-prism p2"></span><span class="v2p-prism p3"></span><span class="v2p-awards-year">2027</span><span class="v2p-awards-label">PRISMA</span></div>`;
    return `<div class="v2p-art v2p-art-kids" aria-hidden="true"><span class="v2p-kids-sun"></span><span class="v2p-kids-blob b1"></span><span class="v2p-kids-blob b2"></span><span class="v2p-kids-blob b3"></span><span class="v2p-kids-name">LILA<br>&amp; BOBO</span></div>`;
  }

  function renderProductions(config){
    const section=document.querySelector('.v2-productions');
    if(!section)return;
    const grid=section.querySelector('.v2-production-grid');
    if(!grid)return;
    grid.innerHTML=config.productions.map((item,index)=>{
      const brand=['worldunited','awards','kids'].includes(item.brand)?item.brand:'worldunited';
      return `<a class="v2-production-card v2p-production ${index===0?'v2-production-wide':''}" data-production="${esc(brand)}" href="${esc(safeHref(item.url))}">${productionArt(brand)}<div class="v2p-production-copy"><small>${esc(item.eyebrow)}</small><h3>${esc(item.title)}</h3><p>${esc(item.tagline)}</p></div><b aria-hidden="true">↗</b></a>`;
    }).join('');
  }

  function renderProducts(config){
    const list=document.querySelector('.v2-product-list');
    if(!list)return;
    const marks={aura:'A',clip:'C',plus:'+'};
    list.innerHTML=config.products.map((item,index)=>{
      const brand=['aura','clip','plus'].includes(item.brand)?item.brand:'plus';
      return `<a href="${esc(safeHref(item.url))}" class="v2-product v2p-product" data-product="${brand}"><span>0${index+1}</span><i>${marks[brand]}</i><div><small>${esc(item.eyebrow)}</small><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></div><b aria-hidden="true">↗</b></a>`;
    }).join('');
  }

  function renderManifesto(config){
    const block=document.querySelector('.v2-manifesto');
    if(!block)return;
    block.innerHTML=`<span class="v2-infinity">∞</span><div><small>${esc(config.manifesto.eyebrow)}</small><h2>${esc(config.manifesto.title)}<br><em>${esc(config.manifesto.accent)}</em></h2></div><p>${esc(config.manifesto.body)}</p>`;
  }

  function renderStats(config){
    const section=document.querySelector('.v2-numbers');
    if(!section)return;
    section.innerHTML=`<div><small>BY THE NUMBERS</small><h2>Built to keep growing.</h2></div>${config.stats.slice(0,3).map(stat=>`<div><strong>${esc(stat.value)}</strong><span>${esc(stat.label)}</span></div>`).join('')}`;
  }

  function renderFinalCta(config){
    const cta=document.querySelector('.v2-final-cta');
    if(!cta)return;
    cta.innerHTML=`<small>${esc(config.finalCta.eyebrow)}</small><h2>${esc(config.finalCta.title)}<br><em>${esc(config.finalCta.accent)}</em></h2><div><p>${esc(config.finalCta.body)}</p><a href="${esc(safeHref(config.finalCta.url))}">${esc(config.finalCta.button)}</a></div>`;
  }

  function addBrandRail(config){
    const manifesto=document.querySelector('.v2-manifesto');
    if(!manifesto||document.querySelector('.v2p-brand-rail'))return;
    const rail=document.createElement('section');
    rail.className='v2p-brand-rail';
    const items=config.brandRail.map(name=>`<span>${esc(name)}</span><i>✦</i>`).join('');
    rail.innerHTML=`<div class="v2p-rail-track">${items}${items}</div>`;
    manifesto.insertAdjacentElement('afterend',rail);
  }

  function enhanceHero(){
    const hero=document.querySelector('.v2-hero');
    if(!hero||hero.querySelector('.v2p-hero-signature'))return;
    hero.insertAdjacentHTML('beforeend',`<div class="v2p-hero-signature" aria-hidden="true"><span>UNTOZ / 2026</span><b>MEDIA</b><b>TECHNOLOGY</b><b>ENTERTAINMENT</b></div><div class="v2p-hero-bars" aria-hidden="true"><i></i><i></i><i></i></div>`);
  }

  function wireMotion(){
    const targets=document.querySelectorAll('.v2-manifesto,.v2p-brand-rail,.stories,.v2-productions,.v2-products,.v2-network,.v2-numbers,.lower,.v2-final-cta');
    targets.forEach((node,index)=>{node.dataset.reveal='';node.style.setProperty('--reveal-delay',`${Math.min(index*35,180)}ms`)});
    if(!('IntersectionObserver'in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){targets.forEach(node=>node.classList.add('is-visible'));return;}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -7%'});
    targets.forEach(node=>observer.observe(node));
  }

  function wireSpotlights(){
    if(matchMedia('(pointer: coarse)').matches)return;
    document.querySelectorAll('.v2p-production,.v2p-product').forEach(card=>{
      card.addEventListener('pointermove',event=>{
        const rect=card.getBoundingClientRect();
        card.style.setProperty('--mx',`${event.clientX-rect.left}px`);
        card.style.setProperty('--my',`${event.clientY-rect.top}px`);
      });
    });
  }

  function markNetwork(){
    const names=['pop','sports','gaming','space','kids','archives'];
    document.querySelectorAll('.v2-network-card').forEach((card,index)=>card.dataset.brand=names[index]||'untoz');
  }

  async function run(){
    const shell=document.getElementById('top');
    if(!shell||shell.dataset.homeV2Phase2==='ready')return;
    shell.dataset.homeV2Phase2='ready';
    shell.classList.add('untoz-v2-phase2');
    const config=await loadConfig();
    enhanceHero();
    renderManifesto(config);
    addBrandRail(config);
    renderProductions(config);
    renderProducts(config);
    renderStats(config);
    renderFinalCta(config);
    markNetwork();
    wireMotion();
    wireSpotlights();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
