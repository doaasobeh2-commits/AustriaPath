# 01 — Governance & API Versioning

**Contract Pack version:** 2.0.0-gate0

---

## 1. Architecture freeze declaration

Gate 0 freezes:

- PostgreSQL schema (02)
- REST API surface (openapi.yaml)
- JSON Schemas (schemas/)
- Lifecycles (06–09)
- Domain contracts (10–12)
- Auth model (04–05)
- Error standards (15)
- Migration plan (16)

Phase H implementation **must not** introduce alternate enums, parallel report tables, or client-authoritative subscription state.

---

## 2. API versioning strategy

### 2.1 URL versioning (primary)

```
https://api.austriapath.at/v1/...
```

- **Major version in path:** `/v1`, `/v2`
- Breaking changes require new major path
- `/v1` supported minimum **12 months** after `/v2` GA

### 2.2 Resource schema versioning (secondary)

Domain documents carry internal schema versions:

| Resource | Field | Current value |
|----------|-------|---------------|
| Student profile | `profileVersion` | `2.0.0` |
| Final report | `schemaVersion` | `2.0.0` |
| Rule registry | `meta.schemaVersion` | `1.0.0` |
| Exam session blueprint | `rulesVersion` | Registry `meta.registryVersion` at start |

Clients send `Accept-Schema-Version` header (optional) for forward compatibility checks.

### 2.3 OpenAPI document version

`info.version` in openapi.yaml tracks contract pack semver (`2.0.0-gate0`), not API path version.

### 2.4 Deprecation headers

Deprecated endpoints respond with:

```
Deprecation: true
Sunset: Sat, 04 Jul 2027 00:00:00 GMT
Link: <https://api.austriapath.at/v2/...>; rel="successor-version"
```

### 2.5 Idempotency

Mutating endpoints accept:

```
Idempotency-Key: <uuid-v4>
```

Required for:

- `POST /subscription/consume-exam`
- `POST /exam-sessions/{id}/complete`
- `POST /admin/examiner-lab/{id}/resolve`
- `POST /admin/rule-registry/promote`

Stored in `idempotency_records` (TTL 72h).

---

## 3. Canonical enumerations

All enums below are PostgreSQL types and JSON Schema `$ref` targets.

### 3.1 Identity & access

| Enum | Values |
|------|--------|
| `user_role` | `student`, `admin`, `examiner` |
| `user_status` | `approved`, `blocked` |
| `email_verification_status` | `pending`, `verified` |

### 3.2 Products & exams

| Enum | Values |
|------|--------|
| `product_type` | `placement_test`, `weekly_plan`, `ai_exam`, `intensive_week`, `premium_month` |
| `exam_mode` | `diagnostic`, `practice`, `exam` |
| `skill_id` | `writing`, `reading`, `listening`, `picture_description`, `planning`, `discussion`, `self_introduction` |
| `cefr_label` | `A2`, `A2+`, `B1`, `B1+`, `B2`, `B2+` |
| `difficulty_band` | `leicht`, `mittel`, `stark` |
| `readiness_band` | `building`, `developing`, `approaching`, `strong` |
| `timing_policy` | `soft`, `hard` |
| `evaluation_method` | `examiner_mind`, `practice_heuristic`, `rule_placement`, `pending_human_review`, `llm_conversational` |
| `exam_session_status` | `pending`, `active`, `awaiting_review`, `completed`, `cancelled`, `expired` |

### 3.3 Subscription & payments

| Enum | Values |
|------|--------|
| `subscription_type` | `free`, `placement_test`, `weekly_plan`, `ai_exam`, `intensive_week`, `premium_month` |
| `subscription_status` | `inactive`, `active`, `expired`, `cancelled` |
| `payment_status` | `pending`, `processing`, `succeeded`, `failed`, `refunded`, `cancelled` |

### 3.4 Examiner Lab & registry

| Enum | Values |
|------|--------|
| `lab_queue_status` | `pending`, `in_review`, `resolved` |
| `lab_action_type` | `approve`, `reject`, `correct`, `propose_rule` |
| `human_review_status` | `pending`, `confirmed`, `corrected`, `disputed` |
| `rule_proposal_status` | `pending`, `approved`, `rejected` |
| `rule_proposal_action` | `add`, `modify`, `deprecate` |
| `registry_patch_type` | `append_scoring_rule`, `append_examiner_check`, `append_common_mistake`, `add_critical_rule` |

### 3.5 AI & credits

| Enum | Values |
|------|--------|
| `ai_credit_reason` | `registration_default`, `plan_activation`, `admin_grant`, `admin_reset`, `placement_test`, `weekly_plan`, `ai_exam`, `intensive_week_session`, `premium_month_session`, `report_builder`, `follow_up_question`, `llm_proposal`, `refund_clawback` |
| `ai_gateway_mode` | `examiner_judge`, `llm_proposal`, `conversational`, `report_narrative` |

---

## 4. Response envelope standard

All API responses use:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "req_uuid",
    "apiVersion": "v1",
    "timestamp": "2026-07-04T10:00:00.000Z"
  }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_INACTIVE",
    "message": "Human-readable German message for UI",
    "details": { }
  },
  "meta": { "requestId": "req_uuid", "apiVersion": "v1", "timestamp": "..." }
}
```

See [15-error-codes-standards.md](./15-error-codes-standards.md).

---

## 5. Time & locale

| Rule | Value |
|------|-------|
| Storage timezone | UTC (`TIMESTAMPTZ`) |
| API timestamps | ISO 8601 UTC |
| Display timezone | `Europe/Vienna` (client) |
| Primary API language | German user messages; English in `error.code` |

---

## 6. Privacy & retention (binding)

| Data class | Retention | Storage |
|------------|-----------|---------|
| Exam session answers (in progress) | ≤ 24h | Redis + `exam_sessions` |
| Completed exam reports | Until account deletion | PostgreSQL |
| AI completion logs | 90 days (tokens only) | PostgreSQL |
| Lab queue items | 24 months | PostgreSQL |
| Rule registry | Indefinite | PostgreSQL |
| Payments | 7 years | PostgreSQL |
| Raw OpenAI prompts/responses | **Not stored** in production | — |

---

## 7. Technology targets

| Component | Target |
|-----------|--------|
| Database | PostgreSQL 15+ |
| Session cache | Redis 7+ |
| Auth | HttpOnly secure cookie **or** JWT access + refresh rotation |
| Payments | Stripe Checkout + webhooks |
| AI | OpenAI via authenticated gateway only |
| File storage | S3-compatible (profile images) |

---

## 8. Contract pack ↔ frontend mapping

When `VITE_USE_BACKEND=true`:

| Frontend module | API surface |
|-----------------|-------------|
| `userAccess.js` | `/auth/*` |
| `examEngineBridge.js` | `/exam-sessions/*` |
| `legacyReportAdapter.js` | `/reports/*` |
| `studentProfileService.js` | `/student-profile` |
| `labBridge.js` | `/admin/examiner-lab/*` |
| `ruleRegistryService.js` | `/rule-registry` |
| `secureOpenAI.js` / `llmGateway.js` | `/ai/completions` |

Repository port interfaces (Phase H frontend pass) mirror these endpoints 1:1.
