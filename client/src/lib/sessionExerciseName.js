/**
 * Server requires non-empty exerciseName. This invisible character is stored while the
 * quick-log UI shows an empty field until the user types a real name.
 */
export const BLANK_SESSION_EXERCISE_NAME = "\u2060";

export function isBlankSessionExerciseName(name) {
  return name === BLANK_SESSION_EXERCISE_NAME;
}

/** Value for controlled exercise name inputs (empty when still “unset”). */
export function sessionExerciseNameForInput(name) {
  if (name == null || name === "") return "";
  return isBlankSessionExerciseName(name) ? "" : String(name);
}

/** What to send to the API from the input (blank input keeps the placeholder). */
export function inputToSessionExerciseName(raw) {
  const t = String(raw ?? "").trim();
  return t.length > 0 ? t : BLANK_SESSION_EXERCISE_NAME;
}
