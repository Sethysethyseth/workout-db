import { formatEffort } from "../../lib/effortDisplay.js";
import { formatEstimate } from "../../lib/weightDisplay.js";

/**
 * Sparkline chart: estimated 1RM per session via e1rmSeries. Emphasis form -
 * earlier dots are neutral context marks; the latest dot wears the accent.
 * Delta chip and trend summary use e1rmSeries endpoints (session maxes), not
 * e1rmTrend.first/latest (raw first/last set values) so the chip describes
 * the drawn line.
 */

function DeltaChip({ delta }) {
  if (delta === 0) return <span className="muted small">no change</span>;
  const up = delta > 0;
  return (
    <span className={`st-delta${up ? " st-delta--up" : ""}`}>
      {up ? "+" : "−"}
      {formatEstimate(Math.abs(delta))}
    </span>
  );
}

function paddedRange(min, max) {
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 1);
    return { min: min - pad, max: max + pad };
  }
  const span = max - min;
  const pad = span * 0.12;
  return { min: min - pad, max: max + pad };
}

function SparklinePlot({ series }) {
  const first = series[0];
  const last = series[series.length - 1];
  const values = series.map((p) => p.epley);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const { min, max } = paddedRange(rawMin, rawMax);

  const tMin = new Date(series[0].performedAt).getTime();
  const tMax = new Date(series[series.length - 1].performedAt).getTime();
  const tSpan = tMax - tMin || 1;

  const W = 100;
  const H = 28;
  const padX = 4;
  const padY = 4;

  const xOf =
    series.length === 1 ? () => W / 2 : (t) => padX + ((t - tMin) / tSpan) * (W - padX * 2);
  const yOf = (v) => padY + (1 - (v - min) / (max - min)) * (H - padY * 2);

  const points = series.map((p) => {
    const t = new Date(p.performedAt).getTime();
    return `${xOf(t)},${yOf(p.epley)}`;
  });

  const tip = `${series.length} sessions: e1RM ${formatEstimate(first.epley)} → ${formatEstimate(last.epley)}`;

  return (
    <div
      className="st-sparkline chart-tip-host"
      tabIndex={0}
      aria-label={tip}
      data-tip={tip}
    >
      <span className="st-sparkline-val st-sparkline-val--first">
        {series.length > 1 ? formatEstimate(first.epley) : null}
      </span>
      <svg
        className="st-sparkline-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {series.length > 1 ? (
          <polyline className="st-sparkline-line" points={points.join(" ")} />
        ) : null}
        {/* Dots as zero-length round-cap strokes with non-scaling-stroke:
            preserveAspectRatio="none" stretches circle geometry into
            ellipses, but a non-scaling stroke stays round at any width. */}
        {series.map((p, i) => {
          const t = new Date(p.performedAt).getTime();
          const cx = xOf(t);
          const cy = yOf(p.epley);
          const isLatest = i === series.length - 1;
          return (
            <path
              key={p.performedAt}
              className={`st-sparkline-dot${isLatest ? " st-sparkline-dot--accent" : ""}`}
              d={`M ${cx} ${cy} l 0.0001 0`}
            />
          );
        })}
      </svg>
      <span className="st-sparkline-val st-sparkline-val--last">{formatEstimate(last.epley)}</span>
    </div>
  );
}

export function StrengthTrendChart({ perExercise }) {
  const rows = perExercise
    .map((ex) => {
      const series = Array.isArray(ex.e1rmSeries) ? ex.e1rmSeries : [];
      const delta =
        series.length >= 2 ? series[series.length - 1].epley - series[0].epley : series.length === 1 ? 0 : null;
      return { ...ex, series, delta };
    })
    .filter((ex) => ex.series.length > 0 || (ex.bestSet?.e1rm?.epley ?? null) !== null)
    .sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity));

  if (rows.length === 0) {
    return (
      <p className="muted small analytics-chart-note">
        Log a few sessions with weight and reps to see strength trends here.
      </p>
    );
  }

  return (
    <div className="st-chart stack">
      <div className="chart-legend" aria-hidden="true">
        <span className="legend-key">
          <i className="legend-dot legend-dot--context" />
          Earlier sessions
        </span>
        <span className="legend-key">
          <i className="legend-dot legend-dot--accent" />
          Latest
        </span>
      </div>
      <div className="st-rows">
        {rows.map((ex) => {
          const { series } = ex;
          if (series.length === 0) {
            return (
              <div key={ex.exerciseId} className="st-row">
                <div className="row st-row-head">
                  <span className="st-name">{ex.name}</span>
                  <span className="muted small">not enough data</span>
                </div>
              </div>
            );
          }

          const tip =
            series.length === 1
              ? `${ex.name}: e1RM ${formatEstimate(series[0].epley)} · 1 session in range`
              : `${ex.name}: e1RM ${formatEstimate(series[0].epley)} → ${formatEstimate(series[series.length - 1].epley)} · ${series.length} sessions`;

          return (
            <div key={ex.exerciseId} className="st-row" aria-label={tip}>
              <div className="row st-row-head">
                <span className="st-name">{ex.name}</span>
                {series.length === 1 ? (
                  <span className="muted small">1 session</span>
                ) : (
                  <DeltaChip delta={ex.delta} />
                )}
              </div>
              {ex.matchedEffortTrend ? (
                <span
                  className={`st-matched small${ex.matchedEffortTrend.delta > 0 ? " st-matched--up" : " muted"}`}
                >
                  matched effort {ex.matchedEffortTrend.delta >= 0 ? "+" : "−"}
                  {formatEstimate(Math.abs(ex.matchedEffortTrend.delta))} @{" "}
                  {formatEffort({
                    rir: ex.matchedEffortTrend.rir,
                    effortUnit: ex.matchedEffortTrend.effortUnit,
                  })}{" "}
                  · {ex.matchedEffortTrend.sessions} sessions
                </span>
              ) : null}
              <SparklinePlot series={series} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
