# Untoz Site

> The official web portal for Untoz — media, entertainment and technology.

[![Website](https://img.shields.io/badge/Website-Live-0cdb46?style=for-the-badge)](https://untoz-media.github.io/untoz-site/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-1f6ffa?style=for-the-badge&logo=github)](https://untoz-media.github.io/untoz-site/)
[![Untoz](https://img.shields.io/badge/Untoz-2026-ff7c04?style=for-the-badge)](https://untoz.site/)

## About

**Untoz Site** is the main digital portal for the Untoz universe. It brings together news, entertainment, sports, gaming, music, movies & series, space, video, live coverage, productions and other Untoz projects in one place.

The website is designed as a modern editorial and media portal while keeping the visual identity of Untoz across the entire experience.

## Features

- Untoz Global Header integration
- Dedicated boxed Untoz site navigation
- Light and dark modes
- Functional site search
- Featured hero carousel
- Live and upcoming content
- Top Stories
- Untoz+ featured content
- Untoz categories and universe navigation
- Upcoming events
- Latest videos
- Responsive desktop and mobile layouts
- JSON-based content system
- **Untoz Command** administration panel

## Untoz Command

The repository includes **Untoz Command**, the administration and content-management interface used to manage the portal.

The admin panel currently includes:

- Dashboard
- Pages
- Posts
- Media
- Categories
- Genres
- Menus
- Homepage Builder
- Design System settings
- Header and footer settings
- Site settings
- Live CMS synchronization
- Preview and publishing workflow

Admin route:

```text
/admin/
```

> The admin interface is marked `noindex,nofollow` and is intended for Untoz administration.

## Content system

Site content is stored as structured JSON under `content/`.

```text
content/
├── categories.json
├── genres.json
├── homepage.json
├── posts.json
├── site.json
├── pages/
│   ├── about.json
│   └── contact.json
└── posts/
```

This structure allows Untoz Command and the public website to share the same content source while keeping the project lightweight and compatible with static hosting.

## Project structure

```text
untoz-site/
├── .github/workflows/       # GitHub Pages deployment
├── admin/                   # Branch-safe admin entrypoint
├── content/                 # CMS content
├── public/
│   └── admin/               # Untoz Command application
├── src/                     # Site source and styles
├── index.html               # Public site entrypoint
├── static-home.js           # Deploy-safe homepage runtime
├── vite.config.js
└── package.json
```

## Development

### Requirements

- Node.js 20+
- npm

### Install

```bash
git clone https://github.com/untoz-media/untoz-site.git
cd untoz-site
npm install
```

### Start the development server

```bash
npm run dev
```

### Production build

```bash
npm run build
```

The production output is generated in `dist/`.

## Deployment

The website is deployed using **GitHub Pages** and GitHub Actions.

Production preview:

https://untoz-media.github.io/untoz-site/

The project uses deploy-safe relative paths so it can work from the GitHub Pages repository path and can later be used with the main Untoz domain.

## Design

Current Untoz brand colors:

| Role | Color |
| --- | --- |
| Green | `#0cdb46` |
| Blue | `#1f6ffa` |
| Orange | `#ff7c04` |

The portal uses a clean, editorial interface built around the Untoz identity, with a separate reusable **Untoz Global Header** above the site's own navigation.

## Related Untoz projects

- **Untoz+** — streaming platform
- **Untoz News** — news and current affairs
- **Untoz Sports** — sports coverage
- **Untoz Gaming** — gaming
- **Untoz Space** — space coverage
- **Untoz Kids** — children's content
- **Untoz Archives** — archive content
- **Untoz Command** — administration and CMS

## Status

🚧 **Active development**

The new Untoz portal and Untoz Command are being actively developed. Features, content structures and design elements may change as the platform evolves.

## Copyright

© 2026 Untoz. All rights reserved.

This repository contains the official Untoz website source code. Unless explicitly stated otherwise, Untoz branding, original assets and original content remain the property of Untoz.
