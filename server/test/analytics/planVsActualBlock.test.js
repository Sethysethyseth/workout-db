const {
  enrichSet,
  computeExecutionFidelity,
} = require("../../src/analytics");
const { judgePlanHit } = require("../../src/analytics/planVsActual");

const BENCH = "Barbell Bench Press - Medium Grip";
const BENCH_ID = "Barbell_Bench_Press_-_Medium_Grip";
const PLANK = "Plank";

// Snapshotted from computeExecutionFidelity on the template-only fixture
// BELOW, against the pre-change engine (BK10 delivery), before any edit to
// planVsActual.js. Template sessions must deep-equal this forever.
const TEMPLATE_BASELINE = [
  {
    exerciseId: "Barbell_Bench_Press_-_Medium_Grip",
    name: "Barbell Bench Press - Medium Grip",
    loadAdherence: 1,
    volumeAdherence: 1,
    effortDrift: 0,
    sessions: 1,
    planned: {
      setsPerSession: 3,
      reps: 8,
      weight: 100,
      effortRir: 2,
    },
    actual: {
      setsPerSession: 3,
      reps: 8,
      weight: 100,
      effortRir: 2,
    },
  },
];

function benchSet({
  weight,
  reps,
  rir,
  rpe,
  order,
  templateExerciseId,
  performedAt,
  durationSec,
}) {
  return enrichSet({
    exerciseName: BENCH,
    weight,
    reps,
    rir,
    rpe,
    order,
    templateExerciseId,
    performedAt,
    durationSec,
  });
}

function plankSet({
  durationSec,
  order,
  templateExerciseId,
  performedAt,
  weight,
  rpe,
  rir,
}) {
  return enrichSet({
    exerciseName: PLANK,
    weight: weight ?? null,
    reps: null,
    rpe,
    rir,
    order,
    templateExerciseId,
    performedAt,
    durationSec,
  });
}

const TEMPLATE_PLAN = {
  7: [
    { order: 1, reps: 8, weight: 100, rir: 2 },
    { order: 2, reps: 8, weight: 100, rir: 2 },
    { order: 3, reps: 8, weight: 100, rir: 2 },
  ],
};

function blockPlanKey(sessionExerciseId) {
  return `block:${sessionExerciseId}`;
}

function makeBlockPlan(sets, { effortCap = false, effort = "rir" } = {}) {
  return {
    v: 1,
    effort,
    effortCap,
    restSec: null,
    sets,
  };
}

describe("computeExecutionFidelity block branch", () => {
  test("exact block match equals exact template match fidelity", () => {
    const key = blockPlanKey(42);
    const planLookup = {
      [key]: makeBlockPlan([
        { reps: 8, repsMax: null, durationSec: null, weight: 100, rpe: null, rir: 2 },
        { reps: 8, repsMax: null, durationSec: null, weight: 100, rpe: null, rir: 2 },
        { reps: 8, repsMax: null, durationSec: null, weight: 100, rpe: null, rir: 2 },
      ]),
    };
    const sets = [1, 2, 3].map((order) =>
      benchSet({
        weight: 100,
        reps: 8,
        rir: 2,
        order,
        templateExerciseId: key,
        performedAt: "2026-06-02T10:00:00Z",
      })
    );

    const blockResult = computeExecutionFidelity(sets, planLookup);
    const templateSets = [1, 2, 3].map((order) =>
      benchSet({
        weight: 100,
        reps: 8,
        rir: 2,
        order,
        templateExerciseId: 7,
        performedAt: "2026-06-02T10:00:00Z",
      })
    );
    const templateResult = computeExecutionFidelity(templateSets, TEMPLATE_PLAN);

    expect(blockResult).toEqual(templateResult);
    expect(blockResult[0].loadAdherence).toBe(1);
    expect(blockResult[0].volumeAdherence).toBe(1);
    expect(blockResult[0].effortDrift).toBe(0);
  });

  test("capped plan: easier than the cap is zero drift, harder is overshoot", () => {
    const key = blockPlanKey(43);
    const planLookup = {
      [key]: makeBlockPlan(
        [
          { reps: 8, repsMax: null, durationSec: null, weight: 100, rpe: 7, rir: null },
          { reps: 8, repsMax: null, durationSec: null, weight: 100, rpe: 7, rir: null },
        ],
        { effortCap: true, effort: "rpe" }
      ),
    };
    const at = "2026-06-03T10:00:00Z";
    const under = [1, 2].map((order) =>
      benchSet({ weight: 100, reps: 8, rpe: 6, order, templateExerciseId: key, performedAt: at })
    );
    expect(computeExecutionFidelity(under, planLookup)[0].effortDrift).toBe(0);

    const over = [1, 2].map((order) =>
      benchSet({ weight: 100, reps: 8, rpe: 8, order, templateExerciseId: key, performedAt: at })
    );
    expect(computeExecutionFidelity(over, planLookup)[0].effortDrift).toBe(-1);

    // The same easier sets against an UNcapped target still read as drift.
    const uncapped = { [key]: { ...planLookup[key], effortCap: false } };
    expect(computeExecutionFidelity(under, uncapped)[0].effortDrift).toBe(1);
  });

  test("template-only fixture deep-equals pre-change snapshot", () => {
    const sets = [1, 2, 3].map((order) =>
      benchSet({
        weight: 100,
        reps: 8,
        rir: 2,
        order,
        templateExerciseId: 7,
        performedAt: "2026-06-02T10:00:00Z",
      })
    );
    expect(computeExecutionFidelity(sets, TEMPLATE_PLAN)).toEqual(
      TEMPLATE_BASELINE
    );
  });
});

describe("judgePlanHit block extensions (spec 7.5)", () => {
  test("reps range: 9 against 8-10 is hit; 11 is miss", () => {
    const planned = { reps: 8, repsMax: 10 };
    expect(judgePlanHit({ reps: 9 }, planned)).toBe(true);
    expect(judgePlanHit({ reps: 8 }, planned)).toBe(true);
    expect(judgePlanHit({ reps: 10 }, planned)).toBe(true);
    expect(judgePlanHit({ reps: 11 }, planned)).toBe(false);
    expect(judgePlanHit({ reps: 7 }, planned)).toBe(false);
  });

  test("durationSec: 44 against 45 is miss; 45 and 50 are hit", () => {
    const planned = { durationSec: 45 };
    expect(judgePlanHit({ durationSec: 44 }, planned)).toBe(false);
    expect(judgePlanHit({ durationSec: 45 }, planned)).toBe(true);
    expect(judgePlanHit({ durationSec: 50 }, planned)).toBe(true);
  });

  test("effortCap RPE: 7 against cap 7 is hit; 8 is miss", () => {
    const planned = { rpe: 7 };
    expect(judgePlanHit({ rpe: 7 }, planned, { effortCap: true })).toBe(true);
    expect(judgePlanHit({ rpe: 6 }, planned, { effortCap: true })).toBe(true);
    expect(judgePlanHit({ rpe: 8 }, planned, { effortCap: true })).toBe(false);
  });

  test("effortCap RIR: 2 against cap 2 is hit; 1 is miss", () => {
    const planned = { rir: 2 };
    expect(judgePlanHit({ rir: 2 }, planned, { effortCap: true })).toBe(true);
    expect(judgePlanHit({ rir: 3 }, planned, { effortCap: true })).toBe(true);
    expect(judgePlanHit({ rir: 1 }, planned, { effortCap: true })).toBe(false);
  });
});

describe("block branch duration pairing still volumes", () => {
  test("timed block sets count toward volumeAdherence when paired", () => {
    const key = blockPlanKey(99);
    const planLookup = {
      [key]: makeBlockPlan(
        [
          {
            reps: null,
            repsMax: null,
            durationSec: 45,
            weight: null,
            rpe: null,
            rir: null,
          },
        ],
        { effort: null }
      ),
    };
    const sets = [
      plankSet({
        durationSec: 45,
        order: 1,
        templateExerciseId: key,
        performedAt: "2026-06-02T10:00:00Z",
      }),
    ];
    const [row] = computeExecutionFidelity(sets, planLookup);
    expect(row.exerciseId).toBeTruthy();
    expect(row.volumeAdherence).toBe(1);
  });
});
