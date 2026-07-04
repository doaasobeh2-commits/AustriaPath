# AustriaPath — Production Engineering Package

**Version:** 1.0  
**Date:** 4 July 2026  
**Audience:** Backend developers, DevOps, security, legal  
**Purpose:** Complete handoff specification — implement backend from this document without re-architecting the SPA  

**Companion docs:** [Technical Specification](./AustriaPath_Technical_Specification.md) · [Database Schema](./AustriaPath_Database_Schema.md) · [Knowledge Base](./AustriaPath_Knowledge_Base.md) · [Backend Security Requirements](./Backend%20Security%20Requirements.md)

---

## Table of Contents

1. [Authentication & Authorization Review](#1-authentication--authorization-review)
2. [Frontend Security Hardening (Completed)](#2-frontend-security-hardening-completed)
3. [Environment Variables](#3-environment-variables)
4. [Backend API Specification](#4-backend-api-specification)
5. [Database Schema & Entity Relationships](#5-database-schema--entity-relationships)
6. [Role & Permission Matrix](#6-role--permission-matrix)
7. [OpenAI Integration Specification](#7-openai-integration-specification)
8. [AI Report Architecture](#8-ai-report-architecture)
9. [AI Credits & Subscription Workflow](#9-ai-credits--subscription-workflow)
10. [Payment Integration Specification (Stripe)](#10-payment-integration-specification-stripe)
11. [Error Handling & Logging](#11-error-handling--logging)
12. [Performance Optimization](#12-performance-optimization)
13. [Code Cleanup (Completed)](#13-code-cleanup-completed)
14. [Component Reusability](#14-component-reusability)
15. [Project Documentation Index](#15-project-documentation-index)
16. [Deployment Checklist](#16-deployment-checklist)
17. [Production Readiness Checklist](#17-production-readiness-checklist)
18. [GDPR & EU AI Act Compliance Review](#18-gdpr--eu-ai-act-compliance-review)
19. [Testing Checklist for Launch](#19-testing-checklist-for-launch)
20. [Backend Implementation Priority](#20-backend-implementation-priority)

---

## 1. Authentication & Authorization Review

### 1.1 Current state (SPA — interim)

| Component | File | Behavior |
|-----------|------|----------|
| Login | `src/app/userAccess.js` → `authenticateUser()` | Plaintext password compare vs `austriaPathUsers` |
| Register | `registerStudentUser()` | Blocks `ADMIN_EMAIL`; seeds student with 5 credits |
| Admin seed | `buildSeedAdminUser()` | Only if `VITE_ADMIN_INITIAL_PASSWORD` non-empty (deprecated for prod) |
| Session | `localStorage`: `isLoggedIn`, `austriaPathCurrentUser` | No server session |
| Integrity | `sessionIntegrity.js` | Client fingerprint — not cryptographic |
| Route guard | `routeGuard.js` | Admin tabs blocked in UI only |
| Admin CMS gate | `AdminScreen.jsx` | Re-enter admin password from localStorage |

### 1.2 Security classification

| Control | Production value | Backend required |
|---------|------------------|------------------|
| Password storage | **Critical gap** — plaintext | Argon2id/bcrypt |
| Session | **Critical gap** — forgeable | HTTP-only cookie or JWT + refresh |
| Admin role | **Critical gap** — DevTools | Server-side `role` on every API |
| Premium/credits | **Critical gap** | Server ledger |
| Admin email block on register | ✅ Implemented | Replicate server-side |
| Email validation | ✅ `sanitize.js` | Server validation |
| Legal consent | ✅ Version + timestamp only | Persist `legal_consents` table |

### 1.3 Target auth flow

```
POST /auth/register  → hash password, create user, optional email verify
POST /auth/login     → verify hash, issue session
POST /auth/logout    → invalidate session
POST /auth/refresh   → rotate token
GET  /auth/me        → current user + subscription + credits
POST /auth/forgot-password
POST /auth/reset-password
```

**Admin bootstrap (production):**

```
POST /internal/bootstrap-admin
  Header: X-Bootstrap-Secret: {ADMIN_BOOTSTRAP_SECRET}  (server env, one-time)
  Body: { email, password, name }
  → Creates admin with hashed password; disable endpoint after use
```

**Reserved emails:** Reject registration for `ADMIN_EMAIL` and configurable reserved list.

### 1.4 Frontend changes after backend (minimal UX change)

- Replace `authenticateUser` / `registerStudentUser` with API calls
- Store session token in memory or HTTP-only cookie (not `localStorage` for token)
- Keep `routeGuard.js` as UX layer; enforce on API
- Remove `VITE_ADMIN_INITIAL_PASSWORD` entirely

---

## 2. Frontend Security Hardening (Completed)

| Item | Status | Location |
|------|--------|----------|
| Security headers (CSP, X-Frame-Options) | ✅ | `vercel.json`, `vite.config.ts`, `index.html` |
| OpenAI via proxy only | ✅ | `secureOpenAI.js` → `/api/ai/openai` |
| Payload size limits | ✅ | Client + server |
| `messages` array support in proxy | ✅ | `api/ai/openai.js` (fixed) |
| Remove `raw` OpenAI leak | ✅ | Proxy response sanitized |
| Secure JSON storage cap | ✅ | `secureStorage.js` |
| Env validation warnings | ✅ | `envValidation.js` |
| Admin tab route guard | ✅ | `routeGuard.js` |
| Input sanitization | ✅ | `sanitize.js` |
| Storage key registry | ✅ | `storageRegistry.js` (expanded) |
| SPA fallback rewrite | ✅ | `vercel.json` |
| Production console strip | ✅ | `vite.config.ts` esbuild drop |

**Not sufficient for public launch:** All items in [Backend Security Requirements.md](./Backend%20Security%20Requirements.md).

---

## 3. Environment Variables

See [`.env.example`](./.env.example).

| Variable | Where | Secret? | Production rule |
|----------|-------|---------|-----------------|
| `VITE_ADMIN_EMAIL` | Client bundle | No (public identity) | Set to operator email |
| `VITE_ADMIN_INITIAL_PASSWORD` | Client bundle | **Would be public** | **MUST be empty** |
| `OPENAI_API_KEY` | Vercel server | Yes | Required for AI |
| `OPENAI_MODEL` | Vercel server | No | Optional override |
| `DATABASE_URL` | Backend | Yes | Future |
| `JWT_SECRET` | Backend | Yes | Future |
| `STRIPE_*` | Backend | Yes | Future |
| `ADMIN_BOOTSTRAP_SECRET` | Backend | Yes | One-time admin create |
| `SENTRY_DSN` | Client + server | Semi-public | Recommended |

---

## 4. Backend API Specification

Base URL: `https://api.austriaPath.at/v1` (or same-origin `/api` on Vercel)

### 4.1 Auth

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/auth/register` | — | `{ name, email, password, level }` | `{ user, session }` |
| POST | `/auth/login` | — | `{ email, password }` | `{ user, session }` |
| POST | `/auth/logout` | Session | — | `{ ok: true }` |
| GET | `/auth/me` | Session | — | `UserProfile` |
| POST | `/auth/forgot-password` | — | `{ email }` | `{ ok: true }` |
| POST | `/auth/reset-password` | Token | `{ token, password }` | `{ ok: true }` |

### 4.2 Users & GDPR

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| PATCH | `/users/me` | User | Update name, level, language |
| GET | `/users/me/export` | User | GDPR JSON export |
| DELETE | `/users/me` | User | Request account deletion |
| POST | `/users/me/legal-consent` | User | `{ privacyVersion, termsVersion }` |

### 4.3 Subscriptions & payments

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/subscription` | User | Current plan + permissions |
| POST | `/subscription/checkout` | User | Stripe Checkout session URL |
| POST | `/subscription/webhook` | Stripe sig | Handle payment events |
| POST | `/subscription/consume-exam` | User | Decrement exam allowance |

### 4.4 AI

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/ai/completions` | User + credits | OpenAI proxy (replaces `/api/ai/openai`) |
| GET | `/ai/usage` | User | Credit balance, history |

**Request body (completions):**

```json
{
  "mode": "report_builder",
  "prompt": "string",
  "studentAnswer": "string",
  "messages": [{ "role": "user|assistant", "content": "string" }],
  "context": {
    "serviceType": "ai_exam",
    "level": "B1",
    "engineName": "reportBuilder"
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": "string",
  "creditsUsed": 2,
  "creditsRemaining": 48
}
```

### 4.5 Reports

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/reports` | User | List AI reports |
| POST | `/reports` | User | Save report (from ExaminerMind) |
| GET | `/reports/:id` | User | Single report |
| DELETE | `/reports/:id` | User | Delete report |

### 4.6 Admin

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/admin/users` | Admin | List/search users |
| PATCH | `/admin/users/:id` | Admin | Block, grant plan, credits |
| GET/POST/PATCH | `/admin/content` | Admin | CMS items |
| GET/POST | `/admin/examiner-lab/samples` | Admin | Review cases |
| GET/POST/PATCH | `/admin/ai-pruefer` | Admin | Examiner rule models |

Full endpoint details: [AustriaPath_Technical_Specification.md](./AustriaPath_Technical_Specification.md) §3.

---

## 5. Database Schema & Entity Relationships

**Source of truth:** [AustriaPath_Database_Schema.md](./AustriaPath_Database_Schema.md)

### 5.1 Entity relationship summary

```
users 1──1 user_profiles
users 1──* subscriptions
users 1──* payments
users 1──* ai_credits (ledger)
users 1──* ai_reports
users 1──* weekly_plan_reports
users 1──* exam_results
users 1──* legal_consents
users 1──* data_export_requests
users 1──* account_deletion_requests
examiner_rules *──* examiner_lab_samples (via reviews)
admin_activity_log *──1 users (admin actor)
```

### 5.2 localStorage → PostgreSQL mapping

| localStorage key | Target table.column |
|------------------|---------------------|
| `austriaPathUsers[]` | `users` + `user_profiles` |
| `austriaPathLegalConsent` | `legal_consents` |
| `austriaPathSubscription` | `subscriptions` |
| `austriaPathAIReports[]` | `ai_reports` |
| `austriaPathPlacementProfile` | `user_profiles.placement_profile` (JSONB) |
| `austriaPathWeeklyPlan` | `weekly_plans` + `weekly_plan_reports` |
| `austriaPathStudentProfile` | `user_profiles.skill_aggregates` (JSONB) |
| `austriaPathAdminData` | `content_items` |
| `austriaPathAiPrueferLibrary` | `examiner_rules` |
| `austriaPathAIErrorLog` | Ephemeral / `ai_error_log` (90d TTL) |

Full mapping: Database Schema §7.2 · `src/security/storageRegistry.js`

---

## 6. Role & Permission Matrix

### 6.1 Roles

| Role | `users.role` | Description |
|------|--------------|-------------|
| `student` | Default | Training, profile, premium if subscribed |
| `admin` | Operator | CMS, users, Examiner Lab, AI-Prüfer |
| `examiner` | Future | Examiner Lab review only |

### 6.2 Permission flags (`subscriptions.permissions` / `user.permissions`)

| Permission | Free | placement_test | weekly_plan | ai_exam | intensive_week | premium_month |
|------------|------|----------------|-------------|---------|----------------|---------------|
| placementTest | — | ✅ | — | — | ✅ | ✅ |
| weeklyPlan | — | — | ✅ | — | ✅ | ✅ |
| aiExam | — | — | — | ✅ | ✅ | ✅ |
| reports | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| writingAI | — | — | ✅ | ✅ | ✅ | ✅ |
| imageAI | — | — | ✅ | ✅ | ✅ | ✅ |
| speakingAI | — | — | ✅ | ✅ | ✅ | ✅ |
| readingAI | — | — | — | ✅ | ✅ | ✅ |
| listeningAI | — | — | — | ✅ | ✅ | ✅ |

Source: `src/data/subscriptionEngine.js` → `getPermissionsByPlan()` (includes `weekly_plan` as of this package).

### 6.3 Admin-only UI tabs

`admin`, `userManagement`, `examinerLab`, `aiPruefer` — enforced in `routeGuard.js`; **must** mirror server ACL.

### 6.4 AI credit costs

| Service | Credits | Rule engine |
|---------|---------|-------------|
| placement_test | 1 | Rule-only (`FREE_RULE_SERVICES`) |
| weekly_plan | 1 | Rule-only |
| ai_exam | 2 | OpenAI allowed |
| intensive_week / premium_month session | 2 | OpenAI allowed |
| report_builder | 1 | OpenAI |
| follow_up_question | 1 | OpenAI |

Source: `src/config/accessControl.js`

**Ledger model (unified):** `available = aiCredits - usedAiCredits` — implemented in `src/utils/aiCredits.js`.

---

## 7. OpenAI Integration Specification

### 7.1 Current proxy (`api/ai/openai.js`)

| Aspect | Implementation |
|--------|----------------|
| Endpoint | `POST /api/ai/openai` |
| Auth | **None** — must add before public launch |
| Input | `prompt`, `studentAnswer`, OR `messages[]`, optional `mode`, `context` |
| Model | `OPENAI_MODEL` env or `gpt-4.1-mini` |
| Output | `{ success, result, mode, serviceType }` — no raw payload |
| Errors | HTTP 4xx/5xx with `errorCode` |

### 7.2 Client wrapper (`secureOpenAI.js`)

- Max prompt/answer: 8000 chars
- Max messages: 30
- Calls proxy; uses `errorReporting.js` on failure

### 7.3 ExaminerMind routing (`modelRouter.js`)

| Engine | Provider | Credit check |
|--------|----------|--------------|
| 6 judges | `rule` (local) | No |
| reflectionEngine, reportBuilder, feedbackBuilder | `openai` | Yes |
| placement_test, weekly_plan | Forced `rule` | Minimal credits |

### 7.4 Target production proxy

```
Client → POST /ai/completions (authenticated)
       → Verify subscription + deduct credits atomically
       → Call OpenAI
       → Log: userId, serviceType, tokens, latency (no full prompt in prod logs)
       → Return { result, creditsRemaining }
```

### 7.5 Data minimization

- Do **not** persist full prompts/responses long-term
- Persist: report summaries, scores, strengths/weaknesses only
- See [AI-Privacy-Policy.md](./AI-Privacy-Policy.md)

---

## 8. AI Report Architecture

### 8.1 Report types

| type | Source screen | evaluationMethod (target) |
|------|---------------|---------------------------|
| `premium-exam` | PremiumExamSessionScreen | `examiner_mind` |
| `weekly_plan` | AISessionScreen | `training_heuristic` |
| `placement` | PlacementTestScreen | `rule_placement` |
| `intelligent-exam` | IntelligentExamScreen | `llm_conversational` |

### 8.2 Premium exam report shape

```json
{
  "title": "AI Probeprüfung · B1",
  "date": "ISO8601",
  "summary": "string",
  "strongCount": 0,
  "middleCount": 0,
  "weakCount": 0,
  "strengths": [],
  "weaknesses": [],
  "focusAreas": [],
  "type": "premium-exam",
  "level": "B1",
  "packageType": "ai_exam",
  "examinerMind": {},
  "evaluationMethod": "examiner_mind"
}
```

Storage today: `austriaPathAIReports[]` · Target: `ai_reports` table

### 8.3 ExaminerMind pipeline

```
runExaminerMind → Brain → ExaminerCouncil (6 judges) → DecisionEngine → optional AuditEngine
```

See [AustriaPath_Knowledge_Base.md](./AustriaPath_Knowledge_Base.md) §5–§7.

**Known gaps (EC items — pending approval):** EC-01–EC-08, EC-20, EC-22 — see [ExaminerCouncil Decision Guide](./AustriaPath_ExaminerCouncil_DecisionGuide.md).

---

## 9. AI Credits & Subscription Workflow

### 9.1 Interim (SPA)

```
SubscriptionScreen → sets premiumActive, austriaPathSubscription, userPlan
UserManagementScreen → grantPlan() via subscriptionEngine
modelRouter → canUseAI / consumeAICredits (ledger: aiCredits - usedAiCredits)
```

**Canonical premium detection:** `src/utils/subscriptionAccess.js` → `isPremiumActive()`

### 9.2 Target (backend)

```
Stripe webhook → subscriptions row active
                → grant ai_credits ledger entries
                → set permissions JSON

User starts AI exam → POST /subscription/consume-exam (if exam-limited plan)
                   → POST /ai/completions → atomic credit debit
```

### 9.3 Plan catalog (Stripe mapping)

| Plan ID | type | Price | Exams | Credits | Days |
|---------|------|-------|-------|---------|------|
| placement | placement_test | €2.00 | 1 placement | 30 | — |
| weekly | weekly_plan | €14.99 | 3 sessions | 30 | 7 |
| exam | ai_exam | €9.99 | 1 | 50 | — |
| intensive | intensive_week | €24.99 | 3 | 150 | 7 |
| month | premium_month | €39.99 | 5 | 250 | 30 |

---

## 10. Payment Integration Specification (Stripe)

**Do not implement client-side payment.** Specification only.

### 10.1 Flow

```
1. User selects plan in SubscriptionScreen (future: calls API)
2. POST /subscription/checkout { planType }
3. Backend creates Stripe Checkout Session with price_id
4. Redirect to Stripe Hosted Checkout
5. webhook checkout.session.completed
6. Backend: insert payments, subscriptions, credit ledger
7. Frontend: GET /auth/me refreshes permissions
```

### 10.2 Stripe objects

| Stripe | Internal |
|--------|----------|
| Product | plan type |
| Price | EUR amount |
| Customer | users.stripe_customer_id |
| Checkout Session | payments.stripe_session_id |
| Subscription (if recurring) | subscriptions.stripe_subscription_id |

### 10.3 Webhook events

- `checkout.session.completed` → activate plan
- `charge.refunded` → revoke / adjust credits
- `customer.subscription.deleted` → expire plan

### 10.4 Remove before production

- Client-side instant premium in `SubscriptionScreen.handleSelectPlan` — replace with checkout redirect only

---

## 11. Error Handling & Logging

### 11.1 Frontend (implemented)

| Layer | File | Behavior |
|-------|------|----------|
| AI errors | `secureOpenAI.js` + `errorReporting.js` | Structured payload; dev console |
| Auth errors | `userAccess.js` | German user messages |
| Storage | `secureStorage.js` | Size cap, try/catch |

### 11.2 Target backend logging

| Event | Level | Fields |
|-------|-------|--------|
| auth.login.failed | warn | email hash, IP |
| ai.completion | info | userId, serviceType, tokens, ms |
| ai.completion.failed | error | userId, errorCode |
| admin.action | info | adminId, action, targetId |
| stripe.webhook | info | event type, customer |

**Never log:** passwords, full prompts, OpenAI raw responses in production.

### 11.3 Client error endpoint (future)

```
POST /api/client-errors
  { message, name, context, url, timestamp }
  Rate limited, no PII
```

Wire `errorReporting.js` to this when Sentry/backend available.

---

## 12. Performance Optimization

### 12.1 Completed

| Item | Detail |
|------|--------|
| Production sourcemaps off | `vite.config.ts` |
| Console/debugger stripped | esbuild drop in prod |
| OpenAI payload trimming | Client + server |

### 12.2 Recommended (no UX change)

| Item | Effort | Impact |
|------|--------|--------|
| Lazy-load admin screens | Medium | Smaller initial bundle |
| Remove unused npm deps (~40 Figma packages) | Medium | Install size, audit noise |
| Image lazy loading in training screens | Low | LCP |
| Memoize heavy exam model lists | Low | Re-render cost |

### 12.3 Backend

- Redis cache for CMS content
- CDN for static assets (Vercel default)
- OpenAI response caching — **do not** for personalized exam feedback

---

## 13. Code Cleanup (Completed)

### 13.1 Removed dead files

| File | Reason |
|------|--------|
| `ExamScreen.jsx` | Superseded by IntelligentExamScreen |
| `SprachakademieScreen.jsx` | Orphaned |
| `PremiumExamParts.jsx` | Never imported |
| `placementLogic.js` | No consumers |
| `aiReportLogic.js` | No consumers |
| `aiExamEngine.js` | No consumers |
| `weeklyPlanEngine.js` | No consumers |
| `utils/placementEngine.js` | Wrong engine; replaced by `data/utils/placementEngine.js` |
| `examinerRules.js` | Unused static export |

### 13.2 Logic fixes

| Issue | Fix |
|-------|-----|
| Placement test wrong engine | Import from `data/utils/placementEngine.js` |
| Premium hints after subscribe | `subscriptionAccess.isPremiumActive()` |
| Dual AI credit paths | Ledger model in `aiCredits.js` via `userAccess` |
| Missing weekly_plan permissions | Added to `subscriptionEngine.js` |
| LesenScreen duplicate premium check | Uses shared `premiumHint.js` |

---

## 14. Component Reusability

### 14.1 New shared modules

| Module | Purpose |
|--------|---------|
| `src/utils/subscriptionAccess.js` | Canonical premium detection |
| `src/utils/userPreferences.js` | `getUserLanguage()`, `getUserLevel()` |
| `src/utils/errorReporting.js` | Structured client errors |

### 14.2 Future consolidation (optional, no UI change)

- Replace 12+ inline language resolvers with `getUserLanguage()`
- Single `usePremiumHint(section)` hook
- Unify admin CMS reads through `adminContent.js`

---

## 15. Project Documentation Index

| Document | Status |
|----------|--------|
| README.md | ✅ Updated |
| AustriaPath_Knowledge_Base.md | ✅ |
| AustriaPath_Technical_Specification.md | ✅ |
| AustriaPath_Database_Schema.md | ✅ |
| AustriaPath_Production_Engineering_Package.md | ✅ This document |
| AustriaPath_Remaining_Work_Before_Launch.md | ✅ |
| AustriaPath_Closed_Beta_Launch_Plan.md | ✅ |
| Backend Security Requirements.md | ✅ |
| Launch-Checklist.md | ✅ |
| GDPR-Readiness-Review.md | ✅ |
| AI-Privacy-Policy.md / AI-Transparency.md | ✅ |
| Examiner Council docs | ✅ |

---

## 16. Deployment Checklist

### Vercel

- [ ] Connect repo; set production branch
- [ ] Env: `OPENAI_API_KEY`, `VITE_ADMIN_EMAIL`, `VITE_ADMIN_INITIAL_PASSWORD=` (empty)
- [ ] Optional: `OPENAI_MODEL`
- [ ] Confirm `vercel.json` headers + SPA rewrite deploy
- [ ] `robots: noindex` until public launch
- [ ] OpenAI dashboard: hard spending cap

### Pre-deploy verify

```bash
npm ci
npm run build
npm run preview
```

### Post-deploy smoke

- [ ] Legal consent flow
- [ ] Register + login
- [ ] Intelligent Exam (multi-turn messages)
- [ ] Premium exam → report in Profile
- [ ] Admin tab (after bootstrap)

---

## 17. Production Readiness Checklist

See [Launch-Checklist.md](./Launch-Checklist.md) and [AustriaPath_Remaining_Work_Before_Launch.md](./AustriaPath_Remaining_Work_Before_Launch.md).

**Minimum for closed beta:** Legal consent, Impressum, empty admin password env, OpenAI cap, invite-only URL.

**Minimum for commercial launch:** Backend auth, Stripe, authenticated AI proxy, PostgreSQL, GDPR APIs, EC Confirmed items, legal counsel sign-off.

---

## 18. GDPR & EU AI Act Compliance Review

### 18.1 GDPR status

| Requirement | SPA today | Production |
|-------------|-----------|------------|
| Consent record | ✅ localStorage | `legal_consents` table |
| Privacy policy | ✅ in-app | Counsel review pending |
| Impressum | ⚠️ placeholders | Must complete |
| Export | ❌ | `GET /users/me/export` |
| Deletion | ❌ client only | `DELETE /users/me` + 30d job |
| DPA OpenAI | ❌ | Legal task |
| Storage inventory | ✅ `storageRegistry.js` | Document in privacy policy |

### 18.2 EU AI Act Art. 4

| Measure | Status |
|---------|--------|
| AI Disclaimer page | ✅ `legalContent.js` |
| Consent before use | ✅ LegalConsentScreen |
| Transparency doc | ✅ AI-Transparency.md |
| Evaluation mode labels | ⚠️ EC-06 pending approval |
| Not claiming official ÖIF certification | ⚠️ Marketing + EC-19 review |

---

## 19. Testing Checklist for Launch

### 19.1 Manual QA (required pre-beta)

| Area | Tests |
|------|-------|
| Auth | Register, login, blocked user, admin email blocked on register |
| Legal | Consent, re-consent on version bump, footer links |
| Placement | Full flow → profile with level + studyPlan |
| Premium | Select plan → exam → report in Profile |
| AI | Intelligent Exam multi-turn; report builder |
| Admin | User management, grant plan, block user |
| Credits | Deplete credits → AI blocked message |

### 19.2 Automated (recommended before commercial launch)

| Layer | Tool | Target |
|-------|------|--------|
| Unit | Vitest | `placementEngine`, judges, `decisionEngine`, `sanitize` |
| API | Supertest | Auth, AI proxy, webhooks |
| E2E | Playwright | Register → consent → home |
| CI | GitHub Actions | `npm ci && npm run build && npm audit` |

### 19.3 Security tests

- [ ] OpenAI proxy rejects unauthenticated requests (post-backend)
- [ ] Cannot access admin API as student
- [ ] Stripe webhook signature validation
- [ ] Rate limit auth endpoints

---

## 20. Backend Implementation Priority

| Phase | Scope | Est. dependency |
|-------|-------|-----------------|
| **B1** | PostgreSQL + migrations from Database Schema | Week 1 |
| **B2** | Auth (register, login, me, hash passwords) | Week 1–2 |
| **B3** | Authenticated `/ai/completions` + credit ledger | Week 2 |
| **B4** | Reports + placement/profile APIs | Week 2–3 |
| **B5** | Stripe Checkout + webhooks | Week 3 |
| **B6** | GDPR export/delete | Week 3–4 |
| **B7** | Admin APIs + audit log | Week 4 |
| **B8** | Email verify + password reset | Week 4–5 |

Frontend integration: swap `userAccess.js` calls for API client module — **no UI redesign required**.

---

**Document owner:** AustriaPath Engineering  
**Next review:** When backend Phase B1 starts
