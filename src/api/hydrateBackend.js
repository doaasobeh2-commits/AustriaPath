/**
 * Bridges secureStorage to backend cache when VITE_USE_BACKEND=true.
 */

import { useBackend } from "./useBackend.js";
import { backendCache } from "./backendCache.js";
import {
  fetchStudentProfile,
  fetchSubscription,
  listReports,
  fetchRuleRegistryMeta,
  fetchLabDashboard,
} from "./repositories/index.js";
import { RULE_REGISTRY_STORAGE_KEY } from "../exam-platform/ruleRegistrySchema.js";

const BACKEND_READ_KEYS = new Set([
  "austriaPathAIReports",
  "austriaPathSubscription",
  "austriaPathStudentProfileV2",
  "austriaPathRuleRegistry",
  "austriaPathPlacementProfile",
]);

const BACKEND_WRITE_BLOCK = new Set([
  "austriaPathUsers",
  "austriaPathAIReports",
  "austriaPathSubscription",
  "austriaPathStudentProfileV2",
  "austriaPathRuleRegistry",
  "austriaPathExaminerLabQueue",
]);

export function readBackendKey(key, fallback = null) {
  if (key === "austriaPathAIReports") return backendCache.reports ?? fallback;
  if (key === "austriaPathSubscription") return backendCache.subscription ?? fallback;
  if (key === "austriaPathStudentProfileV2") return backendCache.profile ?? fallback;
  if (key === "austriaPathRuleRegistry") return backendCache.registry ?? fallback;
  if (key === "austriaPathPlacementProfile") {
    const profile = backendCache.profile;
    if (!profile) return fallback;
    return {
      level: profile.officialExamLevel,
      focusAreas: profile.weakSkills,
      weaknesses: profile.weakSkills,
      date: profile.updatedAt,
    };
  }
  return fallback;
}

export function writeBackendKey(key, value) {
  if (key === "austriaPathAIReports" && Array.isArray(value)) {
    backendCache.reports = value;
    return true;
  }
  if (key === "austriaPathStudentProfileV2" && value) {
    backendCache.profile = value;
    return true;
  }
  if (BACKEND_WRITE_BLOCK.has(key)) {
    return true;
  }
  return false;
}

export function isBackendAuthoritativeKey(key) {
  return useBackend() && BACKEND_READ_KEYS.has(key);
}

export function shouldBlockBackendWrite(key) {
  return useBackend() && BACKEND_WRITE_BLOCK.has(key);
}

let hydrationPromise = null;

/**
 * @param {{ includeAdmin?: boolean }} [options]
 * Admin-only endpoints are skipped unless includeAdmin is true.
 */
export async function hydrateBackendFromApi(options = {}) {
  if (!useBackend()) return;
  const { includeAdmin = false } = options;

  const [profileRes, subRes, reportsRes, registryMeta] = await Promise.all([
    fetchStudentProfile().catch(() => ({ profile: null })),
    fetchSubscription().catch(() => ({ subscription: null })),
    listReports().catch(() => ({ items: [] })),
    fetchRuleRegistryMeta().catch(() => null),
  ]);

  backendCache.profile = profileRes.profile || null;
  backendCache.subscription = subRes.subscription || null;
  backendCache.reports = (reportsRes.items || []).map((r) => ({
    title: r.summary?.slice(0, 80) || `${r.productType} · ${r.cefrLevel}`,
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("de-DE") : "",
    finishedAt: r.createdAt,
    sessionType: r.productType,
    type: r.productType,
    level: r.cefrLevel,
    summary: r.summary,
    strengths: r.strengths || [],
    weaknesses: r.weaknesses || [],
    platformReportId: r.reportId,
  }));
  backendCache.registryMeta = registryMeta;

  if (registryMeta?.registryVersion) {
    backendCache.registry = {
      meta: {
        registryVersion: registryMeta.registryVersion,
        schemaVersion: registryMeta.schemaVersion || "1.0.0",
        updatedAt: registryMeta.updatedAt || new Date().toISOString(),
      },
      globalPrinciples: [],
      criticalRules: [],
      levels: {},
      promotedRules: [],
    };
  }

  if (includeAdmin) {
    try {
      backendCache.labDashboard = await fetchLabDashboard();
    } catch {
      backendCache.labDashboard = null;
    }
  } else {
    backendCache.labDashboard = null;
  }
}

/**
 * Load dashboard cache after login without blocking navigation.
 * Deduplicates concurrent hydration calls.
 * @param {{ includeAdmin?: boolean }} [options]
 */
export function scheduleBackendHydration(options = {}) {
  if (!useBackend()) return Promise.resolve();
  if (!hydrationPromise) {
    hydrationPromise = hydrateBackendFromApi(options).finally(() => {
      hydrationPromise = null;
    });
  }
  return hydrationPromise;
}

export { RULE_REGISTRY_STORAGE_KEY };
