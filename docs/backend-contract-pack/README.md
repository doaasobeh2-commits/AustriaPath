# AustriaPath Backend Contract Pack

**Gate 0 — Architecture Freeze**  
**Version:** 2.0.0-gate0  
**Status:** FROZEN — master blueprint for Phase H backend implementation  
**Date:** 4 July 2026  
**Aligned with:** Exam Platform `1.0.0-phase-g` (Phases A–G)

---

## Purpose

This contract pack is the **single authoritative specification** for AustriaPath backend development. It supersedes fragmented pre-Gate-0 documents where they conflict. Backend implementation (Phase H) must conform to these contracts without UI changes.

**In scope:** Specifications, schemas, API contracts, lifecycles, migration plan.  
**Out of scope:** Backend runtime code, database migrations in application repos, UI changes.

---

## Document Index

| # | Document | Contents |
|---|----------|----------|
| 01 | [Governance & Versioning](./01-governance-versioning.md) | Freeze rules, versioning strategy, canonical enums |
| 02 | [Database Schema (reference)](./02-database-schema.md) | Tables, columns, indexes, RLS summary |
| 02b | [Database Schema (DDL)](./02-database-schema.sql) | Executable PostgreSQL 15+ DDL |
| 03 | [Entity Relationships (ERD)](./03-entity-relationships.md) | ERD diagrams and FK map |
| 04 | [Authentication & Authorization](./04-auth-authorization.md) | Sessions, JWT/cookie, auth flows |
| 05 | [Roles & Permissions Matrix](./05-roles-permissions-matrix.md) | student / admin / examiner matrix |
| 06 | [Subscription & Payment Lifecycle](./06-subscription-payment-lifecycle.md) | Stripe, consume-exam, entitlements |
| 07 | [Exam Session Lifecycle](./07-exam-session-lifecycle.md) | Engine API, timing, idempotency |
| 08 | [Report Lifecycle](./08-report-lifecycle.md) | FinalReport, human review, revisions |
| 09 | [Student Profile Lifecycle](./09-student-profile-lifecycle.md) | V2 profile, merge policies |
| 10 | [Examiner Mind Contracts](./10-examiner-mind-contracts.md) | Council, judges, fusion |
| 11 | [Rule Registry Contracts](./11-rule-registry-contracts.md) | Registry, promotions, effective knowledge |
| 12 | [Examiner Lab Contracts](./12-examiner-lab-contracts.md) | Queue, resolution, rule promotion |
| 13 | [AI Gateway Contracts](./13-ai-gateway-contracts.md) | LLM proposals, credits, modes |
| 14 | [Webhook Contracts](./14-webhook-contracts.md) | Stripe, idempotency |
| 15 | [Error Codes & Response Standards](./15-error-codes-standards.md) | Envelope, codes, HTTP mapping |
| 16 | [localStorage Migration Plan](./16-migration-plan.md) | Key → table mapping, phases |

### Machine-readable artifacts

| Artifact | Path |
|----------|------|
| OpenAPI 3.1 | [openapi.yaml](./openapi.yaml) |
| JSON Schemas | [schemas/](./schemas/) |

---

## Architecture Alignment

```
Screens (unchanged UI)
    ↓ Repository ports (Phase H)
REST API (this contract pack)
    ↓
PostgreSQL + Redis (sessions TTL) + Stripe + OpenAI
    ↓
Exam Engine (server-side port of src/exam-platform/)
    → Skill Evaluators → LLM Gateway → Examiner Council → Report Builder
    → Student Profile → Lab enqueue → Rule Registry
```

### Canonical source code references

| Domain | Frontend contract source |
|--------|-------------------------|
| Exam types | `src/exam-platform/contracts.js` |
| Product policies | `src/exam-platform/productPolicies.js` |
| Rule registry shape | `src/exam-platform/ruleRegistrySchema.js` |
| Subscription validation | `src/exam-platform/subscriptionPolicy.js` |
| API error codes (legacy) | `src/api/contracts.js` |
| Storage keys | `src/security/storageRegistry.js` |

---

## Enum reconciliation (binding)

The following resolves pre-Gate-0 drift. **Backend and OpenAPI use the right column.**

| Concept | Deprecated | Canonical (exam-platform) |
|---------|------------|---------------------------|
| Practice evaluation | `training_heuristic` | `practice_heuristic` |
| Report storage key | `austriaPathAIReports` only | `exam_reports` table + legacy adapter |
| Student profile | `austriaPathStudentProfile` (V1) | `student_learning_profiles` (V2) |
| Lab queue | `examiner_lab_samples` only | `examiner_lab_queue_items` (Phase G) + samples archive |
| Rule source | `examiner_rules` rows only | `rule_registry` document + `rule_registry_promotions` |

---

## Implementation order (Phase H)

1. DDL from `02-database-schema.sql`
2. Auth + sessions (04)
3. Subscription + Stripe webhooks (06, 14)
4. Exam sessions API (07) — server Exam Engine
5. Reports + profile (08, 09)
6. AI gateway (13)
7. Rule registry + Lab (11, 12)
8. Migration scripts (16)

---

## Change control after freeze

| Change type | Process |
|-------------|---------|
| Bug fix in spec (typo, missing index) | Patch version `2.0.x-gate0` |
| Additive API field (optional) | Minor version `2.x.0-gate0` |
| Breaking schema/API change | Major version + migration guide; requires architecture review |

**Document owner:** AustriaPath Engineering  
**Next gate:** Phase H Sprint 1 kickoff
