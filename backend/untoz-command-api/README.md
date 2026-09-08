# Untoz Command API

Standalone secure backend for **Untoz Command**, designed to deploy from GitHub to Vercel.

## What it does

- authenticates Untoz staff with Supabase Auth
- resolves staff roles: `owner`, `admin`, `editor`, `writer`, `viewer`
- enforces permissions server-side
- publishes CMS files to `untoz-media/untoz-site`
- uploads real images to `public/media/uploads/YYYY/MM/`
- exposes production audit history
- manages team roles and invitations
- supports a one-time secure first Owner bootstrap
- keeps GitHub credentials server-side only

## Permissions

| Role | Read Command | Edit local CMS | Upload media | View server audit | Publish | Manage team |
| --- | --- | --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes | Yes* |
| Editor | Yes | Yes | Yes | Yes | No | No |
| Writer | Yes | Yes | Yes | No | No | No |
| Viewer | Yes | Read-only | No | No | No | No |

\* Admins can invite/assign Editor, Writer and Viewer. An Admin may promote their own account to Owner only if no Owner exists. Only an Owner can manage Owner/Admin roles after that.

## API

- `GET /api/public/health`
- `GET /api/public/config`
- `POST /api/public/bootstrap` — one-time first Owner setup
- `GET /api/public/me`
- `GET /api/public/audit`
- `POST /api/public/publish`
- `POST /api/public/upload`
- `GET /api/public/team`
- `POST /api/public/team` — invite staff
- `PATCH /api/public/team` — change role

Protected endpoints require `Authorization: Bearer <Supabase access token>`. The bootstrap endpoint instead requires `X-Bootstrap-Secret` and automatically closes once any role exists.

## Vercel deploy

Import the GitHub repository and set the Vercel **Root Directory** to:

```text
backend/untoz-command-api
```

No build output directory is required; the files in `api/` are Vercel Functions.

Add the variables from `.env.example` to the Vercel project. Prefer GitHub App credentials with repository Contents read/write permissions. A fine-grained `GITHUB_TOKEN` is supported only as a fallback.

After deployment, update `public/admin/api-config.js` so `DEFAULT_API` points to the production Vercel URL.

## First Owner setup

The existing Untoz Supabase database may already have the role enum and policies but no staff account yet. In that state `GET /api/public/config` returns `bootstrap_required: true`.

1. Set a long random `BOOTSTRAP_SECRET` in Vercel.
2. Call `POST /api/public/bootstrap` with the secret in `X-Bootstrap-Secret` and a body containing `email` and a password of at least 10 characters.
3. The API creates/confirms the account and assigns `owner`.
4. As soon as a role exists, the endpoint returns `409` for any future bootstrap attempt.
5. Rotate or remove `BOOTSTRAP_SECRET` after setup.

Example body:

```json
{
  "email": "owner@example.com",
  "password": "use-a-strong-password"
}
```

## Supabase

This API expects the existing Untoz Publisher Supabase project with:

- `user_roles`
- `publish_audit_log`
- `app_role`

For a fresh database, apply the migrations in `supabase/migrations/` in filename order. The role enum migration is intentionally separate from the policy migration because PostgreSQL cannot safely use newly-added enum values inside the same transaction in some migration runners.

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BOOTSTRAP_SECRET` — only required for first Owner setup
- `GITHUB_REPO`
- `GITHUB_BRANCH`
- `PUBLIC_SITE_BASE`
- `ALLOWED_ORIGINS`

Preferred GitHub authentication:

- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_INSTALLATION_ID`

Fallback:

- `GITHUB_TOKEN`

Never expose the service role key, bootstrap secret or GitHub credentials to the browser.
