const { loadCatalog } = require("./catalog");
const { normalizeExerciseName } = require("./normalize");

function resolveExercise(input, catalog = loadCatalog()) {
  const { exerciseName, exerciseId } = input || {};

  if (exerciseId && catalog.byId.has(exerciseId)) {
    return {
      resolved: true,
      source: "exerciseId",
      catalogEntry: catalog.byId.get(exerciseId),
    };
  }

  const normalized = normalizeExerciseName(exerciseName);
  if (normalized && catalog.byNormalizedName.has(normalized)) {
    return {
      resolved: true,
      source: "exerciseName",
      catalogEntry: catalog.byNormalizedName.get(normalized),
    };
  }

  return { resolved: false, source: null, catalogEntry: null };
}

module.exports = { resolveExercise };
