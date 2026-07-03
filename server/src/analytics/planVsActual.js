// Execution fidelity Mechanism A (L2): join actual sets to their explicit
// plan (TemplateSet snapshots) and measure how faithfully the plan was run.
// Only template-linked sets participate - the schema has no path from a
// logged set to a BlockWorkoutSet, so block plans are an honest gap (same
// pattern as frontRearDelt), not silently approximated.
//
// Pairing rule: within one (session, templateExercise) group, actual sets
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

// enrichedSets: the full enriched range (any exercises). planLookup:
// { [templateExerciseId]: [{ order, reps, weight, rir, rpe }] } - the
// planned sets for every templateExercise referenced in range. Returns one
// row per resolved exercise that has at least one plan-linked set:
// { exerciseId, name, loadAdherence, volumeAdherence, effortDrift, sessions }
// loadAdherence/volumeAdherence are ratios (1 = exactly on plan),
// effortDrift is actual effort - planned effort on the RIR scale (positive =
// sandbagging); both sides pool RIR/RPE via deriveEffortRir. Each is null
// when no pair in range carries the data it needs.
function computeExecutionFidelity(enrichedSets, planLookup) {
  if (!planLookup) return [];

  // (performedAtMs | templateExerciseId) -> group of plan-linked sets,
  // resolved exercises only (unresolved sets are excluded from all metrics;
  // the summary's honesty note already counts them).
  const groups = new Map();
  for (const set of enrichedSets) {
    const templateExerciseId = set.input.templateExerciseId;
    if (templateExerciseId == null) continue;
    if (!set.resolution.resolved) continue;
    const plan = planLookup[templateExerciseId];
    if (!plan || plan.length === 0) continue;

    const key = `${set.performedAt.getTime()}|${templateExerciseId}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        exerciseId: set.resolution.catalogEntry.id,
        name: set.resolution.catalogEntry.name,
        performedMs: set.performedAt.getTime(),
        plan,
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
        a.effortDeltas.push(actual.effortRir - plannedEffort);
      }
    }
  }

  return Array.from(acc.entries())
    .sort(([, x], [, y]) => x.name.localeCompare(y.name))
    .map(([exerciseId, a]) => {
      const load = mean(a.loadRatios);
      const drift = mean(a.effortDeltas);
      return {
        exerciseId,
        name: a.name,
        loadAdherence: load === null ? null : round2(load),
        volumeAdherence:
          a.plannedSetCount === 0
            ? null
            : round2(a.actualSetCount / a.plannedSetCount),
        effortDrift: drift === null ? null : round2(drift),
        sessions: a.sessions.size,
      };
    });
}

module.exports = { computeExecutionFidelity };
