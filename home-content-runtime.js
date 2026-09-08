(()=>{
  const slugify=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const base=new URL('./',location.href);
  const articleUrl=p=>new URL(`${slugify(p.category||'news')}/${slugify(p.slug||p.title||'story')}/`,base).href;
  const dateValue=p=>new Date(p.published_at||p.scheduled_at||p.date||0).getTime()||0;
  function rank(posts){return [...posts].sort((a,b)=>Number(!!b.breaking)-Number(!!a.breaking)||Number(!!b.top_story)-Number(!!a.top_story)||Number(!!b.pinned)-Number(!!a.pinned)||dateValue(b)-dateValue(a))}
  function apply(posts){
    const published=rank(posts.filter(p=>p&&p.status==='Published'&&slugify(p.slug)));
    if(!published.length)return;
    const lead=document.querySelector('.lead-story');
    const first=published[0];
    if(lead&&first){lead.href=articleUrl(first);const img=lead.querySelector('img');if(img&&first.image)img.src=first.image;const tag=lead.querySelector('.story-tag');if(tag)tag.textContent=(first.category||'Untoz').toUpperCase();const h=lead.querySelector('h3');if(h)h.textContent=first.title||h.textContent;const p=lead.querySelector('p');if(p&&first.excerpt)p.textContent=first.excerpt;const b=lead.querySelector('b');if(b)b.textContent='Read story →'}
    const list=[...document.querySelectorAll('.story-list > a')];
    published.slice(1,1+list.length).forEach((post,i)=>{const card=list[i];card.href=articleUrl(post);const img=card.querySelector('img');if(img&&post.image)img.src=post.image;const small=card.querySelector('small');if(small)small.textContent=(post.category||'Untoz').toUpperCase();const h=card.querySelector('h3');if(h)h.textContent=post.title||h.textContent;const p=card.querySelector('p');if(p&&post.excerpt)p.textContent=post.excerpt});
    const latest=[...document.querySelectorAll('.now-card')].find(x=>x.querySelector('.tag')?.textContent.trim()==='LATEST');if(latest){latest.href=articleUrl(first);const h=latest.querySelector('h3');if(h)h.textContent=first.title||h.textContent;const p=latest.querySelector('p');if(p&&first.excerpt)p.textContent=first.excerpt;if(first.image){const img=latest.querySelector('img');if(img)img.src=first.image}}
  }
  fetch(new URL('content/posts.json',base),{cache:'no-store'}).then(r=>r.ok?r.json():[]).then(x=>Array.isArray(x)&&apply(x)).catch(()=>{});
})();
