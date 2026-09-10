# Untoz

> The official web portal for Untoz — media, entertainment and technology.

[![Website](https://img.shields.io/badge/Website-Live-0cdb46?style=for-the-badge)](https://untoz-media.github.io/untoz-site/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-1f6ffa?style=for-the-badge&logo=github)](https://untoz-media.github.io/untoz-site/)
[![Untoz](https://img.shields.io/badge/Untoz-2026-ff7c04?style=for-the-badge)](https://untoz.site/)

## About

Untoz is a media, technology and entertainment company building one connected universe of stories, products and experiences.

The main Untoz portal brings together the company, its media brands, productions, products and services — including Untoz News, Untoz Sports, Untoz Pop, Untoz Gaming, Untoz Space, Untoz Kids, Untoz Archives, Untoz+, AURA-1 and Untoz Clip.

## Untoz V2

**Untoz V2 is live on GitHub Pages.** It is a site-wide design system rather than a homepage-only refresh and now powers the public portal across homepage, editorial, search, network and institutional experiences.

The V2 direction is built around:

- **Montserrat** as the primary Untoz interface typeface
- Untoz green `#0cdb46`, blue `#1f6ffa` and orange `#ff7c04`
- large editorial typography and stronger visual hierarchy
- rounded, premium surfaces with restrained motion
- a consistent dark navigation language across public routes
- brand-led subsidiary pages that use each brand accent without losing the Untoz system
- responsive layouts, keyboard focus states and `prefers-reduced-motion` support
- content-driven experiences that remain compatible with Untoz Command and the existing CMS runtime

## Portal architecture

The project intentionally keeps presentation layers separated from content and CMS logic so design work can move quickly without destabilising publishing.

Key V2 files include:

- `home-v2.js` — homepage structural enhancement layer
- `src/home-v2.css` — homepage V2 foundation
- `home-v2-phase2.js` — content-driven brand and experience runtime
- `src/home-v2-phase2.css` — homepage brand art direction and motion
- `src/home-v2-polish.css` — visual QA and finishing layer
- `category-renderer.css` — category V2 styling
- `article-renderer.css` — article V2 styling
- `search-renderer.css` — Untoz Search V2 styling
- `subsidiary-renderer.js` / `subsidiary-renderer.css` — shared Untoz network brand runtime
- `page-renderer.js` — reusable CMS-backed institutional/static page runtime
- `page-v2.css` — V2 institutional page visual layer
- `page-v2-states.css` — loading, empty and error-state polish
- `404.html` — custom V2 error experience
- `public/admin/homepage-experience-manager.js` — V2 homepage experience editor and publish safeguard
- `scripts/browser-qa.mjs` — production browser, interaction and SEO QA
- `scripts/finalize-seo.mjs` — canonical/OG/RSS/SEO origin finalizer for `dist`

The `public/` runtime mirrors critical public-facing renderer files where required so local/build behaviour stays aligned.

## Institutional pages

About, Contact and future CMS-backed public pages use the shared page renderer rather than bespoke hard-coded layouts.

The institutional system includes:

- brand-first CSS art direction without stock imagery
- reusable hero, heading, text, quote, columns, button, image and video blocks
- a shared premium footer and navigation system
- designed loading, empty, unavailable and error states
- direct loading of build-local page JSON before falling back to the published `main` copy
- static SEO metadata for About and Contact so those routes do not depend on JavaScript to become indexable

The detailed page JSON lives in `content/pages/<slug>.json`; searchable page summaries live in `content/pages/index.json`.

## Content

Editorial and homepage content lives under `content/` and is validated before production builds.

Important data files include:

- `content/homepage.json`
- `content/posts.json`
- `content/brands.json`
- `content/categories.json`
- `content/pages/index.json`
- `content/pages/<slug>.json`

`content/homepage.json` keeps the classic homepage `blocks` payload while V2 adds an `experience` object for the manifesto, brand rail, featured productions, products, stats and final CTA. This keeps the new experience editable without replacing the existing publishing model.

## Untoz Command

Untoz Command is the internal publishing/admin layer used to manage portal content. The V2 Homepage Experience editor extends the existing Homepage Builder and preserves the V2 `experience` configuration when the classic homepage payload is published.

Institutional pages remain CMS-backed through the existing page block model, so About, Contact and future static routes can evolve without creating bespoke front-end implementations for every page.

## Development

Install dependencies:

```bash
npm install
```

Start the local Vite development server:

```bash
npm run dev
```

Validate CMS/content data:

```bash
npm run validate:content
```

Create the production build:

```bash
npm run build
```

The production build validates content, builds with Vite, copies content, prunes stale generated routes, injects analytics and finalizes canonical/OG/RSS metadata for the configured production origin.

### Production origin

`PUBLIC_SITE_BASE` controls the absolute public origin used in canonical URLs, `og:url`, sitemap, RSS and robots metadata.

Current GitHub Pages production value:

```text
https://untoz-media.github.io/untoz-site
```

The deploy, scheduled publishing and content CI workflows declare this value explicitly. This keeps the current GitHub Pages deployment internally consistent while making a future custom-domain cutover a configuration change rather than a code rewrite.

### `untoz.site` cutover

`untoz.site` currently serves the previous portal, so it must **not** become the V2 canonical until DNS/hosting is switched.

When the V2 is ready to take over `untoz.site`:

1. point the domain DNS/custom-domain configuration to GitHub Pages;
2. set `PUBLIC_SITE_BASE=https://untoz.site` in the relevant workflows/environment;
3. ensure the Pages custom-domain configuration preserves that hostname in the published artifact;
4. deploy and verify `robots.txt`, `sitemap.xml`, `feed.xml`, canonical and `og:url` on the live domain;
5. only then retire or redirect the previous portal.

## Quality gates

Changes should keep the following green before merging:

- Untoz Content CI
- CMS/content validation
- production Vite build
- production-dist Chromium QA
- canonical/OG/sitemap/RSS/robots checks
- homepage carousel, mobile navigation, search filtering, theme toggle and contact interaction checks
- Untoz Bot workflow

Browser QA runs against the built `dist`, not the Vite development runtime, so the tested output matches what GitHub Pages receives.

## Network

Untoz currently exposes shared public experiences for brands including:

- Untoz News
- Untoz Sports
- Untoz Pop
- Untoz Gaming
- Untoz Space
- Untoz Kids
- Untoz Archives

Each subsidiary reads its identity and navigation from `content/brands.json`, allowing a common runtime to retain distinct brand accents and editorial positioning.

## License and ownership

© 2026 Untoz. All rights reserved.
