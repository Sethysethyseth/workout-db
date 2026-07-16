/**
 * KPI row for the analytics page. Headline numbers first (dataviz: a handful
 * of headline values is a stat-tile row, not a chart). Gains prefer the
 * matched-effort trend over the raw e1RM trend - it is the honest metric.
 */

import { Link } from "react-router-dom";
import { pickTopGain } from "../../lib/topGain.js";
import { formatEffort } from "../../lib/effortDisplay.js";
import { formatRepsValue } from "../../lib/repsDisplay.js";
import { formatEstimate, formatWeight } from "../../lib/weightDisplay.js";

/** When effort coverage clears this, stimulating sets lead the volume pair.
    Exported so the muscles heatmap reuses the SAME adaptive rule (single
    definition - an N2 acceptance criterion). */
export const EFFORT_COVERAGE_HEADLINE_THRESHOLD = 0.6;

function StatTile({ label, value, sub, tone = null, to = null }) {
  const body = (
    <>
      <span className="stat-tile-label muted small">{label}</span>
      <span className={`stat-tile-value${tone ? ` stat-tile-value--${tone}` : ""}`}>
        {value}
      </span>
      {sub ? <span className="stat-tile-sub muted small">{sub}</span> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="card stat-tile stat-tile--link">
        {body}
      </Link>
    );
  }

  return <div className="card stat-tile">{body}</div>;
}

function pickTopSet(perExercise) {
  let top = null;
  for (const ex of perExercise) {
    const ts = ex.topSet;
    if (!ts || ts.weight == null) continue;
    if (
      !top ||
      ts.weight > top.weight ||
      (ts.weight === top.weight && (ts.reps ?? 0) > (top.reps ?? 0))
    ) {
      top = { weight: ts.weight, reps: ts.reps, name: ex.name, exerciseId: ex.exerciseId };
    }
  }
  return top;
}

function exerciseDetailTo(exerciseId) {
  if (!exerciseId) return null;
  return `?view=exercises&exercise=${encodeURIComponent(exerciseId)}`;
}

export function StatTiles({ summary }) {
  const perMuscle = summary.perMuscle ?? [];
  const perExercise = summary.perExercise ?? [];
  const effortCoverage = summary.meta?.effortCoverage ?? null;

  const weeklySets = perMuscle.reduce((sum, m) => sum + m.effectiveSets, 0);
  const stimulatingKnown = perMuscle.filter((m) => m.stimulatingSets !== null);
  const weeklyStimulating = stimulatingKnown.reduce(
    (sum, m) => sum + m.stimulatingSets,
    0
  );

  const stimulatingComputable = stimulatingKnown.length > 0;
  const stimulatingLeads =
    effortCoverage != null &&
    effortCoverage >= EFFORT_COVERAGE_HEADLINE_THRESHOLD &&
    stimulatingComputable;

  const hasVolumeData = perMuscle.length > 0 && weeklySets > 0;

  const setsTile = (
    <StatTile
      label="Sets / week"
      value={weeklySets.toFixed(1)}
      sub={`effective sets across ${perMuscle.length} muscle${perMuscle.length === 1 ? "" : "s"}`}
      to={hasVolumeData ? "?view=muscles" : null}
    />
  );
  const stimulatingTile = stimulatingComputable ? (
    <StatTile
      label="Stimulating / week"
      value={weeklyStimulating.toFixed(1)}
      sub="effort-weighted sets (RIR or RPE)"
    />
  ) : (
    <StatTile
      label="Stimulating / week"
      value="—"
      sub="log RIR or RPE to unlock"
    />
  );

  const topSet = pickTopSet(perExercise);
  const topGain = pickTopGain(perExercise);
  const topGainExerciseId = topGain
    ? perExercise.find((ex) => ex.name === topGain.name)?.exerciseId
    : null;

  return (
    <div className="analytics-kpis">
      {stimulatingLeads ? (
        <>
          {stimulatingTile}
          {setsTile}
        </>
      ) : (
        <>
          {setsTile}
          {stimulatingTile}
        </>
      )}
      <StatTile
        label="Top set"
        value={
          topSet
            ? topSet.reps != null
              ? `${formatWeight(topSet.weight)} × ${formatRepsValue(topSet.reps)}`
              : formatWeight(topSet.weight)
            : "—"
        }
        sub={topSet ? topSet.name : "not enough data"}
        to={topSet ? exerciseDetailTo(topSet.exerciseId) : null}
      />
      <StatTile
        label="Top gain"
        value={topGain ? `+${formatEstimate(topGain.delta)}` : "—"}
        tone={topGain ? "up" : null}
        sub={
          topGain
            ? topGain.matched
              ? `${topGain.name} @ ${formatEffort({ rir: topGain.matched.rir, effortUnit: topGain.matched.effortUnit })}`
              : `${topGain.name} · estimated 1RM`
            : "no measured gain in range yet"
        }
        to={topGain ? exerciseDetailTo(topGainExerciseId) : null}
      />
    </div>
  );
}
