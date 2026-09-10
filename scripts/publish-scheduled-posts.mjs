import fs from 'node:fs';
import path from 'node:path';

const SITE_BASE = String(process.env.PUBLIC_SITE_BASE || 'https://untoz-media.github.io/untoz-site').replace(/\/+$/, '');
const postsPath = path.resolve('content/posts.json');
const pagesPath = path.resolve('content/pages/index.json');
const brandsPath = path.resolve('content/brands.json');
const now = process.env.UNTOZ_SCHEDULER_NOW ? new Date(process.env.UNTOZ_SCHEDULER_NOW) : new Date();

if (Number.isNaN(now.getTime())) throw new Error('UNTOZ_SCHEDULER_NOW is not a valid date.');
if (!fs.existsSync(postsPath)) throw new Error(`Missing ${postsPath}`);

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
if (!Array.isArray(posts)) throw new Error('content/posts.json must contain an array.');
const pages = fs.existsSync(pagesPath) ? JSON.parse(fs.readFileSync(pagesPath, 'utf8')) : [];
const brandData = fs.existsSync(brandsPath) ? JSON.parse(fs.readFileSync(brandsPath, 'utf8')) : { brands: [] };
const brands = Array.isArray(brandData?.brands) ? brandData.brands : [];

const slugify = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const htmlEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const xmlEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[m]));
const isoDay = (value) => { const d = new Date(value || Date.now()); return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10); };
const rfcDate = (value) => { const d = new Date(value || Date.now()); return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString(); };

function articleRouteHtml(post) {
  const slug = slugify(post.slug || post.title || 'story');
  const category = slugify(post.category || 'news') || 'news';
  const title = htmlEscape(post.seo_title || post.title || 'Untoz');
  const desc = htmlEscape(post.seo || post.excerpt || 'Untoz story.');
  const image = htmlEscape(post.image || '');
  const url = `${SITE_BASE}/${category}/${slug}/`;
  return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <meta name="robots" content="index,follow">\n  <meta name="description" content="${desc}">\n  <link rel="canonical" href="${htmlEscape(url)}">\n  <meta property="og:type" content="article">\n  <meta property="og:site_name" content="Untoz">\n  <meta property="og:url" content="${htmlEscape(url)}">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${desc}">\n  ${image ? `<meta property="og:image" content="${image}">\n  <meta name="twitter:image" content="${image}">\n  ` : ''}<meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${title}">\n  <meta name="twitter:description" content="${desc}">\n  <title>${title} — Untoz</title>\n  <link rel="stylesheet" href="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.css">\n  <link rel="stylesheet" href="../../article-renderer.css">\n</head>\n<body data-article-category="${htmlEscape(category)}" data-article-slug="${htmlEscape(slug)}">\n  <div id="article-root"></div>\n  <script src="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.js"></script>\n  <script src="../../article-renderer.js"></script>\n</body>\n</html>\n`;
}

function writeArticleRoute(post) {
  const slug = slugify(post.slug || post.title || 'story');
  const category = slugify(post.category || 'news') || 'news';
  if (!slug) return;
  const html = articleRouteHtml(post);
  for (const prefix of ['', 'public']) {
    const dir = path.resolve(prefix, category, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }
}

function sitemapXml() {
  const urls = [
    { path: '', priority: '1.0', last: now },
    { path: 'search/', priority: '0.7', last: now },
    { path: 'entertainment/', priority: '0.7', last: now },
    { path: 'music/', priority: '0.7', last: now },
    { path: 'movies-series/', priority: '0.7', last: now }
  ];
  (Array.isArray(pages) ? pages : []).filter(p => p?.status === 'Published' && slugify(p.slug)).forEach(p => urls.push({ path: `${slugify(p.slug)}/`, priority: '0.6', last: p.updated_at || now }));
  brands.filter(b => b?.enabled !== false && slugify(b.id || b.short || b.name)).forEach(b => urls.push({ path: `${slugify(b.id || b.short || b.name)}/`, priority: '0.9', last: now }));
  posts.filter(p => p?.status === 'Published' && slugify(p.slug)).forEach(p => urls.push({ path: `${slugify(p.category || 'news') || 'news'}/${slugify(p.slug)}/`, priority: '0.8', last: p.published_at || p.date || p.updated_at || now }));
  const seen = new Set();
  const body = urls.filter(u => { const full = `${SITE_BASE}/${u.path}`; if (seen.has(full)) return false; seen.add(full); return true; }).map(u => `  <url><loc>${xmlEscape(`${SITE_BASE}/${u.path}`)}</loc><lastmod>${isoDay(u.last)}</lastmod><priority>${u.priority}</priority></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function rssXml() {
  const published = posts.filter(p => p?.status === 'Published' && slugify(p.slug)).sort((a, b) => new Date(b.published_at || b.date || 0) - new Date(a.published_at || a.date || 0)).slice(0, 20);
  const items = published.map(p => {
    const url = `${SITE_BASE}/${slugify(p.category || 'news') || 'news'}/${slugify(p.slug)}/`;
    return `    <item>\n      <title>${xmlEscape(p.title || 'Untitled story')}</title>\n      <link>${xmlEscape(url)}</link>\n      <guid>${xmlEscape(url)}</guid>\n      <pubDate>${xmlEscape(rfcDate(p.published_at || p.date))}</pubDate>\n      <description>${xmlEscape(p.excerpt || p.seo || '')}</description>\n    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Untoz</title>\n    <link>${SITE_BASE}/</link>\n    <description>Latest stories from the Untoz universe.</description>\n    <language>en</language>\n    <lastBuildDate>${rfcDate(now)}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`;
}

function writeSeoFiles() {
  const sitemap = sitemapXml();
  const feed = rssXml();
  const robots = `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_BASE}/sitemap.xml\n`;
  for (const [relative, content] of [['sitemap.xml', sitemap], ['feed.xml', feed], ['robots.txt', robots]]) {
    fs.writeFileSync(path.resolve(relative), content);
    fs.writeFileSync(path.resolve('public', relative), content);
  }
}

const published = [];
const invalid = [];
for (const post of posts) {
  if (post?.status !== 'Scheduled') continue;
  const scheduledAt = new Date(post.scheduled_at || '');
  if (Number.isNaN(scheduledAt.getTime())) { invalid.push(post.slug || post.title || 'untitled-post'); continue; }
  if (scheduledAt.getTime() > now.getTime()) continue;
  post.status = 'Published';
  post.published_at = post.published_at || post.scheduled_at || now.toISOString();
  post.updated_at = now.toISOString();
  if (!post.date) post.date = scheduledAt.toISOString().slice(0, 10);
  writeArticleRoute(post);
  published.push(post.slug || post.title || 'untitled-post');
}

if (invalid.length) console.warn(`Scheduled posts with invalid dates: ${invalid.join(', ')}`);
const changed = published.length > 0;
if (changed) {
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + '\n');
  writeSeoFiles();
  console.log(`Published ${published.length} scheduled post(s): ${published.join(', ')}`);
  console.log('Updated sitemap.xml, feed.xml and robots.txt.');
} else console.log('No scheduled posts are due.');

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${published.length}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `posts=${published.join(',')}\n`);
}
