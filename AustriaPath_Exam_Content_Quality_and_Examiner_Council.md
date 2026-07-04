# AustriaPath Exam Content Quality & Examiner Council Specification

**Document version:** 1.0  
**Last updated:** 4 July 2026  
**Status:** Governance specification — not yet implemented  
**Scope:** Content review, model lifecycle, examiner rule governance, Examiner Lab workflow  

This document defines the professional review system for all AustriaPath exam models, AI prompts, examiner rules, and learning content before use in premium AI exams or AI evaluation. It does **not** add application features, modify exam content, AI logic, payment, or authentication.

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Content Types in AustriaPath](#2-content-types-in-austriapath)
3. [Content Quality Review](#3-content-quality-review)
4. [Model Status System](#4-model-status-system)
5. [Examiner Council Rules](#5-examiner-council-rules)
6. [Weak or Problematic Models](#6-weak-or-problematic-models)
7. [AI Use Eligibility](#7-ai-use-eligibility)
8. [Examiner Lab Connection](#8-examiner-lab-connection)
9. [Admin Review Checklist](#9-admin-review-checklist)
10. [Backend and Data Notes](#10-backend-and-data-notes)
11. [Current Codebase Connections](#11-current-codebase-connections)

---

## 1. Purpose and Scope

### 1.1 Goal

Ensure every piece of exam-related content used in AustriaPath is:

- Accurate for its declared level (A2 / B1 / B2)
- Compatible with ÖIF-style exam preparation (not official ÖIF certification)
- Safe for students (clear tasks, no misleading instructions)
- Consistent with ExaminerMind evaluation logic
- Eligible for AI use only after explicit quality approval

### 1.2 What This Specification Governs

| Content category | Current location | Governing screen / module |
|------------------|------------------|---------------------------|
| Admin CMS training items | `austriaPathAdminData` | `AdminScreen.jsx` |
| AI-Prüfer examiner models | `austriaPathAiPrueferLibrary` | `AIPrueferScreen.jsx` |
| Default AI premium library | `src/data/aiPremiumLibrary.js` | Seed data for AI-Prüfer |
| Static writing models | `modelsA2.js`, `modelsb1/`, `modelsB2.js` | Practice, Database, Admin reference |
| Placement models | `aiPlacementLibrary.js` | `PlacementTestScreen.jsx` |
| Weekly plan tasks | `weeklyPlanLibrary.js` | `WeeklyPlanSetupScreen.jsx` |
| Examiner knowledge files | `src/ai/examinerMind/knowledge/` | `TaskJudge`, `ExaminerCouncil` |
| Global examiner behaviour | `examinerRules.js` | All ExaminerMind evaluations |
| Premium exam assembly | `premiumExamBuilder.js` | `PremiumExamSessionScreen.jsx` |

### 1.3 What This Specification Does Not Change

- ExaminerMind judge algorithms (`DecisionEngine`, six judges)
- OpenAI routing (`modelRouter.js`)
- Payment, subscription, or authentication flows
- Existing exam text, prompts, or model content

Implementation of this specification is a **future governance layer** applied via admin workflow and backend fields.

---

## 2. Content Types in AustriaPath

Understanding content types is required before applying review rules.

### 2.1 Admin CMS Content (`content_items`)

**Fields today** (`AdminScreen.jsx`): `type`, `level`, `title`, `examId`, `examType`, `content`, `solution`, `grammar`, `satzbau`, `konnektoren`, `words`, `verbs`, `expressions`, `status`.

**Current statuses:** `draft`, `review`, `published`, `archived`

**Student visibility:** Only `status === 'published'` items are loaded in training screens (`LesenScreen`, `HorenScreen`, `AkademieScreen`, `premiumExamBuilder.getAdminByType()`).

### 2.2 AI-Prüfer Models (`examiner_rules`)

**Fields today** (`AIPrueferScreen.jsx`, `aiPremiumLibrary.js`): `level`, `skill`, `difficulty`, `service`, `title`, `shortPrompt`, `examinerQuestions`, `followUpRules`, `examinerRules`, `reportFields`, `mandatoryTopics`, `keywords`, `visibleToStudents`, `preparationTime`, `estimatedTime`.

**Current gate:** `visibleToStudents` boolean only — no formal quality status.

**Storage key:** `austriaPathAiPrueferLibrary`

### 2.3 Static Bundled Models

Writing models in `modelsA2.js` etc. include `task`, `schreiben`, `words`, `verbs`, `grammar`, `tip`. Some entries carry `status: "preview"` indicating incomplete review.

### 2.4 ExaminerMind Knowledge Files

Per-level skill knowledge (e.g. `B1SpeakingKnowledge`) defines:

- `examinerChecks[]` — criteria IDs used by rule judges
- `expectedElements[]` — elements `TaskJudge` detects in answers
- `objectives[]` — level-appropriate goals

These are code files today; changes require developer review plus admin sign-off under this specification.

### 2.5 ÖIF Exam Structure Reference

`examStructure.js` defines canonical ÖIF section maps per level:

| Level | Skills |
|-------|--------|
| A2 | writing, reading, listening, speaking |
| B1 | writing, reading, listening, speaking |
| B2 | writing, reading, listening, speaking |

Every reviewed model must declare which structure section it supports.

---

## 3. Content Quality Review

Every model — regardless of type — must pass quality review before promotion to `ai_exam_ready` or `human_verified`.

### 3.1 Review Dimensions

| # | Dimension | Definition | Pass criteria |
|---|-----------|------------|---------------|
| 1 | **Level accuracy** | Grammar, vocabulary, and task complexity match A2, B1, or B2 | No B2 constructions in A2 model; no A2-only limitation in B2 model |
| 2 | **ÖIF-style compatibility** | Task format aligns with `examStructure.js` section for that level | Skill and part type documented; speaking tasks allow follow-up if section requires |
| 3 | **Clarity of task** | Student understands what to do without ambiguity | `studentPreview` / `task` / `content` states goal in one reading |
| 4 | **Grammar suitability** | Target structures match level syllabus | `grammar[]` tags consistent with level; no required structures above level |
| 5 | **Vocabulary suitability** | Word lists and keywords match level frequency | A2: everyday vocabulary; B1: broader topics with reasons; B2: abstract/discussion vocabulary |
| 6 | **Realistic situation** | Scenario is plausible in Austrian integration context | Everyday life, work, housing, health, education — not fictional or culturally inappropriate |
| 7 | **Answerability** | Task can be completed in allotted time | `estimatedTime` / exam duration realistic for level and part count |
| 8 | **Scoring clarity** | ExaminerMind or human reviewer can apply consistent criteria | `examinerChecks`, `mandatoryTopics`, `reportFields` defined; expected elements listed |
| 9 | **No misleading instructions** | Task does not imply official ÖIF certification or guaranteed pass | No "Sie bestehen die Prüfung" language; AI disclaimer alignment |
| 10 | **No contradiction with other models** | Same skill/level models do not conflict | Cross-check against active models same `level + skill`; conflict check required (Section 5) |

### 3.2 Review Process (Target Workflow)

```
Author creates/edits model → status: draft
        ↓
Admin self-review against Section 3.1 → status: needs_review (optional) or training_only
        ↓
Second admin or designated reviewer completes Admin Checklist (Section 9)
        ↓
Conflict check against Examiner Council Rules (Section 5)
        ↓
Pass → ai_exam_ready OR human_verified
Fail → weak_model (with documented reason) OR remains draft
```

### 3.3 Review Evidence Required

Each promotion to `ai_exam_ready` or `human_verified` must record:

- Reviewer identity (admin email / user ID)
- Review date (`reviewed_at`)
- Checklist completion (Section 9)
- Level and skill confirmation
- Any noted exceptions or conditions

### 3.4 Content-Type-Specific Review Notes

**Admin CMS items (`type: schreiben`, `lesen`, `horen`, etc.):**
- `solution` must not contradict `content` task requirements
- `confirmations` count must match number of task bullet points
- Published items used in `DatabaseScreen` and exam builders

**AI-Prüfer models:**
- `shortPrompt` reviewed for OpenAI safety and level-appropriate German
- `followUpRules` must not contradict `examinerRules`
- `service` array must match intended use (`premiumExam`, `weeklyPlan`, `einstufungstest`)

**Knowledge files:**
- Each `examinerChecks` entry must map to at least one `expectedElements` item
- Version increment required on any check change

---

## 4. Model Status System

### 4.1 Status Definitions

This specification extends the current Admin CMS statuses (`draft`, `review`, `published`, `archived`) and adds AI-specific lifecycle statuses for all content types.

| Status | Code | Meaning | Student visible | AI premium exam | Training modules |
|--------|------|---------|-----------------|-----------------|------------------|
| Draft | `draft` | Work in progress; not reviewed | No | No | No |
| Training only | `training_only` | Approved for practice/Database/Akademie only | Yes (if published flag set) | No | Yes |
| Needs review | `needs_review` | Flagged for quality review; may have open issues | No | No | No |
| AI exam ready | `ai_exam_ready` | Passed checklist; eligible for AI evaluation | Per `visibleToStudents` | Yes | Yes |
| Human verified | `human_verified` | Reviewed by qualified human; highest trust | Per policy | Yes | Yes |
| Weak model | `weak_model` | Known quality issue; blocked from premium AI | Optional (training if safe) | **No** | Conditional |
| Archived | `archived` | Retired; kept for audit history | No | No | No |

### 4.2 Mapping from Current Implementation

| Current state | Target status | Notes |
|---------------|---------------|-------|
| Admin CMS `draft` | `draft` | Direct map |
| Admin CMS `review` | `needs_review` | Rename semantically |
| Admin CMS `published` (CMS only) | `training_only` until AI checklist passed | Publishing ≠ AI-ready |
| Admin CMS `archived` | `archived` | Direct map |
| AI-Prüfer `visibleToStudents: false` | `draft` or `needs_review` | Default library entries |
| AI-Prüfer `visibleToStudents: true` | Requires minimum `training_only` | Not sufficient for premium AI alone |
| Static model `status: "preview"` | `needs_review` | e.g. `modelsA2.js` preview entries |
| No status field (AI-Prüfer) | `draft` | Default for new saves in `AIPrueferScreen` |

### 4.3 Status Transition Rules

| From | To | Who | Condition |
|------|-----|-----|-----------|
| `draft` | `needs_review` | Admin | Submit for review |
| `draft` | `training_only` | Admin | Checklist passed for training use only |
| `needs_review` | `ai_exam_ready` | Admin | Full checklist + conflict check pass |
| `needs_review` | `weak_model` | Admin | Quality failure documented |
| `needs_review` | `draft` | Admin | Return to author |
| `ai_exam_ready` | `human_verified` | Admin / Examiner | Human sign-off recorded |
| `ai_exam_ready` | `weak_model` | Admin | Post-deployment issue found |
| `ai_exam_ready` | `archived` | Admin | Retire model |
| `training_only` | `ai_exam_ready` | Admin | Upgrade after AI checklist |
| `weak_model` | `needs_review` | Admin | Issue remediated |
| `weak_model` | `archived` | Admin | Permanently retire |
| Any | `archived` | Admin | Retire (preserves history) |

**Irreversible without review:** `human_verified` → `weak_model` requires documented incident and admin activity log entry.

### 4.4 Status Display (Future)

Admin surfaces should show status badges analogous to `StatusBadge` in `AdminScreen.jsx`:

| Status | Badge |
|--------|-------|
| `draft` | 📝 Draft |
| `training_only` | 📚 Training |
| `needs_review` | 🔍 Needs Review |
| `ai_exam_ready` | 🤖 AI Ready |
| `human_verified` | ✅ Human Verified |
| `weak_model` | ⚠️ Weak |
| `archived` | 📦 Archived |

---

## 5. Examiner Council Rules

This section defines governance for **examiner rule sets** — the `examinerRules[]`, `followUpRules[]`, and related configuration in AI-Prüfer models and knowledge files. It complements the runtime **Examiner Council** (`ExaminerCouncil.js` — six judges) and global flags in `examinerRules.js` (`NEVER_GUESS`, `REQUIRE_EVIDENCE`, etc.).

### 5.1 Rule Categories

| Category | Source | Example |
|----------|--------|---------|
| Global behaviour | `examinerRules.js` | `REQUIRE_EVIDENCE: true` |
| Model examiner rules | `examinerRules[]` in AI-Prüfer | "Stelle immer nur eine Frage auf einmal." |
| Follow-up rules | `followUpRules[]` | `ifMissing: Herkunftsland` → ask prompt |
| Upgrade/downgrade rules | `upgradeRules[]`, `downgradeRules[]` | Adaptive difficulty |
| Knowledge checks | `examinerChecks[]` in knowledge files | `B1-SP-002 Picture Description` |
| Critical rules | `DecisionEngine.applyCriticalRules()` | Hard score adjustments |

### 5.2 Conflict Prevention Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| EC-001 | **No duplicate rules** | Same `level + skill + rule text hash` cannot exist in two active models |
| EC-002 | **No contradictory rules** | Rules conflicting on same condition (e.g. "Korrigiere sofort" vs "Korrigiere nicht jeden Fehler") blocked at publish |
| EC-003 | **Rule priority levels** | See Section 5.3 |
| EC-004 | **Rule versioning** | Every rule change increments `examiner_rule_version`; prior version archived |
| EC-005 | **Human-reviewed override** | `human_verified` model rules override AI-suggested draft rules in same scope |
| EC-006 | **Rejected rules documented** | Rejected rule proposals stored with reason; never silently deleted |

### 5.3 Rule Priority Levels

When multiple rules apply to the same evaluation context, resolve in this order (highest first):

| Priority | Level | Source |
|----------|-------|--------|
| 1 | **Critical** | `DecisionEngine` critical rules; safety and task-completion gates |
| 2 | **Human verified** | Rules in models with status `human_verified` |
| 3 | **Examiner Lab extracted** | Rules created from approved Examiner Lab samples (`source_sample_id`) |
| 4 | **AI exam ready** | Rules in models with status `ai_exam_ready` |
| 5 | **Global** | `ExaminerRules` constants |
| 6 | **Training only** | Rules in `training_only` models — not used in premium AI |
| 7 | **Draft / suggested** | Unapproved AI-suggested rules — never applied in production evaluation |

### 5.4 Contradiction Detection (Target)

Before status promotion to `ai_exam_ready`, run automated conflict check:

| Check | Method |
|-------|--------|
| Duplicate text | Hash compare across active rules same level/skill |
| Opposite imperatives | Pattern match: "nicht korrigieren" vs "sofort korrigieren" |
| Level mismatch | Rule text references wrong level (e.g. "B2" in A2 model) |
| Follow-up vs examiner | `followUpRules` trigger contradicts `examinerRules` behaviour |
| Judge spread | Mirror runtime: if model expects high grammar but low task scores, flag for review (aligns with `DecisionEngine.detectConflicts()`) |

**Runtime conflict types today** (from `decisionEngine.js`):

- `strong_language_weak_task` — grammar/structure score ≥ 35 points above task completion
- Additional vocabulary/reasoning divergence checks

Governance conflict check should flag models likely to produce these runtime conflicts.

### 5.5 Rule Versioning

| Field | Purpose |
|-------|---------|
| `examiner_rule_version` | Integer; increment on any rule array change |
| `previous_version_id` | Link to archived rule snapshot |
| `change_summary` | Admin description of what changed |
| `changed_by` | Admin user ID |
| `changed_at` | Timestamp |

When `examiner_rule_version` changes on an active model:

1. Previous snapshot moved to `archived` rule record
2. Dependent premium exams use new version from next session only
3. `admin_activity_log` entry created

### 5.6 Rejected Rule Documentation

When admin rejects a proposed rule (from Examiner Lab or AI suggestion):

| Required field | Content |
|----------------|---------|
| `rejected_rule_text` | Full proposed rule |
| `rejection_reason` | Why rejected |
| `rejected_by` | Admin ID |
| `rejected_at` | Timestamp |
| `source_sample_id` | If from Examiner Lab |
| `alternative_rule_id` | If replaced by different rule |

Rejected rules are never applied and remain searchable for audit.

---

## 6. Weak or Problematic Models

### 6.1 Definition of Weak Model

A model is marked `weak_model` when any of the following apply:

| Trigger | Example |
|---------|---------|
| Failed quality review | Level vocabulary too advanced for A2 |
| Runtime quality signal | Repeated low-confidence evaluations linked to this model ID |
| Examiner Lab verdict | Human marked AI scoring wrong for this model context |
| Contradiction unresolved | Conflict check failed and not remediated within 14 days |
| Student confusion report | Support documents misleading task (admin confirmed) |
| Missing required metadata | No `skill`, `level`, or scoring criteria |

### 6.2 Weak Model Behaviour

| Surface | Behaviour |
|---------|-----------|
| **Premium AI exams** (`premiumExamBuilder.js`, `PremiumExamSessionScreen`) | Model **excluded** from exam assembly |
| **AI-Prüfer selection** | Status badge ⚠️; cannot set to `ai_exam_ready` without remediation |
| **OpenAI prompts** (`modelRouter` engines using model context) | Blocked for weak model IDs |
| **Training modules** (Practice, Database, Lesen, Hören) | Allowed **only if** admin sets `training_safe: true` and documents reason |
| **Weekly plan** | Excluded from `weeklyPlanLibrary` task selection unless training_safe |
| **Placement test** | Excluded — placement requires highest quality bar |

### 6.3 Required Weak Model Metadata

When setting `weak_model`, admin must record:

| Field | Required |
|-------|----------|
| `weakness_reason` | Yes — category + description |
| `weakness_category` | Yes — one of: `level_mismatch`, `unclear_task`, `scoring_issue`, `contradiction`, `runtime_conflicts`, `missing_metadata`, `other` |
| `identified_by` | Yes — admin user ID |
| `identified_at` | Yes — timestamp |
| `training_safe` | Yes — boolean |
| `remediation_notes` | No — how to fix |
| `linked_sample_id` | No — Examiner Lab sample if applicable |

### 6.4 Promotion from Weak Model

```
weak_model → needs_review → (checklist + conflict check) → ai_exam_ready
```

Minimum remediation evidence:

- Documented fix to identified issue
- Re-review by different admin than `identified_by` (recommended)
- If scoring issue: linked Examiner Lab sample with `human_verified` rule update

---

## 7. AI Use Eligibility

### 7.1 Eligibility Matrix

A model may be used by AI evaluation engines (`runExaminerMind`, `runModelRouter`, `premiumExamBuilder`) **only if all conditions pass**:

| # | Condition | Verification |
|---|-----------|--------------|
| 1 | Status is `ai_exam_ready` **or** `human_verified` | `model_status` field |
| 2 | Not `weak_model` or `archived` | Status check |
| 3 | Has `level` ∈ {A2, B1, B2} | Required metadata |
| 4 | Has `skill` declared | e.g. `selbstvorstellung`, `bildbeschreibung`, `schreiben` |
| 5 | Has clear task text | `title` + (`studentPreview` or `shortPrompt` or `content`) |
| 6 | Has expected answer type defined | `mandatoryTopics`, `examinerQuestions`, or `expectedElements` mapping |
| 7 | Has scoring criteria | `reportFields`, `examinerChecks`, or judge-compatible rubric |
| 8 | `conflict_check_status = passed` | Section 5.4 |
| 9 | No unresolved contradictions | `conflict_check_status ≠ failed` |
| 10 | Privacy safe | No request for unnecessary PII in prompts |

### 7.2 Eligibility by Service

| Service | Minimum status | Additional requirements |
|---------|----------------|------------------------|
| `premiumExam` | `ai_exam_ready` | In `service[]` array; not weak |
| `einstufungstest` / placement | `human_verified` recommended; `ai_exam_ready` minimum | `placementUse: true` if placement-weighted |
| `weeklyPlan` | `ai_exam_ready` | `weeklyPlanUse` configured |
| `reportBuilder` (OpenAI) | Active exam using eligible model | Credit check server-side |
| Static training (no AI) | `training_only` or higher | No AI gate |

### 7.3 Current Gap

Today `premiumExamBuilder.js` selects models from static banks and `getAdminByType()` filtered by `status === 'published'` only. It does **not** check AI-Prüfer status or `weak_model`. Future implementation must add eligibility filter before exam assembly — **without changing current behaviour until backend enforces this spec**.

### 7.4 Blocked AI Use Response (Target API)

When ineligible model requested:

```json
{
  "error": {
    "code": "MODEL_NOT_AI_ELIGIBLE",
    "message": "Dieses Modell ist nicht für AI-Prüfungen freigegeben.",
    "modelId": "a2-self-001",
    "currentStatus": "draft",
    "requiredStatus": ["ai_exam_ready", "human_verified"]
  }
}
```

---

## 8. Examiner Lab Connection

The Examiner Lab connects real evaluation outcomes to permanent rule improvement. Current implementation: `errorLearningEngine.js` auto-logs cases; `ExaminerLabScreen.jsx` displays them; Correct/Wrong/New Rule buttons exist but logic is not implemented.

### 8.1 Sample Lifecycle

```
ExaminerMind evaluation
        ↓
DecisionEngine: confidence < 65 OR warnings OR conflicts
        ↓
saveAIError() → austriaPathAIErrorLog (ephemeral, max 500)
        ↓
Admin views ExaminerLabScreen
        ↓
Admin MANUALLY selects case → examiner_lab_samples (DB)
        ↓
Human review workflow (below)
        ↓
Optional: examiner_rules created/updated
```

**Privacy:** Auto-logged errors are not long-term student records. Only admin-selected samples persist (per `AI-Privacy-Policy.md`).

### 8.2 Human Review Workflow

For each selected sample in Examiner Lab:

| Step | Actor | Action | Record |
|------|-------|--------|--------|
| 1 | Admin | Select sample from error log | `examiner_lab_samples` row created |
| 2 | Admin / Examiner | Record **AI decision** | `ai_score`, `ai_confidence`, `ai_level`, `judge_reports_summary` |
| 3 | Reviewer | Record **human correction** | `human_verdict`: `correct` or `wrong`; `human_score`; `human_notes` |
| 4 | Reviewer | If wrong: document **disagreement reason** | `disagreement_reason` category + text |
| 5 | Admin | Propose **new examiner rule** | Draft rule linked to `source_sample_id` |
| 6 | Admin | **Approve or reject** rule proposal | Approved → `examiner_rules.status = active`; Rejected → rejection record (Section 5.6) |
| 7 | System | **Permanent rule extraction** | `rule_created = true` on sample; `examiner_rule_version` incremented |

### 8.3 Disagreement Reason Categories

| Category | When to use |
|----------|-------------|
| `task_completion_missed` | AI under-scored task fulfillment |
| `task_completion_over_scored` | AI credited incomplete answer |
| `level_mismatch` | AI applied wrong level standard |
| `grammar_weight_wrong` | Grammar judge disproportionate |
| `vocabulary_misread` | Keyword detection error |
| `follow_up_rule_error` | Wrong follow-up applied |
| `conflict_mishandled` | `detectConflicts` case incorrectly resolved |
| `other` | Free-text in `human_notes` |

### 8.4 Examiner Lab UI Mapping (Future)

Current `ExaminerLabScreen.jsx` buttons map to target actions:

| Button | Target action |
|--------|---------------|
| ✅ Correct | Set `human_verdict = correct`; close sample |
| ❌ Wrong | Set `human_verdict = wrong`; require `disagreement_reason` |
| ➕ Neue Regel | Open rule proposal form → `examiner_rules` draft |

### 8.5 Impact on Model Status

| Lab outcome | Model impact |
|-------------|--------------|
| AI correct | No model change; sample archived |
| AI wrong + rule approved | Source model may upgrade; conflicting model may → `weak_model` |
| AI wrong + no rule change | Flag model → `needs_review` |
| Repeated wrong for same model ID | Auto-suggest `weak_model` (admin confirms) |

---

## 9. Admin Review Checklist

Complete this checklist before publishing any model to `ai_exam_ready` or `human_verified`. Store completion record with reviewer and timestamp.

### 9.1 Content Quality

- [ ] Task text is grammatically correct German
- [ ] Instructions are clear and unambiguous
- [ ] All task bullet points are answerable in allotted time
- [ ] Scenario is realistic for Austrian integration context
- [ ] No misleading claims about official ÖIF results
- [ ] `solution` / model answer aligns with task (if provided)
- [ ] No offensive, discriminatory, or inappropriate content

### 9.2 Exam Style

- [ ] Format matches ÖIF-style section from `examStructure.js`
- [ ] Speaking tasks: follow-up behaviour matches section `allowFollowUp`
- [ ] Writing tasks: appropriate register (formal email, message, etc.)
- [ ] Listening/reading: questions match passage content
- [ ] Bildbeschreibung: `imagePrompt` or image reference is coherent

### 9.3 Level Match

- [ ] Declared `level` matches grammar and vocabulary difficulty
- [ ] `difficulty` (leicht/mittel/schwer) consistent with level norms
- [ ] A2: short sentences, everyday vocabulary
- [ ] B1: reasons, experiences, planning language
- [ ] B2: argumentation, abstract topics, complex connectors
- [ ] Cross-checked against sibling models same level — no contradictions

### 9.4 Grammar Match

- [ ] `grammar[]` tags accurate for required structures
- [ ] No structures taught beyond declared level
- [ ] `satzbau` / `konnektoren` lists appropriate
- [ ] ExaminerMind knowledge file checks align (if skill mapped)

### 9.5 Scoring Clarity

- [ ] `mandatoryTopics` or `expectedElements` defined
- [ ] `reportFields` listed for AI report output
- [ ] `examinerRules` state evaluation behaviour clearly
- [ ] `followUpRules` do not contradict scoring intent
- [ ] Reviewer confirms ExaminerMind judges can score this task type

### 9.6 AI Readiness

- [ ] `shortPrompt` reviewed for OpenAI use (level-appropriate, no injection patterns)
- [ ] `service[]` correctly declares intended AI surfaces
- [ ] `preparationTime` and `estimatedTime` set
- [ ] Conflict check passed (`conflict_check_status = passed`)
- [ ] Status set to `ai_exam_ready` minimum
- [ ] For placement: prefer `human_verified`

### 9.7 Privacy Safety

- [ ] Task does not require unnecessary personal data (full address, ID numbers, etc.)
- [ ] `shortPrompt` does not instruct storage of sensitive data
- [ ] Sample excerpts for Examiner Lab truncated to 2000 chars max
- [ ] Aligns with `AI-Privacy-Policy.md` — reports only, not full sessions

### 9.8 Checklist Sign-Off

| Field | Value |
|-------|-------|
| `reviewer_id` | Admin user UUID |
| `reviewed_at` | ISO timestamp |
| `checklist_version` | `2026.07` |
| `target_status` | `ai_exam_ready` or `human_verified` |
| `exceptions` | Free text if any item waived with justification |

---

## 10. Backend and Data Notes

Implementation deferred to backend phase. This section maps governance fields to database design in `AustriaPath_Database_Schema.md`.

### 10.1 Extended Fields for `examiner_rules`

Add to `examiner_rules` table (currently has `status`: `draft`, `active`, `deprecated`):

| Column | Type | Purpose |
|--------|------|---------|
| `model_status` | ENUM | `draft`, `training_only`, `ai_exam_ready`, `needs_review`, `weak_model`, `archived`, `human_verified` |
| `review_notes` | TEXT | Admin review comments |
| `reviewer_id` | UUID FK → users | Who approved |
| `reviewed_at` | TIMESTAMPTZ | When approved |
| `examiner_rule_version` | INTEGER | Rule version (existing); increment on change |
| `conflict_check_status` | ENUM | `pending`, `passed`, `failed`, ` waived` |
| `conflict_check_at` | TIMESTAMPTZ | Last check run |
| `weakness_reason` | TEXT | Required if `model_status = weak_model` |
| `weakness_category` | VARCHAR(50) | Category from Section 6.1 |
| `training_safe` | BOOLEAN | Allow training use when weak |
| `checklist_version` | VARCHAR(20) | e.g. `2026.07` |
| `checklist_completed_at` | TIMESTAMPTZ | |

**PostgreSQL enum extension:**
```sql
CREATE TYPE model_status AS ENUM (
  'draft',
  'training_only',
  'ai_exam_ready',
  'needs_review',
  'weak_model',
  'archived',
  'human_verified'
);

CREATE TYPE conflict_check_status AS ENUM (
  'pending',
  'passed',
  'failed',
  'waived'
);
```

### 10.2 Extended Fields for `content_items`

Admin CMS table (Appendix 9.4 in Database Schema):

| Column | Type | Purpose |
|--------|------|---------|
| `model_status` | model_status | Unified lifecycle (maps from `status`) |
| `review_notes` | TEXT | |
| `reviewer_id` | UUID FK | |
| `reviewed_at` | TIMESTAMPTZ | |
| `conflict_check_status` | conflict_check_status | |
| `weakness_reason` | TEXT | |
| `training_safe` | BOOLEAN | |

**Legacy mapping:** Keep `status` column during migration; `published` + no AI checklist = `training_only`.

### 10.3 New Table: `examiner_rule_rejections`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | |
| `proposed_rule_text` | TEXT | |
| `rejection_reason` | TEXT | |
| `rejected_by` | UUID FK → users | |
| `rejected_at` | TIMESTAMPTZ | |
| `source_sample_id` | UUID FK → examiner_lab_samples | |
| `alternative_rule_id` | UUID FK → examiner_rules | |

### 10.4 New Table: `model_review_checklists`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | |
| `content_type` | VARCHAR(30) | `examiner_rule`, `content_item`, `static_model` |
| `content_id` | UUID | Polymorphic reference |
| `checklist_version` | VARCHAR(20) | |
| `responses` | JSONB | Section 9 checklist booleans + notes |
| `reviewer_id` | UUID FK | |
| `target_status` | model_status | |
| `completed_at` | TIMESTAMPTZ | |

### 10.5 Extended Fields for `examiner_lab_samples`

Add from Section 8:

| Column | Type | Purpose |
|--------|------|---------|
| `disagreement_reason` | VARCHAR(50) | Category |
| `disagreement_notes` | TEXT | Detail |
| `proposed_rule_id` | UUID FK → examiner_rules | Draft rule from sample |
| `rule_approval_status` | ENUM | `pending`, `approved`, `rejected` |
| `rule_approved_by` | UUID FK | |
| `rule_approved_at` | TIMESTAMPTZ | |

### 10.6 API Endpoints (Future)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/models?status=&level=&skill=` | List with governance fields |
| PATCH | `/admin/models/:id/status` | Transition with validation |
| POST | `/admin/models/:id/conflict-check` | Run EC-001–EC-002 checks |
| POST | `/admin/models/:id/checklist` | Submit Section 9 checklist |
| GET | `/admin/examiner-lab/samples` | List selected samples |
| POST | `/admin/examiner-lab/samples` | Manual select from error log |
| PATCH | `/admin/examiner-lab/samples/:id/review` | Human verdict + disagreement |
| POST | `/admin/examiner-rules/:id/reject` | Document rejected rule |

### 10.7 Enforcement Points

| Runtime | Enforcement |
|---------|-------------|
| `premiumExamBuilder.js` | Filter models: `model_status IN (ai_exam_ready, human_verified)` |
| `AIPrueferScreen` save | Default new models to `draft`; block `ai_exam_ready` without checklist API |
| `AdminScreen` publish | Map `published` → `training_only` unless AI checklist complete |
| `runModelRouter` | Server rejects prompts referencing ineligible model IDs |
| `ExaminerLabScreen` | Wire buttons to review API |

---

## 11. Current Codebase Connections

### 11.1 File Reference Map

| Specification section | Current file | Current behaviour | Target change |
|----------------------|--------------|-------------------|---------------|
| Content Quality | `AdminScreen.jsx` | Manual CMS; 4 statuses | Add checklist gate before AI use |
| Model Status | `AIPrueferScreen.jsx` | No status field | Add `model_status` display and transitions |
| AI Library seed | `aiPremiumLibrary.js` | All `visibleToStudents: false` | Seed as `draft` or `needs_review` |
| Static models | `modelsA2.js` | Some `status: "preview"` | Map to `needs_review` |
| Exam assembly | `premiumExamBuilder.js` | Uses `published` admin + static banks | Add AI eligibility filter |
| Examiner Council runtime | `examinerCouncil.js` | Six judges | Unchanged |
| Global rules | `examinerRules.js` | Boolean flags | Unchanged |
| Conflict detection | `decisionEngine.js` | Runtime conflicts → error log | Feed Examiner Lab workflow |
| Error log | `errorLearningEngine.js` | Auto-save max 500 | Ephemeral; manual promote to samples |
| Examiner Lab UI | `ExaminerLabScreen.jsx` | Display only | Wire review workflow |
| Knowledge | `knowledge/b1/speakingKnowledge.js` etc. | Code-based checks | Version + review on change |
| ÖIF structure | `examStructure.js` | Section map | Reference for review checklist |
| Database | `AustriaPath_Database_Schema.md` | `examiner_rules`, `content_items` | Extend with Section 10 fields |
| Privacy | `AI-Privacy-Policy.md` | Sample selection policy | Examiner Lab alignment |
| Technical spec | `AustriaPath_Technical_Specification.md` | Examiner Lab API sketch | Extend with governance endpoints |

### 11.2 Governance vs Runtime Examiner Council

| Concept | Layer | Location |
|---------|-------|----------|
| **Examiner Council (runtime)** | Evaluation pipeline | `ExaminerCouncil.js` — six judges score answers |
| **Examiner Council Rules (governance)** | Content quality | This document — rule conflict prevention |
| **Examiner Lab** | Improvement loop | Connects runtime conflicts to rule updates |

These three layers work together but must not be conflated in implementation.

### 11.3 Implementation Phases (Governance Only)

| Phase | Deliverable | Depends on |
|-------|-------------|------------|
| G1 | This specification approved | — |
| G2 | Database columns + enums (Section 10) | Phase 3 backend |
| G3 | Admin checklist UI in `AIPrueferScreen` / `AdminScreen` | G2 |
| G4 | Conflict check service | G2 |
| G5 | Examiner Lab review workflow | G2, `examiner_lab_samples` API |
| G6 | Premium exam eligibility filter | G2, G4 |
| G7 | Bulk review of seed content (`aiPremiumLibrary`, static models) | G3 |

---

## Document Cross-References

| Document | Relationship |
|----------|--------------|
| `AustriaPath_Database_Schema.md` | Table definitions for governance fields |
| `AustriaPath_Technical_Specification.md` | Examiner Lab APIs, AI architecture |
| `AI-Privacy-Policy.md` | Sample retention and ephemeral error log |
| `AI-Transparency.md` | Examiner Lab purpose disclosure |
| `Launch-Checklist.md` | Pre-launch content review sign-off |

---

**Document owner:** AustriaPath Content & Engineering  
**Checklist version:** 2026.07  
**Next review:** Before first premium AI exam public launch or any bulk content import
