const fs = require("fs");
const path = require("path");
const {
  normalizeExerciseName,
  foldExerciseNamePlural,
} = require("./normalize");

const dataDir = path.join(__dirname, "..", "..", "data");
const exercisesPath = path.join(dataDir, "exercises.json");
const weightsPath = path.join(dataDir, "muscle-weights.json");
const aliasesPath = path.join(dataDir, "exercise-aliases.json");

let cache = null;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadCatalog() {
  if (cache) return cache;

  const exercises = readJson(exercisesPath);
  const muscleWeights = readJson(weightsPath);
  const aliases = readJson(aliasesPath);

  const byId = new Map();
  const byNormalizedName = new Map();
  const byAlias = new Map();

  for (const entry of exercises) {
    byId.set(entry.id, entry);

    const normalized = normalizeExerciseName(entry.name);
    if (byNormalizedName.has(normalized)) {
      const existing = byNormalizedName.get(normalized);
      console.warn(
        `catalog: normalized-name collision for "${normalized}" - keeping "${existing.id}", ignoring "${entry.id}"`
      );
      continue;
    }
    byNormalizedName.set(normalized, entry);
  }

  // Curated aliases first (deliberate mappings win over mechanical folds).
  // Invalid rows warn and skip, matching the name-collision pattern above.
  for (const [alias, targetId] of Object.entries(aliases)) {
    const key = normalizeExerciseName(alias);
    if (!key) {
      console.warn(`catalog: alias "${alias}" normalizes to empty - ignoring`);
      continue;
    }
    if (byNormalizedName.has(key)) {
      console.warn(
        `catalog: alias "${alias}" shadows catalog entry "${byNormalizedName.get(key).id}" - ignoring`
      );
      continue;
    }
    if (byAlias.has(key)) {
      console.warn(`catalog: duplicate alias "${key}" - keeping first`);
      continue;
    }
    if (!byId.has(targetId)) {
      console.warn(
        `catalog: alias "${alias}" targets unknown id "${targetId}" - ignoring`
      );
      continue;
    }
    byAlias.set(key, byId.get(targetId));
  }

  // Mechanical plural folds of catalog names ("Seated Cable Rows" ->
  // "seated cable row") fill only vacant slots.
  for (const [normalized, entry] of byNormalizedName) {
    const folded = foldExerciseNamePlural(normalized);
    if (
      folded !== normalized &&
      !byNormalizedName.has(folded) &&
      !byAlias.has(folded)
    ) {
      byAlias.set(folded, entry);
    }
  }

  cache = { byId, byNormalizedName, byAlias, muscleWeights };
  return cache;
}

module.exports = { loadCatalog };
