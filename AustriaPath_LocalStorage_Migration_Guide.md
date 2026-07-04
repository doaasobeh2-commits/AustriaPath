# AustriaPath — localStorage → PostgreSQL Migration Guide

**Version:** 1.0 · **Date:** 4 July 2026  
**For:** Backend developers · **Source registry:** `src/security/storageRegistry.js`

---

## 1. Principles

- Migrate **on first login after backend launch** or via one-time import script
- Never migrate plaintext passwords to production — force password reset or bootstrap admin only
- Ephemeral keys (`austriaPathAIErrorLog`) → 90-day TTL or discard
- Dynamic premium hint keys → do not migrate; reset on server

---

## 2. Key mapping table

| localStorage key | PostgreSQL target | Notes |
|------------------|-------------------|-------|
| `austriaPathUsers[]` | `users` + `user_profiles` | Hash passwords on import or invalidate |
| `austriaPathCurrentUser` | Session only — not stored | Derived from auth token |
| `austriaPathLegalConsent` | `legal_consents` | `{ acceptedAt, privacyVersion, termsVersion }` |
| `austriaPathSubscription` | `subscriptions` | Map `type`, `status`, `validUntil` |
| `premiumActive`, `userPlan` | **Deprecated** | Derive from `subscriptions` |
| `austriaPathAIReports[]` | `ai_reports` | Add `evaluation_method` column |
| `austriaPathPlacementProfile` | `user_profiles.placement_profile` | JSONB |
| `austriaPathWeeklyPlan` | `weekly_plans` | Split plan + `weekly_plan_reports` |
| `austriaPathStudentProfile` | `user_profiles.skill_aggregates` | JSONB |
| `austriaPathAdminData` | `content_items` | CMS |
| `austriaPathAiPrueferLibrary` | `examiner_rules` | Version each rule |
| `userProfileImage` | `user_profiles.avatar_url` | Prefer object storage, not DB blob |
| `userLevel`, `userLanguage` | `user_profiles.level`, `.language` | |
| `austriaPathPremiumExamPackage` | Ephemeral session | Redis TTL 24h post-backend |
| `austriaPathAIErrorLog` | Optional ops log | 90d max; not user-facing |

---

## 3. User import script outline

```sql
-- Pseudocode flow
FOR each client user JSON:
  INSERT INTO users (email, password_hash, role, status, ...)
  INSERT INTO user_profiles (user_id, level, ...)
  IF subscription present:
    INSERT INTO subscriptions (...)
  FOR each report in aiReports:
    INSERT INTO ai_reports (...)
```

Run once per beta tester if they opt in; otherwise fresh start on backend launch.

---

## 4. Fields to drop

| Key | Reason |
|-----|--------|
| `isLoggedIn` | Server session |
| `userRole` | From JWT / `/auth/me` |
| `austriaPathSessionIntegrity` | Server session |
| `isPremiumUser`, `placementPaid`, `premiumPlan` | Legacy; use subscription |
| `*PremiumVisitCount`, `*PremiumLastShown` | Client upsell only |

---

## 5. Verification

After migration for a test user:

- [ ] Login works with new password or reset link
- [ ] Reports visible in Profile via API
- [ ] Credits match pre-migration balance
- [ ] Legal consent timestamp preserved
- [ ] Admin role preserved for admin email only

---

See [Database Schema §7.2](./AustriaPath_Database_Schema.md) for full entity definitions.
