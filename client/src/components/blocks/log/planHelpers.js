/**
 * Pure helpers for block-plan logging (BK9).
 * Guard: call only when a SessionExercise carries a `plan`.
 */

/**
 * Matching plan set by 0-based order; extra sets inherit the last plan set.
 * @param {{ sets?: unknown[] } | null | undefined} plan
 * @param {number} index
 */
export function planSetAt(plan, index) {
  const sets = plan?.sets;
  if (!Array.isArray(sets) || sets.length === 0) return null;
  if (!Number.isInteger(index) || index < 0) return sets[0] ?? null;
  return sets[Math.min(index, sets.length - 1)] ?? null;
}

/**
 * Timed row when the matching plan set has durationSec.
 * @param {{ sets?: unknown[] } | null | undefined} plan
 * @param {number} index
 */
export function isTimedPlanSet(plan, index) {
  const ps = planSetAt(plan, index);
  return ps != null && ps.durationSec != null;
}

/**
 * True when every plan set is timed (extra "+ Add set" rows stay timed).
 * @param {{ sets?: unknown[] } | null | undefined} plan
 */
export function isTimedPlanExercise(plan) {
  const sets = plan?.sets;
  if (!Array.isArray(sets) || sets.length === 0) return false;
  return sets.every((s) => s != null && s.durationSec != null);
}

/**
 * Build formatRx input from a plan snapshot.
 * @param {object | null | undefined} plan
 * @param {string | null | undefined} unit
 */
export function planToRx(plan, unit) {
  if (!plan || !Array.isArray(plan.sets) || plan.sets.length === 0) return null;
  const first = plan.sets[0];
  let effortValue = null;
  if (plan.effort === "rpe") {
    const hit = plan.sets.find((s) => s != null && s.rpe != null);
    effortValue = hit != null ? hit.rpe : null;
  } else if (plan.effort === "rir") {
    // rir = 0 is a real value - use != null, never truthiness.
    const hit = plan.sets.find((s) => s != null && s.rir != null);
    effortValue = hit != null ? hit.rir : null;
  }
  const weight = first.weight != null ? first.weight : null;
  return {
    sets: plan.sets.length,
    reps: first.reps != null ? first.reps : null,
    repsMax: first.repsMax != null ? first.repsMax : null,
    durationSec: first.durationSec != null ? first.durationSec : null,
    weight,
    unit: weight != null && unit ? unit : null,
    effort: plan.effort ?? null,
    effortValue,
    effortCap: Boolean(plan.effortCap),
    restSec: plan.restSec != null ? plan.restSec : null,
  };
}

/**
 * Placeholder text for the reps field from a plan set.
 * @param {object | null | undefined} planSet
 */
export function repsPlaceholderFromPlan(planSet) {
  if (!planSet) return null;
  if (planSet.reps != null && planSet.repsMax != null && planSet.repsMax !== planSet.reps) {
    return `${planSet.reps}-${planSet.repsMax}`;
  }
  if (planSet.reps != null) return String(planSet.reps);
  return null;
}

/**
 * Placeholder text for the weight field from a plan set.
 * @param {object | null | undefined} planSet
 */
export function weightPlaceholderFromPlan(planSet) {
  if (!planSet || planSet.weight == null) return null;
  return String(planSet.weight);
}

/**
 * Placeholder for the seconds field.
 * @param {object | null | undefined} planSet
 */
export function durationPlaceholderFromPlan(planSet) {
  if (!planSet || planSet.durationSec == null) return null;
  return String(planSet.durationSec);
}

/**
 * Effort field placeholder from the matching plan set (display only - never auto-fill).
 * @param {object | null | undefined} plan
 * @param {object | null | undefined} planSet
 * @param {"rir" | "rpe"} signal
 */
export function effortPlaceholderFromPlan(plan, planSet, signal) {
  if (!planSet) return null;
  if (signal === "rir" && planSet.rir != null) return String(planSet.rir);
  if (signal === "rpe" && planSet.rpe != null) return String(planSet.rpe);
  return null;
}

/**
 * Logged effort beyond the plan cap (warn only - never blocked).
 * RPE above cap, or RIR below cap. rir = 0 is a real logged value.
 * @param {object | null | undefined} plan
 * @param {object | null | undefined} planSet
 * @param {unknown} loggedRpe
 * @param {unknown} loggedRir
 */
export function isOverEffortCap(plan, planSet, loggedRpe, loggedRir) {
  if (!plan || !plan.effortCap || !planSet) return false;
  const t = (v) => (v == null ? "" : String(v)).trim();
  if (plan.effort === "rpe") {
    if (planSet.rpe == null) return false;
    if (t(loggedRpe) === "") return false;
    const n = Number(loggedRpe);
    return Number.isFinite(n) && n > Number(planSet.rpe);
  }
  if (plan.effort === "rir") {
    // Cap and logged value: 0 is valid (blank-vs-truthiness).
    if (planSet.rir == null) return false;
    if (t(loggedRir) === "") return false;
    const n = Number(loggedRir);
    return Number.isFinite(n) && n < Number(planSet.rir);
  }
  return false;
}
