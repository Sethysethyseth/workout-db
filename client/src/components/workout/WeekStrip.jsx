import { useMemo } from "react";

/**
 * Seven cells, Monday to Sunday, for the current week: filled when a
 * workout was finished that day, ringed for today. The one glance that
 * answers "have I trained this week?" without a number.
 */
function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return d;
}

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function WeekStrip({ sessions }) {
  const cells = useMemo(() => {
    const today = new Date();
    const monday = startOfWeek(today);
    const trained = new Map();
    for (const s of Array.isArray(sessions) ? sessions : []) {
      if (!s?.completedAt) continue;
      const d = new Date(s.completedAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = dayKey(d);
      trained.set(key, (trained.get(key) || 0) + 1);
    }
    const todayKey = dayKey(today);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = dayKey(d);
      return {
        key,
        label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        long: d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
        count: trained.get(key) || 0,
        isToday: key === todayKey,
        isFuture: d > today && key !== todayKey,
      };
    });
  }, [sessions]);

  const trainedDays = cells.filter((c) => c.count > 0).length;

  return (
    <div className="week-strip" role="img" aria-label={`${trainedDays} of 7 days trained this week`}>
      {cells.map((c) => (
        <span
          key={c.key}
          className={
            "week-strip__day" +
            (c.count > 0 ? " week-strip__day--trained" : "") +
            (c.isToday ? " week-strip__day--today" : "") +
            (c.isFuture ? " week-strip__day--future" : "")
          }
          title={c.long}
        >
          <span className="week-strip__dot" aria-hidden="true" />
          <span className="week-strip__label" aria-hidden="true">
            {c.label}
          </span>
        </span>
      ))}
    </div>
  );
}
