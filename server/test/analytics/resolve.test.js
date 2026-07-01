const { loadCatalog, resolveExercise } = require("../../src/analytics");

describe("resolveExercise", () => {
  const catalog = loadCatalog();

  test("matches by normalized exerciseName across case/spacing variations", () => {
    const canonical = resolveExercise({
      exerciseName: "Barbell Bench Press - Medium Grip",
    });
    expect(canonical.resolved).toBe(true);
    expect(canonical.source).toBe("exerciseName");
    expect(canonical.catalogEntry.id).toBe("Barbell_Bench_Press_-_Medium_Grip");

    const messy = resolveExercise({
      exerciseName: "  barbell_bench_press   MEDIUM-grip  ",
    });
    expect(messy.resolved).toBe(true);
    expect(messy.catalogEntry.id).toBe(canonical.catalogEntry.id);
  });

  test("matches by exerciseId when given a valid catalog id", () => {
    const result = resolveExercise({
      exerciseName: "totally different free text",
      exerciseId: "Barbell_Bench_Press_-_Medium_Grip",
    });
    expect(result.resolved).toBe(true);
    expect(result.source).toBe("exerciseId");
    expect(result.catalogEntry.id).toBe("Barbell_Bench_Press_-_Medium_Grip");
  });

  test("returns resolved: false for an unmatched name", () => {
    const result = resolveExercise({
      exerciseName: "Nonexistent Made Up Exercise",
    });
    expect(result.resolved).toBe(false);
    expect(result.source).toBe(null);
    expect(result.catalogEntry).toBe(null);
  });

  test("passing an explicit catalog argument works the same", () => {
    const result = resolveExercise(
      { exerciseName: "Barbell Bench Press - Medium Grip" },
      catalog
    );
    expect(result.resolved).toBe(true);
    expect(result.catalogEntry.id).toBe("Barbell_Bench_Press_-_Medium_Grip");
  });
});
