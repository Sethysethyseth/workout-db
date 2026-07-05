function normalizeExerciseName(name) {
  if (name === null || name === undefined) return "";
  return String(name)
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Deterministic plural fold for lookup fallbacks: strips one trailing "s"
// from an already-normalized name. Guarded against "ss" endings ("press",
// "leg press") and very short strings so it can never mangle a real word.
// Returns the input unchanged when the fold does not apply.
function foldExerciseNamePlural(normalizedName) {
  const name = String(normalizedName || "");
  if (name.length <= 3) return name;
  if (!name.endsWith("s") || name.endsWith("ss")) return name;
  return name.slice(0, -1);
}

module.exports = { normalizeExerciseName, foldExerciseNamePlural };
