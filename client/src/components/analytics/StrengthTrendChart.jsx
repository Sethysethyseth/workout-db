import { formatEffort } from "../../lib/effortDisplay.js";
import { formatEstimate, formatWeight } from "../../lib/weightDisplay.js";

/**
 * Sparkline chart: top-set weight per session via topSetSeries (N2) - the
 * weight actually lifted, whole numbers, never decimal e1RM. Mark spec per
 * the signed July 9 mock: 2px accent line (round join/cap), 10% accent wash
 * under the line, ringed end dot on the latest point, 40px plot. Single
 * series per row, so no legend box - the flanking first/last endpoint
 * values are the labels. Delta chip and trend summary use topSetSeries
 * endpoints so the chip describes the drawn line.
 */

/** formatWeight minus the unit suffix, for labels whose context already
    carries the unit (endpoint labels, the delta chip's top-set note). */
function bareWeight(n) {
  return formatWeight(n).replace(/ (lbs|kg)$/, "");
}

function topSetNote(topSet) {
  if (!topSet) return "";
  const reps = topSet.reps != null ? ` × ${Math.round(topSet.reps)}` : "";
  return ` · top set ${bareWeight(topSet.weight)}${reps}`;
}

function DeltaChip({ delta, topSet }) {
  if (delta === 0) {
    return <span className="st-delta">no change{topSetNote(topSet)}</span>;
  }
  const up = delta > 0;
  return (
    <span className={`st-delta${up ? " st-delta--up" : ""}`}>
      {up ? "+" : "−"}
      {formatWeight(Math.abs(delta))}
      {topSetNote(topSet)}
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
  const values = series.map((p) => p.weight);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const { min, max } = paddedRange(rawMin, rawMax);

  const tMin = new Date(series[0].performedAt).getTime();
  const tMax = new Date(series[series.length - 1].performedAt).getTime();
  const tSpan = tMax - tMin || 1;

  const W = 100;
  const H = 40;
  const padX = 4;
  const padY = 6;

  const xOf =
    series.length === 1 ? () => W / 2 : (t) => padX + ((t - tMin) / tSpan) * (W - padX * 2);
  const yOf = (v) => padY + (1 - (v - min) / (max - min)) * (H - padY * 2);

  const points = series.map((p) => {
    const t = new Date(p.performedAt).getTime();
    return `${xOf(t)},${yOf(p.weight)}`;
  });

  const endX = xOf(new Date(last.performedAt).getTime());
  const endY = yOf(last.weight);

  const tip =
    series.length === 1
      ? `1 session: top set ${formatWeight(first.weight)}`
      : `${series.length} sessions: top set ${formatWeight(first.weight)} → ${formatWeight(last.weight)}`;

  return (
    <div
      className="st-sparkline chart-tip-host"
      tabIndex={0}
      aria-label={tip}
      data-tip={tip}
    >
      <span className="st-sparkline-val st-sparkline-val--first">
        {series.length > 1 ? bareWeight(first.weight) : null}
      </span>
      <svg
        className="st-sparkline-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {series.length > 1 ? (
          <>
            <polygon
              className="st-sparkline-area"
              points={`${points.join(" ")} ${endX},${H - padY} ${points[0].split(",")[0]},${H - padY}`}
            />
            <polyline className="st-sparkline-line" points={points.join(" ")} />
          </>
        ) : null}
        {/* End dot as a zero-length round-cap stroke with non-scaling-stroke:
            preserveAspectRatio="none" stretches circle geometry into
            ellipses, but a non-scaling stroke stays round at any width. The
            surface-color ring is a wider stroke layered beneath it. */}
        <path className="st-sparkline-dot-ring" d={`M ${endX} ${endY} l 0.0001 0`} />
        <path className="st-sparkline-dot" d={`M ${endX} ${endY} l 0.0001 0`} />
      </svg>
      <span className="st-sparkline-val st-sparkline-val--last">{bareWeight(last.weight)}</span>
    </div>
  );
}

export function StrengthTrendChart({ perExercise }) {
  const rows = perExercise
    .map((ex) => {
      const series = Array.isArray(ex.topSetSeries) ? ex.topSetSeries : [];
      const delta =
        series.length >= 2 ? series[series.length - 1].weight - series[0].weight : series.length === 1 ? 0 : null;
      return { ...ex, series, delta };
    })
    .filter((ex) => ex.series.length > 0 || ex.topSet != null)
    .sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity));

  if (rows.length === 0) {
    return (
      <p className="muted small analytics-chart-note">
        Log a few weighted sets to see strength trends here.
      </p>
    );
  }

  return (
    <div className="st-chart stack">
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
              ? `${ex.name}: top set ${formatWeight(series[0].weight)} · 1 session in range`
              : `${ex.name}: top set ${formatWeight(series[0].weight)} → ${formatWeight(series[series.length - 1].weight)} · ${series.length} sessions`;

          return (
            <div key={ex.exerciseId} className="st-row" aria-label={tip}>
              <div className="row st-row-head">
                <span className="st-name">{ex.name}</span>
                {series.length === 1 ? (
                  <span className="muted small">1 session</span>
                ) : (
                  <DeltaChip delta={ex.delta} topSet={ex.topSet} />
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
