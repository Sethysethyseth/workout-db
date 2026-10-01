import { isBlankSessionExerciseName } from "../../../lib/sessionExerciseName.js";

/**
 * Name heuristics for unilateral logging (One-Arm, Single-Leg, etc.).
 * Shared by the live session editor and the block-day logger.
 */
export function exerciseNameImpliesPerSide(name) {
  const n = String(name ?? "").trim();
  if (!n || isBlankSessionExerciseName(n)) return false;
  // Catalog false positive: "Chest Push (single response)" is bilateral.
  if (/\bsingle\s+response\b/i.test(n)) return false;
  if (/\bunilateral\b/i.test(n)) return true;
  if (/\bone[\s-]*arm\b/i.test(n)) return true;
  if (/\bone[\s-]*leg/i.test(n)) return true;
  if (/\bsingle[\s-]+(arm|leg|dumbbell)\b/i.test(n)) return true;
  return false;
}

export function anySetHasSide(sets) {
  return Array.isArray(sets) && sets.some((s) => s.side === "L" || s.side === "R");
}

/**
 * Resolve whether an exercise logs left/right separately.
 * Manual override wins; otherwise existing L/R sets or the name heuristic.
 */
export function derivePerSideMode(manualOverride, exerciseName, sets) {
  if (manualOverride === true) return true;
  if (manualOverride === false) return false;
  return anySetHasSide(sets) || exerciseNameImpliesPerSide(exerciseName);
}
