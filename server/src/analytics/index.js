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
const { computeMatchedEffortTrend } = require("./matchedEffort");
const { computeExecutionFidelity } = require("./planVsActual");
const {
  aggregateMuscleVolume,
  aggregateExerciseMetrics,
  computeBalanceRatios,
  computeWeeksInRange,
  filterInRange,
  toDate,
} = require("./aggregate");
const { buildSummary } = require("./summary");

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
  computeMatchedEffortTrend,
  computeExecutionFidelity,
  aggregateMuscleVolume,
  aggregateExerciseMetrics,
  computeBalanceRatios,
  computeWeeksInRange,
  filterInRange,
  toDate,
  buildSummary,
};
