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
