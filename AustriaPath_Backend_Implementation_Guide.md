# AustriaPath — Backend Implementation Guide

**Version:** 1.0 · **Date:** 4 July 2026  
**For:** Backend developers joining after frontend production prep  
**Read first:** [Production Engineering Package](./AustriaPath_Production_Engineering_Package.md) · [Database Schema](./AustriaPath_Database_Schema.md)

---

## 1. Mission

Implement server-side auth, PostgreSQL persistence, Stripe billing, and authenticated AI proxy **without changing the React UI**. The SPA already defines contracts, storage keys, and user flows — your job is to replace `localStorage` as system of record.

**Do not re-specify** exam content, ExaminerMind judges, or screen flows.

---

## 2. Repository map for backend integration

| Frontend module | Replace with API |
|-----------------|------------------|
| `src/app/userAccess.js` | `/auth/*`, `/users/me` |
| `src/utils/aiCredits.js` | `/ai/usage`, credit ledger in DB |
| `src/utils/clientSubscription.js` | Remove after Stripe webhooks |
| `src/security/secureOpenAI.js` | `/ai/completions` (authenticated) |
| `localStorage` report keys | `/reports` |
| `SubscriptionScreen` click-to-buy | `/subscription/checkout` |

**Endpoint constants:** `src/api/endpoints.js`

---

## 3. Sprint plan (recommended)

### Sprint 1 — Database + Auth (Week 1)

1. Provision PostgreSQL (Supabase or RDS)
2. Run migrations from [Database Schema](./AustriaPath_Database_Schema.md)
3. Implement:
   - `POST /auth/register`
   - `POST /auth/login` → HTTP-only session cookie **or** JWT + refresh
   - `GET /auth/me`
   - `POST /auth/logout`
4. One-time `POST /internal/bootstrap-admin` with `ADMIN_BOOTSTRAP_SECRET`
5. Password: Argon2id or bcrypt (cost ≥ 12)

**Acceptance:** Login from SPA against API; no plaintext passwords anywhere.

### Sprint 2 — AI proxy + credits (Week 2)

1. `POST /ai/completions` — port logic from `api/ai/openai.js`
2. Require session; validate `serviceType` against `ACCESS_CONTROL.aiCosts`
3. Atomic debit: `ai_credits` ledger (`total - used >= cost`)
4. Log: `user_id`, `service_type`, tokens, latency — **not** full prompt in prod

**Acceptance:** `modelRouter.js` works through authenticated endpoint; credits enforced server-side.

### Sprint 3 — Reports + profile (Week 2–3)

1. `GET/POST /reports`
2. `PATCH /users/me` — level, language, placement_profile JSONB
3. Migrate keys from [LocalStorage Migration Guide](./AustriaPath_LocalStorage_Migration_Guide.md)

### Sprint 4 — Stripe (Week 3)

1. Create Stripe Products/Prices matching plan catalog (Engineering Package §9.3)
2. `POST /subscription/checkout` → Checkout Session URL
3. Webhook `checkout.session.completed` → `subscriptions`, `payments`, credit grant
4. `GET /subscription` → permissions object matching `getPermissionsByPlan()`

**Acceptance:** Remove client-side `premiumActive` trust; SPA reads permissions from `/auth/me`.

### Sprint 5 — GDPR + Admin (Week 4)

1. `GET /users/me/export`
2. `DELETE /users/me` → queue `account_deletion_requests`
3. `legal_consents` table sync from consent screen
4. Admin routes mirroring `UserManagementScreen` / `AdminScreen` actions

---

## 4. Auth contract

### Register request

```json
{ "name": "string", "email": "string", "password": "string", "level": "A2|B1|B2" }
```

### Login response

```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "student|admin",
    "status": "approved|blocked",
    "level": "B1",
    "allowedLevels": ["A2","B1"],
    "subscription": { "type": "free", "status": "inactive" },
    "permissions": { "aiExam": false, "weeklyPlan": false },
    "aiCredits": 5,
    "usedAiCredits": 0
  }
}
```

**Reserved email:** Reject registration if email equals server `ADMIN_EMAIL`.

---

## 5. AI completions contract

Identical to current proxy (already fixed in `api/ai/openai.js`):

```json
{
  "mode": "report_builder",
  "prompt": "string",
  "studentAnswer": "string",
  "messages": [{ "role": "user|assistant", "content": "string" }],
  "context": { "serviceType": "ai_exam", "level": "B1" }
}
```

Response:

```json
{
  "success": true,
  "result": "string",
  "creditsUsed": 2,
  "creditsRemaining": 48
}
```

---

## 6. Stripe plan mapping

| Frontend `plan.type` | Engine type | Stripe Price (EUR) |
|----------------------|-------------|-------------------|
| `placement` | `placement_test` | 2.00 |
| `weekly_plan` | `weekly_plan` | 14.99 |
| `ai_exam` | `ai_exam` | 9.99 |
| `intensive_week` | `intensive_week` | 24.99 |
| `premium_month` | `premium_month` | 39.99 |

Permissions: replicate `src/data/subscriptionEngine.js` → `getPermissionsByPlan()`.

---

## 7. Frontend integration steps (after each sprint)

1. Add `src/api/httpClient.js` — fetch wrapper with credentials
2. Feature flag `VITE_USE_BACKEND_AUTH=true`
3. Swap `authenticateUser` → API when flag set
4. Keep localStorage fallback for offline dev only

**No UI file changes** except auth/subscription service modules.

---

## 8. Security checklist (backend)

- [ ] All `/admin/*` and `/ai/*` require auth
- [ ] Rate limit `/auth/login` and `/ai/completions`
- [ ] Stripe webhook signature verification
- [ ] RLS policies per Database Schema §8
- [ ] Secrets only in server env (never `VITE_*` for secrets)
- [ ] CORS: production domain only

---

## 9. Testing expectations

Backend PRs must include:

- Unit tests for auth, credit debit, permission checks
- Integration test: register → login → AI call → credit decrement
- Webhook test with Stripe CLI

See [Testing Strategy](./AustriaPath_Testing_Strategy.md).

---

## 10. Out of scope for backend v1

- ExaminerMind judge logic changes (unless EC items approved)
- New exam content
- UI redesign
- Examiner Lab closed-loop (EC-14) — v2

---

**Questions:** See [Knowledge Base](./AustriaPath_Knowledge_Base.md) · Escalate EC items via [Decision Guide](./AustriaPath_ExaminerCouncil_DecisionGuide.md)
