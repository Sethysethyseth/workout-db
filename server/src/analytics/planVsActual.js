// Execution fidelity Mechanism A (L2): join actual sets to their explicit
// plan and measure how faithfully the plan was run.
//
// Template path: planLookup values are TemplateSet arrays keyed by
// templateExerciseId (live TemplateSet rows - unchanged).
// Block path: planLookup values are SessionExercise.plan snapshots
// `{ v, effort, effortCap, restSec, sets }` keyed by a harvest id
// (`block:<sessionExerciseId>`). The schema still has
// WorkoutSet.blockWorkoutSetId, but it is deliberately unused - block
// sessions are judged against the positional snapshot written at start
// (docs/specs/blocks-v2.md section 1 / 7.3).
//
// Pairing rule: within one (session, plan-key) group, actual sets
// sorted by order pair index-wise with planned sets sorted by order. Extra
// actual sets count toward volume but have no pair; missed planned sets
// lower volume adherence.

const { deriveEffortRir } = require("./effort");

function round2(n) {
  return Math.round(n * 100) / 100;
}

function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Resolve a planLookup entry to a sorted planned-set array.
 * Template entries are arrays; block entries are plan snapshots with `.sets`.
 */
function normalizePlanSets(planEntry) {
  if (!planEntry) return null;
  if (Array.isArray(planEntry)) {
    if (planEntry.length === 0) return null;
    return planEntry;
  }
  if (planEntry.sets && Array.isArray(planEntry.sets) && planEntry.sets.length > 0) {
    const effortCap = Boolean(planEntry.effortCap);
    return planEntry.sets.map((s, i) => ({
      effortCap,
      order: i + 1,
      reps: s.reps ?? null,
      repsMax: s.repsMax ?? null,
      durationSec: s.durationSec ?? null,
      weight: s.weight ?? null,
      rir: s.rir ?? null,
      rpe: s.rpe ?? null,
    }));
  }
  return null;
}

/**
 * Block-branch hit/miss extensions (docs/specs/blocks-v2.md section 7.5).
 * - durationSec target: logged durationSec >= planned
 * - reps range: logged reps inside [reps, repsMax]
 * - effortCap RPE: logged rpe <= planned rpe
 * - effortCap RIR: logged rir >= planned rir
 * Returns null when no applicable dimension is present.
 *
 * Not yet consumed by computeExecutionFidelity: Execution reports adherence
 * ratios and effort drift, not per-set hits. The cap rule reaches the output
 * through effort drift; a hit-rate metric built on this predicate is
 * deferred (docs/specs/blocks-v2.md sections 7.5 and 13).
 */
function judgePlanHit(actual, planned, { effortCap = false } = {}) {
  if (!actual || !planned) return null;

  let judged = false;

  if (planned.durationSec != null) {
    judged = true;
    if (actual.durationSec == null || actual.durationSec < planned.durationSec) {
      return false;
    }
  } else if (planned.reps != null && planned.repsMax != null) {
    judged = true;
    if (
      actual.reps == null ||
      actual.reps < planned.reps ||
      actual.reps > planned.repsMax
    ) {
      return false;
    }
  }

  if (effortCap) {
    if (planned.rpe != null) {
      judged = true;
      if (actual.rpe == null || actual.rpe > planned.rpe) return false;
    } else if (planned.rir != null) {
      judged = true;
      if (actual.rir == null || actual.rir < planned.rir) return false;
    }
  }

  return judged ? true : null;
}

// enrichedSets: the full enriched range (any exercises). planLookup:
// { [planKey]: TemplateSet[] | SessionExercise.plan snapshot } - the
// planned sets for every plan-linked set in range. Returns one
// row per resolved exercise that has at least one plan-linked set:
// { exerciseId, name, loadAdherence, volumeAdherence, effortDrift, sessions,
//   planned: { setsPerSession, reps, weight, effortRir },
//   actual:  { setsPerSession, reps, weight, effortRir } }
// loadAdherence/volumeAdherence are ratios (1 = exactly on plan),
// effortDrift is actual effort - planned effort on the RIR scale (positive =
// sandbagging); both sides pool RIR/RPE via deriveEffortRir. Each is null
// when no pair in range carries the data it needs. planned/actual concrete
// fields are means over all sets in participating groups (not index-paired);
// each field is independently null when no data.
function computeExecutionFidelity(enrichedSets, planLookup) {
  if (!planLookup) return [];

  // (performedAtMs | planKey) -> group of plan-linked sets,
  // resolved exercises only (unresolved sets are excluded from all metrics;
  // the summary's honesty note already counts them).
  const groups = new Map();
  for (const set of enrichedSets) {
    const planKey = set.input.templateExerciseId;
    if (planKey == null) continue;
    if (!set.resolution.resolved) continue;
    const planSets = normalizePlanSets(planLookup[planKey]);
    if (!planSets) continue;

    const key = `${set.performedAt.getTime()}|${planKey}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        exerciseId: set.resolution.catalogEntry.id,
        name: set.resolution.catalogEntry.name,
        performedMs: set.performedAt.getTime(),
        plan: planSets,
        sets: [],
      };
      groups.set(key, g);
    }
    g.sets.push(set);
  }

  // exerciseId -> accumulator across sessions.
  const acc = new Map();
  for (const g of groups.values()) {
    let a = acc.get(g.exerciseId);
    if (!a) {
      a = {
        name: g.name,
        loadRatios: [],
        effortDeltas: [],
        actualSetCount: 0,
        plannedSetCount: 0,
        sessions: new Set(),
        plannedReps: [],
        plannedWeights: [],
        plannedEfforts: [],
        actualReps: [],
        actualWeights: [],
        actualEfforts: [],
      };
      acc.set(g.exerciseId, a);
    }

    const actualSorted = g.sets
      .slice()
      .sort((x, y) => x.input.order - y.input.order);
    const planSorted = g.plan.slice().sort((x, y) => x.order - y.order);

    a.actualSetCount += actualSorted.length;
    a.plannedSetCount += planSorted.length;
    a.sessions.add(g.performedMs);

    for (const planned of planSorted) {
      if (planned.reps != null) a.plannedReps.push(planned.reps);
      if (planned.weight != null) a.plannedWeights.push(planned.weight);
      const plannedEffort = deriveEffortRir({
        rir: planned.rir,
        rpe: planned.rpe,
      });
      if (plannedEffort != null) a.plannedEfforts.push(plannedEffort);
    }
    for (const set of actualSorted) {
      const actual = set.input;
      if (actual.reps != null) a.actualReps.push(actual.reps);
      if (actual.weight != null) a.actualWeights.push(actual.weight);
      if (actual.effortRir != null) a.actualEfforts.push(actual.effortRir);
    }

    const pairCount = Math.min(actualSorted.length, planSorted.length);
    for (let i = 0; i < pairCount; i++) {
      const actual = actualSorted[i].input;
      const planned = planSorted[i];
      if (actual.weight != null && planned.weight != null && planned.weight > 0) {
        a.loadRatios.push(actual.weight / planned.weight);
      }
      const plannedEffort = deriveEffortRir({
        rir: planned.rir,
        rpe: planned.rpe,
      });
      if (actual.effortRir != null && plannedEffort != null) {
        const delta = actual.effortRir - plannedEffort;
        // A capped plan (RPE at most N / RIR at least N) is a ceiling, not a
        // target: a set easier than the cap is on plan, so only overshoot
        // (negative delta = harder than planned) counts as drift.
        a.effortDeltas.push(planned.effortCap ? Math.min(0, delta) : delta);
      }
    }
  }

  return Array.from(acc.entries())
    .sort(([, x], [, y]) => x.name.localeCompare(y.name))
    .map(([exerciseId, a]) => {
      const load = mean(a.loadRatios);
      const drift = mean(a.effortDeltas);
      const plannedReps = mean(a.plannedReps);
      const plannedWeight = mean(a.plannedWeights);
      const plannedEffort = mean(a.plannedEfforts);
      const actualReps = mean(a.actualReps);
      const actualWeight = mean(a.actualWeights);
      const actualEffort = mean(a.actualEfforts);
      const sessionCount = a.sessions.size;
      return {
        exerciseId,
        name: a.name,
        loadAdherence: load === null ? null : round2(load),
        volumeAdherence:
          a.plannedSetCount === 0
            ? null
            : round2(a.actualSetCount / a.plannedSetCount),
        effortDrift: drift === null ? null : round2(drift),
        sessions: sessionCount,
        planned: {
          setsPerSession: round2(a.plannedSetCount / sessionCount),
          reps: plannedReps === null ? null : round2(plannedReps),
          weight: plannedWeight === null ? null : round2(plannedWeight),
          effortRir: plannedEffort === null ? null : round2(plannedEffort),
        },
        actual: {
          setsPerSession: round2(a.actualSetCount / sessionCount),
          reps: actualReps === null ? null : round2(actualReps),
          weight: actualWeight === null ? null : round2(actualWeight),
          effortRir: actualEffort === null ? null : round2(actualEffort),
        },
      };
    });
}

module.exports = { computeExecutionFidelity, judgePlanHit, normalizePlanSets };
