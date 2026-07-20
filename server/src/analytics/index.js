const { loadCatalog } = require("./catalog");
const { normalizeExerciseName } = require("./normalize");
const { resolveExercise } = require("./resolve");
const { attributeSet } = require("./attribution");
const { getStimulusMultiplier } = require("./stimulusCurve");
const { deriveEffortRir } = require("./effort");
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
  computeDaysInRange,
  seriesGranularityForRange,
  filterInRange,
  toDate,
} = require("./aggregate");
const { buildSummary } = require("./summary");
const { searchCatalog } = require("./searchCatalog");
const {
  buildExerciseIndex,
  buildExerciseDetail,
  REP_TARGET_LADDER,
} = require("./exerciseDetail");
const {
  detectPRs,
  computeStandingPRs,
  getPRsForSet,
} = require("./prs");

module.exports = {
  loadCatalog,
  normalizeExerciseName,
  resolveExercise,
  attributeSet,
  getStimulusMultiplier,
  deriveEffortRir,
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
  computeDaysInRange,
  seriesGranularityForRange,
  filterInRange,
  toDate,
  buildSummary,
  searchCatalog,
  buildExerciseIndex,
  buildExerciseDetail,
  REP_TARGET_LADDER,
  detectPRs,
  computeStandingPRs,
  getPRsForSet,
};
