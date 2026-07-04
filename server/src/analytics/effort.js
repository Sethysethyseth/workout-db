// RIR and RPE are one pooled effort signal, differing only by which the user
// chose to type. This is the ONLY place RPE is interpreted - everything
// downstream (stimulus curve, matched effort, effort drift, coverage) sees
// the derived RIR. Convention: RIR = 10 - RPE.

// Explicit RIR always wins, even when an inconsistent RPE is also present.
// RPE above 10 clamps to 0 RIR. Fractional RPE yields fractional RIR
// (8.5 -> 1.5) - deliberately not rounded: getStimulusMultiplier handles
// fractional input (band comparison) and matched effort buckets by exact
// value. Neither signal present -> null.
function deriveEffortRir({ rir, rpe }) {
  if (rir != null) return rir;
  if (rpe != null) return Math.max(0, 10 - rpe);
  return null;
}

module.exports = { deriveEffortRir };
