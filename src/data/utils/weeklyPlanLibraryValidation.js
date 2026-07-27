/**
 * @module data/utils/weeklyPlanLibraryValidation
 */

import {
  getActivityNamesForLevel,
  isValidActivityNameForLevel,
  WEEKLY_PLAN_ACTIVITY_CATALOG,
} from '../weeklyPlanActivityCatalog.js';
import { weeklyPlanLibrary, resolveCoachType } from '../weeklyPlanLibrary.js';
import { weeklyPlanTaskNavigation } from '../weeklyPlanTaskNavigation.js';
import {
  extractListeningQuestions,
  extractReadingQuestions,
} from '../../exam-platform/evaluators/questionExtractors.js';

const PLACEHOLDER_PATTERN = /TODO|Beispielaufgabe|Lorem ipsum/i;

/**
 * @returns {Record<'A2'|'B1'|'B2', string[]>}
 */
export function getUncoveredCatalogActivities() {
  /** @type {Record<'A2'|'B1'|'B2', string[]>} */
  const missing = { A2: [], B1: [], B2: [] };

  for (const level of ['A2', 'B1', 'B2']) {
    const covered = new Set(
      weeklyPlanLibrary.filter((task) => task.level === level).map((task) => task.activityName)
    );
    for (const activityName of getActivityNamesForLevel(level)) {
      if (!covered.has(activityName)) {
        missing[level].push(activityName);
      }
    }
  }

  return missing;
}

/**
 * @returns {string[]}
 */
export function validateWeeklyPlanLibraryIntegrity() {
  const errors = [];
  const ids = new Set();

  weeklyPlanLibrary.forEach((task) => {
    if (ids.has(task.id)) {
      errors.push(`Duplicate task id: ${task.id}`);
    }
    ids.add(task.id);

    if (!task.activityName) {
      errors.push(`${task.id} missing activityName`);
    } else if (!isValidActivityNameForLevel(task.level, task.activityName)) {
      errors.push(`${task.id} has invalid activityName: ${task.activityName}`);
    }

    if (!weeklyPlanTaskNavigation[task.id] && !task.emailLibraryId) {
      errors.push(`${task.id} missing weeklyPlanTaskNavigation entry`);
    }

    const serialized = JSON.stringify(task);
    if (PLACEHOLDER_PATTERN.test(serialized)) {
      errors.push(`${task.id} contains placeholder text`);
    }

    const coachType = resolveCoachType(task);
    if (!coachType) {
      errors.push(`${task.id} missing coachType`);
    }

    if (coachType === 'listening') {
      const isCatalogA2Horen = Boolean(
        task.canonicalModelId && String(task.canonicalModelId).startsWith('A2-H-')
      );
      if (!isCatalogA2Horen) {
        const questions = extractListeningQuestions(task);
        if (!task.audioText?.trim()) {
          errors.push(`${task.id} listening task missing audioText`);
        }
        if (!questions.length) {
          errors.push(`${task.id} listening task has no evaluable questions`);
        }
      } else if (!task.canonicalModelId) {
        errors.push(`${task.id} A2 hören task missing canonicalModelId`);
      }
    }

    if (coachType === 'reading') {
      const isCatalogA2Lesen = Boolean(
        task.canonicalModelId && String(task.canonicalModelId).startsWith('A2-L-')
      );
      if (!isCatalogA2Lesen) {
        if (!task.text?.trim()) {
          errors.push(`${task.id} reading task missing text`);
        }
        const questions = extractReadingQuestions(task);
        if (!questions.length) {
          errors.push(`${task.id} reading task has no evaluable questions`);
        }
      } else if (!task.canonicalModelId) {
        errors.push(`${task.id} A2 lesen task missing canonicalModelId`);
      }
    }

    if (coachType === 'grammar') {
      if (!task.solution?.trim() && !task.example?.trim() && !task.task?.trim()) {
        errors.push(`${task.id} grammar task missing deterministic content`);
      }
    }

    if (coachType === 'email' && task.solution) {
      errors.push(`${task.id} open writing task should not expose solution scoring`);
    }

    if (task.skill === 'aufgabe_loesen' && !task.canonicalTaskId) {
      errors.push(`${task.id} aufgabe_loesen task missing canonicalTaskId`);
    }

    if (task.skill === 'hoeren' && task.canonicalModelId && !String(task.canonicalModelId).startsWith('A2-H-')) {
      errors.push(`${task.id} hoeren task has invalid canonicalModelId`);
    }

    if (task.skill === 'lesen' && task.canonicalModelId && !String(task.canonicalModelId).startsWith('A2-L-')) {
      errors.push(`${task.id} lesen task has invalid canonicalModelId`);
    }
  });

  for (const level of ['A2', 'B1', 'B2']) {
    const levelTasks = weeklyPlanLibrary.filter((task) => task.level === level);
    if (levelTasks.length < 15) {
      errors.push(`${level} has only ${levelTasks.length} tasks (minimum 15)`);
    }
    const missing = getUncoveredCatalogActivities()[level];
    if (missing.length) {
      errors.push(`${level} missing catalog activities: ${missing.join(', ')}`);
    }
  }

  const b2Listening = weeklyPlanLibrary.filter(
    (task) => task.level === 'B2' && resolveCoachType(task) === 'listening'
  );
  const b2Speaking = weeklyPlanLibrary.filter(
    (task) => task.level === 'B2' && resolveCoachType(task) === 'speaking'
  );
  if (b2Listening.length < 3) {
    errors.push('B2 listening coverage incomplete');
  }
  if (b2Speaking.length < 3) {
    errors.push('B2 speaking coverage incomplete');
  }

  return errors;
}

/**
 * @returns {Record<'A2'|'B1'|'B2', Record<string, string[]>>}
 */
export function buildCatalogCoverageMatrix() {
  /** @type {Record<'A2'|'B1'|'B2', Record<string, string[]>>} */
  const matrix = { A2: {}, B1: {}, B2: {} };

  for (const level of ['A2', 'B1', 'B2']) {
    for (const [domain, names] of Object.entries(WEEKLY_PLAN_ACTIVITY_CATALOG[level])) {
      matrix[level][domain] = names.map((activityName) => {
        const match = weeklyPlanLibrary.find(
          (task) => task.level === level && task.activityName === activityName
        );
        return match ? match.id : '';
      });
    }
  }

  return matrix;
}

/**
 * @returns {Array<{ taskId: string, asset: string, status: string }>}
 */
export function listVisualAssetRequirements() {
  return weeklyPlanLibrary
    .filter((task) => task.imageAssetRef || task.skill === 'bildbeschreibung' || task.skill === 'grafikbeschreibung')
    .map((task) => ({
      taskId: task.id,
      asset: task.imageAssetRef
        ? `${task.imageAssetRef.source}#${task.imageAssetRef.canonicalId || task.imageAssetRef.id}`
        : `navigation:${weeklyPlanTaskNavigation[task.id]?.canonicalImageId ?? weeklyPlanTaskNavigation[task.id]?.imageId ?? 'unknown'}`,
      status: task.imageAssetRef ? 'catalog-reference-only' : 'navigation-metadata',
    }));
}
