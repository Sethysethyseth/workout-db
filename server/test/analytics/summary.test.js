const {
  enrichSet,
  buildSummary,
  aggregateMuscleVolume,
  computeWeeksInRange,
} = require("../../src/analytics");

const BENCH = "Barbell Bench Press - Medium Grip";

const FRONT_REAR_NOTE =
  "frontRearDelt cannot be computed: the exercise catalog's muscle taxonomy has no separate front/rear deltoid distinction (single 'shoulders' bucket).";
const PR_NOTE =
  "PR detection (tracked-vs-estimated) is not yet implemented; it requires full lift history beyond the selected range.";

const from = "2026-06-01T00:00:00Z";
const to = "2026-06-15T00:00:00Z";

function resolvedFixtures() {
  return [
    enrichSet({
      exerciseName: BENCH,
      weight: 100,
      reps: 5,
      rir: 2,
      performedAt: "2026-06-02T10:00:00Z",
    }),
    enrichSet({
      exerciseName: BENCH,
      weight: 110,
      reps: 5,
      performedAt: "2026-06-09T10:00:00Z",
    }),
    // Resolved but uncurated (falls back to primary/secondary attribution).
    enrichSet({
      exerciseName: "90/90 Hamstring",
      weight: 20,
      reps: 10,
      rir: 3,
      performedAt: "2026-06-05T10:00:00Z",
    }),
  ];
}

describe("buildSummary", () => {
  test("range fields are ISO strings and weeks matches computeWeeksInRange", () => {
    const summary = buildSummary(resolvedFixtures(), { from, to });
    expect(summary.range.from).toBe("2026-06-01T00:00:00.000Z");
    expect(summary.range.to).toBe("2026-06-15T00:00:00.000Z");
    expect(summary.range.weeks).toBe(computeWeeksInRange(from, to));
  });

  test("perMuscle matches a direct aggregateMuscleVolume call", () => {
    const fixtures = resolvedFixtures();
    const summary = buildSummary(fixtures, { from, to });
    expect(summary.perMuscle).toEqual(
      aggregateMuscleVolume(fixtures, { from, to })
    );
  });

  test("perExercise bestSet.performedAt is an ISO string, not a Date", () => {
    const summary = buildSummary(resolvedFixtures(), { from, to });
    const withBest = summary.perExercise.filter((e) => e.bestSet !== null);
    expect(withBest.length).toBeGreaterThan(0);
    for (const entry of withBest) {
      expect(typeof entry.bestSet.performedAt).toBe("string");
      expect(entry.bestSet.performedAt instanceof Date).toBe(false);
    }
  });

  test("prs and execution are empty arrays", () => {
    const summary = buildSummary(resolvedFixtures(), { from, to });
    expect(summary.prs).toEqual([]);
    expect(summary.execution).toEqual([]);
  });

  test("honestyNotes always contain both baseline notes verbatim", () => {
    const summary = buildSummary(resolvedFixtures(), { from, to });
    expect(summary.meta.honestyNotes).toContain(FRONT_REAR_NOTE);
    expect(summary.meta.honestyNotes).toContain(PR_NOTE);
  });

  test("unresolved-count note present only when an unresolved set is in range", () => {
    const withUnresolved = resolvedFixtures().concat(
      enrichSet({
        exerciseName: "Nonexistent Made Up Exercise",
        weight: 100,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-06T10:00:00Z",
      })
    );

    const noteMatches = (notes) =>
      notes.filter((n) => /unresolved exercise name/.test(n));

    const withNote = buildSummary(withUnresolved, { from, to });
    expect(noteMatches(withNote.meta.honestyNotes)).toEqual([
      "1 set(s) in this range had an unresolved exercise name and were excluded from all metrics.",
    ]);

    const withoutNote = buildSummary(resolvedFixtures(), { from, to });
    expect(noteMatches(withoutNote.meta.honestyNotes)).toEqual([]);
  });

  test("summary object is JSON-serializable (no raw Dates)", () => {
    const summary = buildSummary(resolvedFixtures(), { from, to });
    expect(() => JSON.stringify(summary)).not.toThrow();
  });
});
