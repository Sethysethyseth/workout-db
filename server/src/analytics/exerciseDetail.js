const { computeMatchedEffortTrend } = require("./matchedEffort");
const { computeWeeksInRange, filterInRange, toDate, MS_PER_WEEK } = require("./aggregate");
const { computeStandingPRs } = require("./prs");

// Fixed rep ladder for the rep-target calculator (N5). SETTLED July 10:
// 15 is in for hypertrophy-range lifters; 20 is rejected - that far above
// the trained range Epley's error exceeds a plate increment, so the number
// is noise even with the extrapolation flag.
const REP_TARGET_LADDER = [1, 3, 5, 8, 10, 12, 15];

// weeklyVolume span when the caller gives no range: the app's longest
// range preset. Totals/topSets/e1rmHistory stay all-time regardless - the
// detail view IS the long view; only the weekly chart needs bounding.
const DEFAULT_WEEKLY_VOLUME_WEEKS = 12;

function round2(n) {
  return Math.round(n * 100) / 100;
}

// The grouping key mirrors aggregateExerciseMetrics: post-enrichSet every
// resolved set carries resolution.catalogEntry.id - catalog id for catalog
// exercises, `user:<id>` for user exercises - so legacy name-matched rows
// and id-stamped rows of the same exercise share one key by construction.
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

function keyFromIdentity({ exerciseId, userExerciseId }) {
  if (userExerciseId != null) return `user:${userExerciseId}`;
  return exerciseId ?? null;
}

/**
 * All-time exercise roster for the Exercises tab lookup. One row per
 * resolved identity, NOT e1RM-gated (bodyweight/isometric movements
 * included). Dates serialize to ISO - this is a payload-facing module.
 */
function buildExerciseIndex(enrichedSets) {
  const groups = new Map();
  for (const set of enrichedSets) {
    const key = identityKeyOf(set);
    if (key === null) continue;
    let g = groups.get(key);
    if (!g) {
      g = {
        name: set.resolution.catalogEntry.name,
        sessions: new Set(),
        lastPerformedMs: null,
      };
      groups.set(key, g);
    }
    const performedMs = set.performedAt.getTime();
    g.sessions.add(performedMs);
    if (g.lastPerformedMs === null || performedMs > g.lastPerformedMs) {
      g.lastPerformedMs = performedMs;
    }
  }

  return Array.from(groups.entries())
    .map(([key, g]) => ({
      identity: identityFromKey(key),
      name: g.name,
      lastPerformed: new Date(g.lastPerformedMs).toISOString(),
      sessionCount: g.sessions.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Heaviest set wins; ties break to higher reps (the N2 topSet rule).
function isHeavier(candidate, incumbent) {
  if (incumbent === null) return true;
  if (candidate.input.weight > incumbent.input.weight) return true;
  return (
    candidate.input.weight === incumbent.input.weight &&
    (candidate.input.reps ?? -Infinity) > (incumbent.input.reps ?? -Infinity)
  );
}

function serializeTopSet(set) {
  return {
    weight: set.input.weight,
    reps: set.input.reps,
    performedAt: set.performedAt.toISOString(),
  };
}

function computeRepTargets(bestE1rm, loggedRepRange) {
  if (bestE1rm === null) return null;
  return REP_TARGET_LADDER.map((reps) => ({
    reps,
    // Inverted Epley; raw (round2 for payload noise only) - plate rounding
    // is a client concern because it depends on the display-unit pref.
    weight: round2(bestE1rm / (1 + reps / 30)),
    extrapolated:
      loggedRepRange === null ||
      reps < loggedRepRange.min ||
      reps > loggedRepRange.max,
  }));
}

function computeWeeklyVolume(sets, { from, to }) {
  const toDate_ = toDate(to);
  const fromDate = toDate(from);
  const toMs = toDate_.getTime();
  const weeks = computeWeeksInRange(fromDate, toDate_);
  const buckets = Array.from({ length: weeks }, () => ({
    effectiveSetsTotal: 0,
    stimulatingSetsTotal: 0,
    hasEffortData: false,
  }));

  for (const set of filterInRange(sets, { from: fromDate, to: toDate_ })) {
    if (!set.attribution.attributed) continue;
    const performedMs = set.performedAt.getTime();
    // Same anchored-at-`to` bucketing as aggregateMuscleVolume: bucket k
    // spans [to - (weeks-k) weeks, to - (weeks-k-1) weeks), last bucket
    // end-inclusive.
    // In-range guarantees k <= weeks-1; k = -1 only at the exact oldest
    // boundary of an exact-N-week range, which aggregate's bucketing puts
    // in bucket 0 - clamp to match.
    const k = Math.max(
      0,
      weeks - 1 - Math.floor((toMs - performedMs) / MS_PER_WEEK)
    );
    const bucket = buckets[k];
    bucket.effectiveSetsTotal += 1;
    if (set.metrics.stimulusMultiplier !== null) {
      bucket.stimulatingSetsTotal += set.metrics.stimulusMultiplier;
      bucket.hasEffortData = true;
    }
  }

  return buckets.map((bucket, k) => ({
    weekStart: new Date(toMs - (weeks - k) * MS_PER_WEEK).toISOString(),
    effectiveSets: round2(bucket.effectiveSetsTotal),
    stimulatingSets: bucket.hasEffortData
      ? round2(bucket.stimulatingSetsTotal)
      : null,
  }));
}

const MAX_TOP_SETS = 5;

/**
 * Whole-exercise detail payload. `enrichedSets` may be the user's full
 * all-time set list - the identity filter runs here (controller fetches,
 * engine computes). Core stats (totals, topSet(s), bestE1rm, e1rmHistory,
 * matchedEffortTrend, repTargets) are ALL-TIME - the detail is the long
 * view; `{ from, to }` bounds ONLY weeklyVolume (defaults to the trailing
 * DEFAULT_WEEKLY_VOLUME_WEEKS ending now). Returns null when the identity
 * has no sets.
 */
function buildExerciseDetail(enrichedSets, { exerciseId, userExerciseId, from, to } = {}) {
  const wantedKey = keyFromIdentity({ exerciseId, userExerciseId });
  if (wantedKey === null) return null;

  const sets = enrichedSets
    .filter((s) => identityKeyOf(s) === wantedKey)
    .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());
  if (sets.length === 0) return null;

  const name = sets[0].resolution.catalogEntry.name;

  // Totals (all-time). effectiveSets counts ATTRIBUTED sets - it differs
  // from `sets` only when attribution is missing (e.g. a user exercise
  // with no muscle designations); stimulating pools the per-set stimulus
  // multiplier, null when no set carries effort data.
  const sessionKeys = new Set();
  let attributedCount = 0;
  let stimulatingTotal = 0;
  let hasEffortData = false;
  let topSet = null;
  let bestE1rm = null;
  let repMin = null;
  let repMax = null;
  const sessionBestE1rm = new Map();

  for (const set of sets) {
    sessionKeys.add(set.performedAt.getTime());
    if (set.attribution.attributed) attributedCount += 1;
    if (set.metrics.stimulusMultiplier !== null) {
      stimulatingTotal += set.metrics.stimulusMultiplier;
      hasEffortData = true;
    }
    if (set.input.weight != null && isHeavier(set, topSet)) topSet = set;

    const epley = set.metrics.e1rm.epley;
    if (epley !== null) {
      if (bestE1rm === null || epley > bestE1rm) bestE1rm = epley;
      if (set.input.reps != null) {
        if (repMin === null || set.input.reps < repMin) repMin = set.input.reps;
        if (repMax === null || set.input.reps > repMax) repMax = set.input.reps;
      }
      const performedMs = set.performedAt.getTime();
      const current = sessionBestE1rm.get(performedMs);
      if (current === undefined || epley > current.e1rm) {
        sessionBestE1rm.set(performedMs, {
          date: set.performedAt.toISOString(),
          e1rm: epley,
        });
      }
    }
  }

  const topSets = sets
    .filter((s) => s.input.weight != null)
    .sort((a, b) => {
      if (b.input.weight !== a.input.weight) return b.input.weight - a.input.weight;
      const repsA = a.input.reps ?? -Infinity;
      const repsB = b.input.reps ?? -Infinity;
      if (repsB !== repsA) return repsB - repsA;
      return b.performedAt.getTime() - a.performedAt.getTime();
    })
    .slice(0, MAX_TOP_SETS)
    .map(serializeTopSet);

  const e1rmHistory = Array.from(sessionBestE1rm.entries())
    .sort(([a], [b]) => a - b)
    .map(([, point]) => ({ date: point.date, e1rm: round2(point.e1rm) }));

  const loggedRepRange = repMin === null ? null : { min: repMin, max: repMax };

  const now = new Date();
  const weeklyFrom =
    from ?? new Date(now.getTime() - DEFAULT_WEEKLY_VOLUME_WEEKS * MS_PER_WEEK);
  const weeklyTo = to ?? now;

  return {
    identity: identityFromKey(wantedKey),
    name,
    totals: {
      sessions: sessionKeys.size,
      sets: sets.length,
      effectiveSets: attributedCount,
      stimulatingSets: hasEffortData ? round2(stimulatingTotal) : null,
    },
    topSet: topSet === null ? null : serializeTopSet(topSet),
    topSets,
    bestE1rm: bestE1rm === null ? null : round2(bestE1rm),
    e1rmHistory,
    matchedEffortTrend: computeMatchedEffortTrend(sets),
    weeklyVolume: computeWeeklyVolume(sets, { from: weeklyFrom, to: weeklyTo }),
    repTargets: computeRepTargets(bestE1rm, loggedRepRange),
    loggedRepRange,
    personalRecords: computeStandingPRs(sets),
  };
}

module.exports = {
  buildExerciseIndex,
  buildExerciseDetail,
  REP_TARGET_LADDER,
  DEFAULT_WEEKLY_VOLUME_WEEKS,
};
