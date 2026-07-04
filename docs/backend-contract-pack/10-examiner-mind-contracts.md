# 10 — Examiner Mind Contracts

**Contract Pack version:** 2.0.0-gate0  
**Versions:** `EXAMINER_MIND_VERSION = 2.0.0-contract`, `COUNCIL_VERSION = 2.0.0-phase-e`

---

## 1. Architecture

Examiner Mind is the **sole scoring authority** for exam-mode products. Weekly plan uses lightweight `decidePracticeCouncil`.

```
SectionEvaluation[]
    → examinerMindAdapter.collectFusionReports()
    → Legacy ExaminerCouncil + DecisionEngine
    → CouncilDecision
```

Server implementation ports `src/exam-platform/services/examinerCouncil.js` and `examinerMindAdapter.js`.

---

## 2. Judge pipeline

### Automated skills (deterministic evaluators)

| Skill | Evaluator | Council input |
|-------|-----------|---------------|
| `reading` | `readingEvaluator` | `source: skill_evaluator` |
| `listening` | `listeningEvaluator` | `source: skill_evaluator` |

### Pending skills (Mind judges)

| Skill | Path |
|-------|------|
| `writing` | Full judge pipeline + effective registry knowledge |
| `picture_description` | Full judge pipeline |
| `planning` | Full judge pipeline |
| `discussion` | Full judge pipeline |
| `self_introduction` | Full judge pipeline |

---

## 3. CouncilDecision contract

**Schema:** `schemas/council-decision.json`

| Field | Required | Description |
|-------|----------|-------------|
| `decisionId` | ✓ | UUID |
| `overallScore` | ✓ | 0–100 |
| `cefrLevel` | ✓ | |
| `confidence` | ✓ | 0–100 |
| `skillResults` | ✓ | Per-skill breakdown |
| `strengths` | ✓ | SkillId[] |
| `weaknesses` | ✓ | SkillId[] |
| `needsHumanReview` | ✓ | Lab eligibility input |
| `humanReviewReason` | | classification string |
| `rulesVersion` | ✓ | Registry version used |
| `examinerMindVersion` | ✓ | |
| `decidedAt` | ✓ | ISO timestamp |

**Extended fields (Phase E — include in schema):**

| Field | Description |
|-------|-------------|
| `evaluationMethod` | `examiner_mind` etc. |
| `humanReadableStrengths` | string[] |
| `humanReadableWeaknesses` | string[] |
| `narrativeNotes` | string[] |
| `fusionReports` | JudgeReport[] — admin only in API |
| `conflicts` | CouncilConflict[] |
| `criticalRulesApplied` | string[] |

---

## 4. Practice council (weekly_plan)

`decidePracticeCouncil()`:

- Averages evaluator normalized scores
- `needsHumanReview: false` always
- No lab enqueue
- `evaluationMethod: practice_heuristic`

---

## 5. Human review triggers

When `productPolicy.labEligible === true`:

| Condition | `needsHumanReview` |
|-----------|-------------------|
| `needsDeepReview` from DecisionEngine | true |
| `confidence < confidenceReviewThreshold` | true |
| Judge conflicts | true |
| Critical rule applied | true |

---

## 6. Effective knowledge

Judges MUST use:

```
GET /rule-registry/effective?level=B1&skill=writing&version={pinned}
```

Returns merged rubric from base registry + promotions effective at timestamp.

Never read static `ExaminerKnowledge` files directly in production.

---

## 7. LLM proposals input

When `llmProposalsAllowed`:

Council receives `LLMProposal[]` as advisory input only — **LLM cannot set final score**.

| Proposal type | Use |
|---------------|-----|
| `grammar`, `vocabulary`, `structure` | Evidence hints |
| `narrative` | Report narrative draft |
| `follow_up_question` | Optional section follow-up |

---

## 8. Server-side execution requirements

| Requirement | Detail |
|-------------|--------|
| Timeout | Council max 120s per complete |
| Retry | Idempotent on same session evaluations hash |
| Logging | Log decisionId, scores, rulesVersion — not raw answers |
| Isolation | Per-session worker; no shared mutable judge state |

---

## 9. API surface (internal)

These are **not** public REST endpoints — engine internal interfaces:

| Interface | Input | Output |
|-----------|-------|--------|
| `ISkillEvaluator.evaluate` | SectionAnswer + content | SectionEvaluation |
| `ILLMGateway.proposeSectionAnalysis` | context | LLMProposal[] |
| `IExaminerCouncil.decideCouncil` | evaluations + productType | CouncilDecision |
| `IReportBuilder.buildFinalReport` | CouncilDecision | FinalReport |

Public API exposes outcomes via exam session complete only.

---

## 10. Version compatibility

| Component | Version field | Bump when |
|-----------|---------------|-----------|
| Examiner Mind | `examinerMindVersion` | Judge logic changes |
| Rule Registry | `rulesVersion` | Promotion applied |
| Skill evaluator | `evaluatorVersion` | Scoring rule change |

Reports store all three for audit.
