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

function filterInRange(enrichedSets, { from, to }) {
  const fromMs = toDate(from).getTime();
  const toMs = toDate(to).getTime();
  return enrichedSets.filter((s) => {
    const t = s.performedAt.getTime();
    return t >= fromMs && t <= toMs;
  });
}

function getWeekBucketIndex(performedMs, toMs, weeks) {
  for (let k = 0; k < weeks; k++) {
    const weekStart = toMs - (weeks - k) * MS_PER_WEEK;
    const weekEnd = toMs - (weeks - k - 1) * MS_PER_WEEK;
    if (k === weeks - 1) {
      if (performedMs >= weekStart && performedMs <= weekEnd) return k;
    } else if (performedMs >= weekStart && performedMs < weekEnd) {
      return k;
    }
  }
  return null;
}

function emptyWeekBucket() {
  return { effectiveSetsTotal: 0, stimulatingSetsTotal: 0, hasRirData: false };
}

function aggregateMuscleVolume(enrichedSets, { from, to }) {
  const fromDate = toDate(from);
  const toDate_ = toDate(to);
  const toMs = toDate_.getTime();

  const inRange = filterInRange(enrichedSets, { from: fromDate, to: toDate_ });

  // muscle -> accumulator
  const weeks = computeWeeksInRange(fromDate, toDate_);

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
        weekBuckets: Array.from({ length: weeks }, emptyWeekBucket),
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
    const bucketIdx = getWeekBucketIndex(performedMs, toMs, weeks);

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
        const bucket = a.weekBuckets[bucketIdx];
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
      series: a.weekBuckets.map((bucket, k) => ({
        weekStart: new Date(toMs - (weeks - k) * MS_PER_WEEK),
        weekEnd: new Date(toMs - (weeks - k - 1) * MS_PER_WEEK),
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
  aggregateMuscleVolume,
  aggregateExerciseMetrics,
  computeBalanceRatios,
  filterInRange,
  toDate,
  MS_PER_WEEK,
};
