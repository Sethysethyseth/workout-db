/**
 * Pluralize a count for the import preview stats line / chips / toast.
 * @param {number} n
 * @param {string} singular
 * @param {string} plural
 */
export function pluralize(n, singular, plural) {
  const count = Number(n) || 0;
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Format import preview stats into the display line and timed-sets chip text.
 * @param {{ weeks?: number, days?: number, exercises?: number, sets?: number, timedSets?: number }} stats
 * @returns {{ line: string, timedSets: string }}
 */
export function formatImportStats(stats) {
  const weeks = Number(stats?.weeks) || 0;
  const days = Number(stats?.days) || 0;
  const exercises = Number(stats?.exercises) || 0;
  const sets = Number(stats?.sets) || 0;
  const timed = Number(stats?.timedSets) || 0;
  return {
    line: [
      pluralize(weeks, "WEEK", "WEEKS"),
      pluralize(days, "DAY", "DAYS"),
      pluralize(exercises, "EXERCISE", "EXERCISES"),
      pluralize(sets, "SET", "SETS"),
    ].join(" · "),
    timedSets: pluralize(timed, "TIMED SET", "TIMED SETS"),
  };
}

/**
 * Compact stats for the AI-read comparison line (lowercase units).
 * @param {{ weeks?: number, days?: number, sets?: number }} stats
 * @returns {string}
 */
export function formatAiReadCompareStats(stats) {
  const weeks = Number(stats?.weeks) || 0;
  const days = Number(stats?.days) || 0;
  const sets = Number(stats?.sets) || 0;
  return [
    pluralize(weeks, "week", "weeks"),
    pluralize(days, "day", "days"),
    pluralize(sets, "set", "sets"),
  ].join(" · ");
}

/**
 * Toast passed to the builder after a successful import.
 * @param {number} weeks
 * @returns {string}
 */
export function formatImportToast(weeks) {
  const n = Number(weeks) || 0;
  return n === 1 ? "Imported 1 week" : `Imported ${n} weeks`;
}
