import { niceRange } from "../../lib/chartScale.js";
import { loadWeightUnit } from "../../lib/weightUnitPref.js";

/**
 * Dumbbell chart: estimated 1RM first -> latest per exercise on a shared
 * weight axis. Emphasis form - the "first" dot is a neutral context mark, the
 * "latest" dot wears the accent. The matched-effort line under an exercise
 * name is the honest trend (same-RIR comparison) and gets the celebratory
 * treatment when positive; the raw delta chip describes the plotted dots.
 */

/* Display-only unit label (what the user logs in); weights are never converted. */
function formatWeight(n) {
  return `${Number(n).toFixed(1)} ${loadWeightUnit()}`;
}

function formatRir(r) {
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function DeltaChip({ delta }) {
  if (delta === 0) return <span className="muted small">no change</span>;
  const up = delta > 0;
  return (
    <span className={`st-delta${up ? " st-delta--up" : ""}`}>
      {up ? "+" : "−"}
      {formatWeight(Math.abs(delta))}
    </span>
  );
}

export function StrengthTrendChart({ perExercise }) {
  const rows = perExercise
    .map((ex) => {
      const e1rm = ex.bestSet?.e1rm?.epley ?? null;
      const trend = ex.e1rmTrend && ex.e1rmTrend.first !== null ? ex.e1rmTrend : null;
      return { ...ex, e1rm, trend };
    })
    .filter((ex) => ex.trend || ex.e1rm !== null)
    .sort((a, b) => (b.trend?.delta ?? -Infinity) - (a.trend?.delta ?? -Infinity));

  if (rows.length === 0) {
    return (
      <p className="muted small analytics-chart-note">
        Log a few sessions with weight and reps to see strength trends here.
      </p>
    );
  }

  const values = rows.flatMap((ex) =>
    ex.trend ? [ex.trend.first, ex.trend.latest] : [ex.e1rm]
  );
  const { min, max, ticks } = niceRange(Math.min(...values), Math.max(...values));
  const pct = (v) => `${(((v - min) / (max - min)) * 100).toFixed(2)}%`;
  const spanPct = (a, b) => `${((Math.abs(b - a) / (max - min)) * 100).toFixed(2)}%`;

  return (
    <div className="st-chart stack">
      <div className="chart-legend" aria-hidden="true">
        <span className="legend-key">
          <i className="legend-dot legend-dot--context" />
          First session in range
        </span>
        <span className="legend-key">
          <i className="legend-dot legend-dot--accent" />
          Latest
        </span>
      </div>
      <div className="st-rows">
        {rows.map((ex) => {
          const t = ex.trend;
          const tip = t
            ? `${ex.name}: e1RM ${formatWeight(t.first)} → ${formatWeight(t.latest)} (best ${formatWeight(t.best)})`
            : `${ex.name}: e1RM ${formatWeight(ex.e1rm)} · one session in range`;
          return (
            <div key={ex.exerciseId} className="st-row">
              <div className="row st-row-head">
                <span className="st-name">{ex.name}</span>
                {t ? (
                  <DeltaChip delta={t.delta} />
                ) : (
                  <span className="muted small">1 session</span>
                )}
              </div>
              {ex.matchedEffortTrend ? (
                <span
                  className={`st-matched small${ex.matchedEffortTrend.delta > 0 ? " st-matched--up" : " muted"}`}
                >
                  matched effort {ex.matchedEffortTrend.delta >= 0 ? "+" : "−"}
                  {formatWeight(Math.abs(ex.matchedEffortTrend.delta))} @{" "}
                  {formatRir(ex.matchedEffortTrend.rir)} RIR ·{" "}
                  {ex.matchedEffortTrend.sessions} sessions
                </span>
              ) : null}
              <div
                className="st-plot chart-tip-host"
                tabIndex={0}
                aria-label={tip}
                data-tip={tip}
              >
                {t ? (
                  <>
                    <span
                      className="st-connector"
                      style={{
                        left: pct(Math.min(t.first, t.latest)),
                        width: spanPct(t.first, t.latest),
                      }}
                    />
                    <span className="st-dot st-dot--context" style={{ left: pct(t.first) }} />
                    <span className="st-dot st-dot--accent" style={{ left: pct(t.latest) }} />
                  </>
                ) : (
                  <span className="st-dot st-dot--accent" style={{ left: pct(ex.e1rm) }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="st-axis" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} className="st-tick" style={{ left: pct(t) }}>
            {t}
          </span>
        ))}
        <span className="st-axis-unit muted small">
          {loadWeightUnit()} (estimated 1RM)
        </span>
      </div>
    </div>
  );
}
