/**
 * B1 Weekly Training is gated until backend routes are deployed.
 */
export function isB1WeeklyTrainingEnabled() {
  return import.meta.env.VITE_B1_WEEKLY_TRAINING_ENABLED === 'true';
}
