const { enrichSet, computeMatchedEffortTrend } = require("../../src/analytics");

const BENCH = "Barbell Bench Press - Medium Grip";

function benchSet({ weight, reps, rir, performedAt }) {
  return enrichSet({ exerciseName: BENCH, weight, reps, rir, performedAt });
}

describe("computeMatchedEffortTrend", () => {
  test("contract example: two RIR-2 sessions plus a null-RIR set", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, rir: 2, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 102.5, reps: 8, rir: 2, performedAt: "2026-05-08T10:00:00Z" }),
      benchSet({ weight: 60, reps: 12, performedAt: "2026-05-08T10:00:00Z" }),
    ];

    const trend = computeMatchedEffortTrend(sets);
    expect(trend.rir).toBe(2);
    expect(trend.sessions).toBe(2);
    expect(trend.first).toBeCloseTo(100 * (1 + 8 / 30), 10);
    expect(trend.latest).toBeCloseTo(102.5 * (1 + 8 / 30), 10);
    expect(trend.best).toBeCloseTo(102.5 * (1 + 8 / 30), 10);
    expect(trend.delta).toBeCloseTo(2.5 * (1 + 8 / 30), 10);
  });

  test("picks the bucket with the most distinct sessions", () => {
    const sets = [
      // RIR 3: three sessions.
      benchSet({ weight: 90, reps: 8, rir: 3, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 92.5, reps: 8, rir: 3, performedAt: "2026-05-08T10:00:00Z" }),
      benchSet({ weight: 95, reps: 8, rir: 3, performedAt: "2026-05-15T10:00:00Z" }),
      // RIR 1: two sessions (lower RIR, but fewer sessions -> loses).
      benchSet({ weight: 100, reps: 5, rir: 1, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 105, reps: 5, rir: 1, performedAt: "2026-05-08T10:00:00Z" }),
    ];

    const trend = computeMatchedEffortTrend(sets);
    expect(trend.rir).toBe(3);
    expect(trend.sessions).toBe(3);
  });

  test("session-count tie breaks toward the lower RIR", () => {
    const sets = [
      benchSet({ weight: 90, reps: 8, rir: 3, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 92.5, reps: 8, rir: 3, performedAt: "2026-05-08T10:00:00Z" }),
      benchSet({ weight: 100, reps: 5, rir: 1, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 105, reps: 5, rir: 1, performedAt: "2026-05-08T10:00:00Z" }),
    ];

    const trend = computeMatchedEffortTrend(sets);
    expect(trend.rir).toBe(1);
    expect(trend.sessions).toBe(2);
  });

  test("sets sharing performedAt are ONE session, represented by their max epley", () => {
    const shared = "2026-05-01T10:00:00Z";
    const sets = [
      // Same session: 100x8 (epley 126.67) and 105x8 (epley 133) at RIR 2.
      benchSet({ weight: 100, reps: 8, rir: 2, performedAt: shared }),
      benchSet({ weight: 105, reps: 8, rir: 2, performedAt: shared }),
      benchSet({ weight: 107.5, reps: 8, rir: 2, performedAt: "2026-05-08T10:00:00Z" }),
    ];

    const trend = computeMatchedEffortTrend(sets);
    expect(trend.sessions).toBe(2);
    // First session's representative is the BETTER of its two sets.
    expect(trend.first).toBeCloseTo(105 * (1 + 8 / 30), 10);
    expect(trend.latest).toBeCloseTo(107.5 * (1 + 8 / 30), 10);
  });

  test("best reflects a mid-range peak, not first or latest", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, rir: 2, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 110, reps: 8, rir: 2, performedAt: "2026-05-08T10:00:00Z" }),
      benchSet({ weight: 105, reps: 8, rir: 2, performedAt: "2026-05-15T10:00:00Z" }),
    ];

    const trend = computeMatchedEffortTrend(sets);
    expect(trend.best).toBeCloseTo(110 * (1 + 8 / 30), 10);
    expect(trend.latest).toBeCloseTo(105 * (1 + 8 / 30), 10);
    expect(trend.delta).toBeCloseTo((105 - 100) * (1 + 8 / 30), 10);
  });

  test("null when no set has RIR", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 102.5, reps: 8, performedAt: "2026-05-08T10:00:00Z" }),
    ];
    expect(computeMatchedEffortTrend(sets)).toBeNull();
  });

  test("null when RIR exists but no bucket reaches 2 distinct sessions", () => {
    const sets = [
      benchSet({ weight: 100, reps: 8, rir: 2, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 102.5, reps: 8, rir: 3, performedAt: "2026-05-08T10:00:00Z" }),
    ];
    expect(computeMatchedEffortTrend(sets)).toBeNull();
  });

  test("sets without weight/reps (null epley) are excluded from buckets", () => {
    const sets = [
      // RIR logged but no load -> can't contribute an e1RM.
      benchSet({ rir: 2, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 100, reps: 8, rir: 2, performedAt: "2026-05-08T10:00:00Z" }),
    ];
    expect(computeMatchedEffortTrend(sets)).toBeNull();
  });

  test("empty input -> null", () => {
    expect(computeMatchedEffortTrend([])).toBeNull();
  });

  test("RIR 0 is a valid bucket (not treated as missing)", () => {
    const sets = [
      benchSet({ weight: 100, reps: 5, rir: 0, performedAt: "2026-05-01T10:00:00Z" }),
      benchSet({ weight: 102.5, reps: 5, rir: 0, performedAt: "2026-05-08T10:00:00Z" }),
    ];
    const trend = computeMatchedEffortTrend(sets);
    expect(trend).not.toBeNull();
    expect(trend.rir).toBe(0);
  });
});
