import { useMemo } from "react";

/**
 * Seven cells for the same rolling window as WeeklyReport's summary
 * (oldest -> today). Weekday letter + date under each; today outlined;
 * filled when a workout was finished that day.
 */
function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function localDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function WeekStrip({ sessions, from, to }) {
  const cells = useMemo(() => {
    const today = localDay(new Date());
    let endDay = to ? localDay(new Date(to)) : today;
    if (Number.isNaN(endDay.getTime())) endDay = today;
    let startDay = from ? localDay(new Date(from)) : null;
    if (!startDay || Number.isNaN(startDay.getTime())) {
      startDay = new Date(endDay);
      startDay.setDate(endDay.getDate() - 6);
    }

    const trained = new Map();
    for (const s of Array.isArray(sessions) ? sessions : []) {
      if (!s?.completedAt) continue;
      const d = new Date(s.completedAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = dayKey(d);
      trained.set(key, (trained.get(key) || 0) + 1);
    }

    const todayKey = dayKey(today);
    const cellsOut = [];
    const cursor = new Date(startDay);
    while (cursor.getTime() <= endDay.getTime() && cellsOut.length < 7) {
      const d = new Date(cursor);
      const key = dayKey(d);
      cellsOut.push({
        key,
        label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        dateNum: String(d.getDate()),
        long: d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
        count: trained.get(key) || 0,
        isToday: key === todayKey,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return cellsOut;
  }, [sessions, from, to]);

  const trainedDays = cells.filter((c) => c.count > 0).length;

  return (
    <div
      className="week-strip week-strip--rolling"
      role="img"
      aria-label={`${trainedDays} of 7 days trained in the last 7 days`}
    >
      {cells.map((c) => (
        <span
          key={c.key}
          className={
            "week-strip__day" +
            (c.count > 0 ? " week-strip__day--trained" : "") +
            (c.isToday ? " week-strip__day--today" : "")
          }
          title={c.long}
        >
          <span className="week-strip__label" aria-hidden="true">
            {c.label}
          </span>
          <span className="week-strip__date" aria-hidden="true">
            {c.dateNum}
          </span>
        </span>
      ))}
    </div>
  );
}
