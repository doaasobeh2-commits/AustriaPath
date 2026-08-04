# AustriaPath — Pilot Freeze

**Status:** Feature freeze for pilot launch (2026).

## In scope (pilot)

1. **Registration capacity** — max 70 counted learners, waitlist when full/closed, no invite tokens.
2. **Community Q&A** — anonymous public labels, max 3 answers, 40-hour admin-attention flag.
3. **Premium catalog** — Einstufungstest + KI-Wochenplan only; Coming Soon; admin grants; no prices/checkout/Stripe UI.

## Out of scope until post-pilot feedback

- Self Introduction Trainer, Picture Description Trainer, Email Writing Trainer, additional AI products.
- Multi-product simultaneous entitlements (see below).
- Stripe checkout in learner UI.
- Subscription architecture redesign.

## Post-pilot rule

After pilot deploy: **bugs, stability, and performance only.** No new features without explicit roadmap approval from pilot user feedback.

## Subscription architecture note

**Current model:** Single active subscription per user (`is_current = TRUE`). Admin grant of one pilot product deactivates the previous subscription row. Acceptable for the 2-product pilot.

**Future trigger:** When **3 or more** independent purchasable/grantable products must coexist (e.g. Placement + Weekly Plan + separate trainers), migrate to **Multiple Product Entitlements** — one active entitlement row per product type, merged permission reads — without replacing Stripe/billing tables. Do not implement before pilot feedback unless business requires it.

## Production checklist

- Railway: `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `PUBLIC_APP_URL`, `COOKIE_SECURE`, `ADMIN_EMAIL`, `RESEND_API_KEY`, `EMAIL_FROM`, email + OpenAI keys.
- Weekly Plan AI: `B1_WEEKLY_PLAN_AI_ENABLED=true`, `WEEKLY_TRAINING_B1_OPENAI_API_KEY`, `WEEKLY_TRAINING_B1_MODEL`.
- Vercel: `VITE_USE_BACKEND=true`, `VITE_API_BASE=/v1` (see `.env.production`).
- Deploy: `npm run server:migrate && npm run server:start` on Railway; Vercel SPA rewrite to `/v1`.
- Smoke: login, registration status, community post, premium catalog, admin grant placement/weekly.
