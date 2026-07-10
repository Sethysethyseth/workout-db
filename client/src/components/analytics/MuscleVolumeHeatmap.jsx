import { EFFORT_COVERAGE_HEADLINE_THRESHOLD } from "./StatTiles.jsx";

/**
 * Binned volume heatmap (replaces the weekly small multiples): rows =
 * muscles sorted by volume desc, columns = periods (weeks, or days at short
 * ranges - granularity derives from the range, never a knob), cell color =
 * the volume headline metric binned into 4 grid-relative steps. One printed
 * number per row (avg/wk). Exact values always live in the hover/focus tip
 * and the Table twin, so nothing is hover-gated. Empty cell is a faint
 * neutral, deliberately NOT ramp step 1 - "didn't train" must never read as
 * "trained a little."
 */

const BIN_STEPS = 4;

function fmt1(n) {
  const s = (Math.round(Number(n) * 10) / 10).toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/* Period labels use UTC fields: buckets are anchored at the range end
   (end-of-day boundaries), so the covered calendar day/week is stable in
   UTC where local conversion could shift it by a day. */
function fmtUtcMonthDay(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** The calendar day a day-cell covers is its periodEnd's date; a week cell
    starts the day after its periodStart boundary. */
function periodLabel(period, granularity) {
  if (granularity === "day") {
    return fmtUtcMonthDay(new Date(period.periodEnd));
  }
  return `wk of ${fmtUtcMonthDay(new Date(new Date(period.periodStart).getTime() + 1))}`;
}

function cellTip(muscle, period, granularity, stimulatingLeads) {
  const label = periodLabel(period, granularity);
  const eff = period.effectiveSets;
  const stim = period.stimulatingSets;
  if (eff <= 0) return `${muscle} — ${label}: not trained`;
  const effPart = `${fmt1(eff)} effective`;
  const stimPart =
    stim === null
      ? "log RIR or RPE for stimulating"
      : `${fmt1(stim)} stimulating`;
  // Lead with whichever metric colors the cell.
  return stimulatingLeads && stim !== null
    ? `${muscle} — ${label}: ${stimPart} · ${effPart}`
    : `${muscle} — ${label}: ${effPart} · ${stimPart}`;
}

/** Cell value = the volume headline metric (same adaptive rule as the N2
    stat tiles); cells without effort data fall back to effective so a
    trained muscle never reads as untrained. */
function cellValue(period, stimulatingLeads) {
  if (stimulatingLeads && period.stimulatingSets !== null) {
    return period.stimulatingSets;
  }
  return period.effectiveSets;
}

export function MuscleVolumeHeatmap({ perMuscle, granularity = "week", effortCoverage = null }) {
  const stimulatingLeads =
    effortCoverage != null &&
    effortCoverage >= EFFORT_COVERAGE_HEADLINE_THRESHOLD &&
    perMuscle.some((m) => m.stimulatingSets !== null);

  const rowAvg = (m) =>
    stimulatingLeads && m.stimulatingSets !== null
      ? m.stimulatingSets
      : m.effectiveSets;

  const rows = [...perMuscle].sort((a, b) => rowAvg(b) - rowAvg(a));
  if (rows.length === 0) {
    return (
      <p className="muted small analytics-chart-note">
        Log sets in this range to see volume trends here.
      </p>
    );
  }

  let gridMax = 0;
  for (const m of rows) {
    for (const p of m.series ?? []) {
      const v = cellValue(p, stimulatingLeads);
      if (v > gridMax) gridMax = v;
    }
  }
  const binOf = (v) => {
    if (v <= 0 || gridMax <= 0) return 0;
    const step = Math.ceil((v / gridMax) * BIN_STEPS);
    return Math.min(Math.max(step, 1), BIN_STEPS);
  };

  const series = rows[0].series ?? [];
  const isDay = granularity === "day";
  const firstLabel = series.length > 0 ? periodLabel(series[0], granularity) : null;
  const lastLabel =
    series.length > 1 ? periodLabel(series[series.length - 1], granularity) : null;

  return (
    <div className="hm-chart stack">
      <div className="hm-legend muted small" aria-hidden="true">
        <span>fewer</span>
        <i className="hm-cellkey hm-cellkey--1" />
        <i className="hm-cellkey hm-cellkey--2" />
        <i className="hm-cellkey hm-cellkey--3" />
        <i className="hm-cellkey hm-cellkey--4" />
        <span>more</span>
        <span className="hm-legend-empty">
          <i className="hm-cellkey hm-cellkey--0" /> not trained
        </span>
      </div>
      <div className="hm-row hm-head-row" aria-hidden="true">
        <span />
        <span />
        <span className="hm-avg-head muted">avg/wk</span>
      </div>
      <div className="hm-rows">
        {rows.map((m) => {
          const rowSeries = m.series ?? [];
          const trained = rowSeries.filter((p) => p.effectiveSets > 0).length;
          const rowSummary = isDay
            ? `${m.muscle}: trained ${trained} of ${rowSeries.length} days in range, avg ${fmt1(rowAvg(m))} sets/wk`
            : undefined;
          return (
            <div key={m.muscle} className="hm-row" aria-label={rowSummary}>
              <span className="hm-name">{m.muscle}</span>
              {/* Weekly cells (>=25px) are individual focus targets with the
                  tip as their label. Day cells (~9px) are NOT - their tips
                  are a desktop hover enhancement, the row summary + avg
                  column + Table twin carry the values everywhere else. */}
              <div
                className={`hm-cells${isDay ? " hm-cells--day" : ""}`}
                style={{ gridTemplateColumns: `repeat(${rowSeries.length}, 1fr)` }}
                aria-hidden={isDay ? "true" : undefined}
              >
                {rowSeries.map((p) => {
                  const tip = cellTip(m.muscle, p, granularity, stimulatingLeads);
                  const bin = binOf(cellValue(p, stimulatingLeads));
                  return (
                    <span
                      key={p.periodStart}
                      className={`hm-cell hm-cell--${bin} chart-tip-host`}
                      tabIndex={isDay ? undefined : 0}
                      aria-label={isDay ? undefined : tip}
                      data-tip={tip}
                    />
                  );
                })}
              </div>
              <span className="hm-avg muted small">{fmt1(rowAvg(m))}</span>
            </div>
          );
        })}
      </div>
      <div className="hm-row hm-x-caption" aria-hidden="true">
        <span />
        <div className="hm-x-labels row">
          <span className="muted small">{firstLabel}</span>
          <span className="muted small">{lastLabel}</span>
        </div>
        <span />
      </div>
    </div>
  );
}
