const fs = require("fs");
const path = require("path");
const { normalizeExerciseName } = require("../../src/analytics/normalize");
const { selectRowsToAdopt } = require("../../src/lib/customExerciseRename");

const oldNormalized = normalizeExerciseName("Bulgarian Split Squat");

describe("selectRowsToAdopt", () => {
  test('"Bulgarian Split Squat" adopts rows named "bulgarian-split squat" and "Bulgarian  split squat"', () => {
    const rows = [
      { id: 1, exerciseName: "bulgarian-split squat" },
      { id: 2, exerciseName: "Bulgarian  split squat" },
    ];
    expect(selectRowsToAdopt(rows, oldNormalized)).toEqual(rows);
  });

  test('it does NOT adopt "Bulgarian Split Squats" or "Split Squat"', () => {
    const rows = [
      { id: 3, exerciseName: "Bulgarian Split Squats" },
      { id: 4, exerciseName: "Split Squat" },
    ];
    expect(selectRowsToAdopt(rows, oldNormalized)).toEqual([]);
  });

  test("an empty list returns []", () => {
    expect(selectRowsToAdopt([], oldNormalized)).toEqual([]);
  });

  test("the module imports nothing from Prisma", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../../src/lib/customExerciseRename.js"),
      "utf8"
    );
    expect(src).not.toMatch(/prisma/i);
    expect(src).not.toMatch(/@prisma/);
  });
});
