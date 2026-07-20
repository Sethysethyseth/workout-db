const { estimateOneRepMax } = require("./setMetrics");

/**
 * PR detection for an exercise's enriched sets.
 *
 * Three PR types:
 * - weightPR: heaviest weight ever lifted
 * - repsAtWeightPR: more reps than any prior set at the same-or-higher weight
 * - e1rmPR: best Epley estimated 1RM
 *
 * Suppression rule: sets in an exercise's FIRST session never count (everything
 * is trivially a record on day one).
 *
 * Input: enriched sets for ONE exercise, in any order. Each set must have:
 * - performedAt: Date (session timestamp - serves as session identifier)
 * - input.weight: number | null
 * - input.reps: number | null
 * - metrics.e1rm.epley: number | null
 *
 * Output: array of PR records, each with:
 * - type: 'weightPR' | 'repsAtWeightPR' | 'e1rmPR'
 * - value: the record value (weight for weightPR, reps for repsAtWeightPR, e1rm for e1rmPR)
 * - weight: the weight (for all types)
 * - reps: the reps (for all types)
 * - performedAt: ISO string
 */
function detectPRs(enrichedSets) {
  if (!Array.isArray(enrichedSets) || enrichedSets.length === 0) {
    return [];
  }

  // Sort by performedAt for chronological processing
  const sorted = [...enrichedSets].sort(
    (a, b) => a.performedAt.getTime() - b.performedAt.getTime()
  );

  // Identify the first session (all sets with the earliest performedAt)
  const firstSessionMs = sorted[0].performedAt.getTime();

  // Track best-seen values before each set (for detecting PRs)
  let bestWeight = null;
  let bestE1rm = null;
  // weight -> best reps at that weight or higher
  const bestRepsAtWeight = new Map();

  const prs = [];

  for (const set of sorted) {
    const sessionMs = set.performedAt.getTime();
    const isFirstSession = sessionMs === firstSessionMs;

    const weight = set.input.weight;
    const reps = set.input.reps;
    const e1rm = set.metrics?.e1rm?.epley ?? null;

    // Only consider weight-bearing sets with weight > 0 and reps >= 1
    if (weight == null || weight <= 0 || reps == null || reps < 1) {
      continue;
    }

    // Check for PRs (only if not first session)
    if (!isFirstSession) {
      // Weight PR: heaviest weight ever
      if (bestWeight !== null && weight > bestWeight) {
        prs.push({
          type: "weightPR",
          value: weight,
          weight,
          reps,
          performedAt: set.performedAt.toISOString(),
        });
      }

      // e1RM PR: best estimated 1RM
      if (e1rm !== null && bestE1rm !== null && e1rm > bestE1rm) {
        prs.push({
          type: "e1rmPR",
          value: round2(e1rm),
          weight,
          reps,
          performedAt: set.performedAt.toISOString(),
        });
      }

      // Reps-at-weight PR: more reps than any prior set at the same-or-higher weight
      // Find the best reps among all prior sets at weight >= current weight
      let bestPriorRepsAtOrAbove = null;
      for (const [w, r] of bestRepsAtWeight) {
        if (w >= weight) {
          if (bestPriorRepsAtOrAbove === null || r > bestPriorRepsAtOrAbove) {
            bestPriorRepsAtOrAbove = r;
          }
        }
      }
      if (bestPriorRepsAtOrAbove !== null && reps > bestPriorRepsAtOrAbove) {
        prs.push({
          type: "repsAtWeightPR",
          value: reps,
          weight,
          reps,
          performedAt: set.performedAt.toISOString(),
        });
      }
    }

    // Update tracking regardless of first session (for subsequent comparisons)
    if (bestWeight === null || weight > bestWeight) {
      bestWeight = weight;
    }
    if (e1rm !== null && (bestE1rm === null || e1rm > bestE1rm)) {
      bestE1rm = e1rm;
    }
    // Track best reps at each weight
    const currentBestReps = bestRepsAtWeight.get(weight);
    if (currentBestReps === undefined || reps > currentBestReps) {
      bestRepsAtWeight.set(weight, reps);
    }
  }

  return prs;
}

/**
 * Compute standing PRs (current best per type) for an exercise.
 * Returns the all-time best for each PR type with the date achieved.
 *
 * Output: { weightPR, e1rmPR, repsAtWeightPR } where each is:
 * - null if no qualifying sets exist
 * - { value, weight, reps, performedAt } for the current standing record
 */
function computeStandingPRs(enrichedSets) {
  if (!Array.isArray(enrichedSets) || enrichedSets.length === 0) {
    return { weightPR: null, e1rmPR: null, repsAtWeightPR: null };
  }

  // Sort by performedAt
  const sorted = [...enrichedSets].sort(
    (a, b) => a.performedAt.getTime() - b.performedAt.getTime()
  );

  // Identify first session
  const firstSessionMs = sorted[0].performedAt.getTime();

  let standingWeightPR = null;
  let standingE1rmPR = null;
  let standingRepsAtWeightPR = null;

  // Track for reps-at-weight: weight -> { reps, performedAt }
  const bestRepsPerWeight = new Map();

  for (const set of sorted) {
    const sessionMs = set.performedAt.getTime();
    const isFirstSession = sessionMs === firstSessionMs;

    const weight = set.input.weight;
    const reps = set.input.reps;
    const e1rm = set.metrics?.e1rm?.epley ?? null;

    if (weight == null || weight <= 0 || reps == null || reps < 1) {
      continue;
    }

    // Track best weight
    if (standingWeightPR === null || weight > standingWeightPR.value) {
      standingWeightPR = {
        value: weight,
        weight,
        reps,
        performedAt: set.performedAt.toISOString(),
        isFirstSession,
      };
    }

    // Track best e1RM
    if (e1rm !== null) {
      if (standingE1rmPR === null || e1rm > standingE1rmPR.value) {
        standingE1rmPR = {
          value: round2(e1rm),
          weight,
          reps,
          performedAt: set.performedAt.toISOString(),
          isFirstSession,
        };
      }
    }

    // Track reps at weight
    const existing = bestRepsPerWeight.get(weight);
    if (!existing || reps > existing.reps) {
      bestRepsPerWeight.set(weight, {
        reps,
        performedAt: set.performedAt.toISOString(),
        isFirstSession,
      });
    }
  }

  // Find the highest-rep entry across all weights (the "reps-at-weight" standing PR)
  // This is the set with the most reps at any weight that hasn't been beaten at same-or-higher weight
  let maxReps = null;
  let maxRepsEntry = null;
  let maxRepsWeight = null;
  for (const [weight, entry] of bestRepsPerWeight) {
    if (maxReps === null || entry.reps > maxReps) {
      maxReps = entry.reps;
      maxRepsEntry = entry;
      maxRepsWeight = weight;
    }
  }
  if (maxRepsEntry !== null) {
    standingRepsAtWeightPR = {
      value: maxReps,
      weight: maxRepsWeight,
      reps: maxReps,
      performedAt: maxRepsEntry.performedAt,
      isFirstSession: maxRepsEntry.isFirstSession,
    };
  }

  // Clean up: remove isFirstSession markers
  const clean = (pr) => {
    if (!pr) return null;
    const { isFirstSession, ...rest } = pr;
    return rest;
  };

  return {
    weightPR: clean(standingWeightPR),
    e1rmPR: clean(standingE1rmPR),
    repsAtWeightPR: clean(standingRepsAtWeightPR),
  };
}

/**
 * Check if a specific set holds a PR at the time it was performed.
 * Used for marking set rows in completed session view.
 *
 * Input: enrichedSets for one exercise, the target set to check
 * Output: array of PR types the set holds (e.g., ['weightPR', 'e1rmPR'])
 */
function getPRsForSet(enrichedSets, targetSet) {
  if (!Array.isArray(enrichedSets) || enrichedSets.length === 0 || !targetSet) {
    return [];
  }

  const targetMs = targetSet.performedAt.getTime();
  const targetWeight = targetSet.input.weight;
  const targetReps = targetSet.input.reps;
  const targetE1rm = targetSet.metrics?.e1rm?.epley ?? null;

  if (targetWeight == null || targetWeight <= 0 || targetReps == null || targetReps < 1) {
    return [];
  }

  // Get all PRs
  const allPRs = detectPRs(enrichedSets);

  // Find PRs that match this set's performedAt, weight, and reps
  const types = [];
  for (const pr of allPRs) {
    if (
      pr.performedAt === targetSet.performedAt.toISOString() &&
      pr.weight === targetWeight &&
      pr.reps === targetReps
    ) {
      types.push(pr.type);
    }
  }

  return types;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  detectPRs,
  computeStandingPRs,
  getPRsForSet,
};
