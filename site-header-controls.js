(() => {
  const header = document.querySelector('.untoz-site-header');
  if (!header) return;

  const actions = header.querySelector('.untoz-site-header__actions');
  if (!actions) return;

  const existingSearch = actions.querySelector('[aria-label="Search Untoz"]');
  if (existingSearch) existingSearch.remove();

  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.id = 'siteThemeToggle';
  themeButton.className = 'untoz-site-header__action';
  themeButton.setAttribute('aria-label', 'Toggle color theme');

  const searchButton = document.createElement('button');
  searchButton.type = 'button';
  searchButton.id = 'siteSearchToggle';
  searchButton.className = 'untoz-site-header__action desktop-only';
  searchButton.setAttribute('aria-label', 'Search Untoz');
  searchButton.innerHTML = '<span aria-hidden="true">⌕</span>';

  const menuButton = actions.querySelector('#siteMenuToggle');
  actions.insertBefore(themeButton, menuButton || actions.firstChild);
  actions.insertBefore(searchButton, menuButton || actions.firstChild);

  const getTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const syncThemeIcon = () => {
    const dark = getTheme() === 'dark';
    themeButton.innerHTML = dark ? '<span aria-hidden="true">☀</span>' : '<span aria-hidden="true">☾</span>';
    themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };

  syncThemeIcon();
  themeButton.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('untoz-theme', next);
    syncThemeIcon();
    window.dispatchEvent(new CustomEvent('untoz:themechange', { detail: { theme: next } }));
  });
  window.addEventListener('untoz:themechange', syncThemeIcon);

  const searchable = [
    ['Home', 'Untoz home', '#top'],
    ['Top Stories', 'News and latest stories from Untoz', '#stories'],
    ['Untoz Live', 'Live events, broadcasts and special coverage', '#live'],
    ['Featured in Untoz+', 'Movies, series and streaming highlights', '#featured'],
    ['Sports', 'Untoz Sports coverage', '#explore'],
    ['Entertainment', 'Entertainment from across Untoz', '#stories'],
    ['Gaming', 'Untoz Gaming news and content', '#explore'],
    ['Music', 'Untoz Music', '#explore'],
    ['Space', 'Untoz Space', '#explore'],
    ['Upcoming Events', 'Untoz calendar and events', '#events'],
    ['Latest Videos', 'Watch the latest Untoz videos', '#videos'],
    ['Untoz Universe', 'Projects, productions, products and worlds', '#universe'],
    ['His Girl Friday', 'Movie on Untoz+', '#featured'],
    ['D.O.A.', 'Movie on Untoz+', '#featured'],
    ['Plan 9 from Outer Space', 'Movie on Untoz+', '#featured'],
    ['House on Haunted Hill', 'Movie on Untoz+', '#featured'],
    ['The Little Shop of Horrors', 'Movie on Untoz+', '#featured'],
    ['The Untoz Awards are heading to Dubai', 'Entertainment story', '#stories'],
    ['Untoz Space: looking beyond Earth', 'Space story', '#stories']
  ];

  const overlay = document.createElement('div');
  overlay.className = 'untoz-search-overlay';
  overlay.id = 'untozSearchOverlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="untoz-search-backdrop" data-search-close></div>
    <div class="untoz-search-box" role="dialog" aria-modal="true" aria-labelledby="untozSearchTitle">
      <div class="untoz-search-head">
        <div>
          <span>UNTOZ</span>
          <h2 id="untozSearchTitle">Search Untoz</h2>
        </div>
        <button type="button" class="untoz-search-close" data-search-close aria-label="Close search">×</button>
      </div>
      <label class="untoz-search-input-wrap">
        <span aria-hidden="true">⌕</span>
        <input id="untozSearchInput" type="search" autocomplete="off" placeholder="Search news, movies, sports, gaming..." aria-label="Search Untoz" />
      </label>
      <div class="untoz-search-results" id="untozSearchResults"></div>
      <div class="untoz-search-hint">Press Esc to close</div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#untozSearchInput');
  const results = overlay.querySelector('#untozSearchResults');

  function renderResults(query = '') {
    const q = query.trim().toLowerCase();
    const items = searchable.filter(([title, desc]) => !q || `${title} ${desc}`.toLowerCase().includes(q)).slice(0, 8);
    results.innerHTML = items.length
      ? items.map(([title, desc, href]) => `<a class="untoz-search-result" href="${href}"><div><strong>${title}</strong><span>${desc}</span></div><b>→</b></a>`).join('')
      : '<div class="untoz-search-empty">No results found.</div>';
    results.querySelectorAll('a').forEach(a => a.addEventListener('click', closeSearch));
  }

  function openSearch() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('untoz-search-open');
    renderResults('');
    requestAnimationFrame(() => input.focus());
  }

  function closeSearch() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('untoz-search-open');
    input.value = '';
  }

  searchButton.addEventListener('click', openSearch);
  overlay.querySelectorAll('[data-search-close]').forEach(el => el.addEventListener('click', closeSearch));
  input.addEventListener('input', e => renderResults(e.target.value));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
  });
})();
