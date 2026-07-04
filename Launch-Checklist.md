# Launch Checklist — AustriaPath

**Version:** 2026.07  
**Target launch:** _[date TBD]_  
**Owner:** _[name]_

Use this checklist before enabling public registration and marketing.

---

## Legal pages

- [ ] **Impressum** — real operator name, address, contact (replace placeholders in `src/legal/legalContent.js`)
- [ ] **Datenschutz** — reviewed by qualified legal counsel (AT/EU)
- [ ] **AGB** — reviewed and aligned with Premium/payment terms
- [ ] **Kontakt** — functional support and datenschutz@ emails
- [ ] **Cookie Policy** — matches actual storage (localStorage inventory)
- [ ] **AI Disclaimer** — linked from AI features and legal footer
- [ ] Legal links visible on: Auth welcome, Register, Account Settings, Consent screen
- [ ] Increment `LEGAL_VERSIONS` when text changes; test re-consent flow

---

## Privacy

- [ ] First-launch consent stores **only** `{ acceptedAt, privacyVersion, termsVersion }`
- [ ] Register flow references Datenschutz + AGB with working links
- [ ] Privacy policy lists all subprocessors (OpenAI, hosting, email)
- [ ] Cookie/localStorage policy documented for users
- [ ] No analytics/tracking without consent banner (currently none — confirm before adding)
- [ ] Profile image size limits enforced (`MAX_PROFILE_IMAGE_BYTES`)

---

## GDPR

- [ ] Complete [GDPR-Readiness-Review.md](./GDPR-Readiness-Review.md) action items
- [ ] Backend account **deletion** API implemented and tested
- [ ] Backend data **export** API (JSON/CSV) implemented
- [ ] DPA signed with OpenAI and hosting provider
- [ ] Transfer Impact Assessment for US AI processing
- [ ] DPIA completed for AI evaluation features
- [ ] Data retention jobs configured (reports, logs, backups)
- [ ] Process for DSGVO requests documented (30-day SLA)
- [ ] Register of processing activities (Verarbeitungsverzeichnis) maintained

---

## AI Act Article 4

- [ ] Users informed they interact with AI (consent + AI Disclaimer + Transparency doc)
- [ ] AI limitations clearly stated (not certified examiner)
- [ ] Examiner Lab purpose documented (rule improvement, manual samples only)
- [ ] Admin-only AI configuration screens access-controlled
- [ ] [AI-Transparency.md](./AI-Transparency.md) published internally/on request
- [ ] [AI-Privacy-Policy.md](./AI-Privacy-Policy.md) aligned with actual storage behaviour

---

## Security

- [ ] Replace client-only auth with server-side authentication (see `Backend Security Requirements.md`)
- [ ] Passwords hashed server-side (bcrypt/argon2); never stored in localStorage in production
- [ ] OpenAI calls **only** via authenticated server proxy
- [ ] Admin routes guarded server-side (`admin`, `userManagement`, `examinerLab`, `aiPruefer`)
- [ ] HTTPS enforced; HSTS configured (`vercel.json` / hosting)
- [ ] CSP headers reviewed for production
- [ ] Rate limiting on auth and AI endpoints
- [ ] Dependency audit (`npm audit`) — critical issues resolved
- [ ] Secrets in environment variables only; `.env` not committed
- [ ] Session invalidation on logout and password change

---

## Deployment

- [ ] Production domain configured with valid TLS certificate
- [ ] Environment variables set (`VITE_*` only for non-secrets)
- [ ] Build passes: `npm run build`
- [ ] Smoke test: onboarding → consent → register → login → practice → AI report → logout
- [ ] Admin smoke test: user management, content, Examiner Lab
- [ ] Error pages (404) configured on host
- [ ] Robots.txt / sitemap if public marketing site exists
- [ ] Impressum link in footer of any public landing page

---

## Backup

- [ ] Database automated daily backups (when backend live)
- [ ] Backup encryption at rest
- [ ] Restore procedure tested (RTO/RPO documented)
- [ ] Backup retention ≤ 30 days (align with GDPR review)
- [ ] Client localStorage is **not** a backup — user data must live server-side

---

## Monitoring

- [ ] Uptime monitoring (e.g. UptimeRobot, Better Stack)
- [ ] Error tracking (e.g. Sentry) — no PII in logs
- [ ] AI proxy latency and error rate dashboards
- [ ] Alerting for auth failures spike / AI cost anomaly
- [ ] Log retention policy enforced (≤ 90 days)
- [ ] Incident response runbook documented

---

## Production configuration

- [ ] `NODE_ENV=production` / Vite production build
- [ ] Debug endpoints and console logging disabled in prod
- [ ] CORS restricted to production origin
- [ ] API base URL points to production backend
- [ ] OpenAI: zero-retention or minimum retention setting confirmed
- [ ] Email service configured (verification, password reset, DSGVO responses)
- [ ] Premium/payment webhooks on production keys (when enabled)
- [ ] Legal version constants updated in `src/legal/legalVersions.js`

---

## Sign-off

| Area | Reviewer | Date | Approved |
|------|----------|------|----------|
| Legal | | | ☐ |
| Privacy / DPO | | | ☐ |
| Security | | | ☐ |
| Engineering | | | ☐ |
| Product | | | ☐ |

**Do not launch publicly until Legal, Privacy, and Security sign-off are complete.**
