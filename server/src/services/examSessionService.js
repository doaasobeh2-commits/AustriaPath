import { createExamEngine } from "../../../src/exam-platform/examEngine.js";
import { getModelCatalog } from "../../../src/exam-platform/adapters/modelCatalogBuilder.js";
import { loadRuleRegistry } from "../../../src/exam-platform/services/ruleRegistryService.js";
import { resolveCurrentSectionContent } from "../../../src/exam-platform/examOrchestrator.js";
import { getCurrentSection } from "../../../src/exam-platform/examOrchestrator.js";
import { requiresSubscriptionValidation } from "../../../src/exam-platform/subscriptionPolicy.js";
import { createDbPlatformStorage } from "../adapters/dbPlatformStorage.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  dbRowToSession,
  findActiveSession,
  findByIdempotency,
  findExamSession,
  insertExamSession,
  updateExamSession,
} from "../repositories/examSessionRepository.js";
import { getCurrentSubscription } from "../repositories/userRepository.js";
import { syncSubscriptionAfterEngineStart } from "../repositories/subscriptionRepository.js";
import { persistCompleteResult } from "./reportPersistenceService.js";
import { saveSession, loadSession } from "../../../src/exam-platform/sessionStore.js";

function subscriptionRowToRecord(row) {
  if (!row) return null;
  return {
    type: row.type,
    status: row.status,
    remainingExams: row.remaining_exams,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

async function buildEngine(userId, subscriptionRow) {
  const storage = createDbPlatformStorage(userId);
  await storage.hydrate();

  const registry = loadRuleRegistry(storage);
  const subscription = subscriptionRowToRecord(subscriptionRow);
  const subRef = subscription ? { ...subscription } : null;

  const engine = createExamEngine({
    catalog: getModelCatalog(),
    storage,
    subscription: subRef,
    rulesVersion: registry.meta.registryVersion,
  });

  return { engine, storage, subscription: subRef, registry, subRow: subscriptionRow };
}

export async function startExamSession(userId, body) {
  const existing = await findByIdempotency(userId, body.idempotencyKey);
  if (existing) {
    const session = dbRowToSession(existing);
    return {
      sessionId: existing.id,
      session,
      rulesVersion: existing.rules_version,
      deadlineAt: existing.deadline_at ? new Date(existing.deadline_at).toISOString() : null,
    };
  }

  const subRow = await getCurrentSubscription(userId);
  const { engine, storage, subscription, registry, subRow: sr } = await buildEngine(
    userId,
    subRow
  );

  let result;
  try {
    result = engine.start({
      productType: body.productType,
      levelOverride: body.levelOverride,
      examIndex: body.examIndex,
      focusSkillsOverride: body.focusSkillsOverride,
      blueprint: body.blueprint,
    });
  } catch (e) {
    throw new AppError("SUBSCRIPTION_INACTIVE", e.message || "Abonnement ungültig.", 403);
  }

  await insertExamSession({
    userId,
    subscriptionId: sr?.id,
    session: result.session,
    rulesVersion: registry.meta.registryVersion,
    idempotencyKey: body.idempotencyKey,
  });

  if (subscription && sr && requiresSubscriptionValidation(body.productType)) {
    await syncSubscriptionAfterEngineStart(userId, sr.id, subscription, result.session, body.idempotencyKey);
  }

  await storage.flush();
  return {
    sessionId: result.session.sessionId,
    session: result.session,
    rulesVersion: registry.meta.registryVersion,
    deadlineAt: result.session.deadlineAt
      ? new Date(result.session.deadlineAt).toISOString()
      : null,
  };
}

export async function getSession(userId, sessionId) {
  const row = await findExamSession(sessionId, userId);
  if (!row) throw new AppError("SESSION_NOT_FOUND", "Prüfungssitzung nicht gefunden.", 404);
  return dbRowToSession(row);
}

export async function getActiveSession(userId, productType) {
  const row = await findActiveSession(userId, productType);
  return row ? dbRowToSession(row) : null;
}

export async function submitSection(userId, sessionId, body) {
  const row = await findExamSession(sessionId, userId);
  if (!row) throw new AppError("SESSION_NOT_FOUND", "Prüfungssitzung nicht gefunden.", 404);
  if (!["active", "awaiting_review"].includes(row.status)) {
    throw new AppError("SESSION_NOT_ACTIVE", "Diese Sitzung ist nicht aktiv.", 409);
  }

  if (row.deadline_at && new Date(row.deadline_at) < new Date()) {
    throw new AppError("SESSION_EXPIRED", "Die Prüfungszeit ist abgelaufen.", 410);
  }

  const subRow = await getCurrentSubscription(userId);
  const { engine, storage } = await buildEngine(userId, subRow);
  const session = dbRowToSession(row);
  saveSession(session, storage);

  const catalog = getModelCatalog();
  const section = getCurrentSection(session);
  const sectionContent = section
    ? resolveCurrentSectionContent(session, catalog)
    : undefined;

  const result = await engine.submitSection(sessionId, body.answer, sectionContent);
  await updateExamSession(result.session);
  await storage.flush();

  const nextSection = getCurrentSection(result.session);
  return {
    evaluation: result.evaluation,
    llmProposals: result.llmProposals || [],
    session: result.session,
    nextSection,
  };
}

export async function completeExamSession(userId, sessionId, idempotencyKey) {
  const row = await findExamSession(sessionId, userId);
  if (!row) throw new AppError("SESSION_NOT_FOUND", "Prüfungssitzung nicht gefunden.", 404);

  const subRow = await getCurrentSubscription(userId);
  const { engine, storage } = await buildEngine(userId, subRow);
  const session = dbRowToSession(row);
  saveSession(session, storage);

  const completeResult = await engine.complete(sessionId);
  await updateExamSession({ ...session, status: "completed" });
  await storage.flush();

  const persisted = await persistCompleteResult(userId, sessionId, completeResult);

  return {
    report: persisted.report,
    profile: completeResult.profile,
    pendingHumanReview: completeResult.pendingHumanReview,
    labEnqueued: persisted.labEnqueued,
  };
}

export async function cancelExamSession(userId, sessionId) {
  const row = await findExamSession(sessionId, userId);
  if (!row) throw new AppError("SESSION_NOT_FOUND", "Prüfungssitzung nicht gefunden.", 404);
  await updateExamSession({ ...dbRowToSession(row), status: "cancelled" });
  return { cancelled: true };
}
