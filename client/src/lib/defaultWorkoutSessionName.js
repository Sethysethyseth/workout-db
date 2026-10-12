/**
 * Default display title for a logged workout when the user leaves the name blank.
 * Format: "Workout, Apr 14" (locale month + day, no year). No em dash.
 * @param {Date | string | number | null | undefined} when
 * @returns {string}
 */
export function defaultWorkoutSessionName(when) {
  const d = when instanceof Date ? when : new Date(when);
  const date = Number.isNaN(d.getTime()) ? new Date() : d;
  const monthDay = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `Workout, ${monthDay}`;
}

/** Stored auto-names written on finish still contain an em dash. Display only. */
const STORED_AUTO_NAME = /^Workout\s*—\s*/;

export function displayWorkoutAutoName(name) {
  if (typeof name !== "string" || !STORED_AUTO_NAME.test(name)) return name;
  return name.replace(STORED_AUTO_NAME, "Workout, ");
}
