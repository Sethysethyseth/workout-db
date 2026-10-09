const { buildLastPerformance } = require("../../src/analytics/lastPerformance");
const { buildUserExerciseIndex } = require("../../src/analytics/userExercises");

const BENCH_ID = "Barbell_Bench_Press_-_Medium_Grip";

function session(performedAt, exercises) {
  return { performedAt: new Date(performedAt), exercises };
}

function exercise(fields, sets) {
  return { order: 1, exerciseId: null, userExerciseId: null, exerciseName: "", ...fields, sets };
}

function set(fields) {
  return { order: 1, side: null, weight: null, reps: null, durationSec: null, ...fields };
}

describe("buildLastPerformance", () => {
  test("matches a catalog id on both sides", () => {
    const result = buildLastPerformance({
      targets: [
        {
          sessionExerciseId: 10,
          exerciseId: BENCH_ID,
          exerciseName: "Something else",
        },
      ],
      priorSessions: [
        session("2026-09-01T15:00:00.000Z", [
          exercise(
            { exerciseId: BENCH_ID, exerciseName: "Barbell Bench Press - Medium Grip" },
            [set({ order: 1, weight: 185, reps: 8 }), set({ order: 2, weight: 185, reps: 6 })]
          ),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result).toEqual([
      {
        sessionExerciseId: 10,
        lastPerformedAt: "2026-09-01T15:00:00.000Z",
        sets: [
          { side: null, weight: 185, reps: 8, durationSec: null },
          { side: null, weight: 185, reps: 6, durationSec: null },
        ],
      },
    ]);
  });

  test("a legacy name-only row matches a catalog-id target via alias", () => {
    const result = buildLastPerformance({
      targets: [
        {
          sessionExerciseId: 11,
          exerciseId: BENCH_ID,
          exerciseName: "Barbell Bench Press - Medium Grip",
        },
      ],
      priorSessions: [
        session("2026-08-20T12:00:00.000Z", [
          exercise({ exerciseName: "bench press" }, [set({ weight: 135, reps: 10 })]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result).toHaveLength(1);
    expect(result[0].sessionExerciseId).toBe(11);
    expect(result[0].sets).toEqual([
      { side: null, weight: 135, reps: 10, durationSec: null },
    ]);
  });

  test("matches a custom exercise via userExerciseId", () => {
    const userIndex = buildUserExerciseIndex([
      {
        id: 7,
        name: "Zercher Hold",
        normalizedName: "zercher hold",
        muscles: { biceps: "primary" },
      },
    ]);

    const result = buildLastPerformance({
      targets: [
        {
          sessionExerciseId: 12,
          userExerciseId: 7,
          exerciseName: "Zercher Hold",
        },
      ],
      priorSessions: [
        session("2026-07-04T18:00:00.000Z", [
          exercise(
            { userExerciseId: 7, exerciseName: "Zercher Hold" },
            [set({ weight: 95, reps: 5 })]
          ),
        ]),
      ],
      userIndex,
    });

    expect(result).toEqual([
      {
        sessionExerciseId: 12,
        lastPerformedAt: "2026-07-04T18:00:00.000Z",
        sets: [{ side: null, weight: 95, reps: 5, durationSec: null }],
      },
    ]);
  });

  test("per-side sets keep their L/R side and logged order", () => {
    const result = buildLastPerformance({
      targets: [{ sessionExerciseId: 13, exerciseId: BENCH_ID, exerciseName: "Bench" }],
      priorSessions: [
        session("2026-09-02T15:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID, exerciseName: "Bench" }, [
            set({ order: 2, side: "R", weight: 40, reps: 8 }),
            set({ order: 1, side: "L", weight: 40, reps: 10 }),
            set({ order: 3, side: "L", weight: 40, reps: 8 }),
          ]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result[0].sets).toEqual([
      { side: "L", weight: 40, reps: 10, durationSec: null },
      { side: "R", weight: 40, reps: 8, durationSec: null },
      { side: "L", weight: 40, reps: 8, durationSec: null },
    ]);
  });

  test("drops weight-only and reps-only sets and keeps a timed set", () => {
    const result = buildLastPerformance({
      targets: [{ sessionExerciseId: 14, exerciseId: BENCH_ID, exerciseName: "Bench" }],
      priorSessions: [
        session("2026-09-03T15:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID, exerciseName: "Bench" }, [
            set({ order: 1, weight: 200, reps: null }),
            set({ order: 2, weight: null, reps: 5 }),
            set({ order: 3, weight: 185, reps: 5 }),
            set({ order: 4, durationSec: 45 }),
          ]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result[0].sets).toEqual([
      { side: null, weight: 185, reps: 5, durationSec: null },
      { side: null, weight: null, reps: null, durationSec: 45 },
    ]);
  });

  test("the most recent session wins over an older one", () => {
    const result = buildLastPerformance({
      targets: [{ sessionExerciseId: 15, exerciseId: BENCH_ID, exerciseName: "Bench" }],
      priorSessions: [
        session("2026-01-01T12:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID }, [set({ weight: 100, reps: 5 })]),
        ]),
        session("2026-09-10T12:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID }, [set({ weight: 225, reps: 3 })]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result[0].lastPerformedAt).toBe("2026-09-10T12:00:00.000Z");
    expect(result[0].sets[0].weight).toBe(225);
  });

  test("uses the first matching exercise in that session", () => {
    const result = buildLastPerformance({
      targets: [{ sessionExerciseId: 16, exerciseId: BENCH_ID, exerciseName: "Bench" }],
      priorSessions: [
        session("2026-09-10T12:00:00.000Z", [
          exercise({ order: 2, exerciseId: BENCH_ID, exerciseName: "Bench again" }, [
            set({ weight: 300, reps: 1 }),
          ]),
          exercise({ order: 1, exerciseId: BENCH_ID, exerciseName: "Bench" }, [
            set({ weight: 185, reps: 8 }),
          ]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result[0].sets).toEqual([
      { side: null, weight: 185, reps: 8, durationSec: null },
    ]);
  });

  test("does not know the current session; the caller must exclude it", () => {
    // buildLastPerformance has no current-session id. getLastPerformance
    // omits that session from priorSessions. If the caller passed it, its
    // sets would be eligible history - this locks that contract.
    const result = buildLastPerformance({
      targets: [{ sessionExerciseId: 17, exerciseId: BENCH_ID, exerciseName: "Bench" }],
      priorSessions: [
        session("2026-10-08T12:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID }, [set({ weight: 999, reps: 1 })]),
        ]),
        session("2026-09-01T12:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID }, [set({ weight: 135, reps: 8 })]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result[0].sets[0].weight).toBe(999);
  });

  test("does not look past the most recent session once the exercise is found", () => {
    const result = buildLastPerformance({
      targets: [{ sessionExerciseId: 21, exerciseId: BENCH_ID, exerciseName: "Bench" }],
      priorSessions: [
        session("2026-09-12T12:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID }, [set({ weight: 200, reps: null })]),
        ]),
        session("2026-01-01T12:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID }, [set({ weight: 135, reps: 8 })]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result).toEqual([]);
  });

  test("omits a target with no history", () => {
    const result = buildLastPerformance({
      targets: [
        { sessionExerciseId: 18, exerciseId: BENCH_ID, exerciseName: "Bench" },
        {
          sessionExerciseId: 19,
          exerciseName: "Not A Real Movement Zzq",
        },
      ],
      priorSessions: [
        session("2026-09-01T12:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID }, [set({ weight: 185, reps: 5 })]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(result.map((row) => row.sessionExerciseId)).toEqual([18]);
  });
});
