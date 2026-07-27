/**
 * B1 Schreiben Weekly Training AI — session binding + training memory only.
 * Correction happens in the Final Daily Report, not per exercise.
 */
import { isB1WeeklyPlanSchreibenTask } from './b1WeeklyPlanCoachTaskAdapter.js';
import { resolveDeterministicSchreibenEmailIndex } from './b1SchreibenTaskParser.js';
import { buildSchreibenTrainingMemory } from './weeklyPlanTrainingMemory.js';
import { ApiError } from '../../api/httpClient.js';
import {
  getB1WeeklyTrainingSession,
  postB1DailyReportComplete,
  postB1TrainingSessionMemory,
  postB1WeeklyTrainingSessionStart,
} from '../../api/b1WeeklyTrainingAiClient.js';

/**
 * @param {object} task
 */
export function shouldRequestB1SchreibenSession(task) {
  return isB1WeeklyPlanSchreibenTask(task);
}

/** @deprecated use shouldRequestB1SchreibenSession */
export function shouldRequestB1SchreibenAiCorrection(task) {
  return shouldRequestB1SchreibenSession(task);
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 */
export function buildWeeklyPlanSessionHash(plan) {
  return String(plan?.activatedAt || plan?.libraryVersion || 'b1-weekly-plan');
}

/**
 * Idempotency keys must match server pattern /^[A-Za-z0-9._:-]{1,128}$/.
 * @param {number} planIndex
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 */
export function buildB1DailyReportIdempotencyKey(planIndex, plan) {
  const planHash = buildWeeklyPlanSessionHash(plan)
    .replace(/[^A-Za-z0-9._:-]/g, '-')
    .slice(0, 64);
  return `b1-daily-report:${planIndex}:${planHash}`;
}

/**
 * @param {object} exercise
 * @param {Array<{ emailIndex?: number }>} modelEmails
 * @param {number} planIndex
 * @param {number} slot
 */
export function resolveB1SchreibenEmailIndexForSession(exercise, modelEmails, planIndex, slot) {
  if (Number(exercise?.selectedEmailIndex) > 0) {
    return Number(exercise.selectedEmailIndex);
  }
  return resolveDeterministicSchreibenEmailIndex(modelEmails, planIndex, slot);
}

/**
 * @param {object} params
 */
export async function ensureB1SchreibenTrainingSession({
  exercise,
  plan,
  planIndex,
  slot,
  modelEmails,
  idempotencyKey,
}) {
  if (exercise?.b1AiSessionId) {
    const existing = await getB1WeeklyTrainingSession(exercise.b1AiSessionId);
    return {
      sessionId: existing.session?.sessionId || exercise.b1AiSessionId,
      writingTask: existing.writingTask || exercise.b1WritingSnapshot,
      selectedEmailIndex:
        existing.session?.selectedEmailIndex || exercise.selectedEmailIndex || null,
      replayed: true,
    };
  }

  const selectedEmailIndex = resolveB1SchreibenEmailIndexForSession(
    exercise,
    modelEmails,
    planIndex,
    slot
  );

  const startKey =
    idempotencyKey ||
    `b1-schreiben-start:${planIndex}:${slot}:email${selectedEmailIndex}:${buildWeeklyPlanSessionHash(plan)}`;

  const response = await postB1WeeklyTrainingSessionStart({
    body: {
      trainingLevel: 'B1',
      category: 'schreiben',
      modelId: exercise.taskId,
      planHash: buildWeeklyPlanSessionHash(plan),
      planIndex,
      exerciseSlot: slot,
      selectedEmailIndex,
    },
    idempotencyKey: startKey,
  });

  return {
    sessionId: response.session?.sessionId,
    writingTask: response.writingTask,
    selectedEmailIndex: response.session?.selectedEmailIndex || selectedEmailIndex,
    replayed: Boolean(response.replayed),
  };
}

/**
 * Persist Schreiben training memory to the server session — no AI correction.
 * @param {object} exercise
 * @param {object} [task]
 */
export async function saveB1SchreibenTrainingMemory(exercise, task) {
  const sessionId = exercise?.b1AiSessionId;
  if (!sessionId) return null;

  const memory = buildSchreibenTrainingMemory(exercise, task);
  return postB1TrainingSessionMemory({
    sessionId,
    memory,
  });
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {object[]} trainingMemories
 */
export async function fetchB1DailyReport(plan, planIndex, trainingMemories) {
  const planHash = buildWeeklyPlanSessionHash(plan);
  const idempotencyKey = buildB1DailyReportIdempotencyKey(planIndex, plan);
  const response = await postB1DailyReportComplete({
    planIndex,
    planHash,
    trainingMemories,
    idempotencyKey,
  });
  const dailyReport = response?.dailyReport ?? response;
  if (!dailyReport || typeof dailyReport !== 'object') {
    throw new ApiError(
      'INVALID_RESPONSE',
      'Der Tagesbericht konnte nicht geladen werden.',
      502
    );
  }
  return dailyReport;
}

/**
 * @param {object} error
 */
export function formatB1TrainingAiError(error) {
  return error?.message || 'Die Anfrage ist fehlgeschlagen. Dein Fortschritt bleibt gespeichert.';
}

/** @deprecated */
export function formatB1SchreibenAiError(error) {
  return formatB1TrainingAiError(error);
}
