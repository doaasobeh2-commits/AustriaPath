# Railway API service — closed beta

The AustriaPath **frontend** is hosted on **Vercel**. Railway runs the **Express API only**.

If `/v1/health` returns HTML, Railway is still serving the Vite build (`dist/`), not `server/src/index.js`.

## Recommended layout

| Host | Role | Start |
|------|------|--------|
| **Vercel** | React SPA | `npm run build` (automatic) |
| **Railway** | Express `/v1` API | `npm run server:start` |
| **Neon** | PostgreSQL | connection string in `DATABASE_URL` |

**Safe path (recommended):** add a **new Railway Web Service** for the API and **leave the current service unchanged** so `austriapath-production.up.railway.app` keeps serving the SPA. Wire the Vercel frontend to the new API host via `/v1` rewrites.

Only convert the existing service in-place if nobody relies on the Railway URL for the frontend (Vercel is the sole user-facing host).

## Railway dashboard — exact settings

**Service:** new **Web Service** (API only), same repo root — or convert existing only after the above is confirmed

| Setting | Value |
|---------|--------|
| **Root directory** | `/` (repo root — leave empty or `.`) |
| **Builder** | Nixpacks (default; `railway.toml` + `nixpacks.toml` in repo) |
| **Build command** | **Leave empty** in Railway dashboard (do not set `npm ci` manually) |
| **Custom start command** | `npm run server:migrate && npm run server:start` |

Nixpacks installs dependencies once in its **install** phase (`npm ci`). A **build command** of `npm ci` in `railway.toml` or the dashboard runs it again and fails with:

`EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'`

Repo config: `nixpacks.toml` skips the Vite `npm run build` step (API-only).

### If a deploy still fails with EBUSY (one-time cache clear)

1. Railway → your service → **Deployments** → open the failed deploy → **⋯ → Redeploy** (same commit; often enough).
2. Or **Settings → Redeploy** with **Clear build cache** if shown.
3. Or add a temporary service variable `NO_CACHE=1`, redeploy once, then remove it.

Do **not** add `npm ci` or `npm install` to the Railway build command field.

**Do not use:** `npm run build`, `vite preview`, or `npm run start` (no `start` script for frontend).

**Disable static site:** If the service was created as a **Static Site**, delete it and create a **Web Service** from the same GitHub repo, or ensure deploy logs show Node starting — not Caddy/nginx serving `dist/`.

## Required environment variables (Railway → Variables)

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | Neon pooled URL (`?sslmode=require`) |
| `SESSION_SECRET` | Yes | 64+ random chars |
| `CORS_ORIGIN` | Yes | Your **Vercel** production URL (no trailing slash) |
| `COOKIE_SECURE` | Yes | `true` |
| `ADMIN_EMAIL` | Yes | `fadisobehau@gmail.com` |
| `ADMIN_BOOTSTRAP_SECRET` | Yes (until bootstrap done) | One-time; remove after admin created |
| `BETA_ALLOWED_EMAILS` | Yes (beta) | Comma-separated invite list |
| `OPENAI_API_KEY` | Yes | For AI exams |
| `RESEND_API_KEY` | Yes | For email verification / reset |
| `EMAIL_FROM` | Yes | Verified Resend sender |
| `PORT` | Auto | Railway sets this — do not override |

Optional: `STRIPE_*`, `OPENAI_MODEL`, Stripe price IDs.

Railway injects `PORT`; the server reads `process.env.PORT`.

## After deploy — verify API

```powershell
curl.exe -s "https://YOUR-RAILWAY-HOST/v1/health"
```

Expected JSON:

```json
{"success":true,"data":{"status":"ok","service":"austria-path-api",...}}
```

Deploy logs should include:

```
AustriaPath API listening on :PORT/v1
```

## Vercel (frontend — unchanged UI)

Set production env:

- `VITE_USE_BACKEND=true`
- `VITE_API_BASE=/v1`

Add to `vercel.json` rewrites (before SPA fallback):

```json
{ "source": "/v1/:path*", "destination": "https://YOUR-RAILWAY-HOST/v1/:path*" }
```

Redeploy Vercel. The SPA stays the same; `/v1` proxies to Railway.

## Bootstrap

Update `deploy/closed-beta-env.local`:

```env
RAILWAY_PUBLIC_URL=https://YOUR-RAILWAY-HOST
```

Then:

```powershell
node deploy/bootstrap-admin.mjs
```

## Why `server:start` alone failed

1. Railway ran **`npm run build`** (Vite) and deployed **`dist/`** as a static site.
2. Static hosting serves `index.html` for `/v1/health` → HTML, not JSON.
3. POST → **405** because static servers only allow GET for SPA routes.
4. Changing start command does not help if the **build output** is still treated as static.

Fix: **build `npm ci` only**, **start the Node server**, no Vite build on Railway.
