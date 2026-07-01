const {
  enrichSet,
  aggregateMuscleVolume,
  aggregateExerciseMetrics,
  computeBalanceRatios,
  computeWeeksInRange,
} = require("../../src/analytics");

const BENCH = "Barbell Bench Press - Medium Grip";

describe("computeWeeksInRange", () => {
  test("exactly 7 days -> 1", () => {
    expect(
      computeWeeksInRange("2026-06-01T00:00:00Z", "2026-06-08T00:00:00Z")
    ).toBe(1);
  });

  test("8 days -> 2", () => {
    expect(
      computeWeeksInRange("2026-06-01T00:00:00Z", "2026-06-09T00:00:00Z")
    ).toBe(2);
  });

  test("1 day -> 1 (never 0)", () => {
    expect(
      computeWeeksInRange("2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z")
    ).toBe(1);
  });

  test("same from === to -> 1", () => {
    expect(
      computeWeeksInRange("2026-06-01T00:00:00Z", "2026-06-01T00:00:00Z")
    ).toBe(1);
  });

  test("reversed range -> 1", () => {
    expect(
      computeWeeksInRange("2026-06-08T00:00:00Z", "2026-06-01T00:00:00Z")
    ).toBe(1);
  });
});

describe("aggregateMuscleVolume", () => {
  const from = "2026-06-01T00:00:00Z";
  const to = "2026-06-15T00:00:00Z"; // 14 days -> 2 weeks

  // Curated bench weights (chest 0.65 / triceps 0.2 / shoulders 0.15).
  const benchMuscles = enrichSet({
    exerciseName: BENCH,
    weight: 100,
    reps: 5,
    rir: 2,
    performedAt: from,
  }).attribution.muscles;

  test("effectiveSets sums across sets regardless of RIR; stimulating only RIR-bearing", () => {
    const sets = [
      // Week 1, with RIR.
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      // Week 2, no RIR.
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateMuscleVolume(sets, { from, to });
    const chest = result.find((r) => r.muscle === "chest");

    const round2 = (n) => Math.round(n * 100) / 100;
    // effectiveSets: (0.65 + 0.65) / 2 weeks = 0.65
    expect(chest.effectiveSets).toBe(round2((benchMuscles.chest * 2) / 2));
    // stimulatingSets: only set 1 (rir 2 -> 0.95): round2(0.65*0.95 / 2) = 0.31
    expect(chest.stimulatingSets).toBe(round2((benchMuscles.chest * 0.95) / 2));
    // frequency: 2 distinct sessions / 2 weeks = 1
    expect(chest.frequency).toBe(1);
    // daysSinceLast: to (06-15) - last (06-09) = 6
    expect(chest.daysSinceLast).toBe(6);

    // Sorted alphabetically: chest, shoulders, triceps
    expect(result.map((r) => r.muscle)).toEqual([
      "chest",
      "shoulders",
      "triceps",
    ]);
  });

  test("muscle with only RIR-less sets gets stimulatingSets: null (not 0)", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        performedAt: "2026-06-02T10:00:00Z",
      }),
    ];

    const result = aggregateMuscleVolume(sets, { from, to });
    const chest = result.find((r) => r.muscle === "chest");
    expect(chest.stimulatingSets).toBeNull();
    expect(chest.effectiveSets).toBeGreaterThan(0);
  });

  test("frequency counts distinct sessions, not sets (shared performedAt)", () => {
    const shared = "2026-06-03T10:00:00Z";
    const sets = [
      enrichSet({ exerciseName: BENCH, weight: 100, reps: 5, rir: 2, performedAt: shared }),
      enrichSet({ exerciseName: BENCH, weight: 90, reps: 8, rir: 3, performedAt: shared }),
    ];

    const result = aggregateMuscleVolume(sets, { from, to });
    const chest = result.find((r) => r.muscle === "chest");
    // 1 distinct session / 2 weeks = 0.5
    expect(chest.frequency).toBe(0.5);
  });

  test("daysSinceLast matches hand-computed difference", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-10T00:00:00Z",
      }),
    ];
    const result = aggregateMuscleVolume(sets, { from, to });
    // to (06-15) - last (06-10) = 5 days
    expect(result.find((r) => r.muscle === "chest").daysSinceLast).toBe(5);
  });

  test("set outside [from, to] is excluded entirely", () => {
    const sets = [
      // Before range.
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-05-01T00:00:00Z",
      }),
      // After range.
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-07-01T00:00:00Z",
      }),
    ];
    const result = aggregateMuscleVolume(sets, { from, to });
    expect(result).toEqual([]);
  });
});

describe("aggregateExerciseMetrics", () => {
  const from = "2026-06-01T00:00:00Z";
  const to = "2026-06-15T00:00:00Z";

  test("first/latest/best/delta and bestSet match the highest-e1RM set", () => {
    const sets = [
      // Chronologically first, lower e1RM.
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      // Chronologically last, higher e1RM (this is the best set).
      enrichSet({
        exerciseName: BENCH,
        weight: 110,
        reps: 5,
        rir: 1,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    expect(result.length).toBe(1);
    const bench = result[0];
    expect(bench.exerciseId).toBe("Barbell_Bench_Press_-_Medium_Grip");

    const firstE1rm = 100 * (1 + 5 / 30);
    const latestE1rm = 110 * (1 + 5 / 30);
    expect(bench.e1rmTrend.first).toBeCloseTo(firstE1rm, 6);
    expect(bench.e1rmTrend.latest).toBeCloseTo(latestE1rm, 6);
    expect(bench.e1rmTrend.best).toBeCloseTo(latestE1rm, 6);
    expect(bench.e1rmTrend.delta).toBeCloseTo(latestE1rm - firstE1rm, 6);

    // bestSet identifies the highest-e1RM set via performedAt + e1rm.
    expect(bench.bestSet.e1rm.epley).toBeCloseTo(latestE1rm, 6);
    expect(bench.bestSet.performedAt.toISOString()).toBe(
      "2026-06-09T10:00:00.000Z"
    );

    // weight/reps are algebraically recovered from tonnage + epley (exact
    // inverse of the formulas that produced them), not fabricated. rir is
    // genuinely unrecoverable (lossy stimulus-curve mapping) and stays null.
    expect(bench.bestSet.weight).toBeCloseTo(110, 6);
    expect(bench.bestSet.reps).toBeCloseTo(5, 6);
    expect(bench.bestSet.rir).toBeNull();
  });

  test("unresolved exerciseName is excluded from output entirely", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: "Nonexistent Made Up Exercise",
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-03T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    expect(result.length).toBe(1);
    expect(result[0].exerciseId).toBe("Barbell_Bench_Press_-_Medium_Grip");
  });

  test("group whose sets all lack weight/reps -> e1rmTrend all null, bestSet null", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    expect(result.length).toBe(1);
    expect(result[0].e1rmTrend).toEqual({
      first: null,
      latest: null,
      best: null,
      delta: null,
    });
    expect(result[0].bestSet).toBeNull();
  });
});

describe("computeBalanceRatios", () => {
  test("correct pushPull and quadHam from effectiveSets", () => {
    const perMuscle = [
      { muscle: "chest", effectiveSets: 6 },
      { muscle: "lats", effectiveSets: 3 },
      { muscle: "quadriceps", effectiveSets: 4 },
      { muscle: "hamstrings", effectiveSets: 2 },
    ];
    const balance = computeBalanceRatios(perMuscle);
    expect(balance.pushPull).toBe(2); // 6 / 3
    expect(balance.quadHam).toBe(2); // 4 / 2
    expect(balance.frontRearDelt).toBeNull();
  });

  test("a muscle group summing to 0 -> that ratio is null (no divide-by-zero)", () => {
    const perMuscle = [
      { muscle: "chest", effectiveSets: 6 },
      { muscle: "quadriceps", effectiveSets: 4 },
      // No pull muscles, no hamstrings.
    ];
    const balance = computeBalanceRatios(perMuscle);
    expect(balance.pushPull).toBeNull();
    expect(balance.quadHam).toBeNull();
    expect(balance.frontRearDelt).toBeNull();
  });
});
