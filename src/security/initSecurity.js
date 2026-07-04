import { validateClientEnvironment } from "./envValidation";
import { isAdminPreviewAllowed } from "./routeGuard";
import { removeStorageKeys } from "./secureStorage";
import { resolveSessionUser } from "../app/userAccess";

export function initFrontendSecurity() {
  validateClientEnvironment();

  if (typeof window === "undefined") return;

  const resolved = resolveSessionUser();

  if (!isAdminPreviewAllowed(resolved)) {
    removeStorageKeys(["isAdminPreview"]);
  }
}
