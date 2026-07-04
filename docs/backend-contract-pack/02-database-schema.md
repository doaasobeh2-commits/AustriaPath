# 02 — Database Schema Reference

**Contract Pack version:** 2.0.0-gate0  
**Executable DDL:** [02-database-schema.sql](./02-database-schema.sql)

---

## 1. Overview

PostgreSQL 15+ is the system of record. Redis holds hot exam session state (optional cache); PostgreSQL remains authoritative for recovery.

### Table groups

| Group | Tables |
|-------|--------|
| Identity | `users`, `user_profiles`, `auth_sessions` |
| Learning | `student_learning_profiles` |
| Billing | `subscriptions`, `payments`, `exam_attempt_ledger` |
| Exam platform | `exam_sessions`, `council_decisions`, `exam_reports`, `report_revisions` |
| Governance | `rule_registry_snapshots`, `rule_registry_promotions`, `rule_proposals` |
| Lab | `examiner_lab_queue_items`, `lab_resolutions` |
| AI | `ai_credits`, `ai_completion_logs` |
| Compliance | `legal_consents`, `data_export_requests`, `account_deletion_requests` |
| Ops | `admin_activity_log`, `idempotency_records` |
| Content | `examiner_content_rules`, `weekly_plans` |

---

## 2. Key tables (exam platform)

### 2.1 `exam_sessions`

Persists `ExamSessionState` from `src/exam-platform/contracts.js`.

| Column | Type | Notes |
|--------|------|-------|
| `blueprint` | JSONB | Full `ExamBlueprint` frozen at start |
| `answers` | JSONB | `SectionAnswer[]` |
| `evaluations` | JSONB | `SectionEvaluation[]` |
| `rules_version` | VARCHAR | Pinned at session start |
| `deadline_at` | TIMESTAMPTZ | Set for hard-timing products |
| `status` | enum | State machine — see lifecycle doc 07 |

**Indexes:** `(user_id, status)`, `(deadline_at) WHERE status = 'active'`

### 2.2 `exam_reports`

Canonical `FinalReport` storage. Replaces split `ai_reports` / `weekly_plan_reports` from v1.0 schema.

| Column | Type | Notes |
|--------|------|-------|
| `report_json` | JSONB | Full FinalReport including slim council ref |
| `human_review` | JSONB | `HumanReviewPublic` — populated on Lab correction |
| `legacy_adapter_key` | VARCHAR | e.g. `austriaPathAIReports` for migration |
| `is_superseded` | BOOLEAN | True when revised by Lab |

### 2.3 `student_learning_profiles`

Maps `StudentProfile` V2 (`STUDENT_PROFILE_VERSION = 2.0.0`).

| Column | Type | Notes |
|--------|------|-------|
| `profile_json` | JSONB | Complete profile document |
| `official_exam_level` | cefr_label | Indexed; updated only per product policy |
| `active_package` | JSONB | `PackageState` for multi-exam products |

**Invariant:** `mergePracticeReport` never updates `official_exam_level` (enforced in API layer).

### 2.4 `rule_registry_snapshots`

Single-document Rule Registry per version.

| Column | Type | Notes |
|--------|------|-------|
| `registry_version` | VARCHAR | Semantic version string, monotonic |
| `registry_json` | JSONB | Full `RuleRegistry` shape |
| `is_current` | BOOLEAN | Exactly one row `true` |

Promotions append to `promotedRules` inside new snapshot OR append rows in `rule_registry_promotions` with materialized merge at read time (implementation choice — materialize on promote recommended).

### 2.5 `examiner_lab_queue_items`

Phase G selective queue (~1 high-value case/week per policy).

| Column | Type | Notes |
|--------|------|-------|
| `classification` | VARCHAR | From `humanReviewReason` |
| `student_review_status` | enum | Set on `correct` / `propose_rule` |
| `section_evaluations` | JSONB | Evidence for reviewer |

**Not** the same as legacy `examiner_lab_samples` — queue is engine-driven; samples table optional for long-term archive.

---

## 3. Row Level Security summary

Enable RLS on all user-data tables.

| Table | Student | Examiner | Admin |
|-------|---------|----------|-------|
| `exam_sessions` | CRUD own | — | Read all |
| `exam_reports` | Read own | — | Read all |
| `student_learning_profiles` | Read own | — | Read all |
| `examiner_lab_queue_items` | — | Read + resolve | Full |
| `rule_registry_snapshots` | Read current | Read | Read/write |
| `subscriptions` | Read own | — | Full |
| `ai_credits` | Read own | — | Read + insert via service |

Service role bypasses RLS for webhooks, engine workers, migration.

---

## 4. Transaction patterns

### 4.1 Start premium exam (atomic)

```sql
BEGIN;
  SELECT * FROM subscriptions WHERE user_id = $1 AND is_current AND status = 'active' FOR UPDATE;
  -- validate remaining_exams, type, expiry
  INSERT INTO exam_attempt_ledger (...);
  UPDATE subscriptions SET remaining_exams = remaining_exams - 1;
  INSERT INTO exam_sessions (...);
COMMIT;
```

### 4.2 Complete exam (atomic)

```sql
BEGIN;
  SELECT * FROM exam_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE;
  -- run engine complete (application layer)
  INSERT INTO council_decisions (...);
  INSERT INTO exam_reports (...);
  UPDATE student_learning_profiles (...);
  UPDATE exam_sessions SET status = 'completed';
  -- maybe INSERT examiner_lab_queue_items
COMMIT;
```

### 4.3 Promote rule (atomic)

```sql
BEGIN;
  INSERT INTO rule_registry_promotions (...);
  INSERT INTO rule_registry_snapshots (... new version, is_current=true);
  UPDATE rule_registry_snapshots SET is_current = false WHERE id != $new;
  UPDATE examiner_lab_queue_items SET status = 'resolved';
  INSERT INTO lab_resolutions (...);
COMMIT;
```

---

## 5. v1.0 schema migration notes

The Gate 0 schema **supersedes** `AustriaPath_Database_Schema.md` v1.0 for exam-platform tables:

| v1.0 table | Gate 0 equivalent |
|------------|-------------------|
| `ai_reports` | `exam_reports` (product_type discriminator) |
| `weekly_plan_reports` | `exam_reports` WHERE product_type = weekly_plan |
| `exam_results` | Embedded in `student_learning_profiles.exam_history` + optional materialized view |
| `examiner_lab_samples` | `examiner_lab_queue_items` + optional archive |
| `examiner_rules` | `examiner_content_rules` + `rule_registry_snapshots` |

v1.0 tables for `users`, `payments`, `legal_consents`, GDPR queues remain conceptually valid; Gate 0 extends them.

---

## 6. Seed data requirements

| Seed | Source |
|------|--------|
| Admin user | Server bootstrap secret — never client password |
| Rule registry v0 | `ExaminerKnowledge` seed from `ruleRegistryService.js` |
| Model catalog | Static build artifact version pinned in `catalog_version` |
| Stripe prices | Engineering runbook price map |
