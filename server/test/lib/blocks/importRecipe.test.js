const {
  validateImportRecipe,
  applyImportRecipe,
  sampleForRecipe,
  parsePrescriptionCell,
  sheetFromText,
} = require("../../../src/blocks/importRecipe");
const { tableToBlock } = require("../../../src/blocks/tableToBlock");
const { buildImportPreview } = require("../../../src/blocks/importPreview");

function applyAndBlock(text, recipe, unit = "lb") {
  const sheet = sheetFromText(text);
  const applied = applyImportRecipe(
    { sheetRows: sheet.sheetRows, rowNumbers: sheet.rowNumbers },
    recipe
  );
  const { block, warnings } = tableToBlock(
    {
      header: applied.header,
      rows: applied.rows,
      rowNumbers: applied.rowNumbers,
    },
    { unit: recipe.unit || unit }
  );
  return { block, warnings: [...applied.warnings, ...warnings], applied };
}

describe("Fixture A - foreign headers + prescriptionColumn", () => {
  const text = [
    "Movement,Sets x Reps,Load (kg),Session,Wk",
    "Squat,3x5,100,Lower,1",
  ].join("\n");

  const recipe = {
    version: 1,
    unit: "kg",
    columns: {
      Movement: "exercise",
      Session: "day name",
      Wk: "week",
      "Load (kg)": "weight",
      "Sets x Reps": "ignore",
    },
    prescriptionColumn: "Sets x Reps",
  };

  test("Squat 3x5 @ 100 kg on Lower week 1", () => {
    const { block } = applyAndBlock(text, recipe, "kg");
    expect(block.weeks).toHaveLength(1);
    expect(block.weeks[0].days[0].name).toBe("Lower");
    const ex = block.weeks[0].days[0].exercises[0];
    expect(ex.name).toBe("Squat");
    expect(ex.sets).toHaveLength(3);
    expect(ex.sets[0].reps).toBe(5);
    expect(ex.sets[0].weight).toBe(100);
  });
});

describe("Fixture B - day-header rows", () => {
  const text = [
    "Day,Exercise,Sets,Reps,Load",
    "Upper A,,,,",
    ",Bench Press,3,8,185",
    ",Barbell Row,3,8,135",
    ",Back Squat,3,5,225",
  ].join("\n");

  const recipe = {
    version: 1,
    unit: "lb",
    columns: {
      Exercise: "exercise",
      Sets: "sets",
      Reps: "reps",
      Load: "weight",
    },
    dayHeaderRows: { column: "Day" },
  };

  test("Upper A day with 3 exercises; header row is not an exercise", () => {
    const { block } = applyAndBlock(text, recipe);
    expect(block.weeks).toHaveLength(1);
    expect(block.weeks[0].days).toHaveLength(1);
    expect(block.weeks[0].days[0].name).toBe("Upper A");
    expect(block.weeks[0].days[0].exercises).toHaveLength(3);
    expect(block.weeks[0].days[0].exercises.map((e) => e.name)).toEqual([
      "Bench Press",
      "Barbell Row",
      "Back Squat",
    ]);
  });
});

describe("Fixture C - weeks as columns", () => {
  const text = [
    "Exercise,Week 1,Week 2,Week 3",
    "Bench,3x8 @ 185,3x8 @ 190,",
  ].join("\n");

  const recipe = {
    version: 1,
    unit: "lb",
    columns: { Exercise: "exercise" },
    weekColumns: [
      { header: "Week 1", week: 1 },
      { header: "Week 2", week: 2 },
      { header: "Week 3", week: 3 },
    ],
  };

  test("Bench in weeks 1-2 only; blank Week 3 is absent", () => {
    const { block } = applyAndBlock(text, recipe);
    expect(block.weeks).toHaveLength(2);
    const w1 = block.weeks[0].days[0].exercises[0];
    const w2 = block.weeks[1].days[0].exercises[0];
    expect(w1.name).toBe("Bench");
    expect(w1.sets).toHaveLength(3);
    expect(w1.sets[0].reps).toBe(8);
    expect(w1.sets[0].weight).toBe(185);
    expect(w2.sets[0].weight).toBe(190);
  });
});

describe("Fixture D - title rows via headerRow", () => {
  const withTitles = [
    "My Awesome Program",
    "Phase 1 - Strength",
    "Movement,Sets x Reps,Load (kg),Session,Wk",
    "Squat,3x5,100,Lower,1",
  ].join("\n");

  const withoutTitles = [
    "Movement,Sets x Reps,Load (kg),Session,Wk",
    "Squat,3x5,100,Lower,1",
  ].join("\n");

  const recipeBase = {
    version: 1,
    unit: "kg",
    columns: {
      Movement: "exercise",
      Session: "day name",
      Wk: "week",
      "Load (kg)": "weight",
      "Sets x Reps": "ignore",
    },
    prescriptionColumn: "Sets x Reps",
  };

  test("headerRow: 2 matches the untitled sheet", () => {
    const a = applyAndBlock(withTitles, { ...recipeBase, headerRow: 2 }, "kg");
    const b = applyAndBlock(withoutTitles, recipeBase, "kg");
    expect(a.block).toEqual(b.block);
  });
});

describe("prescription cells", () => {
  test("4 x 6-8 -> 4 sets reps 6 repsMax 8", () => {
    const p = parsePrescriptionCell("4 x 6-8");
    expect(p.sets).toBe(4);
    expect(p.reps).toBe(6);
    expect(p.repsMax).toBe(8);
  });

  test("3 x 30s -> 3 sets durationSec 30", () => {
    const p = parsePrescriptionCell("3 x 30s");
    expect(p.sets).toBe(3);
    expect(p.durationSec).toBe(30);
  });

  test("5x5 @ RPE 8 -> 5 sets reps 5 rpe 8", () => {
    const p = parsePrescriptionCell("5x5 @ RPE 8");
    expect(p.sets).toBe(5);
    expect(p.reps).toBe(5);
    expect(p.rpe).toBe(8);
  });

  test("AMRAP -> warning and blank reps, never throws", () => {
    expect(() => parsePrescriptionCell("AMRAP")).not.toThrow();
    const p = parsePrescriptionCell("AMRAP");
    expect(p.reps).toBeUndefined();
    expect(p.warning).toMatch(/AMRAP/i);
  });
});

describe("validateImportRecipe", () => {
  const headers = ["Movement", "Sets x Reps", "Load (kg)", "Session", "Wk"];

  test("rejects unknown role with path-named error", () => {
    const result = validateImportRecipe(
      {
        version: 1,
        columns: { Movement: "banana" },
      },
      headers
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "columns.Movement")).toBe(true);
  });

  test("rejects header not in the table", () => {
    const result = validateImportRecipe(
      {
        version: 1,
        columns: { Nope: "exercise" },
      },
      headers
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "columns.Nope")).toBe(true);
  });

  test("rejects unknown top-level keys", () => {
    const result = validateImportRecipe(
      {
        version: 1,
        columns: { Movement: "exercise" },
        mystery: true,
      },
      headers
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "mystery")).toBe(true);
  });
});

describe("sampleForRecipe", () => {
  test("216-data-row TSV returns header plus exactly 40 data rows", () => {
    const header = "Exercise\tSets\tReps";
    const data = Array.from({ length: 216 }, (_, i) => `Lift${i}\t3\t8`);
    const text = [header, ...data].join("\n");
    const sample = sampleForRecipe(text);
    const lines = sample.split("\n").filter((l) => l.trim() !== "");
    expect(lines[0]).toBe(header);
    expect(lines.length).toBe(41); // header + 40
  });
});

describe("preview without options.recipe unchanged", () => {
  test("canonical table still previews; recipe adds aiLayoutRecipe notice", () => {
    const text = [
      "Week,Day,Exercise,Sets,Reps,Load",
      "1,Upper A,Bench Press,3,8,185",
    ].join("\n");
    const plain = buildImportPreview(text, "table", { unit: "lb" });
    expect(plain.ok).toBe(true);
    expect(plain.notices.aiLayoutRecipe).toBeUndefined();

    const recipe = {
      version: 1,
      unit: "lb",
      columns: {
        Week: "week",
        Day: "day name",
        Exercise: "exercise",
        Sets: "sets",
        Reps: "reps",
        Load: "weight",
      },
    };
    const withRecipe = buildImportPreview(text, "table", {
      unit: "lb",
      recipe,
    });
    expect(withRecipe.ok).toBe(true);
    expect(withRecipe.notices.aiLayoutRecipe).toMatch(/AI layout recipe/i);
  });

  test("invalid recipe -> 422-shaped errors", () => {
    const text = "Exercise,Sets\nSquat,3\n";
    const result = buildImportPreview(text, "table", {
      unit: "lb",
      recipe: { version: 1, columns: { Exercise: "nope" } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "columns.Exercise")).toBe(true);
  });
});
