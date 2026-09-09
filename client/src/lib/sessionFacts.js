import { formatWeight } from "./weightDisplay.js";

/**
 * Small, list-safe facts about a session computed from the slim `sets`
 * the list endpoint returns (weight + reps only). Shared by History rows
 * and Home's recent list so both read the same numbers.
 */
export function sessionDurationLabel(session) {
  const start = new Date(session?.startedAt || session?.performedAt || 0).getTime();
  const end = new Date(session?.completedAt || 0).getTime();
  if (!start || !end || end <= start) return null;
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function sessionTonnage(session) {
  const sets = Array.isArray(session?.sets) ? session.sets : [];
  let total = 0;
  for (const s of sets) {
    if (s?.weight != null && s?.reps != null) total += Number(s.weight) * Number(s.reps);
  }
  return total;
}

export function formatTonnage(total, unit) {
  if (!total) return null;
  if (total >= 10000) return `${(total / 1000).toFixed(1)}k ${unit || "lbs"}`;
  return formatWeight(Math.round(total), unit);
}

export function sessionTopSet(session) {
  const sets = Array.isArray(session?.sets) ? session.sets : [];
  let best = null;
  for (const s of sets) {
    if (s?.weight == null) continue;
    if (
      !best ||
      Number(s.weight) > best.weight ||
      (Number(s.weight) === best.weight && (s.reps ?? 0) > (best.reps ?? 0))
    ) {
      best = { weight: Number(s.weight), reps: s.reps ?? null };
    }
  }
  return best;
}
