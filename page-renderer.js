(()=>{
  const root=document.getElementById('page-root');
  const slug=(document.body.dataset.untozPage||'').trim();
  const base=new URL('../',location.href);
  const RAW='https://raw.githubusercontent.com/untoz-media/untoz-site/main/content/pages/';
  const themeKey='untoz-theme';

  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const nl=v=>esc(v).replace(/\n/g,'<br>');
  const safeHref=v=>{const s=String(v||'').trim();return /^(https?:\/\/|mailto:|\/|\.\/|\.\.\/|#)/i.test(s)?s:'#'};
  const safeMedia=v=>{const s=String(v||'').trim();return /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(s)?s:''};
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const font=v=>['inherit','Arial, sans-serif','Georgia, serif','ui-monospace, monospace'].includes(v)?v:'inherit';
  const color=v=>/^#[0-9a-f]{3,8}$/i.test(String(v||''))?v:'';
  const href=p=>new URL(p,base).href;

  function installV2Styles(){
    ['page-v2.css','page-v2-states.css'].forEach(file=>{
      if(document.querySelector(`link[data-untoz-page-style="${file}"]`))return;
      const link=document.createElement('link');
      link.rel='stylesheet';link.href=href(file);link.dataset.untozPageStyle=file;
      document.head.appendChild(link);
    });
  }
  installV2Styles();

  function defaultStyles(){return {backgroundMode:'solid',background:'#ffffff',gradientFrom:'#ffffff',gradientTo:'#eef3ff',backgroundImage:'',textColor:'#111111',accentColor:'#1f6ffa',surfaceColor:'#ffffff',maxWidth:'1240',font:'inherit',paddingTop:64,paddingBottom:80,gap:22,radius:24,showHeader:true,showFooter:true}}
  function pageBackground(s){
    if(s.backgroundMode==='gradient')return `linear-gradient(135deg,${color(s.gradientFrom)||'#fff'},${color(s.gradientTo)||'#eef3ff'})`;
    if(s.backgroundMode==='image'&&safeMedia(s.backgroundImage))return `linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.08)),url("${safeMedia(s.backgroundImage).replace(/"/g,'')}")`;
    return color(s.background)||'#fff';
  }
  function blockStyle(b){const st=b.style||{};const bg=color(st.background)||(/^(transparent|#[0-9a-f]{8})$/i.test(String(st.background||''))?st.background:'transparent');const fg=color(st.color)||'';const align=['left','center','right'].includes(st.align)?st.align:'left';return `background:${bg};${fg?`color:${fg};`:''}padding:${Math.max(0,num(st.padding,24))}px;border-radius:${Math.max(0,num(st.radius,0))}px;text-align:${align}`}
  function youtubeEmbed(url){try{const u=new URL(url);if(u.hostname.includes('youtu.be'))return `https://www.youtube.com/embed/${u.pathname.split('/').filter(Boolean)[0]||''}`;if(u.hostname.includes('youtube.com')){const id=u.searchParams.get('v');if(id)return `https://www.youtube.com/embed/${id}`;if(u.pathname.startsWith('/embed/'))return url}}catch{}return ''}

  function renderBlock(b,index){const p=b.props||{};const style=blockStyle(b);const type=String(b.type||'Text');const marker=` data-block-index="${index}"`;
    if(type==='Hero'){const bg=safeMedia(p.image);return `<section class="untoz-page-block untoz-block-hero"${marker}><div class="untoz-page-block-inner" style="${style}${bg?`;background-image:linear-gradient(#0007,#0007),url('${esc(bg)}');color:#fff`:''}"><div class="untoz-hero-copy">${p.eyebrow?`<span class="untoz-page-eyebrow">${esc(p.eyebrow)}</span>`:''}<h1 class="untoz-page-heading h1">${esc(p.title||'')}</h1>${p.text?`<div class="untoz-page-text">${nl(p.text)}</div>`:''}${p.buttonText?`<div class="untoz-hero-actions"><a class="untoz-page-button" href="${esc(safeHref(p.buttonUrl))}">${esc(p.buttonText)}</a></div>`:''}</div></div></section>`}
    if(type==='Heading'){const level=['h2','h3','h4'].includes(p.level)?p.level:'h2';return `<section class="untoz-page-block untoz-block-heading"${marker}><div class="untoz-page-block-inner" style="${style}"><${level} class="untoz-page-heading ${level}">${esc(p.text||'')}</${level}></div></section>`}
    if(type==='Text')return `<section class="untoz-page-block untoz-block-text"${marker}><div class="untoz-page-block-inner" style="${style}"><div class="untoz-page-text">${nl(p.text||'')}</div></div></section>`;
    if(type==='Image'){const u=safeMedia(p.image);return `<section class="untoz-page-block untoz-block-image"${marker}><div class="untoz-page-block-inner" style="${style}">${u?`<figure><img src="${esc(u)}" alt="${esc(p.alt||'')}" style="object-fit:${['contain','cover'].includes(p.fit)?p.fit:'cover'}">${p.caption?`<figcaption>${esc(p.caption)}</figcaption>`:''}</figure>`:''}</div></section>`}
    if(type==='Button')return `<section class="untoz-page-block untoz-block-button"${marker}><div class="untoz-page-block-inner" style="${style}"><a class="untoz-page-button ${p.variant==='outline'?'outline':''}" href="${esc(safeHref(p.url))}">${esc(p.text||'Explore')}</a></div></section>`;
    if(type==='Quote')return `<section class="untoz-page-block untoz-block-quote"${marker}><div class="untoz-page-block-inner" style="${style}"><blockquote>${esc(p.text||'')}</blockquote>${p.author?`<cite>— ${esc(p.author)}</cite>`:''}</div></section>`;
    if(type==='Divider')return `<section class="untoz-page-block untoz-block-divider"${marker}><div class="untoz-page-block-inner" style="${style}"><hr></div></section>`;
    if(type==='Spacer')return `<section class="untoz-page-block untoz-block-spacer"${marker}><div class="untoz-page-block-inner" style="height:${Math.max(0,num(p.height,72))}px"></div></section>`;
    if(type==='Columns')return `<section class="untoz-page-block untoz-block-columns"${marker}><div class="untoz-page-block-inner" style="${style}"><div class="untoz-columns"><div class="untoz-column"><h3>${esc(p.leftTitle||'')}</h3><p>${nl(p.leftText||'')}</p></div><div class="untoz-column"><h3>${esc(p.rightTitle||'')}</h3><p>${nl(p.rightText||'')}</p></div></div></div></section>`;
    if(type==='Video'){const u=safeMedia(p.url);const yt=u?youtubeEmbed(u):'';return `<section class="untoz-page-block untoz-block-video"${marker}><div class="untoz-page-block-inner" style="${style}">${u?`<div class="untoz-video-frame">${yt?`<iframe src="${esc(yt)}" title="${esc(p.title||'Video')}" loading="lazy" allowfullscreen></iframe>`:`<video src="${esc(u)}" controls preload="metadata"></video>`}</div>${p.title?`<div class="untoz-video-title">${esc(p.title)}</div>`:''}`:''}</div></section>`}
    return '';
  }

  function siteHeader(){return `<header class="untoz-site-header"><a class="untoz-site-header__logo" href="${href('')}">untoz</a><nav class="untoz-site-header__nav"><a href="${href('')}">Home</a><a href="${href('news/')}">News</a><a href="${href('sports/')}">Sports</a><a href="${href('pop/')}">Entertainment</a><a href="${href('gaming/')}">Gaming</a><a href="${href('space/')}">Space</a><a href="${href('search/')}">Search</a><a href="${href('about/')}" class="${slug==='about'?'active':''}">About</a><a href="${href('contact/')}" class="${slug==='contact'?'active':''}">Contact</a></nav><div class="untoz-site-header__actions"><button class="untoz-site-header__action" id="pageThemeToggle" aria-label="Toggle theme">☾</button><button class="untoz-site-header__action untoz-site-header__menu" id="pageMenuToggle" aria-label="Open menu">☰</button><a class="untoz-site-header__live" href="${href('#live')}"><i></i> LIVE</a></div><nav class="untoz-site-header__mobile" id="pageMobileNav"><a href="${href('')}">Home</a><a href="${href('news/')}">News</a><a href="${href('sports/')}">Sports</a><a href="${href('pop/')}">Entertainment</a><a href="${href('gaming/')}">Gaming</a><a href="${href('search/')}">Search</a><a href="${href('about/')}">About</a><a href="${href('contact/')}">Contact</a></nav></header>`}
  function footer(){return `<footer class="untoz-public-footer"><div class="untoz-public-footer__inner"><div><div class="untoz-public-footer__brand">untoz<span>Media, entertainment and technology — one connected universe.</span></div></div><div><h4>Explore</h4><a href="${href('news/')}">News</a><a href="${href('sports/')}">Sports</a><a href="${href('pop/')}">Entertainment</a><a href="${href('gaming/')}">Gaming</a></div><div><h4>Discover</h4><a href="${href('space/')}">Space</a><a href="${href('kids/')}">Kids</a><a href="${href('archives/')}">Archives</a><a href="${href('search/')}">Search</a></div><div><h4>Untoz</h4><a href="${href('about/')}">About</a><a href="${href('contact/')}">Contact</a><a href="${href('#universe')}">Universe</a><a href="https://untozplus.com/">Untoz+</a></div></div><div class="untoz-public-footer__bottom">© 2026 Untoz. All rights reserved.</div></footer>`}
  function installTheme(){let dark=localStorage.getItem(themeKey)==='dark';const apply=()=>{document.documentElement.dataset.theme=dark?'dark':'light';document.querySelector('.untoz-public-page')?.classList.toggle('theme-dark',dark);const b=document.getElementById('pageThemeToggle');if(b)b.textContent=dark?'☀':'☾'};apply();document.getElementById('pageThemeToggle')?.addEventListener('click',()=>{dark=!dark;localStorage.setItem(themeKey,dark?'dark':'light');apply()});const menu=document.getElementById('pageMenuToggle'),nav=document.getElementById('pageMobileNav');menu?.addEventListener('click',()=>{const open=nav?.classList.toggle('open');menu.textContent=open?'×':'☰'});nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');if(menu)menu.textContent='☰'}))}
  function seo(page){document.title=`${page.title||'Untoz'} — Untoz`;let d=document.querySelector('meta[name="description"]');if(!d){d=document.createElement('meta');d.name='description';document.head.appendChild(d)}d.content=page.seo||'';let r=document.querySelector('meta[name="robots"]');if(!r){r=document.createElement('meta');r.name='robots';document.head.appendChild(r)}r.content=String(page.status).toLowerCase()==='published'?'index,follow':'noindex,nofollow';[['og:title',page.title||'Untoz'],['og:description',page.seo||'']].forEach(([prop,val])=>{let m=document.querySelector(`meta[property="${prop}"]`);if(!m){m=document.createElement('meta');m.setAttribute('property',prop);document.head.appendChild(m)}m.content=val})}
  async function load(){
    if(!slug)throw Error('Missing page slug.');
    const local=new URL(`content/pages/${encodeURIComponent(slug)}.json`,base);
    try{const r=await fetch(`${local.href}?t=${Date.now()}`,{cache:'no-store'});if(r.ok)return r.json()}catch{}
    const fallback=await fetch(`${RAW}${encodeURIComponent(slug)}.json?t=${Date.now()}`,{cache:'no-store'});
    if(!fallback.ok)throw Error('Page not found.');
    return fallback.json();
  }
  function state(type,title,text,action){return `<div class="untoz-public-page"><div class="untoz-page-${type}"><div class="untoz-page-state-card"><span class="untoz-state-kicker">UNTOZ / ${type.toUpperCase()}</span><h1>${esc(title)}</h1><p>${esc(text)}</p>${action?`<a href="${href('')}">${esc(action)}</a>`:''}</div></div></div>`}
  function emptyState(){return `<section class="untoz-page-empty-state"><span>UNTOZ / PAGE</span><h2>Something new is taking shape.</h2><p>This page is published, but its experience is still being prepared.</p><a href="${href('')}">Explore Untoz →</a></section>`}
  function render(page){seo(page);if(String(page.status||'Draft').toLowerCase()!=='published'){root.innerHTML=state('error','Page unavailable','This page is not currently published.','Back to Untoz');return}
    const s={...defaultStyles(),...(page.styles||{})};const blocks=Array.isArray(page.blocks)&&page.blocks.length?page.blocks:(String(page.content||'').trim()?[{type:'Text',props:{text:page.content},style:{padding:24}}]:[]);
    root.innerHTML=`<div class="untoz-public-page"><div id="untoz-global-header"></div>${s.showHeader===false?'':siteHeader()}<main class="untoz-page-shell"><article class="untoz-rendered-page" style="--page-text:${color(s.textColor)||'#111'};--page-accent:${color(s.accentColor)||'#1f6ffa'};--page-surface:${color(s.surfaceColor)||'#fff'};--page-radius:${Math.max(0,num(s.radius,24))}px;--page-font:${font(s.font)};--page-background:${pageBackground(s)};--page-width:${Math.min(1600,Math.max(640,num(s.maxWidth,1240)))}px;--page-pad-top:${Math.max(0,num(s.paddingTop,64))}px;--page-pad-bottom:${Math.max(0,num(s.paddingBottom,80))}px;--page-gap:${Math.max(0,num(s.gap,22))}px"><div class="untoz-page-content">${blocks.length?blocks.map(renderBlock).join(''):emptyState()}</div></article></main>${s.showFooter===false?'':footer()}</div>`;
    if(window.UntozGlobalHeader)try{window.UntozGlobalHeader.render(document.getElementById('untoz-global-header'),{active:'untoz'})}catch{}
    installTheme();
  }
  root.innerHTML=state('loading','Loading Untoz…','Preparing this experience.');
  load().then(render).catch(err=>{console.error(err);root.innerHTML=state('error','Page not found','The page you requested could not be loaded.','Back to Untoz')});
})();
