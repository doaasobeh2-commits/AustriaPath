/**
 * In-memory backend cache — source of truth when VITE_USE_BACKEND=true.
 */

export const backendCache = {
  profile: null,
  reports: [],
  subscription: null,
  registry: null,
  registryMeta: null,
  labDashboard: null,
};

export function clearBackendCache() {
  backendCache.profile = null;
  backendCache.reports = [];
  backendCache.subscription = null;
  backendCache.registry = null;
  backendCache.registryMeta = null;
  backendCache.labDashboard = null;
}
