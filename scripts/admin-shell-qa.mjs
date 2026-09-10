import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.UNTOZ_QA_BASE_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.UNTOZ_QA_OUT || 'qa-artifacts';
const browser = await chromium.launch({ headless: true });
const failures = [];
const results = [];

await fs.mkdir(outDir, { recursive: true });

const viewports = [
  { name: 'admin-desktop', width: 1440, height: 960 },
  { name: 'admin-mobile', width: 390, height: 844 },
];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('untozCommandSession', JSON.stringify({
        access_token: 'qa-session',
        expires_at: Date.now() + 60 * 60 * 1000,
        email: 'qa@untoz.local',
      }));
    } catch {}
  });
  await context.route('**/api/public/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ role: 'admin', permissions: { can_publish: true, can_upload: true, can_view_audit: true, can_manage_team: true } }),
    });
  });

  const page = await context.newPage();
  try {
    const response = await page.goto(new URL('admin/', baseURL).href, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1300);

    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const auth = document.getElementById('command-auth-gate');
      const sidebar = document.querySelector('.sidebar');
      const main = document.querySelector('.main');
      return {
        commandV2: body.classList.contains('command-v2'),
        authHidden: !!auth && auth.hidden,
        sidebar: !!sidebar,
        topbar: !!document.querySelector('.topbar'),
        dashboard: !!document.querySelector('[data-command-overview]'),
        navButtons: document.querySelectorAll('.nav [data-view]').length,
        navLabels: document.querySelectorAll('.command-v2-nav-label').length,
        overflowX: Math.max(root.scrollWidth, body.scrollWidth) - innerWidth,
        fontFamily: getComputedStyle(body).fontFamily,
        sidebarWidth: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : 0,
        mainMarginLeft: main ? Math.round(parseFloat(getComputedStyle(main).marginLeft) || 0) : 0,
      };
    });

    const record = { viewport: viewport.name, status: response?.status() ?? null, ...metrics };
    results.push(record);

    if (!response || response.status() >= 400) failures.push(`${viewport.name}: HTTP ${response?.status() ?? 'no response'}`);
    if (!metrics.commandV2) failures.push(`${viewport.name}: body is missing command-v2 shell class`);
    if (!metrics.authHidden) failures.push(`${viewport.name}: QA session did not unlock the admin shell`);
    if (!metrics.sidebar || !metrics.topbar || !metrics.dashboard) failures.push(`${viewport.name}: core admin shell/dashboard did not render`);
    if (metrics.navButtons < 8) failures.push(`${viewport.name}: only ${metrics.navButtons} navigation actions rendered`);
    if (metrics.navLabels < 3) failures.push(`${viewport.name}: navigation groups were not enhanced`);
    if (metrics.overflowX > 4) failures.push(`${viewport.name}: horizontal overflow ${metrics.overflowX}px`);
    if (!metrics.fontFamily.toLowerCase().includes('montserrat')) failures.push(`${viewport.name}: Command V2 font stack is ${metrics.fontFamily}`);
    if (viewport.name === 'admin-desktop' && metrics.sidebarWidth < 250) failures.push(`${viewport.name}: desktop sidebar is unexpectedly narrow (${metrics.sidebarWidth}px)`);
    if (viewport.name === 'admin-mobile' && metrics.mainMarginLeft !== 0) failures.push(`${viewport.name}: mobile main still has ${metrics.mainMarginLeft}px left margin`);

    await page.screenshot({ path: `${outDir}/${viewport.name}.png`, fullPage: true });
  } catch (error) {
    failures.push(`${viewport.name}: ${String(error?.message || error)}`);
  } finally {
    await context.close();
  }
}

await browser.close();
await fs.writeFile(`${outDir}/admin-shell-qa.json`, JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, failures, results }, null, 2));

console.log(`Untoz Command V2 QA: ${results.length} viewport checks`);
for (const result of results) console.log(`  ✓ ${result.viewport}: ${result.navButtons} nav actions, ${result.navLabels} groups, overflow ${result.overflowX}px`);
for (const failure of failures) console.error(`  ✖ ${failure}`);
if (failures.length) process.exit(1);
console.log('✅ Untoz Command V2 shell QA passed.');
