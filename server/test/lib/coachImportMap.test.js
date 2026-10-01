const {
  parseImportMapRequest,
  parseImportMapCandidate,
  validateImportMapCandidate,
  importMapErrorForStopReason,
  buildImportMapSystemPrompt,
  IMPORT_MAP_COST,
  IMPORT_RECIPE_INSTRUCTIONS,
} = require("../../src/coach/importMap");
const { remainingCoversCost, IMPORT_MAP_COST: CapCost } = require("../../src/coach/weeklyCap");
const { mockImportRecipeFor } = require("../../src/coach/mockProvider");
const { importMap } = require("../../src/controllers/coachController");
const { validateImportRecipe } = require("../../src/blocks/importRecipe");

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const FIXTURE_A = [
  "Movement,Sets x Reps,Load (kg),Session,Wk",
  "Squat,3x5,100,Lower,1",
].join("\n");

describe("IMPORT_MAP_COST", () => {
  test("is 3 and remainingCoversCost matches", () => {
    expect(IMPORT_MAP_COST).toBe(3);
    expect(CapCost).toBe(3);
    expect(remainingCoversCost(2)).toBe(false);
    expect(remainingCoversCost(3)).toBe(true);
    expect(remainingCoversCost(7)).toBe(true);
  });
});

describe("parseImportMapRequest / stop reasons", () => {
  test("requires text", () => {
    expect(parseImportMapRequest({}).ok).toBe(false);
    expect(parseImportMapRequest({ text: "  " }).ok).toBe(false);
    expect(parseImportMapRequest({ text: FIXTURE_A }).ok).toBe(true);
  });

  test("stop reasons are palette-shaped", () => {
    expect(importMapErrorForStopReason("refusal").body.error).toBe(
      "import_map_refused"
    );
    expect(importMapErrorForStopReason("max_tokens").body.error).toBe(
      "import_map_truncated"
    );
    expect(importMapErrorForStopReason("end_turn")).toBeNull();
  });
});

describe("mockImportRecipeFor", () => {
  test("returns a valid recipe for Fixture A headers", () => {
    const recipe = mockImportRecipeFor(FIXTURE_A);
    const validated = validateImportRecipe(recipe, [
      "Movement",
      "Sets x Reps",
      "Load (kg)",
      "Session",
      "Wk",
    ]);
    expect(validated.ok).toBe(true);
    expect(recipe.prescriptionColumn).toBe("Sets x Reps");
  });
});

describe("prompt documents the recipe format", () => {
  test("system prompt includes roles and recipe keys", () => {
    const prompt = buildImportMapSystemPrompt({ unit: "lb" });
    expect(prompt).toContain("prescriptionColumn");
    expect(prompt).toContain("weekColumns");
    expect(prompt).toContain('"exercise"');
    expect(IMPORT_RECIPE_INSTRUCTIONS).toContain("version");
  });
});

describe("importMap handler - cap and charging", () => {
  function hostedResolved() {
    return {
      ok: true,
      provider: "anthropic",
      keyInfo: { source: "hosted", key: "sk-test" },
      config: {
        provider: "anthropic",
        model: "claude-sonnet-5",
        effort: "medium",
        maxTokens: 2000,
      },
    };
  }

  test("with 2 uses left the map call is refused and the model is never called", async () => {
    const res = mockRes();
    let modelCalls = 0;
    await importMap(
      {
        authUserId: 1,
        body: { text: FIXTURE_A, unit: "kg" },
        get: () => null,
      },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: true,
          entitled: true,
          email: "capped@example.com",
        }),
        resolveCoachProvider: () => hostedResolved(),
        loadWeeklyCap: async () => ({
          allowed: true,
          limit: 7,
          used: 5,
          remaining: 2,
          nextAvailableAt: null,
        }),
        completeAnthropic: async () => {
          modelCalls += 1;
          return { stop_reason: "end_turn", content: [] };
        },
        prisma: {
          coachUsage: {
            createMany: async () => {
              throw new Error("should not charge");
            },
          },
        },
      }
    );
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe("weekly_limit");
    expect(res.body.needed).toBe(3);
    expect(res.body.remaining).toBe(2);
    expect(modelCalls).toBe(0);
  });

  test("with 3 left it proceeds and records exactly 3 usage rows", async () => {
    const res = mockRes();
    let modelCalls = 0;
    let created = 0;
    const recipe = mockImportRecipeFor(FIXTURE_A);
    await importMap(
      {
        authUserId: 1,
        body: { text: FIXTURE_A, unit: "kg" },
        get: () => null,
      },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: true,
          entitled: true,
          email: "capped@example.com",
        }),
        resolveCoachProvider: () => hostedResolved(),
        loadWeeklyCap: async () => ({
          allowed: true,
          limit: 7,
          used: 4,
          remaining: 3,
          nextAvailableAt: null,
        }),
        completeAnthropic: async () => {
          modelCalls += 1;
          return {
            stop_reason: "end_turn",
            content: [{ type: "text", text: JSON.stringify(recipe) }],
          };
        },
        prisma: {
          coachUsage: {
            createMany: async ({ data }) => {
              created = data.length;
              return { count: data.length };
            },
          },
        },
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.recipe.prescriptionColumn).toBe("Sets x Reps");
    expect(modelCalls).toBe(1);
    expect(created).toBe(3);
  });

  test("an invalid reply records 0 usage rows", async () => {
    const res = mockRes();
    let created = 0;
    await importMap(
      {
        authUserId: 1,
        body: { text: FIXTURE_A },
        get: () => null,
      },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: true,
          entitled: true,
          email: "capped@example.com",
        }),
        resolveCoachProvider: () => hostedResolved(),
        loadWeeklyCap: async () => ({
          allowed: true,
          limit: 7,
          used: 0,
          remaining: 7,
          nextAvailableAt: null,
        }),
        completeAnthropic: async () => ({
          stop_reason: "end_turn",
          content: [
            {
              type: "text",
              text: JSON.stringify({
                version: 1,
                columns: { Movement: "not-a-role" },
              }),
            },
          ],
        }),
        prisma: {
          coachUsage: {
            createMany: async ({ data }) => {
              created += data.length;
              return { count: data.length };
            },
          },
        },
      }
    );
    expect(res.statusCode).toBe(422);
    expect(res.body.error).toBe("import_map_invalid");
    expect(created).toBe(0);
  });

  test("an uncapped email records 0 usage rows", async () => {
    const res = mockRes();
    let created = 0;
    const recipe = mockImportRecipeFor(FIXTURE_A);
    const prev = process.env.COACH_UNCAPPED_EMAILS;
    process.env.COACH_UNCAPPED_EMAILS = "uncapped@example.com";
    try {
      await importMap(
        {
          authUserId: 1,
          body: { text: FIXTURE_A },
          get: () => null,
        },
        res,
        () => {},
        {
          loadCoachAccess: async () => ({
            consentGranted: true,
            entitled: true,
            email: "uncapped@example.com",
          }),
          resolveCoachProvider: () => hostedResolved(),
          loadWeeklyCap: async () => {
            throw new Error("cap should not load for uncapped email");
          },
          completeAnthropic: async () => ({
            stop_reason: "end_turn",
            content: [{ type: "text", text: JSON.stringify(recipe) }],
          }),
          prisma: {
            coachUsage: {
              createMany: async ({ data }) => {
                created += data.length;
                return { count: data.length };
              },
            },
          },
        }
      );
    } finally {
      if (prev == null) delete process.env.COACH_UNCAPPED_EMAILS;
      else process.env.COACH_UNCAPPED_EMAILS = prev;
    }
    expect(res.statusCode).toBe(200);
    expect(created).toBe(0);
  });
});

describe("parseImportMapCandidate", () => {
  test("extracts fenced JSON", () => {
    const recipe = mockImportRecipeFor(FIXTURE_A);
    const raw = `Sure:\n\`\`\`json\n${JSON.stringify(recipe)}\n\`\`\``;
    const parsed = parseImportMapCandidate(raw, { provider: "cursor" });
    expect(parsed.ok).toBe(true);
    const validated = validateImportMapCandidate(parsed.candidate, FIXTURE_A);
    expect(validated.ok).toBe(true);
  });
});
