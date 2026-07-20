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
const { detectPRs } = require("./prs");

function round2(n) {
  return Math.round(n * 100) / 100;
}

const HONESTY_FRONT_REAR_DELT =
  "frontRearDelt cannot be computed: the exercise catalog's muscle taxonomy has no separate front/rear deltoid distinction (single 'shoulders' bucket).";

function identityKeyOf(set) {
  if (!set.resolution.resolved || !set.resolution.catalogEntry) return null;
  return set.resolution.catalogEntry.id;
}

function identityFromKey(key) {
  if (key.startsWith("user:")) {
    return { userExerciseId: Number(key.slice("user:".length)) };
  }
  return { exerciseId: key };
}

function computePRsInRange(allTimeSets, from, to) {
  const fromMs = toDate(from).getTime();
  const toMs = toDate(to).getTime();

  // Group all-time sets by exercise
  const byExercise = new Map();
  for (const set of allTimeSets) {
    const key = identityKeyOf(set);
    if (key === null) continue;
    if (!byExercise.has(key)) {
      byExercise.set(key, {
        name: set.resolution.catalogEntry.name,
        sets: [],
      });
    }
    byExercise.get(key).sets.push(set);
  }

  // Detect PRs for each exercise, filter to those in range
  const prs = [];
  for (const [key, group] of byExercise) {
    const exercisePRs = detectPRs(group.sets);
    for (const pr of exercisePRs) {
      const prMs = new Date(pr.performedAt).getTime();
      if (prMs >= fromMs && prMs <= toMs) {
        prs.push({
          ...pr,
          identity: identityFromKey(key),
          exerciseName: group.name,
        });
      }
    }
  }

  // Sort by performedAt
  return prs.sort(
    (a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime()
  );
}

function buildSummary(enrichedSets, { from, to, planLookup, userExercises, allTimeEnrichedSets }) {
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
  // Distinct sessions = distinct performedAt values among in-range sets
  // (same session key the aggregates already use). Empty sessions never
  // appear in enrichedSets, so they are not counted.
  const workoutCount = new Set(inRange.map((s) => s.performedAt.getTime())).size;
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

  const honestyNotes = [HONESTY_FRONT_REAR_DELT];
  const unresolvedCount = inRange.filter((s) => !s.resolution.resolved).length;
  if (unresolvedCount > 0) {
    honestyNotes.push(
      `${unresolvedCount} set(s) in this range had an unresolved exercise name and were excluded from all metrics.`
    );
  }

  // Compute PRs: requires all-time history to know what came before
  const prs = allTimeEnrichedSets
    ? computePRsInRange(allTimeEnrichedSets, from, to)
    : [];

  return {
    range: {
      from: toDate(from).toISOString(),
      to: toDate(to).toISOString(),
      weeks,
    },
    workoutCount,
    perMuscle,
    perExercise,
    prs,
    balance,
    execution,
    meta: { effortCoverage, seriesGranularity, honestyNotes },
  };
}

module.exports = { buildSummary };
