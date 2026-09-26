const os = require("os");
const path = require("path");
const { getCoachConfig } = require("../../src/coach/config");
const { resolveCoachKey } = require("../../src/coach/keyResolver");
const { resolveCoachProvider } = require("../../src/coach/askCoach");
const {
  streamCursor,
  extractFirstJsonObject,
} = require("../../src/coach/cursorProvider");

const GOOD_BYO = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789";
const REPO_ROOT = path.resolve(__dirname, "../../..");

async function collect(iter) {
  const out = [];
  for await (const item of iter) out.push(item);
  return out;
}

function makeFakeSdk({
  deltas = [],
  waitStatus = "finished",
  waitResult = "",
  sendError,
  sendErrorOnce,
  waitErrorOnce,
} = {}) {
  const created = [];
  const disposed = [];
  const sends = [];

  class RateLimitError extends Error {
    constructor(message) {
      super(message);
      this.name = "RateLimitError";
    }
  }
  class AuthenticationError extends Error {
    constructor(message) {
      super(message);
      this.name = "AuthenticationError";
    }
  }

  class JsonlLocalAgentStore {
    constructor(rootDir) {
      this.rootDir = rootDir;
    }
  }

  const sdk = {
    RateLimitError,
    AuthenticationError,
    JsonlLocalAgentStore,
    Agent: {
      create: async (opts) => {
        created.push(opts);
        const agent = {
          send: async (message, options) => {
            sends.push({ message, options, createOpts: opts });
            if (sendErrorOnce && sends.length === 1) {
              throw sendErrorOnce;
            }
            if (sendError) throw sendError;
            if (options && typeof options.onDelta === "function") {
              for (const text of deltas) {
                options.onDelta({ update: { type: "text-delta", text } });
              }
            }
            return {
              wait: async () => {
                if (waitErrorOnce && sends.length === 1) {
                  return { status: "error", error: waitErrorOnce };
                }
                return { status: waitStatus, result: waitResult };
              },
              cancel: async () => {},
              supports: (op) => op === "cancel",
            };
          },
          close() {
            disposed.push("close");
          },
          async [Symbol.asyncDispose]() {
            disposed.push("dispose");
          },
        };
        return agent;
      },
    },
  };

  return { sdk, created, disposed, sends, RateLimitError, AuthenticationError };
}

describe("getCoachConfig - cursor provider", () => {
  test("COACH_PROVIDER=cursor uses auto and keeps the hosted key", () => {
    expect(
      getCoachConfig({ COACH_PROVIDER: "cursor", COACH_API_KEY: "key_abc" })
    ).toMatchObject({
      provider: "cursor",
      model: "auto",
      hostedKey: "key_abc",
    });
  });

  test("unset env stays anthropic / claude-sonnet-5", () => {
    expect(getCoachConfig({})).toMatchObject({
      provider: "anthropic",
      model: "claude-sonnet-5",
    });
  });

  test("COACH_MODEL overrides the cursor default", () => {
    expect(
      getCoachConfig({ COACH_PROVIDER: "cursor", COACH_MODEL: "composer-2.5" })
    ).toMatchObject({ provider: "cursor", model: "composer-2.5" });
  });
});

describe("resolveCoachProvider - per-request provider", () => {
  const cursorConfig = getCoachConfig({
    COACH_PROVIDER: "cursor",
    COACH_API_KEY: "key_abc",
  });

  test("hosted cursor key + entitled -> hosted / cursor", () => {
    const resolved = resolveCoachProvider({
      byoKey: null,
      entitled: true,
      config: cursorConfig,
    });
    expect(resolved.ok).toBe(true);
    expect(resolved.keyInfo.source).toBe("hosted");
    expect(resolved.keyInfo.key).toBe("key_abc");
    expect(resolved.provider).toBe("cursor");
  });

  test("valid BYO sk-ant- key wins and stays anthropic", () => {
    const resolved = resolveCoachProvider({
      byoKey: GOOD_BYO,
      entitled: true,
      config: cursorConfig,
    });
    expect(resolved.ok).toBe(true);
    expect(resolved.keyInfo.source).toBe("byo");
    expect(resolved.provider).toBe("anthropic");
  });

  test("BYO never inherits a cursor COACH_MODEL", () => {
    const explicitAuto = getCoachConfig({
      COACH_PROVIDER: "cursor",
      COACH_API_KEY: "key_abc",
      COACH_MODEL: "auto",
    });
    const byo = resolveCoachProvider({ byoKey: GOOD_BYO, entitled: true, config: explicitAuto });
    expect(byo.config.model).toBe("claude-sonnet-5");
    const hosted = resolveCoachProvider({ byoKey: null, entitled: true, config: explicitAuto });
    expect(hosted.config.model).toBe("auto");
  });

  test("BYO hunter2 is still bad_key_format", () => {
    const resolved = resolveCoachProvider({
      byoKey: "hunter2",
      entitled: true,
      config: cursorConfig,
    });
    expect(resolved.ok).toBe(false);
    expect(resolved.reason).toBe("bad_key_format");
    expect(
      resolveCoachKey({
        byoKey: "hunter2",
        hostedKey: "key_abc",
        entitled: true,
        hostedProvider: "cursor",
      })
    ).toEqual({ source: null, key: null, reason: "bad_key_format" });
  });
});

describe("streamCursor - injected fake SDK", () => {
  const system = [
    { type: "text", text: "You are the coach." },
    { type: "text", text: "DATA", cache_control: { type: "ephemeral" } },
  ];
  const messages = [{ role: "user", content: "How is volume?" }];

  test("Agent.create gets tools [], explicit apiKey, tmp cwd, no settingSources/mcpServers", async () => {
    const { sdk, created } = makeFakeSdk({ deltas: ["ok"], waitStatus: "finished" });
    await collect(
      streamCursor({
        apiKey: "key_abc",
        model: "auto",
        system,
        messages,
        sdk,
      })
    );
    expect(created).toHaveLength(1);
    const opts = created[0];
    expect(opts.tools).toEqual([]);
    expect(opts.apiKey).toBe("key_abc");
    expect(opts.model).toEqual({ id: "auto" });
    expect(opts.local.cwd.startsWith(os.tmpdir())).toBe(true);
    expect(path.resolve(opts.local.cwd).startsWith(path.resolve(REPO_ROOT))).toBe(false);
    expect(opts).not.toHaveProperty("settingSources");
    expect(opts).not.toHaveProperty("mcpServers");
    expect(opts.local).not.toHaveProperty("settingSources");
    expect(opts.local).not.toHaveProperty("mcpServers");
  });

  test("two text-delta updates + finished wait yield start, text, text, stop end_turn", async () => {
    const { sdk } = makeFakeSdk({
      deltas: ["Hel", "lo"],
      waitStatus: "finished",
    });
    const items = await collect(
      streamCursor({
        apiKey: "key_abc",
        model: "auto",
        system,
        messages,
        sdk,
      })
    );
    expect(items.map((i) => i.type)).toEqual(["start", "text", "text", "stop"]);
    expect(items.filter((i) => i.type === "text").map((i) => i.text).join("")).toBe("Hello");
    expect(items[3]).toMatchObject({ type: "stop", stopReason: "end_turn" });
  });

  test("gated system-prompt error retries once without systemPrompt and inlines the system text", async () => {
    const gate = new Error("InvalidArgument: --system-prompt is not enabled for this account");
    gate.code = "InvalidArgument";
    const { sdk, created, sends } = makeFakeSdk({
      deltas: ["ok"],
      waitStatus: "finished",
      sendErrorOnce: gate,
    });
    const items = await collect(
      streamCursor({
        apiKey: "key_abc",
        model: "auto",
        system,
        messages,
        sdk,
      })
    );
    expect(created).toHaveLength(2);
    expect(created[0].systemPrompt).toContain("You are the coach.");
    expect(created[0].systemPrompt).toContain("DATA");
    expect(created[0].systemPrompt).not.toContain("cache_control");
    expect(created[1]).not.toHaveProperty("systemPrompt");
    expect(sends).toHaveLength(2);
    expect(sends[1].message).toContain("You are the coach.");
    expect(sends[1].message).toContain("How is volume?");
    expect(items.some((i) => i.systemPromptMode === "inline")).toBe(true);
  });

  test("wait() error naming --system-prompt retries once the same way send() throw does", async () => {
    const { sdk, created, sends } = makeFakeSdk({
      deltas: ["ok"],
      waitStatus: "finished",
      waitErrorOnce: {
        message: "[invalid_argument] unknown option '--system-prompt'",
        code: "invalid_argument",
      },
    });
    const items = await collect(
      streamCursor({
        apiKey: "key_abc",
        model: "auto",
        system,
        messages,
        sdk,
      })
    );
    expect(created).toHaveLength(2);
    expect(created[0]).toHaveProperty("systemPrompt");
    expect(created[1]).not.toHaveProperty("systemPrompt");
    expect(sends).toHaveLength(2);
    expect(sends[1].message).toContain("You are the coach.");
    expect(items.some((i) => i.systemPromptMode === "inline")).toBe(true);
    expect(items.filter((i) => i.type === "error")).toEqual([]);
  });

  test("RateLimitError-shaped throw becomes CoachProviderError rate_limited", async () => {
    const boom = new Error("slow down");
    boom.name = "RateLimitError";
    const fake = makeFakeSdk({ sendError: boom });
    await expect(
      collect(
        streamCursor({
          apiKey: "key_abc",
          model: "auto",
          system,
          messages,
          sdk: fake.sdk,
        })
      )
    ).rejects.toMatchObject({
      name: "CoachProviderError",
      code: "rate_limited",
    });
    expect(fake.disposed).toContain("dispose");
  });

  test("AuthenticationError-shaped throw becomes provider_error", async () => {
    const boom = new Error("bad key");
    boom.name = "AuthenticationError";
    const fake = makeFakeSdk({ sendError: boom });
    await expect(
      collect(
        streamCursor({
          apiKey: "key_abc",
          model: "auto",
          system,
          messages,
          sdk: fake.sdk,
        })
      )
    ).rejects.toMatchObject({
      name: "CoachProviderError",
      code: "provider_error",
    });
    expect(fake.disposed).toContain("dispose");
  });

  test("the agent is disposed on success and on error", async () => {
    const ok = makeFakeSdk({ deltas: ["x"], waitStatus: "finished" });
    await collect(
      streamCursor({
        apiKey: "key_abc",
        model: "auto",
        system,
        messages,
        sdk: ok.sdk,
      })
    );
    expect(ok.disposed).toContain("dispose");

    const boom = new Error("rate");
    boom.name = "RateLimitError";
    const bad = makeFakeSdk({ sendError: boom });
    await expect(
      collect(
        streamCursor({
          apiKey: "key_abc",
          model: "auto",
          system,
          messages,
          sdk: bad.sdk,
        })
      )
    ).rejects.toMatchObject({ code: "rate_limited" });
    expect(bad.disposed).toContain("dispose");
  });
});

describe("extractFirstJsonObject", () => {
  const sample = { name: "Moss", scene: "forest" };

  test("a ```json fence yields the object", () => {
    const raw = "```json\n" + JSON.stringify(sample) + "\n```";
    expect(extractFirstJsonObject(raw)).toEqual(sample);
  });

  test("a bare object yields the object", () => {
    expect(extractFirstJsonObject(JSON.stringify(sample))).toEqual(sample);
  });

  test("no json here yields nothing", () => {
    expect(extractFirstJsonObject("no json here")).toBeNull();
  });
});
