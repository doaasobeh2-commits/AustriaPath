/**
 * Deterministic A2 coach daily report — built from completed exercise feedback.
 * No AI calls; used when finishing an A2 training day in coach-v1.
 * @module data/utils/a2CoachDailyReport
 */

import { getPlanByIndex } from './weeklyPlanCoachState.js';
import { focusName } from './weeklyPlanLabels.js';

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {object[]} _trainingMemories
 */
export function buildA2DailyReport(plan, planIndex, _trainingMemories = []) {
  const planEntry = getPlanByIndex(plan, planIndex);
  const exercises = (planEntry?.exercises || []).map((exercise) => ({
    title: exercise.activityName || `Übung ${exercise.slot}`,
    summary: exercise.feedback?.summary || 'Übung abgeschlossen.',
    tone: exercise.feedback?.lines?.[0]?.tone || 'neutral',
  }));

  const skills = (planEntry?.exercises || [])
    .map((exercise) => exercise.coachType)
    .filter(Boolean)
    .map((type) => {
      if (type === 'listening') return 'Hören';
      if (type === 'reading') return 'Lesen';
      if (type === 'speaking') return 'Sprechen';
      if (type === 'email') return 'Schreiben';
      if (type === 'grammar') return 'Grammatik';
      return focusName(type);
    });

  const uniqueSkills = [...new Set(skills)];
  const summaries = exercises.map((entry) => entry.summary).filter(Boolean);

  return {
    summary: `Trainingsplan ${planIndex} abgeschlossen – ${exercises.length} Übungen bearbeitet.`,
    overallPerformance:
      summaries.find((line) => line.includes('richtig') || line.includes('Sehr gut')) ||
      summaries[0] ||
      'Guter Trainingsfortschritt heute.',
    strongestSkill: uniqueSkills[0] || 'Regelmäßiges Üben',
    weakestSkill: uniqueSkills.length > 1 ? uniqueSkills[uniqueSkills.length - 1] : null,
    tomorrowPriorities: [
      planIndex < (plan?.totalPlans || 7)
        ? 'Morgen startet der nächste Trainingsplan mit neuen Aufgaben.'
        : 'Wiederhole die wichtigsten Korrekturen aus dieser Woche.',
    ],
    exercises,
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState | null | undefined} plan
 */
export function isB1CoachWeeklyPlan(plan) {
  return plan?.planKind === 'b1-weekly-plan-v1';
}
