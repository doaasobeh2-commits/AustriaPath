# 09 — Student Profile Lifecycle

**Contract Pack version:** 2.0.0-gate0  
**Schema:** `schemas/student-profile.json`  
**Engine reference:** `src/exam-platform/studentProfileService.js`

---

## 1. Profile model

Single row per user in `student_learning_profiles`. Document version `profileVersion: 2.0.0`.

### Core fields

| Field | Mutable by | Notes |
|-------|------------|-------|
| `officialExamLevel` | Exam products only | Never from weekly_plan |
| `officialSkillLevels` | Exam products | Per skill CEFR |
| `weakSkills` | All merges | Derived from weaknesses |
| `recurringMistakes` | All merges | Overlap detection |
| `globalUsedModelIds` | Selection + merge | Dedup global scope |
| `activePackage` | Multi-exam start | `PackageState` |
| `examHistory` | Exam merge | Max 20 entries |
| `practiceHistory` | Practice merge | Max 30 entries |
| `practiceStats` | Practice only | Sessions, minutes |
| `reportSummaries` | All | Max 25 entries |

---

## 2. Merge policies

### `mergeExamReport` (exam mode products)

Triggered for: `placement_test`, `ai_exam`, `intensive_week`, `premium_month`

| Product policy | Effect |
|----------------|--------|
| `updatesOfficialLevel: true` | Update `officialExamLevel` from report |
| `updatesOfficialSkillLevels: true` | Merge skill levels |
| `updatesPracticeStats: false` | No practice stats |

Append to `examHistory`:
```json
{
  "reportId": "uuid",
  "productType": "ai_exam",
  "date": "ISO8601",
  "cefrLevel": "B1",
  "overallScore": 72,
  "confidence": 85,
  "usedModelIds": ["..."]
}
```

### `mergePracticeReport` (weekly_plan)

**Invariant:** MUST NOT update `officialExamLevel` or `officialSkillLevels`.

Updates: `practiceHistory`, `practiceStats`, `weakSkills`, `reportSummaries`.

---

## 3. API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/student-profile` | Full V2 profile |
| PATCH | `/student-profile` | User preferences only (not exam levels) |
| GET | `/admin/users/{id}/student-profile` | Admin read |

### PATCH allowed fields (student)

- None that affect `officialExamLevel` directly
- User display preferences live in `user_profiles`, not here

Official levels change **only** via exam completion API.

---

## 4. Migration from legacy

| Source | Target |
|--------|--------|
| `austriaPathStudentProfileV2` | `profile_json` |
| `austriaPathPlacementProfile` | Seed `officialExamLevel` + placement fields |
| `austriaPathStudentProfile` (V1) | Merge once; deprecate V1 writes |
| `userLevel` localStorage | `users.level` + profile sync |

---

## 5. Package state lifecycle

```json
{
  "type": "premium_month",
  "examIndex": 2,
  "examTotal": 5,
  "usedModelIdsInPackage": ["model-a", "model-b"],
  "startedAt": "2026-07-01T00:00:00.000Z"
}
```

| Event | Action |
|-------|--------|
| First exam in package | `setActivePackage(type, 1, total)` |
| Each exam complete | `recordPackageModelUsage(usedModelIds)` |
| Package complete | Clear `activePackage` |

---

## 6. Conflict resolution

Profile updates use optimistic locking:

```
PATCH includes profileUpdatedAt
If mismatch → 409 PROFILE_CONFLICT with latest profile
```

Server always wins on exam merge paths.

---

## 7. Placement test special case

Placement updates `officialExamLevel` via `mergeExamReport` with `evaluationMethod: rule_placement`.

Synthetic placement path (bridge fallback) flagged in report metadata until real evaluator wired.

---

## 8. Subscription snapshot

Optional denormalized copy on profile after each premium session start for UI display — not authoritative (subscription table is source of truth).
