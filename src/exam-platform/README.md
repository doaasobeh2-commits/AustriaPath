# AustriaPath Exam Platform — Phases A–G

Unified Exam Engine with Examiner Mind, screen adapters (F), and **Lab → Registry feedback loop (G)**.

## Phase G — Examiner Lab + Rule Registry

```
Exam Engine complete()
  → maybeEnqueueLabCase()  (~1/week, needsHumanReview only)
  → Examiner Lab (admin)
  → resolveLabItem(approve | reject | correct | propose_rule)
  → promoteRuleDirectly() → Rule Registry (version bump)
  → getEffectiveKnowledgeForJudge() → Examiner Mind judges
```

| Module | Role |
|--------|------|
| `services/examinerLabService.js` | Selective enqueue |
| `services/labResolutionService.js` | Human review actions |
| `services/rulePromotionService.js` | Approved rules → Registry |
| `services/registryKnowledgeMerge.js` | Promoted rules → judge knowledge |
| `adapters/labBridge.js` | `ExaminerLabScreen` adapter |

**Telemetry** (`austriaPathAIErrorLog`) remains internal — not the Lab queue.

## Invariants

1. Lab receives only high-value `needsHumanReview` cases (~1/week).
2. Examiner Mind learns **only** from human-approved promoted rules.
3. Rule Registry is the single source of truth (`austriaPathRuleRegistry`).
4. Student-visible human review only when report corrected.
5. No UI redesign — admin Lab screen wired internally.
