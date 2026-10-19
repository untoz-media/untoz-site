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
    await page.waitForTimeout(1500);

    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const auth = document.getElementById('command-auth-gate');
      const sidebar = document.querySelector('.sidebar');
      const main = document.querySelector('.main');
      const sessionActions = [...document.querySelectorAll('.topbar .top-actions .command-v2-session-action')];
      return {
        commandV2: body.classList.contains('command-v2'),
        authHidden: !!auth && auth.hidden,
        sidebar: !!sidebar,
        topbar: !!document.querySelector('.topbar'),
        dashboard: !!document.querySelector('[data-command-overview]'),
        navButtons: document.querySelectorAll('.nav [data-view]').length,
        navLabels: document.querySelectorAll('.command-v2-nav-label').length,
        sessionActions: sessionActions.map(node => ({ kind: node.dataset.commandSession || '', label: node.textContent?.trim() || '' })),
        floatingSessionActions: sessionActions.filter(node => getComputedStyle(node).position === 'fixed').length,
        overflowX: Math.max(root.scrollWidth, body.scrollWidth) - innerWidth,
        fontFamily: getComputedStyle(body).fontFamily,
        sidebarWidth: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : 0,
        mainMarginLeft: main ? Math.round(parseFloat(getComputedStyle(main).marginLeft) || 0) : 0,
      };
    });

    if (!response || response.status() >= 400) failures.push(`${viewport.name}: HTTP ${response?.status() ?? 'no response'}`);
    if (!metrics.commandV2) failures.push(`${viewport.name}: body is missing command-v2 shell class`);
    if (!metrics.authHidden) failures.push(`${viewport.name}: QA session did not unlock the admin shell`);
    if (!metrics.sidebar || !metrics.topbar || !metrics.dashboard) failures.push(`${viewport.name}: core admin shell/dashboard did not render`);
    if (metrics.navButtons < 8) failures.push(`${viewport.name}: only ${metrics.navButtons} navigation actions rendered`);
    if (metrics.navLabels < 3) failures.push(`${viewport.name}: navigation groups were not enhanced`);
    if (!metrics.sessionActions.some(action => action.kind === 'sync')) failures.push(`${viewport.name}: Sync action was not integrated into the topbar`);
    if (!metrics.sessionActions.some(action => action.kind === 'signout')) failures.push(`${viewport.name}: Sign out action was not integrated into the topbar`);
    if (metrics.floatingSessionActions) failures.push(`${viewport.name}: ${metrics.floatingSessionActions} session action(s) are still fixed over content`);
    if (metrics.overflowX > 4) failures.push(`${viewport.name}: horizontal overflow ${metrics.overflowX}px`);
    if (!metrics.fontFamily.toLowerCase().includes('montserrat')) failures.push(`${viewport.name}: Command V2 font stack is ${metrics.fontFamily}`);
    if (viewport.name === 'admin-desktop' && metrics.sidebarWidth < 250) failures.push(`${viewport.name}: desktop sidebar is unexpectedly narrow (${metrics.sidebarWidth}px)`);
    if (viewport.name === 'admin-mobile' && metrics.mainMarginLeft !== 0) failures.push(`${viewport.name}: mobile main still has ${metrics.mainMarginLeft}px left margin`);

    await page.screenshot({ path: `${outDir}/${viewport.name}.png`, fullPage: true });

    await page.locator('.nav [data-view="homepage"]').click();
    await page.locator('[data-homepage-studio]').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(250);

    const studio = await page.evaluate(() => {
      const legacy = document.querySelector('.hx-panel');
      return {
        tabs: document.querySelectorAll('[data-homepage-studio] [data-hs-tab]').length,
        sections: document.querySelectorAll('[data-homepage-studio] [data-hs-section]').length,
        activeTab: document.querySelector('[data-homepage-studio] [data-hs-tab].active')?.dataset.hsTab || '',
        legacyHidden: !legacy || getComputedStyle(legacy).display === 'none',
        builderHidden: getComputedStyle(document.querySelector('.builder')).display === 'none',
        overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      };
    });
    if (studio.tabs !== 3) failures.push(`${viewport.name}: Homepage Studio rendered ${studio.tabs} tabs instead of 3`);
    if (studio.sections < 6) failures.push(`${viewport.name}: Homepage Studio rendered ${studio.sections} experience sections`);
    if (studio.activeTab !== 'experience') failures.push(`${viewport.name}: Homepage Studio defaulted to ${studio.activeTab || 'no tab'}`);
    if (!studio.legacyHidden) failures.push(`${viewport.name}: legacy Homepage Experience panel is still visible`);
    if (!studio.builderHidden) failures.push(`${viewport.name}: source builder is visible in Experience mode`);
    if (studio.overflowX > 4) failures.push(`${viewport.name}: Homepage Studio Experience overflow ${studio.overflowX}px`);

    await page.locator('[data-hs-tab="preview"]').click();
    await page.locator('[data-hs-page-frame]').waitFor({ state: 'visible', timeout: 4000 });
    const preview = await page.evaluate(() => ({
      frame: !!document.querySelector('[data-hs-page-frame]'),
      devices: document.querySelectorAll('[data-hs-device]').length,
      overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    }));
    if (!preview.frame || preview.devices !== 2) failures.push(`${viewport.name}: Homepage Studio local Preview did not render correctly`);
    if (preview.overflowX > 4) failures.push(`${viewport.name}: Homepage Studio Preview overflow ${preview.overflowX}px`);

    await page.locator('[data-hs-tab="structure"]').click();
    await page.waitForTimeout(120);
    const structure = await page.evaluate(() => ({
      builderVisible: getComputedStyle(document.querySelector('.builder')).display !== 'none',
      sourceClass: document.querySelector('.builder')?.classList.contains('hs-source-builder') || false,
      blocks: document.querySelectorAll('.builder [data-block]').length,
      overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    }));
    if (!structure.builderVisible || !structure.sourceClass) failures.push(`${viewport.name}: Structure mode did not reveal the production builder`);
    if (structure.blocks < 1) failures.push(`${viewport.name}: Structure mode has no homepage blocks`);
    if (structure.overflowX > 4) failures.push(`${viewport.name}: Homepage Studio Structure overflow ${structure.overflowX}px`);
    await page.screenshot({ path: `${outDir}/${viewport.name}-homepage-studio.png`, fullPage: true });

    await page.locator('.nav [data-view="posts"]').click();
    await page.locator('[data-posts-workspace-hero]').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(300);
    const newsroom = await page.evaluate(() => ({
      hero: !!document.querySelector('[data-posts-workspace-hero]'),
      metrics: document.querySelectorAll('.pw-metrics > div').length,
      statusTabs: document.querySelectorAll('[data-pw-status]').length,
      rows: document.querySelectorAll('.pw-list-panel tr[data-pw-row]').length,
      listToolbar: !!document.querySelector('.pw-list-panel .command-list-tools'),
      overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    }));
    if (!newsroom.hero || newsroom.metrics !== 5) failures.push(`${viewport.name}: Newsroom editorial overview did not render correctly`);
    if (newsroom.statusTabs !== 4) failures.push(`${viewport.name}: Newsroom rendered ${newsroom.statusTabs} status filters instead of 4`);
    if (newsroom.rows < 1) failures.push(`${viewport.name}: Newsroom has no annotated story rows`);
    if (!newsroom.listToolbar) failures.push(`${viewport.name}: Newsroom search/filter toolbar did not mount`);
    if (newsroom.overflowX > 4) failures.push(`${viewport.name}: Newsroom overflow ${newsroom.overflowX}px`);
    await page.screenshot({ path: `${outDir}/${viewport.name}-newsroom.png`, fullPage: true });

    const firstPost = page.locator('.pw-list-panel [data-edit-post]').first();
    await firstPost.click();
    await page.locator('[data-post-editor2]').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('[data-pw-editor-context]').waitFor({ state: 'visible', timeout: 4000 });
    await page.waitForTimeout(180);
    const postEditor = await page.evaluate(() => ({
      context: !!document.querySelector('[data-pw-editor-context]'),
      editorV2: document.querySelector('[data-post-editor2]')?.classList.contains('pw-editor-v2') || false,
      headline: !!document.getElementById('p2-title'),
      richText: !!document.getElementById('p2-content'),
      publishPanel: !!document.getElementById('p2-status'),
      seoScore: !!document.getElementById('p2-score'),
      previewTabs: document.querySelectorAll('[data-preview]').length,
      overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    }));
    if (!postEditor.context || !postEditor.editorV2) failures.push(`${viewport.name}: Posts editor V2 context/polish did not mount`);
    if (!postEditor.headline || !postEditor.richText || !postEditor.publishPanel || !postEditor.seoScore) failures.push(`${viewport.name}: core post editor controls are missing`);
    if (postEditor.previewTabs !== 3) failures.push(`${viewport.name}: post editor has ${postEditor.previewTabs} preview modes instead of 3`);
    if (postEditor.overflowX > 4) failures.push(`${viewport.name}: post editor overflow ${postEditor.overflowX}px`);
    await page.screenshot({ path: `${outDir}/${viewport.name}-post-editor.png`, fullPage: true });

    results.push({ viewport: viewport.name, status: response?.status() ?? null, ...metrics, studio, preview, structure, newsroom, postEditor });
  } catch (error) {
    failures.push(`${viewport.name}: ${String(error?.message || error)}`);
  } finally {
    await context.close();
  }
}

await browser.close();
await fs.writeFile(`${outDir}/admin-shell-qa.json`, JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, failures, results }, null, 2));

console.log(`Untoz Command V2 QA: ${results.length} viewport checks`);
for (const result of results) console.log(`  ✓ ${result.viewport}: studio ${result.studio.tabs} tabs/${result.studio.sections} sections, newsroom ${result.newsroom.rows} stories, editor ${result.postEditor.previewTabs} previews, overflow ${result.overflowX}px`);
for (const failure of failures) console.error(`  ✖ ${failure}`);
if (failures.length) process.exit(1);
console.log('✅ Untoz Command V2 shell + Homepage Studio + Newsroom QA passed.');
