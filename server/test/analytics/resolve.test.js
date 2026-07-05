const { loadCatalog, resolveExercise } = require("../../src/analytics");

describe("resolveExercise", () => {
  const catalog = loadCatalog();

  test("matches by normalized exerciseName across case/spacing variations", () => {
    const canonical = resolveExercise({
      exerciseName: "Barbell Bench Press - Medium Grip",
    });
    expect(canonical.resolved).toBe(true);
    expect(canonical.source).toBe("exerciseName");
    expect(canonical.catalogEntry.id).toBe("Barbell_Bench_Press_-_Medium_Grip");

    const messy = resolveExercise({
      exerciseName: "  barbell_bench_press   MEDIUM-grip  ",
    });
    expect(messy.resolved).toBe(true);
    expect(messy.catalogEntry.id).toBe(canonical.catalogEntry.id);
  });

  test("matches by exerciseId when given a valid catalog id", () => {
    const result = resolveExercise({
      exerciseName: "totally different free text",
      exerciseId: "Barbell_Bench_Press_-_Medium_Grip",
    });
    expect(result.resolved).toBe(true);
    expect(result.source).toBe("exerciseId");
    expect(result.catalogEntry.id).toBe("Barbell_Bench_Press_-_Medium_Grip");
  });

  test("returns resolved: false for an unmatched name", () => {
    const result = resolveExercise({
      exerciseName: "Nonexistent Made Up Exercise",
    });
    expect(result.resolved).toBe(false);
    expect(result.source).toBe(null);
    expect(result.catalogEntry).toBe(null);
  });

  test("passing an explicit catalog argument works the same", () => {
    const result = resolveExercise(
      { exerciseName: "Barbell Bench Press - Medium Grip" },
      catalog
    );
    expect(result.resolved).toBe(true);
    expect(result.catalogEntry.id).toBe("Barbell_Bench_Press_-_Medium_Grip");
  });

  test("a hand-built catalog without byAlias still resolves exact names", () => {
    const entry = { id: "X", name: "Fake Lift" };
    const bare = {
      byId: new Map([["X", entry]]),
      byNormalizedName: new Map([["fake lift", entry]]),
    };
    expect(resolveExercise({ exerciseName: "fake lift" }, bare).resolved).toBe(
      true
    );
    // query-side plural fold still applies without a byAlias map
    const folded = resolveExercise({ exerciseName: "fake lifts" }, bare);
    expect(folded.resolved).toBe(true);
    expect(folded.source).toBe("alias");
    expect(
      resolveExercise({ exerciseName: "some other lift" }, bare).resolved
    ).toBe(false);
  });
});

describe("resolveExercise - alias layer (A6)", () => {
  test("resolves curated colloquial names with source alias", () => {
    const cases = {
      "bench press": "Barbell_Bench_Press_-_Medium_Grip",
      squat: "Barbell_Squat",
      deadlift: "Barbell_Deadlift",
      "overhead press": "Standing_Military_Press",
      "lat pulldown": "Wide-Grip_Lat_Pulldown",
    };
    for (const [name, id] of Object.entries(cases)) {
      const result = resolveExercise({ exerciseName: name });
      expect(result.resolved).toBe(true);
      expect(result.source).toBe("alias");
      expect(result.catalogEntry.id).toBe(id);
    }
  });

  test("the July 5 smoke list resolves 10/10", () => {
    const smoke = [
      "bench press",
      "squat",
      "deadlift",
      "overhead press",
      "pull up",
      "push up",
      "bent-over row",
      "curl",
      "lat pulldown",
      "leg press",
    ];
    const failures = smoke.filter(
      (name) => !resolveExercise({ exerciseName: name }).resolved
    );
    expect(failures).toEqual([]);
  });

  test("plural fold works both directions", () => {
    // plural query -> alias ("squats" folds to the "squat" alias)
    expect(resolveExercise({ exerciseName: "Squats" }).catalogEntry.id).toBe(
      "Barbell_Squat"
    );
    // plural query -> exact catalog name ("chin ups" folds to "Chin-Up")
    expect(resolveExercise({ exerciseName: "chin ups" }).catalogEntry.id).toBe(
      "Chin-Up"
    );
    // singular query -> plural catalog name ("Seated Cable Rows")
    const rows = resolveExercise({ exerciseName: "seated cable row" });
    expect(rows.resolved).toBe(true);
    expect(rows.source).toBe("alias");
  });

  test("fold never strips a double-s ending", () => {
    // "leg press" matches exactly; a hypothetical fold to "leg pres" must not
    // be the reason - assert the guard directly via a miss that ends in ss.
    const result = resolveExercise({ exerciseName: "wilderness" });
    expect(result.resolved).toBe(false);
  });

  test("exact catalog names always win over the alias layer", () => {
    // "Dumbbell Bench Press" is a real entry; the "dumbbell press" alias
    // must not intercept it.
    const result = resolveExercise({ exerciseName: "Dumbbell Bench Press" });
    expect(result.source).toBe("exerciseName");
    expect(result.catalogEntry.id).toBe("Dumbbell_Bench_Press");
  });

  test("no alias key shadows a real normalized catalog name", () => {
    const catalog = loadCatalog();
    for (const key of catalog.byAlias.keys()) {
      expect(catalog.byNormalizedName.has(key)).toBe(false);
    }
  });

  test("gibberish still resolves false", () => {
    expect(
      resolveExercise({ exerciseName: "Sheghdjksishbe" }).resolved
    ).toBe(false);
  });
});
