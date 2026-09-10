import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const contentDir = path.resolve('content');
const fallbackBase = 'https://untoz-media.github.io/untoz-site';
const siteBase = String(process.env.PUBLIC_SITE_BASE || fallbackBase).replace(/\/+$/, '');

const exists = async file => fs.access(file).then(() => true).catch(() => false);
const slugify = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const xmlEscape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
const isoDay = value => { const date = new Date(value || Date.now()); return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10); };
const rfcDate = value => { const date = new Date(value || Date.now()); return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString(); };

async function readJSON(relative, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(contentDir, relative), 'utf8'));
  } catch {
    return fallback;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function canonicalFor(file) {
  let rel = path.relative(distDir, file).replaceAll('\\', '/');
  if (rel === '404.html' || rel.startsWith('admin/')) return null;
  if (rel === 'index.html') rel = '';
  else if (rel.endsWith('/index.html')) rel = rel.slice(0, -'index.html'.length);
  else if (rel.endsWith('.html')) rel = `${rel.slice(0, -5)}/`;
  return `${siteBase}/${rel}`.replace(/([^:]\/)\/+/, '$1');
}

function upsertHead(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function buildSitemap(posts, pages, brands) {
  const now = new Date();
  const urls = [
    { path: '', priority: '1.0', last: now },
    { path: 'search/', priority: '0.7', last: now },
    { path: 'entertainment/', priority: '0.7', last: now },
    { path: 'music/', priority: '0.7', last: now },
    { path: 'movies-series/', priority: '0.7', last: now },
  ];

  (Array.isArray(pages) ? pages : [])
    .filter(page => page?.status === 'Published' && slugify(page.slug))
    .forEach(page => urls.push({ path: `${slugify(page.slug)}/`, priority: '0.6', last: page.updated_at || now }));

  (Array.isArray(brands) ? brands : [])
    .filter(brand => brand?.enabled !== false && slugify(brand.id || brand.short || brand.name))
    .forEach(brand => urls.push({ path: `${slugify(brand.id || brand.short || brand.name)}/`, priority: '0.9', last: brand.updated_at || now }));

  (Array.isArray(posts) ? posts : [])
    .filter(post => post?.status === 'Published' && slugify(post.slug))
    .forEach(post => urls.push({
      path: `${slugify(post.category || 'news') || 'news'}/${slugify(post.slug)}/`,
      priority: '0.8',
      last: post.updated_at || post.published_at || post.date || now,
    }));

  const seen = new Set();
  const body = urls.filter(item => {
    const full = `${siteBase}/${item.path}`;
    if (seen.has(full)) return false;
    seen.add(full);
    return true;
  }).map(item => `  <url><loc>${xmlEscape(`${siteBase}/${item.path}`)}</loc><lastmod>${isoDay(item.last)}</lastmod><priority>${item.priority}</priority></url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildFeed(posts) {
  const published = (Array.isArray(posts) ? posts : [])
    .filter(post => post?.status === 'Published' && slugify(post.slug))
    .sort((a, b) => new Date(b.published_at || b.date || 0) - new Date(a.published_at || a.date || 0))
    .slice(0, 20);

  const items = published.map(post => {
    const url = `${siteBase}/${slugify(post.category || 'news') || 'news'}/${slugify(post.slug)}/`;
    return `    <item>\n      <title>${xmlEscape(post.title || 'Untitled story')}</title>\n      <link>${xmlEscape(url)}</link>\n      <guid>${xmlEscape(url)}</guid>\n      <pubDate>${xmlEscape(rfcDate(post.published_at || post.date))}</pubDate>\n      <description>${xmlEscape(post.excerpt || post.seo || '')}</description>\n    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Untoz</title>\n    <link>${siteBase}/</link>\n    <description>Latest stories from the Untoz universe.</description>\n    <language>en</language>\n    <lastBuildDate>${rfcDate(new Date())}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`;
}

let htmlCount = 0;
if (await exists(distDir)) {
  const files = await walk(distDir);
  for (const file of files.filter(file => file.endsWith('.html'))) {
    const canonical = canonicalFor(file);
    if (!canonical) continue;
    let html = await fs.readFile(file, 'utf8');
    html = upsertHead(html, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
    html = upsertHead(html, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`);
    if (path.relative(distDir, file).replaceAll('\\', '/') === 'index.html') {
      html = upsertHead(html, /<link\s+rel=["']alternate["'][^>]*type=["']application\/rss\+xml["'][^>]*>/i, `<link rel="alternate" type="application/rss+xml" title="Untoz RSS" href="${siteBase}/feed.xml">`);
    }
    await fs.writeFile(file, html);
    htmlCount += 1;
  }

  const [posts, pages, brandData] = await Promise.all([
    readJSON('posts.json', []),
    readJSON('pages/index.json', []),
    readJSON('brands.json', { brands: [] }),
  ]);
  const brands = Array.isArray(brandData?.brands) ? brandData.brands : [];

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap(posts, pages, brands));
  await fs.writeFile(path.join(distDir, 'feed.xml'), buildFeed(posts));
  await fs.writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${siteBase}/sitemap.xml\n`);
}

console.log(`Finalized SEO for ${htmlCount} HTML file(s) with PUBLIC_SITE_BASE=${siteBase}`);
console.log('Regenerated sitemap.xml, feed.xml and robots.txt from current published content.');
