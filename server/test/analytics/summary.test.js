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

  test("perMuscle matches a direct aggregateMuscleVolume call with ISO series dates", () => {
    const fixtures = resolvedFixtures();
    const summary = buildSummary(fixtures, { from, to });
    const raw = aggregateMuscleVolume(fixtures, { from, to });
    expect(summary.perMuscle).toEqual(
      raw.map((row) => ({
        ...row,
        series: row.series.map((w) => ({
          ...w,
          weekStart: w.weekStart.toISOString(),
          weekEnd: w.weekEnd.toISOString(),
        })),
      }))
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

  test("perExercise topSet.performedAt and topSetSeries dates are ISO strings", () => {
    const summary = buildSummary(resolvedFixtures(), { from, to });
    const withTop = summary.perExercise.filter((e) => e.topSet !== null);
    expect(withTop.length).toBeGreaterThan(0);
    for (const entry of withTop) {
      expect(typeof entry.topSet.performedAt).toBe("string");
      expect(entry.topSet.performedAt instanceof Date).toBe(false);
      expect(Array.isArray(entry.topSetSeries)).toBe(true);
      for (const p of entry.topSetSeries) {
        expect(typeof p.performedAt).toBe("string");
        expect(p).toHaveProperty("weight");
        expect(p).toHaveProperty("reps");
      }
    }
  });

  test("perExercise entries carry matchedEffortTrend through buildSummary", () => {
    // Two bench sessions at the same RIR so the trend is non-null.
    const fixtures = resolvedFixtures().concat(
      enrichSet({
        exerciseName: BENCH,
        weight: 105,
        reps: 5,
        rir: 2,
        performedAt: "2026-06-12T10:00:00Z",
      })
    );

    const summary = buildSummary(fixtures, { from, to });
    for (const entry of summary.perExercise) {
      expect(entry).toHaveProperty("matchedEffortTrend");
    }
    const bench = summary.perExercise.find((e) =>
      /Bench Press/.test(e.name)
    );
    expect(bench.matchedEffortTrend.rir).toBe(2);
    expect(bench.matchedEffortTrend.sessions).toBe(2);
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

  test("effortCoverage counts RIR and RPE sets alike; sets without either dilute it", () => {
    // Fixtures: bench RIR 2, bench no-effort, hamstring RIR 3 -> plus one
    // RPE-only bench set = 3 of 4 attributed sets carrying an effort signal.
    const fixtures = resolvedFixtures().concat(
      enrichSet({
        exerciseName: BENCH,
        weight: 100,
        reps: 5,
        rpe: 8,
        performedAt: "2026-06-11T10:00:00Z",
      })
    );

    const summary = buildSummary(fixtures, { from, to });
    expect(summary.meta.effortCoverage).toBe(0.75);
    // effortCoverage is the only coverage field (the old name is gone).
    expect(Object.keys(summary.meta).sort()).toEqual([
      "effortCoverage",
      "honestyNotes",
    ]);
  });

  test("effortCoverage is null with no attributed sets in range", () => {
    const summary = buildSummary([], { from, to });
    expect(summary.meta.effortCoverage).toBeNull();
  });

  test("summary object is JSON-serializable (no raw Dates)", () => {
    const summary = buildSummary(resolvedFixtures(), { from, to });
    expect(() => JSON.stringify(summary)).not.toThrow();
  });

  function collectDates(value, found = []) {
    if (value instanceof Date) {
      found.push(value);
      return found;
    }
    if (Array.isArray(value)) {
      for (const item of value) collectDates(item, found);
    } else if (value && typeof value === "object") {
      for (const v of Object.values(value)) collectDates(v, found);
    }
    return found;
  }

  test("perMuscle and perExercise contain no Date instances in new time-series fields", () => {
    const summary = buildSummary(resolvedFixtures(), { from, to });
    for (const row of summary.perMuscle) {
      expect(collectDates(row.series)).toEqual([]);
      for (const w of row.series) {
        expect(typeof w.weekStart).toBe("string");
        expect(typeof w.weekEnd).toBe("string");
      }
    }
    for (const entry of summary.perExercise) {
      expect(collectDates(entry.e1rmSeries)).toEqual([]);
      expect(collectDates(entry.topSetSeries)).toEqual([]);
      for (const p of entry.e1rmSeries) {
        expect(typeof p.performedAt).toBe("string");
      }
      for (const p of entry.topSetSeries) {
        expect(typeof p.performedAt).toBe("string");
      }
    }
  });
});
