# AustriaPath Examiner Council Review

**Document version:** 1.0  
**Last updated:** 4 July 2026  
**Status:** Expert analysis only — no implementation authorized  
**Perspective:** ÖIF/TELC-style oral exam practice, writing assessment, and AI exam architecture  

---

## Important Notice

This document is an **expert review and recommendation report only**. No code, prompts, models, database schema, or UI has been modified.

Implementation requires explicit approval. Findings are based on review of the current AustriaPath codebase: exam models (`modelsA2.js`, `aiPremiumLibrary.js`, `premiumExamBuilder.js`), ExaminerMind (`src/ai/examinerMind/`), evaluation screens (`PremiumExamSessionScreen.jsx`, `AISessionScreen.jsx`, `IntelligentExamScreen.jsx`), and related governance documents.

**Scope clarification:** AustriaPath prepares students for **ÖIF-style** integration exams. It is not an official ÖIF or TELC examination system. Where TELC differs (e.g. written formats, rubric weighting), this review notes alignment gaps.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Exam Model Quality Analysis](#2-exam-model-quality-analysis)
3. [Prompt & AI Evaluation Consistency](#3-prompt--ai-evaluation-consistency)
4. [Examiner Flow Analysis](#4-examiner-flow-analysis)
5. [Evaluation Criteria Completeness](#5-evaluation-criteria-completeness)
6. [Cross-Domain Conflicts (Grammar, Speaking, Writing)](#6-cross-domain-conflicts-grammar-speaking-writing)
7. [Examiner Mind Architecture Gaps](#7-examiner-mind-architecture-gaps)
8. [Council → Decision Engine → Rules Pipeline](#8-council--decision-engine--rules-pipeline)
9. [Pre-Launch Redesign Recommendations](#9-pre-launch-redesign-recommendations)
10. [Recommendation Index](#10-recommendation-index)

---

## 1. Executive Summary

AustriaPath has a **conceptually sound** multi-judge architecture (Examiner Council + Decision Engine + knowledge files) that mirrors how human exam boards separate task completion, language form, and communication. The design direction is appropriate for a learning platform.

However, the **current implementation gap between architecture and runtime behaviour** is significant enough to affect premium AI exam credibility:

| Area | Assessment |
|------|------------|
| Static writing models (complete entries) | Generally **appropriate A2** ÖIF-style email tasks |
| Static writing models (`status: "preview"`) | **Not exam-ready** — empty content, 27+ placeholders in `modelsA2.js` |
| Premium exam assembly | **Realistic structure** (Schreiben → Lesen → Hören → Sprechen parts) |
| ExaminerMind scoring | **Over-reliant on keyword substring matching**; not equivalent to human rubric scoring |
| Knowledge routing in `Brain` | **Misaligned** — speaking knowledge applied to all oral sub-parts; reading/listening prose rubrics on MCQ tasks |
| Level labelling | **B2 exams cannot receive B2 outcome labels** — `mapScoreToLevel()` caps at `B1+` |
| Dual evaluation paths | **Three incompatible systems**: ExaminerMind, OpenAI conversational (`IntelligentExamScreen`), heuristic weekly session (`AISessionScreen`) |
| AI-Prüfer rule integrity | **Structured rules flattened** when saved via admin UI |

**Overall verdict:** Suitable for **internal beta and training practice** with clear disclaimers. **Not yet suitable** for marketing as consistent, level-accurate AI examination without addressing Critical and High items in Section 10.

---

## 2. Exam Model Quality Analysis

### 2.1 Strong or Adequate Models

**A2 complete writing models (ids 1–5 in `modelsA2.js`):**  
Tasks such as *Zahnarzt Termin absagen*, *Kindergarten Anmeldung*, and *Beschwerde Nachbar* follow authentic ÖIF A2 Schreiben patterns: Betreff, Anrede, bullet-point coverage, Grußformel. Vocabulary and grammar tags match A2 expectations. These are **usable for training** and align with `A2WritingKnowledge.expectedElements` (Anrede, Grund, Punkte, Grußformel).

**AI-Prüfer seed library (`aiPremiumLibrary.js`):**  
Models like `a2-self-001` (Selbstvorstellung) and `a2-bild-001` (Bäckerei) have coherent `mandatoryTopics`, `examinerQuestions`, and level-appropriate `shortPrompt` text. **Conceptually sound** for AI-driven oral simulation.

**Premium exam oral prompts (`premiumExamBuilder.js`):**  
`buildSelfIntroPart`, `buildImagePart`, and `buildPlanningPart` use level-differentiated instructions (A2 short intro vs B2 Ausbildung/Beruf/Erfahrungen). **Realistic situational framing** for ÖIF preparation.

**B1/B2 knowledge files:**  
`B1SpeakingKnowledge` and `B2SpeakingKnowledge` define examiner checks and expected elements that reflect real examiner priorities (planning, opinion, graphic interpretation at B2).

### 2.2 Weak, Unrealistic, or Mis-leveled Models

| Issue | Evidence | Expert assessment |
|-------|----------|-------------------|
| **27+ A2 preview models without content** | `modelsA2.js` ids 6+ — `status: "preview"`, empty `schreiben`, `words`, `grammar` | **Not usable** for any exam or AI evaluation; tip says "bald verfügbar" |
| **Random exam assembly** | `premiumExamBuilder.js` — `pickOne()` / `pickMany()` without quality filter | Weak preview models could theoretically enter writing slot if promoted without review |
| **Single generic image (Intelligent Exam)** | `IntelligentExamScreen.jsx` — one Unsplash office photo for all levels | **Not ÖIF-realistic** — A2/B1/B2 Bildbeschreibung expects level-appropriate visual complexity |
| **B2 speaking evaluated with B1+ ceiling** | `DecisionEngine.mapScoreToLevel()` — max label `B1+` | B2 student never receives B2-level feedback label despite B2 exam |
| **Reading/listening as open-text evaluation** | Premium parts include MCQ/cloze; ExaminerMind expects prose `expectedElements` | **Category mismatch** — like scoring a multiple-choice paper with an essay rubric |
| **TELC parity not evidenced** | All structure references `OEIF` in `examStructure.js` | Acceptable if marketed as ÖIF-focused; **misleading** if branded as TELC preparation |

### 2.3 Level Accuracy Summary

| Level | Content quality | Evaluation accuracy |
|-------|-----------------|---------------------|
| **A2** | Good for complete writing models; many incomplete previews | Moderate — keyword bias inflates/deflates scores |
| **B1** | Lesen/Hören banks exist (`b1LesenModels`, `b1HorenModels`); oral tasks reasonable | Moderate — same engine issues |
| **B2** | Grafik/oral framing present | **Weak** — no B2 outcome mapping; graphic tasks share speaking rubric with self-intro |

---

## 3. Prompt & AI Evaluation Consistency

AustriaPath uses **two distinct AI evaluation channels**:

1. **ExaminerMind** — rule judges + Decision Engine (deterministic)
2. **OpenAI LLM** — `IntelligentExamScreen`, `modelRouter` engines (`reportBuilder`, etc.)

These can produce **contradictory feedback** for the same student performance.

### 3.1 Prompt Sources

| Source | Role | Consistency risk |
|--------|------|------------------|
| `IntelligentExamScreen` `LEVEL_CONFIG.system` | Conversational ÖIF examiner persona | Separate from ExaminerMind; no shared rubric |
| `api/ai/openai.js` system message | Fixed: *"Du bist ein offizieller ÖIF-Prüfer..."* | Generic; no level/skill context from knowledge files |
| `aiPremiumLibrary.shortPrompt` | Per-model AI-Prüfer instruction | Rich structure; **lost or flattened** if re-saved via `AIPrueferScreen` (`linesToArray` on `followUpRules`) |
| `modelRouter` `reportBuilder` prompt | `"Bewerte diese Premium-Prüfung..."` + JSON answers | LLM summary may disagree with Decision Engine score |

### 3.2 Inconsistency Mechanisms

- **Temperature 0.3** on OpenAI reduces but does not eliminate variance between sessions.
- **No prompt version binding** between AI-Prüfer model version and ExaminerMind knowledge version.
- **IntelligentExam** maintains `conversationHistory` but does not feed ExaminerMind; final report is LLM-generated separately.
- **Weekly training** (`AISessionScreen`) uses word-count heuristics (`weil`, `deshalb` markers) — a strong A2 answer without Konnektoren scores `weak`.

---

## 4. Examiner Flow Analysis

### 4.1 Premium AI Exam Flow

```
buildPremiumExamPackage → student completes parts → runExaminerMind per part
→ finishExam runExaminerMind again → runModelRouter reportBuilder → save report
```

**Logical weaknesses identified:**

| # | Weakness | Detail |
|---|----------|--------|
| F1 | **Per-part evaluation not wired to step navigation** | `evaluateCurrentPart()` exists but `nextStep()` does not await it; student advances without per-part scores affecting flow |
| F2 | **Final evaluation uses last part context only** | `finishExam()` passes `currentPart` and partial `answers` — not aggregated multi-part performance |
| F3 | **Brain ignores passed `currentSection`** | `brain.js` uses `structure.sections[sectionIndex]` only — overwrites `currentSection.skill` from `PremiumExamSessionScreen` |
| F4 | **All oral sub-tasks share speaking knowledge** | Self-intro, Bild, Planung all use `sectionIndex: 3` → same `A2SpeakingKnowledge.expectedElements` including picture elements for intro-only answers |
| F5 | **reportBuilder runs after separate final runExaminerMind** | Two Brain invocations may yield different scores in report vs summary |

### 4.2 Intelligent Exam Flow

Separate conversational loop with speech recognition → OpenAI → no ExaminerMind integration. **Parallel universe** to premium exam scoring.

### 4.3 Weekly Plan / AI Session Flow

Heuristic `strong`/`middle`/`weak` → report without ExaminerMind. Appropriate for **adaptive training messaging** but **must not be presented as ÖIF exam scoring**.

### 4.4 Placement Test Flow

Uses placement libraries and `placementEngine.js` — separate from ExaminerMind level labels. Acceptable if placement is clearly "orientation" not "certification."

---

## 5. Evaluation Criteria Completeness

### 5.1 What Is Covered

| Criterion | Judge / mechanism | Completeness |
|-----------|-------------------|--------------|
| Task completion | `TaskJudge` — `expectedElements` keyword match | Partial — no semantic understanding |
| Grammar structures | `GrammarJudge` — `expectedStructures` substring | Partial — no error detection |
| Vocabulary breadth | `VocabularyJudge` — token diversity ratio | **Minimal** — ignores level word lists and `keywords` from AI-Prüfer |
| Sentence structure | `StructureJudge` — duplicate of Task keyword logic | Partial — examiner id mismatch (see §8) |
| Communication | `CommunicationJudge` — length thresholds | **Minimal** — does not assess clarity or interaction |
| Reasoning | `ReasoningJudge` — keyword overlap with expectedElements | **Redundant** with TaskJudge |
| Critical caps | `DecisionEngine.applyCriticalRules` | **Good concept** — mirrors human "task not met = cap" |
| Conflict detection | `detectConflicts` | **Good concept** — flags judge divergence |
| Confidence | `calculateConfidence` | Useful for Examiner Lab triage |

### 5.2 What Real ÖIF Examiners Assess But System Omits

| Real examiner criterion | Current gap |
|-------------------------|-------------|
| **Pronunciation / intelligibility** | Speech input transcribed; no phonetic assessment |
| **Fluency and pausing** | Not measured |
| **Register (formal email vs informal)** | Writing knowledge mentions Anrede; not enforced per task type |
| **Correctness of reading/listening answers** | MCQ correctness not compared to `answers` key in models |
| **Interactive planning behaviour** | Planning scored as static text, not turn-taking |
| **ÖIF global pass/fail logic** | Platform uses continuous 0–100 score, not module pass thresholds |
| **B2 argumentation depth** | No separate analytic dimension beyond keywords |
| **Exam time / length norms** | `estimatedTime` in models not enforced in scoring |

### 5.3 Criteria Consistency Across Skills

All six judges pull from the **same** `currentKnowledge` file per section. There are no skill-specific judge configurations beyond what is in the monolithic knowledge object. Speaking, writing, reading share one `expectedElements` list per level skill file — **insufficient granularity** for sub-task types (Selbstvorstellung vs Bild vs Planung).

---

## 6. Cross-Domain Conflicts

### 6.1 Grammar vs Communication

**Human examiner behaviour:** A student with broken grammar but successful communication can pass A2 speaking. ExaminerMind **partially** reflects this via `applyCriticalRules` (task cap) and `strong_language_weak_task` conflict.

**System conflict:** `GrammarJudge` assigns **all** `commonMistakes` titles as weaknesses unless the mistake title appears as a detected structure in `strengths` — which it never will. Result: grammar judge **always reports maximum weaknesses**, depressing confidence and flooding Examiner Lab.

### 6.2 Speaking Criteria vs Writing Assessment

Premium exam evaluates writing answers with `A2WritingKnowledge` (Anrede, Grußformel) but oral intro with `A2SpeakingKnowledge` (includes Bild elements). A student strong in writing may show unrelated weaknesses when speaking judges reuse elements from the full speaking checklist.

### 6.3 AI Conversational Prompt vs Rule Judges

`IntelligentExamScreen` system prompt asks for *"offizieller ÖIF-Prüfer"* behaviour with follow-up questions. ExaminerMind never sees this dialogue. Student may receive encouraging conversational feedback while rule judges score the transcript poorly on missing keywords.

### 6.4 AI-Prüfer followUpRules vs ExaminerMind

Library models define structured `followUpRules` (e.g. `ifMissing: 'Herkunftsland'`). Admin-saved models convert rules to plain strings. **Runtime OpenAI path cannot reliably execute structured follow-up logic** after admin edits.

### 6.5 Score Label vs Exam Level

Student takes **B2** premium exam; Decision Engine returns level **`B1+` maximum**. This contradicts real examiner reporting where B2 performance is judged against B2 descriptors, not capped at B1+.

---

## 7. Examiner Mind Architecture Gaps

### 7.1 Conceptual Model (Sound)

```
Brain → load exam structure + knowledge → ExaminerCouncil (6 judges)
→ DecisionEngine → optional AuditEngine → StudentProfile update
```

This mirrors a **human examination board** — appropriate architecture for AustriaPath.

### 7.2 Conceptual Gaps

| Gap | Description |
|-----|-------------|
| **G1 — No skill/task routing layer** | Missing mapping: `self_intro` → intro rubric; `image` → picture rubric; `planning` → planning rubric |
| **G2 — No modality split** | Reading/listening need **correctness scoring**, not prose rubrics |
| **G3 — No level-scaled outcome band** | Single `mapScoreToLevel` for A2–B2; no B2 tier |
| **G4 — Knowledge files disconnected from AI-Prüfer models** | Two parallel content systems not synchronized |
| **G5 — Examiner Lab not closed-loop** | Errors logged; no rule feedback into knowledge or judges |
| **G6 — LLM and rules not arbitrated** | No single "chair examiner" reconciling OpenAI report vs council |
| **G7 — Student profile aggregates incompatible scores** | `examHistory` mixes weekly heuristics, premium ExaminerMind, placement |

### 7.3 Comparison to Real Examiner Board

Real ÖIF oral board: one lead examiner, structured parts, part-specific rubrics, holistic impression at end. AustriaPath: six judges always run with shared knowledge, weighted average, no part-specific chair summary. **Architecture is more granular than human process in some ways, less accurate in others.**

---

## 8. Council → Decision Engine → Rules Pipeline

### 8.1 Pipeline Flow (As Implemented)

```
ExaminerCouncil.collect()
  → TaskJudge, GrammarJudge, VocabularyJudge, StructureJudge,
     CommunicationJudge, ReasoningJudge
DecisionEngine.decide()
  → weighted score → critical rules → warnings → conflicts → confidence
  → if confidence < 65 OR warnings OR conflicts → saveAIError()
ExaminerRules (global flags in examinerRules.js) — not invoked in decide path
AI-Prüfer examinerRules[] — used in OpenAI path, not in rule judges
```

### 8.2 Pipeline Weaknesses

| ID | Weakness | Technical detail |
|----|----------|------------------|
| P1 | **Structure judge naming mismatch** | `StructureJudge` emits `examiner: "structure"`; `DecisionEngine` searches `"basicStructure"` — weight defaults to 1.0; conflict/warning logic for structure often **skipped** |
| P2 | **Duplicate judge logic** | TaskJudge, StructureJudge, ReasoningJudge share keyword-inclusion pattern — **triple counts** similar signal |
| P3 | **Vocabulary judge ignores knowledge** | Does not use `keywords`, `mandatoryTopics`, or level word lists from AI-Prüfer |
| P4 | **Communication judge ignores checks** | Loads `examinerChecks` but never evaluates against them |
| P5 | **Empty knowledge fallback** | Missing knowledge → score 0 reports → triggers error log spam |
| P6 | **Generic strengths injection** | `extractStrengths` fabricates German strengths from score bands when judges omit them — **consistent-looking but ungrounded feedback** |
| P7 | **Global ExaminerRules unused in pipeline** | `NEVER_GUESS`, `REQUIRE_EVIDENCE` are documentation-only flags |
| P8 | **AuditEngine shallow** | Only checks confidence band and borderline score; does not re-run judges or request follow-up automatically |

### 8.3 Error Log → Examiner Lab → Rules (Planned but Incomplete)

`saveAIError()` correctly identifies uncertain cases. Examiner Lab UI exists but **Correct / Wrong / New Rule** actions are inert. **Pipeline stops at logging** — no path to update `examinerKnowledge` or AI-Prüfer models.

---

## 9. Pre-Launch Redesign Recommendations

The following items describe **what should be redesigned** — not implementation. Each is listed again with full metadata in Section 10.

### 9.1 Must Address Before Marketing Premium AI Exam

1. **Unify or clearly label evaluation paths** — students must know whether they receive ExaminerMind scoring, LLM opinion, or training heuristics.
2. **Fix skill/task → knowledge routing** — sub-part rubrics for oral sections; MCQ correctness for Lesen/Hören.
3. **Extend level mapping for B2** — outcomes must include B2 descriptors when exam level is B2.
4. **Block incomplete models** from premium assembly (`status: preview`, empty content).
5. **Resolve StructureJudge / DecisionEngine naming mismatch** — or council scores are partially ignored.
6. **Human review minimum** for models in premium path (per `AustriaPath_Exam_Content_Quality_and_Examiner_Council.md`).

### 9.2 Acceptable After Launch (With Disclaimer)

- Examiner Lab closed-loop automation
- Automated conflict check before publish
- Pronunciation/fluency modules
- TELC-specific model bank
- Chair-examiner LLM arbitration layer

### 9.3 Technical Debt Risk if Deferred Too Long

Dual evaluation paths (ExaminerMind + OpenAI + heuristics) will become **harder to unify** as reports accumulate and users compare scores across features. Knowledge files and AI-Prüfer library divergence will compound. Error log without Lab workflow will grow unbounded low-signal noise.

---

## 10. Recommendation Index

Each recommendation follows the required format.

---

### EC-01 — Block preview and empty models from premium AI exam assembly

| Field | Detail |
|-------|--------|
| **Why it matters** | 27+ A2 models in `modelsA2.js` have `status: "preview"` and empty `schreiben`. Random `pickOne()` in `premiumExamBuilder.js` could assign unusable tasks. |
| **Risk if ignored** | Students receive empty writing tasks in paid AI exams; reputational and refund risk. |
| **Recommended solution** | Governance gate: only models with `ai_exam_ready` or `human_verified` enter premium builder; exclude `preview` and empty content. Manual review of complete A2 ids 1–5 first. |
| **Priority** | **Critical** |
| **Timing** | **Before Launch** |
| **Connection** | `premiumExamBuilder.js`, `modelsA2.js`, `AustriaPath_Exam_Content_Quality_and_Examiner_Council.md` §4 |

---

### EC-02 — Implement skill/task-specific knowledge routing in Brain

| Field | Detail |
|-------|--------|
| **Why it matters** | `brain.js` loads one knowledge file per ÖIF section index. All oral parts use speaking knowledge with full `expectedElements` (including Bild tokens) for Selbstvorstellung answers. |
| **Risk if ignored** | Systematic false weaknesses; low confidence; unreliable premium scores. |
| **Recommended solution** | Add routing map: `self_intro` → intro rubric; `image` → picture rubric; `planning`/`roleplay` → planning rubric; `writing` → writing; reading/listening → correctness rubric. Use `examContext.currentSection.skill` (already passed from `PremiumExamSessionScreen`). |
| **Priority** | **Critical** |
| **Timing** | **Before Launch** |
| **Connection** | `brain.js`, `premiumExamBuilder.js`, `knowledge/*`, `PremiumExamSessionScreen.jsx` |

---

### EC-03 — Separate evaluation logic for reading/listening (MCQ) vs productive skills

| Field | Detail |
|-------|--------|
| **Why it matters** | Lesen/Hören parts use questions with defined answers (`b1LesenModels` answers keys). ExaminerMind applies prose `expectedElements` keyword search on empty or short text fields. |
| **Risk if ignored** | Reading/listening scores are meaningless; overall exam score invalid. |
| **Recommended solution** | MCQ judge: compare `studentAnswers` to model answer keys; score by accuracy percentage; feed into Decision Engine as `taskCompletion` with real evidence. |
| **Priority** | **Critical** |
| **Timing** | **Before Launch** |
| **Connection** | `premiumExamBuilder.buildReadingParts`, `buildListeningParts`, `TaskJudge.js` |

---

### EC-04 — Extend Decision Engine level mapping for B2 exams

| Field | Detail |
|-------|--------|
| **Why it matters** | `mapScoreToLevel()` returns maximum `B1+` regardless of `examContext.level`. B2 exams cannot produce B2-labelled outcomes. |
| **Risk if ignored** | B2 students distrust platform; misaligned study recommendations in `studentProfileEngine`. |
| **Recommended solution** | Level-aware mapping bands: e.g. for B2 exams, map to A2+/B1/B1+/B2-/B2; calibrate thresholds with examiner review. |
| **Priority** | **Critical** |
| **Timing** | **Before Launch** |
| **Connection** | `decisionEngine.js`, `studentProfileEngine.js`, `PremiumExamSessionScreen.buildExamSummary` |

---

### EC-05 — Fix StructureJudge / DecisionEngine examiner ID mismatch

| Field | Detail |
|-------|--------|
| **Why it matters** | `StructureJudge` reports `examiner: "structure"`. Decision Engine weights and warnings reference `"basicStructure"`. Structure dimension excluded from conflict detection. |
| **Risk if ignored** | Incorrect weighting; silent omission of structure warnings; false confidence. |
| **Recommended solution** | Align identifier to single canonical name across judge output, `getWeight()`, `findReport()`, and `humanLabel()`. |
| **Priority** | **High** |
| **Timing** | **Before Launch** |
| **Connection** | `StructureJudge.js`, `decisionEngine.js` |

---

### EC-06 — Clearly label three evaluation modes in product and reports

| Field | Detail |
|-------|--------|
| **Why it matters** | ExaminerMind (premium), OpenAI conversational (Intelligent Exam), and heuristics (weekly session) produce different score semantics. Users may compare incomparable results. |
| **Risk if ignored** | Confusion; perceived unfairness; support disputes. |
| **Recommended solution** | Report metadata: `evaluationMethod: "examiner_mind" \| "llm_conversational" \| "training_heuristic"`. UI disclaimer on each feature. No single "ÖIF score" branding across modes. |
| **Priority** | **High** |
| **Timing** | **Before Launch** |
| **Connection** | `AISessionScreen.jsx`, `IntelligentExamScreen.jsx`, `PremiumExamSessionScreen.jsx`, `AI-Transparency.md` |

---

### EC-07 — Wire premium exam per-part evaluation into flow; aggregate final score

| Field | Detail |
|-------|--------|
| **Why it matters** | `evaluateCurrentPart()` is not called in `nextStep()`. `finishExam()` re-runs ExaminerMind on last part only. Multi-part exam report does not reflect full performance. |
| **Risk if ignored** | Final report contradicts student experience; only last section influences summary. |
| **Recommended solution** | Await per-part Brain results; store part scores; final Decision aggregates weighted part results; `reportBuilder` receives summary object not re-evaluation of last part. |
| **Priority** | **High** |
| **Timing** | **Before Launch** |
| **Connection** | `PremiumExamSessionScreen.jsx`, `runExaminerMind.js` |

---

### EC-08 — Repair GrammarJudge weakness logic

| Field | Detail |
|-------|--------|
| **Why it matters** | All `commonMistakes` titles added to weaknesses unconditionally (not detected in answer). Grammar judge systematically pessimistic. |
| **Risk if ignored** | Chronic low confidence; Examiner Lab flooded; student demoralization. |
| **Recommended solution** | Only add mistake if detected via pattern rules or absent required structure; separate "risk flags" from confirmed errors. |
| **Priority** | **High** |
| **Timing** | **Before Launch** |
| **Connection** | `GrammarJudge.js`, `errorLearningEngine.js`, `ExaminerLabScreen.jsx` |

---

### EC-09 — Redesign VocabularyJudge to use level knowledge and model keywords

| Field | Detail |
|-------|--------|
| **Why it matters** | Current judge uses only word-count diversity. Ignores `keywords`, `mandatoryTopics`, `words` from models and knowledge files. |
| **Risk if ignored** | Vocabulary dimension is cosmetic; good answers with repeated function words score low. |
| **Recommended solution** | Score against level-appropriate keyword hits, mandatory topic coverage, and excessive repetition penalty. |
| **Priority** | **High** |
| **Timing** | **After Launch** (if EC-02 done; can ship with simplified judge before launch) |
| **Connection** | `VocabularyJudge.js`, `aiPremiumLibrary.js`, knowledge files |

---

### EC-10 — Deduplicate Task / Structure / Reasoning judge signal

| Field | Detail |
|-------|--------|
| **Why it matters** | Three judges run nearly identical keyword-inclusion against overlapping `expectedElements`. Weighted average **overcounts** task completion. |
| **Risk if ignored** | Inflated scores; reduced value of council diversity; false confidence. |
| **Recommended solution** | TaskJudge owns completion; StructureJudge owns connectors/discourse markers; ReasoningJudge owns weil/deshalb/opinion patterns — non-overlapping criteria sets. |
| **Priority** | **High** |
| **Timing** | **After Launch** |
| **Connection** | `TaskJudge.js`, `StructureJudge.js`, `ReasoningJudge.js`, `ExaminerCouncil.js` |

---

### EC-11 — Preserve structured followUpRules in AI-Prüfer admin saves

| Field | Detail |
|-------|--------|
| **Why it matters** | `AIPrueferScreen.handleSave()` converts `followUpRules` to string array via `linesToArray()`, destroying `ifMissing`, `ifAnswerTooShort` objects from `aiPremiumLibrary.js`. |
| **Risk if ignored** | Admin-edited models behave inconsistently vs seed library; OpenAI follow-up logic unreliable. |
| **Recommended solution** | JSON editor or structured form for follow-up rules; versioned schema; validation on save. |
| **Priority** | **High** |
| **Timing** | **Before Launch** (if admins edit rules pre-launch); **After Launch** if seed library frozen |
| **Connection** | `AIPrueferScreen.jsx`, `aiPremiumLibrary.js`, `modelRouter.js` |

---

### EC-12 — Bind OpenAI prompts to ExaminerMind rubric context

| Field | Detail |
|-------|--------|
| **Why it matters** | `api/ai/openai.js` and `IntelligentExamScreen` use generic ÖIF examiner prompts without knowledge file injection. LLM feedback can contradict council scores. |
| **Risk if ignored** | Inconsistent evaluation; student trusts conversational praise over report weaknesses. |
| **Recommended solution** | Pass level, skill, mandatoryTopics, and scoring criteria into system prompt; instruct LLM not to contradict rule-based caps; or restrict LLM to report narrative only after council decision. |
| **Priority** | **High** |
| **Timing** | **Before Launch** (for premium reportBuilder); **After Launch** (Intelligent Exam full integration) |
| **Connection** | `secureOpenAI.js`, `openai.js`, `modelRouter.js`, `IntelligentExamScreen.jsx` |

---

### EC-13 — Complete human review of premium-path model set

| Field | Detail |
|-------|--------|
| **Why it matters** | No model status enforcement. Seed library `visibleToStudents: false` but still usable in builders. No checklist sign-off recorded. |
| **Risk if ignored** | Weak prompts in production; undetected contradictions between models. |
| **Recommended solution** | Execute Admin Review Checklist (Exam Content Quality spec §9) on all models reachable from `buildPremiumExamParts`; document reviewer and status. |
| **Priority** | **High** |
| **Timing** | **Before Launch** |
| **Connection** | `AustriaPath_Exam_Content_Quality_and_Examiner_Council.md`, `aiPremiumLibrary.js`, `premiumExamBuilder.js` |

---

### EC-14 — Implement Examiner Lab closed-loop (sample → rule → knowledge)

| Field | Detail |
|-------|--------|
| **Why it matters** | Pipeline stops at `saveAIError()`. Examiner Lab buttons non-functional. System cannot learn from human corrections. |
| **Risk if ignored** | Recurring scoring errors; technical debt in error log; admin manual work outside platform. |
| **Recommended solution** | Wire Correct/Wrong/New Rule to `examiner_lab_samples` and `examiner_rules`; human-verified rules override draft; documented in Exam Content spec §8. |
| **Priority** | **Medium** |
| **Timing** | **After Launch** |
| **Connection** | `ExaminerLabScreen.jsx`, `errorLearningEngine.js`, Database Schema |

---

### EC-15 — Deepen AuditEngine for borderline and conflict cases

| Field | Detail |
|-------|--------|
| **Why it matters** | Audit only notes low confidence; `recommendation: "ask_follow_up"` never triggers follow-up in UI. |
| **Risk if ignored** | Borderline A2/B1 cases proceed without second probe — unlike human examiners. |
| **Recommended solution** | When audit recommends follow-up, trigger AI-Prüfer follow-up question or prompt student for clarification before finalizing score. |
| **Priority** | **Medium** |
| **Timing** | **After Launch** |
| **Connection** | `auditEngine.js`, `aiPremiumLibrary.followUpRules`, `PremiumExamSessionScreen.jsx` |

---

### EC-16 — Replace Intelligent Exam single preset image with level-appropriate visuals

| Field | Detail |
|-------|--------|
| **Why it matters** | `PRESET_BILDER` has one generic office Unsplash image for all levels. ÖIF A2/B1/B2 Bildaufgaben differ in complexity. |
| **Risk if ignored** | Unrealistic practice; B2 Grafik tasks use wrong visual type. |
| **Recommended solution** | Use `a2Images`, `b1Images`, `b2Grafiken` banks already in codebase; match `IntelligentExamScreen` level param. |
| **Priority** | **Medium** |
| **Timing** | **After Launch** |
| **Connection** | `IntelligentExamScreen.jsx`, `a2Images.js`, `b1Images.js`, `b2Grafiken.js` |

---

### EC-17 — Synchronize AI-Prüfer library with ExaminerMind knowledge files

| Field | Detail |
|-------|--------|
| **Why it matters** | Two parallel sources of truth: code knowledge files vs `austriaPathAiPrueferLibrary`. Changes to one do not update the other. |
| **Risk if ignored** | OpenAI behaviour diverges from rule judges; maintenance duplication. |
| **Recommended solution** | Single canonical model store (DB `examiner_rules`); knowledge files generated or validated from same source; version pins on evaluation. |
| **Priority** | **Medium** |
| **Timing** | **After Launch** |
| **Connection** | `examinerKnowledge.js`, `AIPrueferScreen.jsx`, Database Schema |

---

### EC-18 — Add pronunciation/fluency placeholder dimension (disclosed as non-scored initially)

| Field | Detail |
|-------|--------|
| **Why it matters** | Real ÖIF speaking assessment includes intelligibility. Speech recognition transcript alone loses prosody. |
| **Risk if ignored** | Speaking assessment incomplete vs human exam; advanced students cannot get feedback on accent/fluency. |
| **Recommended solution** | Phase 1: disclose "Aussprache not evaluated" in speaking reports. Phase 2: optional ASR confidence / speech rate heuristics. |
| **Priority** | **Low** |
| **Timing** | **After Launch** |
| **Connection** | `IntelligentExamScreen.jsx` speech recognition, `AI-Transparency.md` |

---

### EC-19 — Clarify ÖIF-only positioning; defer TELC-specific claims

| Field | Detail |
|-------|--------|
| **Why it matters** | Structure and models reference ÖIF (`examStructure.js`, `examType: "OEIF"`). TELC formats differ in timing, modules, and rubrics. |
| **Risk if ignored** | Misleading marketing if TELC preparation claimed without TELC-calibrated content. |
| **Recommended solution** | Marketing and legal text: "ÖIF-style preparation." TELC model bank only if separately reviewed and labelled. |
| **Priority** | **Medium** |
| **Timing** | **Before Launch** (copy/legal); TELC content **After Launch** |
| **Connection** | `legalContent.js`, `examStructure.js`, marketing materials |

---

### EC-20 — Stop fabricating strengths in DecisionEngine when judges omit them

| Field | Detail |
|-------|--------|
| **Why it matters** | `extractStrengths()` injects generic German phrases ("Sehr gute Grammatik") from score bands without judge evidence. |
| **Risk if ignored** | Reports appear evidence-based but contain hallucinated praise — same trust issue as LLM hallucination. |
| **Recommended solution** | Strengths only from judge `strengths[]` arrays; if empty, state "Keine spezifischen Stärken identifiziert" or request deeper review. |
| **Priority** | **Medium** |
| **Timing** | **Before Launch** |
| **Connection** | `decisionEngine.js`, `ProfileScreen.jsx` report display |

---

### EC-21 — Invoke global ExaminerRules flags in pipeline or remove unused code

| Field | Detail |
|-------|--------|
| **Why it matters** | `examinerRules.js` defines `NEVER_GUESS`, `REQUIRE_EVIDENCE` but nothing reads them in council or decision path. |
| **Risk if ignored** | Dead code confusion; architects assume safeguards active when they are not. |
| **Recommended solution** | Wire flags: e.g. if `REQUIRE_EVIDENCE` and no judge has evidence, force `needsDeepReview`. Or document as design principles only. |
| **Priority** | **Low** |
| **Timing** | **After Launch** |
| **Connection** | `examinerRules.js`, `brain.js`, `decisionEngine.js` |

---

### EC-22 — Weekly session: do not present heuristic results as exam scores

| Field | Detail |
|-------|--------|
| **Why it matters** | `AISessionScreen.evaluateCurrentAnswer()` uses word count and connector keyword heuristics, not ExaminerMind. Reports saved to `austriaPathAIReports` alongside premium reports. |
| **Risk if ignored** | Profile history mixes training game scores with exam evaluation scores. |
| **Recommended solution** | Separate report type label; exclude from exam progress metrics; optional future integration with lightweight council for weekly mode only. |
| **Priority** | **High** |
| **Timing** | **Before Launch** |
| **Connection** | `AISessionScreen.jsx`, `ProfileScreen.jsx`, `weekly_plan_reports` table concept |

---

## Document Cross-References

| Document | Relationship |
|----------|--------------|
| `AustriaPath_Exam_Content_Quality_and_Examiner_Council.md` | Governance process for EC-13, EC-14 |
| `AustriaPath_Technical_Specification.md` | AI architecture §5 |
| `AustriaPath_Database_Schema.md` | Examiner Lab storage |
| `AI-Transparency.md` | User-facing disclosure for EC-06, EC-18 |
| `AustriaPath_Recommendations.md` | Platform-level launch recommendations |

---

## Approval Gate

| Reviewer role | Sign-off |
|---------------|----------|
| Lead examiner / ÖIF domain expert | ☐ |
| AI exam architect | ☐ |
| Product owner | ☐ |

**No implementation work should begin until approved recommendation IDs are confirmed.**

Suggested minimum before premium AI marketing: **EC-01, EC-02, EC-03, EC-04, EC-05, EC-06, EC-07, EC-08, EC-13, EC-20, EC-22**.

---

**Document owner:** AustriaPath Content & Engineering  
**Next review:** After first human verification cycle of premium-path models
