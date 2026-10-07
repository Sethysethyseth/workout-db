const {
  buildSessionFromBlockWorkout,
  computeRunProgress,
  summarizeLeftOff,
} = require("../../../src/blocks/blockRunLogic");

/** 2-week x 2-day fixture with a timed set and effortCap/restSec. */
function fixtureTree({ useRPE = true, useRIR = false } = {}) {
  return {
    name: "Phase 1",
    useRPE,
    useRIR,
    weeks: [
      {
        order: 1,
        label: "Base",
        workouts: [
          {
            order: 1,
            name: "Upper A",
            exercises: [
              {
                order: 1,
                exerciseName: "Bench Press",
                exerciseId: "bench",
                userExerciseId: null,
                targetSets: 3,
                targetReps: "8",
                notes: "pause",
                restSec: 180,
                effortCap: true,
                blockWorkoutSets: [
                  {
                    order: 1,
                    reps: 8,
                    repsMax: 10,
                    durationSec: null,
                    weight: 185,
                    rpe: 7,
                    rir: null,
                  },
                ],
              },
            ],
          },
          {
            order: 2,
            name: "Lower A",
            exercises: [
              {
                order: 1,
                exerciseName: "Squat",
                restSec: 240,
                effortCap: false,
                blockWorkoutSets: [
                  {
                    order: 1,
                    reps: 5,
                    repsMax: null,
                    durationSec: null,
                    weight: 225,
                    rpe: 8,
                    rir: null,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        order: 2,
        label: null,
        workouts: [
          {
            order: 1,
            name: "Upper B",
            exercises: [
              {
                order: 1,
                exerciseName: "OHP",
                restSec: 120,
                effortCap: false,
                blockWorkoutSets: [
                  {
                    order: 1,
                    reps: 6,
                    repsMax: null,
                    durationSec: null,
                    weight: 95,
                    rpe: 7,
                    rir: null,
                  },
                ],
              },
              {
                order: 2,
                exerciseName: "Plank",
                restSec: 60,
                effortCap: false,
                blockWorkoutSets: [
                  {
                    order: 1,
                    reps: null,
                    repsMax: null,
                    durationSec: 45,
                    weight: null,
                    rpe: null,
                    rir: null,
                  },
                ],
              },
            ],
          },
          {
            order: 2,
            name: "Lower B",
            exercises: [
              {
                order: 1,
                exerciseName: "RDL",
                restSec: null,
                effortCap: false,
                blockWorkoutSets: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("buildSessionFromBlockWorkout", () => {
  test("builds named session with order, timed plan, effortCap/restSec, effort rpe", () => {
    const tree = fixtureTree({ useRPE: true, useRIR: false });
    const built = buildSessionFromBlockWorkout(tree, 2, 1, {
      blockName: "Phase 1",
    });

    expect(built).not.toBeNull();
    expect(built.name).toBe("Phase 1 · W2 · Upper B");
    expect(built.exercises.map((e) => e.exerciseName)).toEqual(["OHP", "Plank"]);

    const plank = built.exercises[1];
    expect(plank.plan.sets[0]).toEqual({
      reps: null,
      repsMax: null,
      durationSec: 45,
      weight: null,
      rpe: null,
      rir: null,
    });
    expect(plank.plan.effortCap).toBe(false);
    expect(plank.plan.restSec).toBe(60);
    expect(plank.plan.effort).toBe("rpe");
    expect(plank.plan.v).toBe(1);

    const ohp = built.exercises[0];
    expect(ohp.plan.effortCap).toBe(false);
    expect(ohp.plan.restSec).toBe(120);
    expect(ohp.plan.effort).toBe("rpe");
    // Author notes live on the plan snapshot (and still on sessionExercise.notes).
    expect(Object.prototype.hasOwnProperty.call(ohp.plan, "notes")).toBe(true);
    expect(ohp.plan.notes).toBeNull();
  });

  test("plan.notes copies block exercise notes (or null)", () => {
    const tree = fixtureTree();
    const built = buildSessionFromBlockWorkout(tree, 1, 1, {
      blockName: "Phase 1",
    });
    expect(built.exercises[0].notes).toBe("pause");
    expect(built.exercises[0].plan.notes).toBe("pause");

    const lower = buildSessionFromBlockWorkout(tree, 1, 2, {
      blockName: "Phase 1",
    });
    expect(lower.exercises[0].notes).toBeNull();
    expect(lower.exercises[0].plan.notes).toBeNull();
  });

  test("effort is null when neither useRPE nor useRIR", () => {
    const tree = fixtureTree({ useRPE: false, useRIR: false });
    const built = buildSessionFromBlockWorkout(tree, 2, 1, {
      blockName: "Phase 1",
    });
    expect(built.exercises[0].plan.effort).toBeNull();
  });

  test("copies effortCap and restSec from week 1 day 1", () => {
    const tree = fixtureTree();
    const built = buildSessionFromBlockWorkout(tree, 1, 1, {
      blockName: "Phase 1",
    });
    expect(built.exercises[0].plan.effortCap).toBe(true);
    expect(built.exercises[0].plan.restSec).toBe(180);
  });

  test("plan carries perSide true / false / null from the block exercise", () => {
    const tree = fixtureTree();
    tree.weeks[0].workouts[0].exercises[0].perSide = true;
    tree.weeks[0].workouts[1].exercises[0].perSide = false;
    // week 2 day 1 first exercise leaves perSide unset -> null

    const upper = buildSessionFromBlockWorkout(tree, 1, 1, {
      blockName: "Phase 1",
    });
    expect(upper.exercises[0].plan.perSide).toBe(true);

    const lower = buildSessionFromBlockWorkout(tree, 1, 2, {
      blockName: "Phase 1",
    });
    expect(lower.exercises[0].plan.perSide).toBe(false);

    const w2 = buildSessionFromBlockWorkout(tree, 2, 1, {
      blockName: "Phase 1",
    });
    expect(w2.exercises[0].plan.perSide).toBe(null);
  });

  test("returns null for missing week or workout", () => {
    const tree = fixtureTree();
    expect(
      buildSessionFromBlockWorkout(tree, 3, 1, { blockName: "Phase 1" })
    ).toBeNull();
    expect(
      buildSessionFromBlockWorkout(tree, 1, 9, { blockName: "Phase 1" })
    ).toBeNull();
  });
});

describe("computeRunProgress", () => {
  const tree = fixtureTree();

  test("no sessions -> all todo, current week 1, nextDay {1,1}", () => {
    const progress = computeRunProgress(tree, []);
    expect(progress.currentWeekOrder).toBe(1);
    expect(progress.nextDay).toEqual({ weekOrder: 1, workoutOrder: 1 });
    for (const week of progress.weeks) {
      for (const day of week.days) {
        expect(day.status).toBe("todo");
        expect(day.sessionId).toBeNull();
      }
    }
    expect(progress.weeks[0].done).toBe(0);
    expect(progress.weeks[0].total).toBe(2);
    expect(progress.weeks[0].label).toBe("Base");
  });

  test("W1D1 completed + W1D2 open -> done / in_progress, nextDay {1,2}", () => {
    const progress = computeRunProgress(tree, [
      {
        id: 10,
        blockWeekOrder: 1,
        blockWorkoutOrder: 1,
        completedAt: new Date("2026-09-01"),
      },
      {
        id: 11,
        blockWeekOrder: 1,
        blockWorkoutOrder: 2,
        completedAt: null,
      },
    ]);
    expect(progress.weeks[0].days[0].status).toBe("done");
    expect(progress.weeks[0].days[0].sessionId).toBe(10);
    expect(progress.weeks[0].days[1].status).toBe("in_progress");
    expect(progress.weeks[0].days[1].sessionId).toBe(11);
    expect(progress.currentWeekOrder).toBe(1);
    expect(progress.nextDay).toEqual({ weekOrder: 1, workoutOrder: 2 });
  });

  test("W1D1 completed + open -> done wins, sessionId is completed", () => {
    const progress = computeRunProgress(tree, [
      {
        id: 20,
        blockWeekOrder: 1,
        blockWorkoutOrder: 1,
        completedAt: null,
      },
      {
        id: 21,
        blockWeekOrder: 1,
        blockWorkoutOrder: 1,
        completedAt: new Date("2026-09-02"),
      },
    ]);
    expect(progress.weeks[0].days[0].status).toBe("done");
    expect(progress.weeks[0].days[0].sessionId).toBe(21);
    expect(progress.currentWeekOrder).toBe(1);
    expect(progress.nextDay).toEqual({ weekOrder: 1, workoutOrder: 2 });
  });

  test("all four done -> currentWeekOrder 2, nextDay null", () => {
    const progress = computeRunProgress(tree, [
      {
        id: 1,
        blockWeekOrder: 1,
        blockWorkoutOrder: 1,
        completedAt: new Date(),
      },
      {
        id: 2,
        blockWeekOrder: 1,
        blockWorkoutOrder: 2,
        completedAt: new Date(),
      },
      {
        id: 3,
        blockWeekOrder: 2,
        blockWorkoutOrder: 1,
        completedAt: new Date(),
      },
      {
        id: 4,
        blockWeekOrder: 2,
        blockWorkoutOrder: 2,
        completedAt: new Date(),
      },
    ]);
    expect(progress.currentWeekOrder).toBe(2);
    expect(progress.nextDay).toBeNull();
    expect(progress.weeks.every((w) => w.done === w.total)).toBe(true);
  });
});

describe("summarizeLeftOff", () => {
  const tree = fixtureTree();

  test("no sessions -> null", () => {
    expect(summarizeLeftOff(tree, [])).toBeNull();
    expect(summarizeLeftOff(tree, null)).toBeNull();
  });

  test("W1 D1 + W1 D2 done -> next is W2 D1 with counts", () => {
    const summary = summarizeLeftOff(tree, [
      {
        id: 1,
        blockWeekOrder: 1,
        blockWorkoutOrder: 1,
        completedAt: new Date("2026-09-01"),
      },
      {
        id: 2,
        blockWeekOrder: 1,
        blockWorkoutOrder: 2,
        completedAt: new Date("2026-09-02"),
      },
    ]);
    expect(summary).toEqual({
      nextDay: { weekOrder: 2, workoutOrder: 1 },
      dayName: "Upper B",
      doneDays: 2,
      totalDays: 4,
    });
  });

  test("W1 D1 in progress only -> next is W1 D1, doneDays 0", () => {
    const summary = summarizeLeftOff(tree, [
      {
        id: 10,
        blockWeekOrder: 1,
        blockWorkoutOrder: 1,
        completedAt: null,
      },
    ]);
    expect(summary).not.toBeNull();
    expect(summary.nextDay).toEqual({ weekOrder: 1, workoutOrder: 1 });
    expect(summary.dayName).toBe("Upper A");
    expect(summary.doneDays).toBe(0);
    expect(summary.totalDays).toBe(4);
  });

  test("every day done -> null", () => {
    const summary = summarizeLeftOff(tree, [
      {
        id: 1,
        blockWeekOrder: 1,
        blockWorkoutOrder: 1,
        completedAt: new Date(),
      },
      {
        id: 2,
        blockWeekOrder: 1,
        blockWorkoutOrder: 2,
        completedAt: new Date(),
      },
      {
        id: 3,
        blockWeekOrder: 2,
        blockWorkoutOrder: 1,
        completedAt: new Date(),
      },
      {
        id: 4,
        blockWeekOrder: 2,
        blockWorkoutOrder: 2,
        completedAt: new Date(),
      },
    ]);
    expect(summary).toBeNull();
  });
});
