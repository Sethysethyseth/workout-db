const {
  parseBlockDraftRequest,
  parseBlockCandidate,
  validateDraftCandidate,
  blockErrorForStopReason,
  mockBlockDraftFor,
  blockToCompactText,
  buildBlockDraftSystemPrompt,
  BLOCK_FORMAT_JSON_SCHEMA,
} = require("../../src/coach/blockDraft");
const { parseCoachRequest } = require("../../src/coach/coachRequest");
const { buildCoachSystemBlocks, describeFocus } = require("../../src/coach/prompt");
const { draftBlock, blockErrorForStopReason: ctrlStop } = require("../../src/controllers/coachController");
const { extractFirstJsonText } = require("../../src/coach/cursorProvider");
const { validateBlockDraft } = require("../../src/blocks/blockFormat");

function validBlock(unit = "lb") {
  return {
    format: "logchamp.block",
    version: 1,
    name: "Test Upper",
    unit,
    effort: "rpe",
    weeks: [
      {
        days: [
          {
            name: "Day A",
            exercises: [
              {
                name: "Bench Press",
                sets: [{ reps: 5, weight: 185, rpe: 8 }],
              },
            ],
          },
        ],
      },
    ],
  };
}

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

describe("parseBlockDraftRequest", () => {
  test("requires mode, text and unit", () => {
    expect(parseBlockDraftRequest({}).ok).toBe(false);
    expect(parseBlockDraftRequest({ mode: "convert", text: "hi" }).error).toMatch(/unit/);
    expect(parseBlockDraftRequest({ mode: "convert", text: "hi", unit: "lb" }).ok).toBe(true);
    expect(parseBlockDraftRequest({ mode: "generate", text: "  prog  ", unit: "kg" }).value).toEqual({
      mode: "generate",
      text: "prog",
      unit: "kg",
    });
  });
});

describe("parseBlockCandidate / extractFirstJsonText - Cursor fence path", () => {
  test("extracts a fenced JSON object wrapped in prose", () => {
    const block = validBlock("lb");
    const raw = `Sure, here you go:\n\n\`\`\`json\n${JSON.stringify(block)}\n\`\`\`\n\nHope that helps!`;
    const extracted = extractFirstJsonText(raw);
    expect(extracted).toBeTruthy();
    const parsed = parseBlockCandidate(raw, { provider: "cursor" });
    expect(parsed.ok).toBe(true);
    expect(parsed.candidate.name).toBe("Test Upper");
  });
});

describe("validateDraftCandidate - reject, never repair", () => {
  test("unknown field -> block_invalid with that path", () => {
    const bad = { ...validBlock(), secretField: "nope" };
    const result = validateDraftCandidate(bad, "lb");
    expect(result.ok).toBe(false);
    expect(result.body.error).toBe("block_invalid");
    expect(result.body.errors.some((e) => e.path === "secretField")).toBe(true);
  });

  test("valid format JSON passes and returns stats", () => {
    const result = validateDraftCandidate(validBlock("kg"), "kg");
    expect(result.ok).toBe(true);
    expect(result.block.name).toBe("Test Upper");
    expect(result.stats.weeks).toBe(1);
  });
});

describe("blockErrorForStopReason", () => {
  test("max_tokens returns 422 without repair; refusal is distinct", () => {
    expect(blockErrorForStopReason("max_tokens")).toEqual({
      status: 422,
      body: {
        error: "block_truncated",
        message: "The model ran out of room.",
      },
    });
    expect(blockErrorForStopReason("refusal").body.error).toBe("block_refused");
    expect(blockErrorForStopReason("end_turn")).toBeNull();
    expect(ctrlStop).toBe(blockErrorForStopReason);
  });
});

describe("mockBlockDraftFor", () => {
  test("mentions the mode in its name and always validates", () => {
    for (const mode of ["convert", "generate"]) {
      const draft = mockBlockDraftFor(mode, "lb");
      expect(draft.name.toLowerCase()).toContain(mode === "generate" ? "generate" : "convert");
      const validated = validateBlockDraft(draft, { targetUnit: "lb" });
      expect(validated.ok).toBe(true);
    }
  });
});

describe("coachRequest focus type block", () => {
  test("accepts { type: 'block', blockId }", () => {
    const result = parseCoachRequest({
      question: "Is volume balanced?",
      focus: { type: "block", blockId: "9" },
    });
    expect(result.ok).toBe(true);
    expect(result.value.focus).toEqual({ type: "block", blockId: 9 });
  });
});

describe("block focus prompt - never leaks another user's block", () => {
  test("describeFocus and system blocks only include block text when supplied on focus", () => {
    expect(describeFocus({ type: "block" })).toMatch(/Block mode/);
    const without = buildCoachSystemBlocks({
      primary: { workoutCount: 0 },
      unit: "lbs",
      focus: { type: "block" },
      today: "2026-09-29",
      weeks: 4,
      fromLabel: "2026-09-01",
      toLabel: "2026-09-28",
    });
    const dataText = without[2].text;
    expect(dataText).toContain("(block text unavailable)");
    expect(dataText).not.toContain("Secret foreign block");

    const withOwned = buildCoachSystemBlocks({
      primary: { workoutCount: 1 },
      unit: "lbs",
      focus: {
        type: "block",
        blockText: blockToCompactText(validBlock("lb"), "lb"),
      },
      today: "2026-09-29",
      weeks: 4,
      fromLabel: "2026-09-01",
      toLabel: "2026-09-28",
    });
    expect(withOwned[2].text).toContain("Test Upper");
    expect(withOwned[2].text).toContain("Bench Press");
  });
});

describe("draftBlock handler - injected seams", () => {
  function hostedResolved() {
    return {
      ok: true,
      provider: "anthropic",
      keyInfo: { source: "hosted", key: "sk-test" },
      config: { provider: "anthropic", model: "claude-sonnet-5", effort: "medium", maxTokens: 8000 },
    };
  }

  test("consent off -> 403 no_consent", async () => {
    const res = mockRes();
    await draftBlock(
      { authUserId: 1, body: { mode: "convert", text: "notes", unit: "lb" }, get: () => null },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: false,
          entitled: true,
          email: "a@b.c",
        }),
      }
    );
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "forbidden", reason: "no_consent" });
  });

  test("valid Anthropic JSON -> 200 with block", async () => {
    const res = mockRes();
    const block = validBlock("lb");
    const settled = [];
    await draftBlock(
      { authUserId: 1, body: { mode: "convert", text: "bench day", unit: "lb" }, get: () => null },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: true,
          entitled: true,
          email: "a@b.c",
        }),
        resolveCoachProvider: () => hostedResolved(),
        reserveUses: async () => ({
          ok: true,
          ids: [42],
          cap: { allowed: true, limit: 7, used: 1, remaining: 6, nextAvailableAt: null },
        }),
        settleUses: async (_p, ids, cost) => {
          settled.push({ ids, cost });
        },
        refundUses: async () => {
          throw new Error("should not refund on success");
        },
        completeAnthropic: async () => ({
          stop_reason: "end_turn",
          content: [{ type: "text", text: JSON.stringify(block) }],
        }),
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.block.name).toBe("Test Upper");
    expect(res.body.stats).toBeTruthy();
    expect(res.body.source).toBe("hosted");
    expect(settled).toEqual([{ ids: [42], cost: 1 }]);
  });

  test("Cursor prose+fence path -> extracted and accepted", async () => {
    const res = mockRes();
    const block = validBlock("kg");
    const raw = `Here:\n\`\`\`json\n${JSON.stringify(block)}\n\`\`\``;
    await draftBlock(
      { authUserId: 1, body: { mode: "convert", text: "notes", unit: "kg" }, get: () => null },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: true,
          entitled: true,
          email: "a@b.c",
        }),
        resolveCoachProvider: () => ({
          ok: true,
          provider: "cursor",
          keyInfo: { source: "hosted", key: "key" },
          config: { provider: "cursor", model: "auto", effort: "medium", maxTokens: 8000 },
        }),
        reserveUses: async () => ({
          ok: true,
          ids: [7],
          cap: { allowed: true, limit: 7, used: 1, remaining: 6, nextAvailableAt: null },
        }),
        settleUses: async () => {},
        refundUses: async () => {},
        completeCursor: async () => raw,
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.block.unit).toBe("kg");
  });

  test("unknown field -> 422 block_invalid and reserved row refunded", async () => {
    const res = mockRes();
    const refunded = [];
    const bad = { ...validBlock(), mystery: true };
    await draftBlock(
      { authUserId: 1, body: { mode: "convert", text: "x", unit: "lb" }, get: () => null },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: true,
          entitled: true,
          email: "a@b.c",
        }),
        resolveCoachProvider: () => hostedResolved(),
        reserveUses: async () => ({
          ok: true,
          ids: [99],
          cap: { allowed: true, limit: 7, used: 1, remaining: 6, nextAvailableAt: null },
        }),
        settleUses: async () => {
          throw new Error("should not settle");
        },
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
        completeAnthropic: async () => ({
          stop_reason: "end_turn",
          content: [{ type: "text", text: JSON.stringify(bad) }],
        }),
      }
    );
    expect(res.statusCode).toBe(422);
    expect(res.body.error).toBe("block_invalid");
    expect(res.body.errors.some((e) => e.path === "mystery")).toBe(true);
    expect(refunded).toContain(99);
  });

  test("client disconnect aborts the provider call and refunds (bkr-d2 seat fix)", async () => {
    const res = mockRes();
    const listeners = {};
    res.on = (event, fn) => {
      listeners[event] = fn;
      return res;
    };
    res.writableEnded = false;
    res.end = () => res;
    const refunded = [];
    let seenSignal = null;
    await draftBlock(
      { authUserId: 1, body: { mode: "generate", text: "4-week upper/lower", unit: "lb" }, get: () => null },
      res,
      () => {
        throw new Error("an aborted call must not reach the error handler");
      },
      {
        loadCoachAccess: async () => ({ consentGranted: true, entitled: true, email: "a@b.c" }),
        resolveCoachProvider: () => hostedResolved(),
        loadSummary: async () => ({}),
        reserveUses: async () => ({
          ok: true,
          ids: [42],
          cap: { allowed: true, limit: 7, used: 1, remaining: 6, nextAvailableAt: null },
        }),
        settleUses: async () => {
          throw new Error("should not settle");
        },
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
        completeAnthropic: ({ signal }) =>
          new Promise((_resolve, reject) => {
            seenSignal = signal;
            signal.addEventListener("abort", () => reject(new Error("aborted")));
            listeners.close();
          }),
      }
    );
    expect(seenSignal).not.toBeNull();
    expect(seenSignal.aborted).toBe(true);
    expect(refunded).toEqual([42]);
  });

  test("max_tokens stop -> 422 without repair", async () => {
    const res = mockRes();
    const refunded = [];
    await draftBlock(
      { authUserId: 1, body: { mode: "convert", text: "x", unit: "lb" }, get: () => null },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: true,
          entitled: true,
          email: "a@b.c",
        }),
        resolveCoachProvider: () => hostedResolved(),
        reserveUses: async () => ({
          ok: true,
          ids: [11],
          cap: { allowed: true, limit: 7, used: 1, remaining: 6, nextAvailableAt: null },
        }),
        settleUses: async () => {},
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
        completeAnthropic: async () => ({
          stop_reason: "max_tokens",
          content: [{ type: "text", text: '{"format":' }],
        }),
      }
    );
    expect(res.statusCode).toBe(422);
    expect(res.body.error).toBe("block_truncated");
    expect(res.body.error).not.toBe("block_invalid");
    expect(refunded).toContain(11);
  });

  test("generate off-topic sentinel -> 400 plain message and refund", async () => {
    const { OFF_TOPIC_BLOCK_NAME, OFF_TOPIC_DRAFT_MESSAGE } = require("../../src/coach/blockDraft");
    const res = mockRes();
    const refunded = [];
    const sentinel = {
      ...validBlock("lb"),
      name: OFF_TOPIC_BLOCK_NAME,
    };
    await draftBlock(
      {
        authUserId: 1,
        body: { mode: "generate", text: "write a C# sorting script", unit: "lb" },
        get: () => null,
      },
      res,
      () => {},
      {
        loadCoachAccess: async () => ({
          consentGranted: true,
          entitled: true,
          email: "a@b.c",
        }),
        resolveCoachProvider: () => hostedResolved(),
        loadSummary: async () => ({ workoutCount: 0 }),
        reserveUses: async () => ({
          ok: true,
          ids: [33],
          cap: { allowed: true, limit: 7, used: 1, remaining: 6, nextAvailableAt: null },
        }),
        settleUses: async () => {
          throw new Error("should not settle off-topic");
        },
        refundUses: async (_p, ids) => {
          refunded.push(...ids);
        },
        completeAnthropic: async () => ({
          stop_reason: "end_turn",
          content: [{ type: "text", text: JSON.stringify(sentinel) }],
        }),
      }
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe(OFF_TOPIC_DRAFT_MESSAGE);
    expect(refunded).toEqual([33]);
  });
});

describe("block focus ownership - source pin + prompt isolation", () => {
  test("askCoach loadCoachData owner-checks with userId in the where clause", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.join(__dirname, "../../src/coach/askCoach.js"),
      "utf8"
    );
    expect(src).toMatch(
      /blockTemplate\.findFirst\(\s*\{\s*where:\s*\{\s*id:\s*focus\.blockId,\s*userId\s*\}/
    );
    expect(src).toMatch(/error:\s*"block_not_found"/);
  });

  test("a 404 ownership miss never feeds block text into the prompt", () => {
    // Mirrors the controller path: on !blockRow return 404 before
    // blockToCompactText / buildCoachPrompt. Without blockText on focus,
    // the system prompt must not invent weeks/exercises.
    const system = buildCoachSystemBlocks({
      primary: { workoutCount: 0 },
      unit: "lbs",
      focus: { type: "block" },
      today: "2026-09-29",
      weeks: 1,
      fromLabel: "a",
      toLabel: "b",
    });
    expect(system[2].text).toContain("(block text unavailable)");
    // [1] is the app guide since qol6; the data block moved to [2]. Check the
    // data block AND every block, so a foreign block can't hide anywhere.
    expect(system[2].text).not.toMatch(/Bench Press|Secret foreign/i);
    expect(system.map((b) => b.text).join("\n")).not.toMatch(/Secret foreign/i);
  });
});

describe("palette pattern wiring is present", () => {
  test("BLOCK_FORMAT_JSON_SCHEMA is the structured-output schema", () => {
    expect(BLOCK_FORMAT_JSON_SCHEMA.properties.format.const).toBe("logchamp.block");
  });

  test("generate-mode system prompt includes the format instructions", () => {
    const prompt = buildBlockDraftSystemPrompt({
      mode: "generate",
      unit: "lb",
      trainingSummary: { workoutCount: 3 },
    });
    expect(prompt).toMatch(/LogChamp Block Format/);
    expect(prompt).toContain('"workoutCount":3');
  });

  test("generate-mode system prompt includes the training-only scope rule", () => {
    const { OFF_TOPIC_BLOCK_NAME } = require("../../src/coach/blockDraft");
    const prompt = buildBlockDraftSystemPrompt({
      mode: "generate",
      unit: "lb",
      trainingSummary: null,
    });
    expect(prompt).toMatch(/training blocks only/i);
    expect(prompt).toContain(OFF_TOPIC_BLOCK_NAME);
    expect(prompt).toMatch(/code, general math, homework, trivia/i);
  });
});
