function normalizeExerciseName(name) {
  if (name === null || name === undefined) return "";
  return String(name)
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = { normalizeExerciseName };
