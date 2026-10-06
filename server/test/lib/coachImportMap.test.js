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
    let reserveCalls = 0;
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
        reserveUses: async (_p, _userId, n) => {
          reserveCalls += 1;
          expect(n).toBe(3);
          return {
            ok: false,
            cap: {
              allowed: true,
              limit: 7,
              used: 5,
              remaining: 2,
              nextAvailableAt: null,
            },
          };
        },
        completeAnthropic: async () => {
          modelCalls += 1;
          return { stop_reason: "end_turn", content: [] };
        },
      }
    );
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe("weekly_limit");
    expect(res.body.needed).toBe(3);
    expect(res.body.remaining).toBe(2);
    expect(modelCalls).toBe(0);
    expect(reserveCalls).toBe(1);
  });

  test("with 3 left it proceeds and settles exactly 3 reserved rows", async () => {
    const res = mockRes();
    let modelCalls = 0;
    const settled = [];
    const refunded = [];
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
        reserveUses: async (_p, _userId, n) => {
          expect(n).toBe(3);
          return {
            ok: true,
            ids: [1, 2, 3],
            cap: {
              allowed: true,
              limit: 7,
              used: 7,
              remaining: 0,
              nextAvailableAt: null,
            },
          };
        },
        settleUses: async (_p, ids, cost) => {
          settled.push({ ids, cost });
        },
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
        completeAnthropic: async () => {
          modelCalls += 1;
          return {
            stop_reason: "end_turn",
            content: [{ type: "text", text: JSON.stringify(recipe) }],
          };
        },
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.recipe.prescriptionColumn).toBe("Sets x Reps");
    expect(modelCalls).toBe(1);
    expect(settled).toEqual([{ ids: [1, 2, 3], cost: 3 }]);
    expect(refunded).toHaveLength(0);
  });

  test("an invalid reply refunds all reserved rows (net 0 kept)", async () => {
    const res = mockRes();
    const refunded = [];
    const settled = [];
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
        reserveUses: async () => ({
          ok: true,
          ids: [4, 5, 6],
          cap: {
            allowed: true,
            limit: 7,
            used: 3,
            remaining: 4,
            nextAvailableAt: null,
          },
        }),
        settleUses: async (_p, ids, cost) => {
          settled.push({ ids, cost });
        },
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
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
      }
    );
    expect(res.statusCode).toBe(422);
    expect(res.body.error).toBe("import_map_invalid");
    expect(refunded).toEqual([4, 5, 6]);
    expect(settled).toHaveLength(0);
  });

  test("model failure refunds reserved rows (0 kept)", async () => {
    const res = mockRes();
    const refunded = [];
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
        reserveUses: async () => ({
          ok: true,
          ids: [7, 8, 9],
          cap: {
            allowed: true,
            limit: 7,
            used: 3,
            remaining: 4,
            nextAvailableAt: null,
          },
        }),
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
        settleUses: async () => {
          throw new Error("should not settle on failure");
        },
        completeAnthropic: async () => {
          const { CoachProviderError } = require("../../src/coach/provider");
          throw new CoachProviderError("provider_error", "boom");
        },
      }
    );
    expect(res.statusCode).toBe(502);
    expect(refunded).toEqual([7, 8, 9]);
  });

  test("an uncapped email never reserves", async () => {
    const res = mockRes();
    let reserveCalls = 0;
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
          reserveUses: async () => {
            reserveCalls += 1;
            throw new Error("cap should not reserve for uncapped email");
          },
          completeAnthropic: async () => ({
            stop_reason: "end_turn",
            content: [{ type: "text", text: JSON.stringify(recipe) }],
          }),
        }
      );
    } finally {
      if (prev == null) delete process.env.COACH_UNCAPPED_EMAILS;
      else process.env.COACH_UNCAPPED_EMAILS = prev;
    }
    expect(res.statusCode).toBe(200);
    expect(reserveCalls).toBe(0);
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
