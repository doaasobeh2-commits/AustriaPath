# 04 — Authentication & Authorization

**Contract Pack version:** 2.0.0-gate0

---

## 1. Authentication model

### 1.1 Primary: HttpOnly session cookie (recommended)

| Cookie | Properties |
|--------|------------|
| Name | `austria_path_session` |
| HttpOnly | true |
| Secure | true (production) |
| SameSite | `Lax` |
| Max-Age | 7 days (sliding refresh) |

Session row in `auth_sessions` with `token_hash` (SHA-256 of random 32-byte secret).

### 1.2 Alternative: JWT bearer (mobile/API clients)

| Token | TTL | Storage |
|-------|-----|---------|
| Access | 15 min | Memory |
| Refresh | 30 days | HttpOnly cookie or secure storage |

Refresh rotation: each refresh invalidates previous `refresh_token_hash`.

### 1.3 Session validation (every request)

1. Extract cookie or `Authorization: Bearer`
2. Hash token → lookup `auth_sessions` WHERE `revoked_at IS NULL AND expires_at > NOW()`
3. Load `users` WHERE `deleted_at IS NULL AND status = 'approved'`
4. Attach `auth.user` to request context

Blocked users: return `403 AUTH_BLOCKED`.

---

## 2. Auth API contracts

### POST `/v1/auth/register`

**Request:** `RegisterRequest` (see schemas/auth-register.request.json)

**Validation:**
- Email unique (case-insensitive)
- Password ≥ 8 chars
- Level ∈ {A2, B1, B2}
- Reject email matching server `ADMIN_EMAIL`

**Side effects:**
- Create `users`, `user_profiles`, `student_learning_profiles`
- Grant 5 AI credits (`registration_default`)
- Create `subscriptions` row type=`free`

**Response:** `201` + `AuthResponse`

### POST `/v1/auth/login`

**Request:** `{ email, password }`

**Side effects:**
- Verify Argon2id/bcrypt hash
- Create `auth_sessions`
- Update `users.last_login_at`

**Response:** `200` + `AuthResponse` + Set-Cookie

**Errors:** `401 AUTH_INVALID` (generic message — no enumeration)

### POST `/v1/auth/logout`

Revoke current session (`revoked_at = NOW()`).

### GET `/v1/auth/me`

Returns full `User` with embedded `subscription`, `permissions`, `aiCredits`.

### POST `/v1/auth/forgot-password`

Always `200` — enqueue email job if user exists.

### POST `/v1/auth/reset-password`

**Request:** `{ token, password }` — single-use token, 1h TTL.

---

## 3. Authorization layers

### Layer 1 — Authentication

Valid session required for all routes except:

- `POST /auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`
- `POST /webhooks/stripe`
- `GET /health`

### Layer 2 — Role

| Role | Assignment |
|------|------------|
| `student` | Default on register |
| `admin` | `role=admin` AND email = server `ADMIN_EMAIL` AND manual bootstrap |
| `examiner` | Admin grants via user management |

### Layer 3 — Resource ownership

Students: `resource.user_id = auth.user.id`

### Layer 4 — Entitlements

Derived from `subscriptions.permissions` + product policy:

- Premium exam start requires active subscription + remaining exams
- AI completion requires credits ≥ cost

### Layer 5 — Admin email gate

Admin operations additionally verify:

```
user.email === ADMIN_EMAIL (server env)
```

Matches `src/config/authConfig.js` behavior, server-enforced.

---

## 4. Internal service auth

| Caller | Credential |
|--------|------------|
| Stripe webhook | Stripe-Signature HMAC |
| Engine worker | Service role DB + internal API key |
| Bootstrap admin | `ADMIN_BOOTSTRAP_SECRET` header (one-time) |

---

## 5. Security requirements

| Requirement | Implementation |
|-------------|----------------|
| Password storage | Argon2id (preferred) or bcrypt cost ≥ 12 |
| Rate limit login | 10/min/IP, 5/min/email |
| Rate limit register | 3/hour/IP |
| Session fixation | New session ID on login |
| CSRF | SameSite cookie + CSRF token for cookie auth on mutating requests |
| CORS | Allow SPA origin only |

---

## 6. AuthResponse schema summary

```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "student|admin|examiner",
    "status": "approved|blocked",
    "level": "B1",
    "allowedLevels": ["A2", "B1"],
    "emailVerified": false,
    "subscription": {
      "type": "free",
      "status": "inactive",
      "remainingExams": 0,
      "endDate": null
    },
    "permissions": { "aiExam": false, "weeklyPlan": false },
    "aiCredits": 5,
    "usedAiCredits": 0
  }
}
```

Permissions shape matches `getPermissionsByPlan()` in `subscriptionEngine.js`.
