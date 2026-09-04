(()=>{
  const plusUrl='https://untozplus.com';
  const slides=[
    {k:'UNTOZ+ · NOW STREAMING',t:'Something unexpected is always on.',p:'Films, series, live TV, sports and events — all in one place.',a:'Open Untoz+',bg:'radial-gradient(circle at 70% 25%,rgba(255,216,61,.35),transparent 20%),linear-gradient(135deg,#10205b 0%,#41258e 52%,#b72778 115%)',accent:'#ffd83d'},
    {k:'NEW ON UNTOZ+',t:'Your next obsession is waiting.',p:'Discover new stories, old classics and everything worth pressing play for.',a:'Browse Untoz+',bg:'radial-gradient(circle at 65% 30%,rgba(255,80,140,.42),transparent 25%),linear-gradient(135deg,#24104a,#7b164e 58%,#f04f71)',accent:'#ff5f91'},
    {k:'UNTOZ ORIGINALS',t:'Made for people who want different.',p:'Original entertainment, live moments and projects from the Untoz Universe.',a:'Explore originals',bg:'radial-gradient(circle at 70% 20%,rgba(34,216,255,.38),transparent 24%),linear-gradient(135deg,#061c35,#123ca2 55%,#2c1c73)',accent:'#22d8ff'},
    {k:'LIVE · 24/7',t:'There is always something on.',p:'Jump into live channels, events and unexpected moments from Untoz.',a:'Watch live',bg:'radial-gradient(circle at 72% 28%,rgba(23,76,255,.55),transparent 25%),linear-gradient(135deg,#050812,#151a4d 55%,#2a0b46)',accent:'#174cff'}
  ];
  const contents=[
    ['His Girl Friday','1940 · COMEDY','HIS GIRL FRIDAY','linear-gradient(145deg,#57595f,#121318)'],
    ['D.O.A.','1949 · NOIR','D.O.A.','linear-gradient(145deg,#642b3d,#10080c)'],
    ['The Little Shop of Horrors','1960 · HORROR','LITTLE SHOP','linear-gradient(145deg,#263c34,#090d0c)'],
    ['House on Haunted Hill','1959 · HORROR','HAUNTED HILL','linear-gradient(145deg,#2c3859,#07090f)'],
    ['Plan 9 from Outer Space','1959 · SCI-FI','PLAN 9','linear-gradient(145deg,#172d54,#06090f)']
  ];
  function buildHero(){
    const art=document.querySelector('.hero-art'); if(!art||art.dataset.refreshDone)return;
    art.dataset.refreshDone='1'; art.innerHTML='';
    const carousel=document.createElement('div'); carousel.className='hero-carousel';
    slides.forEach((s,i)=>{
      const slide=document.createElement('article'); slide.className='hero-slide'+(i===0?' active':'');
      slide.innerHTML=`<div class="hero-slide-bg" style="--slide-bg:${s.bg}"></div><div class="hero-shape"></div><div class="hero-mark">${String(i+1).padStart(2,'0')} / 04</div><div class="hero-slide-content"><div class="hero-kicker" style="--accent:${s.accent}"><i></i>${s.k}</div><h3>${s.t}</h3><p>${s.p}</p><a class="hero-action" href="${plusUrl}">${s.a} <span>↗</span></a></div>`;
      carousel.appendChild(slide);
    });
    const dots=document.createElement('div'); dots.className='hero-dots';
    slides.forEach((_,i)=>{const d=document.createElement('button');d.className='hero-dot'+(i===0?' active':'');d.setAttribute('aria-label','Hero slide '+(i+1));d.addEventListener('click',()=>go(i));dots.appendChild(d)});
    carousel.appendChild(dots); art.appendChild(carousel);
    let current=0,timer;
    function go(i){current=i;carousel.querySelectorAll('.hero-slide').forEach((x,n)=>x.classList.toggle('active',n===i));carousel.querySelectorAll('.hero-dot').forEach((x,n)=>x.classList.toggle('active',n===i));restart()}
    function restart(){clearInterval(timer);timer=setInterval(()=>go((current+1)%slides.length),6000)}
    carousel.addEventListener('mouseenter',()=>clearInterval(timer));carousel.addEventListener('mouseleave',restart);restart();
  }
  function buildPlusShowcase(){
    if(document.querySelector('.untoz-plus-showcase'))return;
    const watch=document.querySelector('#watch'); if(!watch)return;
    const section=document.createElement('section'); section.className='untoz-plus-showcase'; section.id='untoz-plus-content';
    const cards=contents.map((c,i)=>`<a class="plus-content-card" href="${plusUrl}" aria-label="Open ${c[0]} on Untoz+"><div class="plus-poster" style="--poster:${c[3]}"><span class="plus-card-badge">${i<3?'CLASSIC':'FEATURED'}</span><span class="plus-card-plus">+</span><strong class="plus-poster-title">${c[2]}</strong></div><div class="plus-card-info"><small>${c[1]}</small><strong>${c[0]}</strong></div></a>`).join('');
    section.innerHTML=`<div class="plus-showcase-head"><div><div class="label">STREAM ON UNTOZ+</div><h2>What's on<br/><span>Untoz+.</span></h2></div><p class="plus-showcase-copy">A hand-picked look at what you can discover on Untoz+. Click any title to jump straight into the streaming platform.</p></div><div class="plus-content-row">${cards}</div><div class="plus-showcase-cta"><a href="${plusUrl}">Open Untoz+ <span>↗</span></a></div>`;
    watch.parentNode.insertBefore(section,watch);
  }
  function boot(){buildHero();buildPlusShowcase()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
