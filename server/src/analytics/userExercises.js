const { normalizeExerciseName } = require("./normalize");

function userExerciseWeights(designations) {
  const raw = {};
  for (const [muscle, designation] of Object.entries(designations || {})) {
    if (designation === "primary") {
      raw[muscle] = (raw[muscle] || 0) + 1.0;
    } else if (designation === "secondary") {
      raw[muscle] = (raw[muscle] || 0) + 0.5;
    }
  }

  const total = Object.values(raw).reduce((acc, v) => acc + v, 0);
  if (total === 0) {
    return {};
  }

  const muscles = {};
  for (const [muscle, weight] of Object.entries(raw)) {
    muscles[muscle] = weight / total;
  }
  return muscles;
}

function buildUserExerciseIndex(rows) {
  const index = new Map();
  if (!Array.isArray(rows)) {
    return index;
  }

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const { id, name, muscles } = row;
    const normalizedName =
      typeof row.normalizedName === "string" && row.normalizedName
        ? row.normalizedName
        : normalizeExerciseName(name);

    if (
      id == null ||
      typeof name !== "string" ||
      !name ||
      !normalizedName ||
      !muscles ||
      typeof muscles !== "object" ||
      Array.isArray(muscles)
    ) {
      continue;
    }

    index.set(normalizedName, { id, name, muscles });
  }

  return index;
}

module.exports = { buildUserExerciseIndex, userExerciseWeights };
