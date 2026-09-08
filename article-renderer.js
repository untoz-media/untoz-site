(()=>{
  const root=document.getElementById('article-root');
  if(!root)return;
  const pageBase=new URL('../../',location.href);
  const slug=String(document.body.dataset.articleSlug||'').trim();
  const categorySlug=String(document.body.dataset.articleCategory||'').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const slugify=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const abs=p=>new URL(p,pageBase).href;
  const home=abs('./');

  function sanitize(html){
    const t=document.createElement('template');t.innerHTML=String(html||'');
    const allowed=new Set(['P','BR','STRONG','B','EM','I','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','A','IMG','FIGURE','FIGCAPTION','HR','CODE','PRE']);
    [...t.content.querySelectorAll('*')].forEach(el=>{
      if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);return}
      [...el.attributes].forEach(a=>{const n=a.name.toLowerCase();if(!['href','src','alt','title'].includes(n))el.removeAttribute(a.name)});
      if(el.hasAttribute('href')&&!/^(https?:|mailto:|\/|#)/i.test(el.getAttribute('href')||''))el.removeAttribute('href');
      if(el.hasAttribute('src')&&!/^(https?:|\/|\.\.?\/)/i.test(el.getAttribute('src')||''))el.removeAttribute('src');
      if(el.tagName==='A'&&el.hasAttribute('href')){el.setAttribute('rel','noopener noreferrer');}
    });
    return t.innerHTML;
  }
  function plain(html){const d=document.createElement('div');d.innerHTML=html||'';return (d.textContent||'').trim()}
  function meta(selector,attr,value){let el=document.head.querySelector(selector);if(!el){el=document.createElement('meta');const m=selector.match(/meta\[(name|property)="([^"]+)"\]/);if(m)el.setAttribute(m[1],m[2]);document.head.appendChild(el)}el.setAttribute(attr,value||'')}
  function setSEO(post){
    const title=post.seo_title||post.title||'Untoz';
    const desc=post.seo||post.excerpt||plain(post.content).slice(0,160)||'Untoz story.';
    const url=location.href;
    document.title=`${title} — Untoz`;
    meta('meta[name="description"]','content',desc);
    meta('meta[name="robots"]','content','index,follow');
    meta('meta[property="og:type"]','content','article');
    meta('meta[property="og:site_name"]','content','Untoz');
    meta('meta[property="og:title"]','content',post.social_title||title);
    meta('meta[property="og:description"]','content',post.social_description||desc);
    meta('meta[property="og:url"]','content',url);
    meta('meta[name="twitter:card"]','content','summary_large_image');
    meta('meta[name="twitter:title"]','content',post.social_title||title);
    meta('meta[name="twitter:description"]','content',post.social_description||desc);
    if(post.image){meta('meta[property="og:image"]','content',post.image);meta('meta[name="twitter:image"]','content',post.image)}
    let canonical=document.head.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}canonical.href=url;
    let schema=document.getElementById('untoz-article-schema');if(!schema){schema=document.createElement('script');schema.id='untoz-article-schema';schema.type='application/ld+json';document.head.appendChild(schema)}
    schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:post.title||title,description:desc,image:post.image?[post.image]:undefined,datePublished:post.published_at||post.scheduled_at||post.date||undefined,dateModified:post.updated_at||post.published_at||post.date||undefined,author:{'@type':'Organization',name:post.author||'Untoz'},publisher:{'@type':'Organization',name:'Untoz'},mainEntityOfPage:url});
  }
  function fmtDate(v){if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return esc(v);return d.toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'})}
  function articleUrl(p){return abs(`${slugify(p.category||'news')}/${slugify(p.slug||p.title||'story')}/`)}
  function renderShell(content){
    root.innerHTML=`<div id="untoz-global-header"></div><header class="article-site-header"><a class="article-logo" href="${home}">untoz</a><nav><a href="${home}">Home</a><a href="${home}#stories">News</a><a href="${home}#explore">Sports</a><a href="${home}#stories">Entertainment</a><a href="${home}#featured">Movies & Series</a><a href="${home}#explore">Gaming</a><a href="${home}#explore">Music</a><a href="${home}#universe">Universe</a></nav><div class="article-head-actions"><button id="article-theme" type="button" aria-label="Toggle theme">◐</button><a href="${home}#stories">⌕</a></div></header>${content}<footer class="article-footer"><div><a class="article-footer-brand" href="${home}">untoz</a><p>Media, entertainment and technology.</p></div><div><a href="${home}#stories">News</a><a href="${home}#explore">Explore</a><a href="${home}#videos">Videos</a><a href="${home}#events">Calendar</a></div><span>© 2026 Untoz. All rights reserved.</span></footer>`;
    if(window.UntozGlobalHeader){window.UntozGlobalHeader.render(document.getElementById('untoz-global-header'),{active:'untoz'})}
    const saved=localStorage.getItem('untoz-theme')||'light';document.documentElement.dataset.theme=saved;
    document.getElementById('article-theme')?.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('untoz-theme',next)});
  }
  function unavailable(){meta('meta[name="robots"]','content','noindex,nofollow');document.title='Story unavailable — Untoz';renderShell(`<main class="article-unavailable"><span>UNTOZ</span><h1>This story isn’t available.</h1><p>It may still be a draft, scheduled for later, or no longer available.</p><a href="${home}">← Back to Untoz</a></main>`)}
  function relatedMarkup(post,posts){
    const wanted=new Set(Array.isArray(post.related)?post.related:[]);
    let rel=posts.filter(p=>p.status==='Published'&&p.slug!==post.slug&&wanted.has(p.slug));
    if(rel.length<3)rel=[...rel,...posts.filter(p=>p.status==='Published'&&p.slug!==post.slug&&slugify(p.category)===slugify(post.category)&&!rel.some(x=>x.slug===p.slug))];
    rel=rel.slice(0,3);if(!rel.length)return '';
    return `<section class="article-related"><div class="article-section-head"><h2>Related stories</h2></div><div class="article-related-grid">${rel.map(p=>`<a href="${articleUrl(p)}"><div class="article-related-image">${p.image?`<img src="${esc(p.image)}" alt="">`:'<span>${esc((p.category||'Untoz').toUpperCase())}</span>'}</div><small>${esc((p.category||'Untoz').toUpperCase())}</small><h3>${esc(p.title||'Untitled story')}</h3><p>${esc(p.excerpt||'')}</p></a>`).join('')}</div></section>`
  }
  function renderArticle(post,posts){
    setSEO(post);
    const body=sanitize(post.content)||`<p>${esc(post.excerpt||'')}</p>`;
    const category=post.category||'Untoz';
    const flags=[post.breaking?'BREAKING':'',post.top_story?'TOP STORY':'',post.featured?'FEATURED':''].filter(Boolean);
    renderShell(`<main class="article-page"><div class="article-breadcrumb"><a href="${home}">Home</a><span>›</span><a href="${home}#stories">${esc(category)}</a><span>›</span><span>${esc(post.title||'Story')}</span></div><article><header class="article-hero">${flags.length?`<div class="article-flags">${flags.map(x=>`<span>${x}</span>`).join('')}</div>`:''}<div class="article-category">${esc(category.toUpperCase())}</div><h1>${esc(post.title||'Untitled story')}</h1>${post.excerpt?`<p class="article-deck">${esc(post.excerpt)}</p>`:''}<div class="article-byline"><span>By <b>${esc(post.author||'Untoz')}</b></span><i></i><span>${fmtDate(post.published_at||post.scheduled_at||post.date)}</span></div></header>${post.image?`<figure class="article-featured"><img src="${esc(post.image)}" alt="${esc(post.title||'')}" loading="eager"></figure>`:''}<div class="article-layout"><aside class="article-share"><span>SHARE</span><button data-share-native title="Share">↗</button><button data-share-x title="Share on X">X</button><button data-share-copy title="Copy link">⧉</button></aside><div class="article-body">${body}</div></div></article>${relatedMarkup(post,posts)}</main>`);
    const shareData={title:post.title||'Untoz',text:post.excerpt||'',url:location.href};
    document.querySelector('[data-share-native]')?.addEventListener('click',async()=>{if(navigator.share){try{await navigator.share(shareData)}catch{}}else navigator.clipboard?.writeText(location.href)});
    document.querySelector('[data-share-x]')?.addEventListener('click',()=>window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(post.title||'Untoz')}&url=${encodeURIComponent(location.href)}`,'_blank','noopener,noreferrer'));
    document.querySelector('[data-share-copy]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(location.href);e.currentTarget.textContent='✓';setTimeout(()=>e.currentTarget.textContent='⧉',1400)}catch{}});
  }
  fetch(abs('content/posts.json'),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Could not load stories');return r.json()}).then(posts=>{
    if(!Array.isArray(posts))return unavailable();
    const post=posts.find(p=>slugify(p.slug)===slugify(slug)&&slugify(p.category||'news')===slugify(categorySlug));
    if(!post||post.status!=='Published')return unavailable();
    renderArticle(post,posts);
  }).catch(unavailable);
})();
