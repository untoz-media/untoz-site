import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.UNTOZ_QA_BASE_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.UNTOZ_QA_OUT || 'qa-artifacts';
const slugify = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const interactions = [];
const fatal = [];
const warnings = [];

const viewports = [
  { name: 'fhd', width: 1920, height: 1080 },
  { name: 'qhd', width: 2560, height: 1440 },
  { name: '4k', width: 3840, height: 2160 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];

async function getJSON(path, fallback) {
  try {
    const response = await fetch(new URL(path, baseURL));
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

const [posts, categories, brandData] = await Promise.all([
  getJSON('content/posts.json', []),
  getJSON('content/categories.json', []),
  getJSON('content/brands.json', { brands: [] }),
]);

const publishedPost = (Array.isArray(posts) ? posts : []).find(p => p?.status === 'Published' && slugify(p.slug) && slugify(p.category));
const articlePath = publishedPost ? `${slugify(publishedPost.category)}/${slugify(publishedPost.slug)}/` : null;
const categoryPath = (Array.isArray(categories) ? categories : []).map(slugify).find(Boolean);
const brandPaths = (Array.isArray(brandData?.brands) ? brandData.brands : []).filter(b => b?.enabled !== false).map(b => `${slugify(b.id || b.short || b.name)}/`).filter(Boolean);

const routes = [
  { id: 'home', path: '' },
  { id: 'search', path: 'search/?q=Untoz' },
  { id: 'about', path: 'about/' },
  { id: 'contact', path: 'contact/' },
  ...brandPaths.slice(0, 8).map(path => ({ id: `brand-${path.replaceAll('/', '')}`, path })),
  ...(categoryPath ? [{ id: `category-${categoryPath}`, path: `${categoryPath}/` }] : []),
  ...(articlePath ? [{ id: 'article', path: articlePath }] : []),
  { id: '404', path: '404.html' },
];

function shouldScreenshot(routeId, viewportName) {
  if (viewportName === 'fhd' || viewportName === 'mobile') return ['home', 'search', 'about', 'contact', 'article', '404', 'brand-sports'].includes(routeId);
  if (viewportName === 'qhd' || viewportName === '4k') return routeId === 'home';
  return routeId === 'home' || routeId === 'about';
}

async function revealBeforeScreenshot(page) {
  await page.evaluate(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const step = Math.max(360, Math.floor(innerHeight * 0.72));
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    for (let y = 0; y <= max; y += step) {
      scrollTo(0, y);
      await wait(55);
    }
    scrollTo(0, max);
    await wait(140);
    scrollTo(0, 0);
    await wait(140);
  });
}

async function inspectPage(page, route, viewport, theme = 'light') {
  const url = new URL(route.path, baseURL).href;
  const jsErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => jsErrors.push(String(error?.message || error)));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.addInitScript(selectedTheme => {
    try { localStorage.setItem('untoz-theme', selectedTheme); } catch {}
  }, theme);

  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(900);

  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const interactive = [...document.querySelectorAll('a,button,input,select,textarea,[role="button"]')];
    const unnamed = interactive.filter(el => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        return !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`) || el.closest('label'));
      }
      const label = (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title');
      return !label;
    }).length;
    const sameOriginBrokenImages = [...document.images].filter(img => {
      try {
        const u = new URL(img.currentSrc || img.src, location.href);
        return u.origin === location.origin && img.complete && img.naturalWidth === 0;
      } catch { return false; }
    }).map(img => img.currentSrc || img.src);
    const externalBrokenImages = [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.currentSrc || img.src).filter(Boolean);
    const fontFamily = getComputedStyle(body).fontFamily;
    const mainCount = document.querySelectorAll('main').length;
    const headingCount = document.querySelectorAll('h1').length;
    const headerCount = document.querySelectorAll('header').length;
    const footerCount = document.querySelectorAll('footer').length;
    return {
      title: document.title,
      overflowX: Math.max(root.scrollWidth, body.scrollWidth) - innerWidth,
      unnamedInteractive: unnamed,
      sameOriginBrokenImages,
      externalBrokenImages,
      fontFamily,
      mainCount,
      headingCount,
      headerCount,
      footerCount,
      bodyTheme: root.dataset.theme || (body.classList.contains('theme-dark') ? 'dark' : 'light'),
    };
  });

  const record = {
    route: route.id,
    path: route.path || '/',
    viewport: viewport.name,
    theme,
    status: response?.status() ?? null,
    ...metrics,
    jsErrors,
    consoleErrors,
  };
  results.push(record);

  if (!response || response.status() >= 400 && route.id !== '404') fatal.push(`${viewport.name}/${route.id}: HTTP ${response?.status() ?? 'no response'}`);
  if (metrics.overflowX > 4) fatal.push(`${viewport.name}/${route.id}: horizontal overflow ${metrics.overflowX}px`);
  if (jsErrors.length) fatal.push(`${viewport.name}/${route.id}: page errors: ${jsErrors.join(' | ')}`);
  if (metrics.sameOriginBrokenImages.length) fatal.push(`${viewport.name}/${route.id}: broken local images: ${metrics.sameOriginBrokenImages.join(', ')}`);
  if (metrics.mainCount === 0) warnings.push(`${viewport.name}/${route.id}: no <main> landmark`);
  if (metrics.headingCount === 0) warnings.push(`${viewport.name}/${route.id}: no <h1>`);
  if (metrics.unnamedInteractive > 0) warnings.push(`${viewport.name}/${route.id}: ${metrics.unnamedInteractive} unnamed interactive element(s)`);
  if (!metrics.fontFamily.toLowerCase().includes('montserrat') && !['404'].includes(route.id)) warnings.push(`${viewport.name}/${route.id}: body font is ${metrics.fontFamily}`);
  if (metrics.externalBrokenImages.length) warnings.push(`${viewport.name}/${route.id}: ${metrics.externalBrokenImages.length} broken image(s), including external resources`);
  if (consoleErrors.length) warnings.push(`${viewport.name}/${route.id}: console error(s): ${consoleErrors.slice(0, 3).join(' | ')}`);

  if (theme === 'light' && shouldScreenshot(route.id, viewport.name)) {
    await revealBeforeScreenshot(page);
    const filename = `${viewport.name}-${route.id}.png`.replace(/[^a-z0-9_.-]/gi, '-');
    await page.screenshot({ path: `${outDir}/${filename}`, fullPage: true });
  }
}

async function interactionCheck(name, viewport, path, test) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    await page.goto(new URL(path, baseURL).href, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(900);
    const detail = await test(page);
    interactions.push({ name, passed: true, detail: detail || 'ok' });
  } catch (error) {
    const message = String(error?.message || error);
    interactions.push({ name, passed: false, detail: message });
    fatal.push(`interaction/${name}: ${message}`);
  } finally {
    await context.close();
  }
}

for (const viewport of viewports) {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    try {
      await inspectPage(page, route, viewport, 'light');
    } catch (error) {
      fatal.push(`${viewport.name}/${route.id}: ${String(error?.message || error)}`);
    } finally {
      await context.close();
    }
  }
}

const darkRoutes = routes.filter(route => ['home', 'search', 'about', 'article', 'brand-news'].includes(route.id));
for (const route of darkRoutes) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    await inspectPage(page, route, { name: 'fhd-dark', width: 1920, height: 1080 }, 'dark');
    await revealBeforeScreenshot(page);
    await page.screenshot({ path: `${outDir}/fhd-dark-${route.id}.png`, fullPage: true });
  } catch (error) {
    fatal.push(`fhd-dark/${route.id}: ${String(error?.message || error)}`);
  } finally {
    await context.close();
  }
}

await interactionCheck('homepage-carousel', { width: 1920, height: 1080 }, '', async page => {
  const dots = page.locator('.hero-dots button');
  if (await dots.count() < 2) throw new Error('hero carousel dots were not rendered');
  const firstCurrent = await page.locator('.hero-dots button[aria-current="true"]').getAttribute('data-slide');
  await page.locator('#heroNext').click();
  await page.waitForTimeout(120);
  const nextCurrent = await page.locator('.hero-dots button[aria-current="true"]').getAttribute('data-slide');
  if (firstCurrent === nextCurrent) throw new Error('next control did not change active slide');
  const unlabeled = await dots.evaluateAll(items => items.filter(item => !item.getAttribute('aria-label')).length);
  if (unlabeled) throw new Error(`${unlabeled} carousel dot(s) are missing aria-label`);
  return `slide ${firstCurrent} → ${nextCurrent}`;
});

await interactionCheck('mobile-navigation', { width: 390, height: 844 }, '', async page => {
  const toggle = page.locator('#siteMenuToggle');
  await toggle.click();
  await page.waitForTimeout(80);
  if (!await page.locator('#siteMobileNav.open').isVisible()) throw new Error('mobile navigation did not open');
  await toggle.click();
  await page.waitForTimeout(80);
  if (await page.locator('#siteMobileNav.open').count()) throw new Error('mobile navigation did not close');
  return 'open/close passed';
});

await interactionCheck('search-brand-filter', { width: 1440, height: 900 }, 'search/?q=Untoz', async page => {
  const brandsButton = page.locator('[data-search-filter="Brands"]');
  await brandsButton.click();
  await page.waitForTimeout(150);
  if (!await brandsButton.evaluate(el => el.classList.contains('active'))) throw new Error('Brands filter did not become active');
  const resultTypes = await page.locator('.search-result-type').allTextContents();
  if (resultTypes.some(type => type.trim() !== 'Brand')) throw new Error('Brands filter returned a non-brand result');
  return `${resultTypes.length} brand result(s)`;
});

await interactionCheck('institutional-theme-toggle', { width: 1440, height: 900 }, 'about/', async page => {
  const before = await page.evaluate(() => document.documentElement.dataset.theme || 'light');
  await page.locator('#pageThemeToggle').click();
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => document.documentElement.dataset.theme || 'light');
  if (before === after) throw new Error('theme toggle did not change document theme');
  return `${before} → ${after}`;
});

await interactionCheck('contact-mail-link', { width: 1440, height: 900 }, 'contact/', async page => {
  const count = await page.locator('a[href^="mailto:"]').count();
  if (!count) throw new Error('contact page has no mailto action');
  return `${count} mail action(s)`;
});

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  baseURL,
  routes: routes.map(r => r.path || '/'),
  viewports,
  checks: results.length,
  interactionChecks: interactions.length,
  fatal: [...new Set(fatal)],
  warnings: [...new Set(warnings)],
  interactions,
  results,
};

await fs.writeFile(`${outDir}/qa-results.json`, JSON.stringify(report, null, 2));

console.log(`\nUntoz Browser QA: ${results.length} page checks + ${interactions.length} interaction checks`);
console.log(`Fatal issues: ${report.fatal.length}`);
for (const issue of report.fatal) console.error(`  ✖ ${issue}`);
console.log(`Warnings: ${report.warnings.length}`);
for (const warning of report.warnings.slice(0, 40)) console.warn(`  ⚠ ${warning}`);
for (const interaction of interactions) console.log(`  ${interaction.passed ? '✓' : '✖'} ${interaction.name}: ${interaction.detail}`);
if (report.warnings.length > 40) console.warn(`  … ${report.warnings.length - 40} more warning(s) in qa-results.json`);

if (report.fatal.length) process.exit(1);
console.log('✅ Untoz V2 browser QA passed.');
