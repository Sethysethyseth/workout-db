/**
 * Default display title for a logged workout when the user leaves the name blank.
 * Format: "Workout — Apr 14" (locale month + day, no year).
 * @param {Date | string | number | null | undefined} when
 * @returns {string}
 */
function defaultWorkoutSessionName(when) {
  const d = when instanceof Date ? when : new Date(when);
  const date = Number.isNaN(d.getTime()) ? new Date() : d;
  const monthDay = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `Workout — ${monthDay}`;
}

module.exports = {
  defaultWorkoutSessionName,
};
