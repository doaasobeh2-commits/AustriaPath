/**
 * AustriaPath Unified Exam Platform — Phase A Contracts
 *
 * Architecture types and service interfaces only.
 * NO runtime implementation in Phase A.
 *
 * @module exam-platform/contracts
 */

// ─── Enumerations ───────────────────────────────────────────────────────────

/** @typedef {'placement_test'|'weekly_plan'|'ai_exam'|'intensive_week'|'premium_month'} ProductType */

/** @typedef {'diagnostic'|'practice'|'exam'} ExamMode */

/** @typedef {'leicht'|'mittel'|'stark'} DifficultyBand */

/** @typedef {'A2'|'A2+'|'B1'|'B1+'|'B2'|'B2+'} CEFRLabel */

/**
 * @typedef {'writing'|'reading'|'listening'|'picture_description'|'planning'|'discussion'|'self_introduction'} SkillId
 */

/**
 * @typedef {'examiner_mind'|'practice_heuristic'|'rule_placement'|'pending_human_review'} EvaluationMethod
 */

/**
 * @typedef {'building'|'developing'|'approaching'|'strong'} ReadinessBand
 */

/**
 * @typedef {'low'|'medium'|'high'} AdaptivityLevel
 */

/**
 * @typedef {'soft'|'hard'} TimingPolicy
 */

/** @typedef {'approve'|'reject'|'correct'|'propose_rule'} LabActionType */

/** @typedef {'pending'|'confirmed'|'corrected'|'disputed'} HumanReviewStatus */

// ─── Model Catalog ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} ModelCatalogEntry
 * @property {string} id
 * @property {SkillId} skill
 * @property {CEFRLabel} level
 * @property {DifficultyBand} difficulty
 * @property {ProductType[]} [allowedProducts]
 * @property {number} [selectionWeight]
 * @property {string} source - 'static'|'admin'|'ai_pruefer'
 * @property {Record<string, unknown>} contentRef
 */

// ─── Exam Blueprint ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} BlueprintSection
 * @property {number} sectionIndex
 * @property {string} modelId
 * @property {SkillId} skill
 * @property {DifficultyBand} difficulty
 * @property {number} [timeLimitMinutes]
 * @property {boolean} [allowFollowUp]
 * @property {Record<string, unknown>} [sectionConfig]
 */

/**
 * @typedef {Object} ExamBlueprint
 * @property {string} blueprintId
 * @property {ProductType} productType
 * @property {ExamMode} mode
 * @property {CEFRLabel} targetLevel
 * @property {number} [examIndex]
 * @property {number} [examTotal]
 * @property {BlueprintSection[]} sections
 * @property {string} rulesVersion
 * @property {string} createdAt
 */

// ─── Section Input / Evaluation ─────────────────────────────────────────────

/**
 * @typedef {Object} SectionAnswer
 * @property {number} sectionIndex
 * @property {SkillId} skill
 * @property {string} modelId
 * @property {string} [freeText]
 * @property {Record<string, string>} [mcqAnswers]
 * @property {Record<string, unknown>} [metadata]
 * @property {number} [durationSeconds]
 */

/**
 * @typedef {Object} EvaluationEvidence
 * @property {string} code
 * @property {string} label
 * @property {boolean} [passed]
 * @property {string} [detail]
 */

/**
 * @typedef {Object} SectionEvaluation
 * @property {number} sectionIndex
 * @property {SkillId} skill
 * @property {string} modelId
 * @property {number} rawScore
 * @property {number} maxScore
 * @property {number} normalizedScore
 * @property {CEFRLabel} [skillLevel]
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {EvaluationEvidence[]} evidence
 * @property {boolean} [needsFollowUp]
 * @property {boolean} [lowConfidence]
 * @property {SectionAnswer} [answerSnapshot]
 * @property {string} evaluatorId
 * @property {string} evaluatorVersion
 * @property {string} rulesVersion
 */

// ─── LLM Proposals ────────────────────────────────────────────────────────────

/**
 * @typedef {Object} LLMProposal
 * @property {string} proposalId
 * @property {'grammar'|'vocabulary'|'structure'|'narrative'|'follow_up_question'} type
 * @property {SkillId} skill
 * @property {number} [suggestedScoreDelta]
 * @property {string[]} [suggestedStrengths]
 * @property {string[]} [suggestedWeaknesses]
 * @property {string} [narrativeDraft]
 * @property {string} [followUpQuestion]
 * @property {number} confidence
 * @property {string} modelId
 * @property {boolean} validated
 */

// ─── Examiner Council ───────────────────────────────────────────────────────

/**
 * @typedef {Object} JudgeReport
 * @property {string} judgeId
 * @property {number} score
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {string[]} [reasoning]
 */

/**
 * @typedef {Object} CouncilConflict
 * @property {string} type
 * @property {string} description
 * @property {string[]} involvedJudges
 */

/**
 * @typedef {Object} CouncilDecision
 * @property {string} decisionId
 * @property {number} overallScore
 * @property {CEFRLabel} cefrLevel
 * @property {number} confidence
 * @property {SkillId[]} strengths
 * @property {SkillId[]} weaknesses
 * @property {string[]} focusAreas
 * @property {string[]} recurringMistakes
 * @property {ReadinessBand} [readinessBand]
 * @property {Record<string, { score: number, level: CEFRLabel, evidence: EvaluationEvidence[] }>} skillResults
 * @property {JudgeReport[]} fusionReports
 * @property {CouncilConflict[]} conflicts
 * @property {string[]} warnings
 * @property {string[]} criticalRulesApplied
 * @property {boolean} needsHumanReview
 * @property {string} [humanReviewReason]
 * @property {string} reflectionSummary
 * @property {string} examinerMindVersion
 * @property {string} rulesVersion
 * @property {string} decidedAt
 */

// ─── Final Report ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} HumanReviewPublic
 * @property {HumanReviewStatus} status
 * @property {string} [summary]
 * @property {boolean} changedReport
 * @property {string} reviewedAt
 */

/**
 * @typedef {Object} FinalReport
 * @property {string} reportId
 * @property {ProductType} productType
 * @property {ExamMode} mode
 * @property {EvaluationMethod} evaluationMethod
 * @property {CEFRLabel} cefrLevel
 * @property {number} overallScore
 * @property {number} confidence
 * @property {ReadinessBand} [readinessBand]
 * @property {Record<string, { score: number, level: CEFRLabel }>} skillResults
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {string[]} recurringMistakes
 * @property {string[]} focusAreas
 * @property {string} summary
 * @property {string[]} recommendations
 * @property {string[]} studyAdvice
 * @property {string[]} improvementPriorities
 * @property {ReadinessBand} [cefrReadiness]
 * @property {SkillId[]} [weeklyFocusSkills]
 * @property {string[]} [weeklyPlanMapping]
 * @property {CouncilDecision} councilDecision
 * @property {HumanReviewPublic} [humanReview]
 * @property {string} disclaimer
 * @property {string} rulesVersion
 * @property {string} blueprintId
 * @property {string} createdAt
 */

// ─── Student Profile ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} PracticeSessionRecord
 * @property {string} reportId
 * @property {string} date
 * @property {SkillId[]} focusSkills
 * @property {number} durationMinutes
 * @property {number} practiceScore
 */

/**
 * @typedef {Object} ExamHistoryRecord
 * @property {string} reportId
 * @property {ProductType} productType
 * @property {string} date
 * @property {CEFRLabel} cefrLevel
 * @property {number} overallScore
 * @property {number} confidence
 * @property {string[]} usedModelIds
 */

/**
 * @typedef {Object} PackageState
 * @property {ProductType} type
 * @property {number} examIndex
 * @property {number} examTotal
 * @property {string[]} usedModelIdsInPackage
 * @property {string} [startedAt]
 */

/**
 * @typedef {Object} StudentProfile
 * @property {string} profileVersion
 * @property {CEFRLabel} officialExamLevel
 * @property {Record<SkillId, CEFRLabel>} officialSkillLevels
 * @property {string[]} weakSkills
 * @property {string[]} recurringMistakes
 * @property {ReadinessBand} [readinessBand]
 * @property {string[]} globalUsedModelIds
 * @property {PackageState} [activePackage]
 * @property {ExamHistoryRecord[]} examHistory
 * @property {PracticeSessionRecord[]} practiceHistory
 * @property {Object} practiceStats
 * @property {Object[]} reportSummaries
 * @property {string[]} aiRecommendations
 * @property {Object[]} [learningTrends]
 * @property {Object} [subscriptionSnapshot]
 * @property {string} updatedAt
 */

// ─── Exam Session ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ExamSessionState
 * @property {string} sessionId
 * @property {ProductType} productType
 * @property {ExamMode} mode
 * @property {ExamBlueprint} blueprint
 * @property {number} currentSectionIndex
 * @property {SectionAnswer[]} answers
 * @property {SectionEvaluation[]} evaluations
 * @property {'pending'|'active'|'awaiting_review'|'completed'|'cancelled'} status
 * @property {number} [startedAt]
 * @property {number} [deadlineAt]
 */

// ─── Examiner Lab ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} LabQueueItem
 * @property {string} labItemId
 * @property {string} reportId
 * @property {string} sessionId
 * @property {CouncilDecision} councilDecision
 * @property {SectionEvaluation[]} sectionEvaluations
 * @property {'pending'|'in_review'|'resolved'} status
 * @property {string} queuedAt
 * @property {string} [classification]
 * @property {import('./contracts.js').LabResolution} [resolution]
 * @property {import('./contracts.js').HumanReviewStatus} [studentReviewStatus]
 */

/**
 * @typedef {Object} LabResolution
 * @property {LabActionType} action
 * @property {string} reviewerId
 * @property {string} [rationale]
 * @property {CouncilDecision} [correctedDecision]
 * @property {import('./ruleRegistrySchema.js').RuleProposal} [ruleProposal]
 * @property {string} resolvedAt
 */

// ─── Service request/result types ───────────────────────────────────────────

/**
 * @typedef {Object} ExamEngineStartRequest
 * @property {ProductType} productType
 * @property {string} [studentId]
 * @property {import('./contracts.js').CEFRLabel} [levelOverride]
 * @property {number} [examIndex]
 * @property {import('./contracts.js').SkillId[]} [focusSkillsOverride]
 * @property {ExamBlueprint} [blueprint]
 */

/**
 * @typedef {Object} ExamEngineStartResult
 * @property {string} sessionId
 * @property {ExamSessionState} session
 */

/**
 * @typedef {Object} ExamEngineCompleteResult
 * @property {FinalReport} report
 * @property {StudentProfile} profile
 * @property {boolean} pendingHumanReview
 */

/**
 * @interface IExamEngine
 * Single engine for Placement, Weekly, AI Single, Intensive, Premium Month.
 */

/**
 * @interface IModelSelectionService
 * Intelligent blueprint construction — no random selection.
 */

/**
 * @interface IExamOrchestrator
 * Section order, timing, per-section evaluation dispatch.
 */

/**
 * @interface ISkillEvaluator
 * One implementation per skill; outputs SectionEvaluation only.
 */

/**
 * @interface ILLMGateway
 * Proposals only — Phase A not implemented.
 */

/**
 * @interface IExaminerCouncil
 * Sole authority for CouncilDecision.
 */

/**
 * @interface IReportBuilder
 * Builds FinalReport from CouncilDecision.
 */

/**
 * @interface IStudentProfileService
 * mergePracticeReport must never update officialExamLevel.
 */

/**
 * @interface IExaminerLabService
 * Queue only when needsHumanReview; student visibility rules apply.
 */

/**
 * @interface IRuleRegistryService
 * Single source of truth for Examiner Mind rules.
 */

export const EXAM_PLATFORM_VERSION = "1.0.0-phase-g";
export const EXAMINER_MIND_VERSION = "2.0.0-contract";
export const STUDENT_PROFILE_VERSION = "2.0.0";
export const FINAL_REPORT_SCHEMA_VERSION = "2.0.0";

export const REPORT_DISCLAIMER =
  "Dieses Ergebnis ist Übungsfeedback von AustriaPath und keine offizielle ÖIF-, ÖSD- oder TELC-Zertifizierung.";
