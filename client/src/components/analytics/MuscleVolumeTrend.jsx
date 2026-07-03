import { niceScale } from "../../lib/chartScale.js";

/**
 * Weekly small multiples: one column per week per muscle, all rows sharing
 * one y-scale so weekly volume is comparable across muscles.
 */

function fmt1(n) {
  return Number(n).toFixed(1);
}

function fmtMonthDay(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function weekTip(muscle, week) {
  const eff = fmt1(week.effectiveSets);
  if (week.stimulatingSets === null) {
    return `${muscle} - wk of ${fmtMonthDay(week.weekStart)}: ${eff} effective · log RIR or RPE for stimulating`;
  }
  return `${muscle} - wk of ${fmtMonthDay(week.weekStart)}: ${eff} effective / ${fmt1(week.stimulatingSets)} stimulating`;
}

export function MuscleVolumeTrend({ perMuscle }) {
  const rows = [...perMuscle].sort((a, b) => b.effectiveSets - a.effectiveSets);
  if (rows.length === 0) {
    return (
      <p className="muted small analytics-chart-note">
        Log sets in this range to see weekly volume trends here.
      </p>
    );
  }

  const series = rows[0].series ?? [];
  let dataMax = 0;
  for (const m of rows) {
    for (const w of m.series ?? []) {
      if (w.effectiveSets > dataMax) dataMax = w.effectiveSets;
    }
  }
  const { max } = niceScale(dataMax);
  const anyLocked = rows.some((m) => (m.series ?? []).some((w) => w.stimulatingSets === null));

  const firstWeek = series[0]?.weekStart;
  const lastWeek = series[series.length - 1]?.weekStart;

  return (
    <div className="mvt-chart stack">
      <div className="chart-legend" aria-hidden="true">
        <span className="legend-key">
          <i className="legend-swatch legend-swatch--context" />
          Effective sets/wk
        </span>
        <span className="legend-key">
          <i className="legend-swatch legend-swatch--accent" />
          Stimulating (effort-weighted)
        </span>
      </div>
      <div className="mvt-rows">
        {rows.map((m) => {
          const lastWeekOfRow = (m.series ?? [])[(m.series ?? []).length - 1];
          return (
            <div key={m.muscle} className="mvt-row">
              <span className="mvt-name">{m.muscle}</span>
              <div
                className="mvt-cols"
                style={{ gridTemplateColumns: `repeat(${series.length}, 1fr)` }}
              >
                {(m.series ?? []).map((week) => {
                  const effFrac = max > 0 ? Math.min(week.effectiveSets / max, 1) : 0;
                  const stimFrac =
                    week.stimulatingSets === null || max <= 0
                      ? null
                      : Math.min(week.stimulatingSets / max, 1);
                  return (
                    <div
                      key={week.weekStart}
                      className="mvt-col chart-tip-host"
                      tabIndex={0}
                      aria-label={weekTip(m.muscle, week)}
                      data-tip={weekTip(m.muscle, week)}
                    >
                      <div className="mvt-col-track">
                        {week.effectiveSets > 0 ? (
                          <>
                            <span
                              className="mvt-bar mvt-bar--effective"
                              style={{ height: `${effFrac * 100}%` }}
                            />
                            {stimFrac !== null ? (
                              <span
                                className="mvt-bar mvt-bar--stimulating"
                                style={{ height: `${stimFrac * 100}%` }}
                              />
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <span className="mvt-val">
                {lastWeekOfRow && lastWeekOfRow.effectiveSets > 0
                  ? fmt1(lastWeekOfRow.effectiveSets)
                  : null}
              </span>
            </div>
          );
        })}
      </div>
      {firstWeek && lastWeek ? (
        <div className="mvt-x-caption" aria-hidden="true">
          <span className="mvt-x-spacer" />
          <div className="mvt-x-labels row">
            <span className="muted small">{fmtMonthDay(firstWeek)}</span>
            <span className="muted small">{fmtMonthDay(lastWeek)}</span>
          </div>
        </div>
      ) : null}
      {anyLocked ? (
        <p className="muted small analytics-chart-note">
          Muscles without RIR or RPE logged show effective sets only.
        </p>
      ) : null}
    </div>
  );
}
