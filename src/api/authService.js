/**
 * Auth API service — Phase H.
 */

import { apiFetch } from "./httpClient.js";

export async function registerViaApi({ name, email, password, level }) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    json: { name, email, password, level },
  });
  return data.user;
}

export async function loginViaApi(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    json: { email, password },
  });
  return data.user;
}

export async function logoutViaApi() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function fetchMe() {
  const data = await apiFetch("/auth/me");
  return data.user;
}

/** Returns null when no session (401) — does not throw for unauthenticated users. */
export async function fetchMeOptional() {
  const data = await apiFetch("/auth/me", { allowStatuses: [401, 403] });
  return data?.user ?? null;
}
