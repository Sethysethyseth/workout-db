/**
 * Muscle summary for a custom exercise row, mirroring the Main/Assists
 * vocabulary of the AddExerciseToLibrarySheet curate step.
 */
export function summarizeCustomExerciseMuscles(muscles) {
  const main = [];
  const assists = [];
  if (muscles && typeof muscles === "object" && !Array.isArray(muscles)) {
    for (const [muscle, designation] of Object.entries(muscles)) {
      if (designation === "primary") main.push(muscle);
      else if (designation === "secondary") assists.push(muscle);
    }
  }
  const parts = [];
  if (main.length > 0) parts.push(`Main: ${main.join(", ")}`);
  if (assists.length > 0) parts.push(`Assists: ${assists.join(", ")}`);
  return parts.join(" · ");
}

/** Compact meta from list-payload fields only - no extra fetches. */
export function blockMetaLine(t) {
  if (!t) return "";
  const weeks = Array.isArray(t.weeks) ? t.weeks : [];
  const duration = t.durationWeeks != null ? Number(t.durationWeeks) : NaN;
  const weekCount = Number.isFinite(duration) && duration > 0 ? duration : weeks.length;

  let daysPerWeek = null;
  if (weeks.length > 0) {
    const totalDays = weeks.reduce(
      (acc, wk) => acc + (Array.isArray(wk.workouts) ? wk.workouts.length : 0),
      0
    );
    daysPerWeek = Math.round(totalDays / weeks.length);
  }

  const parts = [];
  if (weekCount > 0) parts.push(`${weekCount} week${weekCount === 1 ? "" : "s"}`);
  if (daysPerWeek != null && daysPerWeek > 0) {
    parts.push(`${daysPerWeek} day${daysPerWeek === 1 ? "" : "s"}/wk`);
  }
  return parts.join(" · ");
}
