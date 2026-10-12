const { askCoach } = require("../../src/controllers/coachController");
const streamRegistry = require("../../src/coach/streamRegistry");

const STREAM = "stream-mxf6-test-01";

function hostedResolved() {
  return {
    ok: true,
    provider: "anthropic",
    keyInfo: { source: "hosted", key: "sk-test" },
    config: {
      provider: "anthropic",
      model: "claude-sonnet-5",
      effort: "medium",
      maxTokens: 8000,
    },
  };
}

function closedRes() {
  return {
    statusCode: 200,
    headersSent: false,
    writableEnded: true,
    destroyed: true,
    writable: false,
    events: [],
    status() {
      return this;
    },
    set() {
      return this;
    },
    flushHeaders() {
      throw new Error("socket closed");
    },
    write() {
      throw new Error("write after end");
    },
    end() {
      throw new Error("end after close");
    },
    on() {
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function baseDeps(overrides) {
  return {
    loadCoachAccess: async () => ({
      consentGranted: true,
      entitled: true,
      email: "capped@example.com",
    }),
    resolveCoachProvider: () => hostedResolved(),
    loadCoachData: async () => ({
      ok: true,
      range: { fromLabel: "2026-09-01", toLabel: "2026-09-28" },
      meta: { effortCoverage: 0.8 },
      workoutCount: 4,
      primary: { workoutCount: 4 },
    }),
    reserveUses: async () => ({
      ok: true,
      ids: [1],
      cap: { limit: 7, used: 1, remaining: 6, nextAvailableAt: null, allowed: true },
    }),
    settleUses: async () => {},
    refundUses: async () => {},
    ...overrides,
  };
}

describe("coach stream registry", () => {
  beforeEach(() => {
    streamRegistry.resetForTests();
  });

  test("register then finish removes the entry", () => {
    const controller = new AbortController();
    expect(streamRegistry.register("user-a", STREAM, controller)).toBe(true);
    streamRegistry.finish("user-a", STREAM);
    expect(streamRegistry.stop("user-a", STREAM)).toEqual({ stopped: false });
    expect(controller.signal.aborted).toBe(false);
  });

  test("stop by the owner aborts", () => {
    const controller = new AbortController();
    streamRegistry.register(7, STREAM, controller);
    expect(streamRegistry.stop(7, STREAM)).toEqual({ stopped: true });
    expect(controller.signal.aborted).toBe(true);
    expect(streamRegistry.stop(7, STREAM)).toEqual({ stopped: false });
  });

  test("stop by another user id is a no-op with the same result shape", () => {
    const controller = new AbortController();
    streamRegistry.register("user-a", STREAM, controller);
    const other = streamRegistry.stop("user-b", STREAM);
    const unknown = streamRegistry.stop("user-b", "missing-stream-id");
    expect(other).toEqual({ stopped: false });
    expect(unknown).toEqual(other);
    expect(controller.signal.aborted).toBe(false);
    expect(streamRegistry.stop("user-a", STREAM)).toEqual({ stopped: true });
  });

  test("a stop for an unknown id is a no-op", () => {
    expect(streamRegistry.stop("user-a", "does-not-exist")).toEqual({ stopped: false });
    expect(streamRegistry.stop("user-a", "short")).toEqual({ stopped: false });
    expect(streamRegistry.stop("user-a", null)).toEqual({ stopped: false });
  });

  test("a stop that arrives before register aborts the stream when it registers", () => {
    expect(streamRegistry.stop("user-a", STREAM)).toEqual({ stopped: false });
    const controller = new AbortController();
    expect(streamRegistry.register("user-a", STREAM, controller)).toBe(true);
    expect(controller.signal.aborted).toBe(true);
    // The early stop is spent: a later stream with the same id runs.
    const next = new AbortController();
    streamRegistry.register("user-a", STREAM, next);
    expect(next.signal.aborted).toBe(false);
  });

  test("an early stop by another user does not abort the owner's stream", () => {
    expect(streamRegistry.stop("user-b", STREAM)).toEqual({ stopped: false });
    const controller = new AbortController();
    streamRegistry.register("user-a", STREAM, controller);
    expect(controller.signal.aborted).toBe(false);
  });
});

describe("askCoach disconnect vs stop", () => {
  beforeEach(() => {
    streamRegistry.resetForTests();
  });

  test("a closed client still saves the exchange and does not throw", async () => {
    const saved = [];
    const res = closedRes();
    await askCoach(
      {
        authUserId: "user-a",
        body: { question: "How is my bench?", streamId: STREAM },
      },
      res,
      () => {
        throw new Error("next should not run");
      },
      baseDeps({
        conversationStore: {
          saveSuccessfulExchange: async (_db, payload) => {
            saved.push(payload);
            return 41;
          },
        },
        openCoachStream: async function* () {
          yield { type: "text", text: "Bench is moving." };
          yield { type: "stop", stopReason: "end_turn" };
        },
      })
    );
    expect(saved).toHaveLength(1);
    expect(saved[0].answer).toBe("Bench is moving.");
    expect(saved[0].userId).toBe("user-a");
    expect(streamRegistry.stop("user-a", STREAM)).toEqual({ stopped: false });
  });

  test("Stop aborts the stream and saves nothing", async () => {
    const saved = [];
    let releaseStarted;
    const started = new Promise((resolve) => {
      releaseStarted = resolve;
    });
    const res = {
      statusCode: 200,
      headersSent: false,
      events: [],
      status(code) {
        this.statusCode = code;
        return this;
      },
      set() {
        return this;
      },
      flushHeaders() {
        this.headersSent = true;
      },
      write() {
        return true;
      },
      end() {
        this.writableEnded = true;
        return this;
      },
      on() {
        return this;
      },
    };
    const done = askCoach(
      {
        authUserId: "user-a",
        body: { question: "How is my bench?", streamId: STREAM },
      },
      res,
      () => {},
      baseDeps({
        conversationStore: {
          saveSuccessfulExchange: async (_db, payload) => {
            saved.push(payload);
            return 42;
          },
        },
        openCoachStream: async function* ({ signal }) {
          releaseStarted();
          await new Promise((resolve) => {
            if (signal.aborted) {
              resolve();
              return;
            }
            signal.addEventListener("abort", () => resolve(), { once: true });
          });
        },
      })
    );
    await started;
    expect(streamRegistry.stop("user-a", STREAM)).toEqual({ stopped: true });
    await done;
    expect(saved).toEqual([]);
  });

  test("Stop sent before the ask registers still saves nothing", async () => {
    const saved = [];
    streamRegistry.stop("user-a", STREAM);
    const res = {
      statusCode: 200,
      headersSent: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      set() {
        return this;
      },
      flushHeaders() {
        this.headersSent = true;
      },
      write() {
        return true;
      },
      end() {
        this.writableEnded = true;
        return this;
      },
      on() {
        return this;
      },
    };
    await askCoach(
      {
        authUserId: "user-a",
        body: { question: "How is my bench?", streamId: STREAM },
      },
      res,
      () => {},
      baseDeps({
        conversationStore: {
          saveSuccessfulExchange: async (_db, payload) => {
            saved.push(payload);
            return 43;
          },
        },
        openCoachStream: async function* () {
          yield { type: "text", text: "Bench is moving." };
          yield { type: "stop", stopReason: "end_turn" };
        },
      })
    );
    expect(saved).toEqual([]);
  });
});
