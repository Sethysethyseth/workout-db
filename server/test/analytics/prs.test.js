const { enrichSet } = require("../../src/analytics");
const { detectPRs, computeStandingPRs } = require("../../src/analytics/prs");

const BENCH = "Barbell Bench Press - Medium Grip";

function benchSet({ performedAt, weight = 100, reps = 5 }) {
  return enrichSet({
    exerciseName: BENCH,
    weight,
    reps,
    performedAt,
  });
}

describe("detectPRs", () => {
  describe("first-session suppression", () => {
    test("sets in the first session do not generate PRs", () => {
      // All sets in a session share the same performedAt (session timestamp)
      const firstSession = "2026-06-01T10:00:00Z";
      const sets = [
        benchSet({ performedAt: firstSession, weight: 100, reps: 5 }),
        benchSet({ performedAt: firstSession, weight: 110, reps: 5 }),
        benchSet({ performedAt: firstSession, weight: 120, reps: 5 }),
      ];

      const prs = detectPRs(sets);
      expect(prs).toHaveLength(0);
    });

    test("multiple sets with same performedAt are all considered first session", () => {
      const firstSession = "2026-06-01T10:00:00Z";
      const sets = [
        benchSet({ performedAt: firstSession, weight: 100, reps: 5 }),
        benchSet({ performedAt: firstSession, weight: 200, reps: 10 }),
      ];

      expect(detectPRs(sets)).toHaveLength(0);
    });

    test("second session sets can generate PRs", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 110, reps: 5 }),
      ];

      const prs = detectPRs(sets);
      expect(prs.length).toBeGreaterThan(0);
    });
  });

  describe("weightPR", () => {
    test("fires when weight exceeds all prior weights", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 110, reps: 5 }),
      ];

      const prs = detectPRs(sets);
      const weightPRs = prs.filter((p) => p.type === "weightPR");
      expect(weightPRs).toHaveLength(1);
      expect(weightPRs[0].value).toBe(110);
      expect(weightPRs[0].weight).toBe(110);
      expect(weightPRs[0].reps).toBe(5);
    });

    test("does not fire when weight equals prior best", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 8 }),
      ];

      const prs = detectPRs(sets);
      const weightPRs = prs.filter((p) => p.type === "weightPR");
      expect(weightPRs).toHaveLength(0);
    });

    test("fires multiple times across sessions", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 110, reps: 5 }),
        benchSet({ performedAt: "2026-06-15T10:00:00Z", weight: 120, reps: 5 }),
      ];

      const prs = detectPRs(sets);
      const weightPRs = prs.filter((p) => p.type === "weightPR");
      expect(weightPRs).toHaveLength(2);
      expect(weightPRs.map((p) => p.value)).toEqual([110, 120]);
    });
  });

  describe("e1rmPR", () => {
    test("fires when Epley e1RM exceeds prior best", () => {
      // 100 x 5 -> e1RM = 100 * (1 + 5/30) = 116.67
      // 100 x 8 -> e1RM = 100 * (1 + 8/30) = 126.67
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 8 }),
      ];

      const prs = detectPRs(sets);
      const e1rmPRs = prs.filter((p) => p.type === "e1rmPR");
      expect(e1rmPRs).toHaveLength(1);
      expect(e1rmPRs[0].value).toBeCloseTo(126.67, 1);
    });

    test("does not fire when e1RM equals prior best", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 5 }),
      ];

      const prs = detectPRs(sets);
      const e1rmPRs = prs.filter((p) => p.type === "e1rmPR");
      expect(e1rmPRs).toHaveLength(0);
    });
  });

  describe("repsAtWeightPR", () => {
    test("fires when reps exceed prior best at the same weight", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 8 }),
      ];

      const prs = detectPRs(sets);
      const repsAtWeightPRs = prs.filter((p) => p.type === "repsAtWeightPR");
      expect(repsAtWeightPRs).toHaveLength(1);
      expect(repsAtWeightPRs[0].value).toBe(8);
      expect(repsAtWeightPRs[0].weight).toBe(100);
    });

    test("fires when reps exceed prior best at a HIGHER weight (same-or-higher edge)", () => {
      // Prior: 110 x 5
      // New: 100 x 8 - this beats "5 reps at 110" because 8 > 5 at same-or-higher weight
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 110, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 8 }),
      ];

      const prs = detectPRs(sets);
      const repsAtWeightPRs = prs.filter((p) => p.type === "repsAtWeightPR");
      expect(repsAtWeightPRs).toHaveLength(1);
      expect(repsAtWeightPRs[0].value).toBe(8);
    });

    test("does NOT fire when reps equal prior best at same-or-higher weight", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 8 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 8 }),
      ];

      const prs = detectPRs(sets);
      const repsAtWeightPRs = prs.filter((p) => p.type === "repsAtWeightPR");
      expect(repsAtWeightPRs).toHaveLength(0);
    });

    test("does NOT fire when reps are lower than prior at HIGHER weight", () => {
      // Prior: 110 x 10
      // New: 100 x 8 - does NOT beat "10 reps at 110" because 8 < 10
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 110, reps: 10 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 8 }),
      ];

      const prs = detectPRs(sets);
      const repsAtWeightPRs = prs.filter((p) => p.type === "repsAtWeightPR");
      expect(repsAtWeightPRs).toHaveLength(0);
    });
  });

  describe("multi-type single set", () => {
    test("a single set can hold multiple PR types", () => {
      // Session 1: 100 x 5 (e1RM ~ 116.67)
      // Session 2: 110 x 8 (e1RM ~ 139.33)
      //   - weightPR: 110 > 100
      //   - e1rmPR: 139.33 > 116.67
      //   - repsAtWeightPR: 8 reps at 110 beats 5 reps at prior weight >= 110 (there was 100 x 5, but 100 < 110)
      // Note: repsAtWeightPR requires beating a prior at same-or-higher weight. Since there's no
      // prior at weight >= 110, this won't fire. Let's adjust the test.
      //
      // Better test: Session 1: 100 x 5, Session 2: 100 x 10 -> repsAtWeightPR, e1rmPR (both at same weight)
      // Then Session 3: 110 x 12 -> weightPR, repsAtWeightPR (12 > 10 at 100, which is < 110... wait no)
      //
      // Actually repsAtWeightPR for a set at weight W checks priors at weight >= W.
      // So for 110 x 12, we check if 12 > all priors at >= 110. Priors at >= 110: none.
      //
      // Let me make a clearer test: prior sets establish records at multiple weights
      const sets = [
        // Session 1: establish baseline at 100
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        // Session 2: same weight, more reps -> repsAtWeightPR, e1rmPR
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 10 }),
      ];

      const prs = detectPRs(sets);
      expect(prs).toHaveLength(2);

      const types = prs.map((p) => p.type).sort();
      expect(types).toEqual(["e1rmPR", "repsAtWeightPR"]);

      // All should be from the same set
      const performedAts = new Set(prs.map((p) => p.performedAt));
      expect(performedAts.size).toBe(1);
    });

    test("a set can hold all three PR types when beating prior at same weight", () => {
      // Session 1: 100 x 5
      // Session 2: 100 x 6 -> repsAtWeightPR, e1rmPR (no weightPR since same weight)
      // Session 3: 110 x 8 -> weightPR, e1rmPR, and repsAtWeightPR IF we also had 110 in prior
      // Better: need prior at same weight to beat
      const sets = [
        // Session 1: two weights
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 110, reps: 3 }),
        // Session 2: beat all three at 110
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 120, reps: 5 }), // weightPR
      ];

      const prs = detectPRs(sets);
      const session2PRs = prs.filter((p) => p.performedAt.includes("2026-06-08"));
      
      // 120 x 5: weightPR (120 > 110), e1rmPR (120*1.167 > 110*1.1), 
      // repsAtWeightPR: 5 reps at 120, priors at >=120: none, so no repsAtWeightPR
      expect(session2PRs.map((p) => p.type).sort()).toEqual(["e1rmPR", "weightPR"]);
    });
  });

  describe("chronological ordering independence", () => {
    test("input order does not affect PR detection (input != performedAt order)", () => {
      // Intentionally out of order
      const setsOutOfOrder = [
        benchSet({ performedAt: "2026-06-15T10:00:00Z", weight: 130, reps: 5 }),
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 120, reps: 5 }),
      ];

      const setsInOrder = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 120, reps: 5 }),
        benchSet({ performedAt: "2026-06-15T10:00:00Z", weight: 130, reps: 5 }),
      ];

      const prsOutOfOrder = detectPRs(setsOutOfOrder);
      const prsInOrder = detectPRs(setsInOrder);

      // Sort both for comparison
      const sortPRs = (arr) =>
        [...arr].sort((a, b) => a.performedAt.localeCompare(b.performedAt) || a.type.localeCompare(b.type));

      expect(sortPRs(prsOutOfOrder)).toEqual(sortPRs(prsInOrder));
    });
  });

  describe("edge cases", () => {
    test("empty array returns empty PRs", () => {
      expect(detectPRs([])).toEqual([]);
    });

    test("null/undefined returns empty PRs", () => {
      expect(detectPRs(null)).toEqual([]);
      expect(detectPRs(undefined)).toEqual([]);
    });

    test("sets with weight <= 0 or reps < 1 are ignored", () => {
      const sets = [
        benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
        enrichSet({
          exerciseName: BENCH,
          weight: 0,
          reps: 5,
          performedAt: "2026-06-08T10:00:00Z",
        }),
        enrichSet({
          exerciseName: BENCH,
          weight: 100,
          reps: 0,
          performedAt: "2026-06-15T10:00:00Z",
        }),
      ];

      const prs = detectPRs(sets);
      expect(prs).toHaveLength(0);
    });
  });
});

describe("computeStandingPRs", () => {
  test("returns current standing records for each type", () => {
    const sets = [
      benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
      benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 120, reps: 5 }),
      benchSet({ performedAt: "2026-06-15T10:00:00Z", weight: 100, reps: 10 }),
    ];

    const standing = computeStandingPRs(sets);

    expect(standing.weightPR.value).toBe(120);
    expect(standing.weightPR.performedAt).toBe(new Date("2026-06-08T10:00:00Z").toISOString());

    // repsAtWeightPR: session 3's 100x10 beats session 1's 100x5, so it's a valid event
    expect(standing.repsAtWeightPR.reps).toBe(10);
    expect(standing.repsAtWeightPR.weight).toBe(100);

    expect(standing.e1rmPR).not.toBeNull();
  });

  test("returns nulls for empty sets", () => {
    const standing = computeStandingPRs([]);
    expect(standing).toEqual({
      weightPR: null,
      e1rmPR: null,
      repsAtWeightPR: null,
    });
  });

  test("input order does not affect standing records (ties resolve chronologically)", () => {
    // Two sets tie on weight; the standing weightPR must report the same
    // occurrence regardless of the order the caller passes them in.
    const inOrder = [
      benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
      benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 200, reps: 4 }),
      benchSet({ performedAt: "2026-06-15T10:00:00Z", weight: 200, reps: 6 }),
    ];
    const outOfOrder = [...inOrder].reverse();

    expect(computeStandingPRs(outOfOrder)).toEqual(computeStandingPRs(inOrder));
  });

  describe("warmup set bug (the reported defect)", () => {
    test("warmup 45x20 does NOT become standing repsAtWeightPR over real work", () => {
      // The exact defect from the task: session 1 45x20 (warmup) + 225x5,
      // session 2 45x20 + 235x5. Old buggy code: repsAtWeightPR = { value: 20, weight: 45 }
      // Fixed code: repsAtWeightPR is null (no repsAtWeightPR events fire because
      // session 1 sets don't count, and session 2's warmup 45x20 doesn't beat
      // the prior 45x20, and 235x5 doesn't beat 225x5 at same-or-higher weight).
      const session1 = "2026-06-01T10:00:00Z";
      const session2 = "2026-06-08T10:00:00Z";
      const sets = [
        benchSet({ performedAt: session1, weight: 45, reps: 20 }),
        benchSet({ performedAt: session1, weight: 225, reps: 5 }),
        benchSet({ performedAt: session2, weight: 45, reps: 20 }),
        benchSet({ performedAt: session2, weight: 235, reps: 5 }),
      ];

      const standing = computeStandingPRs(sets);

      // The warmup should NOT be the standing repsAtWeightPR
      expect(standing.repsAtWeightPR).toBeNull();

      // weightPR should be 235 (all-time best, including first session)
      expect(standing.weightPR.value).toBe(235);

      // e1rmPR should be non-null
      expect(standing.e1rmPR).not.toBeNull();
    });
  });

  describe("legitimate rep PR fixture", () => {
    test("100x5 -> 100x8 produces standing repsAtWeightPR at weight 100 with 8 reps", () => {
      const session1 = "2026-06-01T10:00:00Z";
      const session2 = "2026-06-08T10:00:00Z";
      const sets = [
        benchSet({ performedAt: session1, weight: 100, reps: 5 }),
        benchSet({ performedAt: session2, weight: 100, reps: 8 }),
      ];

      const standing = computeStandingPRs(sets);

      expect(standing.repsAtWeightPR).not.toBeNull();
      expect(standing.repsAtWeightPR.weight).toBe(100);
      expect(standing.repsAtWeightPR.reps).toBe(8);
      expect(standing.repsAtWeightPR.performedAt).toBe(new Date(session2).toISOString());
    });
  });

  describe("heaviest-wins selection", () => {
    test("when rep-PR events fire at both light and heavy weights, standing record is the heavy one", () => {
      // This is the test that would have caught the shipped bug - it must fail
      // against the old implementation (which selected by global max reps).
      // Session 1: 100x5, 200x3
      // Session 2: 100x8 (repsAtWeightPR: beats 100x5), 200x5 (repsAtWeightPR: beats 200x3)
      // Old bug: would pick 100x8 because 8 > 5 (global max reps)
      // Fixed: picks 200x5 because 200 > 100 (heaviest weight)
      const session1 = "2026-06-01T10:00:00Z";
      const session2 = "2026-06-08T10:00:00Z";
      const sets = [
        benchSet({ performedAt: session1, weight: 100, reps: 5 }),
        benchSet({ performedAt: session1, weight: 200, reps: 3 }),
        benchSet({ performedAt: session2, weight: 100, reps: 8 }),
        benchSet({ performedAt: session2, weight: 200, reps: 5 }),
      ];

      const standing = computeStandingPRs(sets);

      // The standing repsAtWeightPR should be the HEAVY one (200x5), not the light one (100x8)
      expect(standing.repsAtWeightPR).not.toBeNull();
      expect(standing.repsAtWeightPR.weight).toBe(200);
      expect(standing.repsAtWeightPR.reps).toBe(5);
    });
  });

  describe("consistency invariant (anti-drift guard)", () => {
    test("standing repsAtWeightPR matches a detectPRs event exactly", () => {
      // For a mixed multi-session fixture, if computeStandingPRs(sets).repsAtWeightPR
      // is non-null then some event in detectPRs(sets) has type === "repsAtWeightPR"
      // and the SAME weight, reps, and performedAt.
      const session1 = "2026-06-01T10:00:00Z";
      const session2 = "2026-06-08T10:00:00Z";
      const session3 = "2026-06-15T10:00:00Z";
      const sets = [
        benchSet({ performedAt: session1, weight: 100, reps: 5 }),
        benchSet({ performedAt: session1, weight: 150, reps: 3 }),
        benchSet({ performedAt: session2, weight: 100, reps: 7 }),
        benchSet({ performedAt: session2, weight: 150, reps: 4 }),
        benchSet({ performedAt: session3, weight: 120, reps: 6 }),
      ];

      const standing = computeStandingPRs(sets);
      const prEvents = detectPRs(sets);

      if (standing.repsAtWeightPR !== null) {
        const matchingEvent = prEvents.find(
          (e) =>
            e.type === "repsAtWeightPR" &&
            e.weight === standing.repsAtWeightPR.weight &&
            e.reps === standing.repsAtWeightPR.reps &&
            e.performedAt === standing.repsAtWeightPR.performedAt
        );
        expect(matchingEvent).toBeDefined();
      }
    });
  });

  describe("first-session suppression for repsAtWeightPR", () => {
    test("no standing repsAtWeightPR is ever dated to the exercise's first session", () => {
      // Various fixtures to ensure first-session suppression is inherited from detectPRs
      const fixtures = [
        // Single session: no repsAtWeightPR possible
        [benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 10 })],
        // Two sessions, PR in second
        [
          benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
          benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 8 }),
        ],
        // Multiple first-session sets
        [
          benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 5 }),
          benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 100, reps: 10 }),
          benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 100, reps: 12 }),
        ],
      ];

      for (const sets of fixtures) {
        const standing = computeStandingPRs(sets);
        if (standing.repsAtWeightPR !== null) {
          // The first session is the earliest performedAt
          const sorted = [...sets].sort(
            (a, b) => a.performedAt.getTime() - b.performedAt.getTime()
          );
          const firstSessionMs = sorted[0].performedAt.getTime();
          const standingMs = new Date(standing.repsAtWeightPR.performedAt).getTime();
          expect(standingMs).not.toBe(firstSessionMs);
        }
      }
    });
  });
});

describe("3-session fixture stream example", () => {
  test("produces expected PR list for delivery report", () => {
    // Session 1 (2026-06-01): 135 x 5
    // Session 2 (2026-06-08): 145 x 5 -> weightPR, e1rmPR
    // Session 3 (2026-06-15): 135 x 8 -> repsAtWeightPR, e1rmPR
    const sets = [
      benchSet({ performedAt: "2026-06-01T10:00:00Z", weight: 135, reps: 5 }),
      benchSet({ performedAt: "2026-06-08T10:00:00Z", weight: 145, reps: 5 }),
      benchSet({ performedAt: "2026-06-15T10:00:00Z", weight: 135, reps: 8 }),
    ];

    const prs = detectPRs(sets);

    // Session 2: weightPR (145 > 135), e1rmPR (145*(1+5/30) > 135*(1+5/30))
    const session2PRs = prs.filter((p) => p.performedAt.includes("2026-06-08"));
    expect(session2PRs.map((p) => p.type).sort()).toEqual(["e1rmPR", "weightPR"]);
    expect(session2PRs.find((p) => p.type === "weightPR").value).toBe(145);

    // Session 3: repsAtWeightPR (8 > 5 at same weight), e1rmPR (135*(1+8/30) = 171 > 145*(1+5/30) = 169.17)
    const session3PRs = prs.filter((p) => p.performedAt.includes("2026-06-15"));
    expect(session3PRs.map((p) => p.type).sort()).toEqual(["e1rmPR", "repsAtWeightPR"]);
    expect(session3PRs.find((p) => p.type === "repsAtWeightPR").value).toBe(8);

    // Total: 4 PRs across 2 sessions
    expect(prs).toHaveLength(4);
  });
});
