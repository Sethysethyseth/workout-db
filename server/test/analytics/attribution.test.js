const {
  loadCatalog,
  resolveExercise,
  attributeSet,
} = require("../../src/analytics");

const SUM_TOLERANCE = 0.001;

function sum(muscles) {
  return Object.values(muscles).reduce((acc, v) => acc + v, 0);
}

describe("attributeSet", () => {
  const catalog = loadCatalog();

  test("returns exact curated weights for a curated entry", () => {
    const resolution = resolveExercise({
      exerciseName: "Barbell Bench Press - Medium Grip",
    });
    const result = attributeSet(resolution);

    expect(result.attributed).toBe(true);
    expect(result.source).toBe("muscleWeights");
    expect(result.muscles).toEqual(
      catalog.muscleWeights["Barbell_Bench_Press_-_Medium_Grip"]
    );
    expect(Math.abs(sum(result.muscles) - 1.0)).toBeLessThanOrEqual(
      SUM_TOLERANCE
    );
  });

  test("uses primary/secondary fallback for a resolved-but-uncurated entry", () => {
    const resolution = resolveExercise({ exerciseName: "90/90 Hamstring" });
    expect(resolution.resolved).toBe(true);
    expect(catalog.muscleWeights[resolution.catalogEntry.id]).toBeUndefined();

    const result = attributeSet(resolution);
    expect(result.attributed).toBe(true);
    expect(result.source).toBe("primarySecondaryFallback");

    // primary hamstrings (1.0) + secondary calves (0.5) normalized to sum 1.0.
    expect(result.muscles.hamstrings).toBeCloseTo(2 / 3, 5);
    expect(result.muscles.calves).toBeCloseTo(1 / 3, 5);
    expect(Math.abs(sum(result.muscles) - 1.0)).toBeLessThanOrEqual(
      SUM_TOLERANCE
    );
  });

  test("returns attributed: false for an unresolved resolution", () => {
    const resolution = resolveExercise({
      exerciseName: "Nonexistent Made Up Exercise",
    });
    const result = attributeSet(resolution);

    expect(result.attributed).toBe(false);
    expect(result.source).toBe(null);
    expect(result.muscles).toEqual({});
  });
});
