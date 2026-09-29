const fs = require("fs");
const path = require("path");

const {
  buildImportPreview,
  applyRenames,
} = require("../../../src/blocks/importPreview");
const {
  BLOCK_FORMAT_EXAMPLE,
} = require("../../../src/blocks/aiFormatPrompt");
const { validateBlockDraft } = require("../../../src/blocks/blockFormat");

const fixtures = path.join(__dirname, "fixtures");

function readFixture(name) {
  return fs.readFileSync(path.join(fixtures, name), "utf8");
}

const EXAMPLE_STATS = validateBlockDraft(BLOCK_FORMAT_EXAMPLE, {
  targetUnit: "lb",
}).stats;

function fakeResolve(name) {
  if (name === "Bench") {
    return {
      resolved: true,
      exerciseId: 101,
      userExerciseId: null,
      matchedName: "Bench Press",
    };
  }
  if (name === "Bench Press") {
    return {
      resolved: true,
      exerciseId: 101,
      userExerciseId: null,
      matchedName: "Bench Press",
    };
  }
  if (name === "Plank") {
    return {
      resolved: true,
      exerciseId: 202,
      userExerciseId: null,
      matchedName: "Plank",
    };
  }
  if (name === "Custom Lift") {
    return {
      resolved: true,
      exerciseId: null,
      userExerciseId: 7,
      matchedName: "Custom Lift",
    };
  }
  return {
    resolved: false,
    exerciseId: null,
    userExerciseId: null,
    matchedName: null,
  };
}

describe("buildImportPreview", () => {
  test("BLOCK_FORMAT_EXAMPLE stringified -> kind json, ok, stats match", () => {
    const text = JSON.stringify(BLOCK_FORMAT_EXAMPLE);
    const result = buildImportPreview(text, "auto", { unit: "lb" }, fakeResolve);
    expect(result.ok).toBe(true);
    expect(result.kind).toBe("json");
    expect(result.stats).toEqual(EXAMPLE_STATS);
    expect(result.block.name).toBe("Sample Upper");
  });

  test("AI-answer fenced JSON extracts same block", () => {
    const example = JSON.stringify(BLOCK_FORMAT_EXAMPLE, null, 2);
    const text = `Sure! Here is your block:\n\`\`\`json\n${example}\n\`\`\`\nEnjoy.`;
    const result = buildImportPreview(text, "auto", { unit: "lb" }, fakeResolve);
    expect(result.ok).toBe(true);
    expect(result.kind).toBe("json");
    expect(result.block).toEqual(
      buildImportPreview(
        JSON.stringify(BLOCK_FORMAT_EXAMPLE),
        "json",
        { unit: "lb" },
        fakeResolve
      ).block
    );
  });

  test("stray prose braces before the object are skipped", () => {
    const text = `Use {curly} notation. Block: ${JSON.stringify(BLOCK_FORMAT_EXAMPLE)} done`;
    const result = buildImportPreview(text, "auto", { unit: "lb" }, fakeResolve);
    expect(result.ok).toBe(true);
    expect(result.kind).toBe("json");
    expect(result.stats).toEqual(EXAMPLE_STATS);
  });

  test("a table with a brace in a notes cell still imports as a table", () => {
    const text = "Exercise\tSets\tReps\tNotes\nSquat\t3\t5\tTempo {3-1-1}\n";
    const result = buildImportPreview(text, "auto", { unit: "lb" }, fakeResolve);
    expect(result.ok).toBe(true);
    expect(result.kind).toBe("table");
  });

  test("truncated fenced JSON reports invalid JSON, not a table error", () => {
    const text = 'Here:\n```json\n{ "format": "logchamp.block",\n```';
    const result = buildImportPreview(text, "auto", { unit: "lb" }, fakeResolve);
    expect(result.ok).toBe(false);
    expect(result.kind).toBe("json");
    expect(result.errors[0].message).toMatch(/isn't valid JSON/i);
  });

  test("truncated JSON -> 422-shaped isn't valid JSON", () => {
    const text = '{ "format": "logchamp.block", ';
    const result = buildImportPreview(text, "auto", { unit: "lb" }, fakeResolve);
    expect(result.ok).toBe(false);
    expect(result.kind).toBe("json");
    expect(result.warnings).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].path).toBe("");
    expect(result.errors[0].message).toMatch(/isn't valid JSON/i);
  });

  test("TSV table fixture -> kind table", () => {
    const text = readFixture("phase1.tsv");
    const result = buildImportPreview(
      text,
      "auto",
      { unit: "lb", name: "Phase 1", skipWarmups: true },
      fakeResolve
    );
    expect(result.ok).toBe(true);
    expect(result.kind).toBe("table");
    expect(result.block.weeks.length).toBeGreaterThanOrEqual(1);
  });

  test("Strong CSV fixture -> kind history", () => {
    const text = readFixture("strong-history.csv");
    const result = buildImportPreview(
      text,
      "auto",
      { unit: "lb", historyWeeks: 3, sourceUnit: "lb" },
      fakeResolve
    );
    expect(result.ok).toBe(true);
    expect(result.kind).toBe("history");
    expect(result.notices.app).toBe("Strong");
  });

  test("exercises lists distinct names in order with resolve + matchedName", () => {
    const block = {
      format: "logchamp.block",
      version: 1,
      name: "Match Test",
      unit: "lb",
      weeks: [
        {
          days: [
            {
              name: "A",
              exercises: [
                { name: "Bench", sets: [{ reps: 5, weight: 135 }] },
                { name: "Plank", sets: [{ durationSec: 30 }] },
                { name: "Bench", sets: [{ reps: 5, weight: 145 }] },
                { name: "Unknown Move", sets: [{ reps: 8 }] },
              ],
            },
          ],
        },
      ],
    };
    const result = buildImportPreview(
      JSON.stringify(block),
      "json",
      { unit: "lb" },
      fakeResolve
    );
    expect(result.ok).toBe(true);
    expect(result.exercises.map((e) => e.name)).toEqual([
      "Bench",
      "Plank",
      "Unknown Move",
    ]);
    expect(result.exercises[0]).toEqual({
      name: "Bench",
      resolved: true,
      exerciseId: 101,
      userExerciseId: null,
      matchedName: "Bench Press",
    });
    expect(result.exercises[1].resolved).toBe(true);
    expect(result.exercises[1].matchedName).toBeNull();
    expect(result.exercises[2]).toEqual({
      name: "Unknown Move",
      resolved: false,
      exerciseId: null,
      userExerciseId: null,
      matchedName: null,
    });
  });

  test("options.unit missing -> validation error, not a crash", () => {
    const result = buildImportPreview(
      JSON.stringify(BLOCK_FORMAT_EXAMPLE),
      "auto",
      {},
      fakeResolve
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "options.unit")).toBe(true);
  });
});

describe("applyRenames", () => {
  test("renames every exact Bench and does not mutate input", () => {
    const block = {
      format: "logchamp.block",
      version: 1,
      name: "R",
      weeks: [
        {
          days: [
            {
              name: "D",
              exercises: [
                { name: "Bench", sets: [{ reps: 5 }] },
                { name: "Bench Press", sets: [{ reps: 5 }] },
                { name: "Bench", sets: [{ reps: 3 }] },
              ],
            },
          ],
        },
      ],
    };
    const snapshot = JSON.stringify(block);
    const out = applyRenames(block, { Bench: "Bench Press" });
    expect(JSON.stringify(block)).toBe(snapshot);
    expect(out.weeks[0].days[0].exercises.map((e) => e.name)).toEqual([
      "Bench Press",
      "Bench Press",
      "Bench Press",
    ]);
    // Unknown keys ignored; invalid lengths ignored
    const out2 = applyRenames(block, {
      Missing: "X",
      Bench: "   ",
      "Bench Press": "x".repeat(121),
    });
    expect(out2.weeks[0].days[0].exercises.map((e) => e.name)).toEqual([
      "Bench",
      "Bench Press",
      "Bench",
    ]);
  });
});
