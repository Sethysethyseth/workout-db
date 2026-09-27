const { canDiscardSession } = require("../../src/lib/sessionDiscard");

const finishedAt = new Date("2026-09-01T12:00:00.000Z");
const reopenedAt = new Date("2026-09-02T12:00:00.000Z");

describe("canDiscardSession", () => {
  test("{ completedAt: null, reopenedAt: null } -> allowed", () => {
    expect(canDiscardSession({ completedAt: null, reopenedAt: null })).toEqual({
      allowed: true,
      reason: null,
    });
  });

  test("{ completedAt: <date>, reopenedAt: null } -> not allowed", () => {
    expect(canDiscardSession({ completedAt: finishedAt, reopenedAt: null })).toEqual({
      allowed: false,
      reason: "completed",
    });
  });

  test("{ completedAt: null, reopenedAt: <date> } (reopened, live again) -> NOT allowed", () => {
    expect(canDiscardSession({ completedAt: null, reopenedAt })).toEqual({
      allowed: false,
      reason: "reopened",
    });
  });

  test("both set -> not allowed", () => {
    expect(canDiscardSession({ completedAt: finishedAt, reopenedAt })).toEqual({
      allowed: false,
      reason: "completed",
    });
  });
});
