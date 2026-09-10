const root=document.getElementById('root');
const heroSlides=[
['UNTOZ+','A world<br>of stories.','Movies, series, live TV, live events and more.<br>All in one place.','https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2000&q=90'],
['UNTOZ SPACE','Beyond<br>our world.','Missions, discoveries and stories from across the universe.','https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2000&q=90'],
['UNTOZ LIVE','Moments<br>that matter.','Live events, special broadcasts and coverage from Untoz.','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=90']
];
const cards=[
['LIVE','Untoz Live','Live events, broadcasts and special coverage.','https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85'],
['STREAMING','Streaming now','Movies, series, live TV and events.','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85'],
['LATEST','Untoz News','The latest stories from the Untoz universe.','https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85']
];
const featured=[
['His Girl Friday','Movie','https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=85'],
['D.O.A.','Movie','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85'],
['Plan 9 from Outer Space','Movie','https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=700&q=85'],
['House on Haunted Hill','Movie','https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&w=700&q=85'],
['The Little Shop of Horrors','Movie','https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?auto=format&fit=crop&w=700&q=85'],
['Untoz Space','Series','https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=85']
];
const sectionTitle=(t)=>`<div class="section-title"><h2>${t}</h2><a href="#footer">View all →</a></div>`;
root.innerHTML=`
<div id="top">
<div id="untoz-global-header"></div>
<header class="untoz-site-header">
  <a class="untoz-site-header__logo" href="#top" aria-label="Untoz home">untoz</a>
  <nav class="untoz-site-header__nav" aria-label="Untoz site navigation">
    <a class="active" href="#top">Home</a>
    <a href="#stories">News</a>
    <a href="#explore">Sports</a>
    <a href="#stories">Entertainment</a>
    <a href="#featured">Movies & Series</a>
    <a href="#explore">Gaming</a>
    <a href="#explore">Music</a>
    <a href="#videos">Videos</a>
    <a href="#events">Calendar</a>
    <a href="#universe">Universe</a>
  </nav>
  <div class="untoz-site-header__actions">
    <a class="untoz-site-header__action desktop-only" href="./search/" aria-label="Search Untoz">⌕</a>
    <button class="untoz-site-header__action untoz-site-header__menu" id="siteMenuToggle" type="button" aria-label="Open menu">☰</button>
    <a class="untoz-site-header__live" href="#live"><i></i> LIVE</a>
  </div>
  <nav class="untoz-site-header__mobile-nav" id="siteMobileNav" aria-label="Untoz mobile navigation">
    <a href="#top">Home</a><a href="#stories">News</a><a href="#explore">Sports</a><a href="#stories">Entertainment</a><a href="#featured">Movies & Series</a><a href="#explore">Gaming</a><a href="#explore">Music</a><a href="#videos">Videos</a><a href="#events">Calendar</a><a href="#universe">Universe</a><a href="./search/">Search</a>
  </nav>
</header>
<main class="page">
<section class="hero"><img id="heroImg" src="${heroSlides[0][3]}" alt="" fetchpriority="high" decoding="async"><div class="hero-shade"></div><button class="hero-arrow left" id="heroPrev">‹</button><button class="hero-arrow right" id="heroNext">›</button><div class="hero-copy"><small id="heroEyebrow">${heroSlides[0][0]}</small><h1 id="heroTitle">${heroSlides[0][1]}</h1><p id="heroText">${heroSlides[0][2]}</p><div><a class="pill primary" href="https://untozplus.com/">▶ Watch on Untoz+</a><a class="pill ghost" href="#featured">Explore</a></div></div><div class="hero-kicker">OUR PLANET<br>OUR STORIES<br>ONE UNIVERSE.</div><div class="hero-dots">${heroSlides.map((_,i)=>`<button data-slide="${i}" class="${i===0?'active':''}"></button>`).join('')}</div></section>
<div class="live-strip" id="live"><div class="live-left"><span class="live-badge"><i></i> LIVE NOW</span><div><b>Untoz Live</b><small>Live events, broadcasts and special coverage.</small></div></div><div class="live-next"><span>NEXT</span><div><b>WorldUnited 2026 · Updates</b><small>Coming soon</small></div></div><a href="#events">View schedule →</a></div>
<section class="section now">${sectionTitle('Now on Untoz')}<div class="now-grid">${cards.map((c,i)=>`<a href="#stories" class="now-card"><img src="${c[3]}" alt="" loading="lazy" decoding="async"><div class="card-shade"></div><span class="tag t${i}">${c[0]}</span><div class="now-copy"><h3>${c[1]}</h3><p>${c[2]}</p></div><span class="round-arrow">›</span></a>`).join('')}</div></section>
<section class="section stories" id="stories"><div class="stories-head"><h2>Top Stories</h2><div class="filters"><button class="active">All</button><button>News</button><button>Entertainment</button><button>Sports</button><button>Gaming</button><button>Space</button></div><a href="#footer">View all →</a></div><div class="stories-grid"><a class="lead-story" href="#footer"><img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=90" alt="" loading="lazy" decoding="async"><div class="card-shade"></div><span class="story-tag">ENTERTAINMENT</span><div class="lead-copy"><h3>The Untoz Awards are heading to Dubai</h3><p>The next edition of the Untoz Awards will take place in Dubai, bringing together the biggest names in music, film, TV and digital entertainment.</p><b>Read more →</b></div></a><div class="story-list"><a href="#footer"><img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=85" alt="" loading="lazy" decoding="async"><div><small>SPACE</small><h3>Untoz Space: looking beyond Earth</h3><p>Exploring a bigger, brighter future.</p></div></a><a href="#footer"><img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=700&q=85" alt="" loading="lazy" decoding="async"><div><small>SPORTS</small><h3>Live coverage, results and highlights</h3><p>All the latest from the world of sport.</p></div></a><a href="#footer"><img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=85" alt="" loading="lazy" decoding="async"><div><small>GAMING</small><h3>Everything from the latest gaming news</h3><p>Games, trailers and more.</p></div></a></div></div></section>
<section class="section" id="featured">${sectionTitle('Featured in Untoz+')}<div class="featured-grid">${featured.map(f=>`<a href="https://untozplus.com/" class="featured-card"><img src="${f[2]}" alt="" loading="lazy" decoding="async"><b>${f[0]}</b><small>${f[1]}</small></a>`).join('')}</div></section>
<section class="section" id="explore">${sectionTitle('Explore Untoz')}<div class="explore-grid"><a class="explore-card blue" href="#featured"><div>▣</div><span>Movies & Series</span><b>›</b></a><a class="explore-card purple" href="#stories"><div>☆</div><span>Entertainment</span><b>›</b></a><a class="explore-card green" href="#stories"><div>⚽</div><span>Sports</span><b>›</b></a><a class="explore-card orange" href="#stories"><div>⌘</div><span>Gaming</span><b>›</b></a><a class="explore-card pink" href="#stories"><div>♫</div><span>Music</span><b>›</b></a><a class="explore-card indigo" href="#stories"><div>◌</div><span>Space</span><b>›</b></a></div></section>
<section class="section lower"><div class="events" id="events">${sectionTitle('Upcoming Events')}<div class="event-list"><a href="#footer"><div class="date"><b>20</b><span>OCT</span></div><div><small>Untoz</small><strong>Untoz Anniversary</strong></div><b>›</b></a><a href="#footer"><div class="date"><b>31</b><span>DEC</span></div><div><small>Untoz Live</small><strong>New Year Celebrations</strong></div><b>›</b></a><a href="https://awards.untoz.site/"><div class="date"><b>APR</b><span>2027</span></div><div><small>Sydney</small><strong>Untoz Awards 2027</strong></div><b>›</b></a></div></div><a class="universe-card" id="universe" href="#footer"><img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=90" alt="" loading="lazy" decoding="async"><div class="card-shade"></div><div><small>THE UNTOZ UNIVERSE</small><h2>Everything Untoz,<br>in one place.</h2><p>Channels, projects, productions,<br>products and worlds.</p><span class="pill primary light">Explore the universe →</span></div><strong style="position:absolute;right:35px;top:50%;transform:translateY(-50%);z-index:2;font-size:80px;color:#04db7d">∞</strong></a><div class="videos" id="videos">${sectionTitle('Latest Videos')}<div class="video-list">${[['Untoz is now streaming','01:24'],['Inside the Untoz Awards','02:37'],['Looking beyond Earth','05:12'],['The Untoz story','04:05']].map((v,i)=>`<a href="#footer"><div class="video-thumb"><img src="${featured[(i+1)%featured.length][2]}" alt="" loading="lazy" decoding="async"><span>▶</span></div><div><strong>${v[0]}</strong><small>${v[1]}</small></div><b>›</b></a>`).join('')}</div></div></section>
</main>
<footer id="footer"><div class="footer-inner"><div><a href="#top" class="brand">untoz</a><p>The media, entertainment and technology<br>universe of infinite.</p></div><div><b>Explore</b><a href="#stories">News</a><a href="#explore">Sports</a><a href="#stories">Entertainment</a><a href="#featured">Movies & Series</a><a href="#explore">Gaming</a><a href="#explore">Music</a></div><div><b>Watch</b><a href="#videos">Videos</a><a href="#live">Live</a><a href="#events">Calendar</a></div><div><b>Untoz</b><a href="#featured">Productions</a><a href="#universe">Universe</a><a href="./about/">About</a><a href="./contact/">Contact</a></div><div class="social"><a href="#footer">X</a><a href="#footer">▶</a><a href="#footer">◎</a></div></div><div class="footer-bottom"><div><a href="#footer">Privacy</a><a href="#footer">Terms</a><a href="#footer">Cookies</a></div><span>© 2026 Untoz. All rights reserved.</span></div></footer>
</div>`;
if(window.UntozGlobalHeader){UntozGlobalHeader.render(document.getElementById('untoz-global-header'),{active:'untoz'});}
let dark=localStorage.getItem('untoz-theme')==='dark';
function applyTheme(){document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('untoz-theme',dark?'dark':'light')}
window.addEventListener('untoz:themechange',e=>{dark=e.detail?.theme==='dark';applyTheme()});applyTheme();
const siteMenuToggle=document.getElementById('siteMenuToggle');const siteMobileNav=document.getElementById('siteMobileNav');if(siteMenuToggle&&siteMobileNav){siteMenuToggle.addEventListener('click',()=>{const open=siteMobileNav.classList.toggle('open');siteMenuToggle.textContent=open?'×':'☰';siteMenuToggle.setAttribute('aria-label',open?'Close menu':'Open menu')});siteMobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{siteMobileNav.classList.remove('open');siteMenuToggle.textContent='☰'}));}
let heroIndex=0;
function showHero(i){heroIndex=(i+heroSlides.length)%heroSlides.length;const s=heroSlides[heroIndex];document.getElementById('heroImg').src=s[3];document.getElementById('heroEyebrow').textContent=s[0];document.getElementById('heroTitle').innerHTML=s[1];document.getElementById('heroText').innerHTML=s[2];document.querySelectorAll('.hero-dots button').forEach((b,n)=>b.classList.toggle('active',n===heroIndex))}
document.getElementById('heroPrev').addEventListener('click',()=>showHero(heroIndex-1));document.getElementById('heroNext').addEventListener('click',()=>showHero(heroIndex+1));document.querySelectorAll('.hero-dots button').forEach(b=>b.addEventListener('click',()=>showHero(Number(b.dataset.slide))));setInterval(()=>showHero(heroIndex+1),7000);
