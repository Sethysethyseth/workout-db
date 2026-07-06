const { loadCatalog } = require("./catalog");
const {
  normalizeExerciseName,
  foldExerciseNamePlural,
} = require("./normalize");

function resolveExercise(input, catalog = loadCatalog(), userIndex = new Map()) {
  const { exerciseName, exerciseId } = input || {};

  if (exerciseId && catalog.byId.has(exerciseId)) {
    return {
      resolved: true,
      source: "exerciseId",
      catalogEntry: catalog.byId.get(exerciseId),
    };
  }

  const normalized = normalizeExerciseName(exerciseName);
  if (normalized) {
    if (catalog.byNormalizedName.has(normalized)) {
      return {
        resolved: true,
        source: "exerciseName",
        catalogEntry: catalog.byNormalizedName.get(normalized),
      };
    }

    // Alias layer: curated colloquial names + plural folds, both directions
    // (folded catalog names live in byAlias; the query is folded here).
    // catalog.byAlias is optional so hand-built catalogs in tests still work.
    const byAlias = catalog.byAlias;
    if (byAlias && byAlias.has(normalized)) {
      return {
        resolved: true,
        source: "alias",
        catalogEntry: byAlias.get(normalized),
      };
    }

    const folded = foldExerciseNamePlural(normalized);
    if (folded !== normalized) {
      if (catalog.byNormalizedName.has(folded)) {
        return {
          resolved: true,
          source: "alias",
          catalogEntry: catalog.byNormalizedName.get(folded),
        };
      }
      if (byAlias && byAlias.has(folded)) {
        return {
          resolved: true,
          source: "alias",
          catalogEntry: byAlias.get(folded),
        };
      }
    }

    if (userIndex && userIndex.has(normalized)) {
      return {
        resolved: true,
        source: "userExercise",
        catalogEntry: null,
        userExercise: userIndex.get(normalized),
      };
    }
  }

  return { resolved: false, source: null, catalogEntry: null };
}

module.exports = { resolveExercise };
