/**
 * Persist which planned set slots the lifter hid on this device.
 * Keyed by session id + session exercise id (+ side when per-side).
 * Every access is try/catch - storage failures must never break the page.
 */

function storageKey(sessionId, sessionExerciseId, side) {
  const base = `bk-log-hidden-planned:${sessionId}:${sessionExerciseId}`;
  if (side === "L" || side === "R") return `${base}:${side}`;
  return base;
}

/**
 * @param {number|string} sessionId
 * @param {number|string} sessionExerciseId
 * @param {"L"|"R"|null|undefined} [side]
 * @returns {number[]} 0-based plan indices
 */
export function loadHiddenPlannedIndices(sessionId, sessionExerciseId, side) {
  try {
    const raw = localStorage.getItem(storageKey(sessionId, sessionExerciseId, side));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n >= 0);
  } catch {
    return [];
  }
}

/**
 * @param {number|string} sessionId
 * @param {number|string} sessionExerciseId
 * @param {number[]} indices
 * @param {"L"|"R"|null|undefined} [side]
 */
export function saveHiddenPlannedIndices(sessionId, sessionExerciseId, indices, side) {
  try {
    const clean = [...new Set(
      (Array.isArray(indices) ? indices : [])
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n >= 0)
    )].sort((a, b) => a - b);
    const key = storageKey(sessionId, sessionExerciseId, side);
    if (clean.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(clean));
  } catch {
    // Page must still work if storage throws.
  }
}
