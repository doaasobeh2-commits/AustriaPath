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
| **Builder** | **RAILPACK** (`railway.toml`) + `railpack.json` at repo root |
| **Build command** | **None** — do not set `npm ci` in Railway dashboard or `railway.toml` |
| **Custom start command** | `npm run server:migrate && npm run server:start` |

Railpack installs dependencies once in its **install** step. Do **not** add `npm ci` to a build command — that was the original duplicate and causes `EBUSY`.

Railpack also caches `node_modules/.cache` by default. `npm ci` must delete that directory; when it is a cache mount, the install fails with:

`EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'`

Repo fix: `railpack.json` keeps Railpack’s default **install** step (do not override `commands` — that breaks the Mise/Node layer chain and fails with `copy /mise/installs: context canceled`). Only override install **caches** to `/tmp/.npm` (not `node_modules/.cache`), skip the Vite **build** step, and set the API start command.

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
| `CORS_ORIGIN` | Yes | Your **Vercel** production URL (no trailing slash). Use comma-separated list for dev + prod, e.g. `https://austriapath-exam-ai.vercel.app,http://localhost:5173` |
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

### DATABASE_URL missing → API used PGLite (fixed in code)

If `GET /v1/health/db` returned `"dbKind":"pglite"`, Railway had **no** `DATABASE_URL` on the **API Web Service**. The server now **refuses to start** in production without it.

**Fix in Railway (required):**

1. Open [Neon Console](https://console.neon.tech) → your project → **Connect**
2. Branch: **main** (or production branch)
3. Enable **Connection pooling**
4. Copy the pooled URL (`postgresql://…@ep-…-pooler.….neon.tech/neondb?sslmode=require`)
5. Railway → **API Web Service** (not Vercel, not a static site) → **Variables**
6. Add or update **`DATABASE_URL`** = pasted Neon URL
7. Ensure **`NODE_ENV`** = `production`
8. Ensure **`USE_PGLITE`** is **not** set (delete if present)
9. **Redeploy** the API service

**Verify after deploy:**

```powershell
curl.exe -s "https://austriapath-production.up.railway.app/v1/health/db"
```

Expected:

```json
"dbKind": "pg",
"usersTableExists": true,
"publicTableCount": 20
```

If deploy **crashes** with `DATABASE_URL is required in production`, the variable is still missing on that service or the deploy target is wrong.

**Optional:** Link Neon to Railway (Railway dashboard → **+ New** → **Database** → **Add Neon**) — Railway injects `DATABASE_URL` automatically into the linked service.

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

`vercel.json` rewrites `/v1/*` to Railway (before SPA fallback). The SPA rule excludes `/v1/` so API paths never return `index.html`.

Redeploy Vercel after backend URL or CORS changes.

### Session cookies (Vercel → Railway)

| Layer | Setting |
|-------|---------|
| Browser → Vercel | Same-origin `fetch(..., { credentials: "include" })` to `/v1/*` |
| Vercel proxy | Forwards `Cookie` and `Set-Cookie` unchanged |
| Railway API | `COOKIE_SECURE=true`, `SameSite=Lax`, `httpOnly`, `path=/` |
| Railway CORS | `CORS_ORIGIN` must include your Vercel URL (comma-separated with localhost for dev) |

**Required Railway update:** set `CORS_ORIGIN=https://austriapath-exam-ai.vercel.app,http://localhost:5173` then redeploy the API service.

## Bootstrap

Update `deploy/closed-beta-env.local`:

```env
RAILWAY_PUBLIC_URL=https://YOUR-RAILWAY-HOST
ADMIN_BOOTSTRAP_SECRET=<same value as Railway Variables>
ADMIN_PASSWORD=<strong password, min 8 chars>
ADMIN_EMAIL=fadisobehau@gmail.com
```

**Before bootstrap**, confirm PostgreSQL is wired (not PGLite):

```powershell
curl.exe -s "https://YOUR-RAILWAY-HOST/v1/health/db"
```

Then:

```powershell
node deploy/bootstrap-admin.mjs
```

### Bootstrap errors (root causes)

| Symptom | Cause | Fix |
|---------|--------|-----|
| `GET /v1/health` → **502** `Application failed to respond` | API container not listening — usually crash on startup | Set `DATABASE_URL` (Neon pooled URL) on Railway API service; check deploy logs for `DATABASE_URL is required in production`; redeploy until `/v1/health` returns JSON |
| `/v1/health/db` works but bootstrap script failed earlier with **502** | Timing — you checked DB health after redeploy finished | Retry `node deploy/bootstrap-admin.mjs` once `/v1/health` returns 200 |
| Bootstrap **403** `FORBIDDEN` | `ADMIN_BOOTSTRAP_SECRET` mismatch between local file and Railway | Set identical secret in both places, redeploy API |
| Bootstrap **409** `CONFLICT` | Admin already exists in PostgreSQL | Success — remove `ADMIN_BOOTSTRAP_SECRET` from Railway; use forgot-password to change password if needed |

502 is returned by **Railway’s proxy**, not Express — it means the Node process never bound to `PORT`. `/v1/health/db` and `/v1/health` hit the same server; if one works, both should work at the same time.

## Why `server:start` alone failed

1. Railway ran **`npm run build`** (Vite) and deployed **`dist/`** as a static site.
2. Static hosting serves `index.html` for `/v1/health` → HTML, not JSON.
3. POST → **405** because static servers only allow GET for SPA routes.
4. Changing start command does not help if the **build output** is still treated as static.

Fix: **build `npm ci` only**, **start the Node server**, no Vite build on Railway.
