/**
 * Backend API route constants for future integration.
 * Base path is configured when backend ships — do not call these URLs until live.
 */
export const API_BASE = import.meta.env.VITE_API_BASE || "/v1";

export const API_ENDPOINTS = Object.freeze({
  auth: {
    register: `${API_BASE}/auth/register`,
    login: `${API_BASE}/auth/login`,
    logout: `${API_BASE}/auth/logout`,
    me: `${API_BASE}/auth/me`,
    forgotPassword: `${API_BASE}/auth/forgot-password`,
    resetPassword: `${API_BASE}/auth/reset-password`,
  },
  users: {
    me: `${API_BASE}/users/me`,
    export: `${API_BASE}/users/me/export`,
    legalConsent: `${API_BASE}/users/me/legal-consent`,
  },
  subscription: {
    current: `${API_BASE}/subscription`,
    checkout: `${API_BASE}/subscription/checkout`,
    consumeExam: `${API_BASE}/subscription/consume-exam`,
  },
  ai: {
    completions: `${API_BASE}/ai/completions`,
    usage: `${API_BASE}/ai/usage`,
  },
  reports: {
    list: `${API_BASE}/reports`,
    detail: (id) => `${API_BASE}/reports/${id}`,
  },
  admin: {
    users: `${API_BASE}/admin/users`,
    content: `${API_BASE}/admin/content`,
    examinerLab: `${API_BASE}/admin/examiner-lab/samples`,
    aiPruefer: `${API_BASE}/admin/ai-pruefer`,
  },
});

/** Interim serverless proxy — replace with API_ENDPOINTS.ai.completions */
export const OPENAI_PROXY_PATH = "/api/ai/openai";
