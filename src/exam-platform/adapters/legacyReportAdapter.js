/**
 * Maps platform FinalReport to legacy austriaPathAIReports shape.
 * @module exam-platform/adapters/legacyReportAdapter
 */

import { useBackend } from "../../api/useBackend.js";
import { backendCache } from "../../api/backendCache.js";

/**
 * @param {import('../contracts.js').FinalReport} report
 * @param {Object} [legacyMeta]
 */
export function finalReportToLegacyShape(report, legacyMeta = {}) {
  const strengths = report.strengths || [];
  const weaknesses = report.weaknesses || [];
  const score = report.overallScore ?? 0;

  return {
    title: legacyMeta.title || report.summary?.slice(0, 80) || "AustriaPath Bericht",
    date: new Date(report.createdAt || Date.now()).toLocaleDateString("de-DE"),
    finishedAt: report.createdAt,
    sessionType: report.productType,
    mode: report.mode,
    level: report.cefrLevel,
    type: legacyMeta.type || report.productType,
    packageType: legacyMeta.packageType || report.productType,
    examNumber: legacyMeta.examNumber,
    total: legacyMeta.total,
    strongCount: strengths.length,
    middleCount: score >= 55 && score < 75 ? 1 : 0,
    weakCount: weaknesses.length,
    strengths,
    weaknesses,
    focusAreas: report.focusAreas || weaknesses,
    summary: report.summary,
    recommendations: report.recommendations,
    studyAdvice: report.studyAdvice,
    nextRecommendation: report.recommendations?.[0] || "",
    partsCount: legacyMeta.partsCount,
    results: legacyMeta.results,
    platformReportId: report.reportId,
    platformBlueprintId: report.blueprintId,
    cefrLevel: report.cefrLevel,
    overallScore: report.overallScore,
    confidence: report.confidence,
    skillResults: report.skillResults,
    councilDecision: report.councilDecision,
    disclaimer: report.disclaimer,
  };
}

/**
 * @param {import('../contracts.js').FinalReport} report
 * @param {Object} [legacyMeta]
 * @param {Storage|null|undefined} [storage]
 */
export function persistLegacyReport(report, legacyMeta = {}, storage = localStorage) {
  const legacy = finalReportToLegacyShape(report, legacyMeta);

  if (useBackend()) {
    backendCache.reports = [legacy, ...(backendCache.reports || [])];
    return legacy;
  }

  try {
    const oldReports = JSON.parse(storage.getItem("austriaPathAIReports") || "[]");
    storage.setItem("austriaPathAIReports", JSON.stringify([legacy, ...oldReports]));
  } catch {
    storage.setItem("austriaPathAIReports", JSON.stringify([legacy]));
  }

  storage.setItem("austriaPathLastAIReport", JSON.stringify(legacy));
  storage.setItem("austriaPathLastWeaknesses", JSON.stringify(legacy.focusAreas || []));
  storage.setItem("austriaPathLastStrengths", JSON.stringify(legacy.strengths || []));

  return legacy;
}

/**
 * @param {import('../contracts.js').StudentProfile} profile
 * @param {Storage|null|undefined} [storage]
 */
export function syncLegacyPlacementProfile(profile, storage = localStorage) {
  storage.setItem(
    "austriaPathPlacementProfile",
    JSON.stringify({
      level: profile.officialExamLevel,
      focusAreas: profile.weakSkills,
      weaknesses: profile.weakSkills,
      date: profile.updatedAt,
    })
  );
}

export const legacyReportAdapter = {
  finalReportToLegacyShape,
  persistLegacyReport,
  syncLegacyPlacementProfile,
};
