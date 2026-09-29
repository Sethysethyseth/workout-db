import { useMemo } from "react";
import { Card } from "../ui/Card.jsx";
import { compactExerciseRx } from "./blockBuilderState.js";

function isDeloadLabel(label) {
  return /deload/i.test(String(label || "").trim());
}

/**
 * Cross-week load table for one day position (n-th day of each week).
 * Row order follows `orderWeekIdx` (selected week); names only present in
 * other weeks are appended.
 */
export function ProgressionView({
  weeks = [],
  dayPosition = 0,
  orderWeekIdx = 0,
  unit = "lb",
  onSelectCell,
}) {
  const columns = useMemo(
    () =>
      weeks.map((w, i) => ({
        weekIdx: i,
        short: `W${i + 1}`,
        label: w.label != null ? String(w.label) : "",
        deload: isDeloadLabel(w.label),
      })),
    [weeks]
  );

  const rows = useMemo(
    () => buildProgressionRows(weeks, dayPosition, orderWeekIdx),
    [weeks, dayPosition, orderWeekIdx]
  );

  return (
    <Card className="bk-prog">
      <div className="bk-prog__scroll">
        <table className="bk-prog__table">
          <thead>
            <tr>
              <th scope="col" className="bk-prog__corner">
                Exercise
              </th>
              {columns.map((col) => (
                <th
                  key={col.weekIdx}
                  scope="col"
                  className={
                    col.deload
                      ? "bk-prog__week bk-prog__week--deload"
                      : "bk-prog__week"
                  }
                >
                  <span className="bk-prog__week-short">{col.short}</span>
                  {col.label ? (
                    <span className="bk-prog__week-label">{col.label}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="bk-prog__empty"
                  colSpan={Math.max(1, columns.length + 1)}
                >
                  No exercises on this day yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.name}>
                  <th scope="row" className="bk-prog__ex">
                    {row.name}
                  </th>
                  {columns.map((col) => {
                    const ex = row.byWeek[col.weekIdx] || null;
                    const text = ex ? compactExerciseRx(ex, unit) : null;
                    const cell = text || "—";
                    return (
                      <td
                        key={col.weekIdx}
                        className={
                          col.deload
                            ? "bk-prog__cell bk-prog__cell--deload"
                            : "bk-prog__cell"
                        }
                      >
                        {ex ? (
                          <button
                            type="button"
                            className="bk-prog__cell-btn"
                            onClick={() =>
                              onSelectCell?.({
                                weekIdx: col.weekIdx,
                                exerciseName: row.name,
                                exerciseId: ex.id,
                              })
                            }
                          >
                            {cell}
                          </button>
                        ) : (
                          <span className="bk-prog__absent">{cell}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * @param {object[]} weeks
 * @param {number} dayPosition
 * @param {number} [orderWeekIdx]
 */
function buildProgressionRows(weeks, dayPosition, orderWeekIdx = 0) {
  const names = [];
  const seen = new Set();
  const safeOrder = Math.min(
    Math.max(0, orderWeekIdx),
    Math.max(0, weeks.length - 1)
  );

  const orderDay = weeks[safeOrder]?.days?.[dayPosition];
  for (const ex of orderDay?.exercises || []) {
    const name = String(ex.exerciseName || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }

  weeks.forEach((w, wi) => {
    if (wi === safeOrder) return;
    const day = w.days?.[dayPosition];
    for (const ex of day?.exercises || []) {
      const name = String(ex.exerciseName || "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      names.push(name);
    }
  });

  return names.map((name) => {
    const byWeek = {};
    weeks.forEach((w, wi) => {
      const day = w.days?.[dayPosition];
      const match = (day?.exercises || []).find(
        (ex) => String(ex.exerciseName || "").trim() === name
      );
      if (match) byWeek[wi] = match;
    });
    return { name, byWeek };
  });
}
