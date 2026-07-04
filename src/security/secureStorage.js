import { MAX_JSON_STORAGE_BYTES } from "./storageRegistry";
import {
  isBackendAuthoritativeKey,
  readBackendKey,
  shouldBlockBackendWrite,
  writeBackendKey,
} from "../api/hydrateBackend.js";

export function readJsonStorage(key, fallback = null) {
  if (isBackendAuthoritativeKey(key)) {
    return readBackendKey(key, fallback);
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    if (raw.length > MAX_JSON_STORAGE_BYTES) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key, value) {
  if (shouldBlockBackendWrite(key)) {
    return writeBackendKey(key, value);
  }
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > MAX_JSON_STORAGE_BYTES) {
      return false;
    }
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export function readStringStorage(key, fallback = "") {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    if (raw.length > MAX_JSON_STORAGE_BYTES) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

export function removeStorageKeys(keys = []) {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore quota / privacy errors
    }
  });
}
