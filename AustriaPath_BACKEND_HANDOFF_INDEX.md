# AustriaPath — Backend Handoff Index

**Version:** 2.0.0-gate0 · **Date:** 4 July 2026  
**For:** Backend developer — start here

---

## Gate 0 — Architecture Freeze (START HERE)

**Master blueprint:** [`docs/backend-contract-pack/README.md`](./docs/backend-contract-pack/README.md)

| Artifact | Path |
|----------|------|
| Contract pack index | `docs/backend-contract-pack/README.md` |
| PostgreSQL DDL | `docs/backend-contract-pack/02-database-schema.sql` |
| OpenAPI 3.1 | `docs/backend-contract-pack/openapi.yaml` |
| JSON Schemas | `docs/backend-contract-pack/schemas/` |
| ERD | `docs/backend-contract-pack/03-entity-relationships.md` |
| Migration plan | `docs/backend-contract-pack/16-migration-plan.md` |

**Status:** FROZEN — Phase H implementation must conform to Gate 0 contracts.

---

## Read order (Phase H)

| # | Document | Time | Purpose |
|---|----------|------|---------|
| 1 | [Backend Contract Pack README](./docs/backend-contract-pack/README.md) | 15 min | Index + enum reconciliation |
| 2 | [Governance & Versioning](./docs/backend-contract-pack/01-governance-versioning.md) | 10 min | API versioning, idempotency |
| 3 | [openapi.yaml](./docs/backend-contract-pack/openapi.yaml) | 30 min | REST API surface |
| 4 | [Database Schema SQL](./docs/backend-contract-pack/02-database-schema.sql) | 45 min | Implement migrations |
| 5 | [Entity Relationships](./docs/backend-contract-pack/03-entity-relationships.md) | 15 min | ERD |
| 6 | Lifecycles 06–09 | 40 min | Subscription, sessions, reports, profile |
| 7 | Domain contracts 10–12 | 30 min | Mind, registry, lab |
| 8 | [AI Gateway](./docs/backend-contract-pack/13-ai-gateway-contracts.md) | 15 min | Unified LLM |
| 9 | [Webhooks](./docs/backend-contract-pack/14-webhook-contracts.md) | 10 min | Stripe |
| 10 | [Error codes](./docs/backend-contract-pack/15-error-codes-standards.md) | 10 min | Response envelope |
| 11 | [Migration plan](./docs/backend-contract-pack/16-migration-plan.md) | 20 min | localStorage → DB |

---

## Legacy reference docs (superseded where noted)

| Document | Status |
|----------|--------|
| [Database Schema v1.0](./AustriaPath_Database_Schema.md) | Reference only — Gate 0 schema extends/replaces exam tables |
| [Schema v1.1 Addendum](./AustriaPath_Database_Schema_v1.1_Addendum.md) | Merged into Gate 0 (`practice_heuristic` canonical) |
| [Backend Implementation Guide](./AustriaPath_Backend_Implementation_Guide.md) | Sprint plan still valid; contracts from Gate 0 |
| [Frontend Backend Integration](./AustriaPath_Frontend_Backend_Integration.md) | Wiring guide |
| Root [openapi.yaml](./openapi.yaml) | Pointer to Gate 0 spec |

---

## Code references (frontend)

| Path | Backend replaces |
|------|------------------|
| `src/exam-platform/` | Server Exam Engine port |
| `src/exam-platform/adapters/examEngineBridge.js` | `/exam-sessions/*` |
| `src/exam-platform/adapters/labBridge.js` | `/admin/examiner-lab/*` |
| `src/app/userAccess.js` | `/auth/*` |
| `src/security/secureOpenAI.js` | `/ai/completions` |
| `src/api/endpoints.js` | Route paths (extend for exam-sessions) |
| `src/security/storageRegistry.js` | Migration inventory |

---

## Do not re-architect

- Exam content files (`src/data/models*.js`)
- Screen flows / UI
- Unified Exam Platform invariants (Phases A–G)

Implement backend **through** Gate 0 contracts only.

---

## Sprint acceptance summary

| Sprint | Deliverable | Contract reference |
|--------|-------------|-------------------|
| 1 | Auth + DB DDL | 02, 04, openapi /auth |
| 2 | Exam sessions API | 07, exam-session.json |
| 3 | Reports + profile | 08, 09 |
| 4 | AI gateway + credits | 13 |
| 5 | Stripe + subscription | 06, 14 |
| 6 | Registry + Lab | 11, 12 |
| 7 | Migration + cutover | 16 |
