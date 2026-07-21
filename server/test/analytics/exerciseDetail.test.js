const {
  enrichSet,
  buildExerciseIndex,
  buildExerciseDetail,
  REP_TARGET_LADDER,
} = require("../../src/analytics");
const { buildUserExerciseIndex } = require("../../src/analytics/userExercises");

const BENCH = "Barbell Bench Press - Medium Grip";
const BENCH_ID = "Barbell_Bench_Press_-_Medium_Grip";
const SQUAT = "Barbell Full Squat";
const PLANK = "Plank"; // bodyweight - weight-less sets, no computable e1RM

const round2 = (n) => Math.round(n * 100) / 100;

function benchSet({ performedAt, weight = 100, reps = 5, rir, rpe, byId = false }) {
  return enrichSet({
    exerciseName: byId ? null : BENCH,
    exerciseId: byId ? BENCH_ID : null,
    weight,
    reps,
    rir,
    rpe,
    performedAt,
  });
}

describe("buildExerciseIndex", () => {
  test("legacy name-matched and id-stamped rows share one identity row", () => {
    const sets = [
      benchSet({ performedAt: "2026-06-01T10:00:00Z" }),
      benchSet({ performedAt: "2026-06-03T10:00:00Z", byId: true }),
      benchSet({ performedAt: "2026-06-03T10:00:00Z", byId: true }),
    ];

    const index = buildExerciseIndex(sets);
    expect(index).toHaveLength(1);
    expect(index[0].identity).toEqual({ exerciseId: BENCH_ID });
    expect(index[0].name).toBe(BENCH);
    // 2 distinct sessions (two sets share a performedAt), not 3.
    expect(index[0].sessionCount).toBe(2);
    expect(index[0].lastPerformed).toBe(
      new Date("2026-06-03T10:00:00Z").toISOString()
    );
  });

  test("not e1RM-gated: bodyweight/isometric movements appear", () => {
    const sets = [
      enrichSet({
        exerciseName: PLANK,
        reps: 30,
        performedAt: "2026-06-02T10:00:00Z",
      }),
    ];

    const index = buildExerciseIndex(sets);
    expect(index).toHaveLength(1);
    expect(index[0].identity).toEqual({ exerciseId: "Plank" });
    expect(index[0].sessionCount).toBe(1);
  });

  test("user exercises index under userExerciseId identity", () => {
    const userIndex = buildUserExerciseIndex([
      { id: 7, name: "Pendlay Row", muscles: { "middle back": 1 } },
    ]);
    const sets = [
      enrichSet(
        { exerciseName: "Pendlay Row", weight: 135, reps: 5, performedAt: "2026-06-04T10:00:00Z" },
        userIndex
      ),
    ];

    const index = buildExerciseIndex(sets);
    expect(index).toHaveLength(1);
    expect(index[0].identity).toEqual({ userExerciseId: 7 });
    expect(index[0].name).toBe("Pendlay Row");
  });

  test("unresolved rows are excluded; roster sorts by name", () => {
    const sets = [
      enrichSet({ exerciseName: SQUAT, weight: 200, reps: 5, performedAt: "2026-06-01T10:00:00Z" }),
      enrichSet({ exerciseName: BENCH, weight: 100, reps: 5, performedAt: "2026-06-01T10:00:00Z" }),
      enrichSet({ exerciseName: "Totally Unknown Movement XYZ", weight: 50, reps: 5, performedAt: "2026-06-01T10:00:00Z" }),
    ];

    const index = buildExerciseIndex(sets);
    expect(index.map((r) => r.name)).toEqual([BENCH, SQUAT]);
  });
});

describe("buildExerciseDetail", () => {
  test("filters to the requested identity only", () => {
    const sets = [
      benchSet({ performedAt: "2026-06-01T10:00:00Z" }),
      enrichSet({ exerciseName: SQUAT, weight: 200, reps: 5, rir: 2, performedAt: "2026-06-01T10:00:00Z" }),
    ];

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(detail.name).toBe(BENCH);
    expect(detail.totals.sets).toBe(1);
  });

  test("returns null for an identity with no sets", () => {
    const sets = [benchSet({ performedAt: "2026-06-01T10:00:00Z" })];
    expect(buildExerciseDetail(sets, { exerciseId: "Barbell_Full_Squat" })).toBeNull();
    expect(buildExerciseDetail(sets, {})).toBeNull();
  });

  test("legacy name rows and id-stamped rows aggregate together", () => {
    const sets = [
      benchSet({ performedAt: "2026-06-01T10:00:00Z" }),
      benchSet({ performedAt: "2026-06-02T10:00:00Z", byId: true }),
    ];

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(detail.totals.sets).toBe(2);
    expect(detail.totals.sessions).toBe(2);
  });

  test("topSet is the heaviest weight (NOT the highest e1RM); tie-break higher reps", () => {
    const sets = [
      // Highest e1RM: 200 x 10 -> 266.67. Heaviest weight: 225 x 1 -> 232.5.
      benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 200, reps: 10, rir: 2 }),
      benchSet({ performedAt: "2026-06-02T10:00:00Z", weight: 225, reps: 1, rir: 2 }),
      // Same weight, more reps - wins the tie.
      benchSet({ performedAt: "2026-06-03T10:00:00Z", weight: 225, reps: 2, rir: 2 }),
    ];

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(detail.topSet.weight).toBe(225);
    expect(detail.topSet.reps).toBe(2);
    expect(detail.bestE1rm).toBe(round2(200 * (1 + 10 / 30)));
  });

  test("topSets: at most 5, weight-descending", () => {
    const weights = [100, 110, 120, 130, 140, 150, 160];
    const sets = weights.map((weight, i) =>
      benchSet({ performedAt: `2026-06-0${i + 1}T10:00:00Z`, weight, reps: 5 })
    );

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(detail.topSets.map((s) => s.weight)).toEqual([160, 150, 140, 130, 120]);
  });

  test("e1rmHistory keeps the per-session best, chronologically", () => {
    const day1 = "2026-06-01T10:00:00Z";
    const day2 = "2026-06-08T10:00:00Z";
    const sets = [
      benchSet({ performedAt: day2, weight: 105, reps: 5 }),
      benchSet({ performedAt: day1, weight: 100, reps: 5 }),
      benchSet({ performedAt: day1, weight: 100, reps: 8 }), // session best of day1
    ];

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(detail.e1rmHistory).toEqual([
      { date: new Date(day1).toISOString(), e1rm: round2(100 * (1 + 8 / 30)) },
      { date: new Date(day2).toISOString(), e1rm: round2(105 * (1 + 5 / 30)) },
    ]);
  });

  test("RPE-only sets carry effort: stimulating pools RIR and RPE signals", () => {
    const sets = [
      // rpe 8 -> derived RIR 2 -> multiplier 0.95 (same as rir: 2).
      benchSet({ performedAt: "2026-06-01T10:00:00Z", rpe: 8 }),
      benchSet({ performedAt: "2026-06-02T10:00:00Z", rir: 2 }),
    ];

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(detail.totals.stimulatingSets).toBe(round2(0.95 * 2));
    expect(detail.matchedEffortTrend).not.toBeNull();
    expect(detail.matchedEffortTrend.sessions).toBe(2);
  });

  test("no effort data anywhere -> stimulatingSets null, matched-effort null", () => {
    const sets = [
      benchSet({ performedAt: "2026-06-01T10:00:00Z" }),
      benchSet({ performedAt: "2026-06-02T10:00:00Z" }),
    ];

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(detail.totals.stimulatingSets).toBeNull();
    expect(detail.matchedEffortTrend).toBeNull();
  });

  test("rep targets: fixed ladder, inverted Epley, extrapolation flagged outside the logged rep range", () => {
    const sets = [
      // best e1RM = 250 * (1 + 6/30) = 300, logged reps 5..8
      benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 250, reps: 6, rir: 2 }),
      benchSet({ performedAt: "2026-06-02T10:00:00Z", weight: 200, reps: 5, rir: 2 }),
      benchSet({ performedAt: "2026-06-03T10:00:00Z", weight: 180, reps: 8, rir: 2 }),
    ];

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(REP_TARGET_LADDER).toEqual([1, 3, 5, 8, 10, 12, 15]);
    expect(detail.loggedRepRange).toEqual({ min: 5, max: 8 });
    expect(detail.repTargets.map((t) => t.reps)).toEqual(REP_TARGET_LADDER);

    const at5 = detail.repTargets.find((t) => t.reps === 5);
    expect(at5.weight).toBe(round2(300 / (1 + 5 / 30))); // 257.14
    expect(at5.extrapolated).toBe(false);

    const flagged = detail.repTargets.filter((t) => t.extrapolated).map((t) => t.reps);
    expect(flagged).toEqual([1, 3, 10, 12, 15]);
  });

  test("no computable e1RM (bodyweight rows) -> repTargets and bestE1rm null, detail still present", () => {
    const sets = [
      enrichSet({ exerciseName: PLANK, reps: 30, rir: 2, performedAt: "2026-06-01T10:00:00Z" }),
    ];

    const detail = buildExerciseDetail(sets, { exerciseId: "Plank" });
    expect(detail).not.toBeNull();
    expect(detail.bestE1rm).toBeNull();
    expect(detail.repTargets).toBeNull();
    expect(detail.loggedRepRange).toBeNull();
    expect(detail.topSet).toBeNull();
    expect(detail.totals.sets).toBe(1);
  });

  test("weeklyVolume: ranged buckets, attributed counts, effort-less buckets stay null", () => {
    const from = "2026-06-01T00:00:00Z";
    const to = "2026-06-15T00:00:00Z"; // 2 weeks
    const sets = [
      benchSet({ performedAt: "2026-06-02T10:00:00Z", rir: 2 }), // week 1
      benchSet({ performedAt: "2026-06-09T10:00:00Z" }), // week 2, no effort
      benchSet({ performedAt: "2026-06-10T10:00:00Z" }), // week 2, no effort
      benchSet({ performedAt: "2026-05-20T10:00:00Z" }), // outside range
    ];

    const detail = buildExerciseDetail(sets, {
      exerciseId: BENCH_ID,
      from: new Date(from),
      to: new Date(to),
    });

    expect(detail.weeklyVolume).toHaveLength(2);
    expect(detail.weeklyVolume[0].effectiveSets).toBe(1);
    expect(detail.weeklyVolume[0].stimulatingSets).toBe(0.95);
    expect(detail.weeklyVolume[1].effectiveSets).toBe(2);
    expect(detail.weeklyVolume[1].stimulatingSets).toBeNull();
    // Totals stay ALL-TIME (the range bounds only weeklyVolume).
    expect(detail.totals.sets).toBe(4);
  });

  test("weeklyVolume defaults to the trailing 12 weeks when no range is given", () => {
    const recent = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
    const sets = [benchSet({ performedAt: recent.toISOString(), rir: 2 })];

    const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });
    expect(detail.weeklyVolume).toHaveLength(12);
    expect(detail.weeklyVolume[11].effectiveSets).toBe(1);
  });

  describe("topSets dedupe (FP11)", () => {
    test("dedupe by (weight, reps), keeping earliest performedAt", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-29T10:00:00Z", weight: 220, reps: 5 }),
        benchSet({ performedAt: "2026-06-29T11:00:00Z", weight: 220, reps: 5 }),
        benchSet({ performedAt: "2026-07-13T10:00:00Z", weight: 220, reps: 5 }),
        benchSet({ performedAt: "2026-06-15T10:00:00Z", weight: 210, reps: 5 }),
        benchSet({ performedAt: "2026-06-15T11:00:00Z", weight: 210, reps: 5 }),
        benchSet({ performedAt: "2026-06-22T10:00:00Z", weight: 200, reps: 8 }),
      ];

      const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });

      expect(detail.topSets).toHaveLength(3);
      expect(detail.topSets.map((s) => `${s.weight}x${s.reps}`)).toEqual([
        "220x5",
        "210x5",
        "200x8",
      ]);
      const top220 = detail.topSets.find((s) => s.weight === 220);
      expect(new Date(top220.performedAt).toISOString()).toBe(
        new Date("2026-06-29T10:00:00Z").toISOString()
      );
    });

    test("8 distinct (weight, reps) pairs still yields exactly 5 (MAX_TOP_SETS)", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-02T10:00:00Z", weight: 110, reps: 5 }),
        benchSet({ performedAt: "2026-06-03T10:00:00Z", weight: 120, reps: 5 }),
        benchSet({ performedAt: "2026-06-04T10:00:00Z", weight: 130, reps: 5 }),
        benchSet({ performedAt: "2026-06-05T10:00:00Z", weight: 140, reps: 5 }),
        benchSet({ performedAt: "2026-06-06T10:00:00Z", weight: 150, reps: 5 }),
        benchSet({ performedAt: "2026-06-07T10:00:00Z", weight: 160, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 170, reps: 5 }),
      ];

      const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });

      expect(detail.topSets).toHaveLength(5);
      expect(detail.topSets.map((s) => s.weight)).toEqual([170, 160, 150, 140, 130]);
    });
  });

  describe("e1RM validity window (FP9 bug fix)", () => {
    test("high-rep set (160x20) does not inflate bestE1rm over valid working sets", () => {
      // The reported defect: 160x20 produces epley 266.7, but 220x5 produces
      // 256.67. Without the validity window, 266.7 wins. With the window,
      // 160x20's epley is null, so 220x5's 256.67 is the true bestE1rm.
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 220, reps: 5 }),
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 210, reps: 5 }),
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 160, reps: 20 }),
      ];

      const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });

      // bestE1rm should come from 220x5: 220 * (1 + 5/30) = 256.67
      expect(detail.bestE1rm).toBeCloseTo(256.67, 1);
      // NOT 266.7 (which would come from 160x20 without the window)

      // repTargets 5-rep row should be <= 220, not 227.5
      const at5 = detail.repTargets.find((t) => t.reps === 5);
      // Inverted Epley: 256.67 / (1 + 5/30) = 220
      expect(at5.weight).toBeCloseTo(220, 0);
      expect(at5.weight).toBeLessThanOrEqual(220);
    });

    test("exercise logged ONLY at high reps yields null bestE1rm and repTargets", () => {
      // All sets above 12 reps - no valid e1RM data
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 15 }),
        benchSet({ performedAt: "2026-06-02T10:00:00Z", weight: 90, reps: 20 }),
        benchSet({ performedAt: "2026-06-03T10:00:00Z", weight: 80, reps: 25 }),
      ];

      const detail = buildExerciseDetail(sets, { exerciseId: BENCH_ID });

      // bestE1rm must be null, not NaN or 0
      expect(detail.bestE1rm).toBe(null);
      // repTargets must be null (insufficient data), not an empty array or throw
      expect(detail.repTargets).toBe(null);
      // e1rmHistory should be empty (no valid e1RM data points)
      expect(detail.e1rmHistory).toEqual([]);
      // loggedRepRange should still reflect what was logged
      expect(detail.loggedRepRange).toBeNull();
      // The detail itself should exist (exercise was logged)
      expect(detail.totals.sets).toBe(3);
    });
  });
});
