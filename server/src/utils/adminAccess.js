/**
 * Server-side admin identity check (access/credit bypass only).
 */

import { env } from "../config/env.js";

export function isAdminUser(user) {
  if (!user) return false;
  const email = String(user.email || "")
    .trim()
    .toLowerCase();
  return (
    user.role === "admin" &&
    email === String(env.adminEmail || "")
      .trim()
      .toLowerCase()
  );
}
