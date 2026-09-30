/**
 * Pluralize a count for the import preview stats line / chips / toast.
 * @param {number} n
 * @param {string} singular
 * @param {string} plural
 */
function unit(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
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
      unit(weeks, "WEEK", "WEEKS"),
      unit(days, "DAY", "DAYS"),
      unit(exercises, "EXERCISE", "EXERCISES"),
      unit(sets, "SET", "SETS"),
    ].join(" · "),
    timedSets: unit(timed, "TIMED SET", "TIMED SETS"),
  };
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
