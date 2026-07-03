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
// { rir, sessions, first, latest, best, delta } (epley values, unrounded,
// first/latest by session chronology) or null when no RIR bucket spans
// MIN_MATCHED_SESSIONS distinct sessions.
function computeMatchedEffortTrend(enrichedSets) {
  // rir -> Map(performedAtMs -> best epley in that session at that rir)
  const buckets = new Map();

  for (const set of enrichedSets) {
    const rir = set.input.effortRir;
    const epley = set.metrics.e1rm.epley;
    if (rir === null || epley === null) continue;

    let sessions = buckets.get(rir);
    if (!sessions) {
      sessions = new Map();
      buckets.set(rir, sessions);
    }
    const performedMs = set.performedAt.getTime();
    const current = sessions.get(performedMs);
    if (current === undefined || epley > current) {
      sessions.set(performedMs, epley);
    }
  }

  // Most distinct sessions wins; tie-break: lower RIR (closer to failure,
  // where e1RM estimates are most accurate).
  let chosenRir = null;
  let chosenSessions = null;
  for (const [rir, sessions] of buckets.entries()) {
    if (sessions.size < MIN_MATCHED_SESSIONS) continue;
    if (
      chosenSessions === null ||
      sessions.size > chosenSessions.size ||
      (sessions.size === chosenSessions.size && rir < chosenRir)
    ) {
      chosenRir = rir;
      chosenSessions = sessions;
    }
  }

  if (chosenSessions === null) return null;

  const chronological = Array.from(chosenSessions.entries()).sort(
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
  };
}

module.exports = { computeMatchedEffortTrend, MIN_MATCHED_SESSIONS };
