const {
  estimateOneRepMax,
  computeTonnage,
  computeSetMetrics,
  resolveExercise,
  attributeSet,
} = require("../../src/analytics");

describe("estimateOneRepMax", () => {
  test("known case (weight 100, reps 5)", () => {
    const { epley, brzycki } = estimateOneRepMax(100, 5);
    // Epley: 100 * (1 + 5/30) = 116.666...
    expect(epley).toBeCloseTo(116.6667, 3);
    // Brzycki: 100 * 36 / (37 - 5) = 3600 / 32 = 112.5
    expect(brzycki).toBeCloseTo(112.5, 5);
  });

  test.each([
    [null, 5],
    [100, null],
    [0, 5],
    [100, 0],
    [-10, 5],
  ])("returns both null for invalid input (weight %p, reps %p)", (w, r) => {
    expect(estimateOneRepMax(w, r)).toEqual({ epley: null, brzycki: null });
  });

  test("reps >= 37: brzycki null but epley still a number", () => {
    const { epley, brzycki } = estimateOneRepMax(100, 37);
    expect(brzycki).toBe(null);
    expect(typeof epley).toBe("number");
    expect(epley).toBeCloseTo(100 * (1 + 37 / 30), 5);
  });
});

describe("computeTonnage", () => {
  test("straightforward multiplication", () => {
    expect(computeTonnage(100, 5)).toBe(500);
  });

  test.each([
    [null, 5],
    [100, null],
  ])("null on missing input (weight %p, reps %p)", (w, r) => {
    expect(computeTonnage(w, r)).toBe(null);
  });
});

describe("computeSetMetrics end-to-end", () => {
  const attribution = attributeSet(
    resolveExercise({ exerciseName: "Barbell Bench Press - Medium Grip" })
  );

  test("attribution is a curated, attributed set (sanity)", () => {
    expect(attribution.attributed).toBe(true);
    expect(Object.keys(attribution.muscles).length).toBeGreaterThan(0);
  });

  test("stimulatingContribution = effectiveContribution * multiplier (rir 2)", () => {
    const metrics = computeSetMetrics(
      { weight: 100, reps: 5, rir: 2 },
      attribution
    );

    expect(metrics.tonnage).toBe(500);
    expect(metrics.stimulusMultiplier).toBe(0.95);
    expect(metrics.effectiveContribution).toEqual(attribution.muscles);

    for (const muscle of Object.keys(metrics.effectiveContribution)) {
      expect(metrics.stimulatingContribution[muscle]).toBeCloseTo(
        metrics.effectiveContribution[muscle] * 0.95,
        10
      );
    }
  });

  test("stimulatingContribution null when rir omitted, effective still populated", () => {
    const metrics = computeSetMetrics({ weight: 100, reps: 5 }, attribution);

    expect(metrics.stimulusMultiplier).toBe(null);
    expect(metrics.stimulatingContribution).toBe(null);
    expect(metrics.effectiveContribution).toEqual(attribution.muscles);
  });

  test("effectiveContribution null when attribution is unattributed", () => {
    const unresolved = attributeSet(
      resolveExercise({ exerciseName: "Nonexistent Made Up Exercise" })
    );
    const metrics = computeSetMetrics({ weight: 100, reps: 5, rir: 2 }, unresolved);

    expect(metrics.effectiveContribution).toBe(null);
    expect(metrics.stimulatingContribution).toBe(null);
    // Non-attribution metrics still compute.
    expect(metrics.tonnage).toBe(500);
    expect(metrics.stimulusMultiplier).toBe(0.95);
  });
});
