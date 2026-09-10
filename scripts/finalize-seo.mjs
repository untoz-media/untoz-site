import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const fallbackBase = 'https://untoz-media.github.io/untoz-site';
const siteBase = String(process.env.PUBLIC_SITE_BASE || fallbackBase).replace(/\/+$/, '');
const legacyBase = 'https://untoz-media.github.io/untoz-site';

const exists = async file => fs.access(file).then(() => true).catch(() => false);

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

  for (const name of ['robots.txt', 'sitemap.xml', 'feed.xml']) {
    const file = path.join(distDir, name);
    if (!await exists(file)) continue;
    const current = await fs.readFile(file, 'utf8');
    await fs.writeFile(file, current.replaceAll(legacyBase, siteBase));
  }
}

console.log(`Finalized SEO for ${htmlCount} HTML file(s) with PUBLIC_SITE_BASE=${siteBase}`);
