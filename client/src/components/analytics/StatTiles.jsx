/**
 * KPI row for the analytics page. Headline numbers first (dataviz: a handful
 * of headline values is a stat-tile row, not a chart). Gains prefer the
 * matched-effort trend over the raw e1RM trend - it is the honest metric.
 */

import { pickTopGain } from "../../lib/topGain.js";
import { formatEffort } from "../../lib/effortDisplay.js";
import { formatEstimate } from "../../lib/weightDisplay.js";

function StatTile({ label, value, sub, tone = null }) {
  return (
    <div className="card stat-tile">
      <span className="stat-tile-label muted small">{label}</span>
      <span className={`stat-tile-value${tone ? ` stat-tile-value--${tone}` : ""}`}>
        {value}
      </span>
      {sub ? <span className="stat-tile-sub muted small">{sub}</span> : null}
    </div>
  );
}

export function StatTiles({ summary }) {
  const perMuscle = summary.perMuscle ?? [];
  const perExercise = summary.perExercise ?? [];

  const weeklySets = perMuscle.reduce((sum, m) => sum + m.effectiveSets, 0);
  const stimulatingKnown = perMuscle.filter((m) => m.stimulatingSets !== null);
  const weeklyStimulating = stimulatingKnown.reduce(
    (sum, m) => sum + m.stimulatingSets,
    0
  );

  let bestLift = null;
  for (const ex of perExercise) {
    const e1rm = ex.bestSet?.e1rm?.epley;
    if (e1rm != null && (!bestLift || e1rm > bestLift.e1rm)) {
      bestLift = { e1rm, name: ex.name };
    }
  }

  const topGain = pickTopGain(perExercise);

  return (
    <div className="analytics-kpis">
      <StatTile
        label="Sets / week"
        value={weeklySets.toFixed(1)}
        sub={`effective sets across ${perMuscle.length} muscle${perMuscle.length === 1 ? "" : "s"}`}
      />
      {stimulatingKnown.length > 0 ? (
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
      )}
      <StatTile
        label="Best lift"
        value={bestLift ? formatEstimate(bestLift.e1rm) : "—"}
        sub={bestLift ? `estimated 1RM · ${bestLift.name}` : "not enough data"}
      />
      <StatTile
        label="Top gain"
        value={topGain ? `+${formatEstimate(topGain.delta)}` : "—"}
        tone={topGain ? "up" : null}
        sub={
          topGain
            ? topGain.matched
              ? `${topGain.name} @ ${formatEffort({ rir: topGain.matched.rir, effortUnit: topGain.matched.effortUnit })}`
              : `${topGain.name} e1RM`
            : "no measured gain in range yet"
        }
      />
    </div>
  );
}
