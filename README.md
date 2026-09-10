# Untoz

> The official web portal for Untoz — media, entertainment and technology.

[![Website](https://img.shields.io/badge/Website-Live-0cdb46?style=for-the-badge)](https://untoz-media.github.io/untoz-site/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-1f6ffa?style=for-the-badge&logo=github)](https://untoz-media.github.io/untoz-site/)
[![Untoz](https://img.shields.io/badge/Untoz-2026-ff7c04?style=for-the-badge)](https://untoz.site/)

## About

Untoz is a media, technology and entertainment company building one connected universe of stories, products and experiences.

The main Untoz portal brings together the company, its media brands, productions, products and services — including Untoz News, Untoz Sports, Untoz Pop, Untoz Gaming, Untoz Space, Untoz Kids, Untoz Archives, Untoz+, AURA-1 and Untoz Clip.

## Untoz V2

The portal is currently evolving into **Untoz V2**, a site-wide design system rather than a homepage-only refresh. The work is being developed on `feature/homepage-v2` and reviewed through the V2 pull request before it reaches `main`.

The V2 direction is built around:

- **Montserrat** as the primary Untoz interface typeface
- Untoz green `#0cdb46`, blue `#1f6ffa` and orange `#ff7c04`
- large editorial typography and stronger visual hierarchy
- rounded, premium surfaces with restrained motion
- a consistent dark navigation language across public routes
- brand-led subsidiary pages that use each brand accent without losing the Untoz system
- responsive layouts, keyboard focus states and `prefers-reduced-motion` support
- content-driven experiences that remain compatible with Untoz Command and the existing CMS runtime

V2 currently covers the homepage, category pages, editorial articles, search, subsidiary/network pages and the 404 experience.

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
- `public/admin/homepage-experience-manager.js` — V2 homepage experience editor and publish safeguard

The `public/` runtime mirrors critical public-facing renderer files where required so local/build behaviour stays aligned.

## Content

Editorial and homepage content lives under `content/` and is validated before production builds.

Important data files include:

- `content/homepage.json`
- `content/posts.json`
- `content/brands.json`
- `content/categories.json`
- `content/pages/index.json`

`content/homepage.json` keeps the classic homepage `blocks` payload while V2 adds an `experience` object for the manifesto, brand rail, featured productions, products, stats and final CTA. This keeps the new experience editable without replacing the existing publishing model.

## Untoz Command

Untoz Command is the internal publishing/admin layer used to manage portal content. The V2 Homepage Experience editor extends the existing Homepage Builder and preserves the V2 `experience` configuration when the classic homepage payload is published.

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

The production build validates content first, builds with Vite, copies content, prunes stale generated routes and injects analytics.

## Quality gates

Changes should keep the following green before merging:

- Untoz Content CI
- CMS/content validation
- production Vite build
- Untoz Bot workflow

V2 is intentionally kept isolated from `main` until visual/browser QA is complete.

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
