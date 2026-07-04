const { getStimulusMultiplier } = require("./stimulusCurve");

// Brzycki's denominator (37 - reps) hits zero at reps === 37 and goes negative
// beyond it, so the formula is undefined/nonsensical there. Guard it.
const BRZYCKI_SINGULARITY_REPS = 37;

function estimateOneRepMax(weight, reps) {
  if (weight == null || reps == null || weight <= 0 || reps <= 0) {
    return { epley: null, brzycki: null };
  }

  const epley = weight * (1 + reps / 30);
  const brzycki =
    reps >= BRZYCKI_SINGULARITY_REPS ? null : (weight * 36) / (37 - reps);

  return { epley, brzycki };
}

function computeTonnage(weight, reps) {
  if (weight == null || reps == null) return null;
  return weight * reps;
}

function computeSetMetrics(set, attribution) {
  const { weight, reps, rir } = set || {};

  const tonnage = computeTonnage(weight, reps);
  const e1rm = estimateOneRepMax(weight, reps);
  const stimulusMultiplier = getStimulusMultiplier(rir);

  const effectiveContribution =
    attribution && attribution.attributed ? attribution.muscles : null;

  let stimulatingContribution = null;
  if (effectiveContribution !== null && stimulusMultiplier !== null) {
    stimulatingContribution = {};
    for (const [muscle, fraction] of Object.entries(effectiveContribution)) {
      stimulatingContribution[muscle] = fraction * stimulusMultiplier;
    }
  }

  return {
    tonnage,
    e1rm,
    stimulusMultiplier,
    effectiveContribution,
    stimulatingContribution,
  };
}

module.exports = {
  estimateOneRepMax,
  computeTonnage,
  computeSetMetrics,
};
