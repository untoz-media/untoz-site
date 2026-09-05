(() => {
  const base = document.querySelector('base')?.href || new URL('./', location.href).href;
  const url = (path) => new URL(path, base).href;

  const apply = (data) => {
    if (!data) return;
    const posts = Array.isArray(data.posts) ? data.posts.filter(p => p.status === 'Published') : [];
    if (data.site?.title) {
      document.title = data.site.title + ' — The Untoz Media Portal';
      const description = document.querySelector('meta[name="description"]');
      if (description && data.site.description) description.setAttribute('content', data.site.description);
    }

    const cards = [...document.querySelectorAll('.media-card')];
    posts.slice(0, cards.length).forEach((post, i) => {
      const card = cards[i];
      const tag = post.category || 'UNTOZ';
      card.querySelector('.media-image span')?.replaceChildren(document.createTextNode(tag.toUpperCase()));
      card.querySelector('.media-card-body small')?.replaceChildren(document.createTextNode(tag.toUpperCase()));
      const title = card.querySelector('h3');
      if (title) title.textContent = post.title || title.textContent;
      const excerpt = card.querySelector('p');
      if (excerpt && post.excerpt) excerpt.textContent = post.excerpt;
    });

    const latest = posts[0];
    if (latest) {
      const breaking = document.querySelector('.breaking a[href="#news"]');
      if (breaking) breaking.textContent = latest.title;
      const now = [...document.querySelectorAll('.now-card')].find(el => el.querySelector('small')?.textContent.trim() === 'LATEST');
      if (now) {
        const h = now.querySelector('h3');
        const p = now.querySelector('p');
        if (h) h.textContent = latest.title;
        if (p && latest.excerpt) p.textContent = latest.excerpt;
      }
    }

    if (data.homepage?.blocks) {
      const hero = data.homepage.blocks.find(b => b.type === 'hero');
      if (hero?.props) {
        const heroTitle = document.querySelector('.portal-hero .hero-label span');
        if (heroTitle && hero.props.title) heroTitle.textContent = hero.props.title.toUpperCase();
      }
      const plus = data.homepage.blocks.find(b => b.type === 'cta');
      if (plus?.props) {
        const plusSection = document.querySelector('#untozplus');
        if (plusSection) {
          const h = plusSection.querySelector('h2');
          const p = plusSection.querySelector('p');
          const a = plusSection.querySelector('a');
          if (h && plus.props.title) h.textContent = plus.props.title;
          if (p && plus.props.subtitle) p.textContent = plus.props.subtitle;
          if (a && plus.props.button) a.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.textContent = ' ' + plus.props.button; });
        }
      }
    }
  };

  Promise.all([
    fetch(url('content/site.json'), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(url('content/posts.json'), { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(url('content/homepage.json'), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
  ]).then(([site, posts, homepage]) => apply({ site: site?.site ? site : site, posts, homepage }));
})();
