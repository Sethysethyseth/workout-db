const {
  enrichSet,
  computeExecutionFidelity,
  buildSummary,
} = require("../../src/analytics");

const BENCH = "Barbell Bench Press - Medium Grip";
const BENCH_ID = "Barbell_Bench_Press_-_Medium_Grip";

function benchSet({ weight, reps, rir, rpe, order, templateExerciseId, performedAt }) {
  return enrichSet({
    exerciseName: BENCH,
    weight,
    reps,
    rir,
    rpe,
    order,
    templateExerciseId,
    performedAt,
  });
}

// Plan: 3 sets of 100 kg @ RIR 2 for templateExercise 7.
const PLAN = {
  7: [
    { order: 1, reps: 8, weight: 100, rir: 2 },
    { order: 2, reps: 8, weight: 100, rir: 2 },
    { order: 3, reps: 8, weight: 100, rir: 2 },
  ],
};

describe("computeExecutionFidelity", () => {
  test("on-plan session -> adherence 1, drift 0", () => {
    const sets = [1, 2, 3].map((order) =>
      benchSet({
        weight: 100, reps: 8, rir: 2, order,
        templateExerciseId: 7,
        performedAt: "2026-06-02T10:00:00Z",
      })
    );

    const [row] = computeExecutionFidelity(sets, PLAN);
    expect(row.exerciseId).toBe(BENCH_ID);
    expect(row.loadAdherence).toBe(1);
    expect(row.volumeAdherence).toBe(1);
    expect(row.effortDrift).toBe(0);
    expect(row.sessions).toBe(1);
  });

  test("sandbagging: heavier RIR than planned -> positive drift; lighter load -> adherence < 1", () => {
    const sets = [
      benchSet({ weight: 95, reps: 8, rir: 3, order: 1, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
      benchSet({ weight: 95, reps: 8, rir: 4, order: 2, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
      benchSet({ weight: 95, reps: 8, rir: 3, order: 3, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
    ];

    const [row] = computeExecutionFidelity(sets, PLAN);
    expect(row.loadAdherence).toBe(0.95);
    // drift: (1 + 2 + 1) / 3 = 1.33
    expect(row.effortDrift).toBe(1.33);
  });

  test("overreaching: lower RIR than planned -> negative drift", () => {
    const sets = [
      benchSet({ weight: 105, reps: 8, rir: 0, order: 1, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
    ];
    const [row] = computeExecutionFidelity(sets, PLAN);
    expect(row.effortDrift).toBe(-2);
    expect(row.loadAdherence).toBe(1.05);
  });

  test("skipped and extra sets move volumeAdherence; pairing is order-wise", () => {
    // Session 1: only 2 of 3 planned sets. Session 2: 4 sets (one unplanned).
    const s1 = [1, 2].map((order) =>
      benchSet({ weight: 100, reps: 8, rir: 2, order, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" })
    );
    const s2 = [1, 2, 3, 4].map((order) =>
      benchSet({ weight: 100, reps: 8, rir: 2, order, templateExerciseId: 7, performedAt: "2026-06-09T10:00:00Z" })
    );

    const [row] = computeExecutionFidelity([...s1, ...s2], PLAN);
    // (2 + 4) actual / (3 + 3) planned = 1
    expect(row.volumeAdherence).toBe(1);
    expect(row.sessions).toBe(2);
    // The unpaired 4th set contributes no load ratio: 2 + 3 pairs, all 1.0.
    expect(row.loadAdherence).toBe(1);
  });

  test("null degradation: no weights planned -> loadAdherence null; no RIR logged -> drift null", () => {
    const planNoWeightNoRir = { 7: [{ order: 1, reps: 8, weight: null, rir: null }] };
    const sets = [
      benchSet({ weight: 100, reps: 8, order: 1, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
    ];
    const [row] = computeExecutionFidelity(sets, planNoWeightNoRir);
    expect(row.loadAdherence).toBeNull();
    expect(row.effortDrift).toBeNull();
    expect(row.volumeAdherence).toBe(1);
  });

  test("effort pooling: actual RPE 8 vs planned RIR 2 -> drift 0", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, rpe: 8, order: 1, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
    ];
    const [row] = computeExecutionFidelity(sets, PLAN);
    expect(row.effortDrift).toBe(0);
  });

  test("effort pooling: actual RPE 9 vs planned RIR 2 -> drift -1 (overreaching)", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, rpe: 9, order: 1, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
    ];
    const [row] = computeExecutionFidelity(sets, PLAN);
    expect(row.effortDrift).toBe(-1);
  });

  test("effort pooling: RPE-planned sets pair with RIR-logged actuals", () => {
    const planRpe = { 7: [{ order: 1, reps: 8, weight: 100, rir: null, rpe: 8 }] };
    const sets = [
      benchSet({ weight: 100, reps: 8, rir: 3, order: 1, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
    ];
    const [row] = computeExecutionFidelity(sets, planRpe);
    // Planned RPE 8 -> effort 2; actual RIR 3 -> +1 (sandbagging).
    expect(row.effortDrift).toBe(1);
  });

  test("sets without templateExerciseId, unresolved sets, and unknown plan ids are excluded", () => {
    const sets = [
      // Ad-hoc set, no plan linkage.
      benchSet({ weight: 100, reps: 8, rir: 2, order: 1, performedAt: "2026-06-02T10:00:00Z" }),
      // Plan id not in lookup.
      benchSet({ weight: 100, reps: 8, rir: 2, order: 1, templateExerciseId: 99, performedAt: "2026-06-02T10:00:00Z" }),
      // Unresolved exercise with plan linkage.
      enrichSet({
        exerciseName: "Nonexistent Made Up Exercise",
        weight: 100, reps: 8, rir: 2, order: 1,
        templateExerciseId: 7,
        performedAt: "2026-06-02T10:00:00Z",
      }),
    ];
    expect(computeExecutionFidelity(sets, PLAN)).toEqual([]);
  });

  test("no planLookup -> empty array", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, rir: 2, order: 1, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
    ];
    expect(computeExecutionFidelity(sets, undefined)).toEqual([]);
  });
});

describe("buildSummary execution wiring", () => {
  const from = "2026-06-01T00:00:00Z";
  const to = "2026-06-15T00:00:00Z";

  test("execution populated when planLookup provided, [] when absent", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, rir: 2, order: 1, templateExerciseId: 7, performedAt: "2026-06-02T10:00:00Z" }),
    ];

    const withPlan = buildSummary(sets, { from, to, planLookup: PLAN });
    expect(withPlan.execution.length).toBe(1);
    expect(withPlan.execution[0].exerciseId).toBe(BENCH_ID);

    const withoutPlan = buildSummary(sets, { from, to });
    expect(withoutPlan.execution).toEqual([]);
  });

  test("out-of-range plan-linked sets are excluded from execution", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, rir: 2, order: 1, templateExerciseId: 7, performedAt: "2026-07-20T10:00:00Z" }),
    ];
    const summary = buildSummary(sets, { from, to, planLookup: PLAN });
    expect(summary.execution).toEqual([]);
  });
});
