const { loadCatalog, searchCatalog, normalizeExerciseName } = require("../../src/analytics");
const { buildUserExerciseIndex } = require("../../src/analytics/userExercises");

function makeCatalog(entries, aliases = []) {
  const byId = new Map();
  const byNormalizedName = new Map();
  const byAlias = new Map();

  for (const entry of entries) {
    byId.set(entry.id, entry);
    byNormalizedName.set(normalizeExerciseName(entry.name), entry);
  }

  for (const [aliasKey, targetId] of aliases) {
    byAlias.set(aliasKey, byId.get(targetId));
  }

  return { byId, byNormalizedName, byAlias, muscleWeights: {} };
}

function namesOf(payload) {
  return payload.results.map((row) => row.name);
}

describe("searchCatalog", () => {
  test("exact beats whole-word / prefix / substring on name", () => {
    const catalog = makeCatalog([
      {
        id: "exact",
        name: "Bench Press",
        category: "strength",
        primaryMuscles: ["chest"],
        equipment: "barbell",
      },
      {
        id: "prefix",
        name: "Bench Press Incline",
        category: "strength",
        primaryMuscles: ["chest"],
        equipment: "barbell",
      },
      {
        id: "substring",
        name: "Old Bench Press Variation",
        category: "strength",
        primaryMuscles: ["chest"],
        equipment: "barbell",
      },
    ]);

    const { results } = searchCatalog(catalog, new Map(), "bench press", { limit: 10 });

    expect(results.map((row) => row.exerciseId)).toEqual([
      "exact",
      "prefix",
      "substring",
    ]);
  });

  test("userExercise rows rank before catalog rows within the same match rank", () => {
    const catalog = makeCatalog([
      {
        id: "catalog-row",
        name: "Cable Fly",
        category: "strength",
        primaryMuscles: ["chest"],
        equipment: "cable",
      },
    ]);
    const userIndex = buildUserExerciseIndex([
      {
        id: 42,
        name: "Cable Fly Custom",
        normalizedName: "cable fly custom",
        muscles: { chest: "primary" },
      },
    ]);

    const { results } = searchCatalog(catalog, userIndex, "cable", { limit: 10 });

    expect(results[0]).toMatchObject({
      source: "userExercise",
      userExerciseId: 42,
      name: "Cable Fly Custom",
    });
    expect(results[1]).toMatchObject({
      source: "catalog",
      exerciseId: "catalog-row",
      name: "Cable Fly",
    });
  });

  test("alias query returns the canonical catalog entry with matchedAlias set", () => {
    const catalog = loadCatalog();
    const { results } = searchCatalog(catalog, new Map(), "skullcrushers", { limit: 5 });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      source: "catalog",
      exerciseId: "EZ-Bar_Skullcrusher",
      name: "EZ-Bar Skullcrusher",
      matchedAlias: "skullcrusher",
    });
  });

  test("stretching-category catalog entries are excluded", () => {
    const catalog = loadCatalog();
    const stretchingEntry = Array.from(catalog.byId.values()).find(
      (entry) => entry.category === "stretching"
    );
    expect(stretchingEntry).toBeDefined();

    const fragment = stretchingEntry.name.slice(0, 6).toLowerCase();
    const { results } = searchCatalog(catalog, new Map(), fragment, { limit: 25 });

    expect(results.every((row) => row.source !== "catalog" || row.exerciseId !== stretchingEntry.id)).toBe(
      true
    );
  });

  test("catalog row returns secondaryMuscles verbatim when present", () => {
    const catalog = makeCatalog([
      {
        id: "bench-press-powerlifting",
        name: "Bench Press - Powerlifting",
        category: "powerlifting",
        primaryMuscles: ["triceps"],
        secondaryMuscles: ["chest", "forearms", "lats", "shoulders"],
        equipment: "barbell",
      },
    ]);

    const { results } = searchCatalog(catalog, new Map(), "bench press", { limit: 5 });

    expect(results[0]).toMatchObject({
      source: "catalog",
      exerciseId: "bench-press-powerlifting",
      primaryMuscles: ["triceps"],
      secondaryMuscles: ["chest", "forearms", "lats", "shoulders"],
    });
  });

  test("catalog row with no secondary muscles returns secondaryMuscles: []", () => {
    const catalog = makeCatalog([
      {
        id: "no-secondary",
        name: "Cable Fly",
        category: "strength",
        primaryMuscles: ["chest"],
        equipment: "cable",
      },
    ]);

    const { results } = searchCatalog(catalog, new Map(), "cable fly", { limit: 5 });

    expect(results[0].secondaryMuscles).toEqual([]);
  });

  test("userExercise row derives secondaryMuscles from muscles map", () => {
    const userIndex = buildUserExerciseIndex([
      {
        id: 7,
        name: "Custom Press",
        normalizedName: "custom press",
        muscles: { chest: "primary", triceps: "secondary", shoulders: "secondary" },
      },
    ]);

    const { results } = searchCatalog(makeCatalog([]), userIndex, "custom press", { limit: 5 });

    expect(results[0]).toMatchObject({
      source: "userExercise",
      userExerciseId: 7,
      primaryMuscles: ["chest"],
      secondaryMuscles: ["shoulders", "triceps"],
    });
  });

  test("respects limit", () => {
    const catalog = makeCatalog(
      Array.from({ length: 12 }, (_, index) => ({
        id: `lift-${index}`,
        name: `Strength Move ${index}`,
        category: "strength",
        primaryMuscles: ["chest"],
        equipment: "barbell",
      }))
    );

    const { results, total, hasMore } = searchCatalog(catalog, new Map(), "strength", {
      limit: 4,
    });
    expect(results).toHaveLength(4);
    expect(total).toBe(12);
    expect(hasMore).toBe(true);
  });

  test('press ranks whole-word matches ahead of substring-only, with Leg/Seated DB/DB Bench Press in first 40', () => {
    const catalog = loadCatalog();
    const { results } = searchCatalog(catalog, new Map(), "press", { limit: 40 });
    const names = namesOf({ results });

    const wordPress = (name) =>
      normalizeExerciseName(name)
        .split(/\s+/)
        .some((w) => w === "press" || w === "presses");

    let sawSubstringOnly = false;
    for (const name of names) {
      if (!wordPress(name)) {
        sawSubstringOnly = true;
      } else if (sawSubstringOnly) {
        throw new Error(`whole-word "${name}" appeared after a substring-only hit`);
      }
    }

    expect(names).toEqual(expect.arrayContaining([
      "Leg Press",
      "Seated Dumbbell Press",
      "Dumbbell Bench Press",
    ]));
  });

  test('curl returns key curls; "dumbbell curl" ranks Dumbbell Bicep Curl first via alias', () => {
    const catalog = loadCatalog();
    const curl = searchCatalog(catalog, new Map(), "curl", { limit: 40 });
    const curlNames = namesOf(curl);
    expect(curlNames).toEqual(
      expect.arrayContaining(["Dumbbell Bicep Curl", "Alternate Hammer Curl"])
    );

    const dbCurl = searchCatalog(catalog, new Map(), "dumbbell curl", { limit: 40 });
    expect(dbCurl.results[0].name).toBe("Dumbbell Bicep Curl");
  });

  test('"seated row" returns Seated Cable Rows in the top 5 (all-words, any order)', () => {
    const catalog = loadCatalog();
    const { results } = searchCatalog(catalog, new Map(), "seated row", { limit: 40 });
    const top5 = results.slice(0, 5).map((r) => r.name);
    expect(top5).toContain("Seated Cable Rows");
  });

  test("limit 50 is honoured and hasMore is true when more matches exist", () => {
    const catalog = loadCatalog();
    const payload = searchCatalog(catalog, new Map(), "press", { limit: 50 });
    expect(payload.results.length).toBeLessThanOrEqual(50);
    expect(payload.total).toBeGreaterThan(50);
    expect(payload.hasMore).toBe(true);

    const exact = searchCatalog(catalog, new Map(), "leg press", { limit: 50 });
    expect(exact.hasMore).toBe(false);
    expect(exact.total).toBe(exact.results.length);
  });

  test("usage tier: used whole-word presses beat unused short names for press", () => {
    const catalog = loadCatalog();
    const usageByKey = new Map([
      ["catalog:Barbell_Bench_Press_-_Medium_Grip", 5],
      ["catalog:Seated_Dumbbell_Press", 2],
    ]);
    const { results } = searchCatalog(catalog, new Map(), "press", {
      limit: 40,
      usageByKey,
    });
    const names = namesOf({ results });

    expect(names[0]).toBe("Barbell Bench Press - Medium Grip");
    expect(names.slice(0, 3)).toContain("Seated Dumbbell Press");
  });
});
