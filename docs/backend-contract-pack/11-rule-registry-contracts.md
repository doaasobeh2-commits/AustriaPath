# 11 — Rule Registry Contracts

**Contract Pack version:** 2.0.0-gate0  
**Schema:** `schemas/rule-registry.json`  
**Reference:** `src/exam-platform/ruleRegistrySchema.js`

---

## 1. Single source of truth

All Examiner Mind judges read from Rule Registry — never from ad-hoc client storage.

| Client key (deprecated) | Server table |
|-----------------------|--------------|
| `austriaPathRuleRegistry` | `rule_registry_snapshots` |
| `austriaPathRuleProposals` | `rule_proposals` |
| `austriaPathAiPrueferLibrary` | `examiner_content_rules` (content models) |

**Distinction:**
- **Rule Registry** — scoring rubrics, examiner checks, promoted rules
- **Content rules** — exam task templates (AI-Prüfer library)

---

## 2. RuleRegistry document shape

```json
{
  "meta": {
    "registryVersion": "1.3.0",
    "updatedAt": "ISO8601",
    "approvedBy": "admin-user-uuid",
    "schemaVersion": "1.0.0"
  },
  "globalPrinciples": [],
  "criticalRules": [],
  "levels": {
    "B1": {
      "writing": {
        "skill": "writing",
        "level": "B1",
        "examinerChecks": [],
        "scoringRules": [],
        "commonMistakes": [],
        "examinerFeedback": []
      }
    }
  },
  "promotedRules": []
}
```

---

## 3. API endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/rule-registry` | Student+ | Current snapshot metadata |
| GET | `/rule-registry/effective` | Service | Materialized rubric for judge |
| GET | `/rule-registry/versions` | Admin | Version history |
| GET | `/rule-registry/versions/{version}` | Admin | Specific snapshot |
| POST | `/admin/rule-registry/promote` | Admin | Direct promotion |
| POST | `/admin/rule-registry/proposals` | Admin | Create proposal |
| POST | `/admin/rule-registry/proposals/{id}/approve` | Admin | Approve proposal |
| POST | `/admin/rule-registry/proposals/{id}/reject` | Admin | Reject proposal |

---

## 4. Promotion flow

### From Examiner Lab (`propose_rule`)

```
lab resolve(propose_rule)
  → rule_proposals INSERT (pending)
  → admin approve OR auto-approve if examiner policy allows (default: admin only)
  → promoteRuleDirectly()
  → rule_registry_promotions INSERT
  → new rule_registry_snapshots row (version bump)
  → clearEffectiveKnowledgeCache()
```

### Direct promote (admin)

**POST `/admin/rule-registry/promote`**

```json
{
  "ruleText": "Bei fehlendem Schlussabsatz max 70 Punkte.",
  "skill": "writing",
  "level": "B1",
  "structuredPatch": {
    "type": "append_scoring_rule",
    "path": "levels.B1.writing",
    "value": "..."
  },
  "sourceLabItemId": "optional-uuid",
  "rationale": "Lab review 2026-07-04"
}
```

---

## 5. Structured patch types

| Type | Target field |
|------|--------------|
| `append_scoring_rule` | `scoringRules[]` |
| `append_examiner_check` | `examinerChecks[]` |
| `append_common_mistake` | `commonMistakes[]` |
| `add_critical_rule` | `criticalRules[]` |

Materialization logic mirrors `registryKnowledgeMerge.js` — arrays always coerced via `asArray()`.

---

## 6. Conflict detection

Before promote:

```json
{
  "hasConflicts": false,
  "conflictDescriptions": [],
  "conflictingRuleIds": []
}
```

Duplicate `ruleText` (normalized) → warning, not hard block (human override allowed with rationale).

---

## 7. Version semantics

| Rule | Behavior |
|------|----------|
| Monotonic version | `registryVersion` string semver or incrementing |
| Session pinning | Exam uses version at `started_at` |
| Effective promotions | `approved_at <= session.started_at` |
| Cache | ETag = registryVersion on GET |

---

## 8. Seed bootstrap

Initial snapshot seeded from `ExaminerKnowledge.levels` — same as client `ruleRegistryService.seedFromExaminerKnowledge()`.

Migration imports client `austriaPathRuleRegistry` if newer than seed.

---

## 9. Examiner Mind learning invariant

**Examiner Mind learns ONLY from human-approved promoted rules.**

- Auto-logged errors → telemetry only
- Lab `approve` without rule → confirms AI; no registry change
- Lab `propose_rule` + promote → permanent knowledge
