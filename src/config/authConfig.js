export const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || "fadisobehau@gmail.com"
)
  .trim()
  .toLowerCase();

export function getAdminInitialPassword() {
  const value = import.meta.env.VITE_ADMIN_INITIAL_PASSWORD;
  return typeof value === "string" ? value.trim() : "";
}

export function canSeedAdminUser() {
  return getAdminInitialPassword().length > 0;
}
