const { loadCatalog } = require("./catalog");
const { userExerciseWeights } = require("./userExercises");

function attributeSet(resolution, catalog = loadCatalog()) {
  if (!resolution || !resolution.resolved) {
    return { attributed: false, source: null, muscles: {} };
  }

  if (
    (resolution.source === "userExercise" ||
      resolution.source === "userExerciseId") &&
    resolution.userExercise
  ) {
    const muscles = userExerciseWeights(resolution.userExercise.muscles);
    if (Object.keys(muscles).length === 0) {
      return { attributed: false, source: null, muscles: {} };
    }
    return { attributed: true, source: "userExercise", muscles };
  }

  const entry = resolution.catalogEntry;
  const curated = catalog.muscleWeights[entry.id];

  if (curated) {
    return { attributed: true, source: "muscleWeights", muscles: curated };
  }

  const raw = {};
  const primary = Array.isArray(entry.primaryMuscles) ? entry.primaryMuscles : [];
  const secondary = Array.isArray(entry.secondaryMuscles)
    ? entry.secondaryMuscles
    : [];

  for (const muscle of primary) {
    raw[muscle] = (raw[muscle] || 0) + 1.0;
  }
  for (const muscle of secondary) {
    raw[muscle] = (raw[muscle] || 0) + 0.5;
  }

  const total = Object.values(raw).reduce((acc, v) => acc + v, 0);
  if (total === 0) {
    return { attributed: false, source: null, muscles: {} };
  }

  const muscles = {};
  for (const [muscle, weight] of Object.entries(raw)) {
    muscles[muscle] = weight / total;
  }

  return { attributed: true, source: "primarySecondaryFallback", muscles };
}

module.exports = { attributeSet };
