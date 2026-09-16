# Untoz Command API

Secure backend for **Untoz Command**, packaged to run with the public Untoz portal as one Node.js application on Hostinger.

## What it does

- authenticates Untoz staff with Supabase Auth
- resolves staff roles: `owner`, `admin`, `editor`, `writer`, `viewer`
- enforces permissions server-side
- publishes CMS files to `untoz-media/untoz-site`
- uploads images to `public/media/uploads/YYYY/MM/`
- exposes production audit history and analytics
- manages team roles and invitations
- supports a one-time secure first Owner bootstrap
- keeps GitHub credentials server-side only

## Production architecture

The production app uses one origin:

- `https://untoz.site/` — public portal
- `https://untoz.site/admin/` — Untoz Command
- `https://untoz.site/api/public/*` — Command API

The root project builds the Vite site first and then this TypeScript API. The Express server serves the generated `dist/` site and mounts all API routes before static files, so the browser and API stay same-origin.

## API

- `GET /api/public/health`
- `GET /api/public/config`
- `POST /api/public/bootstrap` — one-time first Owner setup
- `GET /api/public/me`
- `GET /api/public/audit`
- `GET|POST /api/public/analytics`
- `POST /api/public/publish`
- `POST /api/public/upload`
- `GET /api/public/team`
- `POST /api/public/team` — invite staff
- `PATCH /api/public/team` — change role

Protected endpoints require `Authorization: Bearer <Supabase access token>`. The bootstrap endpoint instead requires `X-Bootstrap-Secret` and automatically closes once any role exists.

## Hostinger deployment

Use a Hostinger Node.js Web App with the repository root (`untoz-media/untoz-site`). The root `package.json` is production-ready:

```text
Build command: npm run build
Start command: npm start
Node.js: 22.x recommended
```

The root build runs both the public Vite build and the API TypeScript build. Hostinger supplies `PORT` automatically and the server listens on `0.0.0.0`.

Set `PUBLIC_SITE_BASE=https://untoz.site` before building so canonical URLs, sitemap, RSS and Open Graph metadata use the final production origin.

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BOOTSTRAP_SECRET` — only required for first Owner setup
- `GITHUB_REPO=untoz-media/untoz-site`
- `GITHUB_BRANCH=main`
- `PUBLIC_SITE_BASE=https://untoz.site`
- `ALLOWED_ORIGINS=https://untoz.site`

Preferred GitHub authentication:

- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_INSTALLATION_ID`

Fallback:

- `GITHUB_TOKEN`

Never expose the service role key, bootstrap secret or GitHub credentials to the browser.

## First Owner setup

If the Untoz Supabase project has no staff role yet, `GET /api/public/config` returns `bootstrap_required: true`.

1. Set a long random `BOOTSTRAP_SECRET` in Hostinger.
2. Call `POST /api/public/bootstrap` with the secret in `X-Bootstrap-Secret` and a body containing `email` and a password of at least 10 characters.
3. The API creates/confirms the account and assigns `owner`.
4. Once a role exists, future bootstrap attempts return `409`.
5. Remove or rotate `BOOTSTRAP_SECRET` immediately afterwards.

## Supabase

The API expects the existing Untoz Publisher Supabase project with:

- `user_roles`
- `publish_audit_log`
- `app_role`

For a fresh database, apply the migrations in `supabase/migrations/` in filename order.

## Local checks

From `backend/untoz-command-api`:

```bash
npm install
npm run typecheck
npm run build
```

From the repository root, the production-equivalent build is:

```bash
npm install
npm run build
npm start
```
