(() => {
  const init=()=>{
    if(document.querySelector('.untoz-site-header')) return;
    const global=document.getElementById('untoz-global-header');
    if(!global) return;
    const header=document.createElement('header');
    header.className='untoz-site-header';
    header.innerHTML=`<a class="untoz-site-header__logo" href="#top" aria-label="Untoz home">untoz<sup>®</sup></a><nav class="untoz-site-header__nav" aria-label="Untoz site navigation"><a href="#top">Home</a><a href="#news">News</a><a href="#sports">Sports</a><a href="#entertainment">Entertainment</a><a href="#movies">Movies & Series</a><a href="#productions">Productions</a><a href="#gaming">Gaming</a><a href="#music">Music</a><a href="#videos">Videos</a><a href="#live">Live</a><a href="#more">More</a></nav><div class="untoz-site-header__actions"><button class="search" type="button" aria-label="Search">⌕</button><button class="theme" type="button" aria-label="Toggle theme">☼</button><a class="untoz-site-header__live" href="#live">●&nbsp; Watch Live</a><button class="untoz-site-header__mobile" type="button" aria-label="Open menu">☰</button></div>`;
    global.insertAdjacentElement('afterend',header);

    const search=header.querySelector('.search');
    const overlay=document.createElement('div');
    overlay.className='untoz-search-overlay';
    overlay.innerHTML=`<div class="untoz-search-box" role="dialog" aria-modal="true" aria-label="Search Untoz"><div class="untoz-search-top"><span>⌕</span><input class="untoz-search-input" type="search" placeholder="Search Untoz..." autocomplete="off"/><button class="untoz-search-close" type="button" aria-label="Close search">×</button></div><div class="untoz-search-results"></div></div>`;
    document.body.appendChild(overlay);
    const input=overlay.querySelector('.untoz-search-input');
    const results=overlay.querySelector('.untoz-search-results');
    const searchable=[
      ['News','Untoz+ is now streaming','The latest stories from the Untoz universe.','#news'],
      ['Entertainment','The Untoz Awards are heading to Dubai','Everything you need to know about the next edition.','#entertainment'],
      ['Sports','The latest from Untoz Sports','Live coverage, results and highlights.','#sports'],
      ['Movies & Series','His Girl Friday','1940 · Comedy','#movies'],
      ['Movies & Series','D.O.A.','1949 · Noir','#movies'],
      ['Movies & Series','The Little Shop of Horrors','1960 · Horror','#movies'],
      ['Gaming','What is happening in gaming','News, releases and culture from gaming.','#gaming'],
      ['Music','Listen with Untoz Music','Music discovery, playlists and stories.','#music'],
      ['Watch','Videos','Watch stories, features and Untoz productions.','#videos'],
      ['Watch','Untoz Live','Live events, broadcasts and special coverage.','#live'],
      ['Watch','Untoz+','Movies, series, live TV and events.','#untozplus'],
      ['Untoz','Productions','Original productions from across the Untoz universe.','#productions'],
      ['Untoz','The Untoz Universe','Channels, projects, productions, products and worlds.','#more'],
      ['Company','About Untoz','Media, entertainment and technology.','#about'],
      ['Company','Contact','Got an idea? Let’s make it.','#contact']
    ];
    const renderResults=(query='')=>{
      const q=query.trim().toLowerCase();
      const matches=q?searchable.filter(([cat,title,text])=>`${cat} ${title} ${text}`.toLowerCase().includes(q)):searchable.slice(0,8);
      results.innerHTML=matches.length?matches.map(([cat,title,text,href])=>`<a class="untoz-search-result" href="${href}"><small>${cat}</small><strong>${title}</strong><p>${text}</p></a>`).join(''):`<div class="untoz-search-empty">No results for “${query}”. Try another search.</div>`;
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
    mobile.addEventListener('click',()=>{let nav=header.querySelector('.untoz-site-header__mobile-nav');if(nav){nav.remove();mobile.textContent='☰';return}nav=document.createElement('nav');nav.className='untoz-site-header__mobile-nav';nav.innerHTML='<a href="#top">Home</a><a href="#news">News</a><a href="#sports">Sports</a><a href="#entertainment">Entertainment</a><a href="#movies">Movies & Series</a><a href="#productions">Productions</a><a href="#gaming">Gaming</a><a href="#music">Music</a><a href="#videos">Videos</a><a href="#live">Live</a><a href="#more">More</a>';header.appendChild(nav);mobile.textContent='✕'});
  };
  const boot=()=>{init();if(!document.querySelector('.untoz-site-header'))setTimeout(boot,80)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
