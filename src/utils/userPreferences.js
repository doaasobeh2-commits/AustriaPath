/**
 * Resolves duplicated localStorage preference keys without UI changes.
 */
import { ONBOARDING_COMPLETE_KEY } from "../constants/storageKeys.js";

export function isOnboardingComplete() {
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
}

export function resetOnboardingCompletion() {
  localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}

export function getUserLanguage() {
  return (
    localStorage.getItem("austriaPathLanguage") ||
    localStorage.getItem("userLanguage") ||
    "Deutsch"
  );
}

export function getUserLevel() {
  return (
    localStorage.getItem("userLevel") ||
    localStorage.getItem("austriaPathUserLevel") ||
    localStorage.getItem("currentLevel") ||
    "B1"
  );
}

export function persistUserPreferences({ name, email, level, language }) {
  if (name != null) {
    localStorage.setItem("userName", name);
  }

  if (email != null) {
    localStorage.setItem("userEmail", email);
  }

  if (level != null) {
    localStorage.setItem("userLevel", level);
    localStorage.setItem("austriaPathUserLevel", level);
  }

  if (language != null) {
    localStorage.setItem("userLanguage", language);
    localStorage.setItem("austriaPathLanguage", language);
  }
}

export function setUserLevel(level) {
  persistUserPreferences({ level });
}

export function setUserLanguage(language) {
  persistUserPreferences({ language });
}
