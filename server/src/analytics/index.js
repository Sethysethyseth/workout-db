const { loadCatalog } = require("./catalog");
const { normalizeExerciseName } = require("./normalize");
const { resolveExercise } = require("./resolve");
const { attributeSet } = require("./attribution");
const { getStimulusMultiplier } = require("./stimulusCurve");
const {
  computeSetMetrics,
  estimateOneRepMax,
  computeTonnage,
} = require("./setMetrics");
const { enrichSet } = require("./enrichSet");
const {
  aggregateMuscleVolume,
  computeWeeksInRange,
} = require("./aggregate");

module.exports = {
  loadCatalog,
  normalizeExerciseName,
  resolveExercise,
  attributeSet,
  getStimulusMultiplier,
  computeSetMetrics,
  estimateOneRepMax,
  computeTonnage,
  enrichSet,
  aggregateMuscleVolume,
  computeWeeksInRange,
};
