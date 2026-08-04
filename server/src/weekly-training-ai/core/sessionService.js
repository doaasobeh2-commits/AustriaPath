/**
 * B1 Weekly Training AI session lifecycle.
 * Per-exercise: training memory + interactive turns only.
 * Final correction: Final Daily Report via dayService.
 * @module weekly-training-ai/core/sessionService
 */

import {
  B1_WEEKLY_TRAINING_LEVEL,
  B1_WEEKLY_TRAINING_PRODUCT_SCOPE,
  assertB1WeeklyTrainingAiEnabled,
} from "./config.js";
import {
  assertCategoryCompleteImplemented,
  assertCategoryTurnImplemented,
  isInteractiveCoachCategory,
} from "./categoryCapabilities.js";
import {
  assertSessionUsesFrozenSnapshot,
  resolveAndFreezeB1CatalogModel,
} from "./catalogResolver.js";
import { buildSessionIdempotencyScope } from "./idempotency.js";
import { buildPlaceholderFinalReport } from "./reportBuilder.js";
import { extractSchreibenWritingTask } from "./schreibenSnapshot.js";
import { extractBildbeschreibungLearnerTask } from "./bildbeschreibungSnapshot.js";
import { buildPlanungOpeningMessage } from "./planungOpening.js";
import { validateTrainingMemory } from "./trainingMemory.js";
import { runB1InteractiveTurn } from "../handlers/b1-interactive-turn.handler.js";
import {
  countAssistantTurns,
  filterDialogueTranscript,
  isConversationMarkedComplete,
} from "./conversationTranscript.js";
import {
  findSessionByIdempotencyScope,
  getSessionForUser,
  insertSession,
  toPublicSession,
  updateSession,
} from "./sessionStore.js";
import { logWeeklyTrainingAiEvent } from "./usageLogger.js";
import { AppError } from "../../middleware/errorHandler.js";

export const B1_SESSION_STATUS_IN_PROGRESS = "in_progress";
export const B1_SESSION_STATUS_MEMORY_SAVED = "memory_saved";
export const B1_SESSION_STATUS_COMPLETED = "completed";

/**
 * @param {object} input
 */
export async function startB1WeeklyTrainingSession(input) {
  assertB1WeeklyTrainingAiEnabled();

  const idempotencyScope = buildSessionIdempotencyScope(input);
  const existing = await findSessionByIdempotencyScope(input.userId, idempotencyScope);
  if (existing) {
    return {
      session: toPublicSession(existing),
      writingTask: extractSchreibenWritingTask(existing.modelSnapshot),
      imageTask: extractBildbeschreibungLearnerTask(existing.modelSnapshot),
      replayed: true,
    };
  }

  const frozen = resolveAndFreezeB1CatalogModel(input.category, input.modelId, {
    planIndex: input.planIndex,
    exerciseSlot: input.exerciseSlot,
    selectedEmailIndex: input.selectedEmailIndex,
  });

  const session = await insertSession({
    userId: input.userId,
    trainingLevel: B1_WEEKLY_TRAINING_LEVEL,
    productScope: B1_WEEKLY_TRAINING_PRODUCT_SCOPE,
    modelId: frozen.modelId,
    modelVersion: frozen.modelVersion,
    modelSnapshot: frozen.modelSnapshot,
    planHash: input.planHash,
    planIndex: input.planIndex,
    exerciseSlot: input.exerciseSlot,
    category: input.category,
    idempotencyScope,
  });

  await logWeeklyTrainingAiEvent({
    sessionId: session.id,
    userId: input.userId,
    eventType: "session_started",
    payload: {
      category: input.category,
      modelId: frozen.modelId,
      modelVersion: frozen.modelVersion,
      selectedEmailIndex: frozen.modelSnapshot?.selectedEmailIndex || null,
    },
  });

  return {
    session: toPublicSession(session),
    writingTask: extractSchreibenWritingTask(frozen.modelSnapshot),
    imageTask: extractBildbeschreibungLearnerTask(frozen.modelSnapshot),
    replayed: false,
  };
}

/**
 * @param {object} input
 */
export async function getB1WeeklyTrainingSession(input) {
  assertB1WeeklyTrainingAiEnabled();
  const session = await getSessionForUser(input.sessionId, input.userId);
  assertB1Scope(session);
  assertSessionUsesFrozenSnapshot(session);
  return {
    session: toPublicSession(session),
    writingTask: extractSchreibenWritingTask(session.modelSnapshot),
    imageTask: extractBildbeschreibungLearnerTask(session.modelSnapshot),
  };
}

/**
 * @param {object} input
 */
export async function saveB1TrainingMemory(input) {
  assertB1WeeklyTrainingAiEnabled();
  const session = await getSessionForUser(input.sessionId, input.userId);
  assertB1Scope(session);
  assertSessionUsesFrozenSnapshot(session);

  if (session.status === B1_SESSION_STATUS_COMPLETED) {
    return { session: toPublicSession(session), replayed: true };
  }

  const memory = validateTrainingMemory(input.memory, session.category);
  const memoryEntry = {
    role: "memory",
    kind: "exercise_submission",
    data: memory,
    at: new Date().toISOString(),
  };

  const coveredPoints = memory.coveredPoints || session.coveredPoints || [];
  const missingPoints = memory.missingPoints || [];

  const updated = await updateSession(session.id, {
    status: B1_SESSION_STATUS_MEMORY_SAVED,
    transcript: [...session.transcript, memoryEntry],
    coveredPoints,
  });

  await logWeeklyTrainingAiEvent({
    sessionId: session.id,
    userId: input.userId,
    eventType: "training_memory_saved",
    payload: { category: session.category },
  });

  return { session: toPublicSession(updated), replayed: false };
}

/**
 * Planung only — AI partner opens the conversation before the learner records.
 * @param {object} input
 */
export async function beginB1WeeklyTrainingConversation(input) {
  assertB1WeeklyTrainingAiEnabled();
  const session = await getSessionForUser(input.sessionId, input.userId);
  assertB1Scope(session);
  assertSessionInProgress(session);

  if (session.category !== "planung") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Gesprächsstart ist nur für Planung verfügbar.",
      400
    );
  }

  const snapshot = assertSessionUsesFrozenSnapshot(session);
  const existingAssistant = (session.transcript || []).find((entry) => entry.role === "assistant");

  if (existingAssistant) {
    return {
      session: toPublicSession(session),
      openingMessage: existingAssistant.text,
      replayed: true,
    };
  }

  const openingMessage = buildPlanungOpeningMessage(snapshot);
  const transcriptEntry = {
    role: "assistant",
    text: openingMessage,
    at: new Date().toISOString(),
  };

  const updated = await updateSession(session.id, {
    transcript: [transcriptEntry],
  });

  await logWeeklyTrainingAiEvent({
    sessionId: session.id,
    userId: input.userId,
    eventType: "conversation_begun",
    payload: { category: session.category },
  });

  return {
    session: toPublicSession(updated),
    openingMessage,
    replayed: false,
  };
}

/**
 * @param {object} input
 */
export async function turnB1WeeklyTrainingSession(input) {
  assertB1WeeklyTrainingAiEnabled();
  const session = await getSessionForUser(input.sessionId, input.userId);
  assertB1Scope(session);
  assertCategoryTurnImplemented(session.category);
  assertSessionInProgress(session);

  const snapshot = assertSessionUsesFrozenSnapshot(session);

  if (isConversationMarkedComplete(session.transcript)) {
    throw new AppError(
      "SESSION_NOT_ACTIVE",
      "Das Gespräch ist bereits abgeschlossen.",
      409
    );
  }

  if (!isInteractiveCoachCategory(session.category)) {
    throw new AppError(
      "NOT_IMPLEMENTED",
      `Turn für Kategorie "${session.category}" ist nicht implementiert.`,
      501
    );
  }

  const learnerText = String(input.learnerMessage || "").trim();
  if (!learnerText) {
    throw new AppError("VALIDATION_ERROR", "learnerMessage ist erforderlich.", 400);
  }

  const learnerEntry = {
    role: "learner",
    text: learnerText,
    at: new Date().toISOString(),
  };

  const dialogueTranscript = filterDialogueTranscript(session.transcript);
  const followUpQuestionsAsked =
    session.category === "planung"
      ? Math.max(0, countAssistantTurns(dialogueTranscript) - 1)
      : countAssistantTurns(dialogueTranscript);
  const maxConversationTurns =
    session.category === "planung"
      ? Number(snapshot.maxConversationTurns || 12)
      : null;

  const turn = await runB1InteractiveTurn({
    category: session.category,
    modelSnapshot: snapshot,
    session: { ...session, transcript: dialogueTranscript },
    learnerMessage: learnerText,
    followUpQuestionsAsked,
    maxConversationTurns,
  });

  const transcript = [
    ...session.transcript,
    learnerEntry,
    turn.transcriptEntry,
  ];

  const updated = await updateSession(session.id, {
    transcript,
    coveredPoints: turn.coveredPoints,
  });

  await logWeeklyTrainingAiEvent({
    sessionId: session.id,
    userId: input.userId,
    eventType: "session_turn",
    payload: {
      category: session.category,
      coveredCount: turn.coveredPoints.length,
      missingCount: turn.missingPoints.length,
    },
  });

  return {
    session: toPublicSession(updated),
    turn: {
      assistantMessage: turn.assistantMessage,
      coveredPoints: turn.coveredPoints,
      missingPoints: turn.missingPoints,
      allRequiredCovered: turn.allRequiredCovered,
      conversationComplete: turn.conversationComplete,
      modelId: snapshot.id,
      modelVersion: session.modelVersion,
    },
  };
}

/**
 * Per-exercise session complete is disabled — use /days/complete for Final Daily Report.
 * @param {object} input
 */
export async function completeB1WeeklyTrainingSession(input) {
  assertB1WeeklyTrainingAiEnabled();
  const session = await getSessionForUser(input.sessionId, input.userId);
  assertB1Scope(session);
  assertCategoryCompleteImplemented(session.category);

  if (session.status === B1_SESSION_STATUS_COMPLETED && session.finalReport) {
    return { session: toPublicSession(session), report: session.finalReport, replayed: true };
  }

  assertSessionInProgress(session);
  assertSessionUsesFrozenSnapshot(session);
  const finalReport = buildPlaceholderFinalReport(session);
  const completedAt = new Date().toISOString();

  const updated = await updateSession(session.id, {
    status: B1_SESSION_STATUS_COMPLETED,
    finalReport,
    completedAt,
  });

  await logWeeklyTrainingAiEvent({
    sessionId: session.id,
    userId: input.userId,
    eventType: "session_completed",
    payload: { category: session.category, finalReportVersion: finalReport.version },
  });

  return { session: toPublicSession(updated), report: finalReport, replayed: false };
}

/**
 * @param {object} session
 */
function assertB1Scope(session) {
  if (session.trainingLevel !== B1_WEEKLY_TRAINING_LEVEL) {
    throw new AppError("FORBIDDEN", "Nur B1-Trainingssitzungen werden unterstützt.", 403);
  }
  if (session.productScope !== B1_WEEKLY_TRAINING_PRODUCT_SCOPE) {
    throw new AppError("FORBIDDEN", "Ungültiger Produktbereich.", 403);
  }
}

/**
 * @param {object} session
 */
function assertSessionInProgress(session) {
  if (
    session.status !== B1_SESSION_STATUS_IN_PROGRESS &&
    session.status !== B1_SESSION_STATUS_MEMORY_SAVED
  ) {
    throw new AppError("SESSION_NOT_ACTIVE", "Trainingssitzung ist nicht aktiv.", 409);
  }
}
