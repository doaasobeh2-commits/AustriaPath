/**
 * @module data/utils/a2AufgabeLoesenValidation
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  A2_AUFGABE_LOESEN_AUDIO_BASE_PATH,
  a2AufgabeLoesenTasks,
  PARTNER_TURNS_PER_TASK,
  resolveA2AufgabeLoesenAudioPath,
} from '../a2AufgabeLoesenCatalog.js';

const EXPECTED_TASK_COUNT = 10;
const EXPECTED_TURN_COUNT = 40;
const EXPECTED_AUDIO_COUNT = 40;
const EXPECTED_LEARNER_RESPONSE_COUNT = 40;
const PUBLIC_ROOT = resolve(process.cwd(), 'public');

/**
 * @param {{ checkFilesOnDisk?: boolean }} [options]
 * @returns {string[]}
 */
export function validateA2AufgabeLoesenCatalog(options = {}) {
  const { checkFilesOnDisk = false } = options;
  const errors = [];

  if (a2AufgabeLoesenTasks.length !== EXPECTED_TASK_COUNT) {
    errors.push(`Expected ${EXPECTED_TASK_COUNT} tasks, found ${a2AufgabeLoesenTasks.length}`);
  }

  const ids = new Set();
  const audioRefs = new Set();
  let learnerResponseCount = 0;
  let turnCount = 0;

  a2AufgabeLoesenTasks.forEach((task) => {
    if (!task.id) {
      errors.push('Task missing id');
      return;
    }
    if (ids.has(task.id)) {
      errors.push(`Duplicate task id: ${task.id}`);
    }
    ids.add(task.id);

    if (!Array.isArray(task.turns) || task.turns.length !== PARTNER_TURNS_PER_TASK) {
      errors.push(`${task.id}: expected ${PARTNER_TURNS_PER_TASK} partner turns`);
    }

    const turnNumbers = new Set();
    (task.turns || []).forEach((turn) => {
      turnCount += 1;
      if (turn.turn < 1 || turn.turn > PARTNER_TURNS_PER_TASK) {
        errors.push(`${task.id}: invalid turn number ${turn.turn}`);
      }
      if (turnNumbers.has(turn.turn)) {
        errors.push(`${task.id}: duplicate turn ${turn.turn}`);
      }
      turnNumbers.add(turn.turn);

      if (!turn.audioFile?.trim()) {
        errors.push(`${task.id} turn ${turn.turn}: missing audioFile`);
      } else if (turn.audioFile.toLowerCase() !== 'welcome.mp3') {
        audioRefs.add(turn.audioFile);
      }

      if (!turn.learnerResponse?.trim()) {
        errors.push(`${task.id} turn ${turn.turn}: missing learnerResponse`);
      } else {
        learnerResponseCount += 1;
      }
    });
  });

  for (let i = 1; i <= EXPECTED_TASK_COUNT; i += 1) {
    const expectedId = `A2-AL-${String(i).padStart(3, '0')}`;
    if (!ids.has(expectedId)) {
      errors.push(`Missing task id: ${expectedId}`);
    }
  }

  if (turnCount !== EXPECTED_TURN_COUNT) {
    errors.push(`Expected ${EXPECTED_TURN_COUNT} turns, found ${turnCount}`);
  }

  if (audioRefs.size !== EXPECTED_AUDIO_COUNT) {
    errors.push(`Expected ${EXPECTED_AUDIO_COUNT} unique MP3 references, found ${audioRefs.size}`);
  }

  if (learnerResponseCount !== EXPECTED_LEARNER_RESPONSE_COUNT) {
    errors.push(
      `Expected ${EXPECTED_LEARNER_RESPONSE_COUNT} learner responses, found ${learnerResponseCount}`
    );
  }

  if (checkFilesOnDisk) {
    audioRefs.forEach((audioFile) => {
      const runtimePath = resolveA2AufgabeLoesenAudioPath(audioFile);
      const diskPath = resolve(PUBLIC_ROOT, runtimePath.replace(/^\//, ''));
      if (!existsSync(diskPath)) {
        errors.push(`Missing audio file on disk: ${runtimePath}`);
      }
    });
  }

  if (!A2_AUFGABE_LOESEN_AUDIO_BASE_PATH.startsWith('/audio/a2/aufgabe-loesen')) {
    errors.push(`Unexpected audio base path: ${A2_AUFGABE_LOESEN_AUDIO_BASE_PATH}`);
  }

  return errors;
}
