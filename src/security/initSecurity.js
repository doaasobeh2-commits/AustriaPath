import { validateClientEnvironment } from "./envValidation.js";
import { isAdminPreviewAllowed } from "./routeGuard.js";
import { removeStorageKeys } from "./secureStorage.js";
import { resolveSessionUser } from "../app/userAccess.js";

export function initFrontendSecurity() {
  validateClientEnvironment();

  if (typeof window === "undefined") return;

  const resolved = resolveSessionUser();

  if (!isAdminPreviewAllowed(resolved)) {
    removeStorageKeys(["isAdminPreview"]);
  }
}
