// RIR -> stimulus-multiplier curve. This is a tunable model parameter, NOT
// ground truth (see server/data/stimulus-curve-rationale.md). Ordered by
// ascending maxRir; getStimulusMultiplier returns the multiplier of the first
// band whose maxRir the given RIR does not exceed. A null/undefined RIR is
// deliberately NOT mapped here - the caller falls back to the always-on tier.
const STIMULUS_CURVE = [
  { maxRir: 1, multiplier: 1.0 },
  { maxRir: 2, multiplier: 0.95 },
  { maxRir: 3, multiplier: 0.85 },
  { maxRir: 4, multiplier: 0.6 },
  { maxRir: Infinity, multiplier: 0.3 },
];

function getStimulusMultiplier(rir) {
  if (rir === null || rir === undefined) return null;
  for (const band of STIMULUS_CURVE) {
    if (rir <= band.maxRir) return band.multiplier;
  }
  // Unreachable: the final band uses Infinity, but stay honest if that changes.
  return null;
}

module.exports = { getStimulusMultiplier, STIMULUS_CURVE };
