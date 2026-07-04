# AustriaPath — Final Production Checklist

**Updated:** 4 July 2026 (v2 — backend handoff complete)  
**Status:** Frontend essentially production-ready · Backend not started

---

## ✅ 1. FINISHED

### Frontend engineering
- Security module, headers, CSP, OpenAI proxy (`messages`, no `raw` leak)
- Auth UI, legal consent, route guards, storage registry (40+ keys)
- Unified premium detection, AI credits ledger, subscription → user sync
- Placement engine fixed, dead code removed, admin lazy-loaded
- AccountSettings bug fixed, profile image size cap
- Vitest: **11 tests** (placement, sanitize, subscription, premium)
- CI: GitHub Actions build + test
- API contracts: `openapi.yaml`, `src/api/contracts.js`, `src/api/endpoints.js`

### Documentation package (backend developer can start immediately)
| Document |
|----------|
| [BACKEND_HANDOFF_INDEX](./AustriaPath_BACKEND_HANDOFF_INDEX.md) ← **start here** |
| [Backend Implementation Guide](./AustriaPath_Backend_Implementation_Guide.md) |
| [Frontend Backend Integration](./AustriaPath_Frontend_Backend_Integration.md) |
| [openapi.yaml](./openapi.yaml) |
| [Database Schema](./AustriaPath_Database_Schema.md) + [v1.1 Addendum](./AustriaPath_Database_Schema_v1.1_Addendum.md) |
| [LocalStorage Migration Guide](./AustriaPath_LocalStorage_Migration_Guide.md) |
| [Security Review](./AustriaPath_Security_Review.md) |
| [Deployment Runbook](./AustriaPath_DEPLOYMENT_RUNBOOK.md) |
| [Legal Operator Guide](./AustriaPath_Legal_Operator_Guide.md) |
| [Testing Strategy](./AustriaPath_Testing_Strategy.md) |
| [Frontend Module Map](./AustriaPath_Frontend_Module_Map.md) |
| [Production Engineering Package](./AustriaPath_Production_Engineering_Package.md) |
| [Knowledge Base](./AustriaPath_Knowledge_Base.md) |
| GDPR, AI Act, Launch Checklist, Closed Beta Plan |

---

## 🟡 2. CAN STILL BE COMPLETE WITHOUT BACKEND

| Item | Owner |
|------|-------|
| Fill Impressum placeholders | Operator — [Legal Operator Guide](./AustriaPath_Legal_Operator_Guide.md) |
| Legal counsel review | External |
| EC-01–EC-22 approvals | Product |
| EC-13 content human review | Examiner |
| EC-06/EC-19 UI copy labels | Product |
| Remaining `getUserLanguage()` screen migrations | Engineering (optional) |
| Prune unused npm packages | Engineering |
| Sentry wiring to `errorReporting.js` | DevOps |
| OpenAI spending cap | DevOps |
| npm audit fixes | Engineering |
| Commit/tag release | Git |

---

## 🔴 3. REQUIRES BACKEND DEVELOPER

| Item | Reference |
|------|-----------|
| PostgreSQL + migrations | Schema + v1.1 Addendum |
| Auth (hash, sessions, `/auth/me`) | Implementation Guide Sprint 1 |
| Authenticated `/ai/completions` | openapi.yaml |
| Server credits + permissions | Engineering Package §9 |
| Stripe Checkout + webhooks | Implementation Guide Sprint 4 |
| Reports, profile, placement APIs | Integration Guide |
| GDPR export + deletion | Schema + Implementation Guide |
| Email verify + password reset | Sprint 5 |
| Remove client premium trust | Integration Guide §3 |

**Handoff:** [AustriaPath_BACKEND_HANDOFF_INDEX.md](./AustriaPath_BACKEND_HANDOFF_INDEX.md)

---

## 🟠 4. REQUIRES PRODUCTION INFRASTRUCTURE

| Item |
|------|
| Production domain + TLS |
| Vercel prod env vars |
| PostgreSQL hosting + backups |
| Stripe live mode |
| Transactional email |
| Sentry + uptime monitoring |
| DPA / TIA with OpenAI |
| WAF / rate limiting at edge |

---

## Verdict

**Backend developer can implement and connect using documentation only** — no re-architecture required.

Frontend integration after backend: **~1–2 weeks** via [Frontend Backend Integration Guide](./AustriaPath_Frontend_Backend_Integration.md).

Commercial launch blocked on sections 3 + 4 + legal Impressum completion.
