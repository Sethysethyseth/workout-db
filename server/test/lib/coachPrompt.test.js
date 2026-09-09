const {
  compactSummaryForCoach,
  buildCoachSystemBlocks,
  buildCoachMessages,
  describeFocus,
  COACH_PERSONA,
} = require("../../src/coach/prompt");

function makeSummary() {
  return {
    range: { from: "2026-08-01T00:00:00.000Z", to: "2026-08-28T23:59:59.999Z", weeks: 4 },
    workoutCount: 9,
    perMuscle: [
      {
        muscle: "chest",
        effectiveSets: 11.5,
        stimulatingSets: 7.2,
        frequency: 2,
        daysSinceLast: 3,
        series: [
          { periodStart: "2026-07-31T23:59:59.999Z", periodEnd: "2026-08-07T23:59:59.999Z", effectiveSets: 10, stimulatingSets: 6 },
          { periodStart: "2026-08-07T23:59:59.999Z", periodEnd: "2026-08-14T23:59:59.999Z", effectiveSets: 13, stimulatingSets: 8.4 },
        ],
      },
    ],
    perExercise: [
      {
        exerciseId: "bench",
        name: "Barbell Bench Press",
        e1rmSeries: [
          { performedAt: "2026-08-02T10:00:00.000Z", epley: 200, weight: 180, reps: 5 },
          { performedAt: "2026-08-20T10:00:00.000Z", epley: 212, weight: 185, reps: 6 },
        ],
        topSetSeries: [
          { performedAt: "2026-08-02T10:00:00.000Z", weight: 180, reps: 5 },
          { performedAt: "2026-08-20T10:00:00.000Z", weight: 185, reps: 6 },
        ],
        topSet: { weight: 185, reps: 6, performedAt: "2026-08-20T10:00:00.000Z" },
        bestSet: { weight: 185, reps: 6, rir: 2, rpe: null, performedAt: "2026-08-20T10:00:00.000Z", e1rm: { epley: 212 } },
        matchedEffortTrend: { delta: 9.5, rir: 2, effortUnit: "rir", sessions: 3 },
        sets: [{ weight: 185, reps: 6 }],
      },
    ],
    prs: [
      { type: "weightPR", value: 185, weight: 185, reps: 6, performedAt: "2026-08-20T10:00:00.000Z", identity: { exerciseId: "bench" }, exerciseName: "Barbell Bench Press" },
    ],
    balance: { pushPull: 1.1, quadHam: 0.9, frontRearDelt: null },
    execution: [{ exerciseId: "bench", name: "Barbell Bench Press", loadAdherence: 1, volumeAdherence: 1, effortDrift: 0.5 }],
    meta: { effortCoverage: 0.42, seriesGranularity: "week", honestyNotes: ["front/rear delt not split"] },
  };
}

describe("compactSummaryForCoach - the section 2 boundary in code", () => {
  test("keeps range, counts, balance, execution, PRs and meta; collapses series to endpoints", () => {
    const compact = compactSummaryForCoach(makeSummary());
    expect(compact.range).toEqual({ from: "2026-08-01", to: "2026-08-28", weeks: 4 });
    expect(compact.workoutCount).toBe(9);
    expect(compact.balance).toEqual({ pushPull: 1.1, quadHam: 0.9, frontRearDelt: null });
    expect(compact.execution).toHaveLength(1);
    expect(compact.meta.effortCoverage).toBe(0.42);
    expect(compact.meta.honestyNotes).toEqual(["front/rear delt not split"]);
    expect(compact.prs).toEqual([
      { type: "weightPR", exerciseName: "Barbell Bench Press", value: 185, weight: 185, reps: 6, performedAt: "2026-08-20" },
    ]);

    const ex = compact.perExercise[0];
    expect(ex.sessionsInRange).toBe(2);
    expect(ex.topSetTrend).toEqual({
      first: { weight: 180, reps: 5, performedAt: "2026-08-02" },
      last: { weight: 185, reps: 6, performedAt: "2026-08-20" },
      points: 2,
    });
    expect(ex.e1rmTrend.first.epley).toBe(200);
    expect(ex.e1rmTrend.last.epley).toBe(212);
    expect(ex.bestSet.e1rmEpley).toBe(212);
    expect(ex.matchedEffortTrend.delta).toBe(9.5);
  });

  test("renames per-muscle averages so the unit of measure is explicit", () => {
    const compact = compactSummaryForCoach(makeSummary());
    expect(compact.perMuscle[0]).toMatchObject({
      muscle: "chest",
      effectiveSetsPerWeek: 11.5,
      stimulatingSetsPerWeek: 7.2,
      sessionsPerWeek: 2,
      daysSinceLast: 3,
    });
    expect(compact.perMuscle[0].series[0]).toEqual({ periodEnd: "2026-08-07", effectiveSets: 10, stimulatingSets: 6 });
  });

  test("never carries a raw set anywhere in the payload", () => {
    const json = JSON.stringify(compactSummaryForCoach(makeSummary()));
    expect(json).not.toContain('"sets"');
    expect(json).not.toContain('"e1rmSeries"');
    expect(json).not.toContain('"topSetSeries"');
    expect(json).not.toContain('"identity"');
  });
});

describe("buildCoachSystemBlocks", () => {
  const base = {
    primary: { workoutCount: 1 },
    unit: "kg",
    focus: { type: "view", view: "muscles" },
    today: "2026-09-09",
    weeks: 4,
    fromLabel: "2026-08-13",
    toLabel: "2026-09-09",
  };

  test("persona first, data second with the ONE cache breakpoint, volatile framing last", () => {
    const blocks = buildCoachSystemBlocks(base);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].text).toBe(COACH_PERSONA);
    expect(blocks[0].cache_control).toBeUndefined();
    expect(blocks[1].cache_control).toEqual({ type: "ephemeral" });
    expect(blocks[1].text).toContain('{"workoutCount":1}');
    expect(blocks[2].cache_control).toBeUndefined();
    expect(blocks[2].text).toContain("Today is 2026-09-09.");
    expect(blocks[2].text).toContain("Weights are in kg.");
    expect(blocks[2].text).toContain("muscles view");
    expect(blocks[2].text).toContain("4 weeks (2026-08-13 to 2026-09-09)");
  });

  test("the persona states the boundary in plain words", () => {
    expect(COACH_PERSONA).toMatch(/never recalculate/i);
    expect(COACH_PERSONA).toMatch(/effortCoverage/);
    expect(COACH_PERSONA).toMatch(/No medical advice/);
  });

  test("a session debrief carries two data blocks inside the cached block", () => {
    const blocks = buildCoachSystemBlocks({
      ...base,
      focus: { type: "session", sessionId: 7 },
      primary: { workoutCount: 1, session: { id: 7 } },
      context: { workoutCount: 12 },
    });
    expect(blocks[1].text).toContain("Workout being debriefed");
    expect(blocks[1].text).toContain("Trailing four weeks");
    expect(blocks[2].text).toContain("Debrief mode");
  });

  test("describeFocus returns null without a focus", () => {
    expect(describeFocus(null)).toBeNull();
  });
});

describe("buildCoachMessages", () => {
  test("appends the question after normalized history", () => {
    const messages = buildCoachMessages({
      history: [
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
      ],
      question: "c",
    });
    expect(messages).toEqual([
      { role: "user", content: "a" },
      { role: "assistant", content: "b" },
      { role: "user", content: "c" },
    ]);
  });
});
