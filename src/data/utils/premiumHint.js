const PREMIUM_HINT_VISITS_REQUIRED = 3;
const PREMIUM_HINT_COOLDOWN_DAYS = 3;

const PREMIUM_HINT_COOLDOWN_MS =
  PREMIUM_HINT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export function isPremiumUser() {
  return (
    localStorage.getItem('isPremiumUser') === 'true' ||
    localStorage.getItem('placementPaid') === 'true' ||
    Boolean(localStorage.getItem('premiumPlan'))
  );
}

export function shouldShowPremiumHint(section) {
  const lastShownKey = `${section}PremiumLastShown`;
  const lastShown = Number(localStorage.getItem(lastShownKey) || 0);
  const now = Date.now();

  return !lastShown || now - lastShown >= PREMIUM_HINT_COOLDOWN_MS;
}

export function markPremiumHintShown(section) {
  localStorage.setItem(`${section}PremiumLastShown`, String(Date.now()));
}

export function trackSectionVisit(section) {
  if (isPremiumUser()) {
    return false;
  }

  const visitKey = `${section}PremiumVisitCount`;
  const currentCount = Number(localStorage.getItem(visitKey) || 0) + 1;

  localStorage.setItem(visitKey, String(currentCount));

  if (
    currentCount >= PREMIUM_HINT_VISITS_REQUIRED &&
    shouldShowPremiumHint(section)
  ) {
    markPremiumHintShown(section);
    localStorage.setItem(visitKey, '0');
    return true;
  }

  return false;
}

export function resetPremiumHint(section) {
  localStorage.removeItem(`${section}PremiumVisitCount`);
  localStorage.removeItem(`${section}PremiumLastShown`);
}