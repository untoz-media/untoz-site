(()=>{
  const slugify=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const base=new URL('./',location.href);
  const categoryUrl=name=>new URL(`${slugify(name)}/`,base).href;
  const articleUrl=p=>new URL(`${slugify(p.category||'news')}/${slugify(p.slug||p.title||'story')}/`,base).href;
  const fallbackImage='https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=85';
  const categoryLinks={News:'news',Sports:'sports',Entertainment:'entertainment','Movies & Series':'movies-series',Gaming:'gaming',Music:'music',Space:'space'};
  let posts=[];
  let active='All';

  function wireRoutes(){
    document.querySelectorAll('.untoz-site-header__nav a,.untoz-site-header__mobile-nav a').forEach(a=>{const label=a.textContent.trim();if(categoryLinks[label])a.href=new URL(`${categoryLinks[label]}/`,base).href});
    document.querySelectorAll('.explore-card').forEach(a=>{const label=a.querySelector('span')?.textContent.trim();if(categoryLinks[label])a.href=new URL(`${categoryLinks[label]}/`,base).href});
    document.querySelectorAll('#footer a').forEach(a=>{const label=a.textContent.trim();if(categoryLinks[label])a.href=new URL(`${categoryLinks[label]}/`,base).href});
    const storiesView=document.querySelector('#stories .stories-head>a');if(storiesView)storiesView.href=categoryUrl('News');
    const search=document.querySelector('.untoz-site-header__action.desktop-only');if(search)search.href='#stories';
  }
  function sortPosts(list){return [...list].sort((a,b)=>{const rank=p=>(p.breaking?4:p.top_story?3:p.pinned?2:p.featured?1:0);const r=rank(b)-rank(a);if(r)return r;return new Date(b.published_at||b.scheduled_at||b.date||0)-new Date(a.published_at||a.scheduled_at||a.date||0)})}
  function visible(){const published=posts.filter(p=>p.status==='Published');return sortPosts(active==='All'?published:published.filter(p=>String(p.category||'').toLowerCase()===active.toLowerCase()))}
  function image(p){return p.image||fallbackImage}
  function renderStories(){const grid=document.querySelector('#stories .stories-grid');if(!grid)return;const list=visible();if(!list.length){grid.innerHTML='<div style="padding:50px 20px;color:#777">No published stories in this category yet.</div>';return}const lead=list[0],side=list.slice(1,4);grid.innerHTML=`<a class="lead-story" href="${articleUrl(lead)}"><img src="${esc(image(lead))}" alt=""><div class="card-shade"></div><span class="story-tag">${esc((lead.category||'UNTOZ').toUpperCase())}</span><div class="lead-copy"><h3>${esc(lead.title||'Untitled story')}</h3><p>${esc(lead.excerpt||'')}</p><b>Read more →</b></div></a><div class="story-list">${side.map(p=>`<a href="${articleUrl(p)}"><img src="${esc(image(p))}" alt=""><div><small>${esc((p.category||'UNTOZ').toUpperCase())}</small><h3>${esc(p.title||'Untitled story')}</h3><p>${esc(p.excerpt||'')}</p></div></a>`).join('')}</div>`}
  function bindFilters(){document.querySelectorAll('#stories .filters button').forEach(b=>b.addEventListener('click',()=>{active=b.textContent.trim();document.querySelectorAll('#stories .filters button').forEach(x=>x.classList.toggle('active',x===b));renderStories()}))}
  function updateLatest(){const list=sortPosts(posts.filter(p=>p.status==='Published'));const latest=list[0];if(!latest)return;const now=[...document.querySelectorAll('.now-card')].find(x=>x.querySelector('.tag')?.textContent.trim()==='LATEST');if(now){now.href=articleUrl(latest);const h=now.querySelector('h3');const p=now.querySelector('p');const img=now.querySelector('img');if(h)h.textContent=latest.title||h.textContent;if(p&&latest.excerpt)p.textContent=latest.excerpt;if(img&&latest.image)img.src=latest.image}}
  wireRoutes();bindFilters();fetch(new URL('content/posts.json',base),{cache:'no-store'}).then(r=>r.ok?r.json():[]).then(data=>{posts=Array.isArray(data)?data:[];renderStories();updateLatest()}).catch(()=>{});
})();
