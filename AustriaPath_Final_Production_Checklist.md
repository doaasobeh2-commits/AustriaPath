# AustriaPath — Final Production Checklist

**Date:** 4 July 2026  
**Purpose:** Executive summary — what is done vs what remains

---

## ✅ 1. FINISHED (frontend production-ready)

### Security & infrastructure
- [x] Client security module (`src/security/`)
- [x] CSP + security headers (`vercel.json`, `index.html`, `vite.config.ts`)
- [x] OpenAI proxy: `messages` support, no raw leak, upstream errors
- [x] Secure OpenAI client with payload limits
- [x] Session integrity + route guards
- [x] Storage registry (40+ keys)
- [x] Env documentation (`.env.example`)
- [x] SPA rewrite for deployment
- [x] CI pipeline (`.github/workflows/ci.yml`)
- [x] Node 20 pin (`.nvmrc`)

### Architecture & maintainability
- [x] Dead code removed (9 files)
- [x] Placement engine wired correctly
- [x] Premium detection unified (`subscriptionAccess.js`)
- [x] AI credits ledger unified
- [x] Subscription → user sync (`clientSubscription.js`)
- [x] User preferences helper (`userPreferences.js`)
- [x] Error reporting scaffold (`errorReporting.js`)
- [x] API endpoint constants (`src/api/endpoints.js`)
- [x] Admin screens lazy-loaded (smaller main bundle)
- [x] AccountSettingsScreen corruption fixed
- [x] Profile image size cap enforced
- [x] Dev-only console logging in AI paths
- [x] Honest forgot-password beta messaging

### Testing
- [x] Vitest + 6 unit tests
- [x] `npm test` in CI

### Documentation (complete engineering package)
- [x] Knowledge Base
- [x] Production Engineering Package
- [x] Backend Implementation Guide
- [x] LocalStorage Migration Guide
- [x] Frontend Module Map
- [x] Testing Strategy
- [x] Remaining Work Before Launch
- [x] Closed Beta Launch Plan
- [x] Database Schema, Technical Spec, Security Requirements
- [x] GDPR, AI Act, Launch Checklist
- [x] README developer index

---

## 🟡 2. CAN STILL BE COMPLETED WITHOUT BACKEND

| Item | Effort | Notes |
|------|--------|-------|
| Fill Impressum placeholders | Legal | `legalContent.js` |
| Legal counsel review | Legal | External |
| EC-01–EC-22 approval decisions | Product | Checkboxes in Decision Guide |
| Human content review (EC-13) | Examiner | Spreadsheet audit |
| More Vitest coverage | Eng | decisionEngine, aiCredits, subscriptionAccess |
| Remove unused npm dependencies | Eng | ~40 Figma packages — audit first |
| Replace inline language resolvers with `getUserLanguage()` | Eng | 10+ screens, no UI change |
| Sentry DSN (frontend only) | DevOps | Wire `errorReporting.js` |
| OpenAI dashboard spending cap | DevOps | Manual |
| Admin bootstrap on laptop (DevTools) | Ops | Closed beta plan |
| Commit & tag release | Git | `production-prep-1.0` |
| Staging Vercel preview env | DevOps | Separate project |
| Examiner Council copy labels (EC-06, EC-19) | Product | Text only |

---

## 🔴 3. REQUIRES BACKEND DEVELOPER

| Item | Sprint |
|------|--------|
| Hashed passwords + sessions | B1 |
| PostgreSQL + migrations | B1 |
| `GET /auth/me`, register, login, logout | B1 |
| Admin bootstrap API (server secret) | B1 |
| Authenticated `/ai/completions` | B2 |
| Server-side credits + permissions | B2 |
| Reports API | B2–3 |
| Stripe Checkout + webhooks | B3 |
| Remove client-side premium trust | B3 |
| GDPR export + deletion | B4 |
| Email verify + password reset | B4–5 |
| Admin audit log | B4 |
| Examiner Lab persistence | B5+ |

**Handoff doc:** [Backend Implementation Guide](./AustriaPath_Backend_Implementation_Guide.md)

---

## 🟠 4. REQUIRES PRODUCTION INFRASTRUCTURE

| Item | Provider |
|------|----------|
| Production domain + TLS | Vercel / DNS |
| `OPENAI_API_KEY` in Vercel prod | Vercel env |
| PostgreSQL hosting | Supabase / RDS |
| Stripe live mode | Stripe |
| Email service (Postmark/Resend) | Email provider |
| Sentry project | Sentry |
| Uptime monitoring | Better Stack / UptimeRobot |
| DB backups + restore test | DB host |
| DPA with OpenAI + host | Legal |
| WAF / rate limiting at edge | Vercel / Cloudflare |

---

## Verdict

**Frontend is essentially production-ready** for closed beta and backend handoff. The SPA is documented, tested (core paths), hardened, and debt-reduced. **Commercial launch** remains blocked on backend (P0), Stripe, legal sign-off, and production infra (sections 3–4).

**Next action for you:** Commit this batch → closed beta per [Closed Beta Launch Plan](./AustriaPath_Closed_Beta_Launch_Plan.md) → hire backend against [Implementation Guide](./AustriaPath_Backend_Implementation_Guide.md).
