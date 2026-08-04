const {
  trimSummaryForTool,
  estimatePayloadSize,
  withHonestyNote,
} = require("../../src/ai/toolPayloads");

function makeSummary(exerciseCount) {
  const perExercise = Array.from({ length: exerciseCount }, (_, i) => ({
    exerciseId: `ex-${i}`,
    name: `Exercise ${i}`,
    e1rmSeries: [
      {
        performedAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
        epley: 100 + i,
      },
    ],
    topSetSeries: [],
  }));

  return {
    range: {
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-03-01T23:59:59.999Z",
      weeks: 8,
    },
    workoutCount: 12,
    perMuscle: [],
    perExercise,
    prs: [],
    balance: { pushPull: 1, upperLower: 1 },
    execution: {},
    meta: {
      effortCoverage: 0.5,
      seriesGranularity: "week",
      honestyNotes: ["baseline note"],
    },
  };
}

describe("trimSummaryForTool", () => {
  test("caps perExercise to maxExercises and records truncation", () => {
    const summary = makeSummary(10);
    const trimmed = trimSummaryForTool(summary, { maxExercises: 3 });
    expect(trimmed.perExercise).toHaveLength(3);
    expect(trimmed.truncation).toEqual(
      expect.objectContaining({
        field: "perExercise",
        kept: 3,
        omitted: 7,
        maxExercises: 3,
      })
    );
    expect(trimmed.truncation.note).toMatch(/7 exercise/);
  });

  test("never removes meta, range, workoutCount, or balance", () => {
    const summary = makeSummary(8);
    const trimmed = trimSummaryForTool(summary, { maxExercises: 2 });
    expect(trimmed).toHaveProperty("meta");
    expect(trimmed).toHaveProperty("range");
    expect(trimmed).toHaveProperty("workoutCount");
    expect(trimmed).toHaveProperty("balance");
    expect(trimmed.meta.effortCoverage).toBe(0.5);
    expect(trimmed.workoutCount).toBe(12);
    expect(trimmed.balance).toEqual({ pushPull: 1, upperLower: 1 });
  });

  test("under-cap summary round-trips with perExercise unchanged and no truncation", () => {
    const summary = makeSummary(3);
    const trimmed = trimSummaryForTool(summary, { maxExercises: 10 });
    expect(trimmed.perExercise).toEqual(summary.perExercise);
    expect(trimmed.truncation).toBeUndefined();
  });
});

describe("estimatePayloadSize", () => {
  test("returns exact JSON.stringify length for a known small object", () => {
    const obj = { a: 1, b: "two" };
    expect(estimatePayloadSize(obj)).toBe(JSON.stringify(obj).length);
  });
});

describe("withHonestyNote", () => {
  test("appends without clobbering existing honestyNotes", () => {
    const payload = {
      totals: { sets: 1 },
      meta: { honestyNotes: ["keep me"] },
    };
    const next = withHonestyNote(payload, "extra caveat");
    expect(next.meta.honestyNotes).toEqual(["keep me", "extra caveat"]);
  });
});
