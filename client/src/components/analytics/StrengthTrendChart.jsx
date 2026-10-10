import "../../styles/analytics-strength.css";
import { formatEffort } from "../../lib/effortDisplay.js";
import { formatRepsValue } from "../../lib/repsDisplay.js";
import { formatEstimate, formatWeight } from "../../lib/weightDisplay.js";
import { StrengthEmptyGhost } from "./EmptyStateGhosts.jsx";

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

function topSetLine(ex) {
  const ts = ex.topSet;
  const weight = ts ? bareWeight(ts.weight) : bareWeight(ex.series[ex.series.length - 1].weight);
  const reps = ts?.reps != null ? ` × ${formatRepsValue(ts.reps)}` : "";
  if (ex.series.length < 2 || ex.delta === 0) return `Top set ${weight}${reps}`;
  const dir = ex.delta > 0 ? "up" : "down";
  return `Top set ${weight}${reps}, ${dir} ${formatWeight(Math.abs(ex.delta))}`;
}

function matchedLine(trend) {
  const dir =
    trend.delta > 0 ? `up ${formatEstimate(trend.delta)}` : trend.delta < 0 ? `down ${formatEstimate(Math.abs(trend.delta))}` : "unchanged";
  const effort = formatEffort({ rir: trend.rir, effortUnit: trend.effortUnit });
  const sessions = `${trend.sessions} ${trend.sessions === 1 ? "session" : "sessions"}`;
  return `Matched effort ${dir} at ${effort}, ${sessions}`;
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

export function SparklinePlot({ series, compact = false }) {
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

  /* Direction class colours the end dot with the meaning token (--chart-up /
     --chart-down), never the accent - so a gain reads as a gain on crimson. */
  const dir = last.weight > first.weight ? " st-sparkline--up" : last.weight < first.weight ? " st-sparkline--down" : "";

  return (
    <div
      className={`st-sparkline chart-tip-host${compact ? " st-sparkline--compact" : ""}${dir}`}
      tabIndex={compact ? -1 : 0}
      aria-label={tip}
      data-tip={compact ? undefined : tip}
    >
      {compact ? null : (
        <span className="st-sparkline-val st-sparkline-val--first">
          {series.length > 1 ? bareWeight(first.weight) : null}
        </span>
      )}
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
      {compact ? null : (
        <span className="st-sparkline-val st-sparkline-val--last">{bareWeight(last.weight)}</span>
      )}
    </div>
  );
}

function buildTrendRows(perExercise) {
  const list = Array.isArray(perExercise) ? perExercise : [];
  // Preserve caller order - Strength trends partition owns sort (abs matched-
  // effort delta). Do not re-sort by raw top-set weight delta here.
  return list
    .map((ex) => {
      const series = Array.isArray(ex.topSetSeries) ? ex.topSetSeries : [];
      const delta =
        series.length >= 2
          ? series[series.length - 1].weight - series[0].weight
          : series.length === 1
            ? 0
            : null;
      return { ...ex, series, delta };
    })
    .filter((ex) => ex.series.length > 0 || ex.topSet != null);
}

/** Compact form for the long tail: name, delta, a slim sparkline. */
function StrengthCompactRow({ ex }) {
  const { series } = ex;
  const up = ex.delta > 0;
  const down = ex.delta < 0;
  return (
    <div className="st-compact-row">
      <span className="st-name">{ex.name}</span>
      <span className="st-compact-spark" aria-hidden="true">
        {series.length > 1 ? <SparklinePlot series={series} compact /> : null}
      </span>
      <span
        className={`st-compact-delta${up ? " st-compact-delta--up" : ""}${down ? " st-compact-delta--down" : ""}`}
      >
        {series.length <= 1
          ? "1 session"
          : ex.delta === 0
            ? "no change"
            : `${up ? "+" : "−"}${formatWeight(Math.abs(ex.delta))}`}
      </span>
    </div>
  );
}

function StrengthTrendRow({ ex, featured = false, index = 0 }) {
  const { series } = ex;
  if (series.length === 0) {
    return (
      <div className="st-row">
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

  /* --row staggers the draw: line, then area, then the end dot, then the
     delta chip (analytics-motion.css). */
  return (
    <div
      className={`st-row${featured ? " st-row--featured" : ""}`}
      aria-label={tip}
      style={{ "--row": index }}
    >
      <div className="st-row-copy">
        <span className="st-name">{ex.name}</span>
        <p className={`st-meta${ex.delta > 0 ? " st-meta--up" : ""}${ex.delta < 0 ? " st-meta--down" : ""}`}>
          {topSetLine(ex)}
        </p>
        {ex.matchedEffortTrend ? (
          <p
            className={`st-meta${ex.matchedEffortTrend.delta > 0 ? " st-meta--up" : ""}${ex.matchedEffortTrend.delta < 0 ? " st-meta--down" : ""}`}
          >
            {matchedLine(ex.matchedEffortTrend)}
          </p>
        ) : null}
      </div>
      <SparklinePlot series={series} />
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array} props.perExercise - main/noteworthy rows (caller-ordered)
 * @param {React.ReactNode} [props.betweenRows] - e.g. singles collapse chip
 * @param {Array} [props.afterPerExercise] - rows after betweenRows (expanded singles)
 */
export function StrengthTrendChart({ perExercise, betweenRows = null, afterPerExercise = null }) {
  const rows = buildTrendRows(perExercise);
  const afterRows = buildTrendRows(afterPerExercise);

  if (rows.length === 0 && afterRows.length === 0) {
    return (
      <div className="stack analytics-empty-surface">
        <StrengthEmptyGhost />
        <p className="analytics-unlock" style={{ margin: 0 }}>
          Two sessions of the same lift unlock its trend.
        </p>
      </div>
    );
  }

  /* The caller orders rows by |matched-effort delta|, so the first few are
     the movers: they get the full card treatment; the rest read as a
     compact list, so a long roster is a ranking instead of a wall. */
  const FEATURED = 4;
  const featured = rows.slice(0, FEATURED);
  const tail = rows.slice(FEATURED);

  return (
    <div className="st-chart stack">
      {featured.length > 0 ? (
        <div className="st-featured">
          {featured.map((ex, i) => (
            <StrengthTrendRow key={ex.exerciseId} ex={ex} featured index={i} />
          ))}
        </div>
      ) : null}
      {tail.length > 0 ? (
        <div className="st-compact">
          <p className="st-compact__label muted small">Everything else in range</p>
          {tail.map((ex) => (
            <StrengthCompactRow key={ex.exerciseId} ex={ex} />
          ))}
        </div>
      ) : null}
      {betweenRows}
      {afterRows.length > 0 ? (
        <div className="st-compact">
          {afterRows.map((ex) => (
            <StrengthCompactRow key={ex.exerciseId} ex={ex} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
