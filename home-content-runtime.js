(()=>{
  const slugify=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const base=new URL('./',location.href);
  const articleUrl=p=>new URL(`${slugify(p.category||'news')}/${slugify(p.slug||p.title||'story')}/`,base).href;
  const categoryUrl=name=>new URL(`${slugify(name)}/`,base).href;
  const categoryLinks={News:'news',Sports:'sports',Entertainment:'entertainment','Movies & Series':'movies-series',Gaming:'gaming',Music:'music',Space:'space'};
  const subsidiaries=[
    {name:'Untoz Pop',slug:'pop',icon:'☆',tone:'pink'},
    {name:'Untoz Sports',slug:'sports',icon:'⚽',tone:'green'},
    {name:'Untoz Gaming',slug:'gaming',icon:'⌘',tone:'purple'},
    {name:'Untoz Space',slug:'space',icon:'◌',tone:'blue'},
    {name:'Untoz Kids',slug:'kids',icon:'✦',tone:'orange'},
    {name:'Untoz Archives',slug:'archives',icon:'▣',tone:'indigo'}
  ];
  const fallbackImage='https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=85';
  let allPosts=[];
  let active='All';

  const dateValue=p=>new Date(p.published_at||p.scheduled_at||p.date||0).getTime()||0;
  function rank(posts){return [...posts].sort((a,b)=>Number(!!b.breaking)-Number(!!a.breaking)||Number(!!b.top_story)-Number(!!a.top_story)||Number(!!b.pinned)-Number(!!a.pinned)||Number(!!b.featured)-Number(!!a.featured)||dateValue(b)-dateValue(a))}
  function visible(){const published=allPosts.filter(p=>p&&p.status==='Published'&&slugify(p.slug));return rank(active==='All'?published:published.filter(p=>String(p.category||'').toLowerCase()===active.toLowerCase()))}
  function image(p){return p.image||fallbackImage}

  function wireCategoryRoutes(){
    document.querySelectorAll('.untoz-site-header__nav a,.untoz-site-header__mobile-nav a').forEach(a=>{const label=a.textContent.trim();if(categoryLinks[label])a.href=new URL(`${categoryLinks[label]}/`,base).href});
    document.querySelectorAll('#footer a').forEach(a=>{const label=a.textContent.trim();if(categoryLinks[label])a.href=new URL(`${categoryLinks[label]}/`,base).href});
    const viewAll=document.querySelector('#stories .stories-head>a');if(viewAll)viewAll.href=categoryUrl('News');
    const search=document.querySelector('.untoz-site-header__action.desktop-only');if(search)search.href=new URL('search/',base).href;
    const cards=[...document.querySelectorAll('.explore-card')];
    subsidiaries.forEach((sub,i)=>{const card=cards[i];if(!card)return;card.href=new URL(`${sub.slug}/`,base).href;card.className=`explore-card ${sub.tone}`;const icon=card.querySelector('div');const label=card.querySelector('span');if(icon)icon.textContent=sub.icon;if(label)label.textContent=sub.name});
  }
  function renderStories(){
    const grid=document.querySelector('#stories .stories-grid');if(!grid)return;
    const list=visible();
    const viewAll=document.querySelector('#stories .stories-head>a');if(viewAll)viewAll.href=categoryUrl(active==='All'?'News':active);
    if(!list.length){grid.innerHTML='<div style="padding:50px 20px;color:#777">No published stories in this category yet.</div>';return}
    const lead=list[0],side=list.slice(1,4);
    grid.innerHTML=`<a class="lead-story" href="${articleUrl(lead)}"><img src="${esc(image(lead))}" alt=""><div class="card-shade"></div><span class="story-tag">${esc((lead.category||'UNTOZ').toUpperCase())}</span><div class="lead-copy"><h3>${esc(lead.title||'Untitled story')}</h3><p>${esc(lead.excerpt||'')}</p><b>Read story →</b></div></a><div class="story-list">${side.map(p=>`<a href="${articleUrl(p)}"><img src="${esc(image(p))}" alt=""><div><small>${esc((p.category||'UNTOZ').toUpperCase())}</small><h3>${esc(p.title||'Untitled story')}</h3><p>${esc(p.excerpt||'')}</p></div></a>`).join('')}</div>`;
  }
  function bindFilters(){document.querySelectorAll('#stories .filters button').forEach(b=>b.addEventListener('click',()=>{active=b.textContent.trim();document.querySelectorAll('#stories .filters button').forEach(x=>x.classList.toggle('active',x===b));renderStories()}))}
  function updateLatest(){const first=rank(allPosts.filter(p=>p&&p.status==='Published'&&slugify(p.slug)))[0];if(!first)return;const latest=[...document.querySelectorAll('.now-card')].find(x=>x.querySelector('.tag')?.textContent.trim()==='LATEST');if(latest){latest.href=articleUrl(first);const h=latest.querySelector('h3');if(h)h.textContent=first.title||h.textContent;const p=latest.querySelector('p');if(p&&first.excerpt)p.textContent=first.excerpt;if(first.image){const img=latest.querySelector('img');if(img)img.src=first.image}}}

  wireCategoryRoutes();bindFilters();
  fetch(new URL('content/posts.json',base),{cache:'no-store'}).then(r=>r.ok?r.json():[]).then(posts=>{allPosts=Array.isArray(posts)?posts:[];renderStories();updateLatest()}).catch(()=>{});
})();
