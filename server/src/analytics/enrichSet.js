const { resolveExercise } = require("./resolve");
const { attributeSet } = require("./attribution");
const { computeSetMetrics } = require("./setMetrics");
const { deriveEffortRir } = require("./effort");

/** Timed hold/iso: durationSec set, reps null. Strength math must ignore these. */
function isTimedSet(rawOrInput) {
  return rawOrInput.durationSec != null && rawOrInput.reps == null;
}

function enrichSet(rawSet, userIndex = new Map()) {
  let resolution = resolveExercise(
    {
      exerciseName: rawSet.exerciseName,
      exerciseId: rawSet.exerciseId,
      userExerciseId: rawSet.userExerciseId,
    },
    undefined,
    userIndex
  );

  if (
    resolution.resolved &&
    (resolution.source === "userExercise" ||
      resolution.source === "userExerciseId") &&
    resolution.userExercise
  ) {
    resolution = {
      ...resolution,
      catalogEntry: {
        id: `user:${resolution.userExercise.id}`,
        name: resolution.userExercise.name,
      },
    };
  }

  const timed = isTimedSet(rawSet);
  // Timed sets still resolve for naming/Execution pairing, but contribute
  // nothing to volume, e1RM, stimulus, or strength scores (spec 7.5).
  const attribution = timed
    ? { attributed: false, source: null, muscles: {} }
    : attributeSet(resolution);
  // Effort-driven metrics run on the pooled RIR/RPE signal, not raw rir.
  const effortRir = timed
    ? null
    : deriveEffortRir({ rir: rawSet.rir, rpe: rawSet.rpe });
  const metrics = timed
    ? {
        tonnage: null,
        e1rm: { epley: null, brzycki: null },
        stimulusMultiplier: null,
        effectiveContribution: null,
        stimulatingContribution: null,
      }
    : computeSetMetrics(
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
      durationSec: rawSet.durationSec ?? null,
      effortRir,
      order: rawSet.order ?? null,
      templateExerciseId: rawSet.templateExerciseId ?? null,
    },
    resolution,
    attribution,
    metrics,
  };
}

module.exports = { enrichSet, isTimedSet };
