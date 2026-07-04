# AustriaPath Knowledge Base

**Document version:** 1.0  
**Last updated:** 4 July 2026  
**Status:** Official project knowledge base — documentation only  
**Audience:** Developers, operators, examiners, legal/compliance reviewers  

---

## About This Document

This is the **single source of truth** for AustriaPath architecture, flows, contracts, and compliance. It consolidates the live SPA implementation with target production architecture documented in companion specs.

**This document does not authorize implementation.** Examiner Council recommendations (EC-01–EC-22) remain in approval pending status per [AustriaPath_ExaminerCouncil_DecisionGuide.md](./AustriaPath_ExaminerCouncil_DecisionGuide.md).

### Companion Documents

| Document | Role |
|----------|------|
| [AustriaPath_Technical_Specification.md](./AustriaPath_Technical_Specification.md) | Master engineering spec, API design |
| [AustriaPath_Database_Schema.md](./AustriaPath_Database_Schema.md) | PostgreSQL blueprint |
| [AustriaPath_ExaminerCouncil_Review.md](./AustriaPath_ExaminerCouncil_Review.md) | Expert examiner/AI review |
| [AustriaPath_ExaminerCouncil_DecisionGuide.md](./AustriaPath_ExaminerCouncil_DecisionGuide.md) | EC approval gate |
| [AustriaPath_Exam_Content_Quality_and_Examiner_Council.md](./AustriaPath_Exam_Content_Quality_and_Examiner_Council.md) | Content governance |
| [AustriaPath_Recommendations.md](./AustriaPath_Recommendations.md) | Platform launch recommendations |
| [Backend Security Requirements.md](./Backend Security Requirements.md) | Required backend security |
| [GDPR-Readiness-Review.md](./GDPR-Readiness-Review.md) | Privacy inventory |
| [AI-Privacy-Policy.md](./AI-Privacy-Policy.md) | AI data minimization |
| [AI-Transparency.md](./AI-Transparency.md) | User-facing AI disclosure |
| [Launch-Checklist.md](./Launch-Checklist.md) | Pre-launch sign-off |

### Document Convention

Each section includes:

- **Purpose** — why this area exists  
- **Connected components** — runtime relationships  
- **Related files** — codebase and doc paths  
- **Future backend notes** — target production behaviour (not yet implemented)

---

## Table of Contents

1. [Overall System Architecture](#1-overall-system-architecture)
2. [Complete User Journey](#2-complete-user-journey)
3. [Authentication Flow](#3-authentication-flow)
4. [Roles & Permissions](#4-roles--permissions)
5. [AI Architecture](#5-ai-architecture)
6. [Exam Architecture (A2 / B1 / B2)](#6-exam-architecture-a2--b1--b2)
7. [AI Evaluation Flow](#7-ai-evaluation-flow)
8. [Prompt Architecture](#8-prompt-architecture)
9. [JSON Contracts](#9-json-contracts)
10. [API Contracts](#10-api-contracts)
11. [Database Overview](#11-database-overview)
12. [AI Report Structure](#12-ai-report-structure)
13. [Weekly Plan Flow](#13-weekly-plan-flow)
14. [Placement Test Flow](#14-placement-test-flow)
15. [Premium Exam Flow](#15-premium-exam-flow)
16. [Examiner Lab Concept](#16-examiner-lab-concept)
17. [Examiner Rules Lifecycle](#17-examiner-rules-lifecycle)
18. [AI Error Learning Engine](#18-ai-error-learning-engine)
19. [Security Architecture](#19-security-architecture)
20. [Privacy & GDPR](#20-privacy--gdpr)
21. [EU AI Act Article 4 Compliance](#21-eu-ai-act-article-4-compliance)
22. [Deployment Architecture](#22-deployment-architecture)
23. [Monitoring & Logging](#23-monitoring--logging)
24. [Backup & Disaster Recovery](#24-backup--disaster-recovery)
25. [Launch Checklist](#25-launch-checklist)

---

## 1. Overall System Architecture

### Purpose

Define how AustriaPath delivers German/ÖIF exam preparation as a React SPA with client-side ExaminerMind evaluation, optional OpenAI LLM assistance, and planned PostgreSQL backend.

### Connected components

```
Browser (React/Vite SPA)
  ├── App.jsx (tab router, bootstrap gates)
  ├── Screens (training, premium, admin)
  ├── ExaminerMind (rule judges, Decision Engine)
  ├── localStorage (interim persistence)
  └── secureOpenAI → /api/ai/openai (Vercel serverless)

Target production:
  ├── Backend API (auth, users, subscriptions, reports)
  ├── PostgreSQL
  ├── Stripe
  └── Authenticated OpenAI proxy
```

### Related files

| Layer | Path |
|-------|------|
| Entry | `src/main.jsx`, `src/app/App.jsx` |
| Auth | `src/app/userAccess.js`, `src/config/authConfig.js` |
| AI core | `src/ai/examinerMind/` |
| Security | `src/security/` |
| Legal | `src/legal/` |
| Serverless | `api/ai/openai.js` |
| Hosting | `vercel.json`, `vite.config.ts` |
| Spec | `AustriaPath_Technical_Specification.md` §1 |

### Future backend notes

Replace `localStorage` as system of record with PostgreSQL + REST API. Frontend becomes API client; ExaminerMind may remain client-side initially or move to `POST /ai/evaluate`. OpenAI proxy must require session auth and credit checks.

---

## 2. Complete User Journey

### Purpose

Map end-to-end paths from first visit to learning, premium use, and admin operations.

### Connected components

**Bootstrap sequence** (`App.jsx`):

1. Legal page overlay (`legalView`) if viewing Impressum/Datenschutz/etc.
2. `OnboardingScreen` — language/level intro (not persisted across reload in current code)
3. `LegalConsentScreen` — if `needsLegalConsent()` (`src/legal/consent.js`)
4. Auth — `AuthWelcomeScreen` → Login / Register / Forgot password
5. Main app — bottom nav: Home, Üben, Akademie, Datenbank, Profil

**Student paths:** Register → Home → Practice/Akademie (level select) → modules (Lesen, Hören, Schreiben, Sprechen, Bild, Planung) → Profile → Premium (`SubscriptionScreen`) → Placement / Weekly Plan / Premium Exam → reports in Profile.

**Admin paths:** Login (admin email) → `admin` tab → CMS, User Management, links to AI-Prüfer and Examiner Lab.

### Related files

| Journey stage | Files |
|---------------|-------|
| Bootstrap | `App.jsx`, `OnboardingScreen.jsx`, `LegalConsentScreen.jsx` |
| Auth | `AuthWelcomeScreen.jsx`, `LoginScreen.jsx`, `RegisterScreen.jsx` |
| Training | `HomeScreen.jsx`, `PracticeScreen.jsx`, `LesenScreen.jsx`, etc. |
| Premium | `SubscriptionScreen.jsx`, `ProfileScreen.jsx` |
| Admin | `AdminScreen.jsx`, `UserManagementScreen.jsx` |

### Future backend notes

Persist onboarding completion server-side. Sync journey state (level, placement, subscription) via `GET /auth/me`. Single device + multi-device continuity requires backend session.

---

## 3. Authentication Flow

### Purpose

Identify users, enforce admin/student roles, and gate app access. **Current:** client-side only. **Target:** server-side sessions.

### Connected components

```
Register/Login UI
  → authenticateUser() / registerStudentUser()  [userAccess.js]
  → austriaPathUsers (localStorage)
  → syncSessionUser() → austriaPathCurrentUser, isLoggedIn, session integrity
  → validateSessionOnStartup() on app load
```

**Admin identity:** `isAdminAccount()` = configured admin email + `role: admin` + `status: approved` (`authConfig.js`).

**Blocked users:** `status: blocked` → login rejected, session cleared.

### Related files

| File | Role |
|------|------|
| `src/app/userAccess.js` | Login, register, session, users registry |
| `src/config/authConfig.js` | `ADMIN_EMAIL`, admin seed password |
| `src/config/accessControl.js` | Default credits, status enums |
| `src/security/sessionIntegrity.js` | Tamper fingerprint |
| `src/security/routeGuard.js` | Admin tab ACL |
| `src/app/screens/LoginScreen.jsx` | Login UI |
| `src/app/screens/RegisterScreen.jsx` | Register UI |

**Storage keys:** `austriaPathUsers`, `austriaPathCurrentUser`, `currentUser`, `isLoggedIn`, `austriaPathSessionIntegrity`

### Future backend notes

Implement `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me`. Passwords hashed (Argon2id/bcrypt). Remove plaintext passwords from `localStorage`. Remove `VITE_ADMIN_INITIAL_PASSWORD` from production bundles. Email verification and password reset APIs.

---

## 4. Roles & Permissions

### Purpose

Control who can access training, premium AI, and admin functions.

### Connected components

| Role | How determined | Access |
|------|----------------|--------|
| **Student** | Default for non-admin email | Training, profile, premium (if subscription/credits) |
| **Premium student** | Not separate role — `subscription` + `permissions` on user | AI exam, weekly plan, reports per plan |
| **Admin** | Admin email + role + approved | CMS, user management, Examiner Lab, AI-Prüfer |
| **Examiner** (future) | `role: examiner` (planned) | Examiner Lab review only |

**Premium permissions** from `getPermissionsByPlan()` in `subscriptionEngine.js`: `placementTest`, `aiExam`, `weeklyPlan`, `reports`, `writingAI`, `imageAI`, `speakingAI`, `readingAI`, `listeningAI`.

**AI credits:** `ACCESS_CONTROL.aiCosts` — e.g. `ai_exam: 2`, `report_builder: 1`.

**Admin-only tabs:** `admin`, `userManagement`, `examinerLab`, `aiPruefer` (`routeGuard.js`).

### Related files

| File | Role |
|------|------|
| `src/config/authConfig.js` | Admin detection |
| `src/data/subscriptionEngine.js` | Plans, permissions, credits |
| `src/utils/aiCredits.js` | Credit consume/check |
| `src/security/routeGuard.js` | Tab guards |

### Future backend notes

Enforce all permissions server-side on API routes. Ignore client `premiumActive`, `isPremiumUser` flags. Separate admin permissions: CMS, users, billing, Examiner Lab.

---

## 5. AI Architecture

### Purpose

Describe ExaminerMind (rule-based council), OpenAI LLM routing, and how they coexist.

### Connected components

```
runExaminerMind() → Brain.think()
  → ExamStructure + ExaminerKnowledge (per level/skill)
  → ExaminerCouncil (6 judges)
  → DecisionEngine
  → optional AuditEngine (DEEP mode / needsDeepReview)
  → StudentProfileEngine (if saveToProfile)

runModelRouter() → rule OR openai
  → callOpenAI() → requestOpenAIProxy() → api/ai/openai.js
```

**ExaminerMind modules:**

| Module | Version | Role |
|--------|---------|------|
| `Brain` | 1.1 | Coordinator |
| `ExaminerCouncil` | 2.0 | Six judges |
| `DecisionEngine` | 1.4 | Weighted score, conflicts, confidence |
| `AuditEngine` | 1.1 | Deep review flag |
| `StudentProfileEngine` | 1.1 | Progress aggregates |
| `modelRouter` | — | Engine → provider map |
| `errorLearningEngine` | — | Low-confidence log |

**Six judges:** TaskJudge, GrammarJudge, VocabularyJudge, StructureJudge, CommunicationJudge, ReasoningJudge — all rule-based (`src/ai/examinerMind/judges/`).

### Related files

| Path | Role |
|------|------|
| `src/ai/examinerMind/runExaminerMind.js` | Public entry |
| `src/ai/examinerMind/core/brain.js` | Coordinator |
| `src/ai/examinerMind/core/examinerCouncil.js` | Council |
| `src/ai/examinerMind/core/decisionEngine.js` | Final decision |
| `src/ai/examinerMind/learning/modelRouter.js` | Provider routing |
| `src/ai/examinerMind/knowledge/` | Level/skill rubrics |
| `src/security/secureOpenAI.js` | Browser OpenAI client |
| `api/ai/openai.js` | Serverless proxy |

**Known gaps (documented, not approved for fix):** See Examiner Council Review EC-02, EC-05, EC-07, EC-08.

### Future backend notes

Authenticated `/ai/completions` with credit deduction. Optional `POST /ai/evaluate` for server-side ExaminerMind. Token usage logging. No raw OpenAI payload to client.

---

## 6. Exam Architecture (A2 / B1 / B2)

### Purpose

Define ÖIF-style exam structure per level and how content maps to skills.

### Connected components

**Canonical structure** — `src/ai/examinerMind/knowledge/examStructure.js`:

| Level | Sections (skills) |
|-------|-------------------|
| A2 | writing, reading, listening, speaking |
| B1 | writing, reading, listening, speaking |
| B2 | writing, reading, listening, speaking |

Speaking parts (ÖIF-style): self-introduction, picture/graphic description, planning/discussion (level-dependent).

**Content sources:**

| Source | Use |
|--------|-----|
| `modelsA2.js`, `modelsb1/`, `modelsB2.js` | Static Schreiben models |
| `b1LesenModels`, `b2LesenModels`, `b1HorenModels`, etc. | Lesen/Hören |
| `a2Images`, `b1Images`, `b2Grafiken` | Bild/Grafik |
| `austriaPathAdminData` | Admin CMS published content |
| `aiPremiumLibrary.js` | AI-Prüfer seed models |
| `premiumExamBuilder.js` | Assembles premium exam parts |

**Exam type constant:** `OEIF` / `ÖIF` in models and ExaminerMind context.

### Related files

| File | Role |
|------|------|
| `src/ai/examinerMind/knowledge/examStructure.js` | ÖIF section map |
| `src/ai/examinerMind/knowledge/examinerKnowledge.js` | Level → skill knowledge index |
| `src/data/premiumExamBuilder.js` | Premium part assembly |
| `src/data/modelsA2.js` | A2 writing (incl. `preview` placeholders) |

### Future backend notes

`content_items` and `examiner_rules` tables (Database Schema). Model status governance (`ai_exam_ready`, `human_verified`). Block `preview`/empty models from premium assembly (EC-01, pending approval).

---

## 7. AI Evaluation Flow

### Purpose

Document the three distinct evaluation paths in the current SPA and how they differ.

### Connected components

**Path A — ExaminerMind (Premium Exam):**

```
PremiumExamSessionScreen → runExaminerMind per part (intended)
→ finishExam → runExaminerMind + runModelRouter(reportBuilder)
→ save to austriaPathAIReports
```

**Path B — OpenAI conversational (Intelligent Exam):**

```
IntelligentExamScreen → speech recognition → requestOpenAIProxy
→ conversationHistory → LLM response (no ExaminerMind)
```

**Path C — Training heuristics (Weekly AI Session):**

```
AISessionScreen → evaluateCurrentAnswer() (word count, Konnektoren markers)
→ strong/middle/weak → report to austriaPathAIReports
```

These paths produce **incomparable score semantics**. Decision Guide EC-06 and EC-22 recommend labelling (pending approval).

### Related files

| Path | Files |
|------|-------|
| A | `PremiumExamSessionScreen.jsx`, `runExaminerMind.js` |
| B | `IntelligentExamScreen.jsx`, `secureOpenAI.js` |
| C | `AISessionScreen.jsx` |

### Future backend notes

Unified report metadata: `evaluationMethod: examiner_mind | llm_conversational | training_heuristic`. Server validates evaluation path per subscription. Per Examiner Council Review: wire per-part aggregation (EC-07), MCQ scoring for Lesen/Hören (EC-03), skill routing (EC-02) — pending approval.

---

## 8. Prompt Architecture

### Purpose

Catalog where prompts live and how they flow to OpenAI vs rule judges.

### Connected components

| Layer | Prompt source | Consumer |
|-------|---------------|----------|
| Global ExaminerRules | `examinerRules.js` (boolean flags, not prompts) | Design principles only |
| AI-Prüfer models | `aiPremiumLibrary.js`, `austriaPathAiPrueferLibrary` | `shortPrompt`, `examinerQuestions`, `followUpRules`, `examinerRules[]` |
| Intelligent Exam | `IntelligentExamScreen.jsx` `LEVEL_CONFIG` | Per-level `system`, `intro`, `planning`, `picture` |
| OpenAI proxy default | `api/ai/openai.js` | System: *"Du bist ein offizieller ÖIF-Prüfer..."* |
| Report builder | `PremiumExamSessionScreen` via `modelRouter` | `"Bewerte diese Premium-Prüfung..."` + JSON answers |

**Rule judges do not use LLM prompts** — they use `expectedElements`, `expectedStructures`, `examinerChecks` from knowledge files.

### Related files

| File | Role |
|------|------|
| `src/data/aiPremiumLibrary.js` | Seed AI-Prüfer prompts |
| `src/app/screens/AIPrueferScreen.jsx` | Admin CRUD (flattens `followUpRules` to strings on save) |
| `src/app/screens/IntelligentExamScreen.jsx` | LEVEL_CONFIG prompts |
| `api/ai/openai.js` | Proxy system message |
| `src/ai/examinerMind/knowledge/**/*.js` | Rubric criteria (not LLM prompts) |

### Future backend notes

Version prompts in `examiner_rules` table with `examiner_rule_version`. Bind LLM system prompts to level, skill, `mandatoryTopics` (EC-12, pending approval). Never expose API keys in browser.

---

## 9. JSON Contracts

### Purpose

Define stable data shapes between ExaminerMind, reports, auth, and future API.

### Connected components

**ExaminerMind input** (`runExaminerMind`):

```json
{
  "answerText": "string",
  "taskAnswered": true,
  "level": "B1",
  "examType": "OEIF",
  "sectionIndex": 0,
  "currentSection": { "title": "string", "skill": "speaking" },
  "mode": "ai_exam",
  "saveToProfile": true
}
```

**Decision Engine output** (core fields):

```json
{
  "level": "B1",
  "score": 74,
  "confidence": 68,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "focusAreas": ["string"],
  "warnings": ["string"],
  "conflicts": [{ "type": "string", "message": "string" }],
  "needsDeepReview": false,
  "reports": []
}
```

**Judge report:**

```json
{
  "examiner": "taskCompletion",
  "score": 80,
  "strengths": [],
  "weaknesses": [],
  "focusAreas": [],
  "evidence": "string",
  "reasoning": []
}
```

**OpenAI proxy request** (`secureOpenAI.js`):

```json
{
  "mode": "string",
  "prompt": "max 8000 chars",
  "studentAnswer": "max 8000 chars",
  "context": {},
  "messages": [{ "role": "user|assistant", "content": "string" }]
}
```

**Legal consent** (`consent.js`):

```json
{
  "acceptedAt": "ISO8601",
  "privacyVersion": "2026.07",
  "termsVersion": "2026.07"
}
```

**User (client registry excerpt):**

```json
{
  "id": "number|string",
  "name": "string",
  "email": "string",
  "role": "student|admin",
  "status": "approved|blocked",
  "level": "A2|B1|B2",
  "allowedLevels": ["A2","B1"],
  "aiCredits": 5,
  "subscription": {},
  "permissions": {}
}
```

### Related files

| File | Role |
|------|------|
| `src/ai/examinerMind/runExaminerMind.js` | Input contract |
| `src/ai/examinerMind/core/decisionEngine.js` | Output contract |
| `src/security/secureOpenAI.js` | Proxy payload limits |
| `src/legal/consent.js` | Consent record |
| `AustriaPath_Technical_Specification.md` §5.3 | Full contracts |

### Future backend notes

JSON Schema validation on all API inputs (Zod/Joi). API responses never include `password_hash` or raw OpenAI payloads. Report POST strips ephemeral session data.

---

## 10. API Contracts

### Purpose

Document current serverless endpoint and target REST API surface.

### Connected components

**Current (implemented):**

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/ai/openai` | None (gap) | `prompt`, `studentAnswer`, `mode`, `context`, `messages` | `{ success, result, raw }` |

**Target (Technical Specification §3):**

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/register`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`, `GET /auth/me` |
| Users | `GET/PATCH/DELETE /users`, `/users/me`, `/users/me/export`, `/users/me/legal-consent` |
| AI | `POST /ai/completions`, `GET /ai/usage` |
| Reports | `GET/POST/DELETE /reports` |
| Subscriptions | `GET /subscription`, `POST /subscription/checkout`, `POST /subscription/webhook` |
| Admin | `/admin/content`, `/admin/ai-pruefer`, `/admin/examiner-lab/*` |

### Related files

| File | Role |
|------|------|
| `api/ai/openai.js` | Current proxy |
| `src/security/secureOpenAI.js` | Client caller |
| `Backend Security Requirements.md` §15 | Required API list |
| `AustriaPath_Technical_Specification.md` §3 | Full spec |

### Future backend notes

Base URL `https://api.austriaPath.at/v1`. HTTPS only. CORS restricted. Rate limits on auth and AI. Stripe webhook signature verification.

---

## 11. Database Overview

### Purpose

Summarize target PostgreSQL schema; current state is `localStorage` only.

### Connected components

**Core tables** (Database Schema):

| Table | Purpose |
|-------|---------|
| `users` | Auth, role, credits |
| `user_profiles` | Display, placement, skill aggregates |
| `subscriptions` | Plans, permissions, expiry |
| `payments` | Stripe records |
| `ai_credits` | Ledger |
| `ai_reports` | Premium/placement reports |
| `weekly_plan_reports` | KI-Wochenplan sessions |
| `exam_results` | ExaminerMind summaries |
| `examiner_lab_samples` | Manually selected review cases |
| `examiner_rules` | AI-Prüfer models |
| `admin_activity_log` | Audit trail |
| `legal_consents` | Timestamp + version only |
| `data_export_requests` | GDPR export queue |
| `account_deletion_requests` | GDPR erasure queue |

**localStorage → table mapping:** See Database Schema §7.2.

### Related files

| File | Role |
|------|------|
| `AustriaPath_Database_Schema.md` | Full blueprint |
| `src/security/storageRegistry.js` | Known client keys |
| `src/app/userAccess.js` | `USERS_KEY`, `CURRENT_USER_KEY` |

### Future backend notes

PostgreSQL 15+ (Supabase-compatible). RLS policies per Database Schema §8.3. Migrations via Flyway/Prisma/sql migrations. No passwords in client after cutover.

---

## 12. AI Report Structure

### Purpose

Define persisted report shapes shown in Profile and stored for progress tracking.

### Connected components

**Premium exam report** (`PremiumExamSessionScreen`):

```json
{
  "title": "AI Probeprüfung · B1",
  "date": "4.7.2026",
  "summary": "German narrative",
  "strongCount": 2,
  "middleCount": 1,
  "weakCount": 0,
  "strengths": [],
  "weaknesses": [],
  "focusAreas": [],
  "type": "premium-exam",
  "level": "B1",
  "packageType": "ai_exam",
  "examNumber": 1,
  "total": 1,
  "examinerMind": {}
}
```

**Weekly session report** (`AISessionScreen`):

```json
{
  "title": "KI-Wochentraining",
  "sessionType": "weekly_plan",
  "mode": "weekly_plan",
  "level": "B1",
  "partsCount": 3,
  "strongCount": 1,
  "middleCount": 1,
  "weakCount": 1,
  "strengths": [],
  "weaknesses": [],
  "focusAreas": [],
  "results": [],
  "summary": "string",
  "nextRecommendation": "string",
  "finishedAt": "ISO8601"
}
```

**Storage:** `austriaPathAIReports` (array), `austriaPathLastAIReport`, append to `austriaPathWeeklyPlan.sessionReports` when applicable.

**Policy:** Store reports and progress only — not full exam transcripts (AI-Privacy-Policy.md).

### Related files

| File | Role |
|------|------|
| `src/app/screens/PremiumExamSessionScreen.jsx` | Premium report build |
| `src/app/screens/AISessionScreen.jsx` | Weekly report build |
| `src/app/screens/ProfileScreen.jsx` | Report display |
| `AI-Privacy-Policy.md` | Retention rules |

### Future backend notes

`ai_reports` and `weekly_plan_reports` tables. Report `evaluationMethod` field. User-scoped GET only. Export included in GDPR bundle.

---

## 13. Weekly Plan Flow

### Purpose

Document KI-Wochenplan: setup, scheduling, AI session, report.

### Connected components

```
SubscriptionScreen (weekly_plan) → weeklyPlanSetup
  → WeeklyPlanSetupScreen: weaknesses, 3 appointments, dailyMessages, weeklyTasks
  → save austriaPathWeeklyPlan
  → handleStartAISession → austriaPathCurrentAISession
  → App tab aiSession → AISessionScreen
  → heuristic evaluateCurrentAnswer per step
  → finish → report → austriaPathAIReports + sessionReports on plan
```

**Plans:** €14.99, 7 days, 3 Termine (`SubscriptionScreen.jsx`).

**Credits:** `weekly_plan: 1` (`accessControl.js`). `FREE_RULE_SERVICES` forces rule provider in modelRouter.

### Related files

| File | Role |
|------|------|
| `src/app/screens/WeeklyPlanSetupScreen.jsx` | Plan creation |
| `src/app/screens/AISessionScreen.jsx` | Session execution |
| `src/data/weeklyPlanLibrary.js` | Tasks, messages |
| `src/data/subscriptionEngine.js` | Plan permissions |

### Future backend notes

`weekly_plans` + `weekly_plan_reports` tables. Server-side appointment scheduling. Separate report type from premium exam (EC-22, pending approval).

---

## 14. Placement Test Flow

### Purpose

Document Einstufungstest for level orientation and study plan.

### Connected components

```
SubscriptionScreen (placement) → placementTest tab
  → PlacementTestScreen: skill exercises across Selbstvorstellung, Bild, Hören, Lesen, Grammatik
  → buildPlacementProfile() / evaluateSkillLevel() [placementEngine.js]
  → save austriaPathPlacementProfile
  → level, skillScores, strengths, weaknesses, focusAreas, studyPlan
```

**Profile shape:**

```json
{
  "level": "B1",
  "selectedStartLevel": "B1",
  "skillScores": { "selbstvorstellung": "B1", "hoeren": "A2+" },
  "strengths": [],
  "weaknesses": [],
  "focusAreas": [],
  "studyPlan": [{ "day": "Tag 1", "task": "string", "focus": "string" }]
}
```

**Used by:** `WeeklyPlanSetupScreen` (recommended focus), Profile.

### Related files

| File | Role |
|------|------|
| `src/app/screens/PlacementTestScreen.jsx` | Test UI |
| `src/utils/placementEngine.js` | Scoring logic |
| `src/data/aiPlacementLibrary.js` | Task content |
| `src/data/utils/placementEngine.js` | Profile builder |

### Future backend notes

`placement_profiles` table on `user_profiles.placement_profile` JSONB. Placement is orientation, not certification — disclose in UI. Credit check server-side.

---

## 15. Premium Exam Flow

### Purpose

Document AI Probeprüfung and multi-exam packages (intensive week, premium month).

### Connected components

```
SubscriptionScreen → profile (or premiumExam)
  → PremiumExamScreen → buildPremiumExamPackage [premiumExamBuilder.js]
  → save austriaPathPremiumExamPackage
  → PremiumExamSessionScreen: parts sequence
     1. Schreiben (writing)
     2. Lesen (reading_cloze / reading)
     3. Hören (listening ×2)
     4. Selbstvorstellung (self_intro)
     5. Bild/Grafik (image)
     6. Planung/Roleplay/Discussion (planning|roleplay)
  → runExaminerMind + reportBuilder
  → Profile report
```

**Packages:**

| type | Exams | Duration |
|------|-------|----------|
| `ai_exam` | 1 | — |
| `intensive_week` | 3 | 7 days |
| `premium_month` | 5 | 30 days |

**Exam duration metadata:** A2 12 min, B1 20 min, B2 25 min (`premiumExamBuilder.js`).

### Related files

| File | Role |
|------|------|
| `src/data/premiumExamBuilder.js` | Part assembly |
| `src/app/screens/PremiumExamSessionScreen.jsx` | Session UI + evaluation |
| `src/app/screens/PremiumExamScreen.jsx` | Package launcher |
| `src/app/screens/SubscriptionScreen.jsx` | Plan purchase (client-side today) |

### Future backend notes

`POST /subscription/consume-exam` before start. Ephemeral session in Redis (`austriaPathPremiumExamPackage`). Authenticated AI proxy. Model quality gates (EC-01, EC-13, pending approval).

---

## 16. Examiner Lab Concept

### Purpose

Internal admin workflow to compare AI decisions with human examiner judgment and improve rules.

### Connected components

```
DecisionEngine: confidence < 65 OR warnings OR conflicts
  → saveAIError() → austriaPathAIErrorLog (max 500, ephemeral)
  → ExaminerLabScreen displays cases
  → Admin manually selects sample (target: examiner_lab_samples)
  → Human verdict: correct / wrong
  → Optional new examiner rule (target: examiner_rules)
```

**Privacy:** Auto-log is operational/ephemeral. Long-term retention **only** for admin-selected samples (AI-Privacy-Policy.md).

**UI today:** Correct / Wrong / New Rule buttons exist but logic not implemented.

### Related files

| File | Role |
|------|------|
| `src/app/screens/ExaminerLabScreen.jsx` | Admin UI |
| `src/ai/examinerMind/learning/errorLearningEngine.js` | Error log |
| `AustriaPath_Exam_Content_Quality_and_Examiner_Council.md` §8 | Workflow spec |
| `AI-Transparency.md` | User disclosure |

### Future backend notes

`examiner_lab_samples`, `examiner_lab_reviews`, admin APIs. 90-day purge on auto error log. EC-14 closed-loop pending approval.

---

## 17. Examiner Rules Lifecycle

### Purpose

Govern AI-Prüfer models and examiner rule sets from draft to active use.

### Connected components

**Sources:**

| Source | Storage | Status field |
|--------|---------|--------------|
| Seed library | `src/data/aiPremiumLibrary.js` | `visibleToStudents: false` |
| Admin edits | `austriaPathAiPrueferLibrary` | No formal status today |
| Admin CMS | `austriaPathAdminData` | `draft`, `review`, `published`, `archived` |
| Knowledge files | `src/ai/examinerMind/knowledge/` | Code version in metadata |

**Target statuses** (Content Quality spec): `draft`, `training_only`, `ai_exam_ready`, `needs_review`, `weak_model`, `archived`, `human_verified`.

**Rule types:** `examinerRules[]`, `followUpRules[]`, `upgradeRules[]`, `downgradeRules[]`, knowledge `examinerChecks[]`.

**Priority** (governance spec): Critical → human_verified → Examiner Lab extracted → ai_exam_ready → global flags.

### Related files

| File | Role |
|------|------|
| `src/app/screens/AIPrueferScreen.jsx` | CRUD |
| `src/data/aiPremiumLibrary.js` | Defaults |
| `src/ai/examinerMind/rules/examinerRules.js` | Global flags |
| `AustriaPath_Exam_Content_Quality_and_Examiner_Council.md` | Full lifecycle |

### Future backend notes

`examiner_rules` table with `model_status`, `examiner_rule_version`, `conflict_check_status`. `examiner_rule_rejections` for audit. Admin checklist API.

---

## 18. AI Error Learning Engine

### Purpose

Capture uncertain AI evaluations for admin review without storing all exams.

### Connected components

```
DecisionEngine.decide()
  → if confidence < 65 OR warnings.length OR conflicts.length
  → saveAIError({ score, confidence, warnings, conflicts, reports })
  → prepend to austriaPathAIErrorLog, cap 500 entries
```

**Error log entry:**

```json
{
  "id": 1234567890,
  "createdAt": "ISO8601",
  "type": "ai_error_log",
  "score": 62,
  "confidence": 58,
  "warnings": [],
  "conflicts": [],
  "reports": []
}
```

**Not the same as:** Examiner Lab samples (manual, long-term) or AI reports (student progress).

### Related files

| File | Role |
|------|------|
| `src/ai/examinerMind/learning/errorLearningEngine.js` | save/get log |
| `src/ai/examinerMind/core/decisionEngine.js` | Trigger conditions |
| `src/app/screens/ExaminerLabScreen.jsx` | Display |

### Future backend notes

Operational `ai_error_log` table or Redis with 90-day TTL. Admin promote to `examiner_lab_samples` only. Do not bulk-migrate client error log to permanent storage.

---

## 19. Security Architecture

### Purpose

Document client hardening (implemented) and backend requirements (target).

### Connected components

**Frontend (implemented):**

| Control | Location |
|---------|----------|
| Route guards | `routeGuard.js` — admin tabs |
| Session integrity | `sessionIntegrity.js` — fingerprint |
| Secure storage cap | `secureStorage.js` — 5MB |
| OpenAI client proxy | `secureOpenAI.js` — no browser API key |
| Sanitization | `sanitize.js` |
| Env warnings | `envValidation.js`, `initSecurity.js` |
| Headers | `vercel.json`, `vite.config.ts` — CSP, X-Frame-Options |

**Known client limits:** Role, premium, credits bypassable via DevTools. Documented in Backend Security Requirements.md.

**Admin CMS second gate:** `AdminScreen.jsx` re-validates admin password from user record.

### Related files

| File | Role |
|------|------|
| `src/security/*` | Client security module |
| `Backend Security Requirements.md` | Backend checklist |
| `vercel.json` | Production headers |
| `.env.example` | Env documentation |

### Future backend notes

Server auth, WAF, HSTS, rate limits, authenticated AI proxy, secrets vault, audit logging. Remove `VITE_ADMIN_INITIAL_PASSWORD` from production.

---

## 20. Privacy & GDPR

### Purpose

Define what data is collected, stored, retained, and user rights.

### Connected components

**Collected (current client):**

| Category | Examples |
|----------|----------|
| Account | name, email, password (plaintext — gap), level |
| Progress | reports, placement profile, weekly plan |
| Legal | consent timestamp + versions only |
| AI | progress reports — not full exam logs |
| Admin | Examiner Lab samples (manual selection only) |

**Not stored long-term:** Full AI conversations, every exam session, raw OpenAI payloads in client.

**User rights (target):** Access, export, deletion — `GDPR-Readiness-Review.md`.

**Consent:** `LegalConsentScreen` → `austriaPathLegalConsent`.

**Legal pages:** `src/legal/legalContent.js` — Impressum placeholders must be completed before launch.

### Related files

| File | Role |
|------|------|
| `GDPR-Readiness-Review.md` | Full inventory |
| `AI-Privacy-Policy.md` | AI-specific rules |
| `src/legal/consent.js` | Consent storage |
| `src/legal/legalContent.js` | In-app legal text |
| `AustriaPath_Database_Schema.md` | `legal_consents`, export/deletion requests |

### Future backend notes

Account deletion within 30 days. Data export API. DPA with OpenAI and hosting. DPIA and TIA. Register of processing activities.

---

## 21. EU AI Act Article 4 Compliance

### Purpose

Ensure users know they interact with AI and understand limitations.

### Connected components

| Measure | Implementation |
|---------|----------------|
| First-launch consent | `LegalConsentScreen` + Datenschutz/AGB |
| AI Disclaimer page | `legalContent.js` → `aiDisclaimer` |
| AI Transparency doc | `AI-Transparency.md` |
| In-app labelling | AI-powered screens (Intelligent Exam, Premium, Weekly) |
| Examiner Lab disclosure | Internal only; documented purpose |

**Key messages:**

- AI assists evaluation; not a certified ÖIF examiner  
- AI feedback is for learning, not official certification  
- Human-reviewed samples used only to improve rules (Examiner Lab)

### Related files

| File | Role |
|------|------|
| `AI-Transparency.md` | Transparency document |
| `src/legal/legalContent.js` | AI Disclaimer |
| `Launch-Checklist.md` | AI Act section |

### Future backend notes

Maintain transparency docs when model provider changes. Log AI usage for accountability. EC-06 evaluation mode labels (pending approval).

---

## 22. Deployment Architecture

### Purpose

Describe build, hosting, environment, and production configuration.

### Connected components

**Stack:**

| Component | Technology |
|-----------|------------|
| Build | Vite 6 → `dist/` |
| Host | Vercel (or equivalent static + serverless) |
| Serverless | `api/ai/openai.js` |
| Node | Production build drops console/debugger |

**Environment (`.env.example`):**

| Variable | Scope |
|----------|-------|
| `VITE_ADMIN_EMAIL` | Public bundle |
| `VITE_ADMIN_INITIAL_PASSWORD` | Public — **remove before production** |
| `OPENAI_API_KEY` | Server only |

### Related files

| File | Role |
|------|------|
| `vite.config.ts` | Build, dev headers |
| `vercel.json` | Security headers |
| `.env.example` | Env template |
| `package.json` | Scripts |
| `AustriaPath_Technical_Specification.md` §9 | Full deployment |

### Future backend notes

Separate API service deployment. `DATABASE_URL`, `STRIPE_*`, `JWT_SECRET` server-only. CI pipeline with `npm audit`. Staging environment with anonymized data.

---

## 23. Monitoring & Logging

### Purpose

Define observability for production operations.

### Connected components

**Current:** Production build strips `console` — client errors largely invisible without tooling.

**Target:**

| Signal | Tooling |
|--------|---------|
| Uptime | UptimeRobot / Better Stack |
| Errors | Sentry (no PII) |
| AI cost/latency | Proxy logs, dashboards |
| Auth anomalies | Failed login spikes |
| Admin actions | `admin_activity_log` |

**Log hygiene:** No passwords, tokens, full prompts in production logs.

### Related files

| File | Role |
|------|------|
| `Launch-Checklist.md` | Monitoring section |
| `Backend Security Requirements.md` §9 | Audit log requirements |
| `AustriaPath_Technical_Specification.md` §9.4 | Metrics |

### Future backend notes

Structured JSON logging. Alert thresholds: 5xx rate, OpenAI cost anomaly, auth burst. 90-day log retention default.

---

## 24. Backup & Disaster Recovery

### Purpose

Protect user data and enable recovery after failure.

### Connected components

**Current:** Client `localStorage` only — **not a backup strategy**. Data lost on cache clear or device change.

**Target:**

| Asset | Policy |
|-------|--------|
| PostgreSQL | Daily automated backup, 30-day retention, encrypted |
| CMS media | S3 versioning |
| Stripe | Provider-managed |

**Objectives:** RTO 4 hours, RPO 24 hours (Technical Specification §9.7).

### Related files

| File | Role |
|------|------|
| `Launch-Checklist.md` | Backup section |
| `GDPR-Readiness-Review.md` | Retention |
| `AustriaPath_Technical_Specification.md` §9.6–9.7 | RTO/RPO |

### Future backend notes

Quarterly restore test to staging. Runbook for OpenAI outage (degrade to rule-only). Incident contact documented.

---

## 25. Launch Checklist

### Purpose

Consolidated pre-launch gates across legal, security, AI, and operations.

### Connected components

| Area | Key gates | Doc reference |
|------|-----------|---------------|
| Legal | Impressum complete, counsel review, consent flow | `Launch-Checklist.md`, `legalContent.js` |
| Privacy | Consent stores version only; subprocessor list | `GDPR-Readiness-Review.md` |
| Security | Backend auth, hashed passwords, AI proxy auth | `Backend Security Requirements.md` |
| AI | Transparency, disclaimer, Examiner Lab purpose | `AI-Transparency.md` |
| Examiner Council | EC approvals per Decision Guide | `AustriaPath_ExaminerCouncil_DecisionGuide.md` |
| Content | Human review premium-path models | EC-13 (pending approval) |
| Payments | Stripe if premium marketed | `AustriaPath_Recommendations.md` R-04 |
| Ops | Monitoring, backups, smoke tests | `Launch-Checklist.md` |

**Sign-off roles:** Legal, Privacy/DPO, Security, Engineering, Product.

### Related files

| File | Role |
|------|------|
| `Launch-Checklist.md` | Master checklist |
| `AustriaPath_Recommendations.md` | Platform recommendations |
| `AustriaPath_ExaminerCouncil_DecisionGuide.md` | EC approval record |

### Future backend notes

Do not enable public marketing until Backend Security Requirements critical items complete. Controlled beta may use admin-granted subscriptions only (Recommendations doc).

---

## Appendix A — Navigation Tab Reference

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
| `exams` | IntelligentExamScreen | All |
| `accountSettings` | AccountSettingsScreen | All |

---

## Appendix B — Examiner Council Decision Status

As of document version 1.0:

- **Official review:** `AustriaPath_ExaminerCouncil_Review.md`
- **Decision guide:** `AustriaPath_ExaminerCouncil_DecisionGuide.md`
- **Implementation:** **Not authorized** — await explicit per-ID approval (EC-01 through EC-22)
- **Suggested launch bundle (not approved):** Bundle A in Decision Guide

When EC items are approved, update this appendix and linked specs before implementation.

---

## Appendix C — Glossary

| Term | Meaning |
|------|---------|
| **ExaminerMind** | Rule-based multi-judge evaluation pipeline |
| **Examiner Council** | Six judges collecting reports (runtime) |
| **Examiner Lab** | Admin workflow for human review of AI cases |
| **AI-Prüfer** | Configurable AI examiner models library |
| **ÖIF-style** | Exam format inspired by ÖIF integration exams — not official |
| **Premium exam** | Multi-part simulated exam via `PremiumExamSessionScreen` |
| **Placement** | Level orientation test — not certification |

---

**Document owner:** AustriaPath Engineering  
**Maintenance:** Update this Knowledge Base when architecture, approved EC items, or backend phases change.  
**Next review:** On backend Phase 3 kickoff or first EC approval batch
