(()=>{
  const run=()=>{
    const shell=document.getElementById('top');
    const page=document.querySelector('.page');
    const footer=document.getElementById('footer');
    if(!shell||!page||!footer||shell.dataset.homeV2==='ready')return;
    shell.dataset.homeV2='ready';
    shell.classList.add('untoz-v2');
    page.classList.add('v2-page');

    const hero=document.querySelector('.hero');
    if(hero){
      hero.classList.add('v2-hero');
      hero.dataset.accent='blue';
      hero.setAttribute('aria-roledescription','carousel');
      hero.setAttribute('aria-label','Featured Untoz stories');
      const copy=hero.querySelector('.hero-copy');
      copy?.classList.add('v2-hero-copy');
      hero.querySelector('.hero-kicker')?.classList.add('v2-hero-side');
      document.getElementById('heroPrev')?.setAttribute('aria-label','Previous featured slide');
      document.getElementById('heroNext')?.setAttribute('aria-label','Next featured slide');
    }

    const live=document.querySelector('.live-strip');
    live?.classList.add('v2-live');

    const manifesto=document.createElement('section');
    manifesto.className='v2-manifesto';
    manifesto.innerHTML=`<span class="v2-infinity">∞</span><div><small>THIS IS UNTOZ</small><h2>Everything we do.<br><em>For everyone.</em></h2></div><p>We create stories, products, broadcasts and experiences across entertainment, news, sport and technology — connected by one idea: make media feel exciting again.</p>`;
    live?.insertAdjacentElement('afterend',manifesto);

    const explore=document.getElementById('explore');
    if(explore){
      explore.classList.add('v2-network');
      const h=explore.querySelector('.section-title h2'); if(h)h.textContent='One company. Many worlds.';
      const a=explore.querySelector('.section-title a'); if(a)a.textContent='Explore the universe ↗';
      explore.querySelectorAll('.explore-card').forEach((card,i)=>{card.classList.add('v2-network-card');card.insertAdjacentHTML('afterbegin',`<small>0${i+1}</small>`)});
    }

    const productions=document.createElement('section');
    productions.className='section v2-productions';
    productions.id='productions';
    productions.innerHTML=`
      <div class="v2-section-head"><div><small>FEATURED PRODUCTIONS</small><h2>Made by Untoz.</h2></div><a class="v2-section-action" href="#universe">View all productions →</a></div>
      <div class="v2-production-grid">
        <a class="v2-production-card v2-production-wide" href="https://worldunited.untoz.site/"><div><small>LIVE EVENT · AMSTERDAM</small><h3>WorldUnited 2026</h3><p>A WORLD OF SOUND</p></div><b>↗</b></a>
        <a class="v2-production-card" href="https://awards.untoz.site/"><div><small>AWARDS · SYDNEY</small><h3>Untoz Awards 2027</h3><p>CATCH THE LIGHT</p></div><b>↗</b></a>
        <a class="v2-production-card" href="./kids/"><div><small>UNTOZ KIDS</small><h3>Lila & Bobo</h3><p>Small adventures. Big imagination.</p></div><b>↗</b></a>
      </div>`;
    document.getElementById('featured')?.insertAdjacentElement('beforebegin',productions);

    const products=document.createElement('section');
    products.className='v2-products';
    products.id='products';
    products.innerHTML=`
      <div class="v2-products-head">
        <div class="v2-products-intro"><small>UNTOZ PRODUCTS</small><h2>Tools, platforms and experiences.</h2><p>Technology built around the way Untoz creates, publishes and entertains.</p></div>
        <a class="v2-section-action" href="#universe">View all products →</a>
      </div>
      <div class="v2-product-list">
        <a href="https://aura.untoz.site/" class="v2-product"><span>01</span><i>A</i><div><small>LOCAL AI ASSISTANT</small><h3>AURA-1</h3><p>Your computer, finally working with you.</p></div><b>↗</b></a>
        <a href="https://github.com/untoz-media/untoz-clip" class="v2-product"><span>02</span><i>C</i><div><small>CREATOR SOFTWARE</small><h3>Untoz Clip</h3><p>Capture, clip and turn moments into content.</p></div><b>↗</b></a>
        <a href="https://untozplus.com/" class="v2-product"><span>03</span><i>+</i><div><small>STREAMING PLATFORM</small><h3>Untoz+</h3><p>Entertainment, channels and events in one place.</p></div><b>↗</b></a>
      </div>`;
    productions.insertAdjacentElement('afterend',products);

    const numbers=document.createElement('section');
    numbers.className='v2-numbers';
    numbers.innerHTML=`<div><small>BY THE NUMBERS</small><h2>Built to keep growing.</h2></div><div><strong>10+</strong><span>brands & projects</span></div><div><strong>24/7</strong><span>digital media</span></div><div><strong>∞</strong><span>possibilities</span></div>`;
    document.querySelector('.lower')?.insertAdjacentElement('beforebegin',numbers);

    const finalCta=document.createElement('section');
    finalCta.className='v2-final-cta';
    finalCta.innerHTML=`<small>UNTOZ</small><h2>Media should feel<br><em>alive.</em></h2><div><p>Watch it. Read it. Build it. Experience it.</p><a href="#explore">Explore Untoz →</a></div>`;
    page.appendChild(finalCta);

    footer.classList.add('v2-footer');

    document.querySelectorAll('.section-title').forEach(head=>head.classList.add('v2-section-head'));
    document.querySelector('.stories-head')?.classList.add('v2-section-head');
    document.querySelectorAll('.now-card').forEach(card=>card.classList.add('v2-now-card'));
    document.querySelectorAll('.featured-card').forEach(card=>card.classList.add('v2-featured-card'));

    let current=0;
    const dots=[...document.querySelectorAll('.hero-dots button')];
    dots.forEach((btn,i)=>{
      btn.setAttribute('aria-label',`Show featured slide ${i+1}`);
      btn.setAttribute('aria-current',btn.classList.contains('active')?'true':'false');
    });
    const accent=['blue','orange','purple'];
    const syncAccent=()=>{
      current=dots.findIndex(x=>x.classList.contains('active'));
      if(current<0)current=0;
      if(hero)hero.dataset.accent=accent[current%accent.length];
      dots.forEach((btn,i)=>btn.setAttribute('aria-current',i===current?'true':'false'));
    };
    dots.forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncAccent,0)));
    document.getElementById('heroNext')?.addEventListener('click',()=>setTimeout(syncAccent,0));
    document.getElementById('heroPrev')?.addEventListener('click',()=>setTimeout(syncAccent,0));
    setInterval(syncAccent,1000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else queueMicrotask(run);
})();
