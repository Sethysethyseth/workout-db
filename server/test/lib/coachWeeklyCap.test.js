const {
  WEEKLY_LIMIT,
  IMPORT_MAP_COST,
  PALETTE_COST,
  ASK_COST,
  DRAFT_COST,
  parseUncappedEmails,
  isUncappedEmail,
  weeklyCapApplies,
  evaluateWeeklyCap,
  clampSettleCost,
  remainingCoversCost,
} = require("../../src/coach/weeklyCap");

describe("cost constants", () => {
  test("palette / ask / draft cost 1; import-map costs 3", () => {
    expect(PALETTE_COST).toBe(1);
    expect(ASK_COST).toBe(1);
    expect(DRAFT_COST).toBe(1);
    expect(IMPORT_MAP_COST).toBe(3);
    expect(remainingCoversCost(0, PALETTE_COST)).toBe(false);
    expect(remainingCoversCost(1, PALETTE_COST)).toBe(true);
  });

  test("clampSettleCost clamps to 0..reservedCount", () => {
    expect(clampSettleCost(2, 4)).toBe(2);
    expect(clampSettleCost(9, 4)).toBe(4);
    expect(clampSettleCost(-1, 4)).toBe(0);
    expect(clampSettleCost("x", 4)).toBe(0);
  });
});

describe("parseUncappedEmails", () => {
  test('trims, lowercases, and drops empties from " Seth@Example.com , ,b@x.io"', () => {
    const parsed = parseUncappedEmails(" Seth@Example.com , ,b@x.io");
    expect(parsed).toEqual(expect.arrayContaining(["seth@example.com", "b@x.io"]));
    expect(parsed).toHaveLength(2);
  });

  test("undefined and empty string mean nobody is exempt", () => {
    expect(parseUncappedEmails(undefined)).toEqual([]);
    expect(parseUncappedEmails("")).toEqual([]);
  });
});

describe("isUncappedEmail", () => {
  test("matching is case-insensitive", () => {
    const raw = "Seth@Example.com";
    expect(isUncappedEmail("seth@example.com", raw)).toBe(true);
    expect(isUncappedEmail("SETH@EXAMPLE.COM", raw)).toBe(true);
    expect(isUncappedEmail("other@x.io", raw)).toBe(false);
  });

  test("unset or empty exemption list matches nobody", () => {
    expect(isUncappedEmail("seth@example.com", undefined)).toBe(false);
    expect(isUncappedEmail("seth@example.com", "")).toBe(false);
  });
});

describe("weeklyCapApplies", () => {
  test("only hosted + non-exempt emails are capped", () => {
    expect(weeklyCapApplies("hosted", "user@x.io", "")).toBe(true);
    expect(weeklyCapApplies("hosted", "Owner@X.io", "owner@x.io")).toBe(false);
    expect(weeklyCapApplies("byo", "user@x.io", "")).toBe(false);
    expect(weeklyCapApplies("mock", "user@x.io", "")).toBe(false);
  });
});

describe("evaluateWeeklyCap", () => {
  const now = new Date("2026-09-27T12:00:00Z");

  test("6 timestamps inside the last 7 days -> allowed, used 6, remaining 1, nextAvailableAt null", () => {
    const timestamps = [
      "2026-09-21T13:00:00.000Z",
      "2026-09-22T12:00:00.000Z",
      "2026-09-23T12:00:00.000Z",
      "2026-09-24T12:00:00.000Z",
      "2026-09-25T12:00:00.000Z",
      "2026-09-26T12:00:00.000Z",
    ];
    expect(evaluateWeeklyCap(timestamps, now)).toEqual({
      allowed: true,
      used: 6,
      remaining: 1,
      nextAvailableAt: null,
    });
  });

  test("7 inside, oldest 2026-09-21T09:00:00Z -> blocked until that row ages out", () => {
    const timestamps = [
      "2026-09-21T09:00:00.000Z",
      "2026-09-22T12:00:00.000Z",
      "2026-09-23T12:00:00.000Z",
      "2026-09-24T12:00:00.000Z",
      "2026-09-25T12:00:00.000Z",
      "2026-09-26T12:00:00.000Z",
      "2026-09-27T08:00:00.000Z",
    ];
    expect(evaluateWeeklyCap(timestamps, now)).toEqual({
      allowed: false,
      used: 7,
      remaining: 0,
      nextAvailableAt: "2026-09-28T09:00:00.000Z",
    });
  });

  test("7 timestamps all older than 7 days -> allowed, used 0", () => {
    const timestamps = [
      "2026-09-01T12:00:00.000Z",
      "2026-09-10T12:00:00.000Z",
      "2026-09-15T12:00:00.000Z",
      "2026-09-18T12:00:00.000Z",
      "2026-09-19T12:00:00.000Z",
      "2026-09-20T00:00:00.000Z",
      "2026-09-20T11:59:59.000Z",
    ];
    const result = evaluateWeeklyCap(timestamps, now);
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(WEEKLY_LIMIT);
    expect(result.nextAvailableAt).toBe(null);
  });

  test("a timestamp exactly 7 days old is OUT of the window", () => {
    const boundary = new Date("2026-09-20T12:00:00.000Z");
    const result = evaluateWeeklyCap([boundary], now);
    expect(result.used).toBe(0);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(WEEKLY_LIMIT);
    expect(result.nextAvailableAt).toBe(null);
  });

  test("8 in the window (concurrent overshoot) -> frees up when the SECOND oldest ages out", () => {
    const timestamps = [
      "2026-09-26T10:00:00Z",
      "2026-09-21T09:00:00Z",
      "2026-09-25T10:00:00Z",
      "2026-09-22T08:00:00Z",
      "2026-09-24T10:00:00Z",
      "2026-09-23T10:00:00Z",
      "2026-09-27T10:00:00Z",
      "2026-09-26T11:00:00Z",
    ];
    const result = evaluateWeeklyCap(timestamps, now);
    expect(result).toEqual({
      allowed: false,
      used: 8,
      remaining: 0,
      nextAvailableAt: "2026-09-29T08:00:00.000Z",
    });
  });
});
