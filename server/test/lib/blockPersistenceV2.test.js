const {
  normalizeBlockWeeksArray,
  normalizeExercisesArray,
  normalizeWeekLabel,
} = require("../../src/lib/templateExerciseNormalize");
const { buildClonePayload } = require("../../src/blocks/blockTemplateStore");

describe("week label", () => {
  test('label "  Deload " trims to "Deload"', () => {
    expect(normalizeWeekLabel("  Deload ")).toEqual({
      ok: true,
      value: "Deload",
    });
    const norm = normalizeBlockWeeksArray([
      { label: "  Deload ", workouts: [{ name: "A", exercises: [{ exerciseName: "Squat", targetSets: 3 }] }] },
    ]);
    expect(norm.ok).toBe(true);
    expect(norm.value[0].label).toBe("Deload");
  });

  test('label "" becomes null', () => {
    expect(normalizeWeekLabel("")).toEqual({ ok: true, value: null });
    const norm = normalizeBlockWeeksArray([
      { label: "", workouts: [{ name: "A", exercises: [{ exerciseName: "Squat", targetSets: 3 }] }] },
    ]);
    expect(norm.ok).toBe(true);
    expect(norm.value[0].label).toBe(null);
  });

  test("41-character label is rejected", () => {
    const long = "x".repeat(41);
    expect(normalizeWeekLabel(long).ok).toBe(false);
    const norm = normalizeBlockWeeksArray([
      { label: long, workouts: [{ name: "A", exercises: [{ exerciseName: "Squat", targetSets: 3 }] }] },
    ]);
    expect(norm.ok).toBe(false);
    expect(norm.status).toBe(400);
  });
});

describe("exercise restSec and effortCap", () => {
  test("restSec 90 kept; effortCap absent defaults false", () => {
    const norm = normalizeExercisesArray(
      [{ exerciseName: "Squat", restSec: 90, targetSets: 3 }],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(true);
    expect(norm.value[0].restSec).toBe(90);
    expect(norm.value[0].effortCap).toBe(false);
  });

  test("restSec -1 and 3601 rejected", () => {
    expect(
      normalizeExercisesArray(
        [{ exerciseName: "Squat", restSec: -1, targetSets: 3 }],
        { includeBlockFields: true }
      ).ok
    ).toBe(false);
    expect(
      normalizeExercisesArray(
        [{ exerciseName: "Squat", restSec: 3601, targetSets: 3 }],
        { includeBlockFields: true }
      ).ok
    ).toBe(false);
  });
});

describe("set repsMax and durationSec", () => {
  test("{ reps: 8, repsMax: 10 } kept", () => {
    const norm = normalizeExercisesArray(
      [
        {
          exerciseName: "Squat",
          sets: [{ reps: 8, repsMax: 10 }],
        },
      ],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(true);
    expect(norm.value[0].templateSets.create[0].reps).toBe(8);
    expect(norm.value[0].templateSets.create[0].repsMax).toBe(10);
  });

  test("{ reps: 10, repsMax: 8 } rejected", () => {
    const norm = normalizeExercisesArray(
      [{ exerciseName: "Squat", sets: [{ reps: 10, repsMax: 8 }] }],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(false);
  });

  test("{ repsMax: 10 } rejected", () => {
    const norm = normalizeExercisesArray(
      [{ exerciseName: "Squat", sets: [{ repsMax: 10 }] }],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(false);
  });

  test("{ durationSec: 45 } kept", () => {
    const norm = normalizeExercisesArray(
      [{ exerciseName: "Plank", sets: [{ durationSec: 45 }] }],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(true);
    expect(norm.value[0].templateSets.create[0].durationSec).toBe(45);
  });

  test("{ reps: 8, durationSec: 45 } rejected", () => {
    const norm = normalizeExercisesArray(
      [{ exerciseName: "Squat", sets: [{ reps: 8, durationSec: 45 }] }],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(false);
  });

  test("{ durationSec: 0 } rejected", () => {
    const norm = normalizeExercisesArray(
      [{ exerciseName: "Plank", sets: [{ durationSec: 0 }] }],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(false);
  });
});

describe("targetReps derivation", () => {
  test('three sets {reps 8, repsMax 10} -> "8-10"', () => {
    const norm = normalizeExercisesArray(
      [
        {
          exerciseName: "Squat",
          sets: [
            { reps: 8, repsMax: 10 },
            { reps: 8, repsMax: 10 },
            { reps: 8, repsMax: 10 },
          ],
        },
      ],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(true);
    expect(norm.value[0].targetReps).toBe("8-10");
  });

  test('three sets {durationSec 45} -> "45s"', () => {
    const norm = normalizeExercisesArray(
      [
        {
          exerciseName: "Plank",
          sets: [
            { durationSec: 45 },
            { durationSec: 45 },
            { durationSec: 45 },
          ],
        },
      ],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(true);
    expect(norm.value[0].targetReps).toBe("45s");
  });

  test('{reps 5} + {reps 3} -> "5 / 3"', () => {
    const norm = normalizeExercisesArray(
      [
        {
          exerciseName: "Squat",
          sets: [{ reps: 5 }, { reps: 3 }],
        },
      ],
      { includeBlockFields: true }
    );
    expect(norm.ok).toBe(true);
    expect(norm.value[0].targetReps).toBe("5 / 3");
  });
});

describe("buildClonePayload", () => {
  test("strips exerciseId and userExerciseId; keeps name and v2 fields", () => {
    const sourceTree = {
      name: "Donor Block",
      description: "desc",
      durationWeeks: 4,
      useRIR: false,
      useRPE: true,
      useDuration: true,
      weeks: [
        {
          order: 1,
          label: "Deload",
          workouts: [
            {
              order: 1,
              name: "Day 1",
              exercises: [
                {
                  order: 1,
                  exerciseName: "Custom Curl",
                  exerciseId: "catalog-xyz",
                  userExerciseId: 99,
                  targetSets: 3,
                  targetReps: "8-10",
                  notes: "slow ecc",
                  restSec: 90,
                  effortCap: true,
                  blockWorkoutSets: [
                    {
                      order: 1,
                      reps: 8,
                      repsMax: 10,
                      weight: 40,
                      rpe: 8,
                      rir: null,
                      notes: null,
                      durationSec: null,
                    },
                    {
                      order: 2,
                      reps: null,
                      repsMax: null,
                      weight: null,
                      rpe: null,
                      rir: null,
                      notes: null,
                      durationSec: 45,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const payload = buildClonePayload(sourceTree);
    const json = JSON.stringify(payload);
    expect(json).not.toMatch(/"exerciseId"/);
    expect(json).not.toMatch(/"userExerciseId"/);

    const ex = payload.weeks[0].workouts[0].exercises[0];
    expect(ex.exerciseName).toBe("Custom Curl");
    expect(ex.notes).toBe("slow ecc");
    expect(ex.restSec).toBe(90);
    expect(ex.effortCap).toBe(true);
    expect(payload.weeks[0].label).toBe("Deload");
    expect(ex.sets[0].repsMax).toBe(10);
    expect(ex.sets[1].durationSec).toBe(45);
    expect(payload.isPublic).toBe(false);
  });
});
