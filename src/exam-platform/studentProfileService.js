/**
 * Student Profile Service — long-term learner memory (Phase B).
 * Weekly practice never updates officialExamLevel.
 *
 * @module exam-platform/studentProfileService
 */

import {
  STUDENT_PROFILE_VERSION,
} from "./contracts.js";
import { mayUpdateOfficialLevel } from "./productPolicies.js";
import { PROFILE_UPDATE_ROUTE } from "./lifecycle.js";

export const STUDENT_PROFILE_STORAGE_KEY = "austriaPathStudentProfileV2";

const MAX_EXAM_HISTORY = 20;
const MAX_PRACTICE_HISTORY = 30;
const MAX_REPORT_SUMMARIES = 25;

function cleanLevel(level = "A2") {
  return String(level || "A2").replace("+", "").trim().toUpperCase() || "A2";
}

function mergeUnique(a = [], b = []) {
  return [...new Set([...a, ...b].filter(Boolean))];
}

function detectRecurring(items = [], historyItems = []) {
  const prev = new Set(historyItems.flatMap((h) => h.weaknesses || h.focusSkills || []));
  return items.filter((item) => prev.has(item));
}

/**
 * @returns {import('./contracts.js').StudentProfile}
 */
export function createEmptyProfile() {
  return {
    profileVersion: STUDENT_PROFILE_VERSION,
    officialExamLevel: "A2",
    officialSkillLevels: {},
    weakSkills: [],
    recurringMistakes: [],
    recurringStrengths: [],
    readinessBand: undefined,
    globalUsedModelIds: [],
    activePackage: undefined,
    examHistory: [],
    practiceHistory: [],
    practiceStats: {
      sessionsCompleted: 0,
      minutesPracticed: 0,
      skillPracticeCounts: {},
    },
    reportSummaries: [],
    aiRecommendations: [],
    learningTrends: [],
    subscriptionSnapshot: undefined,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * @param {import('./contracts.js').StudentProfile} [saved]
 * @returns {import('./contracts.js').StudentProfile}
 */
export function normalizeProfile(saved) {
  if (!saved || typeof saved !== "object") return createEmptyProfile();
  return {
    ...createEmptyProfile(),
    ...saved,
    profileVersion: STUDENT_PROFILE_VERSION,
    practiceStats: {
      ...createEmptyProfile().practiceStats,
      ...(saved.practiceStats || {}),
    },
  };
}

/**
 * @param {Storage|null|undefined} storage
 */
export function loadProfile(storage) {
  if (!storage) return createEmptyProfile();
  try {
    const raw = storage.getItem(STUDENT_PROFILE_STORAGE_KEY);
    if (!raw) return migrateLegacyProfile(storage);
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return createEmptyProfile();
  }
}

/**
 * @param {import('./contracts.js').StudentProfile} profile
 * @param {Storage|null|undefined} storage
 */
export function saveProfile(profile, storage) {
  const next = {
    ...profile,
    updatedAt: new Date().toISOString(),
    profileVersion: STUDENT_PROFILE_VERSION,
  };
  if (storage) {
    storage.setItem(STUDENT_PROFILE_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

/**
 * Bootstrap from placement profile if V2 missing.
 * @param {Storage} storage
 */
function migrateLegacyProfile(storage) {
  const profile = createEmptyProfile();
  try {
    const placement = JSON.parse(
      storage.getItem("austriaPathPlacementProfile") || "null"
    );
    if (placement?.level) {
      profile.officialExamLevel = placement.level;
      profile.weakSkills = mergeUnique(profile.weakSkills, placement.focusAreas || placement.weaknesses || []);
      profile.recurringMistakes = placement.weaknesses || [];
    }
  } catch {
    /* ignore */
  }
  return profile;
}

/**
 * @param {import('./contracts.js').FinalReport} report
 * @returns {Object}
 */
function toReportSummary(report) {
  return {
    reportId: report.reportId,
    productType: report.productType,
    mode: report.mode,
    cefrLevel: report.cefrLevel,
    overallScore: report.overallScore,
    confidence: report.confidence,
    focusAreas: report.focusAreas || [],
    weaknesses: report.weaknesses || [],
    createdAt: report.createdAt,
  };
}

/**
 * @param {import('./contracts.js').StudentProfile} profile
 * @param {import('./contracts.js').FinalReport} report
 * @param {string[]} [usedModelIds]
 */
export function mergeExamReport(profile, report, usedModelIds = []) {
  const route = PROFILE_UPDATE_ROUTE[report.productType];
  if (route === "practice") {
    return mergePracticeReport(profile, report, usedModelIds);
  }

  const weaknesses = mergeUnique(profile.weakSkills, report.weaknesses || report.focusAreas);
  const recurringWeaknesses = detectRecurring(
    report.weaknesses || [],
    profile.examHistory
  );

  const examRecord = {
    reportId: report.reportId,
    productType: report.productType,
    date: report.createdAt || new Date().toISOString(),
    cefrLevel: report.cefrLevel,
    overallScore: report.overallScore,
    confidence: report.confidence,
    usedModelIds,
  };

  const next = {
    ...profile,
    weakSkills: weaknesses,
    recurringMistakes: mergeUnique(profile.recurringMistakes, recurringWeaknesses),
    recurringStrengths: mergeUnique(profile.recurringStrengths, report.strengths || []),
    readinessBand: report.readinessBand ?? profile.readinessBand,
    globalUsedModelIds: mergeUnique(profile.globalUsedModelIds, usedModelIds),
    examHistory: [examRecord, ...profile.examHistory].slice(0, MAX_EXAM_HISTORY),
    reportSummaries: [toReportSummary(report), ...profile.reportSummaries].slice(
      0,
      MAX_REPORT_SUMMARIES
    ),
    aiRecommendations: mergeUnique(
      profile.aiRecommendations,
      report.recommendations || report.studyAdvice || []
    ).slice(0, 15),
  };

  if (mayUpdateOfficialLevel(report.productType)) {
    next.officialExamLevel = report.cefrLevel || profile.officialExamLevel;
    if (report.skillResults) {
      next.officialSkillLevels = {
        ...profile.officialSkillLevels,
        ...Object.fromEntries(
          Object.entries(report.skillResults).map(([skill, data]) => [
            skill,
            data.level || profile.officialSkillLevels?.[skill],
          ])
        ),
      };
    }
  }

  return next;
}

/**
 * Practice only — NEVER updates officialExamLevel or officialSkillLevels.
 * @param {import('./contracts.js').StudentProfile} profile
 * @param {import('./contracts.js').FinalReport} report
 * @param {string[]} [usedModelIds]
 */
export function mergePracticeReport(profile, report, usedModelIds = []) {
  const focusSkills = report.weeklyFocusSkills || report.focusAreas || [];
  const duration = report.councilDecision?.durationMinutes || 20;

  const practiceRecord = {
    reportId: report.reportId,
    date: report.createdAt || new Date().toISOString(),
    focusSkills,
    durationMinutes: duration,
    practiceScore: report.overallScore ?? 0,
  };

  const skillCounts = { ...profile.practiceStats.skillPracticeCounts };
  focusSkills.forEach((skill) => {
    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
  });

  return {
    ...profile,
    weakSkills: mergeUnique(profile.weakSkills, report.weaknesses || report.focusAreas),
    recurringMistakes: mergeUnique(
      profile.recurringMistakes,
      detectRecurring(report.weaknesses || [], profile.practiceHistory)
    ),
    globalUsedModelIds: mergeUnique(profile.globalUsedModelIds, usedModelIds),
    practiceHistory: [practiceRecord, ...profile.practiceHistory].slice(
      0,
      MAX_PRACTICE_HISTORY
    ),
    practiceStats: {
      sessionsCompleted: (profile.practiceStats.sessionsCompleted || 0) + 1,
      minutesPracticed: (profile.practiceStats.minutesPracticed || 0) + duration,
      skillPracticeCounts: skillCounts,
    },
    reportSummaries: [toReportSummary(report), ...profile.reportSummaries].slice(
      0,
      MAX_REPORT_SUMMARIES
    ),
    aiRecommendations: mergeUnique(
      profile.aiRecommendations,
      report.recommendations || report.studyAdvice || []
    ).slice(0, 15),
    officialExamLevel: profile.officialExamLevel,
    officialSkillLevels: profile.officialSkillLevels,
  };
}

/**
 * @param {import('./contracts.js').StudentProfile} profile
 * @param {import('./contracts.js').FinalReport} report
 * @param {string[]} [usedModelIds]
 */
export function mergeReportIntoProfile(profile, report, usedModelIds = []) {
  const route = PROFILE_UPDATE_ROUTE[report.productType] || "exam";
  if (route === "practice") {
    return mergePracticeReport(profile, report, usedModelIds);
  }
  return mergeExamReport(profile, report, usedModelIds);
}

/**
 * @param {import('./contracts.js').StudentProfile} profile
 * @param {import('./subscriptionPolicy.js').SubscriptionRecord} [subscription]
 */
export function attachSubscriptionSnapshot(profile, subscription) {
  if (!subscription) return profile;
  return {
    ...profile,
    subscriptionSnapshot: {
      type: subscription.type,
      status: subscription.status,
      remainingExams: subscription.remainingExams,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    },
  };
}

/**
 * @param {import('./contracts.js').StudentProfile} profile
 * @param {import('./contracts.js').ProductType} productType
 * @param {number} examIndex
 * @param {number} examTotal
 */
export function setActivePackage(profile, productType, examIndex, examTotal) {
  return {
    ...profile,
    activePackage: {
      type: productType,
      examIndex,
      examTotal,
      usedModelIdsInPackage: profile.activePackage?.usedModelIdsInPackage || [],
      startedAt: profile.activePackage?.startedAt || new Date().toISOString(),
    },
  };
}

/**
 * @param {import('./contracts.js').StudentProfile} profile
 * @param {string[]} modelIds
 */
export function recordPackageModelUsage(profile, modelIds = []) {
  if (!profile.activePackage) {
    return {
      ...profile,
      globalUsedModelIds: mergeUnique(profile.globalUsedModelIds, modelIds),
    };
  }
  return {
    ...profile,
    globalUsedModelIds: mergeUnique(profile.globalUsedModelIds, modelIds),
    activePackage: {
      ...profile.activePackage,
      usedModelIdsInPackage: mergeUnique(
        profile.activePackage.usedModelIdsInPackage,
        modelIds
      ),
    },
  };
}

/** @param {import('./contracts.js').StudentProfile} profile @param {'global'|'package'|'session'} scope */
export function getUsedModelIds(profile, scope = "global") {
  if (scope === "package" && profile.activePackage) {
    return mergeUnique(
      profile.globalUsedModelIds,
      profile.activePackage.usedModelIdsInPackage
    );
  }
  if (scope === "session") {
    return [];
  }
  return [...(profile.globalUsedModelIds || [])];
}

export const studentProfileService = {
  loadProfile,
  saveProfile,
  createEmptyProfile,
  mergeExamReport,
  mergePracticeReport,
  mergeReportIntoProfile,
  attachSubscriptionSnapshot,
  setActivePackage,
  recordPackageModelUsage,
  getUsedModelIds,
};
