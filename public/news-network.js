(()=>{
  const SOURCES={
    news:{name:'Untoz News',url:'https://untoz.site/'},
    sports:{name:'Untoz Sports',url:'https://untozsports.wuaze.com/'},
    gaming:{name:'Untoz Gaming',url:'https://untozgaming.wuaze.com/'},
    music:{name:'Untoz Music',url:'https://untozmusic.wuaze.com/'},
    space:{name:'Untoz Space',url:'https://untozspace.wuaze.com/'}
  };
  const proxy=url=>'https://api.allorigins.win/raw?url='+encodeURIComponent(url);
  const clean=s=>s.replace(/\s+/g,' ').trim();
  function extract(html,source){
    const doc=new DOMParser().parseFromString(html,'text/html');
    const out=[],seen=new Set();
    const selectors='article,main a,h1 a,h2 a,h3 a,h4 a,.post a,.entry-title a';
    doc.querySelectorAll(selectors).forEach(el=>{
      const a=el.closest('a')||el;
      const title=clean(a.textContent||'');
      const href=a.href||a.getAttribute('href');
      if(!title||title.length<12||title.length>180||!href||!/^https?:/i.test(href))return;
      const key=href.split('#')[0];
      if(seen.has(key)||/^(home|more|read more|contact|about|login|menu)$/i.test(title))return;
      seen.add(key);out.push({title,href:key,source:source.name});
    });
    return out.slice(0,8);
  }
  async function load(source){
    try{const r=await fetch(proxy(source.url),{cache:'no-store'});if(!r.ok)throw new Error('feed request failed');return extract(await r.text(),source)}catch(e){return[]}
  }
  function card(item,accent){
    const a=document.createElement('a');a.className='network-news-card';a.href=item.href;a.target='_blank';a.rel='noopener noreferrer';a.innerHTML='<small>'+item.source+'</small><h3>'+item.title.replace(/[<>]/g,'')+'</h3><span style="--network-accent:'+accent+'">Read story <b>↗</b></span>';return a;
  }
  function render(id,items,accent){
    const section=document.getElementById(id);if(!section||items.length<2)return;
    const old=section.querySelector('.network-news-grid');if(old)old.remove();
    const grid=document.createElement('div');grid.className='network-news-grid';items.slice(0,6).forEach(x=>grid.appendChild(card(x,accent)));
    const anchor=section.querySelector('.portal-section-head');if(anchor)anchor.insertAdjacentElement('afterend',grid);
  }
  async function boot(){
    const jobs=Object.entries(SOURCES).map(async([key,source])=>[key,await load(source)]);
    const results=Object.fromEntries(await Promise.all(jobs));
    render('news',results.news,'#174cff');
    render('sports',results.sports,'#19d38a');
    render('gaming',results.gaming,'#9b6cff');
    render('music',results.music,'#ff4fb8');
    render('entertainment',results.news.filter(x=>/film|movie|series|entertainment|award|cinema/i.test(x.title)),'#ff5f91');
    if(results.news.length)window.UntozNetworkNews=results;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));else setTimeout(boot,300);
})();
