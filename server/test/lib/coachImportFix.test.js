const {
  looksLikeTable,
  chooseImportFixPath,
  importFixCostForTokens,
  estimateTokensFromChars,
  parseImportFixRequest,
} = require("../../src/coach/importFix");
const {
  IMPORT_FIX_MAX_COST,
  IMPORT_FIX_TIER_1_MAX_TOKENS,
  IMPORT_FIX_TIER_2_MAX_TOKENS,
  IMPORT_FIX_TIER_3_MAX_TOKENS,
} = require("../../src/coach/weeklyCap");
const { mockImportRecipeFor } = require("../../src/coach/mockProvider");
const { importFix } = require("../../src/controllers/coachController");
const { CoachProviderError } = require("../../src/coach/provider");

function mockRes() {
  const listeners = {};
  return {
    statusCode: 200,
    body: null,
    writableEnded: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      this.writableEnded = true;
      return this;
    },
    end() {
      this.writableEnded = true;
      return this;
    },
    on(event, fn) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
      return this;
    },
    /** Test helper: simulate client disconnect before the response ends. */
    emitClose() {
      for (const fn of listeners.close || []) fn();
    },
  };
}

const TABLE_TEXT = [
  "Movement,Sets x Reps,Load (kg),Session,Wk",
  "Squat,3x5,100,Lower,1",
].join("\n");

const PROSE_TEXT =
  "Upper A: Bench 3x8 @ 185, Row 3x10. Lower A: Squat 4x5 @ 225.";

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

function validBlock(unit = "lb") {
  return {
    format: "logchamp.block",
    version: 1,
    name: "Prose Convert",
    unit,
    weeks: [
      {
        days: [
          {
            name: "Upper A",
            exercises: [
              {
                name: "Bench Press",
                sets: [{ reps: 8, weight: 185 }],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("importFixCostForTokens tiers", () => {
  test("thresholds match the named constants", () => {
    expect(IMPORT_FIX_MAX_COST).toBe(4);
    expect(IMPORT_FIX_TIER_1_MAX_TOKENS).toBe(4000);
    expect(IMPORT_FIX_TIER_2_MAX_TOKENS).toBe(8000);
    expect(IMPORT_FIX_TIER_3_MAX_TOKENS).toBe(14000);
  });

  test("3999 -> 1; 4001 -> 2; 8000 -> 2; 13999 -> 3; 20000 -> 4", () => {
    expect(importFixCostForTokens(3999)).toBe(1);
    expect(importFixCostForTokens(4001)).toBe(2);
    expect(importFixCostForTokens(8000)).toBe(2);
    expect(importFixCostForTokens(13999)).toBe(3);
    expect(importFixCostForTokens(20000)).toBe(4);
  });

  test("estimateTokensFromChars uses ceil(chars/4)", () => {
    expect(estimateTokensFromChars(1)).toBe(1);
    expect(estimateTokensFromChars(4)).toBe(1);
    expect(estimateTokensFromChars(5)).toBe(2);
  });
});

describe("chooseImportFixPath / looksLikeTable", () => {
  test("table text chooses recipe; prose chooses convert", () => {
    expect(looksLikeTable(TABLE_TEXT)).toBe(true);
    expect(chooseImportFixPath(TABLE_TEXT)).toBe("recipe");
    expect(looksLikeTable(PROSE_TEXT)).toBe(false);
    expect(chooseImportFixPath(PROSE_TEXT)).toBe("convert");
  });

  test("prose with commas is not a table (seat fix): ragged rows -> convert", () => {
    const commaProse = [
      "4 week program, upper lower split",
      "Day 1: bench 5x5, rows 3x10, curls",
      "Day 2: squat 5x5",
      "Day 3: deadlift 3x5, pullups 3x8, dips 3x10, face pulls 3x15",
    ].join("\n");
    expect(looksLikeTable(commaProse)).toBe(false);
    expect(chooseImportFixPath(commaProse)).toBe("convert");
  });

  test("a sentence-length header cell is not a table header (seat fix)", () => {
    const text = "Here is the program my coach gave me last spring, roughly\nsquat, 5x5";
    expect(looksLikeTable(text)).toBe(false);
  });
});

describe("parseImportFixRequest", () => {
  test("requires text; accepts optional problems", () => {
    expect(parseImportFixRequest({}).ok).toBe(false);
    expect(parseImportFixRequest({ text: TABLE_TEXT }).ok).toBe(true);
    const withProblems = parseImportFixRequest({
      text: TABLE_TEXT,
      problems: ["Row 2: skipped", "  "],
    });
    expect(withProblems.ok).toBe(true);
    expect(withProblems.value.problems).toEqual(["Row 2: skipped"]);
  });
});

describe("importFix handler - cap, path, settle, refund", () => {
  test("remaining 3 -> 429 weekly_limit needed:4, model never called", async () => {
    const res = mockRes();
    let modelCalls = 0;
    let reserveCalls = 0;
    await importFix(
      {
        authUserId: 1,
        body: { text: TABLE_TEXT, unit: "kg" },
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
          expect(n).toBe(4);
          return {
            ok: false,
            cap: {
              allowed: true,
              limit: 7,
              used: 4,
              remaining: 3,
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
    expect(res.body.needed).toBe(4);
    expect(res.body.remaining).toBe(3);
    expect(modelCalls).toBe(0);
    expect(reserveCalls).toBe(1);
  });

  test("recipe success with usage 5200 -> settle(ids, 2) and cost: 2", async () => {
    const res = mockRes();
    const settled = [];
    const refunded = [];
    const recipe = mockImportRecipeFor(TABLE_TEXT);
    await importFix(
      {
        authUserId: 1,
        body: { text: TABLE_TEXT, unit: "kg" },
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
          ids: [1, 2, 3, 4],
          cap: {
            allowed: true,
            limit: 7,
            used: 7,
            remaining: 0,
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
          usage: { input_tokens: 4000, output_tokens: 1200 },
          content: [{ type: "text", text: JSON.stringify(recipe) }],
        }),
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.kind).toBe("recipe");
    expect(res.body.cost).toBe(2);
    expect(res.body.recipe.prescriptionColumn).toBe("Sets x Reps");
    expect(settled).toEqual([{ ids: [1, 2, 3, 4], cost: 2 }]);
    expect(refunded).toHaveLength(0);
  });

  test("prose text -> convert path chosen (assert which fake was called)", async () => {
    const res = mockRes();
    let recipeCalls = 0;
    let convertCalls = 0;
    const block = validBlock("lb");
    await importFix(
      {
        authUserId: 1,
        body: { text: PROSE_TEXT, unit: "lb" },
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
          ids: [10, 11, 12, 13],
          cap: {
            allowed: true,
            limit: 7,
            used: 4,
            remaining: 3,
            nextAvailableAt: null,
          },
        }),
        settleUses: async () => {},
        refundUses: async () => {},
        completeImportMapRecipe: async () => {
          recipeCalls += 1;
          return { ok: false, status: 500, body: { error: "should_not_recipe" } };
        },
        completeBlockConvert: async () => {
          convertCalls += 1;
          return {
            ok: true,
            block,
            stats: { weeks: 1, days: 1, exercises: 1, sets: 1 },
            usage: { input_tokens: 100, output_tokens: 50 },
            promptChars: 200,
            replyChars: 100,
          };
        },
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.kind).toBe("block");
    expect(res.body.block.name).toBe("Prose Convert");
    expect(convertCalls).toBe(1);
    expect(recipeCalls).toBe(0);
  });

  test("provider failure -> refund all 4", async () => {
    const res = mockRes();
    const refunded = [];
    await importFix(
      {
        authUserId: 1,
        body: { text: TABLE_TEXT },
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
          ids: [21, 22, 23, 24],
          cap: {
            allowed: true,
            limit: 7,
            used: 4,
            remaining: 3,
            nextAvailableAt: null,
          },
        }),
        settleUses: async () => {
          throw new Error("should not settle on failure");
        },
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
        completeAnthropic: async () => {
          throw new CoachProviderError("provider_error", "boom");
        },
      }
    );
    expect(res.statusCode).toBe(502);
    expect(refunded).toEqual([21, 22, 23, 24]);
  });

  test("client disconnect -> provider signal aborted, refund all 4", async () => {
    const res = mockRes();
    const refunded = [];
    let seenSignal = null;
    const hang = new Promise(() => {});
    const pending = importFix(
      {
        authUserId: 1,
        body: { text: TABLE_TEXT, unit: "kg" },
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
          ids: [31, 32, 33, 34],
          cap: {
            allowed: true,
            limit: 7,
            used: 4,
            remaining: 3,
            nextAvailableAt: null,
          },
        }),
        settleUses: async () => {
          throw new Error("should not settle on disconnect");
        },
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
        completeAnthropic: async ({ signal }) => {
          seenSignal = signal;
          res.emitClose();
          expect(signal.aborted).toBe(true);
          const err = new Error("aborted");
          err.name = "AbortError";
          throw err;
        },
      }
    );
    // Keep the hang reference so the linter does not treat it as unused;
    // the provider throws AbortError instead of awaiting forever.
    void hang;
    await pending;
    expect(seenSignal).toBeTruthy();
    expect(seenSignal.aborted).toBe(true);
    expect(refunded).toEqual([31, 32, 33, 34]);
  });
});
