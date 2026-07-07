const {
  loadCatalog,
  resolveExercise,
  enrichSet,
  buildSummary,
} = require("../../src/analytics");
const {
  buildUserExerciseIndex,
  userExerciseWeights,
} = require("../../src/analytics/userExercises");

const EXPECTED_MUSCLES = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower back",
  "middle back",
  "neck",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
];

describe("userExerciseWeights", () => {
  test("normalizes primary/secondary designations to fractional weights", () => {
    const weights = userExerciseWeights({
      a: "primary",
      b: "secondary",
    });
    expect(weights.a).toBeCloseTo(2 / 3, 5);
    expect(weights.b).toBeCloseTo(1 / 3, 5);
  });

  test("returns empty object when no valid designations are present", () => {
    expect(userExerciseWeights({})).toEqual({});
    expect(userExerciseWeights({ chest: "invalid" })).toEqual({});
  });
});

describe("buildUserExerciseIndex", () => {
  test("indexes valid rows by normalizedName and skips junk", () => {
    const index = buildUserExerciseIndex([
      { id: 1, name: "Pendlay Row", normalizedName: "pendlay row", muscles: { lats: "primary" } },
      null,
      { id: 2, name: "", muscles: { chest: "primary" } },
      { id: 3, name: "Good Morning", muscles: { hamstrings: "primary" } },
      "bad",
    ]);

    expect(index.size).toBe(2);
    expect(index.get("pendlay row")).toEqual({
      id: 1,
      name: "Pendlay Row",
      muscles: { lats: "primary" },
    });
    expect(index.get("good morning")).toEqual({
      id: 3,
      name: "Good Morning",
      muscles: { hamstrings: "primary" },
    });
    expect(index.byId.get(1)).toEqual({
      id: 1,
      name: "Pendlay Row",
      muscles: { lats: "primary" },
    });
    expect(index.byId.get(3)).toEqual({
      id: 3,
      name: "Good Morning",
      muscles: { hamstrings: "primary" },
    });
  });

  test("returns empty byId for non-array input", () => {
    const index = buildUserExerciseIndex(null);
    expect(index.size).toBe(0);
    expect(index.byId.size).toBe(0);
  });
});

describe("user exercise overlay", () => {
  const catalog = loadCatalog();

  test("catalog beats user overlay on a colliding normalized name", () => {
    const userIndex = buildUserExerciseIndex([
      {
        id: 99,
        name: "Bench Press",
        normalizedName: "bench press",
        muscles: { chest: "primary" },
      },
    ]);

    const resolution = resolveExercise(
      { exerciseName: "bench press" },
      catalog,
      userIndex
    );

    expect(resolution.resolved).toBe(true);
    expect(resolution.source).not.toBe("userExercise");
    expect(resolution.catalogEntry.id).toBe("Barbell_Bench_Press_-_Medium_Grip");
  });

  test("unresolved without overlay stays unresolved", () => {
    const resolution = resolveExercise(
      { exerciseName: "Bulgarian Split Squat Custom" },
      catalog,
      new Map()
    );
    expect(resolution.resolved).toBe(false);
    expect(resolution.source).toBe(null);
  });

  test("resolves via user overlay when not in catalog", () => {
    const userIndex = buildUserExerciseIndex([
      {
        id: 42,
        name: "Pendlay Row",
        normalizedName: "pendlay row",
        muscles: { lats: "primary", biceps: "secondary" },
      },
    ]);

    const resolution = resolveExercise(
      { exerciseName: "Pendlay Row" },
      catalog,
      userIndex
    );

    expect(resolution.resolved).toBe(true);
    expect(resolution.source).toBe("userExercise");
    expect(resolution.userExercise.id).toBe(42);
  });

  test("a set logged under a user exercise name lands fractional volume in buildSummary perMuscle", () => {
    const userIndex = buildUserExerciseIndex([
      {
        id: 42,
        name: "Pendlay Row",
        normalizedName: "pendlay row",
        muscles: { lats: "primary", biceps: "secondary" },
      },
    ]);

    const enriched = enrichSet(
      {
        exerciseName: "Pendlay Row",
        weight: 100,
        reps: 5,
        performedAt: "2026-06-02T10:00:00Z",
      },
      userIndex
    );

    expect(enriched.attribution.source).toBe("userExercise");

    const summary = buildSummary([enriched], {
      from: "2026-06-01T00:00:00Z",
      to: "2026-06-15T00:00:00Z",
    });

    const lats = summary.perMuscle.find((m) => m.muscle === "lats");
    const biceps = summary.perMuscle.find((m) => m.muscle === "biceps");
    expect(lats).toBeDefined();
    expect(biceps).toBeDefined();
    expect(lats.effectiveSets).toBeGreaterThan(0);
    expect(biceps.effectiveSets).toBeGreaterThan(0);
  });

  test("muscle vocabulary matches the 17 catalog muscles", () => {
    const muscles = new Set();
    for (const entry of catalog.byId.values()) {
      for (const muscle of entry.primaryMuscles || []) {
        muscles.add(muscle);
      }
      for (const muscle of entry.secondaryMuscles || []) {
        muscles.add(muscle);
      }
    }
    expect(Array.from(muscles).sort()).toEqual(EXPECTED_MUSCLES);
  });
});
