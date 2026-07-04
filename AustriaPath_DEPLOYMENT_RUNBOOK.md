# AustriaPath — Deployment Runbook

**Version:** 1.0 · **Date:** 4 July 2026

---

## 1. Environments

| Environment | Purpose | URL pattern |
|-------------|---------|-------------|
| Local | Development | `http://localhost:5173` |
| Preview | PR / staging | `*.vercel.app` |
| Production | Live (beta or public) | Custom domain TBD |

---

## 2. Vercel setup

### 2.1 Project settings

- **Framework:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node version:** 20 (`.nvmrc`)

### 2.2 Environment variables

| Variable | Preview | Production |
|----------|---------|------------|
| `OPENAI_API_KEY` | Required | Required |
| `OPENAI_MODEL` | Optional | Optional |
| `VITE_ADMIN_EMAIL` | Operator email | Operator email |
| `VITE_ADMIN_INITIAL_PASSWORD` | Empty or local only | **MUST be empty** |
| `VITE_API_BASE` | `/v1` when backend staging | `/v1` |
| `VITE_USE_BACKEND` | `false` until API live | `true` after backend |

### 2.3 Files

- `vercel.json` — SPA rewrite + security headers
- `api/ai/openai.js` — serverless function (auto-deployed)

---

## 3. Deploy procedure

```bash
npm ci
npm test
npm run build
git push origin main   # triggers CI + Vercel
```

### Post-deploy smoke (5 min)

1. Open production URL incognito
2. Legal consent → register → login
3. Home loads
4. Intelligent Exam returns AI text (not only demo)
5. Admin login (after bootstrap)

---

## 4. OpenAI

1. Set hard monthly spending limit in OpenAI dashboard
2. Enable usage alert email
3. Monitor daily during beta week 1

---

## 5. Rollback

1. Vercel → Deployments → Promote previous deployment
2. Verify env vars unchanged
3. Re-run smoke test

---

## 6. When backend deploys separately

| Component | Host |
|-----------|------|
| SPA | Vercel |
| API | Railway / Fly.io / Vercel serverless routes |
| PostgreSQL | Supabase / RDS |
| Stripe | Stripe hosted |

Update `VITE_API_BASE` or configure reverse proxy on same domain.

---

## 7. Production domain checklist

- [ ] DNS A/CNAME to Vercel
- [ ] TLS certificate active
- [ ] Remove `robots: noindex` when ready for SEO
- [ ] Update Impressum domain in `legalContent.js`
- [ ] Cookie/localStorage policy matches production domain

---

## 8. Monitoring (post-backend)

- Sentry DSN in env
- Uptime check on `/` and `/api/health`
- OpenAI cost dashboard

See [Testing Strategy](./AustriaPath_Testing_Strategy.md) for QA scripts.
