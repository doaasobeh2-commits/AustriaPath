import catalogJson from './b1-hoeren-catalog.json' with { type: 'json' };
import { B1_WEEKLY_PLAN_ID_PREFIX, B1_WEEKLY_PLAN_MODEL_VERSION } from './metadata.js';

const PUBLIC_AUDIO_BASE = '/audio/weekly-plan/b1/hoeren';

function flattenTranscript(transcript) {
  if (typeof transcript === 'string') {
    return transcript.trim();
  }
  if (Array.isArray(transcript)) {
    return transcript
      .map((turn) => (typeof turn === 'object' ? turn.text : turn))
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  return '';
}

function toPublicAudioPath(audioRef) {
  const fileName = String(audioRef || '')
    .replace(/\\/g, '/')
    .split('/')
    .pop();
  return fileName ? `${PUBLIC_AUDIO_BASE}/${fileName}` : null;
}

function toWeeklyPlanModelId(catalogModelId, index) {
  const match = String(catalogModelId).match(/(\d+)\s*$/);
  const num = match ? match[1].padStart(3, '0') : String(index + 1).padStart(3, '0');
  return `${B1_WEEKLY_PLAN_ID_PREFIX}-hoeren-${num}`;
}

/**
 * B1 Weekly Plan Hören library — single source: b1-hoeren-catalog.json
 */
function buildHoerenCatalog() {
  return (catalogJson.models || []).map((model, index) => ({
    id: toWeeklyPlanModelId(model.id, index),
    modelVersion: B1_WEEKLY_PLAN_MODEL_VERSION,
    catalogModelId: model.id,
    level: 'B1',
    title: model.title,
    topic: model.topic,
    description: `${model.clips?.length || 0} Hörteile — ${model.title}`,
    shortDescription: model.clips?.[0]?.title || model.title,
    category: 'hoeren',
    status: 'approved',
    parts: (model.clips || []).map((clip) => ({
      id: clip.id,
      title: clip.title,
      transcript: flattenTranscript(clip.transcript),
      transcriptTurns: Array.isArray(clip.transcript) ? clip.transcript : [],
      audioPath: toPublicAudioPath(clip.audio),
      durationSeconds: clip.durationSeconds,
      speakerType: clip.speakerType,
      speakers: clip.speakers || [],
      background: clip.background || null,
      audioDirection: clip.audioDirection || null,
      questions: (clip.questions || []).map((question) => ({
        id: question.id,
        type: question.type,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        answerText: question.answerText,
      })),
      difficulty: 'B1',
    })),
    source: {
      file: 'src/data/weekly-plan/b1/b1-hoeren-catalog.json',
      sourceId: model.id,
    },
  }));
}

export const b1WeeklyPlanHoerenCatalog = Object.freeze(buildHoerenCatalog());

export const b1WeeklyPlanHoerenApprovedCount = b1WeeklyPlanHoerenCatalog.filter(
  (model) => model.status === 'approved'
).length;

export const b1WeeklyPlanHoerenSelectionBlocked = b1WeeklyPlanHoerenApprovedCount < 7;
