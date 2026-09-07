import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{Search,Moon,Sun,User,ChevronDown,ChevronRight,ChevronLeft,Play,ArrowRight,Clapperboard,Star,Balloon,Gamepad2,Music2,Orbit,Infinity,Twitter,Youtube,Instagram}from'lucide-react';
import'./styles.css';

const heroSlides=[
 {eyebrow:'UNTOZ+',title:'A world\nof stories.',text:'Movies, series, live TV, live events and more.\nAll in one place.',image:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2000&q=90'},
 {eyebrow:'UNTOZ SPACE',title:'Beyond\nour world.',text:'Missions, discoveries and stories from across the universe.',image:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2000&q=90'},
 {eyebrow:'UNTOZ LIVE',title:'Moments\nthat matter.',text:'Live events, special broadcasts and coverage from Untoz.',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=90'}
];

const nowCards=[
 {tag:'LIVE',title:'Untoz Live',text:'Live events, broadcasts and special coverage.',image:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85'},
 {tag:'STREAMING',title:'Streaming now',text:'Movies, series, live TV and events.',image:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85'},
 {tag:'LATEST',title:'Untoz News',text:'The latest stories from the Untoz universe.',image:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85'}
];

const stories=[
 {tag:'ENTERTAINMENT',title:'The Untoz Awards are heading to Dubai',text:'The next edition of the Untoz Awards will take place in Dubai, bringing together the biggest names in music, film, TV and digital entertainment.',image:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=90'},
 {tag:'SPACE',title:'Untoz Space: looking beyond Earth',text:'Exploring a bigger, brighter future.',image:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=85'},
 {tag:'SPORTS',title:'Live coverage, results and highlights',text:'All the latest from the world of sport.',image:'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=700&q=85'},
 {tag:'GAMING',title:'Everything from the latest gaming news',text:'Games, trailers and more.',image:'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=85'}
];

const featured=[
 ['His Girl Friday','Movie','https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=85'],
 ['D.O.A.','Movie','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85'],
 ['Plan 9 from Outer Space','Movie','https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=700&q=85'],
 ['House on Haunted Hill','Movie','https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&w=700&q=85'],
 ['The Little Shop of Horrors','Movie','https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?auto=format&fit=crop&w=700&q=85'],
 ['Untoz Space','Series','https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=85']
];

const explore=[
 ['Movies & Series',Clapperboard,'blue'],['Entertainment',Star,'purple'],['Sports',Balloon,'green'],['Gaming',Gamepad2,'orange'],['Music',Music2,'pink'],['Space',Orbit,'indigo']
];

const events=[['12','AUG','Untoz+ Launch'],['13','AUG','Untoz Fest'],['20','OCT','Untoz Anniversary'],['APR','2027','Untoz Awards 2027']];
const videos=[['Untoz is now streaming','01:24'],['Inside the Untoz Awards','02:37'],['Looking beyond Earth','05:12'],['The Untoz story','04:05']];

function Brand(){return <a href="#top" className="brand">untoz</a>}

function GlobalHeader({dark,setDark}){return <div className="global-header"><div className="global-inner"><nav><a className="active" href="#top">UNTOZ</a><a href="https://untozplus.com/">UNTOZ+</a><a href="#stories">NEWS</a><a href="#explore">SPORTS</a><a href="#explore">GAMING</a><a href="#footer">MORE <ChevronDown size={11}/></a></nav><div className="global-tools"><button aria-label="Search"><Search size={16}/></button><button aria-label={dark?'Light mode':'Dark mode'} onClick={()=>setDark(v=>!v)}>{dark?<Sun size={16}/>:<Moon size={16}/>}</button><span/><button aria-label="Account"><User size={15}/></button></div></div></div>}

function SiteHeader(){return <header className="site-header"><div className="site-inner"><Brand/><nav><a className="active" href="#top">Home</a><a href="#stories">News</a><a href="#explore">Sports</a><a href="#stories">Entertainment</a><a href="#featured">Movies & Series</a><a href="#explore">Gaming</a><a href="#explore">Music</a></nav><div className="site-links"><a className="onair" href="#live"><i/> ON AIR</a><a href="#videos">Videos</a><a href="#live">Live</a><a href="#events">Calendar</a><a href="#featured">Productions</a><a href="#universe">Universe</a></div></div></header>}

function Hero(){const[index,setIndex]=useState(0);useEffect(()=>{const id=setInterval(()=>setIndex(i=>(i+1)%heroSlides.length),7000);return()=>clearInterval(id)},[]);const s=heroSlides[index];return <section className="hero"><img src={s.image} alt=""/><div className="hero-shade"/><button className="hero-arrow left" onClick={()=>setIndex(i=>(i-1+heroSlides.length)%heroSlides.length)}><ChevronLeft/></button><button className="hero-arrow right" onClick={()=>setIndex(i=>(i+1)%heroSlides.length)}><ChevronRight/></button><div className="hero-copy"><small>{s.eyebrow}</small><h1>{s.title.split('\n').map((x,i)=><React.Fragment key={x}>{x}{i===0&&<br/>}</React.Fragment>)}</h1><p>{s.text.split('\n').map((x,i)=><React.Fragment key={x}>{x}{i===0&&<br/>}</React.Fragment>)}</p><div><a className="pill primary" href="https://untozplus.com/"><Play size={14} fill="currentColor"/> Watch on Untoz+</a><a className="pill ghost" href="#featured">Explore</a></div></div><div className="hero-kicker">OUR PLANET<br/>OUR STORIES<br/>ONE UNIVERSE.</div><div className="hero-dots">{heroSlides.map((_,i)=><button key={i} className={i===index?'active':''} onClick={()=>setIndex(i)}/>)}</div></section>}

function LiveStrip(){return <div className="live-strip" id="live"><div className="live-left"><span className="live-badge"><i/> LIVE NOW</span><div><b>Untoz Live</b><small>Live events, broadcasts and special coverage.</small></div></div><div className="live-next"><span>NEXT</span><div><b>WorldUnited 2026 · Teaser</b><small>Today, 18:00</small></div></div><a href="#events">View schedule <ArrowRight size={14}/></a></div>}

function SectionTitle({children,link='View all'}){return <div className="section-title"><h2>{children}</h2><a href="#footer">{link} <ArrowRight size={14}/></a></div>}

function App(){const[dark,setDark]=useState(()=>localStorage.getItem('untoz-theme')==='dark');useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('untoz-theme',dark?'dark':'light')},[dark]);return <div id="top"><GlobalHeader dark={dark} setDark={setDark}/><SiteHeader/><main className="page"><Hero/><LiveStrip/>
<section className="section now"><SectionTitle>Now on Untoz</SectionTitle><div className="now-grid">{nowCards.map((c,i)=><a href="#stories" className="now-card" key={c.title}><img src={c.image} alt=""/><div className="card-shade"/><span className={`tag t${i}`}>{c.tag}</span><div className="now-copy"><h3>{c.title}</h3><p>{c.text}</p></div><span className="round-arrow"><ChevronRight size={17}/></span></a>)}</div></section>
<section className="section stories" id="stories"><div className="stories-head"><h2>Top Stories</h2><div className="filters"><button className="active">All</button><button>News</button><button>Entertainment</button><button>Sports</button><button>Gaming</button><button>Space</button></div><a href="#footer">View all <ArrowRight size={14}/></a></div><div className="stories-grid"><a className="lead-story" href="#footer"><img src={stories[0].image} alt=""/><div className="card-shade"/><span className="story-tag">{stories[0].tag}</span><div className="lead-copy"><h3>{stories[0].title}</h3><p>{stories[0].text}</p><b>Read more <ArrowRight size={14}/></b></div></a><div className="story-list">{stories.slice(1).map(s=><a href="#footer" key={s.title}><img src={s.image} alt=""/><div><small>{s.tag}</small><h3>{s.title}</h3><p>{s.text}</p></div></a>)}</div></div></section>
<section className="section" id="featured"><SectionTitle>Featured in Untoz+</SectionTitle><div className="featured-grid">{featured.map(([title,type,img])=><a href="https://untozplus.com/" className="featured-card" key={title}><img src={img} alt=""/><b>{title}</b><small>{type}</small></a>)}</div></section>
<section className="section" id="explore"><SectionTitle link="">Explore Untoz</SectionTitle><div className="explore-grid">{explore.map(([name,Icon,tone])=><a href="#footer" className={`explore-card ${tone}`} key={name}><Icon size={30}/><span>{name}</span><ChevronRight size={18}/></a>)}</div></section>
<section className="section lower"><div className="events" id="events"><SectionTitle>Upcoming Events</SectionTitle><div className="event-list">{events.map(([a,b,title])=><a href="#footer" key={title}><div className="date"><b>{a}</b><span>{b}</span></div><div><small>Untoz</small><strong>{title}</strong></div><ChevronRight size={17}/></a>)}</div></div><a className="universe-card" id="universe" href="#footer"><img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=90" alt=""/><div className="card-shade"/><div><small>THE UNTOZ UNIVERSE</small><h2>Everything Untoz,<br/>in one place.</h2><p>Channels, projects, productions,<br/>products and worlds.</p><span className="pill primary light">Explore the universe <ArrowRight size={14}/></span></div><Infinity size={92}/></a><div className="videos" id="videos"><SectionTitle>Latest Videos</SectionTitle><div className="video-list">{videos.map(([title,time],i)=><a href="#footer" key={title}><div className="video-thumb"><img src={featured[(i+1)%featured.length][2]} alt=""/><span><Play size={13} fill="currentColor"/></span></div><div><strong>{title}</strong><small>{time}</small></div><ChevronRight size={16}/></a>)}</div></div></section>
</main><footer id="footer"><div className="footer-inner"><div><Brand/><p>The media, entertainment and technology<br/>universe of infinite.</p></div><div><b>Explore</b><a href="#stories">News</a><a href="#explore">Sports</a><a href="#stories">Entertainment</a><a href="#featured">Movies & Series</a><a href="#explore">Gaming</a><a href="#explore">Music</a></div><div><b>Watch</b><a href="#videos">Videos</a><a href="#live">Live</a><a href="#events">Calendar</a></div><div><b>Untoz</b><a href="#featured">Productions</a><a href="#universe">Universe</a><a href="mailto:contact@untoz.site">Contact</a></div><div className="social"><Twitter/><Youtube/><Instagram/></div></div><div className="footer-bottom"><div><a href="#footer">Privacy</a><a href="#footer">Terms</a><a href="#footer">Cookies</a></div><span>© 2026 Untoz. All rights reserved.</span></div></footer></div>}

createRoot(document.getElementById('root')).render(<App/>);
