const { normalizeExerciseName } = require("../analytics/normalize");

/**
 * Name-only rows (both foreign keys null) whose normalized exerciseName
 * equals the custom exercise's previous normalizedName. Plural folding is
 * intentionally not applied: "squats" is a different name from "squat".
 *
 * @param {Array<{ id: number, exerciseName: string }>} rows
 * @param {string} oldNormalized
 * @returns {Array<{ id: number, exerciseName: string }>}
 */
function selectRowsToAdopt(rows, oldNormalized) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (typeof oldNormalized !== "string" || !oldNormalized) return [];
  return rows.filter(
    (row) => normalizeExerciseName(row && row.exerciseName) === oldNormalized
  );
}

module.exports = { selectRowsToAdopt };
