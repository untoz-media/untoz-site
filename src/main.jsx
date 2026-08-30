import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, ArrowUpRight, Menu, Play, Sparkles, Radio, Film, Gamepad2, Newspaper, Music2, Cpu, X, Sun, Moon, Search, Globe2, Users, Eye, CalendarDays, MonitorPlay } from 'lucide-react'
import './styles.css'

const capabilities = [
  { title: 'Live Broadcasting', text: 'We broadcast your event to the world with professional quality.', icon: Radio },
  { title: 'Video Production', text: 'From concept to final cut. We create stunning videos that tell your story.', icon: Film },
  { title: 'Streaming Solutions', text: 'Multi-platform streaming, 24/7 channels and custom solutions.', icon: MonitorPlay },
  { title: 'News Coverage', text: 'Fast, accurate and reliable news from everywhere.', icon: Newspaper },
  { title: 'Sports Media', text: 'Live sports, highlights, analysis and exclusive content.', icon: Globe2 },
  { title: 'AI Solutions', text: 'Innovative AI tools and solutions for the future of media.', icon: Sparkles },
]
const products = [
  { name: 'untoz+', type: 'Streaming', accent: 'plus', description: 'The streaming platform of the future.' },
  { name: 'untoz studio ai', type: 'AI & Creative', accent: 'studio', description: 'AI-powered tools for creators and storytellers.' },
  { name: 'untoz hq', type: 'Management', accent: 'hq', description: 'Manage your AI workforce and projects.' },
  { name: 'untoz motion ai', type: 'Motion & Design', accent: 'motion', description: 'Create stunning motion designs with AI.' },
  { name: 'untoz one', type: 'AI Platform', accent: 'one', description: 'All-in-one AI tools for everyone.' },
]
const projects = [
  { title: 'New Year 2026 Celebrations', type: 'Live Broadcast', image: 'https://images.unsplash.com/photo-1485872299829-c673f5194813?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Starship Flight Test Coverage', type: 'Live Broadcast', image: 'https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Untoz Awards 2026 Dubai', type: 'Live Event', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Artemis II: Return to the Moon', type: 'Documentary', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Untoz Fest 2026 Highlights', type: 'Event Coverage', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80' },
]
const news = [
  ['11/07/2026', 'Untoz Announces Official Untoz+ Launch Event for August 12', 'COMPANY'],
  ['28/06/2026', 'Update on Untoz+', 'PRODUCTS'],
  ['01/07/2026', 'Untoz Fest 2026 will take place from August 12 to 13', 'EVENTS'],
  ['05/07/2026', 'Untoz Marks America\'s 250th Anniversary with a 7-Hour Live', 'LIVE'],
]

function GlobalHeader() {
  return <div className="global-header"><a className="global-brand" href="#top">UNTOZ</a><nav className="global-nav"><a href="#products">UNTOZ+</a><a href="#news">NEWS</a><a href="#projects">SPORTS</a><a href="#products">GAMING</a><button className="global-more">MORE <span>+</span></button></nav><button className="global-menu" aria-label="Open menu"><Menu size={18} /></button></div>
}
function SiteHeader({ dark, setDark }) {
  const [open, setOpen] = useState(false)
  return <header className="site-header"><a className="site-logo" href="#top">untoz</a><nav className="site-nav"><a href="#top">Home</a><a href="#products">Products</a><a href="#about">Services</a><a href="#projects">Projects</a><a href="#news">News</a><a href="#about">About</a><a href="#contact">Contact</a></nav><div className="header-actions"><button className="icon-button" aria-label="Search"><Search size={16} /></button><button className="theme-toggle" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><a className="watch-button" href="#projects">Watch Live <Radio size={13} /></a><button className="mobile-menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X size={19} /> : <Menu size={19} />}</button></div>{open && <nav className="mobile-nav"><a href="#top" onClick={() => setOpen(false)}>Home</a><a href="#products" onClick={() => setOpen(false)}>Products</a><a href="#about" onClick={() => setOpen(false)}>Services</a><a href="#projects" onClick={() => setOpen(false)}>Projects</a><a href="#news" onClick={() => setOpen(false)}>News</a><a href="#about" onClick={() => setOpen(false)}>About</a><a href="#contact" onClick={() => setOpen(false)}>Contact</a></nav>}</header>
}
function App() {
  const [scroll, setScroll] = useState(0)
  const [dark, setDark] = useState(true)
  useEffect(() => { const onScroll = () => setScroll(window.scrollY); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll) }, [])
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light' }, [dark])
  return <div id="top" className="app"><GlobalHeader /><SiteHeader dark={dark} setDark={setDark} /><div className="scroll-progress" style={{ transform: `scaleX(${Math.min(scroll / (document.documentElement.scrollHeight - window.innerHeight || 1), 1)})` }} /><main>
    <section className="hero section-pad"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> UNTOZ MEDIA GROUP</p><h1>Creating the<br />future of<br /><em>entertainment.</em></h1><p className="hero-description">We produce, create and deliver world-class content, live events and digital experiences to audiences around the world.</p><div className="hero-actions"><a className="primary-button" href="#projects">Explore Our Work <ArrowRight size={16} /></a><a className="secondary-button" href="#about">Our Services</a></div></div><div className="hero-art"><div className="hero-image"><div className="stage-lights" /><div className="hero-screen">untoz<span>+</span></div><div className="hero-crowd" /></div><div className="hero-live"><span>● LIVE NOW</span><strong>New Year 2026 Celebrations</strong><small>Watch on Untoz+</small></div><div className="hero-dots"><i /><i /><i /></div></div><div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="hero-line" /></div></section>
    <section id="about" className="about section-pad"><div className="section-kicker">WHAT WE DO</div><h2 className="center-heading">Everything we do. <span>For everyone.</span></h2><div className="capability-grid">{capabilities.map(({ title, text, icon: Icon }) => <article className="capability-card" key={title}><div className="capability-icon"><Icon size={22} /></div><div><h3>{title}</h3><p>{text}</p><a href="#contact">Learn more <ArrowRight size={13} /></a></div></article>)}</div></section>
    <section id="products" className="products section-pad"><div className="section-heading"><div><div className="section-kicker">OUR PRODUCTS</div><h2>Built for <span>the future.</span></h2></div><a className="text-link" href="#products">See all products <ArrowRight size={14} /></a></div><div className="product-strip">{products.map(product => <article className={`product-card ${product.accent}`} key={product.name}><div className="product-logo">{product.name}</div><div className="product-info"><h3>{product.name}</h3><p>{product.description}</p></div></article>)}<button className="strip-next" aria-label="Next products"><ArrowRight size={16} /></button></div></section>
    <section id="projects" className="projects section-pad"><div className="section-heading"><div><div className="section-kicker">FEATURED PROJECTS</div><h2>Our latest <span>projects.</span></h2></div><a className="text-link" href="#projects">View all projects <ArrowRight size={14} /></a></div><div className="project-grid">{projects.map(project => <article className="project-card" key={project.title}><div className="project-image" style={{ backgroundImage: `url(${project.image})` }} /><div className="project-overlay" /><div className="project-copy"><h3>{project.title}</h3><p>{project.type}</p></div></article>)}</div></section>
    <section className="numbers section-pad"><div className="numbers-glow" /><div className="stats"><div><Users /><strong>100<span>+</span></strong><p>Productions</p></div><div><Radio /><strong>50<span>+</span></strong><p>Live Broadcasts</p></div><div><Eye /><strong>10M<span>+</span></strong><p>Views Worldwide</p></div><div><Globe2 /><strong>150<span>+</span></strong><p>Countries Reached</p></div><div><CalendarDays /><strong>Since 2020</strong><p>Creating Experiences</p></div></div></section>
    <section id="news" className="news section-pad"><div className="section-heading"><div><div className="section-kicker">LATEST NEWS</div><h2>Stay up to <span>date.</span></h2></div><a className="text-link" href="#news">View all news <ArrowRight size={14} /></a></div><div className="news-grid">{news.map(([date, title, category]) => <article key={title}><div className="news-thumb"><span>{category}</span></div><div className="news-body"><small>{date}</small><h3>{title}</h3><a href="#news">Read more <ArrowRight size={13} /></a></div></article>)}</div></section>
    <section id="contact" className="broadcast-cta"><div><h2>Have an event to broadcast?</h2><p>We'll help you reach the world.</p><a className="primary-button" href="#contact">Request a Broadcast <ArrowRight size={15} /></a></div><div className="cta-features"><span><Sparkles /> Professional<br />Production</span><span><Globe2 /> Worldwide<br />Streaming</span><span><MonitorPlay /> Multi-Platform<br />Delivery</span><span><Users /> End-to-End<br />Support</span></div></section>
  </main><footer className="footer section-pad"><div className="footer-top"><a className="footer-logo" href="#top">untoz</a><p>Creating the future of entertainment.</p></div><div className="footer-grid">{[['Untoz','About','Services','Projects','Productions','News'],['Products','Untoz+','Untoz Studio AI','Untoz HQ','Untoz Motion AI','Untoz One'],['Explore','Movies','Gaming','Music','Sports','Space'],['Company','Contact','Careers','Press','Privacy','Terms']].map(([heading,...links]) => <div key={heading}><h4>{heading}</h4>{links.map(link => <a href="#top" key={link}>{link}</a>)}</div>)}</div><div className="footer-bottom"><span>© 2026 Untoz Media Group. All rights reserved.</span><div><a href="#top">X</a><a href="#top">YouTube</a><a href="#top">Instagram</a><a href="#top">TikTok</a><a href="#top">Facebook</a></div></div></footer></div>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
