/**
 * Exam Engine — single lifecycle owner for all five products (Phase D).
 *
 * @module exam-platform/examEngine
 */

import { getProductPolicy } from "./productPolicies.js";
import { selectBlueprint } from "./modelSelectionService.js";
import {
  loadProfile,
  saveProfile,
  mergeReportIntoProfile,
  recordPackageModelUsage,
  attachSubscriptionSnapshot,
} from "./studentProfileService.js";
import {
  validateSubscriptionForExam,
  consumeExamAttempt,
  requiresSubscriptionValidation,
} from "./subscriptionPolicy.js";
import { decideCouncil } from "./services/examinerCouncil.js";
import { buildFinalReport } from "./services/reportBuilder.js";
import { maybeEnqueueLabCase } from "./services/examinerLabService.js";
import { proposeSessionSummary } from "./services/llmGateway.js";
import { emitCoachingEvent } from "./services/coachingEvents.js";
import {
  createSessionState,
  saveSession,
  loadSession,
  clearAllSessions,
} from "./sessionStore.js";
import {
  applySessionTiming,
  submitSectionAnswer,
  isSessionComplete,
  getCurrentSection,
  resolveCurrentSectionContent,
} from "./examOrchestrator.js";

export const EXAM_ENGINE_VERSION = "1.0.0-phase-d";

/**
 * @typedef {Object} ExamEngineDeps
 * @property {import('./contracts.js').ModelCatalogEntry[]} catalog
 * @property {Storage|null|undefined} [storage]
 * @property {import('./subscriptionPolicy.js').SubscriptionRecord|null|undefined} [subscription]
 * @property {string} [rulesVersion]
 */

/**
 * @param {ExamEngineDeps} deps
 */
export function createExamEngine(deps) {
  const { catalog = [], storage, subscription, rulesVersion = "0.0.0" } = deps;

  /**
   * @param {import('./contracts.js').ExamEngineStartRequest} request
   * @returns {import('./contracts.js').ExamEngineStartResult}
   */
  function start(request) {
    const { productType, examIndex = 1 } = request;
    const policy = getProductPolicy(productType);

    const validation = validateSubscriptionForExam({
      productType,
      subscription: subscription || undefined,
    });
    if (!validation.allowed) {
      throw new Error(validation.message || "Abonnement ungültig.");
    }

    let profile = loadProfile(storage || undefined);
    if (request.levelOverride) {
      profile = { ...profile, officialExamLevel: request.levelOverride };
    }

    const examTotal = policy.examCount > 0 ? policy.examCount : 1;
    const blueprint =
      request.blueprint ||
      selectBlueprint({
        productType,
        profile,
        catalog,
        examIndex,
        examTotal,
        rulesVersion,
      });

    if (!blueprint.sections.length) {
      throw new Error("Kein Prüfungsmodell verfügbar — Katalog leer oder alle Modelle bereits verwendet.");
    }

    let session = createSessionState(blueprint, productType, policy.mode);
    session = applySessionTiming(session, productType);
    saveSession(session, storage || undefined);

    if (requiresSubscriptionValidation(productType) && subscription) {
      const consumed = consumeExamAttempt(subscription, productType, examIndex);
      Object.assign(subscription, consumed);
      profile = attachSubscriptionSnapshot(profile, consumed);
      saveProfile(profile, storage || undefined);
    }

    return { sessionId: session.sessionId, session };
  }

  /**
   * @param {string} sessionId
   * @returns {import('./contracts.js').ExamSessionState|undefined}
   */
  function getSession(sessionId) {
    return loadSession(sessionId, storage || undefined);
  }

  /**
   * @param {string} sessionId
   * @param {import('./contracts.js').SectionAnswer} answer
   * @param {Record<string, unknown>} [sectionContent]
   */
  async function submitSection(sessionId, answer, sectionContent) {
    const session = loadSession(sessionId, storage || undefined);
    if (!session) throw new Error("Session nicht gefunden.");

    const result = await submitSectionAnswer({
      session,
      answer,
      sectionContent,
      deps: { catalog },
    });

    saveSession(result.session, storage || undefined);
    return result;
  }

  /**
   * @param {string} sessionId
   * @returns {Promise<import('./contracts.js').ExamEngineCompleteResult & { labEnqueued?: boolean, coachingEvents?: unknown[] }>}
   */
  async function complete(sessionId) {
    const session = loadSession(sessionId, storage || undefined);
    if (!session) throw new Error("Session nicht gefunden.");

    if (!isSessionComplete(session) && session.status !== "awaiting_review") {
      throw new Error("Prüfung noch nicht abgeschlossen — fehlende Sektionen.");
    }

    const policy = getProductPolicy(session.productType);
    const usedModelIds = session.blueprint.sections.map((s) => s.modelId);

    const llmProposals = policy.llmProposalsAllowed
      ? await proposeSessionSummary({
          evaluations: session.evaluations,
          productType: session.productType,
        })
      : [];

    const decision = decideCouncil({
      sectionEvaluations: session.evaluations,
      productType: session.productType,
      targetLevel: session.blueprint.targetLevel,
      rulesVersion: session.blueprint.rulesVersion,
      llmProposals,
      storage: storage || undefined,
    });

    const report = buildFinalReport({
      decision,
      productType: session.productType,
      blueprintId: session.blueprint.blueprintId,
      weeklyFocusSkills: session.blueprint.sections.map((s) => s.skill).slice(0, 3),
    });

    let profile = loadProfile(storage || undefined);
    profile = mergeReportIntoProfile(profile, report, usedModelIds);

    if (policy.examCount > 1) {
      profile = recordPackageModelUsage(profile, usedModelIds);
    }

    saveProfile(profile, storage || undefined);

    const labResult = maybeEnqueueLabCase({
      decision,
      productType: session.productType,
      reportId: report.reportId,
      sessionId: session.sessionId,
      sectionEvaluations: session.evaluations,
      storage: storage || undefined,
    });

    const coachingEvent =
      session.productType === "weekly_plan"
        ? emitCoachingEvent("practice_milestone", {
            reportId: report.reportId,
            weaknesses: report.weaknesses,
          })
        : emitCoachingEvent("exam_completed", {
            reportId: report.reportId,
            productType: session.productType,
            weaknesses: report.weaknesses,
          });

    const completedSession = {
      ...session,
      status: /** @type {'completed'} */ ("completed"),
    };
    saveSession(completedSession, storage || undefined);

    return {
      report,
      profile,
      pendingHumanReview: decision.needsHumanReview,
      labEnqueued: labResult.enqueued,
      coachingEvent,
    };
  }

  /**
   * @param {string} sessionId
   */
  function cancel(sessionId) {
    const session = loadSession(sessionId, storage || undefined);
    if (!session) return undefined;
    const cancelled = { ...session, status: /** @type {'cancelled'} */ ("cancelled") };
    saveSession(cancelled, storage || undefined);
    return cancelled;
  }

  return {
    version: EXAM_ENGINE_VERSION,
    start,
    getSession,
    submitSection,
    complete,
    cancel,
    getCurrentSection,
    resolveCurrentSectionContent: (sessionId) => {
      const session = loadSession(sessionId, storage || undefined);
      if (!session) return {};
      return resolveCurrentSectionContent(session, { catalog });
    },
  };
}

export const examEngine = {
  version: EXAM_ENGINE_VERSION,
  createExamEngine,
};
