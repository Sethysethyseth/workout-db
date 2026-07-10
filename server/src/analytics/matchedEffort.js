// Matched-effort progression (L2): e1RM compared ONLY across sets taken at
// the same effort on the same exercise. Removes the effort confound that
// makes a plain e1RM trend dishonest (a back-off set at RIR 4 and a grinder
// at RIR 1 are not comparable). Buckets match on the exact derived effort
// value (input.effortRir - RIR, or RIR = 10 - RPE when only RPE was logged),
// so a set logged at RIR 2 and a set logged at RPE 8 land in the SAME
// bucket; RPE 8.5 (-> 1.5) only matches other 1.5s. No banding - unchanged
// policy, the values just may be fractional now.

// A bucket needs at least this many distinct sessions to form a trend.
const MIN_MATCHED_SESSIONS = 2;

// enrichedSets: the already-resolved sets of ONE exercise. Returns
// { rir, sessions, first, latest, best, delta, effortUnit } (epley values,
// unrounded, first/latest by session chronology) or null when no RIR bucket
// spans MIN_MATCHED_SESSIONS distinct sessions. effortUnit is "rpe" only when
// every contributing set in the chosen bucket was RPE-only-logged; else "rir".
function computeMatchedEffortTrend(enrichedSets) {
  // rir -> { sessions: Map(performedAtMs -> best epley), allRpeOnly: bool }
  const buckets = new Map();

  for (const set of enrichedSets) {
    const rir = set.input.effortRir;
    const epley = set.metrics.e1rm.epley;
    if (rir === null || epley === null) continue;

    const rpeOnly = set.input.rpe != null && set.input.rir == null;
    let bucket = buckets.get(rir);
    if (!bucket) {
      bucket = { sessions: new Map(), allRpeOnly: true };
      buckets.set(rir, bucket);
    }
    if (!rpeOnly) bucket.allRpeOnly = false;

    const performedMs = set.performedAt.getTime();
    const current = bucket.sessions.get(performedMs);
    if (current === undefined || epley > current) {
      bucket.sessions.set(performedMs, epley);
    }
  }

  // Most distinct sessions wins; tie-break: lower RIR (closer to failure,
  // where e1RM estimates are most accurate).
  let chosenRir = null;
  let chosenBucket = null;
  for (const [rir, bucket] of buckets.entries()) {
    if (bucket.sessions.size < MIN_MATCHED_SESSIONS) continue;
    if (
      chosenBucket === null ||
      bucket.sessions.size > chosenBucket.sessions.size ||
      (bucket.sessions.size === chosenBucket.sessions.size && rir < chosenRir)
    ) {
      chosenRir = rir;
      chosenBucket = bucket;
    }
  }

  if (chosenBucket === null) return null;

  const chronological = Array.from(chosenBucket.sessions.entries()).sort(
    ([a], [b]) => a - b
  );
  const values = chronological.map(([, epley]) => epley);
  const first = values[0];
  const latest = values[values.length - 1];
  const best = Math.max(...values);

  return {
    rir: chosenRir,
    sessions: chronological.length,
    first,
    latest,
    best,
    delta: latest - first,
    effortUnit: chosenBucket.allRpeOnly ? "rpe" : "rir",
  };
}

module.exports = { computeMatchedEffortTrend, MIN_MATCHED_SESSIONS };
