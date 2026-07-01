const { resolveExercise } = require("./resolve");
const { attributeSet } = require("./attribution");
const { computeSetMetrics } = require("./setMetrics");

function enrichSet(rawSet) {
  const resolution = resolveExercise({
    exerciseName: rawSet.exerciseName,
    exerciseId: rawSet.exerciseId,
  });
  const attribution = attributeSet(resolution);
  const metrics = computeSetMetrics(
    { weight: rawSet.weight, reps: rawSet.reps, rir: rawSet.rir },
    attribution
  );

  return {
    performedAt:
      rawSet.performedAt instanceof Date
        ? rawSet.performedAt
        : new Date(rawSet.performedAt),
    resolution,
    attribution,
    metrics,
  };
}

module.exports = { enrichSet };
