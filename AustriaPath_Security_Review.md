# AustriaPath — Security Review

**Version:** 1.0 · **Date:** 4 July 2026  
**Reviewer role:** Senior software architect (pre-backend)  
**Scope:** Frontend SPA + Vercel serverless proxy + documentation

---

## Executive summary

| Area | Rating | Notes |
|------|--------|-------|
| Frontend hardening | **Good** for beta | Headers, CSP, input limits, route guards |
| Auth | **Not production** | Plaintext passwords, client-only sessions |
| Authorization | **Not production** | Premium/credits/admin bypassable via DevTools |
| AI proxy | **Beta only** | No auth/rate limit on `/api/ai/openai` |
| Data protection | **Partial** | Consent OK; no server export/delete |
| Dependency hygiene | **Moderate** | Unused Figma packages; 3 npm audit issues |

**Verdict:** Safe for **closed beta** with mitigations. **Not safe** for public paid launch until backend P0 complete.

---

## 1. Authentication

| Control | Status | Risk | Mitigation |
|---------|--------|------|------------|
| Password hashing | ❌ Missing | Critical | Backend Argon2id |
| Server sessions | ❌ Missing | Critical | HTTP-only cookie or JWT |
| Admin email registration block | ✅ Client | Medium | Replicate server-side |
| Admin seed password in bundle | ⚠️ If set | Critical | Keep `VITE_ADMIN_INITIAL_PASSWORD` empty |
| Forgot password | ⚠️ Honest stub | Low | Beta message only |
| Session integrity fingerprint | ⚠️ Weak | Low | Not relied on for security |

---

## 2. Authorization

| Control | Status | Backend required |
|---------|--------|------------------|
| Admin tab guard | ✅ UI | Server ACL on `/admin/*` |
| Premium flags | ❌ Client localStorage | Stripe + `/auth/me` |
| AI credits | ⚠️ Client ledger | Server atomic debit |
| Examiner Lab | Admin UI only | Admin role on API |

---

## 3. API & AI security

| Item | Current | Target |
|------|---------|--------|
| OpenAI key | Server env ✅ | Same |
| Proxy auth | ❌ None | Session required |
| Rate limiting | ❌ None | Per-user + IP |
| Input validation | ✅ Client + partial server | JSON Schema on API |
| Response leak | ✅ Fixed (no `raw`) | Maintain |
| Prompt logging | ❌ None in prod | Token counts only |

---

## 4. Transport & headers

| Header | Status |
|--------|--------|
| CSP | ✅ `vercel.json` |
| X-Frame-Options DENY | ✅ |
| X-Content-Type-Options nosniff | ✅ |
| Referrer-Policy | ✅ |
| Permissions-Policy | ✅ |
| HSTS | ⚠️ Vercel default — confirm in prod |

---

## 5. Data & privacy

| Data class | Storage today | Production |
|------------|---------------|------------|
| Passwords | Plaintext localStorage | Hashed DB only |
| Legal consent | Version + timestamp ✅ | `legal_consents` table |
| AI reports | Client array | `ai_reports` |
| Full AI transcripts | Not stored ✅ | Never store |
| Profile images | Base64 localStorage | Object storage URL |

---

## 6. Dependency & supply chain

- Run `npm audit` in CI (continue-on-error until fixed)
- ~40 unused UI packages from Figma export — prune in dedicated PR
- React pinned as direct dependency ✅
- CI build on push ✅

---

## 7. Closed beta acceptable risks

With invite-only URL, OpenAI cap, empty admin password env, and ≤20 testers:

- Plaintext passwords (unique beta passwords)
- Client-only auth
- Unauthenticated AI proxy (secret URL)

---

## 8. Pre-launch security checklist

- [ ] Backend auth live
- [ ] Authenticated `/ai/completions`
- [ ] Stripe webhooks verified
- [ ] Remove all client premium trust
- [ ] GDPR delete/export tested
- [ ] Pen test or OWASP ZAP on staging
- [ ] Secrets rotation documented
- [ ] Admin bootstrap via server secret only

See [Backend Security Requirements](./Backend%20Security%20Requirements.md).
