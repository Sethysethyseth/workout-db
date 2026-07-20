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
 *
 * weightPR and e1rmPR: all-time best, including first session (a lifter's
 * heaviest-ever bench is their heaviest-ever bench even if it happened on
 * day one).
 *
 * repsAtWeightPR: DERIVED from detectPRs events to ensure one definition.
 * Selection (frontier-seat decision): pick the event at the HEAVIEST weight;
 * tie-break by more reps, then by more recent performedAt. Rationale: of the
 * rep records the lifter has actually set under the real rule, surface the
 * most impressive one, so a light warmup can never outrank real work.
 */
function computeStandingPRs(enrichedSets) {
  if (!Array.isArray(enrichedSets) || enrichedSets.length === 0) {
    return { weightPR: null, e1rmPR: null, repsAtWeightPR: null };
  }

  // Chronological order so ties resolve to the EARLIEST occurrence rather
  // than to whatever order the caller happened to pass (the module's
  // standing ordering-independence rule - see detectPRs).
  const sorted = [...enrichedSets].sort(
    (a, b) => a.performedAt.getTime() - b.performedAt.getTime()
  );

  let standingWeightPR = null;
  let standingE1rmPR = null;

  for (const set of sorted) {
    const weight = set.input.weight;
    const reps = set.input.reps;
    const e1rm = set.metrics?.e1rm?.epley ?? null;

    if (weight == null || weight <= 0 || reps == null || reps < 1) {
      continue;
    }

    // Track best weight (all-time, including first session)
    if (standingWeightPR === null || weight > standingWeightPR.value) {
      standingWeightPR = {
        value: weight,
        weight,
        reps,
        performedAt: set.performedAt.toISOString(),
      };
    }

    // Track best e1RM (all-time, including first session)
    if (e1rm !== null) {
      if (standingE1rmPR === null || e1rm > standingE1rmPR.value) {
        standingE1rmPR = {
          value: round2(e1rm),
          weight,
          reps,
          performedAt: set.performedAt.toISOString(),
        };
      }
    }
  }

  // Derive repsAtWeightPR from detectPRs events (one definition, one code path)
  const prEvents = detectPRs(enrichedSets);
  const repsAtWeightEvents = prEvents.filter((e) => e.type === "repsAtWeightPR");

  let standingRepsAtWeightPR = null;
  for (const event of repsAtWeightEvents) {
    if (standingRepsAtWeightPR === null) {
      standingRepsAtWeightPR = event;
      continue;
    }
    // Pick heaviest weight
    if (event.weight > standingRepsAtWeightPR.weight) {
      standingRepsAtWeightPR = event;
    } else if (event.weight === standingRepsAtWeightPR.weight) {
      // Tie-break: more reps
      if (event.reps > standingRepsAtWeightPR.reps) {
        standingRepsAtWeightPR = event;
      } else if (event.reps === standingRepsAtWeightPR.reps) {
        // Tie-break: more recent performedAt
        if (event.performedAt > standingRepsAtWeightPR.performedAt) {
          standingRepsAtWeightPR = event;
        }
      }
    }
  }

  // Strip the 'type' field from the standing repsAtWeightPR if present
  if (standingRepsAtWeightPR !== null) {
    const { type, ...rest } = standingRepsAtWeightPR;
    standingRepsAtWeightPR = rest;
  }

  return {
    weightPR: standingWeightPR,
    e1rmPR: standingE1rmPR,
    repsAtWeightPR: standingRepsAtWeightPR,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  detectPRs,
  computeStandingPRs,
};
