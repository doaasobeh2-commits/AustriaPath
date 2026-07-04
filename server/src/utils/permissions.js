/**
 * Plan permissions — mirrors src/data/subscriptionEngine.js getPermissionsByPlan().
 */

export function getPermissionsByPlan(type = "free") {
  const free = {
    placementTest: false,
    aiExam: false,
    weeklyPlan: false,
    reports: false,
    writingAI: false,
    imageAI: false,
    speakingAI: false,
    readingAI: false,
    listeningAI: false,
  };

  if (type === "placement_test") {
    return { ...free, placementTest: true, reports: true };
  }
  if (type === "weekly_plan") {
    return {
      ...free,
      weeklyPlan: true,
      reports: true,
      writingAI: true,
      imageAI: true,
      speakingAI: true,
    };
  }
  if (type === "ai_exam") {
    return {
      ...free,
      aiExam: true,
      reports: true,
      writingAI: true,
      imageAI: true,
      speakingAI: true,
      readingAI: true,
      listeningAI: true,
    };
  }
  if (type === "intensive_week" || type === "premium_month") {
    return {
      placementTest: true,
      aiExam: true,
      weeklyPlan: true,
      reports: true,
      writingAI: true,
      imageAI: true,
      speakingAI: true,
      readingAI: true,
      listeningAI: true,
    };
  }
  return free;
}

export const PLAN_EXAM_MAP = Object.freeze({
  free: 0,
  placement_test: 1,
  weekly_plan: 0,
  ai_exam: 1,
  intensive_week: 3,
  premium_month: 5,
});

export const PLAN_CREDIT_MAP = Object.freeze({
  free: 0,
  placement_test: 30,
  weekly_plan: 30,
  ai_exam: 50,
  intensive_week: 150,
  premium_month: 250,
});

export const AI_COSTS = Object.freeze({
  placement_test: 1,
  weekly_plan: 1,
  ai_exam: 2,
  intensive_week_session: 2,
  premium_month_session: 2,
  report_builder: 1,
  follow_up_question: 1,
  llm_proposal: 1,
});
