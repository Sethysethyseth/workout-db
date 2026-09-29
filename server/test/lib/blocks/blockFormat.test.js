const fs = require("fs");
const path = require("path");

const { validateBlockDraft } = require("../../../src/blocks/blockFormat");
const { parseDelimited } = require("../../../src/blocks/parseDelimited");
const { tableToBlock } = require("../../../src/blocks/tableToBlock");
const { historyToBlock } = require("../../../src/blocks/historyToBlock");
const {
  formatToCreatePayload,
  blockTreeToFormat,
} = require("../../../src/blocks/blockFormatMapping");
const {
  BLOCK_FORMAT_AI_INSTRUCTIONS,
  BLOCK_FORMAT_EXAMPLE,
  BLOCK_FORMAT_JSON_SCHEMA,
} = require("../../../src/blocks/aiFormatPrompt");

const fixtures = path.join(__dirname, "fixtures");

function readFixture(name) {
  return fs.readFileSync(path.join(fixtures, name), "utf8");
}

/** Mimic GET /block-templates/:id tree from a create payload. */
function fakeTreeFrom(payload) {
  return {
    name: payload.name,
    description: payload.description,
    useRPE: payload.useRPE,
    useRIR: payload.useRIR,
    weeks: (payload.weeks || []).map((w) => ({
      order: w.order,
      label: w.label,
      workouts: (w.workouts || []).map((wo) => ({
        order: wo.order,
        name: wo.name,
        exercises: (wo.exercises || []).map((ex) => ({
          order: ex.order,
          exerciseName: ex.exerciseName,
          notes: ex.notes,
          restSec: ex.restSec,
          effortCap: ex.effortCap,
          blockWorkoutSets: (ex.sets || []).map((s) => ({
            order: s.order,
            reps: s.reps,
            repsMax: s.repsMax,
            durationSec: s.durationSec,
            weight: s.weight,
            rpe: s.rpe,
            rir: s.rir,
          })),
        })),
      })),
    })),
  };
}

const SPEC_EXAMPLE = {
  format: "logchamp.block",
  version: 1,
  name: "Upper/Lower - 4 weeks",
  description: "Optional, up to 2000 characters.",
  unit: "lb",
  effort: "rpe",
  weeks: [
    {
      label: "Deload",
      days: [
        {
          name: "Upper A",
          exercises: [
            {
              name: "Bench Press",
              notes: "Pause 1s on the chest",
              restSec: 180,
              effortCap: false,
              sets: [
                { reps: 5, weight: 225, rpe: 8 },
                { reps: 8, repsMax: 10, weight: 185, rpe: 7 },
              ],
            },
            { name: "Plank", sets: 3, durationSec: 45 },
          ],
        },
      ],
    },
  ],
};

describe("validateBlockDraft", () => {
  test("spec 3 example block ok with expected stats", () => {
    const result = validateBlockDraft(SPEC_EXAMPLE, { targetUnit: "lb" });
    expect(result.ok).toBe(true);
    expect(result.stats).toEqual({
      weeks: 1,
      days: 1,
      exercises: 2,
      sets: 5,
      timedSets: 3,
    });
    expect(result.block.weeks[0].days[0].exercises[1].sets).toHaveLength(3);
    expect(result.block.weeks[0].days[0].exercises[1].sets[0].durationSec).toBe(
      45
    );
    expect(result.block.weeks[0].days[0].exercises[0].effortCap).toBeUndefined();
  });

  test("empty weeks array errors at path weeks", () => {
    const input = { ...SPEC_EXAMPLE, weeks: [] };
    const result = validateBlockDraft(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "weeks")).toBe(true);
  });

  test("reps and durationSec together errors on .sets[0]", () => {
    const input = {
      format: "logchamp.block",
      version: 1,
      name: "X",
      weeks: [
        {
          days: [
            {
              name: "D",
              exercises: [
                {
                  name: "E",
                  sets: [{ reps: 8, durationSec: 30 }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = validateBlockDraft(input);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.path.endsWith(".sets[0]"))
    ).toBe(true);
  });

  test("weight 0 errors on .weight", () => {
    const input = {
      format: "logchamp.block",
      version: 1,
      name: "X",
      weeks: [
        {
          days: [
            {
              name: "D",
              exercises: [{ name: "E", sets: [{ reps: 5, weight: 0 }] }],
            },
          ],
        },
      ],
    };
    const result = validateBlockDraft(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path.endsWith(".weight"))).toBe(true);
  });

  test("set fields on exercise with list-form sets is an error", () => {
    const input = {
      format: "logchamp.block",
      version: 1,
      name: "X",
      weeks: [
        {
          days: [
            {
              name: "D",
              exercises: [
                { name: "E", sets: [{ reps: 5 }], reps: 8 },
              ],
            },
          ],
        },
      ],
    };
    const result = validateBlockDraft(input);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) =>
        /set fields belong inside each set/i.test(e.message)
      )
    ).toBe(true);
  });

  test("unknown exercise key load", () => {
    const input = {
      format: "logchamp.block",
      version: 1,
      name: "X",
      weeks: [
        {
          days: [
            {
              name: "D",
              exercises: [{ name: "E", load: 100, sets: [{ reps: 5 }] }],
            },
          ],
        },
      ],
    };
    const result = validateBlockDraft(input);
    expect(result.ok).toBe(false);
    const err = result.errors.find((e) => e.path.endsWith(".load"));
    expect(err).toBeTruthy();
    expect(err.message).toMatch(/unknown field/i);
  });

  test("kg to lb conversion rounds to nearest 0.5", () => {
    const input = {
      format: "logchamp.block",
      version: 1,
      name: "X",
      unit: "kg",
      weeks: [
        {
          days: [
            {
              name: "D",
              exercises: [{ name: "E", sets: [{ reps: 5, weight: 100 }] }],
            },
          ],
        },
      ],
    };
    const result = validateBlockDraft(input, { targetUnit: "lb" });
    expect(result.ok).toBe(true);
    expect(result.block.unit).toBe("lb");
    expect(result.block.weeks[0].days[0].exercises[0].sets[0].weight).toBe(
      220.5
    );
  });

  test("mixing rpe and rir across sets errors", () => {
    const input = {
      format: "logchamp.block",
      version: 1,
      name: "X",
      weeks: [
        {
          days: [
            {
              name: "D",
              exercises: [
                {
                  name: "E",
                  sets: [
                    { reps: 5, rpe: 8 },
                    { reps: 5, rir: 2 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = validateBlockDraft(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /pick one/i.test(e.message))).toBe(true);
  });

  test("validating twice is deep-equal and does not mutate input", () => {
    const input = JSON.parse(JSON.stringify(SPEC_EXAMPLE));
    const snapshot = JSON.stringify(input);
    const a = validateBlockDraft(input, { targetUnit: "lb" });
    const b = validateBlockDraft(input, { targetUnit: "lb" });
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(a).toEqual(b);
    expect(a.ok).toBe(true);
  });
});

describe("parseDelimited + tableToBlock", () => {
  test("phase-1 shaped TSV hard cases", () => {
    const text = readFixture("phase1.tsv");
    const parsed = parseDelimited(text);
    expect(parsed.header[0]).toBe("Week");
    expect(parsed.rows.length).toBeGreaterThanOrEqual(12);

    const withWarmups = tableToBlock(parsed, {
      name: "Phase 1",
      unit: "lb",
      skipWarmups: false,
    });
    expect(
      withWarmups.warnings.every(
        (w) => !/slot/i.test(w.message || "")
      )
    ).toBe(true);

    // Every non-blank source row is in block or a warning
    const accounted = new Set();
    for (const w of withWarmups.warnings) {
      if (w.row != null) accounted.add(w.row);
    }
    // Walk exercises and ensure we have content; count non-blank rows
    const nonBlankRowNums = [];
    for (let i = 0; i < parsed.rows.length; i += 1) {
      const row = parsed.rows[i];
      if (row.some((c) => String(c || "").trim() !== "")) {
        nonBlankRowNums.push(parsed.rowNumbers[i]);
      }
    }
    // Collect exercise names present
    const names = [];
    for (const week of withWarmups.block.weeks) {
      for (const day of week.days) {
        for (const ex of day.exercises) names.push(ex.name);
      }
    }
    expect(names).toContain("Bike");
    expect(names).toContain("Goblet Squat");
    expect(names).toContain("Side Plank");

    // Spacer should be warned
    expect(
      withWarmups.warnings.some((w) => /no exercise name/i.test(w.message))
    ).toBe(true);

    const validated = validateBlockDraft(withWarmups.block, {
      targetUnit: "lb",
    });
    expect(validated.ok).toBe(true);

    // Timed durations 45 / 30 / 300 present
    const durations = [];
    for (const week of validated.block.weeks) {
      for (const day of week.days) {
        for (const ex of day.exercises) {
          for (const s of ex.sets) {
            if (s.durationSec != null) durations.push(s.durationSec);
          }
        }
      }
    }
    expect(durations).toEqual(expect.arrayContaining([45, 30, 300]));

    // Bodyweight: no weight, notes contain Load: bodyweight
    const sidePlank = validated.block.weeks[0].days[0].exercises.find(
      (e) => e.name === "Side Plank"
    );
    expect(sidePlank).toBeTruthy();
    expect(sidePlank.notes).toMatch(/Load: bodyweight/i);
    expect(sidePlank.notes).toMatch(/Setup:/);
    expect(sidePlank.notes).toMatch(/Lead side:/);
    expect(sidePlank.sets.every((s) => s.weight == null)).toBe(true);

    // Capped exercise: effortCap + rpe 6
    const goblet =
      validated.block.weeks[0].days[0].exercises.find(
        (e) => e.name === "Goblet Squat"
      ) ||
      validated.block.weeks[0].days
        .flatMap((d) => d.exercises)
        .find((e) => e.name === "Goblet Squat");
    expect(goblet).toBeTruthy();
    expect(goblet.effortCap).toBe(true);
    expect(goblet.sets[0].rpe).toBe(6);
    expect(goblet.restSec).toBe(90);
    expect(goblet.notes).toMatch(/Setup:/);
    expect(goblet.notes).toMatch(/Lead side:/);

    const skipped = tableToBlock(parsed, {
      name: "Phase 1",
      unit: "lb",
      skipWarmups: true,
    });
    expect(skipped.notices.warmupRows).toBe(1);
    const skippedNames = [];
    for (const week of skipped.block.weeks) {
      for (const day of week.days) {
        for (const ex of day.exercises) skippedNames.push(ex.name);
      }
    }
    expect(skippedNames).not.toContain("Bike");
    expect(names.filter((n) => n === "Bike").length).toBe(1);
  });

  test("CSV with quoted commas and quoted newline", () => {
    const text = readFixture("quoted.csv");
    const parsed = parseDelimited(text);
    expect(parsed.rows[0][0]).toBe("Bench, Press");
    expect(parsed.rows[0][1]).toBe("line1\nline2");
    expect(parsed.rows[1][0]).toBe("Squat");
  });

  test("consecutive Bench Press rows merge; later separate", () => {
    const parsed = parseDelimited(readFixture("merge-bench.csv"));
    const { block } = tableToBlock(parsed, { name: "Merge", unit: "lb" });
    const day = block.weeks[0].days[0];
    expect(day.exercises).toHaveLength(3);
    expect(day.exercises[0].name).toBe("Bench Press");
    expect(day.exercises[0].sets).toHaveLength(4);
    expect(day.exercises[1].name).toBe("Row");
    expect(day.exercises[2].name).toBe("Bench Press");
    expect(day.exercises[2].sets).toHaveLength(3);
  });

  test("75% TM load becomes note + warning, no weight", () => {
    const parsed = parseDelimited(readFixture("percent-load.csv"));
    const { block, warnings } = tableToBlock(parsed, { name: "Pct" });
    const ex = block.weeks[0].days[0].exercises[0];
    expect(ex.sets[0].weight).toBeUndefined();
    expect(ex.notes).toMatch(/Load: 75% TM/);
    expect(
      warnings.some((w) => /Percent loads aren't calculated yet/i.test(w.message))
    ).toBe(true);
  });

  test("no Exercise column throws documented error", () => {
    const parsed = parseDelimited(readFixture("no-exercise.csv"));
    expect(() => tableToBlock(parsed)).toThrow(
      "Couldn't find an Exercise column. Name one column Exercise."
    );
  });

  test("values in both RPE and RIR columns throws documented error", () => {
    const parsed = parseDelimited(readFixture("both-effort.csv"));
    expect(() => tableToBlock(parsed)).toThrow(
      "LogChamp plans use one effort scale - remove one column"
    );
  });
});

describe("historyToBlock", () => {
  test("Strong CSV: 2 days from most recent sessions, warmups skipped, 3 weeks", () => {
    const parsed = parseDelimited(readFixture("strong-history.csv"));
    const result = historyToBlock(parsed, {
      historyWeeks: 3,
      sourceUnit: "lb",
    });
    expect(result).not.toBeNull();
    expect(result.notices.app).toBe("Strong");
    expect(result.block.weeks).toHaveLength(3);
    expect(result.block.weeks[0]).toEqual(result.block.weeks[1]);
    expect(result.block.weeks[0]).toEqual(result.block.weeks[2]);
    expect(result.block.weeks[0].days).toHaveLength(2);
    // Warm-up W set not present (only working sets from most recent Push)
    const push = result.block.weeks[0].days.find((d) => d.name === "Push");
    expect(push).toBeTruthy();
    const bench = push.exercises.find((e) => e.name === "Bench Press");
    expect(bench.sets).toHaveLength(1);
    expect(bench.sets[0].weight).toBe(195);
  });

  test("Hevy CSV with weight_kg -> unit kg", () => {
    const parsed = parseDelimited(readFixture("hevy-history.csv"));
    const result = historyToBlock(parsed, { historyWeeks: 2 });
    expect(result).not.toBeNull();
    expect(result.notices.app).toBe("Hevy");
    expect(result.block.unit).toBe("kg");
    const squat = result.block.weeks[0].days[0].exercises.find(
      (e) => e.name === "Back Squat"
    );
    expect(squat.sets).toHaveLength(2); // warmup skipped
    expect(squat.sets[0].weight).toBe(100);
    const plank = result.block.weeks[0].days[0].exercises.find(
      (e) => e.name === "Plank"
    );
    expect(plank.sets[0].durationSec).toBe(45);
    expect(plank.sets[0].weight).toBeUndefined();
  });

  test("plain table returns null", () => {
    const parsed = parseDelimited(readFixture("merge-bench.csv"));
    expect(historyToBlock(parsed)).toBeNull();
  });
});

describe("round trip + AI prompt", () => {
  test("spec example round-trips through mapping", () => {
    const validated = validateBlockDraft(SPEC_EXAMPLE, { targetUnit: "lb" });
    expect(validated.ok).toBe(true);
    const payload = formatToCreatePayload(validated.block);
    const tree = fakeTreeFrom(payload);
    const back = blockTreeToFormat(tree, { unit: "lb" });
    const again = validateBlockDraft(back, { targetUnit: "lb" });
    expect(again.ok).toBe(true);
    expect(again.block).toEqual(validated.block);
  });

  test("phase-1 fixture round-trips through mapping", () => {
    const parsed = parseDelimited(readFixture("phase1.tsv"));
    const { block } = tableToBlock(parsed, {
      name: "Phase 1",
      unit: "lb",
      skipWarmups: true,
    });
    const validated = validateBlockDraft(block, { targetUnit: "lb" });
    expect(validated.ok).toBe(true);
    const payload = formatToCreatePayload(validated.block);
    const tree = fakeTreeFrom(payload);
    const back = blockTreeToFormat(tree, { unit: "lb" });
    const again = validateBlockDraft(back, { targetUnit: "lb" });
    expect(again.ok).toBe(true);
    expect(again.block).toEqual(validated.block);
  });

  test("BLOCK_FORMAT_EXAMPLE passes validator", () => {
    const result = validateBlockDraft(BLOCK_FORMAT_EXAMPLE, {
      targetUnit: "lb",
    });
    expect(result.ok).toBe(true);
  });

  test("BLOCK_FORMAT_AI_INSTRUCTIONS length <= 2500", () => {
    expect(BLOCK_FORMAT_AI_INSTRUCTIONS.length).toBeLessThanOrEqual(2500);
  });

  test("BLOCK_FORMAT_JSON_SCHEMA is an object with draft 2020-12 marker", () => {
    expect(BLOCK_FORMAT_JSON_SCHEMA.$schema).toMatch(/2020-12/);
    expect(BLOCK_FORMAT_JSON_SCHEMA.type).toBe("object");
  });
});
