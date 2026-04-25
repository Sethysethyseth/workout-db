import { KNOWN_EXERCISES } from "../data/knownExercises.js";
import { exerciseNameSearchKey } from "./smartWorkoutName.js";

/**
 * @param {string} query
 * @param {number} [limit=5]
 * @returns {string[]}
 */
export function getExerciseSuggestions(query, limit = 5) {
  const q = exerciseNameSearchKey(String(query ?? "").trim());
  if (!q) return [];

  const starts = [];
  const includes = [];
  for (const name of KNOWN_EXERCISES) {
    const key = exerciseNameSearchKey(name);
    if (key.startsWith(q)) starts.push(name);
    else if (key.includes(q)) includes.push(name);
  }
  return [...starts, ...includes].slice(0, limit);
}
