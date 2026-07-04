import { readJsonStorage, writeJsonStorage } from "../security/secureStorage";
import { LEGAL_VERSIONS } from "./legalVersions";

export const LEGAL_CONSENT_KEY = "austriaPathLegalConsent";

export function getLegalConsent() {
  const record = readJsonStorage(LEGAL_CONSENT_KEY, null);
  if (!record || typeof record !== "object") return null;

  return {
    acceptedAt: record.acceptedAt || null,
    privacyVersion: record.privacyVersion || null,
    termsVersion: record.termsVersion || null,
  };
}

export function needsLegalConsent() {
  const record = getLegalConsent();
  if (!record?.acceptedAt) return true;

  return (
    record.privacyVersion !== LEGAL_VERSIONS.privacy ||
    record.termsVersion !== LEGAL_VERSIONS.terms
  );
}

export function saveLegalConsent() {
  writeJsonStorage(LEGAL_CONSENT_KEY, {
    acceptedAt: new Date().toISOString(),
    privacyVersion: LEGAL_VERSIONS.privacy,
    termsVersion: LEGAL_VERSIONS.terms,
  });
}
