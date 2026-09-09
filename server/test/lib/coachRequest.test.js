const {
  parseCoachRequest,
  normalizeHistory,
  MAX_QUESTION_CHARS,
  MAX_HISTORY_TURNS,
} = require("../../src/coach/coachRequest");

describe("parseCoachRequest", () => {
  test("requires a non-empty question and caps its length", () => {
    expect(parseCoachRequest({})).toEqual({ ok: false, status: 400, error: "question is required" });
    expect(parseCoachRequest({ question: "   " }).ok).toBe(false);
    const long = "x".repeat(MAX_QUESTION_CHARS + 1);
    expect(parseCoachRequest({ question: long }).error).toMatch(/at most/);
  });

  test("defaults: lbs, no focus, no range, empty history", () => {
    const result = parseCoachRequest({ question: " How is my bench? " });
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({
      question: "How is my bench?",
      unit: "lbs",
      focus: null,
      range: null,
      history: [],
    });
  });

  test("accepts the analytics page's date-only range and bounds it at end of day", () => {
    const result = parseCoachRequest({
      question: "q",
      unit: "kg",
      range: { from: "2026-08-01", to: "2026-08-28" },
    });
    expect(result.ok).toBe(true);
    expect(result.value.unit).toBe("kg");
    expect(result.value.range.from.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(result.value.range.to.toISOString()).toBe("2026-08-28T23:59:59.999Z");
    expect(result.value.range.fromLabel).toBe("2026-08-01");
    expect(result.value.range.toLabel).toBe("2026-08-28");
  });

  test("rejects a reversed or oversized range", () => {
    expect(
      parseCoachRequest({ question: "q", range: { from: "2026-08-28", to: "2026-08-01" } }).error
    ).toMatch(/must not be after/);
    expect(
      parseCoachRequest({ question: "q", range: { from: "2026-01-01", to: "2026-08-01" } }).error
    ).toMatch(/at most/);
    expect(parseCoachRequest({ question: "q", range: { from: "yesterday", to: "2026-08-01" } }).ok).toBe(
      false
    );
  });

  test("parses a view focus and a session focus, rejecting anything else", () => {
    expect(parseCoachRequest({ question: "q", focus: { type: "view", view: "strength" } }).value.focus).toEqual({
      type: "view",
      view: "strength",
    });
    expect(parseCoachRequest({ question: "q", focus: { type: "session", sessionId: "42" } }).value.focus).toEqual({
      type: "session",
      sessionId: 42,
    });
    expect(parseCoachRequest({ question: "q", focus: { type: "view", view: "secrets" } }).ok).toBe(false);
    expect(parseCoachRequest({ question: "q", focus: { type: "session", sessionId: -1 } }).ok).toBe(false);
    expect(parseCoachRequest({ question: "q", focus: { type: "everything" } }).ok).toBe(false);
  });
});

describe("normalizeHistory", () => {
  test("merges same-role runs, drops a leading assistant and a trailing user turn", () => {
    const history = normalizeHistory([
      { role: "assistant", content: "hello" },
      { role: "user", content: "a" },
      { role: "user", content: "b" },
      { role: "assistant", content: "answer" },
      { role: "user", content: "unanswered" },
    ]);
    expect(history).toEqual([
      { role: "user", content: "a\n\nb" },
      { role: "assistant", content: "answer" },
    ]);
  });

  test("ignores junk entries and caps the number of turns", () => {
    const raw = [];
    for (let i = 0; i < MAX_HISTORY_TURNS + 6; i += 1) {
      raw.push({ role: i % 2 === 0 ? "user" : "assistant", content: `t${i}` });
    }
    raw.push(null, { role: "system", content: "nope" }, { role: "user", content: "" });
    const history = normalizeHistory(raw);
    expect(history.length).toBeLessThanOrEqual(MAX_HISTORY_TURNS);
    expect(history[0].role).toBe("user");
    expect(history[history.length - 1].role).toBe("assistant");
  });
});
