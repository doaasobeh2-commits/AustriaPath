# AustriaPath Database Schema Specification

**Document version:** 1.0  
**Last updated:** 4 July 2026  
**Status:** Backend implementation blueprint (schema only — no backend code in this phase)  
**Database target:** PostgreSQL 15+ (Supabase-compatible)  
**Source of truth:** Current AustriaPath SPA (`src/`), `userAccess.js`, `subscriptionEngine.js`, ExaminerMind, and `AustriaPath_Technical_Specification.md`

This document defines the production database schema a backend developer can implement directly. It does not add application features, modify frontend screens, or implement a backend.

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [PostgreSQL Enums](#2-postgresql-enums)
3. [Core Tables](#3-core-tables)
4. [Relationships](#4-relationships)
5. [Privacy Rules](#5-privacy-rules)
6. [Security Rules](#6-security-rules)
7. [Migration Plan](#7-migration-plan)
8. [Supabase / PostgreSQL Recommendations](#8-supabase--postgresql-recommendations)
9. [Appendix — Supplementary Tables](#9-appendix--supplementary-tables)

---

## 1. Schema Overview

### 1.1 Design Principles

| Principle | Implementation |
|-----------|----------------|
| UUID primary keys | All core tables use `UUID` default `gen_random_uuid()` |
| Timestamps | Every table has `created_at`; mutable tables have `updated_at` |
| No full AI sessions | Exam attempts are ephemeral; only reports and exam results persist |
| No conversation logs | OpenAI prompts/responses are not stored in these tables |
| Examiner Lab samples | Long-term retention only when admin manually selects a sample |
| Append-only ledgers | `ai_credits`, `admin_activity_log`, `payments` are append-only |
| Soft delete users | `users.deleted_at` for GDPR; hard purge via `account_deletion_requests` |

### 1.2 Core Table List

| Table | Rows owned by | Purpose |
|-------|---------------|---------|
| `users` | System | Authentication, role, account status, credit balance |
| `user_profiles` | 1:1 user | Display profile, learning aggregates, preferences |
| `subscriptions` | 1:n user | Plan type, permissions, remaining exams, expiry |
| `payments` | 1:n user | Stripe payment records |
| `ai_credits` | 1:n user | Credit grant/consume ledger |
| `ai_reports` | 1:n user | Premium exam and placement AI progress reports |
| `weekly_plan_reports` | 1:n user | KI-Wochenplan session reports |
| `exam_results` | 1:n user | Aggregated ExaminerMind evaluation summaries (max 20 hot per user) |
| `examiner_lab_samples` | Admin-selected | Manually retained AI cases for human review |
| `examiner_rules` | System/admin | AI-Prüfer models and rules derived from lab review |
| `admin_activity_log` | System | Append-only admin and account audit trail |
| `legal_consents` | 1:n user | Privacy/terms acceptance (timestamp + version only) |
| `data_export_requests` | 1:n user | GDPR Art. 20 export queue |
| `account_deletion_requests` | 1:n user | GDPR Art. 17 erasure queue |

### 1.3 Tables Explicitly Excluded

These are **not** database tables in AustriaPath architecture:

| Excluded data | Reason | Handling |
|---------------|--------|----------|
| Full AI exam sessions | Privacy minimization | Browser memory / Redis TTL ≤ 24h |
| AI conversation transcripts | Privacy minimization | Not persisted |
| Raw OpenAI payloads | Security | Log token counts only |
| Auto-captured error log (all entries) | Operational ephemeral | `austriaPathAIErrorLog` — purge ≤ 90 days; promote to sample manually |
| Session tokens | Security | Separate `sessions` table (Appendix) |

---

## 2. PostgreSQL Enums

```sql
CREATE TYPE user_role AS ENUM ('student', 'admin', 'examiner');

CREATE TYPE user_status AS ENUM ('approved', 'blocked');

CREATE TYPE training_level AS ENUM ('A2', 'B1', 'B2');

CREATE TYPE level_source AS ENUM (
  'self_selected',
  'placement_test',
  'admin_changed',
  'admin_allowed_levels',
  'system_admin'
);

CREATE TYPE subscription_type AS ENUM (
  'free',
  'placement',
  'placement_test',
  'weekly_plan',
  'ai_exam',
  'intensive_week',
  'premium_month'
);

CREATE TYPE subscription_status AS ENUM (
  'inactive',
  'active',
  'expired',
  'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TYPE ai_credit_reason AS ENUM (
  'registration_default',
  'plan_activation',
  'admin_grant',
  'admin_reset',
  'placement_test',
  'weekly_plan',
  'ai_exam',
  'intensive_week_session',
  'premium_month_session',
  'report_builder',
  'follow_up_question',
  'refund_clawback'
);

CREATE TYPE ai_report_type AS ENUM (
  'premium-exam',
  'placement',
  'intelligent-exam'
);

CREATE TYPE exam_service AS ENUM (
  'fast',
  'normal',
  'deep',
  'learning',
  'placement',
  'ai_exam',
  'weekly_plan',
  'premium_month',
  'intensive_week'
);

CREATE TYPE sample_selection_status AS ENUM (
  'pending_review',
  'reviewed',
  'archived'
);

CREATE TYPE human_verdict AS ENUM (
  'pending',
  'correct',
  'wrong'
);

CREATE TYPE rule_status AS ENUM (
  'draft',
  'active',
  'deprecated'
);

CREATE TYPE export_request_status AS ENUM (
  'pending',
  'processing',
  'ready',
  'downloaded',
  'expired',
  'failed'
);

CREATE TYPE deletion_request_status AS ENUM (
  'pending',
  'verified',
  'processing',
  'completed',
  'cancelled',
  'failed'
);

CREATE TYPE email_verification_status AS ENUM (
  'pending',
  'verified'
);
```

**Note on `subscription_type`:** Client `SubscriptionScreen.jsx` uses `placement` while admin `grantPlan()` uses `placement_test`. Both values are retained to support migration from either source.

---

## 3. Core Tables

---

### 3.1 `users`

**Purpose:** Authentication identity, authorization role, account lifecycle, and denormalized AI credit balance for fast reads. Mirrors `austriaPathUsers` entries in `userAccess.js`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `email` | VARCHAR(255) | Yes | Unique, stored lowercased. Admin email from `VITE_ADMIN_EMAIL` / `authConfig.js` |
| `password_hash` | VARCHAR(255) | Yes | Argon2id or bcrypt — replaces plaintext `password` in localStorage |
| `role` | user_role | Yes | Default `student`. Admin requires `role = admin` + configured admin email |
| `status` | user_status | Yes | Default `approved`. `blocked` rejects login |
| `level` | training_level | Yes | Default `B1`. Registration levels: A2, B1, B2 |
| `allowed_levels` | training_level[] | Yes | Default by level: A2→`{A2}`, B1→`{A2,B1}`, B2→`{A2,B1,B2}` |
| `level_source` | level_source | Yes | Default `self_selected` |
| `plan` | subscription_type | Yes | Denormalized current plan. Default `free` |
| `ai_credits` | INTEGER | Yes | Current balance. New students: `5` (`ACCESS_CONTROL.defaultAICredits`) |
| `used_ai_credits` | INTEGER | Yes | Lifetime consumed counter. Default `0` |
| `email_verified` | BOOLEAN | Yes | Default `false` |
| `email_verification_status` | email_verification_status | Yes | Default `pending` |
| `user_code` | VARCHAR(20) | No | Display code `AP-XXXXXX` from `UserManagementScreen.getUserCode()` |
| `source` | VARCHAR(50) | Yes | Registration source. Default `E-Mail` |
| `notes` | TEXT | No | Admin-only internal notes |
| `last_login_at` | TIMESTAMPTZ | No | Set on successful login |
| `last_ai_usage_at` | TIMESTAMPTZ | No | Set on credit consumption |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `deleted_at` | TIMESTAMPTZ | No | Soft delete for GDPR |

**Primary key:** `id`

**Unique constraints:**
- `UNIQUE (email) WHERE deleted_at IS NULL`

**Foreign keys:** None

**Indexes:**
```sql
CREATE INDEX idx_users_email_active ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role_status ON users (role, status);
CREATE INDEX idx_users_plan ON users (plan) WHERE plan != 'free';
CREATE INDEX idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NOT NULL;
```

**Status values:** `user_status`: `approved`, `blocked`

**Seed admin user:** Equivalent to `buildSeedAdminUser()` — `id` may be deterministic in migration; `email = fadisobehau@gmail.com` (or `VITE_ADMIN_EMAIL`), `role = admin`, `level_source = system_admin`. Password from server seed script only — never `VITE_ADMIN_INITIAL_PASSWORD` in production.

---

### 3.2 `user_profiles`

**Purpose:** User-visible profile and learning preference data separated from auth credentials. Combines `userName`, `userLanguage`, `userProfileImage`, and aggregates from `austriaPathStudentProfile`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `display_name` | VARCHAR(255) | Yes | Maps from `name` / `userName` |
| `language` | VARCHAR(50) | Yes | Default `Deutsch`. From `userLanguage` / `austriaPathLanguage` |
| `profile_image_url` | TEXT | No | CDN URL. Replaces base64 `userProfileImage` (max 500KB client limit) |
| `skills` | JSONB | Yes | `{ writing, reading, listening, speaking }` — nullable values |
| `strengths` | TEXT[] | Yes | Default `{}` |
| `weaknesses` | TEXT[] | Yes | Default `{}` |
| `focus_areas` | TEXT[] | Yes | Default `{}` |
| `repeated_mistakes` | TEXT[] | Yes | Default `{}` |
| `placement_completed` | BOOLEAN | Yes | From `placementCompleted === 'true'` |
| `placement_profile` | JSONB | No | Full `austriaPathPlacementProfile` payload (see below) |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**`placement_profile` JSONB shape** (from `placementEngine.buildPlacementProfile()`):
```json
{
  "level": "B1",
  "selectedStartLevel": "B1",
  "date": "ISO8601",
  "skillScores": { "selbstvorstellung": "B1", "hoeren": "A2+" },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "focusAreas": ["string"],
  "recommendedFocus": ["string"],
  "studyPlan": [{ "day": "Tag 1", "task": "string", "focus": "string" }]
}
```

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Unique constraints:**
- `UNIQUE (user_id)`

**Indexes:**
```sql
CREATE INDEX idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX idx_user_profiles_placement ON user_profiles (placement_completed) WHERE placement_completed = TRUE;
```

---

### 3.3 `subscriptions`

**Purpose:** Active and historical subscription records. Maps from `user.subscription` object in `grantPlan()` (`subscriptionEngine.js`) and client `austriaPathSubscription`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `type` | subscription_type | Yes | Plan identifier |
| `status` | subscription_status | Yes | Default `inactive` |
| `remaining_exams` | INTEGER | Yes | Default `0`. From `examMap`: free=0, placement_test=1, ai_exam=1, intensive_week=3, premium_month=5 |
| `permissions` | JSONB | Yes | From `getPermissionsByPlan()`. See shape below |
| `start_date` | TIMESTAMPTZ | No | Set on activation |
| `end_date` | TIMESTAMPTZ | No | intensive_week: +7 days; premium_month: +30 days; weekly_plan client: +7 days |
| `purchased_at` | TIMESTAMPTZ | No | From client `purchasedAt` |
| `valid_until` | TIMESTAMPTZ | No | Client subscription `validUntil` |
| `total_uses` | INTEGER | No | Client plan `totalUses` |
| `remaining_uses` | INTEGER | No | Client plan `remainingUses` |
| `stripe_subscription_id` | VARCHAR(255) | No | Stripe recurring subscription ID |
| `stripe_checkout_session_id` | VARCHAR(255) | No | Stripe Checkout session ID |
| `is_current` | BOOLEAN | Yes | Default `true`. Only one current subscription per user |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**`permissions` JSONB shape** (from `getPermissionsByPlan()`):
```json
{
  "placementTest": false,
  "aiExam": false,
  "weeklyPlan": false,
  "reports": false,
  "writingAI": false,
  "imageAI": false,
  "speakingAI": false,
  "readingAI": false,
  "listeningAI": false
}
```

**Plan activation credits** (applied via `ai_credits` ledger when subscription activates):

| type | Credits granted (`creditMap`) | remaining_exams |
|------|------------------------------|-----------------|
| `free` | 0 | 0 |
| `placement_test` | 30 | 1 |
| `ai_exam` | 50 | 1 |
| `intensive_week` | 150 | 3 |
| `premium_month` | 250 | 5 |

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**
```sql
CREATE INDEX idx_subscriptions_user_current ON subscriptions (user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions (end_date) WHERE status = 'active';
CREATE INDEX idx_subscriptions_stripe ON subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
```

**Status values:** `subscription_status`: `inactive`, `active`, `expired`, `cancelled`

---

### 3.4 `payments`

**Purpose:** Immutable payment transaction log for Stripe checkout. Replaces client-side `premiumActive` / `placementPaid` flags with auditable records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `subscription_id` | UUID | No | FK → `subscriptions.id` |
| `plan_type` | subscription_type | Yes | Plan purchased |
| `amount_cents` | INTEGER | Yes | EUR cents. Plans: placement=200, weekly_plan=1499, ai_exam=999, intensive_week=2499, premium_month=3999 |
| `currency` | CHAR(3) | Yes | Default `EUR` |
| `status` | payment_status | Yes | Default `pending` |
| `stripe_payment_intent_id` | VARCHAR(255) | No | Unique when present |
| `stripe_checkout_session_id` | VARCHAR(255) | No | Unique when present |
| `stripe_customer_id` | VARCHAR(255) | No | Stripe customer ID |
| `stripe_event_id` | VARCHAR(255) | No | Webhook event ID for idempotency |
| `failure_reason` | TEXT | No | Stripe failure message |
| `paid_at` | TIMESTAMPTZ | No | Set on `succeeded` |
| `refunded_at` | TIMESTAMPTZ | No | Set on refund |
| `metadata` | JSONB | Yes | Default `{}`. Plan name, price display string |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE RESTRICT
- `subscription_id` → `subscriptions(id)` ON DELETE SET NULL

**Unique constraints:**
- `UNIQUE (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL`
- `UNIQUE (stripe_event_id) WHERE stripe_event_id IS NOT NULL`

**Indexes:**
```sql
CREATE INDEX idx_payments_user_id ON payments (user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_stripe_pi ON payments (stripe_payment_intent_id);
```

**Status values:** `payment_status`: `pending`, `processing`, `succeeded`, `failed`, `refunded`, `cancelled`

---

### 3.5 `ai_credits`

**Purpose:** Append-only ledger of AI credit grants and consumptions. Authoritative audit trail replacing client-side credit manipulation. Costs from `ACCESS_CONTROL.aiCosts` in `accessControl.js`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `amount` | INTEGER | Yes | Positive = grant, negative = consume |
| `balance_after` | INTEGER | Yes | Snapshot of `users.ai_credits` after transaction |
| `reason` | ai_credit_reason | Yes | Transaction category |
| `service_type` | VARCHAR(50) | No | e.g. `ai_exam`, `report_builder` |
| `reference_type` | VARCHAR(50) | No | `ai_report`, `subscription`, `payment`, `admin` |
| `reference_id` | UUID | No | Linked entity ID |
| `description` | TEXT | No | Human-readable detail |
| `created_by` | UUID | No | FK → `users.id` for admin grants |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Credit costs per service** (from `accessControl.js`):

| service_type | Cost |
|--------------|------|
| `placement_test` | 1 |
| `weekly_plan` | 1 |
| `ai_exam` | 2 |
| `intensive_week_session` | 2 |
| `premium_month_session` | 2 |
| `report_builder` | 1 |
| `follow_up_question` | 1 |

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `created_by` → `users(id)` ON DELETE SET NULL

**Indexes:**
```sql
CREATE INDEX idx_ai_credits_user_created ON ai_credits (user_id, created_at DESC);
CREATE INDEX idx_ai_credits_reason ON ai_credits (reason);
CREATE INDEX idx_ai_credits_reference ON ai_credits (reference_type, reference_id);
```

**Immutability:** Rows are never updated or deleted.

---

### 3.6 `ai_reports`

**Purpose:** Persisted AI progress reports for premium exams and placement. Maps from `austriaPathAIReports` entries where `type` is `premium-exam` or placement-related. Does **not** store full exam sessions or raw answers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `report_type` | ai_report_type | Yes | `premium-exam`, `placement`, `intelligent-exam` |
| `title` | VARCHAR(255) | Yes | e.g. `AI Probeprüfung · B1` |
| `level` | training_level | Yes | |
| `summary` | TEXT | Yes | German narrative from `buildExamSummary()` |
| `strong_count` | INTEGER | Yes | Default `0` |
| `middle_count` | INTEGER | Yes | Default `0` |
| `weak_count` | INTEGER | Yes | Default `0` |
| `strengths` | TEXT[] | Yes | Default `{}` |
| `weaknesses` | TEXT[] | Yes | Default `{}` |
| `focus_areas` | TEXT[] | Yes | Default `{}` |
| `decision_score` | INTEGER | No | From DecisionEngine `score` |
| `decision_level` | VARCHAR(10) | No | A2, A2+, B1, B1+ |
| `decision_confidence` | INTEGER | No | 0–100 from `calculateConfidence()` |
| `package_type` | VARCHAR(50) | No | e.g. `ai_exam` |
| `exam_number` | INTEGER | No | Exam index in package |
| `exam_total` | INTEGER | No | Total exams in package |
| `examiner_mind_summary` | JSONB | No | Truncated Brain output — score, level, confidence, strengths, weaknesses only |
| `finished_at` | TIMESTAMPTZ | Yes | |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Excluded from `examiner_mind_summary`:** Full judge reports array, raw answer text, OpenAI responses.

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**
```sql
CREATE INDEX idx_ai_reports_user_finished ON ai_reports (user_id, finished_at DESC);
CREATE INDEX idx_ai_reports_type ON ai_reports (report_type);
CREATE INDEX idx_ai_reports_level ON ai_reports (level);
```

---

### 3.7 `weekly_plan_reports`

**Purpose:** Session reports from KI-Wochenplan (`AISessionScreen` with `sessionType: weekly_plan`). Maps from `austriaPathWeeklyPlan.sessionReports[]` and weekly-type entries in `austriaPathAIReports`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `weekly_plan_id` | UUID | No | FK to supplementary `weekly_plans` table if used |
| `title` | VARCHAR(255) | Yes | Default `KI-Wochentraining` |
| `session_type` | VARCHAR(50) | Yes | Default `weekly_plan` |
| `mode` | VARCHAR(50) | Yes | Default `weekly_plan` |
| `level` | training_level | Yes | |
| `parts_count` | INTEGER | Yes | Number of training parts completed |
| `strong_count` | INTEGER | Yes | Default `0` |
| `middle_count` | INTEGER | Yes | Default `0` |
| `weak_count` | INTEGER | Yes | Default `0` |
| `strengths` | TEXT[] | Yes | Default `{}` |
| `weaknesses` | TEXT[] | Yes | Default `{}` |
| `focus_areas` | TEXT[] | Yes | Default `{}` |
| `summary` | TEXT | Yes | From `buildSmartSummary()` |
| `next_recommendation` | TEXT | No | From `buildSmartRecommendation()` |
| `part_summaries` | JSONB | Yes | Array of `{ partTitle, score, feedback }` — not full answer text |
| `finished_at` | TIMESTAMPTZ | Yes | |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Excluded:** `results` array with full `sessionAnswers` from client — store summaries only.

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**
```sql
CREATE INDEX idx_weekly_plan_reports_user ON weekly_plan_reports (user_id, finished_at DESC);
CREATE INDEX idx_weekly_plan_reports_level ON weekly_plan_reports (level);
```

---

### 3.8 `exam_results`

**Purpose:** Aggregated ExaminerMind evaluation summaries for student progress tracking. Maps from `StudentProfileEngine.addExamResult()` → `examHistory[]` (client cap: 20 entries). One row per evaluation — not one row per exam session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `level` | VARCHAR(10) | Yes | Decision level: A2, A2+, B1, B1+ |
| `score` | INTEGER | Yes | 0–100 weighted score |
| `confidence` | INTEGER | No | 0–100 |
| `service` | exam_service | Yes | Exam mode from `ExamModes` |
| `exam_type` | VARCHAR(20) | Yes | Default `OEIF` |
| `exam_level` | training_level | Yes | A2, B1, B2 |
| `strengths` | TEXT[] | Yes | Default `{}` |
| `weaknesses` | TEXT[] | Yes | Default `{}` |
| `focus_areas` | TEXT[] | Yes | Default `{}` |
| `repeated_mistakes` | TEXT[] | Yes | Detected overlap with prior weaknesses |
| `ai_report_id` | UUID | No | FK → `ai_reports.id` if linked |
| `weekly_plan_report_id` | UUID | No | FK → `weekly_plan_reports.id` if linked |
| `evaluated_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE CASCADE
- `ai_report_id` → `ai_reports(id)` ON DELETE SET NULL
- `weekly_plan_report_id` → `weekly_plan_reports(id)` ON DELETE SET NULL

**Indexes:**
```sql
CREATE INDEX idx_exam_results_user_evaluated ON exam_results (user_id, evaluated_at DESC);
CREATE INDEX idx_exam_results_service ON exam_results (service);
```

**Retention:** Keep latest 20 per user in hot storage; archive older to cold storage or aggregate into `user_profiles` only.

---

### 3.9 `examiner_lab_samples`

**Purpose:** Manually admin-selected AI evaluation cases for human–AI comparison. Maps from admin promotion of `austriaPathAIErrorLog` entries. Auto-logged errors are **not** inserted here automatically.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `selected_by` | UUID | Yes | FK → `users.id` (admin) |
| `user_id` | UUID | No | FK → `users.id` (student, if known) |
| `source_error_log_id` | BIGINT | No | Reference to ephemeral error log entry |
| `selection_status` | sample_selection_status | Yes | Default `pending_review` |
| `ai_score` | INTEGER | Yes | From DecisionEngine |
| `ai_confidence` | INTEGER | Yes | From DecisionEngine |
| `ai_level` | VARCHAR(10) | No | A2, A2+, B1, B1+ |
| `warnings` | JSONB | Yes | Default `[]` |
| `conflicts` | JSONB | Yes | Default `[]` |
| `judge_reports_summary` | JSONB | Yes | Truncated six-judge scores and examiner names — not full reasoning chains |
| `student_answer_excerpt` | TEXT | No | Max 2000 chars — admin-provided excerpt only |
| `human_verdict` | human_verdict | Yes | Default `pending` |
| `human_score` | INTEGER | No | Human reference score |
| `human_notes` | TEXT | No | Reviewer notes |
| `reviewed_by` | UUID | No | FK → `users.id` |
| `reviewed_at` | TIMESTAMPTZ | No | |
| `rule_created` | BOOLEAN | Yes | Default `false` |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Primary key:** `id`

**Foreign keys:**
- `selected_by` → `users(id)` ON DELETE RESTRICT
- `user_id` → `users(id)` ON DELETE SET NULL
- `reviewed_by` → `users(id)` ON DELETE SET NULL

**Indexes:**
```sql
CREATE INDEX idx_examiner_lab_samples_status ON examiner_lab_samples (selection_status);
CREATE INDEX idx_examiner_lab_samples_verdict ON examiner_lab_samples (human_verdict);
CREATE INDEX idx_examiner_lab_samples_selected_by ON examiner_lab_samples (selected_by);
CREATE INDEX idx_examiner_lab_samples_created ON examiner_lab_samples (created_at DESC);
```

**Status values:**
- `sample_selection_status`: `pending_review`, `reviewed`, `archived`
- `human_verdict`: `pending`, `correct`, `wrong`

---

### 3.10 `examiner_rules`

**Purpose:** AI-Prüfer model library and rules created or updated from Examiner Lab review. Maps from `austriaPathAiPrueferLibrary` and defaults in `src/data/aiPremiumLibrary.js`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `legacy_id` | VARCHAR(100) | No | Original client ID e.g. `a2-self-001` |
| `source_sample_id` | UUID | No | FK → `examiner_lab_samples.id` when created from lab review |
| `level` | training_level | Yes | |
| `skill` | VARCHAR(50) | Yes | e.g. `selbstvorstellung`, `bildbeschreibung` |
| `difficulty` | VARCHAR(20) | Yes | e.g. `leicht`, `mittel`, `schwer` |
| `service` | TEXT[] | Yes | e.g. `{einstufungstest, weeklyPlan, premiumExam}` |
| `service_text` | VARCHAR(50) | No | Admin form `serviceText` e.g. `placement_test` |
| `title` | VARCHAR(255) | Yes | |
| `short_prompt` | TEXT | No | |
| `preparation_time` | INTEGER | No | Seconds. Default 30 |
| `estimated_time` | INTEGER | No | Seconds. Default 90 |
| `visible_to_students` | BOOLEAN | Yes | Default `false` |
| `student_preview` | TEXT | No | |
| `mandatory_topics` | TEXT[] | Yes | Default `{}` |
| `keywords` | TEXT[] | Yes | Default `{}` |
| `examiner_questions` | JSONB | Yes | Default `[]` |
| `follow_up_rules` | JSONB | Yes | Default `[]` |
| `examiner_rules` | JSONB | Yes | Default `[]` |
| `report_fields` | JSONB | Yes | Default `[]` |
| `training_goals` | TEXT[] | Yes | Default `{}` |
| `weaknesses` | TEXT[] | Yes | Default `{}` |
| `weekly_plan_use` | VARCHAR(50) | No | e.g. `nach_einstufung_oder_manuell` |
| `placement_use` | BOOLEAN | Yes | Default `false` |
| `placement_weight` | INTEGER | No | |
| `status` | rule_status | Yes | Default `active` |
| `version` | INTEGER | Yes | Default `1`. Increment on rule update |
| `created_by` | UUID | No | FK → `users.id` |
| `updated_by` | UUID | No | FK → `users.id` |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Primary key:** `id`

**Foreign keys:**
- `source_sample_id` → `examiner_lab_samples(id)` ON DELETE SET NULL
- `created_by` → `users(id)` ON DELETE SET NULL
- `updated_by` → `users(id)` ON DELETE SET NULL

**Indexes:**
```sql
CREATE INDEX idx_examiner_rules_level_skill ON examiner_rules (level, skill);
CREATE INDEX idx_examiner_rules_status ON examiner_rules (status) WHERE status = 'active';
CREATE INDEX idx_examiner_rules_source_sample ON examiner_rules (source_sample_id) WHERE source_sample_id IS NOT NULL;
CREATE INDEX idx_examiner_rules_legacy_id ON examiner_rules (legacy_id) WHERE legacy_id IS NOT NULL;
```

**Status values:** `rule_status`: `draft`, `active`, `deprecated`

---

### 3.11 `admin_activity_log`

**Purpose:** Append-only audit trail for admin actions and significant account events. Maps from `user.activityLog[]` and `user.history[]` in `subscriptionEngine.js` plus server-side admin operations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | BIGSERIAL | Yes | Primary key |
| `actor_id` | UUID | No | FK → `users.id`. Null for system events |
| `target_user_id` | UUID | No | FK → `users.id` |
| `action` | VARCHAR(100) | Yes | e.g. `Plan geändert: ai_exam`, `user_blocked`, `credits_granted` |
| `details` | TEXT | No | e.g. `Credits: 50, Prüfungen: 1` |
| `metadata` | JSONB | Yes | Default `{}`. Structured change payload |
| `ip_address` | INET | No | |
| `user_agent` | TEXT | No | |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Primary key:** `id`

**Foreign keys:**
- `actor_id` → `users(id)` ON DELETE SET NULL
- `target_user_id` → `users(id)` ON DELETE SET NULL

**Indexes:**
```sql
CREATE INDEX idx_admin_activity_log_created ON admin_activity_log (created_at DESC);
CREATE INDEX idx_admin_activity_log_actor ON admin_activity_log (actor_id);
CREATE INDEX idx_admin_activity_log_target ON admin_activity_log (target_user_id);
CREATE INDEX idx_admin_activity_log_action ON admin_activity_log (action);
```

**Immutability:** Rows are never updated or deleted. Retention: 3 years.

---

### 3.12 `legal_consents`

**Purpose:** Proof of privacy policy and AGB acceptance. Stores **only** acceptance timestamp and document versions — no other personal data in this table. Maps from `austriaPathLegalConsent` in `src/legal/consent.js`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | No | FK → `users.id`. Null if recorded before registration |
| `accepted_at` | TIMESTAMPTZ | Yes | ISO timestamp of consent |
| `privacy_version` | VARCHAR(20) | Yes | Current: `2026.07` from `LEGAL_VERSIONS.privacy` |
| `terms_version` | VARCHAR(20) | Yes | Current: `2026.07` from `LEGAL_VERSIONS.terms` |
| `ip_address` | INET | No | Optional proof metadata |
| `user_agent` | TEXT | No | Optional proof metadata |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE SET NULL

**Indexes:**
```sql
CREATE INDEX idx_legal_consents_user ON legal_consents (user_id, accepted_at DESC);
CREATE INDEX idx_legal_consents_versions ON legal_consents (privacy_version, terms_version);
```

**Re-consent trigger:** When `LEGAL_VERSIONS` in `src/legal/legalVersions.js` changes, `needsLegalConsent()` returns true and a new row is inserted on acceptance.

---

### 3.13 `data_export_requests`

**Purpose:** GDPR Art. 20 data portability request queue. Supports export bundle containing account, profile, reports, exam results, subscriptions, payments, and consent records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `status` | export_request_status | Yes | Default `pending` |
| `requested_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `processed_at` | TIMESTAMPTZ | No | |
| `download_url` | TEXT | No | Signed URL to JSON/ZIP bundle |
| `download_expires_at` | TIMESTAMPTZ | No | Default 7 days after ready |
| `file_size_bytes` | BIGINT | No | |
| `error_message` | TEXT | No | |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Export bundle contents:**
- `users` (excluding `password_hash`)
- `user_profiles`
- `subscriptions`, `payments`, `ai_credits`
- `ai_reports`, `weekly_plan_reports`, `exam_results`
- `legal_consents`

**Excluded from export:** `examiner_lab_samples` student answer excerpts unless user is the subject; admin notes on other users.

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**
```sql
CREATE INDEX idx_data_export_requests_user ON data_export_requests (user_id, requested_at DESC);
CREATE INDEX idx_data_export_requests_status ON data_export_requests (status);
```

**Status values:** `export_request_status`: `pending`, `processing`, `ready`, `downloaded`, `expired`, `failed`

**SLA:** Process within 30 days per `GDPR-Readiness-Review.md`.

---

### 3.14 `account_deletion_requests`

**Purpose:** GDPR Art. 17 right to erasure workflow. Account Settings currently shows deletion as "Demnächst verfügbar" — this table supports the backend implementation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | FK → `users.id` |
| `status` | deletion_request_status | Yes | Default `pending` |
| `requested_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `verification_token_hash` | VARCHAR(255) | No | Email confirmation token |
| `verified_at` | TIMESTAMPTZ | No | |
| `scheduled_purge_at` | TIMESTAMPTZ | No | Default requested_at + 30 days |
| `completed_at` | TIMESTAMPTZ | No | |
| `cancelled_at` | TIMESTAMPTZ | No | |
| `reason` | TEXT | No | Optional user reason |
| `error_message` | TEXT | No | |
| `created_at` | TIMESTAMPTZ | Yes | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Yes | Default `NOW()` |

**Purge scope on `completed`:**
- Cascade delete: `user_profiles`, `subscriptions`, `ai_reports`, `weekly_plan_reports`, `exam_results`, `ai_credits`, `legal_consents`
- Anonymize or delete: `users` row
- Retain: `payments` (legal invoice retention), anonymized `legal_consents` proof if required
- Retain: `examiner_lab_samples` only if anonymized (remove `user_id`, excerpt)

**Primary key:** `id`

**Foreign keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**
```sql
CREATE INDEX idx_account_deletion_requests_user ON account_deletion_requests (user_id);
CREATE INDEX idx_account_deletion_requests_status ON account_deletion_requests (status);
CREATE INDEX idx_account_deletion_requests_scheduled ON account_deletion_requests (scheduled_purge_at) WHERE status = 'verified';
```

**Status values:** `deletion_request_status`: `pending`, `verified`, `processing`, `completed`, `cancelled`, `failed`

---

## 4. Relationships

### 4.1 Entity Relationship Diagram

```
users ─────────────┬──────────────────────────────────────────┐
                   │                                          │
         ┌─────────┼─────────┬──────────┬──────────┐         │
         ▼         ▼         ▼          ▼          ▼         │
  user_profiles  subscriptions  payments  ai_credits  legal_consents
         │              │                                    │
         │              └──────────┬─────────────────────────┘
         │                         │
         ▼                         ▼
  exam_results ◄──── ai_reports    admin_activity_log
         ▲                │
         │                │
         └──── weekly_plan_reports
         
users (admin) ── selects ──► examiner_lab_samples
                                    │
                          human review (verdict, score, notes)
                                    │
                                    ▼
                            examiner_rules
                            (source_sample_id FK)

users ──► data_export_requests
users ──► account_deletion_requests
```

### 4.2 Relationship Definitions

| From | To | Cardinality | FK column | On delete |
|------|----|-------------|-----------|-----------|
| `users` | `user_profiles` | 1:1 | `user_profiles.user_id` | CASCADE |
| `users` | `subscriptions` | 1:n | `subscriptions.user_id` | CASCADE |
| `users` | `payments` | 1:n | `payments.user_id` | RESTRICT |
| `users` | `ai_credits` | 1:n | `ai_credits.user_id` | CASCADE |
| `users` | `ai_reports` | 1:n | `ai_reports.user_id` | CASCADE |
| `users` | `weekly_plan_reports` | 1:n | `weekly_plan_reports.user_id` | CASCADE |
| `users` | `exam_results` | 1:n | `exam_results.user_id` | CASCADE |
| `users` | `legal_consents` | 1:n | `legal_consents.user_id` | SET NULL |
| `users` | `data_export_requests` | 1:n | `data_export_requests.user_id` | CASCADE |
| `users` | `account_deletion_requests` | 1:n | `account_deletion_requests.user_id` | CASCADE |
| `users` (admin) | `examiner_lab_samples` | 1:n | `examiner_lab_samples.selected_by` | RESTRICT |
| `users` (student) | `examiner_lab_samples` | 1:n optional | `examiner_lab_samples.user_id` | SET NULL |
| `examiner_lab_samples` | human correction | 1:1 fields | `human_verdict`, `human_score`, `human_notes`, `reviewed_by` | — |
| human correction | `examiner_rules` | 1:n optional | `examiner_rules.source_sample_id` | SET NULL |
| `ai_reports` | `exam_results` | 1:n optional | `exam_results.ai_report_id` | SET NULL |
| `weekly_plan_reports` | `exam_results` | 1:n optional | `exam_results.weekly_plan_report_id` | SET NULL |
| `subscriptions` | `payments` | 1:n optional | `payments.subscription_id` | SET NULL |

### 4.3 Examiner Lab Workflow Chain

```
1. DecisionEngine logs low-confidence case → ephemeral austriaPathAIErrorLog (NOT this schema)
2. Admin views ExaminerLabScreen → selects case
3. INSERT examiner_lab_samples (selected_by = admin user id)
4. Admin sets human_verdict, human_score, human_notes (Correct/Wrong UI in ExaminerLabScreen)
5. If wrong → admin creates new rule: INSERT examiner_rules (source_sample_id = sample.id)
6. UPDATE examiner_lab_samples SET rule_created = true, selection_status = 'reviewed'
7. ExaminerMind modelRouter uses updated examiner_rules on future evaluations
```

---

## 5. Privacy Rules

### 5.1 Storage Policy (Binding)

| Store | Table(s) | Do not store |
|-------|----------|--------------|
| AI progress reports | `ai_reports`, `weekly_plan_reports` | Full exam transcripts, all step answers |
| Evaluation summaries | `exam_results` | Raw judge reasoning chains |
| Selected lab cases | `examiner_lab_samples` | Every auto-logged error (ephemeral only) |
| Examiner configuration | `examiner_rules` | Student PII in prompts |
| Consent proof | `legal_consents` | Full policy text (served from app) |

### 5.2 Ephemeral Data (Not in Core Tables)

| Client key | Handling |
|------------|----------|
| `austriaPathCurrentSessionAnswers` | Redis/in-memory TTL 24h — purge on session end |
| `austriaPathCurrentAISession` | Redis/in-memory TTL 24h |
| `austriaPathAiSession` | Redis/in-memory TTL 24h |
| `austriaPathPremiumExamPackage` | Redis/in-memory TTL 24h |
| `austriaPathAIExamTimerStart` | Redis/in-memory TTL 24h |
| `austriaPathAIErrorLog` | Operational table or Redis — max 500 client / 90-day server retention; never migrate all entries to `examiner_lab_samples` |

### 5.3 Field-Level Privacy

| Field | Classification |
|-------|----------------|
| `users.password_hash` | Never expose |
| `users.notes` | Admin-only |
| `examiner_lab_samples.student_answer_excerpt` | Admin-only; truncate at 2000 chars |
| `examiner_lab_samples.judge_reports_summary` | Admin-only |
| `ai_reports.examiner_mind_summary` | User-visible (truncated) |
| `weekly_plan_reports.part_summaries` | User-visible (summaries only) |
| `legal_consents` | User-visible own records; admin read for compliance |
| `payments.stripe_*` | Admin-only; user sees amount, date, plan |

### 5.4 Retention

| Table | Retention |
|-------|-----------|
| `ai_reports`, `weekly_plan_reports`, `exam_results` | Until account deletion |
| `examiner_lab_samples` | Until admin archives or 24 months |
| `examiner_rules` | Indefinite (non-PII configuration) |
| `legal_consents` | 3 years after account closure |
| `payments` | 7 years (Austrian tax law) |
| `admin_activity_log` | 3 years |
| `data_export_requests` | 90 days after download expiry |
| Ephemeral sessions | ≤ 24 hours |

---

## 6. Security Rules

### 6.1 Fields Never Exposed to Frontend

| Field | Table |
|-------|-------|
| `password_hash` | `users` |
| `verification_token_hash` | `account_deletion_requests` |
| `stripe_payment_intent_id` | `payments` (user API returns own payment summary only) |
| `stripe_event_id` | `payments` |
| `stripe_checkout_session_id` | `payments` |
| `ip_address`, `user_agent` | `admin_activity_log`, `legal_consents` (user-facing API) |
| `notes` | `users` |
| `judge_reports_summary` (full) | `examiner_lab_samples` |
| `source_error_log_id` | `examiner_lab_samples` |

### 6.2 Admin-Only Fields and Tables

| Resource | Access |
|----------|--------|
| `users.notes` | Admin read/write |
| `users.status` (block/unblock) | Admin write |
| `users.ai_credits` (direct set) | Admin via `ai_credits` ledger only |
| `examiner_lab_samples` (all) | Admin read/write; Examiner role read + review fields |
| `examiner_rules` (write) | Admin write; all users read active rules via API |
| `admin_activity_log` | Admin read |
| All users list/search | Admin |
| `payments` (all users) | Admin read |

### 6.3 User-Visible Fields

Authenticated users can read/write own:

| Table | User access |
|-------|-------------|
| `users` | Read: id, email, name (via profile), role, status, level, allowed_levels, ai_credits, plan, email_verified. Write: none directly — via profile/password APIs |
| `user_profiles` | Read/write: display_name, language, profile_image_url |
| `subscriptions` | Read own current subscription |
| `payments` | Read own: plan_type, amount_cents, status, paid_at |
| `ai_credits` | Read own ledger |
| `ai_reports` | Read own |
| `weekly_plan_reports` | Read own |
| `exam_results` | Read own |
| `legal_consents` | Read own |
| `data_export_requests` | Create/read own |
| `account_deletion_requests` | Create/read/cancel own pending |

### 6.4 Backend Authorization Requirements

| Operation | Required authorization |
|-----------|------------------------|
| Register | Public |
| Login / logout / refresh | Public / authenticated |
| Read own profile, reports | Authenticated, `user_id = auth.uid` |
| Update own profile | Authenticated, own row |
| Request data export | Authenticated, own user |
| Request account deletion | Authenticated, own user |
| AI credit consume | Authenticated + sufficient balance + not blocked |
| Create AI report | Authenticated + valid subscription/permissions |
| Stripe webhook | Stripe signature verification — no user auth |
| List/search users | Admin (`role = admin`, `status = approved`) |
| Block/unblock user | Admin |
| Grant credits/subscription | Admin + audit log entry |
| Select Examiner Lab sample | Admin |
| Review sample / create rule | Admin or Examiner (review only) |
| Publish examiner rule | Admin |
| Read admin activity log | Admin |
| Process deletion/export jobs | System service role |

**Admin determination (must match `authConfig.js`):**
```
isAdmin = user.email === configured ADMIN_EMAIL
          AND user.role = 'admin'
          AND user.status = 'approved'
```

---

## 7. Migration Plan

### 7.1 Migration Strategy

Migration runs as a one-time server-side import per user when they first log in after backend launch, plus a bulk admin import script for existing `austriaPathUsers` data.

**Order:**
1. Create schema and enums
2. Import admin user from seed script (not from client password)
3. Bulk import `austriaPathUsers` → `users` + `user_profiles`
4. Per-user import on login: reports, plans, consents from client export or synced localStorage upload
5. Import `austriaPathAiPrueferLibrary` → `examiner_rules`
6. Admin manually re-selects Examiner Lab samples from exported error log (do not auto-import all errors)
7. Disable client writes to migrated keys; API becomes source of truth

### 7.2 localStorage → Database Mapping

| localStorage key | Target table(s) | Migration notes |
|------------------|-----------------|-----------------|
| `austriaPathUsers` | `users`, `user_profiles` | Hash passwords on import — force password reset if plaintext only |
| `austriaPathCurrentUser` | — | Session only; do not migrate |
| `currentUser` | — | Legacy session; do not migrate |
| `isLoggedIn` | — | Replaced by server session |
| `userEmail`, `userName`, `userRole`, `userLevel` | `users`, `user_profiles` | Denormalized cache; rebuild from DB |
| `userLanguage`, `austriaPathLanguage` | `user_profiles.language` | |
| `userProfileImage` | `user_profiles.profile_image_url` | Upload base64 to CDN; store URL |
| `austriaPathLegalConsent` | `legal_consents` | `{ acceptedAt, privacyVersion, termsVersion }` only |
| `austriaPathSubscription` | `subscriptions` | Map `type` values; set `is_current = true` |
| `userPlan`, `premiumActive`, `premiumPlan`, `isPremiumUser`, `placementPaid` | `subscriptions` | Derive from subscription record; delete client flags |
| `austriaPathSelectedPremiumPlan` | `subscriptions.metadata` | Store as JSONB metadata |
| `austriaPathAIReports` | `ai_reports`, `weekly_plan_reports` | Split by `sessionType` / `type`: `weekly_plan` → `weekly_plan_reports`; `premium-exam` → `ai_reports` |
| `austriaPathLastAIReport` | — | Rebuild from latest `ai_reports` row |
| `austriaPathLastStrengths`, `austriaPathLastWeaknesses` | — | Rebuild from latest report |
| `austriaPathStudentProfile` | `user_profiles` + `exam_results` | Skills/arrays → profile; `examHistory[]` → `exam_results` rows |
| `austriaPathPlacementProfile` | `user_profiles.placement_profile` | Set `placement_completed = true` |
| `placementCompleted`, `levelSource` | `user_profiles.placement_completed`, `users.level_source` | |
| `austriaPathWeeklyPlan` | `weekly_plans` (Appendix) + `weekly_plan_reports` | `sessionReports[]` → `weekly_plan_reports`; plan config → supplementary table |
| `austriaPathPremiumSchedule` | `premium_schedules` (Appendix) | |
| `austriaPathPremiumExams` | — | Derive from `ai_reports` |
| `austriaPathAiPrueferLibrary` | `examiner_rules` | Preserve `legacy_id` from client `id` |
| `austriaPathAIErrorLog` | — | **Do not bulk migrate.** Admin selects cases → `examiner_lab_samples` |
| `austriaPathAdminData` | `content_items` (Appendix) | CMS content — separate migration |
| `austriaPathSessionIntegrity` | — | Replaced by server sessions |
| `isAdminPreview` | — | Do not migrate |
| `austriaPathCurrentSessionAnswers` | — | **Do not migrate** — ephemeral |
| `austriaPathCurrentAISession` | — | **Do not migrate** — ephemeral |
| `austriaPathAiSession` | — | **Do not migrate** — ephemeral |
| `austriaPathPremiumExamPackage` | — | **Do not migrate** — ephemeral |
| `databaseVisits`, `writingVisits`, `{section}PremiumVisitCount` | — | Analytics — optional future table |
| `selectedWritingTopic` | — | Session navigation state only |

### 7.3 User Object Field Mapping

`registerStudentUser()` / `austriaPathUsers` entry → database:

| Client field | DB destination |
|--------------|----------------|
| `id` | `users.id` (new UUID; store old id in migration metadata) |
| `name` | `user_profiles.display_name` |
| `email` | `users.email` |
| `password` | `users.password_hash` (re-hash) |
| `level` | `users.level` |
| `allowedLevels` | `users.allowed_levels` |
| `plan` | `users.plan` |
| `levelSource` | `users.level_source` |
| `role` | `users.role` |
| `status` | `users.status` |
| `aiCredits` | `users.ai_credits` + opening `ai_credits` ledger row |
| `usedAiCredits` | `users.used_ai_credits` |
| `emailVerified` | `users.email_verified` |
| `emailVerificationStatus` | `users.email_verification_status` |
| `createdAt` | `users.created_at` |
| `lastLogin` | `users.last_login_at` |
| `language` | `user_profiles.language` |
| `subscription` | `subscriptions` row |
| `permissions` | `subscriptions.permissions` |
| `history[]` | `admin_activity_log` rows |
| `activityLog[]` | `admin_activity_log` rows |
| `notes` | `users.notes` |
| `userCode` | `users.user_code` |
| `source` | `users.source` |

### 7.4 Migration Validation Checklist

- [ ] Row count: `austriaPathUsers` = `users` (excluding soft-deleted)
- [ ] No plaintext passwords remain in database
- [ ] Each user has exactly one `user_profiles` row
- [ ] `ai_reports` + `weekly_plan_reports` count ≥ client `austriaPathAIReports` split correctly
- [ ] `exam_results` count matches sum of `examHistory` entries (max 20 per user)
- [ ] `legal_consents` preserves version strings exactly
- [ ] `examiner_rules` count matches `austriaPathAiPrueferLibrary`
- [ ] Zero rows in core tables containing full session answer payloads
- [ ] Client premium flags removed after successful migration

---

## 8. Supabase / PostgreSQL Recommendations

### 8.1 PostgreSQL Configuration

| Setting | Recommendation |
|---------|----------------|
| Version | PostgreSQL 15+ |
| Extensions | `pgcrypto` (UUID), `citext` (email) |
| Connection pooling | PgBouncer via Supabase Supavisor or RDS Proxy |
| Timezone | `UTC` stored; convert to `Europe/Vienna` in API |
| JSONB | Use for `permissions`, `placement_profile`, `examiner_mind_summary`, judge summaries |

**Email column:**
```sql
CREATE EXTENSION IF NOT EXISTS citext;
-- users.email CITEXT UNIQUE
```

### 8.2 Supabase-Specific Notes

If using Supabase:

| Concern | Approach |
|---------|----------|
| Auth | Use Supabase Auth **or** custom auth with service role for migrations. Do not mirror plaintext localStorage auth. |
| Storage | Supabase Storage bucket `profile-images` for `user_profiles.profile_image_url` |
| Edge functions | Replace `api/ai/openai.js` with authenticated edge function |
| Realtime | Not required for v1 |

### 8.3 Row Level Security (RLS)

Enable RLS on all user-data tables. Use service role for admin operations and background jobs.

```sql
-- Example: ai_reports
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_reports_select_own ON ai_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ai_reports_insert_own ON ai_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin bypass via custom claim
CREATE POLICY ai_reports_admin_all ON ai_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
        AND users.status = 'approved'
        AND users.email = current_setting('app.admin_email', true)
    )
  );
```

**RLS policy summary:**

| Table | Student policy | Admin policy |
|-------|----------------|--------------|
| `users` | Read/update own row (exclude `notes`, `password_hash`) | Full access |
| `user_profiles` | Read/write own | Read all |
| `subscriptions` | Read own | Read/write all |
| `payments` | Read own (limited columns) | Read all |
| `ai_credits` | Read own | Read all; insert via service role |
| `ai_reports` | Read/insert own | Read all |
| `weekly_plan_reports` | Read/insert own | Read all |
| `exam_results` | Read own | Read all |
| `legal_consents` | Read/insert own | Read all |
| `data_export_requests` | CRUD own | Read all |
| `account_deletion_requests` | CRUD own pending | Read/process all |
| `examiner_lab_samples` | No access | Full access |
| `examiner_rules` | Read `status = active` only | Full access |
| `admin_activity_log` | No access | Read only |

**Service role:** Used for Stripe webhooks, deletion purge jobs, export generation, credit deduction inside transactions.

### 8.4 Transaction Patterns

**Credit consumption (must be atomic):**
```sql
BEGIN;
  SELECT ai_credits FROM users WHERE id = $1 FOR UPDATE;
  -- verify balance >= cost
  UPDATE users SET ai_credits = ai_credits - $cost, last_ai_usage_at = NOW() WHERE id = $1;
  INSERT INTO ai_credits (user_id, amount, balance_after, reason, service_type) VALUES (...);
COMMIT;
```

**Subscription activation on payment webhook:**
```sql
BEGIN;
  INSERT INTO payments (...) VALUES (...);
  UPDATE subscriptions SET is_current = false WHERE user_id = $1 AND is_current = true;
  INSERT INTO subscriptions (...) VALUES (...);
  UPDATE users SET plan = $plan_type, ai_credits = ai_credits + $grant WHERE id = $1;
  INSERT INTO ai_credits (user_id, amount, balance_after, reason) VALUES (...);
  INSERT INTO admin_activity_log (actor_id, target_user_id, action, details) VALUES (...);
COMMIT;
```

### 8.5 Recommended Database Roles

| Role | Purpose |
|------|---------|
| `austriapath_app` | Application runtime — RLS enforced |
| `austriapath_admin` | Migration and admin batch jobs — bypass RLS |
| `austriapath_readonly` | Analytics replicas |

---

## 9. Appendix — Supplementary Tables

These tables are not in the Phase 6 core list but are required for full parity with the current SPA. Implement alongside core tables.

### 9.1 `sessions` (authentication)

| Field | Type | Required |
|-------|------|----------|
| `id` | UUID | Yes |
| `user_id` | UUID FK | Yes |
| `token_hash` | VARCHAR(255) | Yes |
| `expires_at` | TIMESTAMPTZ | Yes |
| `created_at` | TIMESTAMPTZ | Yes |

Replaces `isLoggedIn`, `austriaPathSessionIntegrity`, `currentUser` session cache.

### 9.2 `weekly_plans` (plan configuration)

Stores `austriaPathWeeklyPlan` non-report data: appointments, weaknesses, dailyMessages, weeklyTasks.

| Field | Type |
|-------|------|
| `id` | UUID |
| `user_id` | UUID FK |
| `level` | training_level |
| `weaknesses` | TEXT[] |
| `appointments` | JSONB |
| `daily_messages` | JSONB |
| `weekly_tasks` | JSONB |
| `status` | VARCHAR(50) |
| `created_at` | TIMESTAMPTZ |

### 9.3 `premium_schedules`

Stores `austriaPathPremiumSchedule` appointment arrays.

### 9.4 `content_items`

Stores `austriaPathAdminData` CMS entries (AdminScreen). Required for Lesen, Hören, Datenbank modules but outside Phase 6 core scope.

---

## Document Cross-References

| Document | Relationship |
|----------|--------------|
| `AustriaPath_Technical_Specification.md` | API contracts using this schema |
| `Backend Security Requirements.md` | Authorization and RLS requirements |
| `GDPR-Readiness-Review.md` | Retention and deletion policies |
| `AI-Privacy-Policy.md` | Ephemeral vs persisted data rules |
| `Launch-Checklist.md` | Pre-launch database validation |

---

**Document owner:** AustriaPath Engineering  
**Next review:** Before Phase 3 backend implementation begins
