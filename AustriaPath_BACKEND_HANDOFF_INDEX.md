# AustriaPath — Backend Handoff Index

**Version:** 1.0 · **Date:** 4 July 2026  
**For:** Backend developer — start here

---

## Start here (read order)

| # | Document | Time | Purpose |
|---|----------|------|---------|
| 1 | [Backend Implementation Guide](./AustriaPath_Backend_Implementation_Guide.md) | 30 min | 5-sprint plan, acceptance criteria |
| 2 | [openapi.yaml](./openapi.yaml) | 20 min | Machine-readable API contract |
| 3 | [Database Schema](./AustriaPath_Database_Schema.md) | 45 min | PostgreSQL tables, RLS, indexes |
| 4 | [Schema v1.1 Addendum](./AustriaPath_Database_Schema_v1.1_Addendum.md) | 10 min | New columns since v1.0 |
| 5 | [LocalStorage Migration Guide](./AustriaPath_LocalStorage_Migration_Guide.md) | 15 min | Client → DB key mapping |
| 6 | [Frontend Backend Integration](./AustriaPath_Frontend_Backend_Integration.md) | 20 min | How SPA connects after API ships |
| 7 | [Production Engineering Package](./AustriaPath_Production_Engineering_Package.md) | Reference | Auth, AI, Stripe, credits |
| 8 | [Backend Security Requirements](./Backend%20Security%20Requirements.md) | 20 min | Non-negotiable controls |

---

## Code references (frontend)

| Path | Backend replaces |
|------|------------------|
| `src/app/userAccess.js` | `/auth/*` |
| `src/utils/aiCredits.js` | Credit ledger + `/ai/usage` |
| `src/security/secureOpenAI.js` | `/ai/completions` |
| `src/data/subscriptionEngine.js` | Permissions model in DB |
| `src/api/endpoints.js` | Route paths |
| `src/api/contracts.js` | Types + error codes |
| `src/security/storageRegistry.js` | Migration inventory |

---

## Do not re-architect

- ExaminerMind judges (`src/ai/examinerMind/`) — keep client-side v1 unless EC items approved
- Screen flows / UI — no redesign
- Exam content files (`src/data/models*.js`)

---

## Sprint acceptance summary

| Sprint | Deliverable | Frontend unblocks |
|--------|-------------|-------------------|
| 1 | Auth + DB | Login against API |
| 2 | AI proxy + credits | Real credit enforcement |
| 3 | Reports + profile | Profile sync |
| 4 | Stripe | Remove client free premium |
| 5 | GDPR + admin APIs | Production launch |

---

## Questions

Architecture: [Knowledge Base](./AustriaPath_Knowledge_Base.md)  
AI governance: [Examiner Council Decision Guide](./AustriaPath_ExaminerCouncil_DecisionGuide.md)  
Launch gates: [Final Production Checklist](./AustriaPath_Final_Production_Checklist.md)
