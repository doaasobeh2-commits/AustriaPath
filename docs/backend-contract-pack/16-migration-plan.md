# 16 — localStorage → Production Database Migration Plan

**Contract Pack version:** 2.0.0-gate0  
**Registry:** `src/security/storageRegistry.js`

---

## 1. Migration strategy

### Phase M0 — Pre-launch (no user data)

1. Deploy PostgreSQL schema (`02-database-schema.sql`)
2. Seed admin + rule registry
3. `VITE_USE_BACKEND=true` for new registrations only

### Phase M1 — Dual-write (transition)

1. Backend is source of truth for auth, subscription, reports
2. Client still reads localStorage cache (stale-while-revalidate)
3. On login: server returns data → client updates cache for offline UX optional

### Phase M2 — Import on first login

1. Client sends `POST /migration/import` with signed export bundle (opt-in)
2. Server maps keys → tables (see §3)
3. Mark user `migration_completed_at`

### Phase M3 — Cutover

1. Disable client writes to migrated keys
2. Remove plaintext `austriaPathUsers`
3. Force password reset for imported plaintext accounts

---

## 2. Migration API

**POST `/v1/migration/import`** (authenticated, once per user)

```json
{
  "exportVersion": "1.0",
  "exportedAt": "ISO8601",
  "payload": {
    "austriaPathStudentProfileV2": {},
    "austriaPathAIReports": [],
    "austriaPathSubscription": {},
    "austriaPathRuleRegistry": null,
    "austriaPathLegalConsent": {}
  }
}
```

**Response:**
```json
{
  "imported": {
    "reports": 12,
    "profile": true,
    "subscription": true,
    "skippedKeys": ["austriaPathAIErrorLog"]
  }
}
```

---

## 3. Key → table mapping (complete)

| localStorage key | Target | Migrate? | Notes |
|------------------|--------|:--------:|-------|
| `austriaPathUsers` | `users`, `user_profiles` | ✓ | Re-hash passwords or force reset |
| `austriaPathCurrentUser` | — | ✗ | Session only |
| `isLoggedIn`, `currentUser` | — | ✗ | Replaced by auth session |
| `austriaPathSessionIntegrity` | — | ✗ | Server session |
| `austriaPathLegalConsent` | `legal_consents` | ✓ | Version strings exact |
| `austriaPathSubscription` | `subscriptions` | ✓ | `is_current=true` |
| `premiumActive`, `userPlan`, `isPremiumUser` | — | ✗ | Derive from subscription |
| `placementPaid`, `premiumPlan` | — | ✗ | Legacy flags |
| `austriaPathStudentProfileV2` | `student_learning_profiles` | ✓ | Primary profile |
| `austriaPathStudentProfile` | merge into V2 | ✓ | One-time merge |
| `austriaPathPlacementProfile` | `user_profiles.placement_profile` + profile | ✓ | |
| `placementCompleted`, `levelSource` | `user_profiles`, `users.level_source` | ✓ | |
| `userLevel`, `userLanguage` | `users.level`, `user_profiles` | ✓ | |
| `userProfileImage` | CDN URL in `user_profiles` | ✓ | Upload base64 |
| `austriaPathAIReports` | `exam_reports` | ✓ | Map via legacy adapter |
| `austriaPathLastAIReport` | — | ✗ | Rebuild from latest report |
| `austriaPathLastStrengths`, `LastWeaknesses` | — | ✗ | Rebuild |
| `austriaPathExamSession` | — | ✗ | Ephemeral — do not migrate |
| `austriaPathPlatformSessionMeta` | — | ✗ | Ephemeral |
| `austriaPathCurrentSessionAnswers` | — | ✗ | Ephemeral |
| `austriaPathCurrentAISession` | — | ✗ | Ephemeral |
| `austriaPathAiSession` | — | ✗ | Ephemeral |
| `austriaPathPremiumExamPackage` | — | ✗ | Ephemeral / Redis TTL |
| `austriaPathPremiumSchedule` | `weekly_plans` or supplementary | Optional | |
| `austriaPathWeeklyPlan` | `weekly_plans` | ✓ | Split reports |
| `austriaPathRuleRegistry` | `rule_registry_snapshots` | ✓ | If newer than seed |
| `austriaPathRuleProposals` | `rule_proposals` | ✓ | Pending only |
| `austriaPathExaminerLabQueue` | `examiner_lab_queue_items` | ✓ | Pending items |
| `austriaPathExaminerLabResolutions` | `lab_resolutions` | ✓ | Audit |
| `austriaPathAiPrueferLibrary` | `examiner_content_rules` | ✓ | Preserve legacy_id |
| `austriaPathAIErrorLog` | ops log (optional) | ✗ | 90d TTL; NOT lab queue |
| `austriaPathAdminData` | `content_items` (future) | Optional | CMS |
| `*PremiumVisitCount`, `*PremiumLastShown` | — | ✗ | Client upsell analytics |
| `writingVisits`, `databaseVisits` | — | ✗ | Optional analytics |

---

## 4. Report migration mapping

Legacy `austriaPathAIReports[]` entry → `exam_reports`:

| Legacy field | Column |
|--------------|--------|
| `id` | store in `legacy_adapter_key` metadata |
| `type` / `sessionType` | `product_type` (map enum) |
| `level` | `cefr_level` |
| `summary` | `summary` |
| `strengths`, `weaknesses` | arrays |
| `date` / `finishedAt` | `created_at` |
| `evaluationMethod` | `evaluation_method` (map `training_heuristic` → `practice_heuristic`) |

Synthetic `session_id` and `council_decision_id` created for historical imports.

---

## 5. User field mapping

| Client (`austriaPathUsers`) | DB |
|-----------------------------|-----|
| `id` | `users.legacy_client_id` (new UUID for PK) |
| `email` | `users.email` |
| `password` | `users.password_hash` (re-hash) |
| `name` | `user_profiles.display_name` |
| `level` | `users.level` |
| `allowedLevels` | `users.allowed_levels` |
| `plan` | `users.plan` + `subscriptions` |
| `aiCredits` | `users.ai_credits` + ledger opening entry |
| `subscription` | `subscriptions` row |
| `permissions` | `subscriptions.permissions` |

---

## 6. Validation checklist

- [ ] User count matches import source
- [ ] Zero plaintext passwords in DB
- [ ] Each user has `user_profiles` + `student_learning_profiles`
- [ ] Report count ≥ legacy array length (split handled)
- [ ] `officialExamLevel` matches V2 profile post-import
- [ ] Subscription `remaining_exams` matches client
- [ ] Legal consent versions preserved
- [ ] Rule registry version ≥ seed version
- [ ] No full session answer payloads in DB
- [ ] Lab queue pending items preserved
- [ ] Client premium bypass flags removed post-cutover

---

## 7. Rollback plan

| Stage | Rollback |
|-------|----------|
| M1 dual-write | Disable backend flag; localStorage still has data |
| M2 import | Per-user `migration_rollback` admin action deletes imported rows |
| M3 cutover | Maintenance window; restore M1 if critical failure |

---

## 8. Bulk admin import script

For beta cohort before individual login migration:

```bash
node scripts/migrate-localStorage-export.js --input beta-export.json --dry-run
node scripts/migrate-localStorage-export.js --input beta-export.json --execute
```

Script must run with service role DB credentials — not shipped to client.

---

## 9. Post-migration client behavior

When `VITE_USE_BACKEND=true`:

| Module | Behavior |
|--------|----------|
| `userAccess.js` | API only |
| `examEngineBridge.js` | Repository → `/exam-sessions` |
| `legacyReportAdapter.js` | Read from `/reports`; write disabled |
| `studentProfileService.js` | Read from `/student-profile` |
| `labBridge.js` | Admin API |
| `secureOpenAI.js` | `/ai/completions` |

localStorage retains only: UI prefs, draft form state, non-synced cache with TTL.
