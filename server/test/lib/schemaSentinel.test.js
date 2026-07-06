const {
  findMissingMigrations,
  formatSentinelHost,
} = require("../../src/lib/schemaSentinel");
const { EXPECTED_MIGRATIONS } = require("../../src/lib/expectedMigrations");

describe("schemaSentinel", () => {
  test("findMissingMigrations returns names absent from the applied set", () => {
    expect(
      findMissingMigrations(
        ["a", "b", "c"],
        ["a", "c"],
      ),
    ).toEqual(["b"]);
  });

  test("findMissingMigrations returns empty when every expected migration is applied", () => {
    expect(findMissingMigrations(EXPECTED_MIGRATIONS, EXPECTED_MIGRATIONS)).toEqual(
      [],
    );
  });

  test("findMissingMigrations flags the L-wave migrations when only pre-L1 history is applied", () => {
    const preLWave = EXPECTED_MIGRATIONS.filter(
      (name) =>
        name !== "20260704120000_add_workout_set_side" &&
        name !== "20260704130000_add_user_exercise",
    );

    expect(findMissingMigrations(EXPECTED_MIGRATIONS, preLWave)).toEqual([
      "20260704120000_add_workout_set_side",
      "20260704130000_add_user_exercise",
    ]);
  });

  test("formatSentinelHost extracts the database hostname", () => {
    expect(
      formatSentinelHost(
        "postgresql://user:pass@ep-bitter-breeze-am81izlh.us-east-2.aws.neon.tech/neondb",
      ),
    ).toBe("ep-bitter-breeze-am81izlh.us-east-2.aws.neon.tech");
  });
});
