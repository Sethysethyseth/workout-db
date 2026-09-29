/**
 * Timed-set safety (BK10): sets with durationSec and null reps must contribute
 * nothing to volume, e1RM, strength scores, PRs or stimulating-set counts,
 * and must never throw. Pin each exported metric function that consumes sets.
 */
const {
  enrichSet,
  computeSetMetrics,
  estimateOneRepMax,
  computeTonnage,
  attributeSet,
  resolveExercise,
  aggregateMuscleVolume,
  aggregateExerciseMetrics,
  computeMatchedEffortTrend,
  detectPRs,
  computeStandingPRs,
  buildSummary,
  buildExerciseDetail,
  computeExecutionFidelity,
} = require("../../src/analytics");

const BENCH = "Barbell Bench Press - Medium Grip";
const PLANK = "Plank";

const FROM = "2026-06-01T00:00:00Z";
const TO = "2026-06-15T00:00:00Z";
const DAY1 = "2026-06-02T10:00:00Z";
const DAY2 = "2026-06-09T10:00:00Z";

function strengthSet(overrides = {}) {
  return enrichSet({
    exerciseName: BENCH,
    weight: 100,
    reps: 5,
    rir: 2,
    order: 1,
    performedAt: DAY1,
    ...overrides,
  });
}

function timedSet({ weight = null, durationSec = 45, performedAt = DAY1, rir } = {}) {
  return enrichSet({
    exerciseName: PLANK,
    weight,
    reps: null,
    durationSec,
    rir: rir ?? null,
    order: 99,
    performedAt,
  });
}

function timedSetWeight20(overrides = {}) {
  return timedSet({ weight: 20, ...overrides });
}

describe("timedSetsSafety - primitives never throw / stay null", () => {
  test("estimateOneRepMax and computeTonnage ignore null reps", () => {
    expect(estimateOneRepMax(20, null)).toEqual({ epley: null, brzycki: null });
    expect(computeTonnage(20, null)).toBeNull();
    expect(() => estimateOneRepMax(null, null)).not.toThrow();
    expect(() => computeTonnage(null, null)).not.toThrow();
  });

  test("computeSetMetrics: timed-shaped input yields null strength metrics", () => {
    const attribution = attributeSet(
      resolveExercise({ exerciseName: PLANK })
    );
    const metrics = computeSetMetrics(
      { weight: 20, reps: null, rir: 2 },
      attribution
    );
    expect(metrics.tonnage).toBeNull();
    expect(metrics.e1rm).toEqual({ epley: null, brzycki: null });
  });
});

describe("timedSetsSafety - enrichSet pipeline", () => {
  test("timed set (durationSec, reps null) does not throw", () => {
    expect(() => timedSet()).not.toThrow();
    expect(() => timedSetWeight20()).not.toThrow();
    expect(() => timedSet({ rir: 1 })).not.toThrow();
  });

  test("timed set contributes no tonnage, e1RM, volume or stimulus", () => {
    const set = timedSetWeight20({ rir: 1 });
    expect(set.input.reps).toBeNull();
    expect(set.input.durationSec).toBe(45);
    expect(set.metrics.tonnage).toBeNull();
    expect(set.metrics.e1rm.epley).toBeNull();
    expect(set.metrics.e1rm.brzycki).toBeNull();
    expect(set.metrics.effectiveContribution).toBeNull();
    expect(set.metrics.stimulatingContribution).toBeNull();
    expect(set.metrics.stimulusMultiplier).toBeNull();
  });
});

describe("timedSetsSafety - aggregateMuscleVolume", () => {
  test("adding a timed set leaves muscle volume unchanged", () => {
    const base = [strengthSet(), strengthSet({ order: 2, performedAt: DAY2 })];
    const withTimed = [...base, timedSetWeight20({ rir: 0 })];

    const a = aggregateMuscleVolume(base, { from: FROM, to: TO });
    const b = aggregateMuscleVolume(withTimed, { from: FROM, to: TO });
    expect(b).toEqual(a);
  });
});

describe("timedSetsSafety - aggregateExerciseMetrics", () => {
  test("adding a timed set leaves per-exercise strength metrics unchanged", () => {
    const base = [
      strengthSet(),
      strengthSet({ weight: 105, reps: 3, order: 1, performedAt: DAY2 }),
    ];
    const withTimed = [
      ...base,
      timedSetWeight20({ performedAt: DAY2 }),
      // Same exercise name path: a timed bench-shaped set must not steal topSet.
      enrichSet({
        exerciseName: BENCH,
        weight: 200,
        reps: null,
        durationSec: 45,
        order: 9,
        performedAt: DAY2,
      }),
    ];

    const a = aggregateExerciseMetrics(base, { from: FROM, to: TO });
    const b = aggregateExerciseMetrics(withTimed, { from: FROM, to: TO });
    expect(b).toEqual(a);
  });
});

describe("timedSetsSafety - computeMatchedEffortTrend", () => {
  test("adding a timed set leaves matched-effort trend unchanged", () => {
    const base = [
      strengthSet({ rir: 2, performedAt: DAY1 }),
      strengthSet({ weight: 102, reps: 5, rir: 2, performedAt: DAY2 }),
    ];
    const withTimed = [...base, timedSet({ rir: 2, weight: 20 })];

    expect(computeMatchedEffortTrend(withTimed)).toEqual(
      computeMatchedEffortTrend(base)
    );
  });
});

describe("timedSetsSafety - detectPRs / computeStandingPRs", () => {
  test("adding a timed set leaves PR detection unchanged", () => {
    const base = [
      strengthSet({ performedAt: DAY1 }),
      strengthSet({ weight: 110, reps: 3, performedAt: DAY2 }),
    ];
    const withTimed = [...base, timedSetWeight20({ performedAt: DAY2 })];

    expect(detectPRs(withTimed)).toEqual(detectPRs(base));
    expect(computeStandingPRs(withTimed)).toEqual(computeStandingPRs(base));
  });
});

describe("timedSetsSafety - buildExerciseDetail", () => {
  test("adding a timed set leaves detail totals / topSet / stimulating unchanged", () => {
    const benchId = strengthSet().resolution.catalogEntry.id;
    const base = [
      strengthSet({ performedAt: DAY1 }),
      strengthSet({ weight: 105, reps: 4, performedAt: DAY2 }),
    ];
    const withTimed = [
      ...base,
      enrichSet({
        exerciseName: BENCH,
        weight: 250,
        reps: null,
        durationSec: 45,
        rir: 0,
        order: 9,
        performedAt: DAY2,
      }),
    ];

    const a = buildExerciseDetail(base, { exerciseId: benchId });
    const b = buildExerciseDetail(withTimed, { exerciseId: benchId });
    expect(b.totals.effectiveSets).toBe(a.totals.effectiveSets);
    expect(b.totals.stimulatingSets).toEqual(a.totals.stimulatingSets);
    expect(b.topSet).toEqual(a.topSet);
    expect(b.bestE1rm).toEqual(a.bestE1rm);
    expect(b.personalRecords).toEqual(a.personalRecords);
    expect(b.matchedEffortTrend).toEqual(a.matchedEffortTrend);
    // Raw set count includes the timed log; strength math must not.
    expect(b.totals.sets).toBe(a.totals.sets + 1);
  });
});

describe("timedSetsSafety - buildSummary", () => {
  test("adding a timed set leaves summary strength / muscle / PR fields unchanged", () => {
    const base = [
      strengthSet({ performedAt: DAY1 }),
      strengthSet({ weight: 105, reps: 4, performedAt: DAY2 }),
    ];
    const withTimed = [...base, timedSetWeight20({ rir: 1, performedAt: DAY1 })];

    const a = buildSummary(base, { from: FROM, to: TO });
    const b = buildSummary(withTimed, { from: FROM, to: TO });

    expect(b.perMuscle).toEqual(a.perMuscle);
    expect(b.perExercise).toEqual(a.perExercise);
    expect(b.balance).toEqual(a.balance);
    expect(b.prs).toEqual(a.prs);
  });
});

describe("timedSetsSafety - computeExecutionFidelity", () => {
  test("timed actual against duration plan does not throw; volume pairs", () => {
    const planLookup = {
      "block:1": {
        v: 1,
        effort: null,
        effortCap: false,
        restSec: null,
        sets: [
          {
            reps: null,
            repsMax: null,
            durationSec: 45,
            weight: null,
            rpe: null,
            rir: null,
          },
        ],
      },
    };
    const sets = [
      enrichSet({
        exerciseName: PLANK,
        reps: null,
        durationSec: 50,
        order: 1,
        templateExerciseId: "block:1",
        performedAt: DAY1,
      }),
    ];
    expect(() => computeExecutionFidelity(sets, planLookup)).not.toThrow();
    const [row] = computeExecutionFidelity(sets, planLookup);
    expect(row.volumeAdherence).toBe(1);
  });
});
