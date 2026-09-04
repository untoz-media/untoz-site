(() => {
  const init=()=>{
    if(document.querySelector('.untoz-site-header')) return;
    const global=document.getElementById('untoz-global-header');
    if(!global) return;
    const header=document.createElement('header');
    header.className='untoz-site-header';
    header.innerHTML=`<a class="untoz-site-header__logo" href="#top">untoz<sup>®</sup></a><nav class="untoz-site-header__nav" aria-label="Untoz site navigation"><a href="#top">Home</a><a href="#universe">Products</a><a href="#services">Services</a><a href="#projects">Projects</a><a href="#news">News</a><a href="#about">About</a><a href="#contact">Contact</a></nav><div class="untoz-site-header__actions"><button class="search" type="button" aria-label="Search">⌕</button><button class="theme" type="button" aria-label="Toggle theme">☼</button><a class="untoz-site-header__live" href="#watch">●&nbsp; Watch Live</a><button class="untoz-site-header__mobile" type="button" aria-label="Open menu">☰</button></div>`;
    global.insertAdjacentElement('afterend',header);

    const search=header.querySelector('.search');
    const overlay=document.createElement('div');
    overlay.className='untoz-search-overlay';
    overlay.innerHTML=`<div class="untoz-search-box" role="dialog" aria-modal="true" aria-label="Search Untoz"><div class="untoz-search-top"><span>⌕</span><input class="untoz-search-input" type="search" placeholder="Search Untoz..." autocomplete="off"/><button class="untoz-search-close" type="button" aria-label="Close search">×</button></div><div class="untoz-search-results"></div></div>`;
    document.body.appendChild(overlay);
    const input=overlay.querySelector('.untoz-search-input');
    const results=overlay.querySelector('.untoz-search-results');
    const searchable=[
      ['Products','Untoz+','Streaming, live TV, films, series, sports and events.','#universe'],
      ['Products','Untoz Sports','Live sport, highlights, analysis and original coverage.','#universe'],
      ['Products','Untoz News','Fast coverage of the stories that matter.','#universe'],
      ['Products','Untoz Gaming','Games, creators, streams and everything happening in gaming.','#universe'],
      ['Products','Untoz Music','Music discovery, performances and original content.','#universe'],
      ['Products','Untoz Space','Spaceflight, science and the universe through Untoz.','#universe'],
      ['Services','Live Broadcasting','We broadcast your event to the world with professional quality.','#services'],
      ['Services','Video Production','From concept to final cut. We create stunning videos that tell your story.','#services'],
      ['Services','Streaming Solutions','Multi-platform streaming, 24/7 channels and custom solutions.','#services'],
      ['Services','News Coverage','Fast, accurate and reliable news from everywhere.','#services'],
      ['Services','Sports Media','Live sports, highlights, analysis and original coverage.','#services'],
      ['Services','Creative Technology','Tools and experiences built for the future of media.','#services'],
      ['Watch','Untoz Fast','Non-stop entertainment, music, clips and unexpected moments.','#watch'],
      ['Films','His Girl Friday','1940 · Comedy','#films'],
      ['Films','D.O.A.','1949 · Noir','#films'],
      ['Films','The Little Shop of Horrors','1960 · Horror','#films'],
      ['Films','House on Haunted Hill','1959 · Horror','#films'],
      ['Films','Plan 9 from Outer Space','1959 · Sci-Fi','#films'],
      ['Company','About Untoz','Media, technology and entertainment — built for the world.','#about'],
      ['Company','Contact','Got an idea? Let’s make it.','#contact']
    ];
    const renderResults=(query='')=>{
      const q=query.trim().toLowerCase();
      const matches=q?searchable.filter(([cat,title,text])=>`${cat} ${title} ${text}`.toLowerCase().includes(q)):searchable.slice(0,8);
      if(matches.length){
        results.innerHTML=matches.map(([cat,title,text,href])=>`<a class="untoz-search-result" href="${href}"><small>${cat}</small><strong>${title}</strong><p>${text}</p></a>`).join('');
      }else{
        results.innerHTML='';
        const empty=document.createElement('div');
        empty.className='untoz-search-empty';
        empty.textContent=`No results for “${query}”. Try another search.`;
        results.appendChild(empty);
      }
      results.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeSearch));
    };
    const openSearch=()=>{overlay.classList.add('is-open');document.body.style.overflow='hidden';renderResults();setTimeout(()=>input.focus(),40)};
    const closeSearch=()=>{overlay.classList.remove('is-open');document.body.style.overflow='';search.focus()};
    search.addEventListener('click',openSearch);
    input.addEventListener('input',()=>renderResults(input.value));
    overlay.querySelector('.untoz-search-close').addEventListener('click',closeSearch);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeSearch()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open'))closeSearch();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}});

    const theme=header.querySelector('.theme');
    theme.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='light';document.documentElement.dataset.theme=dark?'light':'dark';theme.textContent=dark?'☾':'☼'});
    const mobile=header.querySelector('.untoz-site-header__mobile');
    mobile.addEventListener('click',()=>{let nav=header.querySelector('.untoz-site-header__mobile-nav');if(nav){nav.remove();mobile.textContent='☰';return}nav=document.createElement('nav');nav.className='untoz-site-header__mobile-nav';nav.innerHTML='<a href="#top">Home</a><a href="#universe">Products</a><a href="#services">Services</a><a href="#projects">Projects</a><a href="#news">News</a><a href="#about">About</a><a href="#contact">Contact</a>';header.appendChild(nav);mobile.textContent='✕'});
  };
  const boot=()=>{init();if(!document.querySelector('.untoz-site-header'))setTimeout(boot,80)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
