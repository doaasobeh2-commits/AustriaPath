# AustriaPath Examiner Council — Decision Guide

**Document version:** 1.0  
**Last updated:** 4 July 2026  
**Status:** Validation & approval document — no implementation authorized  
**Source review:** [AustriaPath_ExaminerCouncil_Review.md](./AustriaPath_ExaminerCouncil_Review.md) (official; unchanged)

---

## Important Notice

This document classifies each recommendation **EC-01 through EC-22** for approval purposes. It does **not** implement anything and does **not** modify the official Examiner Council Review.

**Classification legend:**

| Classification | Meaning |
|----------------|---------|
| **Confirmed** | Definitely recommended; objective gap or clear launch requirement |
| **Needs discussion** | Valid direction but depends on product, examiner, or architecture decisions |
| **Optional improvement** | Useful; not required for a controlled launch with disclaimers |
| **Not recommended** | Should not be implemented as stated (alternative preferred) |

Only recommendations explicitly marked **Approved** in Section 4 may be implemented later.

---

## Summary Table

| ID | Title | Classification | Timing |
|----|-------|----------------|--------|
| EC-01 | Block preview/empty models from premium assembly | **Confirmed** | Before Launch |
| EC-02 | Skill/task-specific knowledge routing in Brain | **Confirmed** | Before Launch |
| EC-03 | MCQ evaluation for Lesen/Hören | **Confirmed** | Before Launch |
| EC-04 | B2-aware level mapping in Decision Engine | **Needs discussion** | Before Launch (minimum fix) / After Launch (full bands) |
| EC-05 | StructureJudge / DecisionEngine ID alignment | **Confirmed** | Before Launch |
| EC-06 | Label three evaluation modes | **Confirmed** | Before Launch |
| EC-07 | Per-part evaluation + aggregated final score | **Confirmed** | Before Launch |
| EC-08 | Repair GrammarJudge weakness logic | **Confirmed** | Before Launch |
| EC-09 | Redesign VocabularyJudge | **Optional improvement** | After Launch |
| EC-10 | Deduplicate Task/Structure/Reasoning judges | **Needs discussion** | After Launch |
| EC-11 | Preserve structured followUpRules in admin | **Needs discussion** | Before Launch (if admin edits) / After Launch (if seed frozen) |
| EC-12 | Bind OpenAI prompts to ExaminerMind rubric | **Needs discussion** | Before Launch (reportBuilder only) / After Launch (Intelligent Exam) |
| EC-13 | Human review of premium-path models | **Confirmed** | Before Launch |
| EC-14 | Examiner Lab closed-loop | **Optional improvement** | After Launch |
| EC-15 | Deepen AuditEngine / follow-up trigger | **Optional improvement** | After Launch |
| EC-16 | Level-appropriate images in Intelligent Exam | **Optional improvement** | After Launch |
| EC-17 | Unify AI-Prüfer library and knowledge files | **Needs discussion** | After Launch |
| EC-18 | Pronunciation/fluency dimension | **Needs discussion** | Before Launch (disclosure) / After Launch (scoring) |
| EC-19 | ÖIF-only positioning; defer TELC claims | **Confirmed** | Before Launch |
| EC-20 | Stop fabricating strengths in DecisionEngine | **Confirmed** | Before Launch |
| EC-21 | Wire ExaminerRules flags or remove | **Optional improvement** | After Launch |
| EC-22 | Separate weekly heuristic reports from exam scores | **Confirmed** | Before Launch |

**Counts:** Confirmed 11 · Needs discussion 6 · Optional improvement 5 · Not recommended 0

---

## Detailed Classifications

---

### EC-01 — Block preview and empty models from premium AI exam assembly

**Classification:** **Confirmed**

**Why classified this way:** Empty and `preview` models in `modelsA2.js` are objectively unusable in a paid exam. `premiumExamBuilder.js` selects writing models randomly without quality gates, so the risk is concrete—not a design preference.

**Expected benefits:** Students never receive blank Schreiben tasks; premium exams only use reviewed content; reduced refund and reputation risk.

**Possible drawbacks:** Smaller pool until more models pass review; requires a minimum curated set (e.g. A2 ids 1–5) before premium goes live.

**Timing:** **Before Launch** — mandatory if premium AI exam is marketed publicly.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-02 — Implement skill/task-specific knowledge routing in Brain

**Classification:** **Confirmed**

**Why classified this way:** `brain.js` applies one speaking knowledge file to all oral sub-parts (Selbstvorstellung, Bild, Planung), so intro answers are scored against picture-related `expectedElements`. This is a structural misalignment, not an optional polish.

**Expected benefits:** Scores match the task the student actually performed; fewer false weaknesses; higher Decision Engine confidence; reports credible to examiner reviewers.

**Possible drawbacks:** Requires new sub-rubrics or knowledge slices per part type; migration/testing across A2/B1/B2; short-term engineering effort.

**Timing:** **Before Launch** — required for trustworthy premium AI scoring.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-03 — Separate evaluation logic for reading/listening (MCQ) vs productive skills

**Classification:** **Confirmed**

**Why classified this way:** Lesen/Hören premium parts are multiple-choice or cloze with defined answer keys, but ExaminerMind applies prose keyword rubrics to empty or minimal text fields. The current output is not a valid reading/listening score.

**Expected benefits:** Accurate module scores; overall exam result reflects real performance; aligns with how human examiners mark Lesen/Hören.

**Possible drawbacks:** New judge or scoring path; must handle partial credit and missing answers; A2 reading banks may need answer-key audit.

**Timing:** **Before Launch** — premium exams include Lesen/Hören parts today.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-04 — Extend Decision Engine level mapping for B2 exams

**Classification:** **Needs discussion**

**Why classified this way:** The hard cap at `B1+` in `mapScoreToLevel()` is objectively wrong for B2-labelled exams, so **some fix is required**. However, the exact band scheme (B2-, B2, B2+, vs numeric-only feedback) affects product messaging, student expectations, and alignment with real ÖIF descriptors—decisions an examiner lead must confirm.

**Expected benefits:** B2 students receive level-appropriate feedback; profile and recommendations match exam level; reduced distrust.

**Possible drawbacks:** Poorly calibrated B2 thresholds could over-promise readiness; A2/B1 exams need separate band tables to avoid label inflation; requires examiner validation workshop.

**Timing:** **Before Launch** — minimum: level-aware labels so B2 exams are not reported as B1+. **After Launch** — full calibrated band system after live data and examiner sign-off.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-05 — Fix StructureJudge / DecisionEngine examiner ID mismatch

**Classification:** **Confirmed**

**Why classified this way:** `StructureJudge` emits `examiner: "structure"` while `DecisionEngine` references `"basicStructure"` for weights, warnings, and conflicts. This is a clear integration bug with measurable impact on scoring.

**Expected benefits:** Structure dimension correctly weighted; conflict detection works as designed; more honest confidence scores.

**Possible drawbacks:** Minimal—small change with regression testing on existing reports.

**Timing:** **Before Launch** — low effort, high correctness gain.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-06 — Clearly label three evaluation modes in product and reports

**Classification:** **Confirmed**

**Why classified this way:** ExaminerMind, OpenAI conversational, and weekly heuristics produce incomparable results stored in the same report flows. Transparency is a launch requirement under AI Act Art. 4 awareness and AustriaPath’s own AI Transparency doc—not a UX preference.

**Expected benefits:** Students understand what each score means; fewer support disputes; legal and ethical clarity; no false “single ÖIF score” impression.

**Possible drawbacks:** Additional UI copy; may feel less “ polished” if many disclaimers; requires consistent German wording across screens.

**Timing:** **Before Launch** — can be metadata + copy without full pipeline unification.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-07 — Wire premium exam per-part evaluation; aggregate final score

**Classification:** **Confirmed**

**Why classified this way:** `evaluateCurrentPart()` is not invoked during navigation, and `finishExam()` re-evaluates only the last part. The final report therefore does not represent the full exam—a functional defect independent of product strategy.

**Expected benefits:** Report matches student work across all parts; fair aggregation; trustworthy premium exam completion flow.

**Possible drawbacks:** Longer wait between parts if evaluation is awaited; need clear loading UX; aggregation weights (equal vs ÖIF-weighted) need a simple default.

**Timing:** **Before Launch** — essential for premium AI exam integrity.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-08 — Repair GrammarJudge weakness logic

**Classification:** **Confirmed**

**Why classified this way:** All `commonMistakes` titles are appended as weaknesses without detection logic, making the grammar judge systematically pessimistic and flooding the error log. This is a logic error, not a rubric debate.

**Expected benefits:** Grammar scores reflect actual performance; fewer spurious Examiner Lab entries; student feedback less demoralizing.

**Possible drawbacks:** Requires defining detection rules per mistake type; some legitimate grammar flags may appear less often until patterns are tuned.

**Timing:** **Before Launch** — directly affects every ExaminerMind evaluation.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-09 — Redesign VocabularyJudge to use level knowledge and model keywords

**Classification:** **Optional improvement**

**Why classified this way:** The current diversity-only judge is weak, but EC-02, EC-03, EC-08, and EC-07 address the worst scoring failures. Vocabulary refinement improves quality but is not strictly blocking if premium exams are labelled as practice simulation with disclaimers.

**Expected benefits:** Richer vocabulary feedback; better use of `keywords` and `mandatoryTopics`; more examiner-like dimension separation.

**Possible drawbacks:** Engineering time; keyword lists can bias toward scripted answers; needs per-level tuning.

**Timing:** **After Launch** — prioritize after Confirmed items ship; can pilot on one level first.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-10 — Deduplicate Task / Structure / Reasoning judge signal

**Classification:** **Needs discussion**

**Why classified this way:** Overlap between judges is real, but some redundancy may have been intentional to stabilize scores. Splitting criteria sets changes score distributions and historical comparability—examiner and data review should agree before refactor.

**Expected benefits:** Council diversity becomes meaningful; reduced score inflation; clearer evidence per dimension.

**Possible drawbacks:** Significant refactor; temporary scoring drift; risk of under-scoring if criteria split too aggressively; requires golden-test answers.

**Timing:** **After Launch** — after baseline metrics collected post EC-02/EC-08 fixes.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-11 — Preserve structured followUpRules in AI-Prüfer admin saves

**Classification:** **Needs discussion**

**Why classified this way:** `AIPrueferScreen` flattening `followUpRules` to strings is a real data-loss bug **when admins edit models**. If launch strategy freezes the seed `aiPremiumLibrary.js` and disables admin rule editing until backend governance exists, urgency drops.

**Expected benefits:** Admin-edited models behave like seed library; reliable OpenAI follow-up behaviour; supports Examiner Lab rule extraction later.

**Possible drawbacks:** UI complexity (JSON editor or multi-field form); validation schema maintenance; admin training required.

**Timing:** **Before Launch** — only if admins will edit AI-Prüfer rules pre-launch. **After Launch** — if seed library is frozen and governance ships with backend (recommended default).

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-12 — Bind OpenAI prompts to ExaminerMind rubric context

**Classification:** **Needs discussion**

**Why classified this way:** LLM and rule-based paths diverging is a real consistency risk, but two valid architectures exist: (A) inject rubric into prompts, or (B) restrict LLM to narrative summary **after** council decision only. Choice affects cost, latency, and Intelligent Exam UX.

**Expected benefits:** Coherent student-facing feedback; reduced contradiction between chat praise and report scores; better reportBuilder quality for premium exams.

**Possible drawbacks:** Longer prompts / higher token cost; prompt injection surface if student text included; Intelligent Exam may feel less “conversational” if tightly constrained.

**Timing:** **Before Launch** — minimum for `reportBuilder` in premium finish flow (option B recommended for discussion). **After Launch** — full Intelligent Exam integration.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-13 — Complete human review of premium-path model set

**Classification:** **Confirmed**

**Why classified this way:** No automated quality gate replaces examiner judgment for launch content. This is a **process** requirement aligned with Exam Content Quality spec §9, independent of code architecture debates.

**Expected benefits:** Known-good model set; documented sign-off; fewer weak prompts in production; supports EC-01 gating with human `ai_exam_ready` / `human_verified` status.

**Possible drawbacks:** Reviewer time; may delay launch; checklist fatigue if scope too large—mitigate by scoping to `buildPremiumExamParts` reachable models only.

**Timing:** **Before Launch** — mandatory for public premium marketing.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-14 — Implement Examiner Lab closed-loop (sample → rule → knowledge)

**Classification:** **Optional improvement**

**Why classified this way:** Valuable for long-term quality improvement, but launch can proceed with manual offline review of error logs. Buttons in `ExaminerLabScreen.jsx` are inert today; fixing scoring bugs (EC-02–EC-08) reduces error volume first.

**Expected benefits:** Systematic learning from human corrections; fewer recurring AI errors; implements documented Examiner Lab purpose.

**Possible drawbacks:** Depends on backend (`examiner_lab_samples`, `examiner_rules`); admin workflow design; privacy handling for sample excerpts.

**Timing:** **After Launch** — Phase G5 in governance roadmap; after backend Phase 3.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-15 — Deepen AuditEngine for borderline and conflict cases

**Classification:** **Optional improvement**

**Why classified this way:** Human examiners ask follow-up questions on borderline cases—a valid aspiration—but mid-exam UX interruption is a major product decision. AuditEngine currently flags issues; extending to interactive follow-up is enhancement, not a launch blocker if disclaimers exist.

**Expected benefits:** More human-like examination flow; better borderline A2/B1 decisions; uses existing `ask_follow_up` recommendation.

**Possible drawbacks:** Longer exam sessions; complexity in speaking/writing parts; may frustrate students; needs careful trigger thresholds.

**Timing:** **After Launch** — pilot on speaking parts only after EC-07 stable.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-16 — Replace Intelligent Exam single preset image with level-appropriate visuals

**Classification:** **Optional improvement**

**Why classified this way:** `IntelligentExamScreen` uses one generic Unsplash image, which is unrealistic—but Intelligent Exam is a **separate** feature from premium AI exam, which already pulls from `a2Images` / `b1Images` / `b2Grafiken`. Important for quality, not blocking controlled premium launch.

**Expected benefits:** Realistic Bild/Grafik practice per level; better alignment with ÖIF task types especially B2 Grafik.

**Possible drawbacks:** Asset licensing review; UI work; Intelligent Exam scope creep if treated as launch-critical.

**Timing:** **After Launch** — when Intelligent Exam is promoted beyond beta.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-17 — Synchronize AI-Prüfer library with ExaminerMind knowledge files

**Classification:** **Needs discussion**

**Why classified this way:** Dual sources of truth is a maintainability risk, but unification strategy matters: single DB store vs generated knowledge files vs sync jobs. Ties to backend timing and who owns content (admin vs developer).

**Expected benefits:** One canonical model definition; OpenAI and rule judges stay aligned; simpler governance and versioning.

**Possible drawbacks:** Large migration; may slow content iteration if all changes require DB + deploy; risk of breaking working seed library during consolidation.

**Timing:** **After Launch** — align with backend `examiner_rules` table and Phase G2 governance fields.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-18 — Add pronunciation/fluency dimension (disclosed as non-scored initially)

**Classification:** **Needs discussion**

**Why classified this way:** Real ÖIF speaking includes intelligibility, but AustriaPath currently discloses AI is not a certified examiner. **Disclosure** that Aussprache is not evaluated is low-cost and recommended; **automated scoring** of pronunciation is a major scope expansion with fairness and technology limits.

**Expected benefits:** Honest student expectations; foundation for future ASR confidence or fluency metrics; aligns with examiner domain expertise.

**Possible drawbacks:** Phase 2 heuristics may mislead if presented as scores; ASR quality varies by accent; hardware/browser dependency.

**Timing:** **Before Launch** — approve **disclosure text only** in speaking reports and AI Disclaimer. **After Launch** — any automated pronunciation/fluency scoring.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred  
**Sub-approval (if deferred):** ☐ Disclosure only · ☐ Full scoring · ☐ Neither

---

### EC-19 — Clarify ÖIF-only positioning; defer TELC-specific claims

**Classification:** **Confirmed**

**Why classified this way:** Codebase and `examStructure.js` are ÖIF-oriented (`OEIF`). Marketing TELC preparation without TELC-calibrated content would be misleading. This is primarily copy/legal alignment, not a technical debate.

**Expected benefits:** Accurate marketing; reduced legal exposure; clear student expectations; focused content investment on ÖIF-style tasks.

**Possible drawbacks:** Smaller addressable market if some users seek TELC specifically; future TELC bank requires separate review investment.

**Timing:** **Before Launch** — update legal pages, App Store text, and any marketing. TELC content bank **After Launch** only if separately approved.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-20 — Stop fabricating strengths in DecisionEngine when judges omit them

**Classification:** **Confirmed**

**Why classified this way:** `extractStrengths()` injects generic praise from score bands without judge evidence—functionally similar to hallucination and contradicts `REQUIRE_EVIDENCE` principles. Integrity issue for any launch presenting reports as rubric-based.

**Expected benefits:** Trustworthy feedback; strengths traceable to judge output; Examiner Lab receives honest signals.

**Possible drawbacks:** Reports may look “empty” on strengths for weak answers; UX may need softer empty-state messaging in German.

**Timing:** **Before Launch** — pair with EC-06 transparency labelling.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

### EC-21 — Invoke global ExaminerRules flags in pipeline or remove unused code

**Classification:** **Optional improvement**

**Why classified this way:** Flags in `examinerRules.js` are unused; the **documentation** fix (state they are design principles) is sufficient for launch. Wiring flags adds complexity while EC-08 and EC-20 address more concrete integrity gaps.

**Expected benefits:** If wired: enforced `needsDeepReview` when evidence missing; clearer architecture. If documented only: less dead-code confusion for developers.

**Possible drawbacks:** Wiring without broader test suite may block valid scores; removing code loses aspirational design reference.

**Timing:** **After Launch** — prefer **document as principles** now; implement wiring only if Examiner Lab loop (EC-14) is approved.

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred  
**Sub-approval:** ☐ Wire flags · ☐ Document only · ☐ Remove unused file

---

### EC-22 — Weekly session: do not present heuristic results as exam scores

**Classification:** **Confirmed**

**Why classified this way:** `AISessionScreen` uses word-count heuristics but saves to `austriaPathAIReports` alongside premium ExaminerMind reports. Mixing training feedback with exam scores in profile history is misleading regardless of other architecture choices.

**Expected benefits:** Clear separation of training vs examination; profile metrics remain meaningful; aligns with EC-06 evaluation-mode labelling.

**Possible drawbacks:** Requires report type distinction in UI and future DB schema; users may expect one unified “score”—needs explanatory copy.

**Timing:** **Before Launch** — minimum: report `type` / label distinction in profile (can be client-side metadata until backend migration).

**Approval:** ☐ Approved · ☐ Rejected · ☐ Deferred

---

## Recommended Approval Bundles (For Discussion)

These bundles are **suggestions only**—not approved until marked in Section 4.

### Bundle A — Minimum premium launch integrity (11 Confirmed items)

EC-01, EC-02, EC-03, EC-05, EC-06, EC-07, EC-08, EC-13, EC-19, EC-20, EC-22

Plus EC-04 minimum fix (B2 label ceiling) once bands are agreed.

### Bundle B — Discuss before approving

EC-04 (full bands), EC-10, EC-11, EC-12, EC-17, EC-18

### Bundle C — Post-launch backlog

EC-09, EC-14, EC-15, EC-16, EC-21

---

## Section 4 — Approval Record

**Approver name:** ___________________________  
**Role:** ___________________________  
**Date:** ___________________________

| ID | Approved | Rejected | Deferred | Notes |
|----|----------|----------|----------|-------|
| EC-01 | ☐ | ☐ | ☐ | |
| EC-02 | ☐ | ☐ | ☐ | |
| EC-03 | ☐ | ☐ | ☐ | |
| EC-04 | ☐ | ☐ | ☐ | |
| EC-05 | ☐ | ☐ | ☐ | |
| EC-06 | ☐ | ☐ | ☐ | |
| EC-07 | ☐ | ☐ | ☐ | |
| EC-08 | ☐ | ☐ | ☐ | |
| EC-09 | ☐ | ☐ | ☐ | |
| EC-10 | ☐ | ☐ | ☐ | |
| EC-11 | ☐ | ☐ | ☐ | |
| EC-12 | ☐ | ☐ | ☐ | |
| EC-13 | ☐ | ☐ | ☐ | |
| EC-14 | ☐ | ☐ | ☐ | |
| EC-15 | ☐ | ☐ | ☐ | |
| EC-16 | ☐ | ☐ | ☐ | |
| EC-17 | ☐ | ☐ | ☐ | |
| EC-18 | ☐ | ☐ | ☐ | |
| EC-19 | ☐ | ☐ | ☐ | |
| EC-20 | ☐ | ☐ | ☐ | |
| EC-21 | ☐ | ☐ | ☐ | |
| EC-22 | ☐ | ☐ | ☐ | |

**Implementation authorized:** ☐ Yes — for approved IDs only · ☐ No — remain analysis only

---

## Document Relationships

| Document | Role |
|----------|------|
| `AustriaPath_ExaminerCouncil_Review.md` | Official expert review (unchanged) |
| **This document** | Validation, classification, and approval gate |
| `AustriaPath_Exam_Content_Quality_and_Examiner_Council.md` | Process for EC-13 and EC-14 |
| `AI-Transparency.md` | Disclosure alignment for EC-06, EC-18, EC-19 |

---

**Document owner:** AustriaPath Content & Engineering  
**Next step:** Product owner and examiner lead complete Section 4 approval table
