const fs = require("fs");
const path = require("path");
const { normalizeExerciseName } = require("./normalize");

const dataDir = path.join(__dirname, "..", "..", "data");
const exercisesPath = path.join(dataDir, "exercises.json");
const weightsPath = path.join(dataDir, "muscle-weights.json");

let cache = null;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadCatalog() {
  if (cache) return cache;

  const exercises = readJson(exercisesPath);
  const muscleWeights = readJson(weightsPath);

  const byId = new Map();
  const byNormalizedName = new Map();

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

  cache = { byId, byNormalizedName, muscleWeights };
  return cache;
}

module.exports = { loadCatalog };
