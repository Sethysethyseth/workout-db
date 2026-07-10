const { computeMatchedEffortTrend } = require("./matchedEffort");

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Muscle-group membership for balance ratios. Named constants (mirrors the
// STIMULUS_CURVE / TRACKABLE_CATEGORIES style) so the taxonomy is easy to find
// and re-tune. Keys match the catalog's muscle bucket names.
const PUSH_MUSCLES = ["chest", "shoulders", "triceps"];
const PULL_MUSCLES = ["lats", "middle back", "traps", "biceps"];
const QUAD_MUSCLES = ["quadriceps"];
const HAM_MUSCLES = ["hamstrings"];

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function computeWeeksInRange(from, to) {
  const fromDate = toDate(from);
  const toDate_ = toDate(to);
  return Math.max(1, Math.ceil((toDate_ - fromDate) / MS_PER_WEEK));
}

function computeDaysInRange(from, to) {
  const fromDate = toDate(from);
  const toDate_ = toDate(to);
  return Math.max(1, Math.ceil((toDate_ - fromDate) / MS_PER_DAY));
}

// Series granularity DERIVES FROM THE RANGE - never a second knob (custom
// bucket lengths were rejected July 9: "sets per 10 days" is a number no
// lifter can benchmark). Short ranges show the actual training rhythm day
// by day; sets/week stays the only volume denominator everywhere.
const DAY_SERIES_MAX_DAYS = 14;

function seriesGranularityForRange(from, to) {
  return computeDaysInRange(from, to) <= DAY_SERIES_MAX_DAYS ? "day" : "week";
}

function filterInRange(enrichedSets, { from, to }) {
  const fromMs = toDate(from).getTime();
  const toMs = toDate(to).getTime();
  return enrichedSets.filter((s) => {
    const t = s.performedAt.getTime();
    return t >= fromMs && t <= toMs;
  });
}

// Buckets are anchored at the range end and walk backwards; the last bucket
// is inclusive of `to` so a set logged at the exact range end still counts.
function getBucketIndex(performedMs, toMs, count, bucketMs) {
  for (let k = 0; k < count; k++) {
    const bucketStart = toMs - (count - k) * bucketMs;
    const bucketEnd = toMs - (count - k - 1) * bucketMs;
    if (k === count - 1) {
      if (performedMs >= bucketStart && performedMs <= bucketEnd) return k;
    } else if (performedMs >= bucketStart && performedMs < bucketEnd) {
      return k;
    }
  }
  return null;
}

function emptyBucket() {
  return { effectiveSetsTotal: 0, stimulatingSetsTotal: 0, hasRirData: false };
}

function aggregateMuscleVolume(enrichedSets, { from, to, granularity = "week" }) {
  const fromDate = toDate(from);
  const toDate_ = toDate(to);
  const toMs = toDate_.getTime();

  const inRange = filterInRange(enrichedSets, { from: fromDate, to: toDate_ });

  // muscle -> accumulator. Averages ALWAYS divide by weeks (sets/week is the
  // only volume denominator anywhere); granularity only shapes the series.
  const weeks = computeWeeksInRange(fromDate, toDate_);
  const bucketMs = granularity === "day" ? MS_PER_DAY : MS_PER_WEEK;
  const bucketCount =
    granularity === "day" ? computeDaysInRange(fromDate, toDate_) : weeks;

  const acc = new Map();
  const getAcc = (muscle) => {
    let a = acc.get(muscle);
    if (!a) {
      a = {
        effectiveSetsTotal: 0,
        stimulatingSetsTotal: 0,
        hasRirData: false,
        sessions: new Set(),
        lastPerformedMs: null,
        buckets: Array.from({ length: bucketCount }, emptyBucket),
      };
      acc.set(muscle, a);
    }
    return a;
  };

  for (const set of inRange) {
    const eff = set.metrics.effectiveContribution;
    if (!eff) continue;
    const stim = set.metrics.stimulatingContribution;
    const performedMs = set.performedAt.getTime();
    const bucketIdx = getBucketIndex(performedMs, toMs, bucketCount, bucketMs);

    for (const [muscle, fraction] of Object.entries(eff)) {
      if (!fraction) continue; // nonzero fractions only
      const a = getAcc(muscle);
      a.effectiveSetsTotal += fraction;
      a.sessions.add(performedMs);
      if (a.lastPerformedMs === null || performedMs > a.lastPerformedMs) {
        a.lastPerformedMs = performedMs;
      }
      if (stim !== null) {
        a.stimulatingSetsTotal += stim[muscle];
        a.hasRirData = true;
      }
      if (bucketIdx !== null) {
        const bucket = a.buckets[bucketIdx];
        bucket.effectiveSetsTotal += fraction;
        if (stim !== null) {
          bucket.stimulatingSetsTotal += stim[muscle];
          bucket.hasRirData = true;
        }
      }
    }
  }

  return Array.from(acc.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([muscle, a]) => ({
      muscle,
      effectiveSets: round2(a.effectiveSetsTotal / weeks),
      stimulatingSets: a.hasRirData
        ? round2(a.stimulatingSetsTotal / weeks)
        : null,
      frequency: round2(a.sessions.size / weeks),
      daysSinceLast: Math.round((toMs - a.lastPerformedMs) / MS_PER_DAY),
      series: a.buckets.map((bucket, k) => ({
        periodStart: new Date(toMs - (bucketCount - k) * bucketMs),
        periodEnd: new Date(toMs - (bucketCount - k - 1) * bucketMs),
        effectiveSets: round2(bucket.effectiveSetsTotal),
        stimulatingSets: bucket.hasRirData
          ? round2(bucket.stimulatingSetsTotal)
          : null,
      })),
    }));
}

function aggregateExerciseMetrics(enrichedSets, { from, to }) {
  const inRange = filterInRange(enrichedSets, { from, to });

  // catalog id -> { name, sets: [] }. Resolved sets only.
  const groups = new Map();
  for (const set of inRange) {
    if (!set.resolution.resolved) continue;
    const entry = set.resolution.catalogEntry;
    let g = groups.get(entry.id);
    if (!g) {
      g = { name: entry.name, sets: [] };
      groups.set(entry.id, g);
    }
    g.sets.push(set);
  }

  const result = [];
  for (const [exerciseId, g] of groups.entries()) {
    const sorted = g.sets
      .slice()
      .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());

    const validSets = sorted.filter((s) => s.metrics.e1rm.epley !== null);

    let e1rmTrend = { first: null, latest: null, best: null, delta: null };
    let bestSet = null;
    let e1rmSeries = [];

    if (validSets.length > 0) {
      const first = validSets[0].metrics.e1rm.epley;
      const latest = validSets[validSets.length - 1].metrics.e1rm.epley;

      let bestSetEnriched = validSets[0];
      for (const s of validSets) {
        if (s.metrics.e1rm.epley > bestSetEnriched.metrics.e1rm.epley) {
          bestSetEnriched = s;
        }
      }
      const best = bestSetEnriched.metrics.e1rm.epley;

      e1rmTrend = { first, latest, best, delta: latest - first };
      bestSet = {
        weight: bestSetEnriched.input.weight,
        reps: bestSetEnriched.input.reps,
        rir: bestSetEnriched.input.rir,
        rpe: bestSetEnriched.input.rpe,
        performedAt: bestSetEnriched.performedAt,
        e1rm: bestSetEnriched.metrics.e1rm,
      };

      const sessionBest = new Map();
      for (const s of validSets) {
        const performedMs = s.performedAt.getTime();
        const epley = s.metrics.e1rm.epley;
        const current = sessionBest.get(performedMs);
        if (current === undefined || epley > current.epley) {
          sessionBest.set(performedMs, {
            performedAt: s.performedAt,
            epley,
          });
        }
      }
      e1rmSeries = Array.from(sessionBest.values()).sort(
        (a, b) => a.performedAt.getTime() - b.performedAt.getTime()
      );
    }

    // Heaviest weight actually lifted - independent of e1RM / validSets.
    // Null only when no set carries a weight. Tie-break: higher reps.
    let topSet = null;
    let topSetEnriched = null;
    for (const s of sorted) {
      if (s.input.weight == null) continue;
      if (
        topSetEnriched === null ||
        s.input.weight > topSetEnriched.input.weight ||
        (s.input.weight === topSetEnriched.input.weight &&
          (s.input.reps ?? 0) > (topSetEnriched.input.reps ?? 0))
      ) {
        topSetEnriched = s;
      }
    }
    if (topSetEnriched) {
      topSet = {
        weight: topSetEnriched.input.weight,
        reps: topSetEnriched.input.reps,
        performedAt: topSetEnriched.performedAt,
      };
    }

    // One entry per session: heaviest weight (same tie-break), chronological.
    // Weight-carrying sets only - not filtered by validSets/e1RM.
    const sessionTop = new Map();
    for (const s of sorted) {
      if (s.input.weight == null) continue;
      const performedMs = s.performedAt.getTime();
      const current = sessionTop.get(performedMs);
      if (
        current === undefined ||
        s.input.weight > current.weight ||
        (s.input.weight === current.weight &&
          (s.input.reps ?? 0) > (current.reps ?? 0))
      ) {
        sessionTop.set(performedMs, {
          performedAt: s.performedAt,
          weight: s.input.weight,
          reps: s.input.reps,
        });
      }
    }
    const topSetSeries = Array.from(sessionTop.values()).sort(
      (a, b) => a.performedAt.getTime() - b.performedAt.getTime()
    );

    result.push({
      exerciseId,
      name: g.name,
      e1rmTrend,
      e1rmSeries,
      bestSet,
      topSet,
      topSetSeries,
      matchedEffortTrend: computeMatchedEffortTrend(sorted),
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function sumGroupEffectiveSets(perMuscle, groupMuscles) {
  let sum = 0;
  for (const row of perMuscle) {
    if (groupMuscles.includes(row.muscle)) sum += row.effectiveSets;
  }
  return sum;
}

function ratioOrNull(numerator, denominator) {
  if (!denominator) return null; // avoid divide-by-zero / Infinity
  return round2(numerator / denominator);
}

function computeBalanceRatios(perMuscle) {
  const push = sumGroupEffectiveSets(perMuscle, PUSH_MUSCLES);
  const pull = sumGroupEffectiveSets(perMuscle, PULL_MUSCLES);
  const quad = sumGroupEffectiveSets(perMuscle, QUAD_MUSCLES);
  const ham = sumGroupEffectiveSets(perMuscle, HAM_MUSCLES);

  return {
    pushPull: ratioOrNull(push, pull),
    quadHam: ratioOrNull(quad, ham),
    frontRearDelt: null,
  };
}

module.exports = {
  computeWeeksInRange,
  computeDaysInRange,
  seriesGranularityForRange,
  DAY_SERIES_MAX_DAYS,
  aggregateMuscleVolume,
  aggregateExerciseMetrics,
  computeBalanceRatios,
  filterInRange,
  toDate,
  MS_PER_WEEK,
};
