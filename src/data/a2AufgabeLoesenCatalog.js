/**
 * Canonical A2 Aufgabe lösen guided-study library.
 * Turn content (partner text, learner model response, audio) comes from CSV.
 * Task-level metadata (situation, task points, roles) comes from JSON.
 */
import catalogJson from './a2AufgabeLoesenCatalog.json' with { type: 'json' };
import csvRaw from './a2-aufgabe-loesen-with-learner-responses.csv.js';
import { parseA2AufgabeLoesenCsv } from './utils/parseA2AufgabeLoesenCsv.js';

export const A2_AUFGABE_LOESEN_AUDIO_BASE_PATH = catalogJson.audioBasePath;
export const PARTNER_TURNS_PER_TASK = 4;
export const AUFGABE_LOESEN_EXERCISE_TYPE = 'Aufgabe lösen';

const IGNORED_AUDIO_FILES = new Set(['welcome.mp3']);

/** @type {Record<string, typeof catalogJson.tasks[number]>} */
const taskMetaById = Object.fromEntries(catalogJson.tasks.map((task) => [task.id, task]));

const csvRows = parseA2AufgabeLoesenCsv(csvRaw).filter((row) => {
  const audio = String(row.audio_file || '').trim().toLowerCase();
  return audio && !IGNORED_AUDIO_FILES.has(audio);
});

/** @type {Map<string, object[]>} */
const turnsByTaskId = new Map();
csvRows.forEach((row) => {
  const taskId = String(row.task_id || '').trim();
  if (!taskId) return;
  if (!turnsByTaskId.has(taskId)) turnsByTaskId.set(taskId, []);
  turnsByTaskId.get(taskId).push({
    turn: Number(row.turn),
    partnerText: String(row.partner_text || '').trim(),
    audioFile: String(row.audio_file || '').trim(),
    learnerResponse: String(row.learner_response || '').trim(),
    voiceProfileId: String(row.voice_profile_id || '').trim(),
  });
});

/** @type {typeof catalogJson.tasks} */
const builtTasks = catalogJson.tasks.map((meta) => {
  const csvTurns = (turnsByTaskId.get(meta.id) || [])
    .sort((a, b) => a.turn - b.turn)
    .map((turn) => ({
      turn: turn.turn,
      partnerText: turn.partnerText,
      audioFile: turn.audioFile,
      learnerResponse: turn.learnerResponse,
      voiceProfileId: turn.voiceProfileId,
    }));

  return {
    ...meta,
    turns: csvTurns.length ? csvTurns : meta.turns,
  };
});

export const a2AufgabeLoesenTasks = Object.freeze(builtTasks);

export const a2AufgabeLoesenTaskMap = Object.freeze(
  Object.fromEntries(a2AufgabeLoesenTasks.map((task) => [task.id, task]))
);

export const A2_AUFGABE_LOESEN_RUNTIME_RULES = Object.freeze({
  ...catalogJson.runtimeRules,
  liveAIConversation: false,
  evaluateAfterCompletionOnly: false,
  studentRecordingBetweenTurns: false,
  guidedStudy: true,
});

/**
 * @param {string} canonicalTaskId
 */
export function getA2AufgabeLoesenTask(canonicalTaskId) {
  return a2AufgabeLoesenTaskMap[canonicalTaskId] || null;
}

/**
 * @param {string} audioFile
 */
export function resolveA2AufgabeLoesenAudioPath(audioFile) {
  const base = A2_AUFGABE_LOESEN_AUDIO_BASE_PATH.endsWith('/')
    ? A2_AUFGABE_LOESEN_AUDIO_BASE_PATH
    : `${A2_AUFGABE_LOESEN_AUDIO_BASE_PATH}/`;
  return `${base}${audioFile}`;
}

/**
 * @param {string} weeklyPlanTaskId
 */
export function weeklyPlanIdToCanonicalTaskId(weeklyPlanTaskId) {
  const match = String(weeklyPlanTaskId || '').match(/^a2-al-(\d{3})$/i);
  if (!match) return null;
  return `A2-AL-${match[1]}`;
}

/**
 * @param {string} canonicalTaskId
 */
export function canonicalTaskIdToWeeklyPlanId(canonicalTaskId) {
  const match = String(canonicalTaskId || '').match(/^A2-AL-(\d{3})$/i);
  if (!match) return null;
  return `a2-al-${match[1]}`;
}

export function listA2AufgabeLoesenCanonicalIds() {
  return a2AufgabeLoesenTasks.map((task) => task.id);
}

/**
 * Map canonical catalog tasks to SpeakingScreen model entries.
 */
export function getA2AufgabeLoesenSpeakingModels() {
  return a2AufgabeLoesenTasks.map((task) => ({
    type: AUFGABE_LOESEN_EXERCISE_TYPE,
    level: 'A2',
    title: task.title,
    canonicalId: task.id,
    isGuidedAufgabeLoesen: true,
    catalogTask: task,
    situation: task.situation,
    task: Array.isArray(task.taskPoints) ? task.taskPoints.join('\n') : '',
    taskPoints: task.taskPoints,
    learnerRole: task.learnerRole,
    partnerRole: task.partnerRole,
    category: task.category,
  }));
}
