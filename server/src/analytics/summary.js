const {
  computeWeeksInRange,
  seriesGranularityForRange,
  aggregateMuscleVolume,
  aggregateExerciseMetrics,
  computeBalanceRatios,
  filterInRange,
  toDate,
} = require("./aggregate");
const { computeExecutionFidelity } = require("./planVsActual");

function round2(n) {
  return Math.round(n * 100) / 100;
}

const HONESTY_FRONT_REAR_DELT =
  "frontRearDelt cannot be computed: the exercise catalog's muscle taxonomy has no separate front/rear deltoid distinction (single 'shoulders' bucket).";
const HONESTY_PR_DETECTION =
  "PR detection (tracked-vs-estimated) is not yet implemented; it requires full lift history beyond the selected range.";

function buildSummary(enrichedSets, { from, to, planLookup, userExercises }) {
  const weeks = computeWeeksInRange(from, to);
  // Granularity derives from the range (<= 14 days -> day cells), never a
  // second knob. Averages stay per-week regardless.
  const seriesGranularity = seriesGranularityForRange(from, to);
  const perMuscle = aggregateMuscleVolume(enrichedSets, {
    from,
    to,
    granularity: seriesGranularity,
  }).map((row) => ({
    ...row,
    series: row.series.map((p) => ({
      ...p,
      periodStart: p.periodStart.toISOString(),
      periodEnd: p.periodEnd.toISOString(),
    })),
  }));

  const perExercisePartial = aggregateExerciseMetrics(enrichedSets, {
    from,
    to,
  });
  const perExercise = perExercisePartial.map((entry) => {
    const serialized = {
      ...entry,
      e1rmSeries: entry.e1rmSeries.map((p) => ({
        ...p,
        performedAt: p.performedAt.toISOString(),
      })),
      topSetSeries: (entry.topSetSeries ?? []).map((p) => ({
        ...p,
        performedAt: p.performedAt.toISOString(),
      })),
    };
    const withBest = entry.bestSet
      ? {
          ...serialized,
          bestSet: {
            ...entry.bestSet,
            performedAt:
              entry.bestSet.performedAt === null
                ? null
                : entry.bestSet.performedAt.toISOString(),
          },
        }
      : serialized;
    if (!entry.topSet) return withBest;
    return {
      ...withBest,
      topSet: {
        ...entry.topSet,
        performedAt:
          entry.topSet.performedAt === null
            ? null
            : entry.topSet.performedAt.toISOString(),
      },
    };
  });

  const balance = computeBalanceRatios(perMuscle);

  const inRange = filterInRange(enrichedSets, { from, to });
  const execution = computeExecutionFidelity(inRange, planLookup);
  const attributedInRange = inRange.filter((s) => s.attribution.attributed);

  // Share of attributed sets carrying any effort signal (RIR or RPE - the
  // multiplier is computed from the pooled derived value).
  const effortCoverage =
    attributedInRange.length === 0
      ? null
      : round2(
          attributedInRange.filter(
            (s) => s.metrics.stimulusMultiplier !== null
          ).length / attributedInRange.length
        );

  const honestyNotes = [HONESTY_FRONT_REAR_DELT, HONESTY_PR_DETECTION];
  const unresolvedCount = inRange.filter((s) => !s.resolution.resolved).length;
  if (unresolvedCount > 0) {
    honestyNotes.push(
      `${unresolvedCount} set(s) in this range had an unresolved exercise name and were excluded from all metrics.`
    );
  }

  return {
    range: {
      from: toDate(from).toISOString(),
      to: toDate(to).toISOString(),
      weeks,
    },
    perMuscle,
    perExercise,
    prs: [],
    balance,
    execution,
    meta: { effortCoverage, seriesGranularity, honestyNotes },
  };
}

module.exports = { buildSummary };
