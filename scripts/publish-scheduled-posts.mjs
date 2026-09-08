import fs from 'node:fs';
import path from 'node:path';

const postsPath = path.resolve('content/posts.json');
const now = process.env.UNTOZ_SCHEDULER_NOW ? new Date(process.env.UNTOZ_SCHEDULER_NOW) : new Date();

if (Number.isNaN(now.getTime())) throw new Error('UNTOZ_SCHEDULER_NOW is not a valid date.');
if (!fs.existsSync(postsPath)) throw new Error(`Missing ${postsPath}`);

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
if (!Array.isArray(posts)) throw new Error('content/posts.json must contain an array.');

const slugify = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const htmlEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function articleRouteHtml(post) {
  const slug = slugify(post.slug || post.title || 'story');
  const category = slugify(post.category || 'news') || 'news';
  const title = htmlEscape(post.seo_title || post.title || 'Untoz');
  const desc = htmlEscape(post.seo || post.excerpt || 'Untoz story.');
  const image = htmlEscape(post.image || '');
  return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <meta name="robots" content="index,follow">\n  <meta name="description" content="${desc}">\n  <meta property="og:type" content="article">\n  <meta property="og:site_name" content="Untoz">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${desc}">\n  ${image ? `<meta property="og:image" content="${image}">\n  <meta name="twitter:image" content="${image}">\n  ` : ''}<meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${title}">\n  <meta name="twitter:description" content="${desc}">\n  <title>${title} — Untoz</title>\n  <link rel="stylesheet" href="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.css">\n  <link rel="stylesheet" href="../../article-renderer.css">\n</head>\n<body data-article-category="${htmlEscape(category)}" data-article-slug="${htmlEscape(slug)}">\n  <div id="article-root"></div>\n  <script src="https://untoz-media.github.io/untoz-global-header/src/untoz-global-header.js"></script>\n  <script src="../../article-renderer.js"></script>\n</body>\n</html>\n`;
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
  console.log(`Published ${published.length} scheduled post(s): ${published.join(', ')}`);
} else console.log('No scheduled posts are due.');

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${published.length}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `posts=${published.join(',')}\n`);
}
