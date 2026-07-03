const { resolveExercise } = require("./resolve");
const { attributeSet } = require("./attribution");
const { computeSetMetrics } = require("./setMetrics");
const { deriveEffortRir } = require("./effort");

function enrichSet(rawSet) {
  const resolution = resolveExercise({
    exerciseName: rawSet.exerciseName,
    exerciseId: rawSet.exerciseId,
  });
  const attribution = attributeSet(resolution);
  // Effort-driven metrics run on the pooled RIR/RPE signal, not raw rir.
  const effortRir = deriveEffortRir({ rir: rawSet.rir, rpe: rawSet.rpe });
  const metrics = computeSetMetrics(
    { weight: rawSet.weight, reps: rawSet.reps, rir: effortRir },
    attribution
  );

  return {
    performedAt:
      rawSet.performedAt instanceof Date
        ? rawSet.performedAt
        : new Date(rawSet.performedAt),
    input: {
      weight: rawSet.weight ?? null,
      reps: rawSet.reps ?? null,
      rir: rawSet.rir ?? null,
      rpe: rawSet.rpe ?? null,
      effortRir,
      order: rawSet.order ?? null,
      templateExerciseId: rawSet.templateExerciseId ?? null,
    },
    resolution,
    attribution,
    metrics,
  };
}

module.exports = { enrichSet };
