# AustriaPath Technical Specification

**Document version:** 1.0  
**Last updated:** 4 July 2026  
**Status:** Master engineering specification for backend implementation  
**Audience:** Backend developers, DevOps, security reviewers  

This document describes the AustriaPath system as implemented in the current React/Vite SPA and defines the target production architecture a backend team must build. It is derived from the live codebase (`src/`, `api/`, configuration, and compliance documents) and must be treated as the single source of truth for server-side implementation.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Design](#2-database-design)
3. [Backend API Specification](#3-backend-api-specification)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [AI Architecture](#5-ai-architecture)
6. [Data Storage Policy](#6-data-storage-policy)
7. [Subscription & Payment Flow](#7-subscription--payment-flow)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Master Development Roadmap](#10-master-development-roadmap)

---

## 1. System Architecture

### 1.1 Overview

AustriaPath is a German-language learning platform for ÖIF exam preparation. The current production candidate is a **single-page application (SPA)** with **client-side persistence** (`localStorage`) and one **Vercel serverless function** for OpenAI proxying. A full **backend API + PostgreSQL database** is required before public launch.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser (React SPA)                              │
│  App.jsx tab router · Screens · ExaminerMind (client) · localStorage    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CDN / Hosting (Vercel or equivalent)                  │
│  Static assets · Security headers (vercel.json) · /api/ai/openai        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  Backend    │      │  PostgreSQL │      │   OpenAI    │
   │  API        │◄────►│  Database   │      │   API       │
   │  (target)   │      │  (target)   │      │  gpt-4.1-   │
   └─────────────┘      └─────────────┘      │  mini       │
          │                                    └─────────────┘
          ▼
   ┌─────────────┐
   │   Stripe    │
   │  (target)   │
   └─────────────┘
```

### 1.2 Technology Stack (Current)

| Layer | Technology | Location |
|-------|------------|----------|
| Frontend | React 18, Vite 6, Tailwind CSS 4 | `src/` |
| Routing | Tab state in `App.jsx` (no react-router) | `src/app/App.jsx` |
| AI evaluation (rules) | ExaminerMind JavaScript modules | `src/ai/examinerMind/` |
| AI completion (LLM) | OpenAI via proxy | `api/ai/openai.js` |
| Persistence (interim) | `localStorage` | Browser |
| Serverless | Vercel function | `api/ai/openai.js` |
| Hosting headers | CSP, X-Frame-Options, etc. | `vercel.json`, `vite.config.ts` |

### 1.3 Frontend Responsibilities

The SPA owns all user-facing UI and client-side orchestration:

| Responsibility | Implementation |
|----------------|----------------|
| Navigation & screens | `App.jsx` — 30+ routable tabs, bottom nav (Home, Üben, Akademie, Datenbank, Profil) |
| Onboarding & legal consent | `OnboardingScreen`, `LegalConsentScreen`, `LegalPageScreen` |
| Authentication UI | `AuthWelcomeScreen`, `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen` |
| Session bootstrap | `validateSessionOnStartup()` in `userAccess.js` on app load |
| Training modules | Lesen, Hören, Schreiben, Speaking, Bildbeschreibung, Planning, Practice |
| Premium flows | `SubscriptionScreen`, `PlacementTestScreen`, `WeeklyPlanSetupScreen`, `PremiumExamSessionScreen` |
| Profile & settings | `ProfileScreen`, `AccountSettingsScreen` |
| Admin UI (gated) | `AdminScreen`, `UserManagementScreen`, `ExaminerLabScreen`, `AIPrueferScreen` |
| ExaminerMind invocation | Calls `runExaminerMind()` and `runModelRouter()` from exam screens |
| Client security | `src/security/*` — route guards, session integrity, sanitized OpenAI client |
| Legal pages | `src/legal/*` — Impressum, Datenschutz, AGB, Kontakt, Cookies, AI Disclaimer |

**Frontend must not be trusted for:** authorization, billing, credit deduction, password storage, or admin actions.

### 1.4 Backend Responsibilities (Target)

The backend replaces `localStorage` as the system of record:

| Domain | Backend owns |
|--------|--------------|
| Authentication | Password hashing (Argon2id/bcrypt), sessions/JWT, email verification, password reset |
| Users | CRUD, block/unblock, level and allowed-levels management |
| Subscriptions | Plan activation, expiration, remaining exams, Stripe webhooks |
| AI credits | Balance, atomic deduction, usage logging |
| AI proxy | Authenticated `/ai/completions`, rate limits, no raw OpenAI exposure |
| Reports | Persist AI progress reports only (not full sessions) |
| Content CMS | Admin training content (`austriaPathAdminData` equivalent) |
| Examiner Lab | Manually selected samples, human benchmark scores |
| AI-Prüfer library | Examiner rule models (`austriaPathAiPrueferLibrary` equivalent) |
| Legal consent | Store `{ acceptedAt, privacyVersion, termsVersion }` per user |
| GDPR | Account deletion, data export |
| Audit log | Append-only admin and security events |

### 1.5 AI Responsibilities

AI in AustriaPath is split into two layers:

**Layer A — ExaminerMind (client-side rules engine)**  
Runs locally in the browser. No external API call. Six rule-based judges evaluate student answers against level/skill knowledge files. Produces structured scores, confidence, warnings, and conflicts.

**Layer B — OpenAI LLM (server proxy)**  
Used only for engines routed through `modelRouter`: `reflectionEngine`, `reportBuilder`, `followUpQuestionBuilder`, `feedbackBuilder`. Also used directly by `IntelligentExamScreen` for conversational ÖIF simulation via `requestOpenAIProxy()`.

Model: `gpt-4.1-mini`, temperature `0.3`, system prompt: *"Du bist ein offizieller ÖIF-Prüfer. Antworte ausschließlich auf Deutsch."*

### 1.6 Examiner Mind Responsibilities

ExaminerMind (`src/ai/examinerMind/`) is AustriaPath's proprietary evaluation pipeline:

| Component | Version | Role |
|-----------|---------|------|
| `Brain` | 1.1 | Coordinator — loads exam structure, knowledge, student profile; invokes council and decision engine |
| `ExaminerCouncil` | 2.0 | Runs six judges, collects reports |
| `DecisionEngine` | 1.4 | Weighted scoring, level mapping, confidence, warnings, conflicts, error logging |
| `AuditEngine` | 1.1 | Deep review when mode is `DEEP` or `needsDeepReview` |
| `StudentProfileEngine` | 1.1 | Aggregates strengths, weaknesses, focus areas, exam history (max 20) |
| `errorLearningEngine` | — | Logs low-confidence cases to Examiner Lab |
| `modelRouter` | — | Routes engines to `rule` or `openai` providers; enforces AI credits |
| Knowledge files | — | Per-level (A2/B1/B2) × skill (writing, reading, listening, speaking, grammar) |
| `examStructure.js` | — | ÖIF section definitions per level |

ExaminerMind does **not** replace backend storage. Its outputs feed into report objects that the backend must persist according to the data storage policy (Section 6).

### 1.7 Application Bootstrap Sequence

Current flow in `App.jsx`:

```
1. legalView overlay (if viewing a legal page)
2. OnboardingScreen (first visit — not persisted across reloads in current code)
3. LegalConsentScreen (if needsLegalConsent() — persisted in austriaPathLegalConsent)
4. Auth flow (if !isLoggedIn)
5. Main app with tab navigation
```

Admin users land on tab `admin` after login; students land on `home`.

---

## 2. Database Design

### 2.1 Design Principles

- PostgreSQL as primary datastore
- UUID primary keys for all entities exposed externally
- Soft-delete optional for users; hard-delete for GDPR erasure requests
- JSONB for flexible report payloads and examiner metadata
- Never store full AI conversation transcripts or every exam session
- Separate audit log table (append-only)

### 2.2 Entity Relationship Overview

```
users ─────────────┬──── sessions
                   ├──── legal_consents
                   ├──── student_profiles
                   ├──── subscriptions
                   ├──── ai_credit_ledger
                   ├──── ai_reports
                   ├──── weekly_plans
                   ├──── premium_schedules
                   └──── placement_profiles

content_items (CMS)
ai_pruefer_models
examiner_lab_samples ─── examiner_lab_reviews
admin_audit_log
payment_transactions
```

### 2.3 Entity Definitions

#### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `email` | VARCHAR(255) UNIQUE NOT NULL | Lowercased |
| `password_hash` | VARCHAR(255) NOT NULL | Argon2id or bcrypt |
| `name` | VARCHAR(255) NOT NULL | |
| `role` | ENUM('student','admin','examiner') | Default `student` |
| `status` | ENUM('approved','blocked') | Default `approved` |
| `level` | ENUM('A2','B1','B2') | Training level |
| `allowed_levels` | TEXT[] | e.g. `{A2,B1}` for B1 user |
| `level_source` | VARCHAR(50) | `self_selected`, `placement_test`, `admin_changed`, `system_admin` |
| `language` | VARCHAR(50) | Default `Deutsch` |
| `profile_image_url` | TEXT | S3/CDN URL — not base64 in DB |
| `plan` | VARCHAR(50) | Denormalized: `free`, `placement_test`, etc. |
| `email_verified` | BOOLEAN | Default false |
| `email_verification_status` | VARCHAR(20) | `pending`, `verified` |
| `ai_credits` | INTEGER | Default 5 for new students |
| `notes` | TEXT | Admin-only |
| `user_code` | VARCHAR(20) | Computed display code `AP-XXXXXX` |
| `source` | VARCHAR(50) | Registration source, default `E-Mail` |
| `last_login_at` | TIMESTAMPTZ | |
| `last_ai_usage_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

**Maps from:** `austriaPathUsers` entries in `userAccess.js`

#### `sessions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | |
| `token_hash` | VARCHAR(255) | Hashed session token |
| `expires_at` | TIMESTAMPTZ | |
| `ip_address` | INET | |
| `user_agent` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

#### `legal_consents`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | Nullable for pre-auth consent migration |
| `accepted_at` | TIMESTAMPTZ NOT NULL | |
| `privacy_version` | VARCHAR(20) NOT NULL | e.g. `2026.07` |
| `terms_version` | VARCHAR(20) NOT NULL | |
| `created_at` | TIMESTAMPTZ | |

**Maps from:** `austriaPathLegalConsent` — stores **only** timestamp and versions, no personal data beyond user linkage.

#### `student_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK UNIQUE → users | |
| `level` | VARCHAR(10) | |
| `skills` | JSONB | `{ writing, reading, listening, speaking }` |
| `strengths` | TEXT[] | |
| `weaknesses` | TEXT[] | |
| `focus_areas` | TEXT[] | |
| `repeated_mistakes` | TEXT[] | |
| `updated_at` | TIMESTAMPTZ | |

**Exam history** stored separately (not embedded — max 20 entries in client, unbounded summary in DB with retention policy):

#### `student_exam_history`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | |
| `level` | VARCHAR(10) | |
| `score` | INTEGER | |
| `confidence` | INTEGER | |
| `service` | VARCHAR(50) | Exam mode |
| `exam_type` | VARCHAR(20) | Default `OEIF` |
| `exam_level` | VARCHAR(10) | |
| `strengths` | TEXT[] | |
| `weaknesses` | TEXT[] | |
| `focus_areas` | TEXT[] | |
| `created_at` | TIMESTAMPTZ | |

Retention: keep latest 20 per user in hot storage; archive older per GDPR policy.

#### `subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | |
| `type` | VARCHAR(50) | See Section 7 |
| `status` | ENUM('inactive','active','expired','cancelled') | |
| `remaining_exams` | INTEGER | |
| `start_date` | TIMESTAMPTZ | |
| `end_date` | TIMESTAMPTZ | Null for one-time plans |
| `stripe_subscription_id` | VARCHAR(255) | |
| `stripe_customer_id` | VARCHAR(255) | |
| `purchased_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `subscription_permissions`

Denormalized from `getPermissionsByPlan()` in `subscriptionEngine.js`:

| Column | Type |
|--------|------|
| `subscription_id` | UUID FK |
| `placement_test` | BOOLEAN |
| `ai_exam` | BOOLEAN |
| `weekly_plan` | BOOLEAN |
| `reports` | BOOLEAN |
| `writing_ai` | BOOLEAN |
| `image_ai` | BOOLEAN |
| `speaking_ai` | BOOLEAN |
| `reading_ai` | BOOLEAN |
| `listening_ai` | BOOLEAN |

#### `ai_credit_ledger`

Append-only credit transactions:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `amount` | INTEGER | Positive = grant, negative = consume |
| `balance_after` | INTEGER | |
| `reason` | VARCHAR(100) | e.g. `ai_exam`, `admin_grant`, `plan_activation` |
| `reference_id` | UUID | Optional link to report or payment |
| `created_at` | TIMESTAMPTZ | |

#### `ai_reports`

**Primary persisted AI output.** Do not store raw sessions here.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `report_type` | VARCHAR(50) | `premium-exam`, `weekly_session`, `placement` |
| `title` | VARCHAR(255) | |
| `level` | VARCHAR(10) | |
| `session_type` | VARCHAR(50) | |
| `mode` | VARCHAR(50) | |
| `summary` | TEXT | |
| `strong_count` | INTEGER | |
| `middle_count` | INTEGER | |
| `weak_count` | INTEGER | |
| `strengths` | TEXT[] | |
| `weaknesses` | TEXT[] | |
| `focus_areas` | TEXT[] | |
| `decision_payload` | JSONB | Score, confidence, level from DecisionEngine |
| `examiner_mind_payload` | JSONB | Full Brain result for premium exams only |
| `package_type` | VARCHAR(50) | Premium exam metadata |
| `exam_number` | INTEGER | |
| `finished_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

**Maps from:** `austriaPathAIReports`

#### `weekly_plans`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `plan_data` | JSONB | Schedule, goals, parts |
| `session_reports` | JSONB | Array of report summaries |
| `status` | VARCHAR(20) | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `premium_schedules`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `appointments` | JSONB | Array of scheduled exam slots |
| `status` | VARCHAR(20) | `active`, `completed` |
| `created_at` | TIMESTAMPTZ | |

#### `placement_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK UNIQUE | |
| `level` | VARCHAR(10) | |
| `selected_start_level` | VARCHAR(10) | |
| `skill_scores` | JSONB | |
| `strengths` | TEXT[] | |
| `weaknesses` | TEXT[] | |
| `focus_areas` | TEXT[] | |
| `recommended_focus` | TEXT | |
| `study_plan` | JSONB | |
| `completed_at` | TIMESTAMPTZ | |

#### `content_items` (Admin CMS)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `type` | VARCHAR(50) | `schreiben`, `lesen`, `horen`, etc. |
| `level` | VARCHAR(10) | |
| `title` | VARCHAR(255) | |
| `exam_id` | VARCHAR(100) | |
| `exam_type` | VARCHAR(50) | Default `ÖIF` |
| `exam_center` | VARCHAR(255) | |
| `exam_date` | DATE | |
| `city` | VARCHAR(100) | |
| `state` | VARCHAR(100) | |
| `image_url` | TEXT | |
| `audio_url` | TEXT | |
| `content` | TEXT | |
| `solution` | TEXT | |
| `grammar` | TEXT[] | |
| `satzbau` | TEXT[] | |
| `konnektoren` | TEXT[] | |
| `words` | TEXT[] | |
| `verbs` | TEXT[] | |
| `expressions` | TEXT[] | |
| `confirmations` | INTEGER | |
| `status` | ENUM('draft','review','published','archived') | |
| `model_mode` | VARCHAR(20) | `new`, `derived` |
| `parent_model_id` | UUID FK nullable | |
| `created_by` | UUID FK → users | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Maps from:** `austriaPathAdminData`

#### `ai_pruefer_models`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `level` | VARCHAR(10) | |
| `skill` | VARCHAR(50) | e.g. `selbstvorstellung` |
| `difficulty` | VARCHAR(20) | |
| `service` | VARCHAR(50) | `placement_test`, `ai_exam`, `weekly_plan` |
| `title` | VARCHAR(255) | |
| `short_prompt` | TEXT | |
| `preparation_time` | INTEGER | Seconds |
| `estimated_time` | INTEGER | Seconds |
| `visible_to_students` | BOOLEAN | |
| `student_preview` | TEXT | |
| `mandatory_topics` | TEXT[] | |
| `keywords` | TEXT[] | |
| `examiner_questions` | JSONB | |
| `follow_up_rules` | JSONB | |
| `examiner_rules` | JSONB | |
| `report_fields` | JSONB | |
| `training_goals` | TEXT[] | |
| `weaknesses` | TEXT[] | |
| `weekly_plan_use` | VARCHAR(50) | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Maps from:** `austriaPathAiPrueferLibrary` + defaults in `src/data/aiPremiumLibrary.js`

#### `examiner_lab_samples`

Manually selected cases only — **not** auto-populated from every low-confidence evaluation.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `selected_by` | UUID FK → users | Admin who selected |
| `source_error_log_id` | BIGINT | Optional link to originating log |
| `score` | INTEGER | AI score |
| `confidence` | INTEGER | |
| `warnings` | JSONB | |
| `conflicts` | JSONB | |
| `judge_reports` | JSONB | Six judge outputs |
| `student_answer_excerpt` | TEXT | Truncated — not full session |
| `human_verdict` | ENUM('pending','correct','wrong') | |
| `human_score` | INTEGER | Nullable |
| `human_notes` | TEXT | |
| `rule_created` | BOOLEAN | Default false |
| `created_at` | TIMESTAMPTZ | |

#### `examiner_lab_reviews`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `sample_id` | UUID FK → examiner_lab_samples | |
| `reviewer_id` | UUID FK → users | |
| `verdict` | VARCHAR(20) | |
| `notes` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

#### `ai_error_log` (operational, ephemeral)

Low-confidence auto-logged entries from DecisionEngine. **Not** long-term student data. Purge after 90 days or on admin promotion to sample.

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGSERIAL PK | |
| `score` | INTEGER | |
| `confidence` | INTEGER | |
| `warnings` | JSONB | |
| `conflicts` | JSONB | |
| `reports` | JSONB | |
| `created_at` | TIMESTAMPTZ | |

Client cap: 500 entries (`errorLearningEngine.js`). Server: rotate and purge.

#### `payment_transactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `stripe_payment_intent_id` | VARCHAR(255) UNIQUE | |
| `amount_cents` | INTEGER | |
| `currency` | VARCHAR(3) | `EUR` |
| `plan_type` | VARCHAR(50) | |
| `status` | VARCHAR(30) | |
| `created_at` | TIMESTAMPTZ | |

#### `admin_audit_log`

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGSERIAL PK | |
| `actor_id` | UUID FK → users | |
| `action` | VARCHAR(100) | |
| `target_type` | VARCHAR(50) | |
| `target_id` | UUID | |
| `details` | JSONB | |
| `ip_address` | INET | |
| `created_at` | TIMESTAMPTZ | |

### 2.4 Index Suggestions

```sql
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_ai_reports_user_created ON ai_reports(user_id, created_at DESC);
CREATE INDEX idx_ai_credit_ledger_user ON ai_credit_ledger(user_id, created_at DESC);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date) WHERE status = 'active';
CREATE INDEX idx_content_items_published ON content_items(level, type, status) WHERE status = 'published';
CREATE INDEX idx_examiner_lab_samples_verdict ON examiner_lab_samples(human_verdict);
CREATE INDEX idx_admin_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_payment_transactions_stripe ON payment_transactions(stripe_payment_intent_id);
```

---

## 3. Backend API Specification

Base URL: `https://api.austriaPath.at/v1` (configure per environment)

Authentication: HttpOnly session cookie or `Authorization: Bearer <access_token>` with refresh rotation.

All responses: JSON. Errors: `{ "error": { "code": "STRING", "message": "Human-readable German message" } }`

### 3.1 Authentication APIs

#### `POST /auth/register`

Register a new student account.

**Request:**
```json
{
  "name": "Maria Müller",
  "email": "maria@example.com",
  "password": "securePassword123",
  "level": "B1"
}
```

**Validation:**
- Email unique, valid format, not equal to admin email (`VITE_ADMIN_EMAIL` / configured `ADMIN_EMAIL`)
- Password: min 8 chars, max 256
- Level: `A2` | `B1` | `B2`

**Response 201:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Maria Müller",
    "email": "maria@example.com",
    "role": "student",
    "status": "approved",
    "level": "B1",
    "allowedLevels": ["A2", "B1"],
    "aiCredits": 5,
    "emailVerified": false
  },
  "session": { "expiresAt": "ISO8601" }
}
```

**Side effects:** Create user with `ai_credits = 5`, `status = approved`, send verification email (async).

#### `POST /auth/login`

**Request:** `{ "email": "...", "password": "..." }`

**Response 200:** User object + session (password never returned).

**Errors:** `401 INVALID_CREDENTIALS`, `403 ACCOUNT_BLOCKED`

Admin login: same endpoint; server sets `role = admin` only if email matches configured admin email.

#### `POST /auth/logout`

Invalidate current session. Response `204`.

#### `POST /auth/refresh`

Rotate access token using refresh cookie. Response `200` with new expiry.

#### `POST /auth/forgot-password`

**Request:** `{ "email": "..." }`

Always return `200` (no email enumeration). Send signed reset link if account exists.

#### `POST /auth/reset-password`

**Request:** `{ "token": "...", "password": "..." }`

Response `200` on success.

#### `GET /auth/me`

Return current authenticated user with subscription summary and permissions.

**Response 200:**
```json
{
  "id": "uuid",
  "name": "...",
  "email": "...",
  "role": "student",
  "status": "approved",
  "level": "B1",
  "allowedLevels": ["A2", "B1"],
  "aiCredits": 45,
  "subscription": {
    "type": "ai_exam",
    "status": "active",
    "remainingExams": 1,
    "endDate": null
  },
  "permissions": {
    "placementTest": false,
    "aiExam": true,
    "weeklyPlan": false,
    "reports": true,
    "writingAI": true,
    "imageAI": true,
    "speakingAI": true,
    "readingAI": true,
    "listeningAI": true
  }
}
```

### 3.2 User APIs

#### `GET /users` (admin)

Query params: `search`, `status`, `plan`, `page`, `limit`

Return paginated user list with stats (total, active, premium, blocked).

#### `GET /users/:id` (admin)

Full user detail including notes, activity log, subscription.

#### `PATCH /users/:id` (admin)

Update: `name`, `email`, `language`, `level`, `allowedLevels`, `notes`, `status`

#### `DELETE /users/:id` (admin)

Hard delete or anonymize per GDPR. Cascade delete reports, sessions, subscriptions.

#### `POST /users/:id/block` (admin)

Set `status = blocked`. Invalidate all sessions.

#### `POST /users/:id/unblock` (admin)

Set `status = approved`.

#### `POST /users/:id/credits` (admin)

**Request:** `{ "amount": 50, "reason": "Support grant" }`

Atomic credit grant via ledger.

#### `POST /users/:id/subscription` (admin)

**Request:** `{ "planType": "premium_month" }`

Apply `grantPlan` logic server-side (see Section 7).

#### `GET /users/me/profile`

Student profile + student_profile aggregate.

#### `PATCH /users/me/profile`

Update name, language, profile image (upload URL flow).

#### `DELETE /users/me`

GDPR self-service account deletion. Queue 30-day erasure job.

#### `GET /users/me/export`

GDPR data export as JSON bundle.

#### `POST /users/me/legal-consent`

**Request:**
```json
{
  "privacyVersion": "2026.07",
  "termsVersion": "2026.07"
}
```

Store consent record. Replaces client-only `austriaPathLegalConsent`.

### 3.3 AI APIs

#### `POST /ai/completions`

Authenticated proxy replacing `/api/ai/openai`.

**Request:**
```json
{
  "mode": "ai_exam",
  "prompt": "string max 8000 chars",
  "studentAnswer": "string max 8000 chars",
  "context": {
    "engineName": "reportBuilder",
    "serviceType": "ai_exam",
    "level": "B1",
    "examType": "OEIF"
  },
  "messages": [
    { "role": "user", "content": "..." }
  ]
}
```

**Pre-conditions:**
- User authenticated and not blocked
- `canUseAI(user, serviceType)` passes server-side
- Rate limit not exceeded

**Processing:**
1. Validate and truncate input (mirror `secureOpenAI.js` limits)
2. Deduct credits atomically from `ai_credit_ledger`
3. Call OpenAI `gpt-4.1-mini`
4. Log token usage
5. Return sanitized result only

**Response 200:**
```json
{
  "success": true,
  "result": "German text response",
  "creditsUsed": 2,
  "creditsRemaining": 43
}
```

**Errors:**
- `402 INSUFFICIENT_CREDITS`
- `403 AI_ACCESS_DENIED`
- `429 RATE_LIMITED`
- `502 AI_UPSTREAM_ERROR`

**Must not return:** `raw` OpenAI payload (current Vercel function exposes this — remove in production).

#### `POST /ai/evaluate` (optional server-side ExaminerMind)

For future migration of rule judges to server. Not required for Phase 3 if ExaminerMind remains client-side.

**Request:** Same parameters as `runExaminerMind()`.

**Response:** Brain output JSON (Section 5.3).

#### `GET /ai/usage`

Return credit balance and recent ledger entries for authenticated user.

### 3.4 Reports APIs

#### `GET /reports`

List user's AI reports, newest first. Paginated.

#### `GET /reports/:id`

Single report detail.

#### `POST /reports`

Persist a report from client after exam completion.

**Request:** Report object (Section 5.5). Server strips any ephemeral session data before save.

**Validation:** User owns report; `report_type` allowed; size limits on JSONB payloads.

#### `DELETE /reports/:id`

User or admin delete single report.

### 3.5 Subscription APIs

#### `GET /subscription`

Current subscription, permissions, remaining exams, expiration.

#### `POST /subscription/checkout`

Create Stripe Checkout session.

**Request:**
```json
{
  "planType": "ai_exam",
  "successUrl": "https://app.austriaPath.at/profile?payment=success",
  "cancelUrl": "https://app.austriaPath.at/premium?payment=cancelled"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

#### `POST /subscription/webhook` (Stripe — server only)

Verify Stripe signature. Handle events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate plan, grant credits/exams |
| `invoice.payment_failed` | Mark subscription at risk |
| `customer.subscription.deleted` | Deactivate, set status `cancelled` |

Idempotent processing via `stripe_payment_intent_id` / event ID deduplication.

#### `POST /subscription/consume-exam`

Decrement `remaining_exams` when user starts a premium exam. Atomic.

### 3.6 Payment APIs

Payment processing delegated to Stripe. No card data touches AustriaPath servers.

#### Plan catalog (static, matches `SubscriptionScreen.jsx`)

| Plan ID | Type | Price | Exams | Validity | Credits granted |
|---------|------|-------|-------|----------|-----------------|
| `placement` | `placement` | €2.00 | 1 | None | Via admin engine: +30 on `placement_test` grant |
| `weekly-plan` | `weekly_plan` | €14.99 | 3 | 7 days | +30 (`placement_test` tier) or weekly-specific |
| `ai-exam` | `ai_exam` | €9.99 | 1 | None | +50 |
| `intensive-week` | `intensive_week` | €24.99 | 3 | 7 days | +150 |
| `premium-month` | `premium_month` | €39.99 | 5 | 30 days | +250 |

**Current client behavior:** `SubscriptionScreen.handleSelectPlan()` writes `localStorage` immediately without payment. Backend must **replace** this with checkout flow; ignore client-side premium flags.

#### `GET /payments/history`

List user's payment transactions.

### 3.7 Admin APIs

All require `role = admin` verified server-side.

#### Content CMS

| Method | Path | Action |
|--------|------|--------|
| GET | `/admin/content` | List with filters (type, level, status) |
| POST | `/admin/content` | Create content item |
| PATCH | `/admin/content/:id` | Update |
| DELETE | `/admin/content/:id` | Delete or archive |
| POST | `/admin/content/:id/publish` | Set status `published` |

#### User management

Uses User APIs in Section 3.2.

#### AI-Prüfer library

| Method | Path | Action |
|--------|------|--------|
| GET | `/admin/ai-pruefer` | List models |
| POST | `/admin/ai-pruefer` | Create |
| PATCH | `/admin/ai-pruefer/:id` | Update |
| DELETE | `/admin/ai-pruefer/:id` | Delete |

#### Audit log

| Method | Path | Action |
|--------|------|--------|
| GET | `/admin/audit-log` | Paginated admin actions |

### 3.8 Examiner Lab APIs

#### `GET /admin/examiner-lab/errors`

List operational error log (auto-captured low-confidence cases). Paginated, max retention 90 days.

#### `POST /admin/examiner-lab/samples`

**Manually select** a case for long-term storage.

**Request:**
```json
{
  "errorLogId": 12345,
  "studentAnswerExcerpt": "truncated text max 2000 chars",
  "humanNotes": "optional"
}
```

Creates `examiner_lab_samples` row. Does **not** auto-create from every error.

#### `GET /admin/examiner-lab/samples`

List selected samples with human verdict status.

#### `PATCH /admin/examiner-lab/samples/:id`

**Request:**
```json
{
  "humanVerdict": "correct",
  "humanScore": 72,
  "humanNotes": "...",
  "ruleCreated": true
}
```

Triggers examiner rule update workflow (updates `ai_pruefer_models` or knowledge files via admin tooling).

#### `POST /admin/examiner-lab/samples/:id/reviews`

Add reviewer record (supports future Examiner role).

---

## 4. User Roles & Permissions

### 4.1 Role Matrix

| Capability | Student | Premium Student | Admin | Examiner (future) |
|------------|---------|-----------------|-------|-------------------|
| Register / login | ✓ | ✓ | ✓ | ✓ |
| Free training content | ✓ | ✓ | ✓ | — |
| Placement test | ✗ | ✓ (plan) | ✓ | — |
| AI exam | ✗ | ✓ (plan) | ✓ | — |
| Weekly plan | ✗ | ✓ (plan) | ✓ | — |
| View own AI reports | ✓ | ✓ | ✓ | — |
| AI credits (default 5) | ✓ | Plan-dependent | Unlimited via admin | — |
| Account settings | ✓ | ✓ | ✓ | ✓ |
| Admin CMS | ✗ | ✗ | ✓ | ✗ |
| User management | ✗ | ✗ | ✓ | ✗ |
| AI-Prüfer library | ✗ | ✗ | ✓ | ✗ |
| Examiner Lab — view errors | ✗ | ✗ | ✓ | ✓ |
| Examiner Lab — review samples | ✗ | ✗ | ✓ | ✓ |
| Examiner Lab — create rules | ✗ | ✗ | ✓ | ✗ |
| Block/delete users | ✗ | ✗ | ✓ | ✗ |
| Grant credits/subscriptions | ✗ | ✗ | ✓ | ✗ |

**Premium Student** is not a separate `role` — it is a `student` with an active subscription and expanded `permissions`.

### 4.2 Admin Determination

Current (`authConfig.js`):
```javascript
isAdminAccount(user) =
  user.email === ADMIN_EMAIL &&
  user.role === "admin" &&
  user.status === "approved"
```

Backend must enforce the same triple condition server-side. Admin email configured via environment variable, not client bundle.

**Admin CMS second gate:** `AdminScreen` currently re-validates admin password from user record before CMS unlock. Backend should replace with re-authentication endpoint: `POST /admin/verify` with password step-up for sensitive operations.

### 4.3 Account Status

| Status | Effect |
|--------|--------|
| `approved` | Full access per plan |
| `blocked` | Login rejected; existing sessions invalidated |

Registration creates `approved` immediately (no admin approval workflow).

### 4.4 Level Access

| User level | Default allowedLevels |
|------------|----------------------|
| A2 | `["A2"]` |
| B1 | `["A2", "B1"]` |
| B2 | `["A2", "B1", "B2"]` |

Admin can override via `updateUserAllowedLevels()`.

### 4.5 AI Credit Costs

From `accessControl.js`:

| Service | Credits consumed |
|---------|-----------------|
| `placement_test` | 1 |
| `weekly_plan` | 1 |
| `ai_exam` | 2 |
| `intensive_week_session` | 2 |
| `premium_month_session` | 2 |
| `report_builder` | 1 |
| `follow_up_question` | 1 |

Rule-based services (`placement_test`, `weekly_plan` via `FREE_RULE_SERVICES`) bypass OpenAI but may still log usage.

### 4.6 Future Examiner Role

Optional role for accredited human reviewers:

- `role = examiner`
- Access: Examiner Lab read + sample review endpoints only
- No CMS, no user management, no credit grants
- Useful when scaling human benchmark review without full admin access

Not implemented in current SPA. Add when Examiner Lab review workflow is built out (Correct/Wrong/New Rule buttons in `ExaminerLabScreen.jsx` are UI-only today).

### 4.7 Frontend Route Guards

Admin-only tabs (`routeGuard.js`): `admin`, `userManagement`, `examinerLab`, `aiPruefer`

Backend must mirror these boundaries on all `/admin/*` routes.

---

## 5. AI Architecture

### 5.1 Exam Modes

From `examModes.js`:

| Mode | Constant | Usage |
|------|----------|-------|
| Fast | `FAST` | Quick evaluation |
| Normal | `NORMAL` | Default |
| Deep | `DEEP` | Triggers AuditEngine |
| Learning | `LEARNING` | Sets `learningScheduled` flag |
| Placement | `PLACEMENT` | Placement test |
| AI Exam | `AI_EXAM` | Premium exam sessions |
| Weekly Plan | `WEEKLY_PLAN` | Weekly training |
| Premium Month | `PREMIUM_MONTH` | Subscription context |
| Intensive Week | `INTENSIVE_WEEK` | Subscription context |

### 5.2 AI Session Lifecycle

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ User starts  │────►│ Session buffers │────►│ Per-step eval    │
│ exam/session │     │ (temporary)     │     │ runExaminerMind  │
└──────────────┘     └─────────────────┘     └────────┬─────────┘
                                                       │
                       ┌───────────────────────────────┘
                       ▼
              ┌─────────────────┐     ┌──────────────────┐
              │ DecisionEngine  │────►│ Low confidence?  │
              │ final decision  │     │ → error log      │
              └────────┬────────┘     └──────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
  ┌────────────┐ ┌───────────┐ ┌─────────────┐
  │ Update     │ │ runModel  │ │ Build report│
  │ student    │ │ Router    │ │ object      │
  │ profile    │ │ (OpenAI)  │ │             │
  └────────────┘ └───────────┘ └──────┬──────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ Persist report│
                              │ ONLY (not     │
                              │ full session) │
                              └───────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ Clear temp    │
                              │ session keys  │
                              └───────────────┘
```

**Temporary keys (must be cleared on finish/logout):**
- `austriaPathCurrentSessionAnswers`
- `austriaPathCurrentAISession`
- `austriaPathAiSession`
- `austriaPathPremiumExamPackage` (active exam state)
- `austriaPathAIExamTimerStart`

### 5.3 JSON Contracts

#### `runExaminerMind` Input

```json
{
  "answerText": "string",
  "taskAnswered": true,
  "level": "B1",
  "examType": "OEIF",
  "sectionIndex": 0,
  "currentSection": {
    "title": "Selbstvorstellung",
    "skill": "speaking"
  },
  "mode": "ai_exam",
  "saveToProfile": true
}
```

#### Brain Output

```json
{
  "success": true,
  "brainVersion": "1.1",
  "mode": "ai_exam",
  "structure": { },
  "currentSection": { },
  "knowledge": { },
  "studentProfile": { },
  "decision": { }
}
```

#### Decision Engine Output

```json
{
  "level": "B1",
  "score": 74,
  "rawScore": 72.5,
  "confidence": 68,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "focusAreas": ["string"],
  "warnings": ["string"],
  "conflicts": [
    { "type": "score_divergence", "details": "..." }
  ],
  "reflection": "string",
  "reports": [ ],
  "evidence": [
    {
      "examiner": "taskCompletion",
      "score": 80,
      "evidence": "string",
      "reasoning": ["string"]
    }
  ],
  "criticalRulesApplied": ["string"],
  "needsDeepReview": false,
  "decidedBy": "AustriaPath Decision Engine",
  "version": "1.4",
  "timestamp": "ISO8601"
}
```

#### Judge Report (each of six judges)

```json
{
  "examiner": "taskCompletion",
  "score": 80,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "focusAreas": ["string"],
  "evidence": "string or null",
  "reasoning": ["string"]
}
```

Judges: `taskCompletion`, `grammar`, `vocabulary`, `basicStructure`, `communication`, `reasoning`

Judge weights in DecisionEngine:
- `taskCompletion`: 1.5
- `reasoning`: 1.25
- `communication`: 1.2
- `vocabulary`: 1.1
- `basicStructure`: 1.1
- `grammar`: 1.1
- `answerLength`: 0.7

#### Level Mapping

| Score | Level label |
|-------|-------------|
| ≥ 85 | `B1+` |
| ≥ 70 | `B1` |
| ≥ 55 | `A2+` |
| < 55 | `A2` |

#### `runModelRouter` Input

```json
{
  "engineName": "reportBuilder",
  "mode": "ai_exam",
  "prompt": "Bewerte diese Premium-Prüfung...",
  "studentAnswer": "JSON stringified answers",
  "context": {
    "serviceType": "ai_exam",
    "level": "B1",
    "examType": "OEIF",
    "engineName": "reportBuilder",
    "model": "gpt-4.1-mini",
    "userId": "user-id"
  }
}
```

#### OpenAI Proxy Request (client → server)

Mirrors `secureOpenAI.js`:
```json
{
  "mode": "string max 64",
  "prompt": "max 8000 chars",
  "studentAnswer": "max 8000 chars",
  "context": { },
  "messages": [ { "role": "user|assistant", "content": "max 8000" } ]
}
```
Max 30 messages in array.

### 5.4 Confidence Scoring

`DecisionEngine.calculateConfidence()` starts at **84** and applies penalties:

| Condition | Penalty |
|-----------|---------|
| Each judge report with score < 50 | −12 per report |
| Score spread across judges > 35 | −15 |
| Final score between 55 and 72 (borderline) | −10 |
| Each conflict detected | −10 per conflict |
| Critical rules applied | Additional reduction |

**Thresholds:**
- `confidence < 65` → triggers `saveAIError()`, sets `needsDeepReview = true`
- Any warnings or conflicts → also logged to error log

### 5.5 AI Report Generation

#### Premium Exam Report (`PremiumExamSessionScreen`)

Built after all parts complete:

```json
{
  "title": "AI Probeprüfung · B1",
  "date": "4.7.2026",
  "summary": "German narrative summary from buildExamSummary()",
  "strongCount": 2,
  "middleCount": 1,
  "weakCount": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "focusAreas": ["string"],
  "type": "premium-exam",
  "level": "B1",
  "packageType": "ai_exam",
  "examNumber": 1,
  "total": 1,
  "examinerMind": { }
}
```

Persisted to `austriaPathAIReports` (target: `POST /reports`).

#### Weekly Session Report (`AISessionScreen`)

```json
{
  "title": "KI-Wochentraining",
  "sessionType": "weekly_plan",
  "mode": "weekly_plan",
  "level": "B1",
  "date": "4.7.2026",
  "finishedAt": "ISO8601",
  "partsCount": 3,
  "strongCount": 1,
  "middleCount": 1,
  "weakCount": 1,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "focusAreas": ["string"],
  "results": [ ],
  "summary": "string",
  "nextRecommendation": "string"
}
```

Also appends to `austriaPathWeeklyPlan.sessionReports` when weekly plan exists.

### 5.6 Error Handling

| Layer | Behavior |
|-------|----------|
| Judge failure | ExaminerCouncil catches exception; returns score 0 report with `"Judge execution failed"` |
| OpenAI proxy failure | `secureOpenAI.js` throws; screens should catch and show user message |
| Insufficient credits | `modelRouter` returns `{ success: false, errorCode: "AI_CREDITS_OR_ACCESS_DENIED" }` |
| Blocked user | `canUseAI` returns false |
| Low confidence | Auto-log to error log; optional deep audit via AuditEngine |
| Network timeout | Backend should return `502` with retry guidance; client keeps temp session until explicit discard |

**Production requirement:** Circuit breaker on OpenAI upstream; never charge credits if upstream fails.

### 5.7 Examiner Learning Flow

```
DecisionEngine detects low confidence / warnings / conflicts
        │
        ▼
saveAIError() → austriaPathAIErrorLog (max 500 client / 90-day server)
        │
        ▼
Admin views in ExaminerLabScreen
        │
        ▼
Admin MANUALLY selects case → examiner_lab_samples
        │
        ▼
Human review: Correct / Wrong / New Rule (UI exists, logic TBD)
        │
        ▼
Update ai_pruefer_models or knowledge files
        │
        ▼
Future evaluations use improved rules (rule provider in modelRouter)
```

**Critical constraint:** Error log auto-capture ≠ long-term storage. Only admin-selected samples persist indefinitely for rule improvement.

### 5.8 Model Router Engine Map

| Engine | Provider |
|--------|----------|
| `grammarJudge` | rule |
| `vocabularyJudge` | rule |
| `communicationJudge` | rule |
| `structureJudge` | rule |
| `reasoningJudge` | rule |
| `taskJudge` | rule |
| `reflectionEngine` | openai |
| `reportBuilder` | openai |
| `followUpQuestionBuilder` | openai |
| `feedbackBuilder` | openai |

`FREE_RULE_SERVICES`: `placement_test`, `weekly_plan` — always rule provider regardless of engine.

---

## 6. Data Storage Policy

This section is binding for backend implementation and aligns with `AI-Privacy-Policy.md` and `GDPR-Readiness-Review.md`.

### 6.1 Store

| Data | Storage location | Retention |
|------|------------------|-----------|
| User account & profile | `users` table | Until deletion + 30 days |
| Legal consent (timestamp + version only) | `legal_consents` | 3 years after account closure |
| AI progress reports | `ai_reports` | Until user deletion |
| Student profile aggregates | `student_profiles`, `student_exam_history` | Until user deletion |
| Weekly plans & placement results | `weekly_plans`, `placement_profiles` | Until user deletion |
| Subscription state | `subscriptions` | Until user deletion + legal invoice retention |
| Admin CMS content | `content_items` | Indefinite (non-PII) |
| AI-Prüfer models | `ai_pruefer_models` | Indefinite (non-PII) |
| Examiner Lab selected samples | `examiner_lab_samples` | Until admin deletes or 24 months |
| Payment records | `payment_transactions` | Legal minimum (7 years AT tax) |

### 6.2 Do Not Store

| Data | Rationale |
|------|-----------|
| Full AI conversation transcripts | Privacy minimization |
| Every exam session attempt | Only resulting reports |
| Raw OpenAI request/response in production logs | Security |
| Passwords in plaintext | Security — hash only |
| OpenAI API keys in client | Security — server only |
| Automatic bulk export of all prompts | Not collected |
| Voice recordings | Not implemented; if added, require explicit consent + short retention |

### 6.3 Temporary (Session) Data

Held in memory or short-lived cache only:

- Active exam answers before report generation
- `austriaPathPremiumExamPackage` during exam
- AI timer start timestamps
- Current session configuration objects

**Purge policy:** Delete within 24 hours of session completion or on logout.

### 6.4 OpenAI Data Handling

- Route all LLM calls through authenticated backend proxy
- Configure OpenAI zero-retention where available
- Send minimum text required for evaluation
- Do not include passwords, payment data, or full profile in prompts

---

## 7. Subscription & Payment Flow

### 7.1 Current Client Flow (Interim — Not Production-Safe)

`SubscriptionScreen.handleSelectPlan()` on button click:

1. Creates subscription object:
   ```json
   {
     "id": "plan-id",
     "name": "Plan name",
     "price": "9,99 €",
     "type": "ai_exam",
     "status": "active",
     "purchasedAt": "ISO8601",
     "validUntil": "ISO8601 or null",
     "totalUses": 1,
     "remainingUses": 1
   }
   ```
2. Writes `austriaPathSubscription`, `userPlan`, `premiumActive=true`
3. Redirects by plan type:
   - `placement` → `placementTest`
   - `weekly_plan` → `weeklyPlanSetup`
   - `ai_exam`, `intensive_week`, `premium_month` → `profile`

**No payment processor involved.** Backend must replace this entirely.

### 7.2 Target Production Flow

```
User selects plan on SubscriptionScreen
        │
        ▼
POST /subscription/checkout → Stripe Checkout URL
        │
        ▼
User completes payment on Stripe
        │
        ▼
Stripe webhook → POST /subscription/webhook
        │
        ▼
Server validates signature, idempotency check
        │
        ▼
grantPlan(user, planType) server-side:
  - Set subscription status active
  - Set remaining_exams per plan
  - Grant ai_credits per creditMap
  - Set permissions via getPermissionsByPlan()
  - Set end_date for timed plans
  - Write ai_credit_ledger + payment_transactions
  - Write admin_audit_log
        │
        ▼
Redirect to success URL → frontend refreshes GET /auth/me
        │
        ▼
User accesses premium feature (placement, weekly plan, AI exam)
```

### 7.3 Plan Activation Details

From `subscriptionEngine.js` — `grantPlan()`:

| Plan type | Status | remainingExams | Credits added | endDate |
|-----------|--------|----------------|---------------|---------|
| `free` | inactive | 0 | 0 | null |
| `placement_test` | active | 1 | +30 | null |
| `ai_exam` | active | 1 | +50 | null |
| `intensive_week` | active | 3 | +150 | now + 7 days |
| `premium_month` | active | 5 | +250 | now + 30 days |

### 7.4 Permissions by Plan

From `getPermissionsByPlan()`:

| Permission | free | placement_test | ai_exam | intensive_week / premium_month |
|------------|------|----------------|---------|-------------------------------|
| placementTest | ✗ | ✓ | ✗ | ✓ |
| aiExam | ✗ | ✗ | ✓ | ✓ |
| weeklyPlan | ✗ | ✗ | ✗ | ✓ |
| reports | ✗ | ✓ | ✓ | ✓ |
| writingAI | ✗ | ✗ | ✓ | ✓ |
| imageAI | ✗ | ✗ | ✓ | ✓ |
| speakingAI | ✗ | ✗ | ✓ | ✓ |
| readingAI | ✗ | ✗ | ✓ | ✓ |
| listeningAI | ✗ | ✗ | ✓ | ✓ |

### 7.5 Expiration Handling

Backend cron job (daily):

1. Query `subscriptions` where `status = active` AND `end_date < now()`
2. Set `status = expired`
3. Revert permissions to free tier (or grace period if configured)
4. Notify user via email
5. Do not delete historical reports

Timed plans: `intensive_week` (7 days), `premium_month` (30 days), client `weekly_plan` (7 days via `validDays`).

### 7.6 Exam Consumption

When user starts premium exam:

1. `POST /subscription/consume-exam` — decrement `remaining_exams` atomically
2. Reject if `remaining_exams = 0` or subscription expired
3. Build exam package via `premiumExamBuilder.js` logic (server-side equivalent)
4. On completion, persist report only

### 7.7 Admin Override

`UserManagementScreen` can grant plans without payment via admin API. Must write audit log entry and ledger records for traceability.

### 7.8 Refunds

Manual process via Stripe dashboard initially. Webhook `charge.refunded` should deactivate subscription and optionally claw back unused credits.

---

## 8. Security Architecture

### 8.1 Frontend Protections (Implemented)

| Module | Protection |
|--------|------------|
| `routeGuard.js` | Admin-only tabs blocked in UI for non-admins |
| `sessionIntegrity.js` | Fingerprint `email\|id\|role\|status` → base64 in `austriaPathSessionIntegrity`; mismatch invalidates session |
| `secureStorage.js` | JSON read/write with 5MB cap per key |
| `sanitize.js` | Email validation, HTML escape, plain text sanitization |
| `secureOpenAI.js` | No API keys in browser; input truncation; POST to `/api/ai/openai` only |
| `initSecurity.js` | Startup env warnings; strips `isAdminPreview` for non-admins |
| `envValidation.js` | Warns if `VITE_ADMIN_INITIAL_PASSWORD` set in production build |
| `userAccess.js` | Password stripped from session objects; blocked user rejection |
| `vercel.json` / `vite.config.ts` | CSP, X-Frame-Options, nosniff, Permissions-Policy |
| Production build | Drops `console` and `debugger` via esbuild |

### 8.2 Frontend Limitations (Explicit)

The SPA **cannot** prevent:
- `localStorage` tampering (role, credits, premium flags)
- Direct API calls if proxy remains unauthenticated
- Admin password extraction from stored user records
- Client-side credit bypass

### 8.3 Backend Protections (Required)

From `Backend Security Requirements.md`:

| Area | Requirement |
|------|-------------|
| Authentication | Argon2id/bcrypt, HttpOnly cookies or JWT rotation |
| Authorization | Server-side role checks on every admin route |
| OpenAI proxy | Auth + credit check + rate limit; no raw response |
| Rate limiting | Login 5–10/min/IP; AI per-user quota; admin stricter |
| WAF | OWASP CRS or managed WAF at CDN |
| Database | PostgreSQL, parameterized queries, encryption at rest |
| Secrets | Vault/env only; no `VITE_*` for secrets |
| Audit log | Append-only admin and security events |
| Payment | Stripe webhooks with signature verification |
| GDPR | Deletion and export APIs |
| Headers | HSTS in addition to current CSP set |
| Logging | No passwords, tokens, or full prompts in logs |

### 8.4 Admin Email Configuration

```
VITE_ADMIN_EMAIL — client-visible, defaults to fadisobehau@gmail.com
ADMIN_EMAIL — server-only equivalent for backend
VITE_ADMIN_INITIAL_PASSWORD — MUST be removed before production; replace with one-time server seed script
```

### 8.5 Content Security Policy (Production)

Current `vercel.json`:
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
media-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none'
```

Add `Strict-Transport-Security` at CDN for production domain.

---

## 9. Deployment Architecture

### 9.1 Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Development | Local Vite dev server | Local PostgreSQL or mock |
| Staging | Pre-production verification | Anonymized copy |
| Production | Public users | Live PostgreSQL |

### 9.2 Environment Variables

#### Frontend (Vite — public bundle)

| Variable | Purpose | Production |
|----------|---------|------------|
| `VITE_ADMIN_EMAIL` | Admin email display/validation | Set to production admin email |
| `VITE_API_BASE_URL` | Backend API base (add when backend live) | `https://api.austriaPath.at/v1` |
| `VITE_ADMIN_INITIAL_PASSWORD` | Admin seed | **Remove — do not set** |

#### Backend (server only)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API access |
| `ADMIN_EMAIL` | Server admin email |
| `JWT_SECRET` / `SESSION_SECRET` | Token signing |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `EMAIL_API_KEY` | Transactional email (SendGrid, Postmark, etc.) |
| `S3_BUCKET` / storage credentials | Profile images, CMS media |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Frontend origin whitelist |

Current `.env.example` documents only `VITE_ADMIN_EMAIL` and `VITE_ADMIN_INITIAL_PASSWORD`.

### 9.3 Production Configuration

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output | `dist/` static SPA |
| Node function | `api/ai/openai.js` (migrate to full backend) |
| Source maps | Disabled (`vite.config.ts`) |
| Console output | Stripped in production build |

Hosting: Vercel (current) or equivalent with CDN, HTTPS, and security headers.

### 9.4 Logging

| Log type | Destination | Retention |
|----------|-------------|-----------|
| Application errors | Sentry | 90 days |
| Access logs | CDN/hosting | 90 days |
| Admin audit | PostgreSQL `admin_audit_log` | 3 years |
| AI usage | PostgreSQL + metrics | 1 year |
| Payment events | Stripe dashboard + DB | 7 years |

Never log: passwords, session tokens, full OpenAI prompts/responses, card data.

### 9.5 Monitoring

| Metric | Alert threshold |
|--------|-----------------|
| Uptime | < 99.9% |
| API 5xx rate | > 1% over 5 min |
| Login failure burst | > 50/min |
| OpenAI cost | Daily anomaly > 2× baseline |
| AI proxy latency p95 | > 10s |

Tools: UptimeRobot or Better Stack, Sentry, Stripe dashboard, hosting metrics.

### 9.6 Backup

| Asset | Frequency | Retention | Encryption |
|-------|-----------|-----------|------------|
| PostgreSQL | Daily automated | 30 days rolling | AES-256 at rest |
| CMS media (S3) | Versioned bucket | Indefinite | Provider default |
| Stripe data | Stripe-managed | Stripe policy | Stripe |

### 9.7 Recovery

| Target | Objective |
|--------|-----------|
| RTO (Recovery Time Objective) | 4 hours |
| RPO (Recovery Point Objective) | 24 hours |

Quarterly restore test from backup to staging. Document runbook for: database failure, OpenAI outage (degrade to rule-only mode), Stripe webhook replay.

---

## 10. Master Development Roadmap

Work is organized into phases. Phases 1–2 and Phase 4 (legal) are largely complete in the frontend. Phase 3 (backend) is the critical path to launch.

### Phase 1 — Frontend Auth & Admin UI ✓ Complete

- Secure admin login flow (`authConfig.js`, `userAccess.js`)
- Session hardening (`sessionIntegrity.js`)
- Clean auth UI (Login, Register, Welcome)
- Admin screens: CMS, User Management, AI-Prüfer, Examiner Lab
- Admin route guards (`routeGuard.js`)

### Phase 2 — Frontend Security Hardening ✓ Complete

- `src/security/*` module
- OpenAI client proxy routing (`secureOpenAI.js`)
- Production headers (`vercel.json`)
- `Backend Security Requirements.md` documented

### Phase 3 — Backend Foundation (Critical Path)

**Goal:** Replace `localStorage` as system of record.

| Task | Priority |
|------|----------|
| PostgreSQL schema migration (Section 2) | P0 |
| Auth API: register, login, logout, refresh, me | P0 |
| Password hashing, session management | P0 |
| User CRUD admin APIs | P0 |
| Migrate frontend auth to API calls | P0 |
| Remove plaintext passwords from client | P0 |
| Remove `VITE_ADMIN_INITIAL_PASSWORD` from production | P0 |
| Legal consent API | P1 |
| Profile and settings API | P1 |

**Exit criteria:** Users can register, login, and persist data server-side. Client localStorage used only as cache.

### Phase 4 — Legal & Compliance ✓ Complete (Frontend)

- Legal pages (Impressum, Datenschutz, AGB, Kontakt, Cookies, AI Disclaimer)
- First-launch consent flow
- GDPR-Readiness-Review.md
- AI-Privacy-Policy.md
- AI-Transparency.md
- Launch-Checklist.md

**Remaining:** Fill Impressum placeholders; legal counsel review; backend consent storage migration.

### Phase 5 — AI & Reports Backend

| Task | Priority |
|------|----------|
| Authenticated `/ai/completions` with credit deduction | P0 |
| Remove raw OpenAI from responses | P0 |
| Rate limiting and usage logging | P0 |
| Reports API (CRUD) | P1 |
| Student profile API | P1 |
| Temporary session purge job | P1 |
| Examiner Lab sample APIs | P2 |
| Examiner Lab review workflow (Correct/Wrong/New Rule) | P2 |

**Exit criteria:** AI calls authenticated; credits enforced server-side; reports persisted in DB.

### Phase 6 — Subscription & Payments

| Task | Priority |
|------|----------|
| Stripe Checkout integration | P0 |
| Webhook handler with idempotency | P0 |
| Server-side `grantPlan()` equivalent | P0 |
| Subscription expiration cron | P1 |
| Exam consumption API | P1 |
| Payment history API | P2 |
| Replace client `SubscriptionScreen` localStorage activation | P0 |

**Exit criteria:** Real payments activate plans; client premium flags ignored.

### Phase 7 — Content & Admin Backend

| Task | Priority |
|------|----------|
| CMS content API | P1 |
| AI-Prüfer library API | P1 |
| Admin audit log | P1 |
| Media upload (S3) for CMS and profile images | P2 |
| Migrate `austriaPathAdminData` to server | P1 |

### Phase 8 — GDPR Operations

| Task | Priority |
|------|----------|
| Account self-deletion API | P0 |
| Data export API | P0 |
| Email verification flow | P1 |
| Password reset flow | P1 |
| DPA with OpenAI and hosting | P0 |
| DPIA / TIA documentation | P1 |

### Phase 9 — Production Hardening

| Task | Priority |
|------|----------|
| WAF deployment | P0 |
| HSTS enablement | P0 |
| Sentry error tracking | P1 |
| Uptime monitoring | P1 |
| Backup automation and restore test | P0 |
| Penetration test or security review | P0 |
| Load test AI proxy | P2 |
| CI: `npm audit`, build, lint | P1 |

### Phase 10 — Launch

| Task | Priority |
|------|----------|
| Complete Launch-Checklist.md sign-offs | P0 |
| Impressum operator details finalized | P0 |
| Production domain and TLS | P0 |
| Smoke test full user journey | P0 |
| Admin operational runbook | P1 |
| Examiner role (optional) | P3 |

---

## Appendix A — Frontend Tab Reference

| Tab ID | Screen | Access |
|--------|--------|--------|
| `home` | HomeScreen | All |
| `practice` | PracticeScreen | All (level select) |
| `akademie` | AkademieScreen | All |
| `database` | DatabaseScreen | All |
| `profile` | ProfileScreen | All |
| `admin` | AdminScreen | Admin |
| `userManagement` | UserManagementScreen | Admin |
| `examinerLab` | ExaminerLabScreen | Admin |
| `aiPruefer` | AIPrueferScreen | Admin |
| `premium` | SubscriptionScreen | All |
| `placementTest` | PlacementTestScreen | Premium |
| `weeklyPlanSetup` | WeeklyPlanSetupScreen | Premium |
| `premiumExamSession` | PremiumExamSessionScreen | Premium |
| `aiSession` | AISessionScreen | Premium |
| `accountSettings` | AccountSettingsScreen | All |
| `lesen`, `horen`, `writing`, `speaking`, `images`, `planning` | Training modules | All |
| `exams` | IntelligentExamScreen | All |
| `levelSelect` | LevelSelectScreen | All |

## Appendix B — Related Documents

| Document | Purpose |
|----------|---------|
| `Backend Security Requirements.md` | Required backend security controls |
| `GDPR-Readiness-Review.md` | Data inventory and GDPR gaps |
| `AI-Privacy-Policy.md` | AI-specific data handling |
| `AI-Transparency.md` | User-facing AI disclosure |
| `Launch-Checklist.md` | Pre-launch sign-off checklist |
| `AustriaPath_Technical_Specification.md` | This document |

---

**Document owner:** AustriaPath Engineering  
**Next review:** On completion of Phase 3 backend foundation or any material architecture change
