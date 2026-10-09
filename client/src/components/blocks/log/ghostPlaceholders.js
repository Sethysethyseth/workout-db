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
/**
 * Block day: plan weight wins. When the plan has no weight, use last time's
 * weight for this row only. Reps and seconds stay the plan's. Effort is
 * not merged here (it must never be filled in); the placeholder is
 * `effortPlaceholderWithLastTime`.
 *
 * @param {object | null | undefined} planSet
 * @param {object | null | undefined} lastSet
 */
export function planSetWithLastTimeWeight(planSet, lastSet) {
  if (lastSet == null || lastSet.weight == null || String(lastSet.weight).trim() === "") {
    return planSet ?? null;
  }
  const planned = planSet?.weight;
  if (planned != null && String(planned).trim() !== "") return planSet ?? null;
  if (!planSet) return { weight: lastSet.weight };
  return { ...planSet, weight: lastSet.weight };
}

/**
 * Effort placeholder for a block-day row. The plan target wins, including
 * its cap glyph. When the plan set has none for this signal, last time's
 * effort shows as a plain number (never "≤" / "≥"). No RIR/RPE conversion.
 *
 * @param {object | null | undefined} plan
 * @param {object | null | undefined} planSet
 * @param {object | null | undefined} lastSet
 * @param {"rir" | "rpe"} signal
 */
export function effortPlaceholderWithLastTime(plan, planSet, lastSet, signal) {
  const fromPlan = effortGhostFromPlan(plan, planSet, signal);
  if (fromPlan !== "—") return fromPlan;
  if (signal !== "rir" && signal !== "rpe") return "—";
  const raw = lastSet?.[signal];
  if (raw == null || String(raw).trim() === "") return "—";
  return String(raw);
}

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
