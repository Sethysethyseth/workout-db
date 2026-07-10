import { loadWeightUnit } from "./weightUnitPref.js";

/** Nearest loadable plate increment for lbs (N5 rep targets consume this). */
export const PLATE_INCREMENT_LBS = 2.5;
/** Nearest loadable plate increment for kg (N5 rep targets consume this). */
export const PLATE_INCREMENT_KG = 1.25;

/**
 * Display-only weight formatting. Never converts values — same doctrine as
 * weightUnitPref.js (stored numbers are unit-agnostic; the label is the
 * user's logging unit).
 *
 * Strips a trailing `.0` but keeps meaningful halves:
 * `225 -> "225 lbs"`, `102.5 -> "102.5 lbs"`.
 *
 * @param {number} n
 * @param {"lbs" | "kg"} [unit]
 */
export function formatWeight(n, unit = loadWeightUnit()) {
  const s = Number(n).toFixed(1);
  const num = s.endsWith(".0") ? s.slice(0, -2) : s;
  return `${num} ${unit}`;
}

/**
 * Estimate precision: round to a whole unit FIRST, then format.
 * Every displayed e1RM goes through this (`287.34 -> "287 lbs"`).
 *
 * @param {number} n
 * @param {"lbs" | "kg"} [unit]
 */
export function formatEstimate(n, unit = loadWeightUnit()) {
  return formatWeight(Math.round(Number(n)), unit);
}

/**
 * Round to the nearest loadable plate increment for the given unit.
 *
 * @param {number} n
 * @param {"lbs" | "kg"} unit
 * @returns {number}
 */
export function roundToPlate(n, unit) {
  const increment = unit === "kg" ? PLATE_INCREMENT_KG : PLATE_INCREMENT_LBS;
  return Math.round(Number(n) / increment) * increment;
}
