/**
 * Client-side environment checks.
 * VITE_* variables are always exposed in the browser bundle.
 */

export function validateClientEnvironment() {
  const warnings = [];

  if (import.meta.env.PROD && import.meta.env.VITE_ADMIN_INITIAL_PASSWORD) {
    warnings.push(
      "VITE_ADMIN_INITIAL_PASSWORD is embedded in the production JS bundle. Move admin seeding to the backend before launch."
    );
  }

  if (!import.meta.env.VITE_ADMIN_EMAIL) {
    warnings.push(
      "VITE_ADMIN_EMAIL is not set; the app falls back to a hardcoded default admin email."
    );
  }

  if (import.meta.env.DEV) {
    warnings.forEach((message) => {
      console.warn(`[AustriaPath Security] ${message}`);
    });
  }

  return warnings;
}
