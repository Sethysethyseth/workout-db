import { KNOWN_EXERCISES } from "../data/knownExercises.js";

/**
 * @param {string} query
 * @param {number} [limit=5]
 * @returns {string[]}
 */
export function getExerciseSuggestions(query, limit = 5) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];

  const starts = [];
  const includes = [];
  for (const name of KNOWN_EXERCISES) {
    const lower = name.toLowerCase();
    if (lower.startsWith(q)) starts.push(name);
    else if (lower.includes(q)) includes.push(name);
  }
  return [...starts, ...includes].slice(0, limit);
}
