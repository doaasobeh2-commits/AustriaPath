# 05 — User Roles & Permissions Matrix

**Contract Pack version:** 2.0.0-gate0

---

## 1. Roles

| Role | Description |
|------|-------------|
| `student` | Default registered user |
| `examiner` | Human reviewer for Examiner Lab |
| `admin` | Full platform administration |

A user has exactly one `role` column value. Admin also requires configured admin email.

---

## 2. Permission object (`UserPermissions`)

Mirrors `src/api/contracts.js` and `getPermissionsByPlan()`:

| Field | Description |
|-------|-------------|
| `placementTest` | Access placement test product |
| `aiExam` | Access AI single exam |
| `weeklyPlan` | Access KI-Wochenplan |
| `reports` | View persisted reports |
| `writingAI` | AI for writing skills |
| `imageAI` | AI for picture description |
| `speakingAI` | AI for speaking skills |
| `readingAI` | AI for reading (informational) |
| `listeningAI` | AI for listening (informational) |

---

## 3. Plan → permissions matrix

| Plan (`subscription_type`) | placementTest | aiExam | weeklyPlan | reports | writingAI | imageAI | speakingAI | readingAI | listeningAI |
|----------------------------|:-------------:|:------:|:----------:|:-------:|:---------:|:-------:|:----------:|:---------:|:-----------:|
| `free` | — | — | — | — | — | — | — | — | — |
| `placement_test` | ✓ | — | — | ✓ | — | — | — | — | — |
| `weekly_plan` | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| `ai_exam` | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `intensive_week` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `premium_month` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 4. API endpoint access matrix

| Endpoint | Public | Student | Examiner | Admin |
|----------|:------:|:-------:|:--------:|:-----:|
| `POST /auth/register` | ✓ | — | — | — |
| `POST /auth/login` | ✓ | — | — | — |
| `GET /auth/me` | — | ✓ | ✓ | ✓ |
| `GET /subscription` | — | ✓ | ✓ | ✓ |
| `POST /subscription/checkout` | — | ✓ | ✓ | ✓ |
| `POST /subscription/consume-exam` | — | ✓* | — | — |
| `POST /exam-sessions` | — | ✓* | — | — |
| `POST /exam-sessions/{id}/sections` | — | ✓ own | — | — |
| `POST /exam-sessions/{id}/complete` | — | ✓ own | — | — |
| `GET /reports` | — | ✓ own | — | ✓ all |
| `GET /reports/{id}` | — | ✓ own | — | ✓ all |
| `GET /student-profile` | — | ✓ own | — | ✓ all |
| `POST /ai/completions` | — | ✓* | ✓* | ✓ |
| `GET /rule-registry/effective` | — | ✓ | ✓ | ✓ |
| `GET /admin/examiner-lab` | — | — | ✓ | ✓ |
| `POST /admin/examiner-lab/{id}/resolve` | — | — | ✓ | ✓ |
| `POST /admin/rule-registry/promote` | — | — | — | ✓ |
| `GET /admin/users` | — | — | — | ✓ |
| `PATCH /admin/users/{id}` | — | — | — | ✓ |
| `POST /webhooks/stripe` | ✓** | — | — | — |

\* Requires valid entitlements (subscription + credits as applicable)  
\*\* Stripe signature only — not user auth

---

## 5. Product → subscription validation matrix

From `subscriptionPolicy.js`:

| Product | Requires subscription | Type must match | Consumes attempt |
|---------|:--------------------:|:---------------:|:----------------:|
| `placement_test` | No | — | No |
| `weekly_plan` | No | — | No |
| `ai_exam` | Yes | No* | Yes |
| `intensive_week` | Yes | Yes | Yes |
| `premium_month` | Yes | Yes | Yes |

\* Any active premium subscription acceptable for `ai_exam` per current policy — confirm at implementation; Gate 0 preserves engine behavior.

---

## 6. AI credit costs

From `src/config/accessControl.js`:

| Service type | Credits |
|--------------|---------|
| `placement_test` | 1 |
| `weekly_plan` | 1 |
| `ai_exam` | 2 |
| `intensive_week_session` | 2 |
| `premium_month_session` | 2 |
| `report_builder` | 1 |
| `follow_up_question` | 1 |
| `llm_proposal` | 1 |

---

## 7. Examiner Lab actions by role

| Action | Examiner | Admin |
|--------|:--------:|:-----:|
| View queue | ✓ | ✓ |
| `approve` | ✓ | ✓ |
| `reject` | ✓ | ✓ |
| `correct` | ✓ | ✓ |
| `propose_rule` | — | ✓ |
| Direct registry promote | — | ✓ |

Examiner Mind learns **only** from admin-approved promotions (`propose_rule` → promote pipeline).

---

## 8. Field-level visibility

| Field / table | Student | Examiner | Admin |
|---------------|---------|----------|-------|
| `users.password_hash` | — | — | — |
| `users.notes` | — | — | ✓ |
| `exam_reports.report_json.councilDecision` | Truncated | Full | Full |
| `examiner_lab_queue_items.section_evaluations` | — | ✓ | ✓ |
| `ai_completion_logs` | Own summary | — | Full |
| `payments.stripe_*` | — | — | ✓ |
| `admin_activity_log` | — | — | ✓ |
