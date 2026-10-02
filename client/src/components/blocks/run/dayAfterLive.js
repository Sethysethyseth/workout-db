/**
 * First day AFTER the live in-progress block day for Home's muted "Up next".
 * Walks progress.weeks[].days[] in block order; skips done days and the live
 * day itself. Null when nothing remains.
 *
 * @param {object | null | undefined} progress
 * @param {{ weekOrder: number, workoutOrder: number } | null | undefined} liveDay
 * @returns {{ weekOrder: number, workoutOrder: number, name: string | null } | null}
 */
export function dayAfterLive(progress, liveDay) {
  const weeks = Array.isArray(progress?.weeks) ? progress.weeks : [];
  if (weeks.length === 0) return null;

  const liveWeek =
    liveDay?.weekOrder != null ? Number(liveDay.weekOrder) : null;
  const liveWorkout =
    liveDay?.workoutOrder != null ? Number(liveDay.workoutOrder) : null;
  const hasLive =
    liveWeek != null &&
    !Number.isNaN(liveWeek) &&
    liveWorkout != null &&
    !Number.isNaN(liveWorkout);

  const ordered = [...weeks].sort(
    (a, b) => Number(a.order) - Number(b.order)
  );

  for (const week of ordered) {
    const weekOrder = Number(week.order);
    const days = Array.isArray(week.days) ? [...week.days] : [];
    days.sort((a, b) => Number(a.order) - Number(b.order));
    for (const day of days) {
      const status = day?.status || "todo";
      if (status === "done") continue;
      const workoutOrder = Number(day.order);
      if (
        hasLive &&
        weekOrder === liveWeek &&
        workoutOrder === liveWorkout
      ) {
        continue;
      }
      return {
        weekOrder,
        workoutOrder,
        name: day.name != null ? String(day.name) : null,
      };
    }
  }
  return null;
}
