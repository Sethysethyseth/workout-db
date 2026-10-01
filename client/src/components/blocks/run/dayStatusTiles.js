/**
 * Pure day-status -> WeekStrip / DayPicker tile mapping (BK8 / bksf1d).
 * Consumes `computeRunProgress` shape from GET /block-runs/active.
 *
 * Day progress: done = 1, todo = 0.
 * in_progress: the run payload has no per-day logged/planned set counts, so
 * we do NOT invent 50%. DayPicker rings use a short decorative arc
 * (IN_PROGRESS_RING_VALUE); RunDayCard renders a distinct "In progress"
 * state with no percentage.
 *
 * Tag "NEXT" on progress.nextDay. Opens on current week; day = nextDay
 * else first day of that week.
 */

/** Short arc (~1/7) for DayPicker - decorative, not a completion fraction. */
export const IN_PROGRESS_RING_VALUE = 0.14;

/**
 * @param {"todo"|"in_progress"|"done"|string} status
 * @returns {number}
 */
export function dayStatusProgress(status) {
  if (status === "done") return 1;
  if (status === "in_progress") return IN_PROGRESS_RING_VALUE;
  return 0;
}

/**
 * Real set-completion fraction when the day object carries counts; else null.
 * @param {object | null | undefined} day
 * @returns {number | null}
 */
export function dayLoggedFraction(day) {
  if (!day) return null;
  const logged = day.loggedSets ?? day.setsLogged ?? day.loggedSetCount;
  const planned = day.plannedSets ?? day.setsPlanned ?? day.plannedSetCount;
  if (logged == null || planned == null) return null;
  const p = Number(planned);
  const l = Number(logged);
  if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(l)) return null;
  return Math.max(0, Math.min(1, l / p));
}

/**
 * @param {object | null | undefined} progress
 * @returns {{
 *   weeks: { key: string, short: string, progress: number, current: boolean, ariaLabel: string }[],
 *   openWeekOrder: number | null,
 *   openDayOrder: number | null,
 *   daysByWeekOrder: Record<number, {
 *     key: string,
 *     top: string,
 *     name: string,
 *     progress: number,
 *     tag: string | null,
 *     status: string,
 *     sessionId: number | null,
 *     order: number,
 *   }[]>,
 * }}
 */
export function mapProgressToTiles(progress) {
  const weeksIn = Array.isArray(progress?.weeks) ? progress.weeks : [];
  const nextDay = progress?.nextDay ?? null;
  const currentWeekOrder =
    progress?.currentWeekOrder != null ? Number(progress.currentWeekOrder) : null;

  const daysByWeekOrder = {};
  const weeks = weeksIn.map((week) => {
    const order = week.order;
    const total = Number(week.total) || 0;
    const done = Number(week.done) || 0;
    const days = (week.days || []).map((day) => {
      const isNext =
        nextDay != null &&
        Number(nextDay.weekOrder) === Number(order) &&
        Number(nextDay.workoutOrder) === Number(day.order);
      const status = day.status || "todo";
      const realFrac = dayLoggedFraction(day);
      let progressValue;
      if (status === "done") progressValue = 1;
      else if (status === "in_progress") {
        progressValue = realFrac != null ? realFrac : IN_PROGRESS_RING_VALUE;
      } else {
        progressValue = 0;
      }
      return {
        key: String(day.order),
        top: `DAY ${day.order}`,
        name: day.name || `Day ${day.order}`,
        progress: progressValue,
        tag: isNext ? "NEXT" : null,
        status,
        sessionId: day.sessionId != null ? day.sessionId : null,
        order: day.order,
        loggedSets: day.loggedSets ?? day.setsLogged ?? null,
        plannedSets: day.plannedSets ?? day.setsPlanned ?? null,
      };
    });
    daysByWeekOrder[order] = days;

    const label = week.label ? String(week.label) : "";
    return {
      key: String(order),
      short: `W${order}`,
      progress: total > 0 ? done / total : 0,
      current: currentWeekOrder != null && Number(order) === currentWeekOrder,
      ariaLabel: label
        ? `Week ${order}, ${label}, ${done} of ${total} days done`
        : `Week ${order}, ${done} of ${total} days done`,
      order,
      label,
      done,
      total,
    };
  });

  let openWeekOrder = currentWeekOrder;
  if (openWeekOrder == null && weeks.length > 0) {
    openWeekOrder = weeks[0].order;
  }

  let openDayOrder = null;
  if (nextDay != null && Number(nextDay.weekOrder) === Number(openWeekOrder)) {
    openDayOrder = Number(nextDay.workoutOrder);
  } else if (openWeekOrder != null) {
    const days = daysByWeekOrder[openWeekOrder] || [];
    openDayOrder = days.length > 0 ? days[0].order : 1;
  }

  return {
    weeks,
    openWeekOrder,
    openDayOrder,
    daysByWeekOrder,
  };
}

/**
 * Whether an active run has every day done (Up next should hide).
 * @param {object | null | undefined} progress
 */
export function isRunFinished(progress) {
  if (!progress || !Array.isArray(progress.weeks) || progress.weeks.length === 0) {
    return false;
  }
  return progress.nextDay == null && progress.weeks.every((w) => w.done === w.total);
}
