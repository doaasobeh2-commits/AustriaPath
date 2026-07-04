# AustriaPath — Analysis & Recommendations

**Document version:** 1.0  
**Last updated:** 4 July 2026  
**Status:** Analysis only — no implementation authorized  
**Purpose:** Consolidated recommendations from Phases 1–7 and existing project documentation  

---

## Important Notice

This document contains **recommendations only**. No code, database, frontend, AI logic, exam models, prompts, or features have been changed to produce it.

**Do not implement any item below without explicit approval.**

Each recommendation includes: why it is needed, benefits, possible risks, where it connects in AustriaPath, and whether it should be done **before launch** or **after launch**.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Recommendation Priority Matrix](#2-recommendation-priority-matrix)
3. [Authentication & Identity](#3-authentication--identity)
4. [Backend & Database](#4-backend--database)
5. [Security & Infrastructure](#5-security--infrastructure)
6. [Payments & Subscriptions](#6-payments--subscriptions)
7. [AI & ExaminerMind](#7-ai--examinermind)
8. [Exam Content & Governance](#8-exam-content--governance)
9. [Legal, Privacy & GDPR](#9-legal-privacy--gdpr)
10. [Operations & Deployment](#10-operations--deployment)
11. [Frontend & UX (Non-Feature)](#11-frontend--ux-non-feature)
12. [Approval Gate](#12-approval-gate)

---

## 1. Executive Summary

AustriaPath has a functional React/Vite SPA with ExaminerMind evaluation, admin CMS, legal/consent flows (Phase 4), and comprehensive engineering documentation (Phases 5–7). The application is **not ready for unrestricted public launch** in its current architecture because:

- User data, passwords, subscriptions, and AI credits live in bypassable `localStorage`
- The OpenAI proxy (`api/ai/openai.js`) is unauthenticated and returns raw upstream payloads
- Premium activation is client-side only (`SubscriptionScreen.jsx`) with no payment processor
- GDPR deletion/export APIs are documented but not built
- Exam content has no enforced AI eligibility gate (`premiumExamBuilder.js` uses `published` only)

**Recommended path:** Complete all **before launch** items in Sections 3–6 and 9, then launch in a controlled beta. **After launch** items improve scale, content quality automation, and operational maturity.

---

## 2. Recommendation Priority Matrix

| ID | Recommendation | Timing |
|----|----------------|--------|
| R-01 | Server-side authentication | **Before launch** |
| R-02 | PostgreSQL backend (replace localStorage) | **Before launch** |
| R-03 | Authenticated OpenAI proxy | **Before launch** |
| R-04 | Stripe payment integration | **Before launch** |
| R-05 | Remove production admin bootstrap password | **Before launch** |
| R-06 | Legal counsel review + Impressum completion | **Before launch** |
| R-07 | GDPR account deletion & export APIs | **Before launch** |
| R-08 | HSTS + WAF on production domain | **Before launch** |
| R-09 | OpenAI DPA + Transfer Impact Assessment | **Before launch** |
| R-10 | Email verification & password reset | **Before launch** |
| R-11 | Monitoring, error tracking, backups | **Before launch** |
| R-12 | localStorage → database migration plan execution | **Before launch** |
| R-13 | Server-side admin authorization | **Before launch** |
| R-14 | DPIA for AI evaluation | **Before launch** |
| R-15 | Exam content governance enforcement | **Before launch** (minimum manual review) |
| R-16 | Model status system (backend fields) | **After launch** (Phase G2) |
| R-17 | Examiner Lab review workflow | **After launch** |
| R-18 | Automated conflict check service | **After launch** |
| R-19 | Examiner role (human reviewers) | **After launch** |
| R-20 | Onboarding persistence fix | **After launch** |
| R-21 | Admin preview impersonation | **After launch** |
| R-22 | Bulk seed content human verification | **Before launch** (manual) / **After launch** (tooling) |
| R-23 | CI pipeline with `npm audit` | **Before launch** |
| R-24 | Sentry / structured logging | **Before launch** |
| R-25 | Supabase RLS policies | **Before launch** (if Supabase chosen) |
| R-26 | Subprocessor register in privacy policy | **Before launch** |
| R-27 | Account deletion UI (AccountSettings) | **After launch** (after R-07) |
| R-28 | Redis ephemeral session store | **After launch** |
| R-29 | EU OpenAI region / alternative provider evaluation | **After launch** |
| R-30 | Content CMS media upload (S3) | **After launch** |

---

## 3. Authentication & Identity

### R-01 — Server-side authentication API

| | |
|---|---|
| **Why needed** | Passwords are stored in plaintext in `austriaPathUsers` (`userAccess.js`). Session truth is `isLoggedIn` in `localStorage`. Any user can escalate role or credits via DevTools. |
| **Benefits** | Real security boundary; GDPR-compliant credential handling; foundation for all other backend features. |
| **Possible risks** | Migration complexity; session UX changes; downtime during cutover if not staged. |
| **AustriaPath connection** | Replaces `authenticateUser()`, `registerStudentUser()`, `validateSessionOnStartup()` in `src/app/userAccess.js`. Frontend auth screens remain; they call API instead of localStorage. Spec: `AustriaPath_Technical_Specification.md` §3.1. |
| **Timing** | **Before launch** |

---

### R-05 — Remove `VITE_ADMIN_INITIAL_PASSWORD` from production builds

| | |
|---|---|
| **Why needed** | `VITE_*` variables are embedded in the JS bundle. Admin seed password is readable in production if set (`authConfig.js`, `envValidation.js` warns but does not block). |
| **Benefits** | Eliminates critical credential exposure; aligns with `Backend Security Requirements.md` §1. |
| **Possible risks** | Admin lockout if server seed script not ready; requires one-time server bootstrap process. |
| **AustriaPath connection** | `src/config/authConfig.js` → `buildSeedAdminUser()` in `userAccess.js`. Replace with server-only seed. `.env.example` documents current risk. |
| **Timing** | **Before launch** |

---

### R-10 — Email verification and password reset

| | |
|---|---|
| **Why needed** | `RegisterScreen.jsx` shows verification as placeholder ("Ausstehend — wird per Backend aktiviert"). `ForgotPasswordScreen.jsx` has no backend. |
| **Benefits** | Reduces fake accounts; enables secure recovery; meets user expectations and security baseline. |
| **Possible risks** | Email deliverability (SPF/DKIM); support load from undelivered emails; UX friction at registration. |
| **AustriaPath connection** | `RegisterScreen.jsx`, `ForgotPasswordScreen.jsx`, `POST /auth/forgot-password` and `/auth/reset-password` in Technical Spec. `users.email_verified` in Database Schema. |
| **Timing** | **Before launch** |

---

### R-13 — Server-side admin authorization (replace client-only guards)

| | |
|---|---|
| **Why needed** | `routeGuard.js` hides admin tabs in UI only. Admin CMS second gate reads password from `getAdminUserRecord()` in localStorage (`AdminScreen.jsx`). |
| **Benefits** | Prevents privilege escalation; audit trail for admin actions; supports future Examiner role separation. |
| **Possible risks** | Breaking admin workflow during migration; need step-up auth design for sensitive CMS actions. |
| **AustriaPath connection** | `AdminScreen`, `UserManagementScreen`, `ExaminerLabScreen`, `AIPrueferScreen` — all admin tabs in `App.jsx`. Backend must enforce on every `/admin/*` route. |
| **Timing** | **Before launch** |

---

## 4. Backend & Database

### R-02 — PostgreSQL backend as system of record

| | |
|---|---|
| **Why needed** | All user, subscription, report, and content data is browser-local. Data does not sync across devices; is lost on cache clear; cannot support GDPR at scale. |
| **Benefits** | Durable storage; multi-device access; queryable audit; backup/recovery; supports payments and AI usage logging. |
| **Possible risks** | Cost; schema migration errors; dual-write period during transition; vendor lock-in if not using standard PostgreSQL. |
| **AustriaPath connection** | Full schema in `AustriaPath_Database_Schema.md`. API surface in Technical Spec §3. Replaces keys in `storageRegistry.js` and all `austriaPath*` localStorage keys. |
| **Timing** | **Before launch** |

---

### R-12 — Execute localStorage → database migration

| | |
|---|---|
| **Why needed** | Existing users (if any beta testers) have data only in browser. Migration mapping is documented but not executed. |
| **Benefits** | No data loss at cutover; validates schema against real payloads; forces password re-hash. |
| **Possible risks** | Partial migration if client export fails; duplicate users if email normalization inconsistent; plaintext password import requires forced reset. |
| **AustriaPath connection** | Migration table in Database Schema §7.2 (`austriaPathUsers` → `users`, `austriaPathAIReports` → `ai_reports`, etc.). One-time import script + per-user login migration. |
| **Timing** | **Before launch** (at backend go-live) |

---

### R-25 — Row Level Security (if using Supabase)

| | |
|---|---|
| **Why needed** | Direct client-to-DB access (if ever used) or defense-in-depth for multi-tenant data. |
| **Benefits** | Database-enforced isolation even if application bug bypasses auth middleware. |
| **Possible risks** | Complex policies; performance overhead; debugging difficulty; may be redundant if all access goes through API only. |
| **AustriaPath connection** | Database Schema §8.3 — policies on `ai_reports`, `users`, `examiner_lab_samples`, etc. |
| **Timing** | **Before launch** (if Supabase is chosen); **N/A** if API-only with managed PostgreSQL |

---

### R-28 — Redis (or equivalent) for ephemeral AI session data

| | |
|---|---|
| **Why needed** | Temporary keys (`austriaPathCurrentSessionAnswers`, `austriaPathPremiumExamPackage`, etc.) should not land in PostgreSQL per privacy policy. |
| **Benefits** | Automatic TTL purge; reduces DB size; clear separation of ephemeral vs persistent data. |
| **Possible risks** | Additional infrastructure; session loss on Redis failure; cost. |
| **AustriaPath connection** | AI-Privacy-Policy.md §5; Database Schema §5.2 ephemeral list. `PremiumExamSessionScreen.jsx`, `AISessionScreen.jsx` session buffers. |
| **Timing** | **After launch** (can use in-memory server sessions initially for low traffic) |

---

## 5. Security & Infrastructure

### R-03 — Authenticated, rate-limited OpenAI proxy

| | |
|---|---|
| **Why needed** | `api/ai/openai.js` accepts unauthenticated POST; returns `raw` OpenAI response; no credit check; `OPENAI_API_KEY` exposed to abuse if endpoint is public. |
| **Benefits** | Cost control; prevents API key abuse; enables per-user usage logging; removes raw payload leak. |
| **Possible risks** | Latency added by auth layer; OpenAI outages block exams; incorrect credit deduction bugs affect UX. |
| **AustriaPath connection** | `src/security/secureOpenAI.js` → `/api/ai/openai`. Used by `IntelligentExamScreen.jsx`, `modelRouter.js`, `openaiProvider.js`. Technical Spec §3.3 `POST /ai/completions`. |
| **Timing** | **Before launch** |

---

### R-08 — HSTS and WAF on production domain

| | |
|---|---|
| **Why needed** | `vercel.json` sets CSP and frame options but not HSTS. No WAF documented. Public launch increases attack surface. |
| **Benefits** | TLS downgrade protection; bot/scanner blocking; DDoS mitigation on auth and AI endpoints. |
| **Possible risks** | WAF false positives blocking legitimate users; HSTS misconfiguration causes lockout during cert issues; cost. |
| **AustriaPath connection** | `vercel.json`, `vite.config.ts` headers. Backend Security Requirements §5. Launch Checklist §Security. |
| **Timing** | **Before launch** |

---

### R-23 — CI pipeline with dependency audit

| | |
|---|---|
| **Why needed** | No automated CI documented. Supply chain vulnerabilities in npm dependencies may reach production unnoticed. |
| **Benefits** | Early detection of CVEs; consistent build verification; prevents broken deploys. |
| **Possible risks** | CI maintenance overhead; audit noise from devDependencies; false sense of security if tests are minimal. |
| **AustriaPath connection** | `package-lock.json`, `npm run build`. Backend Security Requirements §14. |
| **Timing** | **Before launch** |

---

## 6. Payments & Subscriptions

### R-04 — Stripe Checkout and webhook integration

| | |
|---|---|
| **Why needed** | `SubscriptionScreen.handleSelectPlan()` writes `premiumActive`, `austriaPathSubscription` to localStorage on button click with no payment. Plans priced €2–€39.99 are currently free to activate. |
| **Benefits** | Revenue integrity; PCI compliance via Stripe; auditable payment history; server-side subscription truth. |
| **Possible risks** | Webhook failures causing desync; refund/chargeback handling; Stripe account setup for AT/EU; test vs live key mistakes. |
| **AustriaPath connection** | `SubscriptionScreen.jsx`, `subscriptionEngine.js` `grantPlan()`, `ProfileScreen.jsx` premium state. Technical Spec §3.5–3.6; Database Schema `payments`, `subscriptions`. |
| **Timing** | **Before launch** (if premium is marketed publicly); **After launch** if launch is free-only beta with admin-granted plans only |

---

### R-04b — Server-side subscription enforcement (companion to R-04)

| | |
|---|---|
| **Why needed** | `premiumHint.js`, `isPremiumUser`, `placementPaid`, `premiumActive` are client flags bypassable via DevTools. |
| **Benefits** | Premium features gated by `GET /auth/me` permissions; aligns with `getPermissionsByPlan()`. |
| **Possible risks** | Offline/cache stale permissions if not refreshed; need graceful degradation messaging. |
| **AustriaPath connection** | `accessControl.js`, `subscriptionEngine.js`, `PremiumExamSessionScreen.jsx`, `PlacementTestScreen.jsx`, `WeeklyPlanSetupScreen.jsx`. |
| **Timing** | **Before launch** (with R-02 and R-04) |

---

## 7. AI & ExaminerMind

### R-03b — Strip raw OpenAI responses from API (subset of R-03)

| | |
|---|---|
| **Why needed** | Current proxy returns `{ success, result, raw: data }` exposing full OpenAI payload including metadata and potential prompt echoes. |
| **Benefits** | Reduced information leakage; smaller responses; cleaner client contract matching `secureOpenAI.js` expectations. |
| **Possible risks** | Debugging harder without server-side logs; client code must not depend on `raw`. |
| **AustriaPath connection** | `api/ai/openai.js` line returning `raw: data`. |
| **Timing** | **Before launch** |

---

### R-09 — OpenAI DPA and Transfer Impact Assessment

| | |
|---|---|
| **Why needed** | Student exam text is sent to OpenAI (US). GDPR requires appropriate safeguards for third-country transfer. |
| **Benefits** | Legal compliance; documented subprocessors; clear retention settings with OpenAI. |
| **Possible risks** | Legal cost; may require configuration changes; potential need to switch provider if TIA outcome is negative. |
| **AustriaPath connection** | Datenschutz in `legalContent.js` §6; GDPR-Readiness-Review.md; AI-Privacy-Policy.md §7. |
| **Timing** | **Before launch** |

---

### R-14 — Data Protection Impact Assessment (DPIA) for AI evaluation

| | |
|---|---|
| **Why needed** | Systematic AI scoring of language performance may trigger DPIA under GDPR for high-risk processing context. |
| **Benefits** | Identifies mitigations before incidents; required documentation for regulators; builds user trust. |
| **Possible risks** | May delay launch; may require process changes (consent wording, retention limits). |
| **AustriaPath connection** | GDPR-Readiness-Review.md §9; Legal consent flow `LegalConsentScreen.jsx`; AI Transparency doc. |
| **Timing** | **Before launch** |

---

### R-29 — Evaluate EU-region AI provider or OpenAI data residency options

| | |
|---|---|
| **Why needed** | Reduces third-country transfer complexity long-term. |
| **Benefits** | Simpler GDPR posture; potentially lower latency in EU. |
| **Possible risks** | Model quality differences; integration effort in `modelRouter.js`; cost; ExaminerMind prompt tuning may need revalidation. |
| **AustriaPath connection** | `modelRouter.js` providers (gemini/claude disabled today); `openaiProvider.js`. |
| **Timing** | **After launch** |

---

## 8. Exam Content & Governance

### R-15 — Minimum manual content review before public premium AI

| | |
|---|---|
| **Why needed** | `aiPremiumLibrary.js` defaults have `visibleToStudents: false` but no quality status. `premiumExamBuilder.js` does not check AI eligibility. Weak content produces low-confidence errors logged to Examiner Lab. |
| **Benefits** | Protects brand quality; reduces student confusion; fewer Examiner Lab noise cases. |
| **Possible risks** | Slows content release; subjective review standards without tooling; reviewer bottleneck. |
| **AustriaPath connection** | Exam Content Quality spec §3, §7 Admin Checklist. `premiumExamBuilder.js`, `AIPrueferScreen.jsx`, `aiPremiumLibrary.js`. |
| **Timing** | **Before launch** (manual sign-off on models used in premium path) |

---

### R-16 — Implement model status system in backend

| | |
|---|---|
| **Why needed** | Specification defines `draft`, `training_only`, `ai_exam_ready`, `human_verified`, `weak_model` but no field exists in client storage. |
| **Benefits** | Enforceable AI eligibility; audit trail; weak model blocking. |
| **Possible risks** | Admin workflow overhead; migration of existing models to statuses; false blocks if misconfigured. |
| **AustriaPath connection** | Exam Content Quality spec §4; Database Schema §10.1 `model_status` on `examiner_rules` and `content_items`. |
| **Timing** | **After launch** (Phase G2–G3 in governance roadmap) — **manual review (R-15) before launch** |

---

### R-17 — Examiner Lab review workflow implementation

| | |
|---|---|
| **Why needed** | `ExaminerLabScreen.jsx` Correct/Wrong/New Rule buttons have no logic. Error log auto-captures up to 500 entries but human review loop is incomplete. |
| **Benefits** | Closes improvement loop from real exams to examiner rules; reduces recurring AI errors. |
| **Possible risks** | Admin time burden; privacy if samples contain student text; scope creep into ML training. |
| **AustriaPath connection** | `errorLearningEngine.js`, `ExaminerLabScreen.jsx`, `examiner_lab_samples` table, Exam Content spec §8. |
| **Timing** | **After launch** |

---

### R-18 — Automated examiner rule conflict check

| | |
|---|---|
| **Why needed** | `followUpRules` and `examinerRules` in AI-Prüfer models can contradict. `DecisionEngine.detectConflicts()` catches runtime issues but not pre-publish. |
| **Benefits** | Prevents publishing conflicting models; aligns with Examiner Council Rules EC-001–EC-002. |
| **Possible risks** | False positives blocking valid models; maintenance of contradiction patterns; may not catch semantic conflicts. |
| **AustriaPath connection** | Exam Content spec §5.4; `AIPrueferScreen.jsx` save flow; future `POST /admin/models/:id/conflict-check`. |
| **Timing** | **After launch** |

---

### R-22 — Bulk human verification of seed content

| | |
|---|---|
| **Why needed** | Static models (`modelsA2.js` etc.) include `status: "preview"`. `aiPremiumLibrary.js` has 800+ lines of AI prompts unverified under new checklist. |
| **Benefits** | Known baseline quality at launch; identifies weak models before students encounter them. |
| **Possible risks** | Significant admin time; may delay launch; checklist fatigue. |
| **AustriaPath connection** | `modelsA2.js`, `aiPremiumLibrary.js`, Admin Checklist §9 in Exam Content spec. |
| **Timing** | **Before launch** (minimum: premium exam path models); **After launch** (full library with tooling) |

---

## 9. Legal, Privacy & GDPR

### R-06 — Legal counsel review and Impressum completion

| | |
|---|---|
| **Why needed** | `legalContent.js` Impressum and Kontakt contain bracket placeholders (`[kontakt@austriaPath.at eintragen]`, address fields). Not valid for Austrian commercial operation. |
| **Benefits** | Legal operability in Austria/EU; reduces liability; professional public presence. |
| **Possible risks** | Legal fees; counsel may require policy changes triggering re-consent (`LEGAL_VERSIONS` bump). |
| **AustriaPath connection** | `src/legal/legalContent.js`, `LegalPageScreen.jsx`, `Launch-Checklist.md` §Legal. |
| **Timing** | **Before launch** |

---

### R-07 — GDPR account deletion and data export APIs

| | |
|---|---|
| **Why needed** | `AccountSettingsScreen.jsx` lists account deletion as "Demnächst verfügbar". No export mechanism. GDPR Art. 17 and 20 require operational capability. |
| **Benefits** | Regulatory compliance; user trust; reduces manual support for DSGVO requests. |
| **Possible risks** | Irreversible deletion bugs; export bundles containing third-party data; 30-day SLA operational load. |
| **AustriaPath connection** | Database Schema `account_deletion_requests`, `data_export_requests`. GDPR-Readiness-Review.md §6–7. |
| **Timing** | **Before launch** |

---

### R-26 — Subprocessor register and Verarbeitungsverzeichnis

| | |
|---|---|
| **Why needed** | Privacy policy mentions OpenAI and hosting generically but no maintained register. GDPR requires documentation of processing activities. |
| **Benefits** | Audit readiness; clear transparency for users and counsel. |
| **Possible risks** | Must update when vendors change; internal doc maintenance burden. |
| **AustriaPath connection** | `legalContent.js` datenschutz §6; GDPR-Readiness-Review.md; Launch Checklist §GDPR. |
| **Timing** | **Before launch** |

---

### R-27 — Account deletion UI in Account Settings

| | |
|---|---|
| **Why needed** | Self-service deletion improves UX and reduces support; depends on R-07 backend. |
| **Benefits** | User empowerment; GDPR compliance UX; fewer email requests. |
| **Possible risks** | Accidental deletion; need confirmation flow; must sync with deletion job status. |
| **AustriaPath connection** | `AccountSettingsScreen.jsx` "Demnächst verfügbar" section. `DELETE /users/me` API. |
| **Timing** | **After launch** (immediately after R-07 is live) |

---

## 10. Operations & Deployment

### R-11 — Monitoring, backups, and incident runbook

| | |
|---|---|
| **Why needed** | No uptime monitoring, error tracking, or tested backup restore documented as active. Launch without observability is blind to outages and AI cost spikes. |
| **Benefits** | Faster incident response; SLA credibility; protects against data loss. |
| **Possible risks** | Alert fatigue; cost of monitoring tools; false alerts during deploys. |
| **AustriaPath connection** | Launch Checklist §Monitoring, §Backup. Technical Spec §9.4–9.7. RTO 4h / RPO 24h targets. |
| **Timing** | **Before launch** |

---

### R-24 — Error tracking (e.g. Sentry) without PII

| | |
|---|---|
| **Why needed** | Production build strips `console` (`vite.config.ts`) — client errors become invisible without tooling. |
| **Benefits** | Real user error visibility; stack traces for debugging; release health metrics. |
| **Possible risks** | Accidental PII in breadcrumbs if not scrubbed; added SDK bundle size; cost at scale. |
| **AustriaPath connection** | `main.jsx`, `initSecurity.js`, global error boundaries (if added later). Backend Security Requirements §9. |
| **Timing** | **Before launch** |

---

### R-11b — AI cost and usage dashboards

| | |
|---|---|
| **Why needed** | OpenAI calls have no per-user cost logging today. Premium launch could cause unexpected bills. |
| **Benefits** | Budget control; abuse detection; supports `ai_credits` ledger reconciliation. |
| **Possible risks** | Logging overhead; incomplete token counts from streaming if added later. |
| **AustriaPath connection** | `ai_credits` table; authenticated proxy logging; `UserManagementScreen` credit controls. |
| **Timing** | **Before launch** (with R-03) |

---

## 11. Frontend & UX (Non-Feature)

These are operational or quality fixes — **not new features** — but require approval before any code change.

### R-20 — Persist onboarding completion

| | |
|---|---|
| **Why needed** | `App.jsx` initializes `showOnboarding` to `true` on every reload. Onboarding repeats each visit. |
| **Benefits** | Better returning-user UX; standard onboarding pattern. |
| **Possible risks** | Users cannot easily re-view onboarding; need "show intro again" in settings if desired later. |
| **AustriaPath connection** | `App.jsx` `showOnboarding` state; `OnboardingScreen.jsx`. Could use `localStorage` flag or user profile field post-backend. |
| **Timing** | **After launch** |

---

### R-21 — Admin preview impersonation (`isAdminPreview`)

| | |
|---|---|
| **Why needed** | `App.jsx` reads `isAdminPreview` and shows banner but no UI sets the flag. Incomplete admin support tool. |
| **Benefits** | Admins can debug student experience safely. |
| **Possible risks** | Privacy violation if misused; must be server-audited; session confusion. |
| **AustriaPath connection** | `App.jsx` admin preview banner; `routeGuard.js` `isAdminPreviewAllowed()`. |
| **Timing** | **After launch** |

---

### R-30 — CMS media upload to object storage

| | |
|---|---|
| **Why needed** | Admin CMS stores `imageUrl`, `audioUrl` as strings; profile images stored as base64 in `userProfileImage` (500KB cap). Not scalable. |
| **Benefits** | Faster loads; smaller localStorage; CDN delivery. |
| **Possible risks** | Storage cost; upload security (MIME validation, size limits); migration of existing base64 images. |
| **AustriaPath connection** | `AdminScreen.jsx`, `AccountSettingsScreen.jsx` image handler. Database Schema `profile_image_url`. |
| **Timing** | **After launch** |

---

## 12. Approval Gate

### 12.1 Recommended Launch Sequence (Analysis Only)

```
Phase A — Legal & compliance sign-off (R-06, R-09, R-14, R-26)
Phase B — Backend foundation (R-01, R-02, R-12, R-13)
Phase C — Security hardening (R-03, R-05, R-08, R-23, R-24, R-11)
Phase D — Payments if premium marketed (R-04, R-04b)
Phase E — GDPR operations (R-07)
Phase F — Content manual review (R-15, R-22 minimum scope)
Phase G — Controlled public beta
Phase H — Post-launch governance (R-16, R-17, R-18, R-27, R-28, R-29)
```

### 12.2 What Can Launch Without (Controlled Beta Only)

If launch is explicitly **invite-only beta** with:

- Admin-granted subscriptions only (no public Stripe)
- Forced password reset after backend migration
- Legal placeholders replaced
- OpenAI proxy authenticated

Then **R-04 Stripe** could defer briefly — but **R-01, R-02, R-03, R-06, R-07** remain blocking for any public URL.

### 12.3 Explicit Non-Actions (This Phase)

The following were **not** done and require separate approval:

- No code changes to any `.js`, `.jsx`, `.ts` file
- No database migrations or Supabase setup
- No modification to exam models, prompts, or AI logic
- No new UI features or screens
- No deployment configuration changes

### 12.4 Document Index

| Document | Role |
|----------|------|
| `AustriaPath_Technical_Specification.md` | Architecture and API target state |
| `AustriaPath_Database_Schema.md` | Database blueprint |
| `AustriaPath_Exam_Content_Quality_and_Examiner_Council.md` | Content governance |
| `Backend Security Requirements.md` | Security gaps |
| `GDPR-Readiness-Review.md` | Privacy inventory |
| `Launch-Checklist.md` | Pre-launch sign-off |
| **This document** | Prioritized recommendations and approval gate |

---

**Next step:** Review this document and approve specific recommendation IDs before any implementation work begins.

**Document owner:** AustriaPath Engineering  
**Approval required from:** Product, Legal, Security (see Launch-Checklist.md sign-off table)
