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

  test("weekly series buckets align to range end with inclusive last bucket", () => {
    const from = "2026-01-01T00:00:00Z";
    const to = "2026-01-15T00:00:00Z";
    const weeks = 2;

    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-01-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-01-14T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: to,
      }),
    ];

    const result = aggregateMuscleVolume(sets, { from, to });
    const chest = result.find((r) => r.muscle === "chest");
    expect(chest.series).toHaveLength(weeks);
    expect(chest.series[0].effectiveSets).toBeGreaterThan(0);
    // Bucket 1 holds the Jan-14 set AND the set at exactly `to` (inclusive
    // last bucket) - dropping the boundary set would halve this.
    expect(chest.series[1].effectiveSets).toBeCloseTo(
      chest.series[0].effectiveSets * 2,
      2
    );
    expect(chest.series[0].weekStart.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z"
    );
    expect(chest.series[1].weekEnd.toISOString()).toBe(
      "2026-01-15T00:00:00.000Z"
    );
  });

  test("muscle-empty week yields effectiveSets 0 and stimulatingSets null", () => {
    const from = "2026-01-01T00:00:00Z";
    const to = "2026-01-15T00:00:00Z";

    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-01-02T10:00:00Z",
      }),
    ];

    const result = aggregateMuscleVolume(sets, { from, to });
    const chest = result.find((r) => r.muscle === "chest");
    expect(chest.series[0].effectiveSets).toBeGreaterThan(0);
    expect(chest.series[1]).toEqual({
      weekStart: new Date("2026-01-08T00:00:00.000Z"),
      weekEnd: new Date("2026-01-15T00:00:00.000Z"),
      effectiveSets: 0,
      stimulatingSets: null,
    });
  });

  test("series effectiveSets sum equals effectiveSets * weeks within rounding", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateMuscleVolume(sets, { from, to });
    const chest = result.find((r) => r.muscle === "chest");
    const seriesSum = chest.series.reduce((s, w) => s + w.effectiveSets, 0);
    expect(seriesSum).toBeCloseTo(chest.effectiveSets * 2, 2);
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

    // weight/reps/rir come straight from the enriched set's carried input.
    expect(bench.bestSet.weight).toBe(110);
    expect(bench.bestSet.reps).toBe(5);
    expect(bench.bestSet.rir).toBe(1);
    expect(bench.bestSet.rpe).toBeNull();

    // Both sessions are at different RIRs (2 then 1), so no bucket reaches
    // 2 sessions -> matched-effort trend honestly degrades to null.
    expect(bench.matchedEffortTrend).toBeNull();
  });

  test("bestSet carries both rir and rpe for an RPE-logged best set", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rpe: 8,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 110,
        reps: 5,
        rpe: 9,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    const best = result[0].bestSet;
    expect(best.weight).toBe(110);
    expect(best.reps).toBe(5);
    expect(best.rir).toBeNull();
    expect(best.rpe).toBe(9);
  });

  test("matchedEffortTrend is computed per exercise from same-RIR sessions", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 105,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    const trend = result[0].matchedEffortTrend;
    expect(trend.rir).toBe(2);
    expect(trend.sessions).toBe(2);
    expect(trend.delta).toBeCloseTo(5 * (1 + 5 / 30), 6);
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
    expect(result[0].topSet).toBeNull();
    expect(result[0].topSetSeries).toEqual([]);
  });

  test("e1rmSeries dedupes same-session sets to max epley", () => {
    const shared = "2026-06-02T10:00:00Z";
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: shared,
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 110,
        reps: 5,
        rir: 1,
        performedAt: shared,
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    expect(result[0].e1rmSeries).toHaveLength(1);
    expect(result[0].e1rmSeries[0].epley).toBeCloseTo(110 * (1 + 5 / 30), 6);
  });

  test("e1rmSeries has one ascending point per session matching e1rmTrend endpoints", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 105,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-09T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 110,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-12T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    const bench = result[0];
    expect(bench.e1rmSeries).toHaveLength(3);
    expect(bench.e1rmSeries[0].epley).toBe(bench.e1rmTrend.first);
    expect(bench.e1rmSeries[2].epley).toBe(bench.e1rmTrend.latest);
    for (let i = 1; i < bench.e1rmSeries.length; i++) {
      expect(bench.e1rmSeries[i].performedAt.getTime()).toBeGreaterThan(
        bench.e1rmSeries[i - 1].performedAt.getTime()
      );
    }
  });

  test("exercise with no valid epley sets gets empty e1rmSeries", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    expect(result[0].e1rmSeries).toEqual([]);
  });

  test("topSet is the heaviest-weight set when highest-e1RM is a different set", () => {
    // 225x3 e1RM ≈ 247.5; 185x10 e1RM ≈ 246.7 — so bestSet is 225x3,
    // but topSet must be the heavier bar (225), not the higher-e1RM set.
    // Flip: make heaviest weight LOSE on e1RM so topSet != bestSet.
    // 200x10 e1RM ≈ 266.7; 225x3 e1RM ≈ 247.5 → bestSet = 200x10, topSet = 225x3.
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 200,
        reps: 10,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 225,
        reps: 3,
        rir: 1,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    const bench = result[0];
    expect(bench.bestSet.weight).toBe(200);
    expect(bench.bestSet.reps).toBe(10);
    expect(bench.topSet.weight).toBe(225);
    expect(bench.topSet.reps).toBe(3);
    expect(bench.topSet.performedAt.toISOString()).toBe(
      "2026-06-09T10:00:00.000Z"
    );
  });

  test("topSet exists when every set lacks a computable e1RM", () => {
    // weight without reps -> epley null, but topSet still picks the weight.
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 135,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 185,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    const bench = result[0];
    expect(bench.bestSet).toBeNull();
    expect(bench.e1rmSeries).toEqual([]);
    expect(bench.topSet).toEqual({
      weight: 185,
      reps: null,
      performedAt: new Date("2026-06-09T10:00:00.000Z"),
    });
  });

  test("topSet tie-break picks higher reps at the same weight", () => {
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 185,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-02T10:00:00Z",
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 185,
        reps: 8,
        rir: 2,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    expect(result[0].topSet.weight).toBe(185);
    expect(result[0].topSet.reps).toBe(8);
  });

  test("topSetSeries is one chronological heaviest-per-session entry, even without e1RM", () => {
    const shared = "2026-06-02T10:00:00Z";
    const sets = [
      enrichSet({
        exerciseName: BENCH,
        weight: 135,
        performedAt: shared,
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 155,
        performedAt: shared,
      }),
      enrichSet({
        exerciseName: BENCH,
        weight: 145,
        performedAt: "2026-06-09T10:00:00Z",
      }),
    ];

    const result = aggregateExerciseMetrics(sets, { from, to });
    const series = result[0].topSetSeries;
    expect(result[0].bestSet).toBeNull();
    expect(series).toHaveLength(2);
    expect(series[0]).toEqual({
      performedAt: new Date(shared),
      weight: 155,
      reps: null,
    });
    expect(series[1]).toEqual({
      performedAt: new Date("2026-06-09T10:00:00.000Z"),
      weight: 145,
      reps: null,
    });
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
