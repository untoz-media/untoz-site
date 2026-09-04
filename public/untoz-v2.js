(()=>{
  const productions=[
    ['UNTOZ AWARDS 2026','LIVE EVENT','Dubai · 2026','The next edition of the Untoz Awards arrives in Dubai.'],
    ['UNTOZ FEST 2026','FESTIVAL','August 12–13','Two days of music, entertainment, live coverage and the Untoz Universe.'],
    ['NEW YEAR 2026','LIVE BROADCAST','December 31','A global celebration produced and broadcast by Untoz.'],
    ['STARSHIP COVERAGE','LIVE BROADCAST','SPACE','Live spaceflight coverage, analysis and the moments that matter.']
  ];
  const dates=[
    ['12','AUG','Untoz+ Launch Event','Live · 17:00'],
    ['12','AUG','Untoz Fest','Event · 19:00'],
    ['13','AUG','Untoz Fest · Day 2','Event coverage'],
    ['31','DEC','New Year Celebrations','Live broadcast']
  ];
  function section(title,kicker,copy,html,id){
    const s=document.createElement('section');s.className='untoz-v2-rail';if(id)s.id=id;
    s.innerHTML=`<div class="untoz-v2-rail-head"><div><div class="label">${kicker}</div><h2>${title}</h2></div>${copy?`<p>${copy}</p>`:''}</div>${html}`;
    return s;
  }
  function buildProductions(){
    if(document.querySelector('#productions-v2'))return true;
    const about=document.querySelector('#about');if(!about)return false;
    const html=`<div class="u-production-grid">${productions.map(p=>`<article class="u-production"><span class="u-year">${p[2]}</span><span class="u-tag">${p[1]}</span><h3>${p[0]}</h3><p>${p[3]}</p></article>`).join('')}</div>`;
    about.parentNode.insertBefore(section("What's happening.",'PRODUCTIONS','Big moments, live broadcasts and original projects from across the Untoz Universe.',html,'productions-v2'),about);
    return true;
  }
  function buildCalendar(){
    if(document.querySelector('#calendar-v2'))return true;
    const about=document.querySelector('#about');if(!about)return false;
    const html=`<div class="u-calendar">${dates.map(d=>`<article class="u-date"><i class="u-dot"></i><b>${d[0]}</b><small>${d[1]}</small><h3>${d[2]}</h3><span>${d[3]}</span></article>`).join('')}</div>`;
    about.parentNode.insertBefore(section("What's coming.",'UNTOZ CALENDAR','A simple view of upcoming broadcasts, events and moments worth putting in your calendar.',html,'calendar-v2'),about);
    return true;
  }
  function tuneCopy(){
    const projects=document.querySelector('#projects .head h2');if(projects)projects.innerHTML='Featured<br/><span>productions.</span>';
    const news=document.querySelector('#news .head h2');if(news)news.innerHTML="What's<br/><span>new.</span>";
    const films=document.querySelector('#films .head h2');if(films)films.innerHTML='Watch<br/><span>something.</span>';
    const watch=document.querySelector('#watch .head h2');if(watch)watch.innerHTML='Always<br/><span>something on.</span>';
  }
  function removeCorporateStats(){document.querySelectorAll('.stats').forEach(x=>x.remove())}
  function boot(){
    const mounted=buildProductions();
    buildCalendar();
    tuneCopy();
    removeCorporateStats();
    return mounted;
  }
  if(boot())return;
  const observer=new MutationObserver(()=>{if(boot())observer.disconnect()});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),10000);
})();
