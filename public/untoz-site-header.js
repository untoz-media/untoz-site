(() => {
  const init=()=>{
    if(document.querySelector('.untoz-site-header')) return;
    const global=document.getElementById('untoz-global-header');
    if(!global) return;
    const header=document.createElement('header');
    header.className='untoz-site-header';
    header.innerHTML=`<a class="untoz-site-header__logo" href="#top">untoz<sup>®</sup></a><nav class="untoz-site-header__nav" aria-label="Untoz site navigation"><a href="#top">Home</a><a href="#universe">Products</a><a href="#services">Services</a><a href="#projects">Projects</a><a href="#news">News</a><a href="#about">About</a><a href="#contact">Contact</a></nav><div class="untoz-site-header__actions"><button class="search" type="button" aria-label="Search">⌕</button><button class="theme" type="button" aria-label="Toggle theme">☼</button><a class="untoz-site-header__live" href="#watch">●&nbsp; Watch Live</a><button class="untoz-site-header__mobile" type="button" aria-label="Open menu">☰</button></div>`;
    global.insertAdjacentElement('afterend',header);
    const theme=header.querySelector('.theme');
    theme.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='light';document.documentElement.dataset.theme=dark?'light':'dark';theme.textContent=dark?'☾':'☼'});
    const mobile=header.querySelector('.untoz-site-header__mobile');
    mobile.addEventListener('click',()=>{let nav=header.querySelector('.untoz-site-header__mobile-nav');if(nav){nav.remove();mobile.textContent='☰';return}nav=document.createElement('nav');nav.className='untoz-site-header__mobile-nav';nav.innerHTML='<a href="#top">Home</a><a href="#universe">Products</a><a href="#services">Services</a><a href="#projects">Projects</a><a href="#news">News</a><a href="#about">About</a><a href="#contact">Contact</a>';header.appendChild(nav);mobile.textContent='✕'});
  };
  const boot=()=>{init();if(!document.querySelector('.untoz-site-header'))setTimeout(boot,80)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
