# AustriaPath — Remaining Work Before Public Launch

**Date:** 4 July 2026  
**Status:** Prioritized backlog after frontend production prep  
**Reference:** [Production Engineering Package](./AustriaPath_Production_Engineering_Package.md)

---

## Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Blocker — do not launch publicly without this |
| **P1** | Required for paid premium product |
| **P2** | Required for scale / compliance completeness |
| **P3** | Post-launch improvement |

---

## P0 — Launch blockers

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 1 | **Backend auth** — hashed passwords, sessions, `GET /auth/me` | Backend | Plaintext localStorage today |
| 2 | **Stripe Checkout + webhooks** — remove client-side free premium | Backend | Legal/fraud risk |
| 3 | **Authenticated AI proxy** — auth + rate limit on `/ai/completions` | Backend | Open proxy burns API key |
| 4 | **Server-side authorization** — roles, premium, credits | Backend | DevTools bypass today |
| 5 | **PostgreSQL** — users, subscriptions, reports as SoT | Backend | Data loss on cache clear |
| 6 | **GDPR deletion + export APIs** | Backend | Required for EU users |
| 7 | **Complete Impressum** — real operator details | Legal/Product | Placeholders in `legalContent.js` |
| 8 | **Legal counsel review** — Datenschutz, AGB | Legal | Docs exist, not signed |
| 9 | **`VITE_ADMIN_INITIAL_PASSWORD` empty** in all prod envs | DevOps | Never bundle admin password |
| 10 | **Do not market paid plans** until #2 live | Product | SubscriptionScreen is demo-only |
| 11 | **CI build pipeline** — `npm ci && npm run build` | Engineering | No tests in CI yet |
| 12 | **OpenAI spending cap + monitoring** | DevOps | Cost protection |

---

## P1 — Paid premium integrity

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 13 | Approve & implement **EC-01** (block preview models) | Product + Eng | Examiner Council |
| 14 | Approve & implement **EC-05, EC-07, EC-08, EC-20** | Eng | Scoring integrity |
| 15 | Approve & implement **EC-02, EC-03** (skill routing, MCQ) | Eng | Or disable scored Lesen/Hören |
| 16 | **EC-13** human content review of premium models | Examiner | Before marketing exams |
| 17 | **EC-06, EC-19, EC-22** — labels + ÖIF positioning | Product | User trust |
| 18 | **Email verification + password reset** (real) | Backend | Stubs today |
| 19 | **Error monitoring** — Sentry or equivalent | DevOps | Blind in prod (console stripped) |
| 20 | **Vitest** for ExaminerMind + placementEngine | Engineering | Regression safety |
| 21 | **DPA + TIA** for OpenAI US processing | Legal | GDPR cross-border |
| 22 | **Staging environment** with anonymized data | DevOps | Pre-prod validation |

---

## P2 — Operational completeness

| # | Item | Owner |
|---|------|-------|
| 23 | Admin audit log persisted (`admin_activity_log`) | Backend |
| 24 | Examiner Lab closed-loop (EC-14) | Backend + Admin |
| 25 | Backup/restore tested (PostgreSQL) | DevOps |
| 26 | Uptime monitoring | DevOps |
| 27 | AI cost dashboard | DevOps |
| 28 | Dependency audit — remove unused Figma npm packages | Engineering |
| 29 | Lazy-load admin screens | Engineering |
| 30 | Register of processing activities (Verzeichnis) | Legal/DPO |
| 31 | DPIA for AI evaluation | Legal |
| 32 | Manual QA script executed on staging | QA |

---

## P3 — Post-launch

| # | Item |
|---|------|
| 33 | EC-09 VocabularyJudge redesign |
| 34 | EC-10 judge deduplication |
| 35 | EC-14 full ML-style learning loop |
| 36 | EC-16 Intelligent Exam level images |
| 37 | EC-17 unify AI-Prüfer + knowledge files |
| 38 | Gemini/Claude providers |
| 39 | SEO — remove `noindex` |
| 40 | Analytics (with consent) |
| 41 | Multi-device PWA / native apps |

---

## Completed in this production prep (frontend)

| Item | Detail |
|------|--------|
| OpenAI proxy contract | `messages` support; no `raw` leak; upstream errors |
| Placement engine wiring | Correct `data/utils/placementEngine.js` |
| Premium detection unified | `subscriptionAccess.js` |
| AI credits ledger unified | `aiCredits - usedAiCredits` |
| `weekly_plan` permissions | `subscriptionEngine.js` |
| Storage registry expanded | 40+ keys documented |
| Dead code removed | 9 orphaned files |
| Env documentation | `.env.example` |
| Package metadata | `react`/`react-dom` direct deps; `preview`/`audit` scripts |
| SPA rewrite | `vercel.json` |
| Engineering handoff docs | This package + remaining work list |
| README | Developer index |

---

## Closed beta — can proceed without P0 #1–6 if:

- Invite-only testers (≤20)
- No payment marketing
- OpenAI cap set
- Impressum completed
- Beta agreement sent to testers
- Admin bootstrap per [Closed Beta Launch Plan](./AustriaPath_Closed_Beta_Launch_Plan.md)

**Commercial public launch requires all P0 items.**

---

## Suggested backend sprint order

```
Sprint 1: DB + Auth (P0 #1, #5)
Sprint 2: AI proxy + credits (P0 #3, #4)
Sprint 3: Stripe (P0 #2)
Sprint 4: Reports + GDPR (P0 #6)
Sprint 5: Admin APIs + email (P1 #18)
```

Estimated frontend integration effort after backend: **1–2 weeks** (API client swap, no UI redesign).
