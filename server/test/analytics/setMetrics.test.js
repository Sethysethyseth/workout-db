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

  test("reps > 12: epley null (validity window)", () => {
    // At the boundary: 12 reps is valid
    const at12 = estimateOneRepMax(160, 12);
    expect(at12.epley).toBeCloseTo(160 * (1 + 12 / 30), 5); // 224
    expect(at12.brzycki).toBeCloseTo((160 * 36) / (37 - 12), 5);

    // Above the boundary: 13 reps is invalid
    const at13 = estimateOneRepMax(160, 13);
    expect(at13.epley).toBe(null);
    expect(at13.brzycki).toBeCloseTo((160 * 36) / (37 - 13), 5);

    // Well above: 20 reps
    const at20 = estimateOneRepMax(160, 20);
    expect(at20.epley).toBe(null);
    expect(at20.brzycki).toBeCloseTo((160 * 36) / (37 - 20), 5);
  });

  test("reps >= 37: brzycki null (singularity guard unchanged)", () => {
    const { epley, brzycki } = estimateOneRepMax(100, 37);
    expect(brzycki).toBe(null);
    // epley is also null because 37 > 12
    expect(epley).toBe(null);
  });

  test("brzycki behaviour unchanged for in-range reps", () => {
    // brzycki at 5 reps: 100 * 36 / 32 = 112.5
    const { brzycki } = estimateOneRepMax(100, 5);
    expect(brzycki).toBeCloseTo(112.5, 5);
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
