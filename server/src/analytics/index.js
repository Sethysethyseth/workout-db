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

module.exports = {
  loadCatalog,
  normalizeExerciseName,
  resolveExercise,
  attributeSet,
  getStimulusMultiplier,
  computeSetMetrics,
  estimateOneRepMax,
  computeTonnage,
};
