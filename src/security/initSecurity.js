import { validateClientEnvironment } from "./envValidation.js";
import { isAdminPreviewAllowed } from "./routeGuard.js";
import { removeStorageKeys } from "./secureStorage.js";
import {
  purgeLegacyAuthStorage,
  resolveSessionUser,
} from "../app/userAccess.js";

export function initFrontendSecurity() {
  validateClientEnvironment();

  if (typeof window === "undefined") return;

  purgeLegacyAuthStorage();

  const resolved = resolveSessionUser();

  if (!isAdminPreviewAllowed(resolved)) {
    removeStorageKeys(["isAdminPreview"]);
  }
}
