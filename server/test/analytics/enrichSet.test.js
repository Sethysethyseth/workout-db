const { enrichSet } = require("../../src/analytics");

describe("enrichSet", () => {
  test("resolvable curated exercise with full fields", () => {
    const enriched = enrichSet({
      exerciseName: "Barbell Bench Press - Medium Grip",
      weight: 100,
      reps: 5,
      rir: 2,
      performedAt: new Date("2026-06-01T10:00:00Z"),
    });

    expect(enriched.resolution.resolved).toBe(true);
    expect(enriched.attribution.attributed).toBe(true);
    expect(enriched.metrics.tonnage).toBe(500);
    expect(enriched.performedAt instanceof Date).toBe(true);
  });

  test("unresolvable exerciseName still computes non-attribution metrics", () => {
    const enriched = enrichSet({
      exerciseName: "Nonexistent Made Up Exercise",
      weight: 100,
      reps: 5,
      rir: 2,
      performedAt: new Date("2026-06-01T10:00:00Z"),
    });

    expect(enriched.resolution.resolved).toBe(false);
    expect(enriched.metrics.effectiveContribution).toBe(null);
    expect(enriched.metrics.tonnage).toBe(500);
  });

  test("RPE-only set gets a stimulating contribution via the pooled effort signal", () => {
    const enriched = enrichSet({
      exerciseName: "Barbell Bench Press - Medium Grip",
      weight: 100,
      reps: 5,
      rpe: 8,
      performedAt: new Date("2026-06-01T10:00:00Z"),
    });

    expect(enriched.input.rir).toBeNull();
    expect(enriched.input.rpe).toBe(8);
    expect(enriched.input.effortRir).toBe(2);
    // RPE 8 -> RIR 2 -> the 0.95 stimulus tier.
    expect(enriched.metrics.stimulusMultiplier).toBe(0.95);
    expect(enriched.metrics.stimulatingContribution).not.toBeNull();
  });

  test("explicit RIR wins over a coexisting RPE for metrics", () => {
    const enriched = enrichSet({
      exerciseName: "Barbell Bench Press - Medium Grip",
      weight: 100,
      reps: 5,
      rir: 4,
      rpe: 10,
      performedAt: new Date("2026-06-01T10:00:00Z"),
    });

    expect(enriched.input.rir).toBe(4);
    expect(enriched.input.rpe).toBe(10);
    expect(enriched.input.effortRir).toBe(4);
  });

  test("no effort signal at all -> effortRir null, stimulating excluded", () => {
    const enriched = enrichSet({
      exerciseName: "Barbell Bench Press - Medium Grip",
      weight: 100,
      reps: 5,
      performedAt: new Date("2026-06-01T10:00:00Z"),
    });

    expect(enriched.input.effortRir).toBeNull();
    expect(enriched.metrics.stimulusMultiplier).toBeNull();
    expect(enriched.metrics.stimulatingContribution).toBeNull();
  });

  test("ISO string performedAt is converted to a Date", () => {
    const enriched = enrichSet({
      exerciseName: "Barbell Bench Press - Medium Grip",
      weight: 100,
      reps: 5,
      rir: 2,
      performedAt: "2026-06-01T10:00:00Z",
    });

    expect(enriched.performedAt instanceof Date).toBe(true);
    expect(enriched.performedAt.toISOString()).toBe("2026-06-01T10:00:00.000Z");
  });
});
