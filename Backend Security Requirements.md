# Backend Security Requirements

This document lists security controls that **cannot** be implemented safely in a React SPA alone. The frontend hardening in `src/security/` reduces accidental exposure and casual tampering, but **must not** be treated as authorization.

Backend implementation is required before public production launch.

---

## 1. Authentication

### Required
- Replace client-side login with a real auth API (`POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `POST /auth/refresh`).
- Store passwords only as strong one-way hashes (**Argon2id** preferred, bcrypt acceptable).
- Never store plaintext passwords in the database or return them in API responses.
- Issue **HttpOnly, Secure, SameSite=Strict** session cookies or short-lived JWT access tokens with refresh rotation.
- Implement email verification before treating accounts as fully active (replace current placeholder UI).
- Implement secure password reset (`POST /auth/forgot-password`, signed time-limited reset tokens).
- Enforce password policy (minimum length, complexity, breach list check optional).
- Rate-limit login and registration attempts per IP and per account.
- Log authentication events (success, failure, lockout, password reset).

### Remove from frontend after migration
- `VITE_ADMIN_INITIAL_PASSWORD` (currently embedded in JS bundle).
- Plaintext password storage in `localStorage` (`austriaPathUsers`).
- Client-side `isLoggedIn` flag as source of truth.

---

## 2. Authorization

### Required
- Enforce admin role on **every** admin API route server-side.
- Admin identity must come from the authenticated session, not from email string comparison in the client.
- Separate permissions for:
  - Content management (Admin CMS)
  - User management
  - AI examiner lab / AI library
  - Subscription and billing changes
- Block non-admin access to:
  - `/admin/*` APIs
  - User CRUD
  - Credit grants
  - Subscription overrides
- Return **403 Forbidden** for unauthorized requests; never rely on hiding UI tabs.

### Current frontend-only gaps (backend must fix)
- `localStorage` role escalation
- Premium flags (`isPremiumUser`, `premiumActive`) client bypass
- AI credit counters client bypass
- Admin second gate password readable from `localStorage`

---

## 3. API Protection

### Required for all API routes
- HTTPS only (HSTS enabled).
- Authentication middleware on every non-public endpoint.
- Input validation and schema enforcement (Zod, Joi, or equivalent).
- Request size limits (body parser limits).
- Structured error responses without stack traces in production.
- CORS restricted to known frontend origins only.
- Idempotency keys for payment and subscription mutations where applicable.

### OpenAI proxy (`/api/ai/openai`)
Current state: **unauthenticated**, returns raw OpenAI payload, no rate limits.

Backend must:
- Require valid user session.
- Verify subscription / AI credit balance server-side before calling OpenAI.
- Deduct credits atomically in the database.
- Rate-limit per user and per IP.
- Validate and truncate prompts (max length, allowed characters).
- **Never** return raw OpenAI responses to the client.
- **Never** expose `OPENAI_API_KEY` to the browser.
- Log token usage and cost per user.
- Timeout and circuit-breaker for upstream OpenAI failures.

---

## 4. Rate Limiting

Implement at edge (CDN/WAF) and application layer:

| Endpoint class | Suggested limit |
|----------------|-----------------|
| Login / register | 5–10/min per IP |
| Password reset | 3/hour per email |
| AI completion | Per-user daily quota + burst limit |
| Admin APIs | Stricter limits + admin IP allowlist optional |
| Public static assets | CDN caching |

Use Redis or edge rate limiting (Cloudflare, Vercel Firewall, AWS WAF).

---

## 5. Web Application Firewall (WAF)

Deploy WAF in front of production:

- OWASP Core Rule Set or managed WAF (Cloudflare, AWS, Azure).
- Block common SQLi, XSS, path traversal, and scanner traffic.
- Geo-blocking if business requires (optional).
- Bot management on auth and AI endpoints.
- DDoS protection at CDN/load balancer.

---

## 6. Database Security

- Use managed PostgreSQL (or equivalent) — not browser storage.
- Encrypt data at rest (provider default + verify).
- Encrypt backups.
- Least-privilege DB credentials (app user ≠ admin user).
- Parameterized queries / ORM only — no string concatenation SQL.
- Separate tables for users, sessions, subscriptions, AI usage, admin audit log.
- Store PII minimally; document retention policy (GDPR).
- Regular automated backups with restore testing.

---

## 7. Secrets Management

| Secret | Storage |
|--------|---------|
| `OPENAI_API_KEY` | Server env / vault only |
| Admin bootstrap password | One-time server seed script, not VITE |
| Database URL | Server env / vault |
| JWT signing keys | Server env / vault with rotation |
| Email provider API keys | Server env / vault |

- Never commit secrets to git.
- Rotate keys on schedule and after incidents.
- Use separate secrets per environment (dev/staging/prod).

---

## 8. Encryption

- **In transit:** TLS 1.2+ everywhere.
- **At rest:** Database encryption, encrypted backups.
- **Passwords:** Argon2id/bcrypt only.
- **Session tokens:** Cryptographically random, hashed if stored server-side.
- **PII fields:** Consider field-level encryption for sensitive profile data if required by policy.

---

## 9. Logging & Monitoring

### Audit log (append-only)
- Admin login and admin actions (user block, delete, credit change, content publish).
- Failed authorization attempts.
- AI API usage (user, tokens, cost, model).
- Subscription changes.

### Application monitoring
- Error tracking (Sentry or equivalent).
- Uptime monitoring.
- Alerting on:
  - Spike in 401/403/429/500 rates
  - OpenAI cost anomalies
  - Failed login bursts
  - WAF blocks

### Log hygiene
- Never log passwords, tokens, or full OpenAI API keys.
- Redact PII in logs where possible.

---

## 10. Backups & Disaster Recovery

- Daily automated DB backups, minimum 30-day retention.
- Test restore procedure quarterly.
- Document RTO/RPO targets.
- Export admin content separately if needed for CMS recovery.

---

## 11. Email & Account Lifecycle

- Verification emails with signed expiring links.
- Password reset emails with single-use tokens.
- Account deletion API (GDPR right to erasure).
- Blocked/suspended account enforcement server-side.

---

## 12. Payment & Subscription (when integrated)

- Use PCI-compliant payment provider (Stripe, etc.) — never store card numbers.
- Webhook signature verification for payment events.
- Server-side subscription state — ignore client `localStorage` premium flags.
- Reconcile webhooks idempotently.

---

## 13. Security Headers (hosting)

Frontend ships `vercel.json` with baseline headers. Confirm on production:

- `Content-Security-Policy`
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` or `frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

---

## 14. Dependency & Supply Chain

- Run `npm audit` in CI.
- Dependabot or Renovate for updates.
- Lock file committed (`package-lock.json`).
- CI build from clean environment.

---

## 15. Recommended API Surface (Phase 3)

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me

GET    /users              (admin)
PATCH  /users/:id          (admin)
DELETE /users/:id          (admin)
POST   /users/:id/block    (admin)
POST   /users/:id/credits  (admin)

GET    /content            (public published)
POST   /content            (admin)
PATCH  /content/:id        (admin)

POST   /ai/completions     (authenticated, credit-checked)
GET    /ai/usage           (authenticated)

GET    /subscription       (authenticated)
POST   /subscription/webhook (Stripe — server only)
```

---

## 16. Frontend Limitations (explicit)

The current SPA can:
- Hide admin UI from non-admins.
- Re-validate session from stored user records on reload.
- Detect casual `localStorage` tampering (session integrity fingerprint).
- Route all AI calls through `/api/ai/openai` (no browser API keys).

The current SPA **cannot**:
- Prevent a determined user from modifying local data.
- Protect OpenAI keys without a server proxy.
- Enforce billing, credits, or admin actions without backend APIs.

---

## 17. Pre-production Checklist

- [ ] Remove `VITE_ADMIN_INITIAL_PASSWORD` from production builds
- [ ] Migrate users out of `localStorage`
- [ ] Protect `/api/ai/openai` with auth + rate limits
- [ ] Enable WAF + HSTS on production domain
- [ ] Penetration test or security review
- [ ] GDPR privacy policy and data processing documented
- [ ] Incident response contact defined

---

**Document owner:** AustriaPath engineering  
**Status:** Required before production launch  
**Related frontend module:** `src/security/`
