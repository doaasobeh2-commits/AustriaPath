# 12 — Examiner Lab Contracts

**Contract Pack version:** 2.0.0-gate0  
**Schemas:** `schemas/lab-queue-item.json`, `schemas/lab-resolution.json`  
**Reference:** Phase G services + `examinerLabPolicy.js`

---

## 1. Purpose

Selective human review of high-value exam cases. Feeds Rule Registry when AI scoring is corrected.

**Not** the error telemetry log (`austriaPathAIErrorLog`).

---

## 2. Enqueue policy

`maybeEnqueueLabCase()` after exam complete:

| Gate | Rule |
|------|------|
| Product | `labEligible: true` (ai_exam, intensive_week, premium_month) |
| Council | `needsHumanReview: true` |
| Rate cap | ~1 case per user per 7 days (configurable) |
| Queue max | 50 pending items global |

INSERT `examiner_lab_queue_items` status=`pending`.

---

## 3. LabQueueItem shape

```json
{
  "labItemId": "lab_uuid",
  "reportId": "uuid",
  "sessionId": "uuid",
  "userId": "uuid",
  "status": "pending|in_review|resolved",
  "classification": "low_confidence|conflicting_evaluations|...",
  "councilDecision": { "CouncilDecision": "..." },
  "sectionEvaluations": [ "SectionEvaluation[]" ],
  "studentReviewStatus": "pending|confirmed|corrected|disputed",
  "queuedAt": "ISO8601",
  "resolution": null
}
```

---

## 4. API endpoints

| Method | Path | Role |
|--------|------|------|
| GET | `/admin/examiner-lab/dashboard` | Examiner+ |
| GET | `/admin/examiner-lab/queue` | Examiner+ |
| GET | `/admin/examiner-lab/queue/{id}` | Examiner+ |
| POST | `/admin/examiner-lab/queue/{id}/resolve` | Examiner+ |
| GET | `/admin/examiner-lab/resolutions` | Admin |
| GET | `/admin/examiner-lab/stats` | Admin |

Student has **no** lab API access.

---

## 5. Resolve action contract

**POST `/admin/examiner-lab/queue/{id}/resolve`**

```json
{
  "action": "approve|reject|correct|propose_rule",
  "rationale": "string",
  "correctedDecision": { "CouncilDecision": "..." },
  "ruleProposal": {
    "action": "add",
    "targetPath": "levels.B1.writing",
    "payload": {},
    "rationale": "..."
  }
}
```

### Action effects

| Action | Lab status | Report | Registry |
|--------|------------|--------|----------|
| `approve` | resolved | `humanReview.status=confirmed` | — |
| `reject` | resolved | — | — |
| `correct` | resolved | `report_revisions` + `humanReview.status=corrected` | — |
| `propose_rule` | resolved | optional correct | `rule_proposals` or direct promote |

---

## 6. Resolution audit

Every resolve INSERT `lab_resolutions`:

```json
{
  "action": "correct",
  "reviewerId": "uuid",
  "rationale": "...",
  "correctedDecision": {},
  "resolvedAt": "ISO8601"
}
```

Append-only — no UPDATE/DELETE.

---

## 7. Dashboard response

Mirrors `loadLabDashboard()` from `labBridge.js`:

```json
{
  "pendingCases": [ "LabQueueItem[]" ],
  "registryStats": {
    "registryVersion": "1.3.0",
    "promotedRulesCount": 12,
    "pendingProposalsCount": 1
  },
  "recentResolutions": [ "LabResolution[]" ],
  "queueStats": {
    "pending": 3,
    "inReview": 1,
    "resolvedThisWeek": 2
  }
}
```

---

## 8. Student visibility rules

| State | Student sees |
|-------|--------------|
| Lab pending | Normal report (may show pending review badge if policy) |
| Lab approved | Report unchanged + confirmed badge |
| Lab corrected | Revised report + corrected badge |
| Lab rejected | Original report (internal only) |

---

## 9. Telemetry separation

| Store | Purpose | Migrates to DB? |
|-------|---------|-----------------|
| `austriaPathAIErrorLog` | Dev/ops telemetry | Optional 90d ops log — NOT lab queue |
| `examiner_lab_queue_items` | Human review | Yes |

Admin UI may show telemetry separately — must not conflate with Lab queue.

---

## 10. Weekly rate limit implementation

```sql
SELECT COUNT(*) FROM examiner_lab_queue_items
WHERE user_id = $1 AND queued_at > NOW() - INTERVAL '7 days'
```

If ≥ 1, skip enqueue (log only).
