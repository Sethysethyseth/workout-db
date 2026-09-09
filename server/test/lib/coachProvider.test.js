const {
  parseSseBlock,
  interpretAnthropicEvent,
  iterateSse,
  streamAnthropic,
  mapProviderStatus,
  CoachProviderError,
  ANTHROPIC_MESSAGES_URL,
} = require("../../src/coach/provider");
const { streamMock, buildMockNarrative } = require("../../src/coach/mockProvider");

function sse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function bytesStream(chunks) {
  const encoder = new TextEncoder();
  return {
    async *[Symbol.asyncIterator]() {
      for (const c of chunks) yield encoder.encode(c);
    },
  };
}

async function collect(iter) {
  const out = [];
  for await (const item of iter) out.push(item);
  return out;
}

describe("parseSseBlock / interpretAnthropicEvent", () => {
  test("text deltas become text items; block boundaries and pings are ignored", () => {
    const block = parseSseBlock(
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi"}}'
    );
    expect(block.event).toBe("content_block_delta");
    expect(interpretAnthropicEvent(block.data)).toEqual({ type: "text", text: "Hi" });
    expect(interpretAnthropicEvent({ type: "content_block_start" })).toBeNull();
    expect(interpretAnthropicEvent({ type: "ping" })).toBeNull();
    expect(
      interpretAnthropicEvent({ type: "content_block_delta", delta: { type: "thinking_delta", thinking: "x" } })
    ).toBeNull();
  });

  test("message_delta carries the stop reason; error events map to a coach error", () => {
    expect(
      interpretAnthropicEvent({ type: "message_delta", delta: { stop_reason: "refusal" }, usage: { output_tokens: 3 } })
    ).toEqual({ type: "stop", stopReason: "refusal", usage: { output_tokens: 3 } });
    expect(interpretAnthropicEvent({ type: "error", error: { type: "overloaded_error", message: "busy" } })).toEqual({
      type: "error",
      code: "overloaded",
      message: "busy",
    });
  });

  test("malformed data lines are skipped instead of throwing", () => {
    expect(parseSseBlock("event: ping\ndata: not-json")).toBeNull();
    expect(parseSseBlock(": comment only")).toBeNull();
  });
});

describe("iterateSse", () => {
  test("reassembles events split across arbitrary byte chunks", async () => {
    const full =
      sse("message_start", { type: "message_start", message: { model: "m", usage: { input_tokens: 5 } } }) +
      sse("content_block_delta", { type: "content_block_delta", delta: { type: "text_delta", text: "Hel" } }) +
      sse("content_block_delta", { type: "content_block_delta", delta: { type: "text_delta", text: "lo" } }) +
      sse("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2 } }) +
      sse("message_stop", { type: "message_stop" });
    const chunks = [full.slice(0, 17), full.slice(17, 140), full.slice(140)];
    const items = await collect(iterateSse(bytesStream(chunks)));
    expect(items.map((i) => i.type)).toEqual(["start", "text", "text", "stop"]);
    expect(items.filter((i) => i.type === "text").map((i) => i.text).join("")).toBe("Hello");
    expect(items[3].stopReason).toBe("end_turn");
  });
});

describe("streamAnthropic", () => {
  test("sends the documented request shape and streams text back", async () => {
    let captured = null;
    const fetchImpl = async (url, init) => {
      captured = { url, init };
      return {
        ok: true,
        status: 200,
        body: bytesStream([
          sse("content_block_delta", { type: "content_block_delta", delta: { type: "text_delta", text: "ok" } }),
          sse("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn" } }),
        ]),
      };
    };
    const items = await collect(
      streamAnthropic({
        apiKey: "sk-ant-test",
        model: "claude-sonnet-5",
        system: [{ type: "text", text: "sys" }],
        messages: [{ role: "user", content: "q" }],
        effort: "medium",
        maxTokens: 500,
        fetchImpl,
      })
    );
    expect(captured.url).toBe(ANTHROPIC_MESSAGES_URL);
    expect(captured.init.headers["x-api-key"]).toBe("sk-ant-test");
    expect(captured.init.headers["anthropic-version"]).toBe("2023-06-01");
    const body = JSON.parse(captured.init.body);
    expect(body).toMatchObject({
      model: "claude-sonnet-5",
      max_tokens: 500,
      stream: true,
      output_config: { effort: "medium" },
    });
    expect(body.thinking).toBeUndefined();
    expect(items).toEqual([
      { type: "text", text: "ok" },
      { type: "stop", stopReason: "end_turn", usage: null },
    ]);
  });

  test("a non-2xx response throws a coded CoachProviderError before any stream", async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { type: "authentication_error", message: "invalid x-api-key" } }),
    });
    const iter = streamAnthropic({
      apiKey: "bad",
      model: "m",
      system: [],
      messages: [],
      maxTokens: 10,
      fetchImpl,
    });
    await expect(iter.next()).rejects.toMatchObject({
      name: "CoachProviderError",
      code: "invalid_key",
      status: 401,
      message: "invalid x-api-key",
    });
  });

  test("status codes map to stable client-facing reasons", () => {
    expect(mapProviderStatus(429)).toBe("rate_limited");
    expect(mapProviderStatus(529)).toBe("overloaded");
    expect(mapProviderStatus(404)).toBe("unknown_model");
    expect(mapProviderStatus(503)).toBe("provider_error");
    expect(new CoachProviderError("x", "y").name).toBe("CoachProviderError");
  });
});

describe("mock provider", () => {
  const primary = {
    range: { from: "2026-08-13", to: "2026-09-09", weeks: 4 },
    workoutCount: 8,
    perMuscle: [{ muscle: "lats", effectiveSetsPerWeek: 9.5 }, { muscle: "chest", effectiveSetsPerWeek: 12 }],
    perExercise: [{ name: "Bench" }],
    prs: [{ exerciseName: "Bench", type: "weightPR", weight: 185, reps: 5 }],
    meta: { effortCoverage: 0.4 },
  };

  test("narrates the compacted summary and never pretends to be the model", () => {
    const text = buildMockNarrative({ primary, context: null, question: "How am I doing?", unit: "lbs", focus: null });
    expect(text).toMatch(/^\*\*Mock coach\*\*/);
    expect(text).toContain("8 workouts");
    expect(text).toContain("chest at 12 effective sets per week");
    expect(text).toContain("Bench weightPR at 185 lbs x 5");
    expect(text).toContain("40% of sets");
  });

  test("streams start -> text chunks -> stop", async () => {
    const items = await collect(
      streamMock({ primary, context: null, question: "q", unit: "kg", focus: null, noDelay: true })
    );
    expect(items[0].type).toBe("start");
    expect(items[items.length - 1]).toEqual({ type: "stop", stopReason: "end_turn", usage: null });
    const text = items.filter((i) => i.type === "text").map((i) => i.text).join("");
    expect(text).toBe(buildMockNarrative({ primary, context: null, question: "q", unit: "kg", focus: null }));
  });
});
