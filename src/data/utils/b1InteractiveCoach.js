/**
 * B1 interactive coach client — session start, turns, and training memory.
 */
import {
  getB1WeeklyTrainingSession,
  postB1TrainingSessionMemory,
  postB1WeeklyTrainingSessionStart,
  postB1WeeklyTrainingSessionTurn,
} from '../../api/b1WeeklyTrainingAiClient.js';
import { ApiError } from '../../api/httpClient.js';
import { apiFetch } from '../../api/httpClient.js';
import {
  isB1WeeklyPlanBildbeschreibungTask,
  isB1WeeklyPlanInteractiveSpeakingTask,
} from './b1WeeklyPlanCoachTaskAdapter.js';
import { buildWeeklyPlanSessionHash } from './b1SchreibenAiCorrection.js';
import {
  buildBildbeschreibungTrainingMemory,
  buildSpeakingTrainingMemory,
} from './weeklyPlanTrainingMemory.js';

export const B1_RECORDING_LIMITS_MS = {
  bildbeschreibung: 80_000,
  planung: 80_000,
  selbstvorstellung: 120_000,
};

/**
 * @param {object} task
 */
export function getB1RecordingLimitMs(task) {
  if (task?.isB1WeeklyPlanSelbstvorstellungTask) return B1_RECORDING_LIMITS_MS.selbstvorstellung;
  if (task?.isB1WeeklyPlanPlanungTask) return B1_RECORDING_LIMITS_MS.planung;
  return B1_RECORDING_LIMITS_MS.bildbeschreibung;
}

/**
 * @param {string} sessionId
 */
export async function beginB1PlanungConversation(sessionId) {
  const response = await apiFetch(`/weekly-training-ai/b1/sessions/${sessionId}/begin`, {
    method: 'POST',
    json: {},
  });

  return {
    openingMessage: response.openingMessage || '',
    session: response.session || null,
  };
}

/**
 * @param {object} task
 */
export function shouldRequestB1InteractiveSession(task) {
  return isB1WeeklyPlanInteractiveSpeakingTask(task);
}
export async function startB1InteractiveSession({ exercise, plan, planIndex, slot, category }) {
  if (exercise?.b1AiSessionId) {
    try {
      const existing = await getB1WeeklyTrainingSession(exercise.b1AiSessionId);
      return {
        sessionId: existing.session?.sessionId || exercise.b1AiSessionId,
        imageTask: existing.imageTask || exercise.b1TaskSnapshot || null,
        replayed: true,
      };
    } catch (error) {
      const staleSession =
        error instanceof ApiError && (error.status === 404 || error.status === 403);
      if (!staleSession) {
        throw error;
      }
    }
  }

  const idempotencyKey = `b1-${category}-start:${planIndex}:${slot}:${buildWeeklyPlanSessionHash(plan)}`;

  const response = await postB1WeeklyTrainingSessionStart({
    body: {
      trainingLevel: 'B1',
      category,
      modelId: exercise.taskId,
      planHash: buildWeeklyPlanSessionHash(plan),
      planIndex,
      exerciseSlot: slot,
    },
    idempotencyKey,
  });

  return {
    sessionId: response.session?.sessionId,
    imageTask: response.imageTask || null,
    replayed: Boolean(response.replayed),
  };
}

/**
 * @param {string} sessionId
 * @param {string} learnerMessage
 */
export async function sendB1InteractiveTurn(sessionId, learnerMessage) {
  const response = await postB1WeeklyTrainingSessionTurn({
    sessionId,
    learnerMessage,
  });

  return {
    assistantMessage: response.turn?.assistantMessage || '',
    coveredPoints: response.turn?.coveredPoints || response.session?.coveredPoints || [],
    missingPoints: response.turn?.missingPoints || [],
    allRequiredCovered: Boolean(response.turn?.allRequiredCovered),
    conversationComplete: Boolean(response.turn?.conversationComplete),
    transcript: response.session?.transcript || [],
  };
}

/**
 * @param {object} exercise
 * @param {object} [task]
 */
export async function saveB1InteractiveTrainingMemory(exercise, task) {
  const sessionId = exercise?.b1AiSessionId;
  if (!sessionId) return null;

  const category = exercise?.b1Category || task?.b1Category;
  const memory = isB1WeeklyPlanBildbeschreibungTask(task)
    ? buildBildbeschreibungTrainingMemory(exercise, task)
    : buildSpeakingTrainingMemory(exercise, task, category);

  return postB1TrainingSessionMemory({ sessionId, memory });
}

/** @deprecated Use saveB1InteractiveTrainingMemory */
export async function saveB1BildbeschreibungTrainingMemory(exercise, task) {
  return saveB1InteractiveTrainingMemory(exercise, task);
}

/**
 * @param {Array<{ role: string, text: string }>} dialogue
 */
export function compileLearnerTranscript(dialogue = []) {
  return dialogue
    .filter((entry) => entry.role === 'learner')
    .map((entry) => String(entry.text || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * @param {object} task
 * @param {object} [sessionResult]
 */
export function buildB1InteractiveTaskSnapshot(task, sessionResult = {}) {
  if (isB1WeeklyPlanBildbeschreibungTask(task)) {
    const imageTask = sessionResult.imageTask || {};
    return {
      imageId: imageTask.imageId || task.imageId,
      imageAsset: imageTask.imageAsset || task.imageAsset,
      title: imageTask.title || task.title,
      taskPrompt: imageTask.taskPrompt || task.task,
    };
  }

  if (task?.isB1WeeklyPlanPlanungTask) {
    return {
      title: task.title,
      scenario: task.scenario,
      requiredDiscussionPoints: task.requiredDiscussionPoints || [],
      conversationGoal: task.conversationGoal || '',
    };
  }

  if (task?.isB1WeeklyPlanSelbstvorstellungTask) {
    return {
      title: task.title,
      description: task.description || task.task,
    };
  }

  return null;
}
