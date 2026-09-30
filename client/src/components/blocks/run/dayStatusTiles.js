/**
 * Pure day-status -> WeekStrip / DayPicker tile mapping (BK8).
 * Consumes `computeRunProgress` shape from GET /block-runs/active.
 *
 * Day progress: done = 1, in_progress = 0.5, todo = 0.
 * Tag "NEXT" on progress.nextDay. Opens on current week; day = nextDay
 * else first day of that week.
 */

const STATUS_PROGRESS = {
  done: 1,
  in_progress: 0.5,
  todo: 0,
};

/**
 * @param {"todo"|"in_progress"|"done"|string} status
 * @returns {number}
 */
export function dayStatusProgress(status) {
  if (status === "done") return STATUS_PROGRESS.done;
  if (status === "in_progress") return STATUS_PROGRESS.in_progress;
  return STATUS_PROGRESS.todo;
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
      return {
        key: String(day.order),
        top: `DAY ${day.order}`,
        name: day.name || `Day ${day.order}`,
        progress: dayStatusProgress(day.status),
        tag: isNext ? "NEXT" : null,
        status: day.status || "todo",
        sessionId: day.sessionId != null ? day.sessionId : null,
        order: day.order,
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
