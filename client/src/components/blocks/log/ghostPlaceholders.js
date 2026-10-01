import {
  durationPlaceholderFromPlan,
  repsPlaceholderFromPlan,
  weightPlaceholderFromPlan,
} from "./planHelpers.js";
import { normalizeRxUnit } from "../ui/rxFormat.js";

/**
 * Effort ghost for the block logger grid.
 * Capped: "≤8" / "≥2" (no spaces - matches recovery-logbook look).
 * Uncapped target: bare number. Missing: "—".
 *
 * @param {object | null | undefined} plan
 * @param {object | null | undefined} planSet
 * @param {"rir" | "rpe"} signal
 */
export function effortGhostFromPlan(plan, planSet, signal) {
  if (!planSet) return "—";
  if (signal === "rir" && planSet.rir != null) {
    const n = String(planSet.rir);
    return plan?.effortCap ? `≥${n}` : n;
  }
  if (signal === "rpe" && planSet.rpe != null) {
    const n = String(planSet.rpe);
    return plan?.effortCap ? `≤${n}` : n;
  }
  return "—";
}

/**
 * Weight ghost: planned load, or the unit hint when none is planned.
 *
 * @param {object | null | undefined} planSet
 * @param {string | null | undefined} unit
 */
export function weightGhostFromPlan(planSet, unit) {
  if (!planSet) {
    const u = normalizeRxUnit(unit);
    return u || "";
  }
  const w = weightPlaceholderFromPlan(planSet);
  if (w !== "" && w != null) return w;
  const u = normalizeRxUnit(unit);
  return u || "";
}

/**
 * Reps or seconds ghost from the matching plan set.
 *
 * @param {object | null | undefined} planSet
 * @param {boolean} timedMode
 */
export function doseGhostFromPlan(planSet, timedMode) {
  if (timedMode) return durationPlaceholderFromPlan(planSet) ?? "";
  return repsPlaceholderFromPlan(planSet) ?? "";
}

/**
 * Fill typed empty fields from the plan EXCEPT effort (never auto-filled).
 *
 * @param {object} draft
 * @param {object | null | undefined} planSet
 * @param {boolean} timedMode
 */
export function fillDraftFromPlanExceptEffort(draft, planSet, timedMode) {
  const next = { ...draft };
  if (!planSet) return next;
  if (timedMode) {
    if (String(next.durationSec ?? "").trim() === "" && planSet.durationSec != null) {
      next.durationSec = String(planSet.durationSec);
    }
  } else if (String(next.reps ?? "").trim() === "" && planSet.reps != null) {
    next.reps = String(planSet.reps);
  }
  if (String(next.weight ?? "").trim() === "" && planSet.weight != null) {
    next.weight = String(planSet.weight);
  }
  return next;
}
