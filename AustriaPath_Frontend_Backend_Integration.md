# AustriaPath — Frontend ↔ Backend Integration Guide

**Version:** 1.0 · **Date:** 4 July 2026  
**Prerequisite:** Backend Sprint 1+ deployed

---

## 1. Integration strategy

Replace **service modules**, not screens. UI stays unchanged.

```
Screens → userAccess / aiCredits / secureOpenAI
              ↓ (when VITE_USE_BACKEND=true)
         httpClient → API
              ↓ (when false)
         localStorage (current beta)
```

---

## 2. Feature flag

`.env`:

```
VITE_USE_BACKEND=true
VITE_API_BASE=https://api.austriapath.at/v1
```

---

## 3. Files to modify (backend team + 1 frontend pass)

| Priority | File | Change |
|----------|------|--------|
| P0 | `src/app/userAccess.js` | `authenticateUser`, `registerStudentUser` → API |
| P0 | `src/security/secureOpenAI.js` | POST `/ai/completions` when flag set |
| P0 | `src/utils/aiCredits.js` | Read balance from `/auth/me` or `/ai/usage` |
| P1 | `src/app/screens/SubscriptionScreen.jsx` | Redirect to Stripe checkout URL |
| P1 | `ProfileScreen.jsx` | Load reports from `/reports` |
| P2 | `src/legal/consent.js` | POST `/users/me/legal-consent` |
| P2 | Remove `clientSubscription.js` usage | Webhook grants plan |

---

## 4. New files to add (when backend ready)

```
src/api/httpClient.js       # fetch + credentials + error parsing
src/api/authService.js
src/api/aiService.js
src/api/subscriptionService.js
src/api/reportsService.js
```

**Template `httpClient.js` pattern:**

```javascript
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.errorCode || 'API_ERROR', data.error);
  return data;
}
```

No fake implementations in repo until backend URL is live.

---

## 5. Session handling

**Recommended:** HTTP-only session cookie from backend (same-site).

Frontend changes:

- Remove reliance on `isLoggedIn` localStorage flag
- On app load: `GET /auth/me` → set `currentUser` state
- On 401: clear session, show auth screens

---

## 6. Reports migration

When saving report from `PremiumExamSessionScreen`:

```javascript
// Add evaluationMethod from src/api/contracts.js
await reportsService.create({
  ...report,
  evaluationMethod: 'examiner_mind',
});
```

---

## 7. Testing integration

1. Staging API + staging SPA with `VITE_USE_BACKEND=true`
2. Run manual QA from [Testing Strategy](./AustriaPath_Testing_Strategy.md)
3. Verify credits decrement server-side (refresh page — balance persists)

---

## 8. Rollback

Keep `VITE_USE_BACKEND=false` until Stripe + auth stable. Client localStorage mode remains fallback for dev.

---

See [openapi.yaml](./openapi.yaml) and [Backend Handoff Index](./AustriaPath_BACKEND_HANDOFF_INDEX.md).
