/**
 * HTTP client — Gate 0 envelope parser.
 */

import { buildApiUrl } from "./apiConfig.js";

export class ApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} status
   * @param {object} [details]
   */
  constructor(code, message, status, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * @param {string} path
 * @param {RequestInit & { json?: unknown; allowStatuses?: number[] }} [options]
 */
export async function apiFetch(path, options = {}) {
  const url = buildApiUrl(path);
  const allowStatuses = new Set(options.allowStatuses || []);
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  let body = options.body;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  const { allowStatuses: _allow, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body,
    credentials: "include",
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!payload?.success) {
    const err = payload?.error || {};
    const code = err.code || "INTERNAL_ERROR";
    const status = response.status;
    if (allowStatuses.has(status)) {
      return null;
    }
    throw new ApiError(
      code,
      err.message || "Ein Fehler ist aufgetreten.",
      status,
      err.details
    );
  }

  return payload.data;
}
