export const ACCESS_CONTROL = {
  adminApprovalEnabled: true,
  defaultUserStatus: "pending",

  statuses: {
    pending: "pending",
    approved: "approved",
    blocked: "blocked",
  },

  aiCreditsEnabled: true,
  defaultAICredits: 5,

  aiCosts: {
    placement_test: 1,
    weekly_plan: 1,
    ai_exam: 2,
    intensive_week_session: 2,
    premium_month_session: 2,
    report_builder: 1,
    follow_up_question: 1,
  },
};